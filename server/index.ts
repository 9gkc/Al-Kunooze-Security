import express, { type Request, type Response } from "express";
import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dns from "node:dns/promises";
import net from "node:net";
import { randomUUID } from "node:crypto";
import type { ScanFinding, ScanProfile, ScanResult, Severity } from "../shared/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 3000);
const dataDirectory = path.resolve(process.cwd(), ".data");
const scansFile = path.join(dataDirectory, "scans.json");
const maxStoredScans = 50;
const maxResponseBytes = 1_048_576;
const maxTargetLength = 2_048;
const scanRateWindowMs = 5 * 60 * 1_000;
const maxScansPerWindow = 10;
const scanRateLimits = new Map<string, { count: number; resetAt: number }>();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

function clientAddress(req: Request) {
  return req.socket.remoteAddress || "unknown";
}

function exceedsScanRateLimit(req: Request) {
  const now = Date.now();
  const key = clientAddress(req);
  const current = scanRateLimits.get(key);
  if (!current || current.resetAt <= now) {
    scanRateLimits.set(key, { count: 1, resetAt: now + scanRateWindowMs });
    return false;
  }
  current.count += 1;
  return current.count > maxScansPerWindow;
}

function jsonError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

function isPrivateIp(address: string) {
  if (net.isIPv4(address)) {
    const [first, second] = address.split(".").map(Number);
    return (
      first === 10 ||
      first === 127 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 169 && second === 254) ||
      first === 0
    );
  }

  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized === "::"
  );
}

function normalizeTarget(input: unknown) {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new Error("Enter a domain or URL to scan.");
  }

  const raw = input.trim();
  if (raw.length > maxTargetLength) {
    throw new Error("The target URL is too long.");
  }

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(candidate);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS targets are supported.");
  }
  if (url.username || url.password) {
    throw new Error("Targets containing credentials are not accepted.");
  }
  if (url.hostname.length > 253) {
    throw new Error("The target hostname is too long.");
  }
  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("Only standard HTTP and HTTPS ports are supported.");
  }
  if (url.hostname === "localhost" || url.hostname.endsWith(".local") || url.hostname.endsWith(".internal")) {
    throw new Error("Private and local targets are blocked for safety.");
  }
  if (isPrivateIp(url.hostname)) {
    throw new Error("Private network addresses are blocked for safety.");
  }

  url.hash = "";
  return { url, hostname: url.hostname.toLowerCase().replace(/\.$/, "") };
}

async function readStoredScans(): Promise<ScanResult[]> {
  try {
    const raw = await fs.readFile(scansFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScanResult[]) : [];
  } catch {
    return [];
  }
}

async function writeStoredScan(result: ScanResult) {
  const scans = await readStoredScans();
  scans.unshift(result);
  await fs.mkdir(dataDirectory, { recursive: true });
  await fs.writeFile(scansFile, JSON.stringify(scans.slice(0, maxStoredScans), null, 2), "utf8");
}

async function getReverseName(address: string, fallback: string) {
  try {
    const names = await dns.reverse(address);
    return names[0] || fallback;
  } catch {
    return fallback;
  }
}

function addFinding(
  findings: ScanFinding[],
  severity: Severity,
  category: string,
  title: string,
  description: string,
  recommendation: string,
) {
  findings.push({ severity, category, title, description, recommendation });
}

async function consumeResponseBody(response: globalThis.Response) {
  const announcedLength = Number(response.headers.get("content-length") || 0);
  if (announcedLength > maxResponseBytes) {
    await response.body?.cancel();
    throw new Error("The target response is larger than the passive scan limit.");
  }

  if (!response.body) return;
  const reader = response.body.getReader();
  let bytesRead = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > maxResponseBytes) {
        await reader.cancel();
        throw new Error("The target response is larger than the passive scan limit.");
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function runPassiveScan(target: string, profile: ScanProfile): Promise<ScanResult> {
  const { url, hostname } = normalizeTarget(target);
  const startedAt = performance.now();
  const addresses = (await dns.lookup(hostname, { all: true })).map((entry) => entry.address);

  if (addresses.length === 0 || addresses.some(isPrivateIp)) {
    throw new Error("The target resolves to a private or unavailable address and cannot be scanned.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let response: globalThis.Response;
  try {
    response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "Al-Kunooze-Security/1.0 (authorized passive assessment)",
        Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.1",
      },
    });
    await consumeResponseBody(response);
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "The target did not respond within 10 seconds."
      : error instanceof Error && error.message.includes("passive scan limit")
        ? error.message
        : "The target could not be reached from the scanning service.";
    throw new Error(message);
  } finally {
    clearTimeout(timeout);
  }

  const responseTime = Math.max(1, Math.round(performance.now() - startedAt));
  const headers = response.headers;
  const enforcedHttps = url.protocol === "https:" || (response.status >= 300 && response.status < 400 && (headers.get("location") || "").startsWith("https://"));
  const findings: ScanFinding[] = [];
  const strengths: ScanResult["strengths"] = [];
  let score = 100;

  if (!enforcedHttps) {
    score -= 25;
    addFinding(findings, "high", "Transport Security", "HTTPS is not enforced", "The supplied target does not demonstrate an HTTPS endpoint or an HTTPS redirect.", "Serve the application over HTTPS and redirect all HTTP traffic to the canonical secure origin.");
  } else {
    strengths.push({ title: "HTTPS endpoint detected", description: "The target is reachable over encrypted HTTPS transport." });
  }

  const headerChecks = [
    { name: "strict-transport-security", label: "HSTS", severity: "medium" as Severity, penalty: 12, recommendation: "Set Strict-Transport-Security after validating HTTPS coverage." },
    { name: "content-security-policy", label: "Content Security Policy", severity: "medium" as Severity, penalty: 10, recommendation: "Define a restrictive Content-Security-Policy and roll it out with report-only monitoring first." },
    { name: "x-content-type-options", label: "Content-Type protection", severity: "low" as Severity, penalty: 6, recommendation: "Add X-Content-Type-Options: nosniff to responses." },
    { name: "x-frame-options", label: "Clickjacking protection", severity: "low" as Severity, penalty: 6, recommendation: "Set X-Frame-Options or an equivalent frame-ancestors CSP directive." },
    { name: "referrer-policy", label: "Referrer policy", severity: "low" as Severity, penalty: 4, recommendation: "Set a privacy-preserving Referrer-Policy such as strict-origin-when-cross-origin." },
    { name: "permissions-policy", label: "Permissions policy", severity: "info" as Severity, penalty: 2, recommendation: "Declare a least-privilege Permissions-Policy for browser capabilities." },
  ];

  for (const check of headerChecks) {
    if (enforcedHttps && check.name === "strict-transport-security") {
      if (headers.get(check.name)) strengths.push({ title: "HSTS is configured", description: "The response advertises HTTP Strict Transport Security." });
      else {
        score -= check.penalty;
        addFinding(findings, check.severity, "Security Headers", `Missing ${check.label}`, `The response does not include the ${check.name} header.`, check.recommendation);
      }
      continue;
    }

    if (headers.get(check.name)) strengths.push({ title: `${check.label} configured`, description: `The response includes ${check.name}.` });
    else {
      score -= check.penalty;
      addFinding(findings, check.severity, "Security Headers", `Missing ${check.label}`, `The response does not include the ${check.name} header.`, check.recommendation);
    }
  }

  const serverHeader = headers.get("server");
  if (serverHeader) {
    score -= 3;
    addFinding(findings, "info", "Information Disclosure", "Server identity is exposed", `The response includes a Server header (${serverHeader.slice(0, 80)}).`, "Remove or generalize detailed server identification headers where operationally possible.");
  }

  if (response.status >= 500) {
    score -= 10;
    addFinding(findings, "medium", "Availability", "The target returned a server error", `The passive request returned HTTP ${response.status}.`, "Review application and upstream logs for the failing endpoint and monitor availability.");
  }

  const severityOrder: Severity[] = ["critical", "high", "medium", "low", "info"];
  const findingsForProfile = profile === "quick" ? findings.filter((finding) => finding.severity !== "info") : findings;
  const sortedFindings = findingsForProfile.sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity));
  const normalizedScore = Math.max(0, Math.min(100, score));
  const posture = normalizedScore >= 85 ? "Strong Security Posture" : normalizedScore >= 70 ? "Moderately Secured" : normalizedScore >= 50 ? "Needs Improvement" : "Critical Attention Required";
  const reverse = await getReverseName(addresses[0], hostname);
  const nextSteps = sortedFindings.filter((finding) => finding.severity !== "info").slice(0, 5).map((finding) => finding.recommendation);

  if (nextSteps.length === 0) nextSteps.push("Continue monitoring the security headers and repeat the assessment after every material deployment.");

  return {
    id: `AKR-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`,
    target: target.trim(),
    normalizedTarget: url.toString(),
    scannedAt: new Date().toISOString(),
    profile,
    score: normalizedScore,
    posture,
    https: enforcedHttps,
    tls: enforcedHttps ? "HTTPS detected" : "Not verified",
    responseTime,
    ports: [
      { port: 80, label: "HTTP", state: url.protocol === "http:" ? "observed" : "not tested" },
      { port: 443, label: "HTTPS", state: enforcedHttps ? "observed" : "not tested" },
    ],
    findings: sortedFindings,
    strengths,
    nextSteps,
    executiveSummary: `A passive external review of ${hostname} returned HTTP ${response.status} in ${responseTime}ms. The current score is ${normalizedScore}/100, classified as ${posture.toLowerCase()}. This assessment does not exploit vulnerabilities or perform intrusive port scanning.`,
    dns: { addresses, reverse },
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "al-kunooze-security", timestamp: new Date().toISOString() });
});

app.get("/api/scans", async (_req, res) => {
  res.json((await readStoredScans()).map(({ findings, ...summary }) => ({ ...summary, findingCount: findings.length })));
});

app.get("/api/scans/:id", async (req, res) => {
  const scan = (await readStoredScans()).find((item) => item.id === req.params.id);
  return scan ? res.json(scan) : jsonError(res, 404, "Report not found.");
});

app.get("/api/scans/:id/download", async (req, res) => {
  const scan = (await readStoredScans()).find((item) => item.id === req.params.id);
  if (!scan) return jsonError(res, 404, "Report not found.");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${scan.id}.json"`);
  return res.send(JSON.stringify(scan, null, 2));
});

app.post("/api/scans", async (req: Request, res: Response) => {
  if (exceedsScanRateLimit(req)) {
    return jsonError(res, 429, "Too many scans from this address. Please wait a few minutes and try again.");
  }

  if (req.body?.authorizationConfirmed !== true) {
    return jsonError(res, 400, "Confirm that you own the target or have explicit authorization to scan it.");
  }

  try {
    const profile: ScanProfile = ["quick", "deep", "authorized_deep"].includes(req.body?.profile) ? req.body.profile : "deep";
    const result = await runPassiveScan(req.body?.target, profile);
    await writeStoredScan(result);
    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The scan could not be completed.";
    return jsonError(res, 400, message);
  }
});

async function startServer() {
  if (isProduction) {
    const staticPath = path.resolve(__dirname, "public");
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      configFile: path.resolve(process.cwd(), "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      try {
        const template = await fs.readFile(path.resolve(process.cwd(), "client/index.html"), "utf8");
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  }

  createServer(app).listen(port, () => {
    console.log(`Al-Kunooze Security running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start Al-Kunooze Security", error);
  process.exitCode = 1;
});
