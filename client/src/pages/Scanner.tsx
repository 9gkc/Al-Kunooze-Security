import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scan, Globe, Shield, AlertTriangle, CheckCircle, Loader2,
  Target, Network, FileText, Bug, Download, LockKeyhole, RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { ScanProfile, ScanResult, Severity } from "@shared/types";
import { createScan, downloadScanUrl } from "@/lib/api";

const scanStages = [
  { label: "Validating authorization and target...", progress: 8 },
  { label: "Resolving DNS and checking reachability...", progress: 24 },
  { label: "Inspecting HTTPS and response headers...", progress: 52 },
  { label: "Classifying passive security findings...", progress: 78 },
  { label: "Writing your security report...", progress: 94 },
];

const severityColors: Record<Severity, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  medium: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  low: "bg-green-500/20 text-green-300 border-green-500/30",
  info: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

function scoreTone(score: number) {
  return score >= 85 ? "text-emerald-400" : score >= 70 ? "text-yellow-400" : "text-red-400";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function validateTarget(value: string) {
  const raw = value.trim();
  if (!raw) return "Enter a domain or URL to scan.";
  if (raw.length > 2_048) return "The target URL is too long.";

  try {
    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return "Only HTTP and HTTPS targets are supported.";
    if (url.username || url.password) return "Targets containing credentials are not accepted.";
    if (url.port && !["80", "443"].includes(url.port)) return "Only standard HTTP and HTTPS ports are supported.";
    if (!url.hostname || url.hostname.length > 253) return "Enter a valid public hostname.";
  } catch {
    return "Enter a valid domain or URL.";
  }
  return "";
}

export default function Scanner() {
  const [target, setTarget] = useState("");
  const [profile, setProfile] = useState<ScanProfile>("deep");
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");

  const runScan = useCallback(async () => {
    if (!authorizationConfirmed || scanning) return;
    const targetError = validateTarget(target);
    if (targetError) {
      setError(targetError);
      return;
    }

    setScanning(true);
    setError("");
    setProgress(4);
    setStageLabel(scanStages[0].label);
    setResult(null);

    let stage = 0;
    const interval = window.setInterval(() => {
      const current = scanStages[Math.min(stage, scanStages.length - 1)];
      setStageLabel(current.label);
      setProgress((value) => Math.min(current.progress, value + 8));
      stage += 1;
    }, 500);

    try {
      const data = await createScan(target.trim(), profile, authorizationConfirmed);
      setProgress(100);
      setStageLabel("Scan complete");
      setResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The scan could not be completed.");
    } finally {
      window.clearInterval(interval);
      setScanning(false);
    }
  }, [authorizationConfirmed, profile, scanning, target]);

  const findingCounts = useMemo(() => {
    const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    result?.findings.forEach((finding) => { counts[finding.severity] += 1; });
    return counts;
  }, [result]);

  return (
    <div className="min-h-screen">
      <section className="py-12 lg:py-16">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              Defensive Security Scanner
            </span>
            <h1 className="font-display font-bold text-3xl lg:text-5xl tracking-tight mb-4">
              Passive Security <span className="text-gradient-cyan">Assessment</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Inspect an authorized domain’s public DNS, HTTPS, response headers, and availability without exploiting or modifying the target.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <Card className="bg-card/60 border-border backdrop-blur-sm max-w-4xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    placeholder="example.com or https://example.com"
                    className="pl-12 h-12 bg-background/50 border-border text-base"
                    maxLength={2048}
                    autoComplete="url"
                    aria-label="Target domain or URL"
                    aria-describedby="target-help"
                  />
                </div>
                <Select value={profile} onValueChange={(value) => setProfile(value as ScanProfile)}>
                  <SelectTrigger className="w-full lg:w-48 h-12 bg-background/50 border-border" aria-label="Scan profile">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Quick Scan</SelectItem>
                    <SelectItem value="deep">Deep Passive</SelectItem>
                    <SelectItem value="authorized_deep">Authorized Deep</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={runScan} disabled={scanning || !target.trim() || !authorizationConfirmed} size="lg" className="h-12 bg-primary text-background hover:bg-primary/90 font-semibold px-8 shadow-lg shadow-primary/25 min-w-[160px]">
                  {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scan className="w-5 h-5 mr-2" />}
                  {scanning ? "Scanning" : "Run Scan"}
                </Button>
              </div>

              <p id="target-help" className="mt-2 text-xs text-muted-foreground">Use a public domain or URL. Private addresses, credentials, and non-standard ports are blocked.</p>

              <label className="flex items-start gap-3 mt-5 text-sm text-muted-foreground cursor-pointer">
                <Checkbox checked={authorizationConfirmed} onCheckedChange={(checked) => setAuthorizationConfirmed(checked === true)} className="mt-0.5" />
                <span>I confirm that I own this target or have explicit authorization to assess it. This service performs passive checks only.</span>
              </label>

              <AnimatePresence>
                {scanning && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-primary font-medium flex items-center gap-2"><Target className="w-4 h-4" />{stageLabel}</span>
                      <span className="text-sm font-mono text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-background/50" />
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div role="alert" aria-live="assertive" className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
                  <div><p className="font-semibold">Scan unavailable</p><p className="mt-1 text-red-200/80">{error}</p></div>
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-2"><LockKeyhole className="w-3.5 h-3.5" /> No exploit payloads, intrusive port scans, or target modifications are performed.</p>
        </div>
      </section>

      <AnimatePresence>
        {result && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="pb-16">
            <div className="container">
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-8 p-6 bg-card/60 border border-border rounded-xl backdrop-blur-sm gap-5">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2"><Badge variant="outline" className="font-mono text-xs">{result.id}</Badge><span className="text-xs text-muted-foreground">{formatDate(result.scannedAt)}</span></div>
                  <h2 className="font-display font-bold text-2xl mb-1">Security Assessment Result</h2>
                  <p className="text-muted-foreground text-sm">Target: <span className="font-mono text-foreground">{result.normalizedTarget}</span></p>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-center"><p className={`font-display font-bold text-4xl ${scoreTone(result.score)}`}>{result.score}</p><p className="text-xs text-muted-foreground">/100</p></div>
                  <Badge variant="outline" className="border-primary/30 text-primary">{result.posture}</Badge>
                  <Button variant="outline" className="border-border" onClick={() => { setResult(null); setProgress(0); setStageLabel(""); setError(""); }}><RefreshCcw className="w-4 h-4 mr-2" />New Scan</Button>
                  <a href={downloadScanUrl(result.id)} download><Button variant="outline" className="border-border"><Download className="w-4 h-4 mr-2" />Export JSON</Button></a>
                </div>
              </div>

              <Tabs defaultValue="findings" className="space-y-6">
                <TabsList className="bg-card/60 border border-border flex-wrap h-auto">
                  <TabsTrigger value="findings" className="data-[state=active]:bg-primary/20"><Bug className="w-4 h-4 mr-2" />Findings ({result.findings.length})</TabsTrigger>
                  <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20"><FileText className="w-4 h-4 mr-2" />Overview</TabsTrigger>
                  <TabsTrigger value="network" className="data-[state=active]:bg-primary/20"><Network className="w-4 h-4 mr-2" />Network</TabsTrigger>
                  <TabsTrigger value="remediation" className="data-[state=active]:bg-primary/20"><CheckCircle className="w-4 h-4 mr-2" />Remediation</TabsTrigger>
                </TabsList>

                <TabsContent value="findings" className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-6">{(Object.keys(findingCounts) as Severity[]).map((severity) => <Badge key={severity} className={severityColors[severity]}>{severity}: {findingCounts[severity]}</Badge>)}</div>
                  {result.findings.length === 0 && <Card className="bg-card/40 border-emerald-500/30"><CardContent className="p-8 text-center"><CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" /><h3 className="font-display font-semibold">No findings in this profile</h3><p className="text-sm text-muted-foreground mt-2">Keep monitoring the target and repeat the assessment after infrastructure changes.</p></CardContent></Card>}
                  {result.findings.map((finding, index) => (
                    <motion.div key={`${finding.title}-${index}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                      <Card className="bg-card/40 border-border"><CardContent className="p-5"><div className="flex items-start justify-between gap-4 mb-2"><div className="flex items-center gap-3"><AlertTriangle className={`w-5 h-5 ${finding.severity === "critical" ? "text-red-400" : finding.severity === "high" ? "text-orange-400" : finding.severity === "medium" ? "text-blue-400" : finding.severity === "low" ? "text-green-400" : "text-slate-400"}`} /><h3 className="font-display font-semibold">{finding.title}</h3></div><Badge className={severityColors[finding.severity]}>{finding.severity}</Badge></div><p className="text-sm text-muted-foreground mb-2">{finding.description}</p><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="text-xs">{finding.category}</Badge><span className="text-xs text-primary">Recommendation: {finding.recommendation}</span></div></CardContent></Card>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="overview"><Card className="bg-card/40 border-border"><CardContent className="p-6 space-y-6"><div><h3 className="font-display font-semibold mb-3">Executive Summary</h3><p className="text-muted-foreground text-sm leading-relaxed">{result.executiveSummary}</p></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-4"><div className="p-4 rounded-xl bg-background/50 border border-border"><p className="text-xs text-muted-foreground mb-1">HTTPS</p><p className="font-semibold text-emerald-400">{result.https ? "Detected" : "Not verified"}</p></div><div className="p-4 rounded-xl bg-background/50 border border-border"><p className="text-xs text-muted-foreground mb-1">Transport</p><p className="font-semibold">{result.tls}</p></div><div className="p-4 rounded-xl bg-background/50 border border-border"><p className="text-xs text-muted-foreground mb-1">Response Time</p><p className="font-semibold">{result.responseTime}ms</p></div><div className="p-4 rounded-xl bg-background/50 border border-border"><p className="text-xs text-muted-foreground mb-1">HTTP Status</p><p className="font-semibold">Available</p></div></div><div><h3 className="font-display font-semibold mb-3">Strengths</h3><div className="grid gap-3">{result.strengths.map((strength) => <div key={strength.title} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /><div><p className="text-sm font-medium">{strength.title}</p><p className="text-xs text-muted-foreground mt-1">{strength.description}</p></div></div>)}</div></div></CardContent></Card></TabsContent>

                <TabsContent value="network"><div className="grid lg:grid-cols-2 gap-6"><Card className="bg-card/40 border-border"><CardContent className="p-6"><h3 className="font-display font-semibold mb-4 flex items-center gap-2"><Network className="w-5 h-5 text-primary" />DNS Resolution</h3><div className="space-y-3">{result.dns.addresses.map((address) => <div key={address} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"><span className="font-mono text-sm">{address}</span><Badge variant="outline" className="text-xs">Resolved</Badge></div>)}<div className="pt-3 border-t border-border"><p className="text-xs text-muted-foreground">Reverse DNS</p><p className="font-mono text-sm mt-1">{result.dns.reverse}</p></div></div></CardContent></Card><Card className="bg-card/40 border-border"><CardContent className="p-6"><h3 className="font-display font-semibold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-primary" />Observed Services</h3><div className="space-y-3">{result.ports.map((port) => <div key={port.port} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"><div><span className="font-mono text-sm">:{port.port}</span><span className="text-sm text-muted-foreground ml-3">{port.label}</span></div><Badge className={port.state === "observed" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-slate-500/20 text-slate-300 border-slate-500/30"}>{port.state}</Badge></div>)}</div><p className="text-xs text-muted-foreground mt-4">Service observations are derived from the requested URL only; no intrusive port sweep is performed.</p></CardContent></Card></div></TabsContent>

                <TabsContent value="remediation"><Card className="bg-card/40 border-border"><CardContent className="p-6"><h3 className="font-display font-semibold mb-4 flex items-center gap-2"><RefreshCcw className="w-5 h-5 text-primary" />Recommended next steps</h3><div className="space-y-3">{result.nextSteps.map((step, index) => <div key={step} className="flex items-start gap-3 p-4 rounded-lg bg-background/50 border border-border"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{index + 1}</span><p className="text-sm text-foreground/85">{step}</p></div>)}</div></CardContent></Card></TabsContent>
              </Tabs>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
