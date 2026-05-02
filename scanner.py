import json
import re
import socket
import ssl
import subprocess
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen

from advanced_scanner import detect_dynamic_vulnerabilities, detect_form_vulnerabilities, detect_api_vulnerabilities
from deep_scanner import run_deep_scan


DEFAULT_TIMEOUT = 8
FETCH_RETRIES = 2
USER_AGENT = "VulnScannerPro/2.0 (Academic Defensive Scanner)"
CRAWL_LIMITS = {"quick": 3, "deep": 10, "authorized_deep": 20}
MAX_PARALLEL_REQUESTS = 8
COMMON_WEB_PORTS = [
    (80, "HTTP"),
    (443, "HTTPS"),
    (8080, "HTTP-Alt"),
    (8443, "HTTPS-Alt"),
    (8000, "App"),
]
KNOWN_PATHS = [
    ("/robots.txt", "Robots"),
    ("/sitemap.xml", "Sitemap"),
    ("/security.txt", "Security TXT (root)"),
    ("/.well-known/security.txt", "Security TXT"),
    ("/ads.txt", "Ads"),
    ("/crossdomain.xml", "Crossdomain"),
    ("/favicon.ico", "Favicon"),
]
SENSITIVE_PATH_CANDIDATES = [
    "/admin",
    "/administrator",
    "/admin/login",
    "/login",
    "/signin",
    "/dashboard",
    "/panel",
    "/cpanel",
    "/user/login",
    "/account/login",
    "/portal",
    "/student",
    "/staff",
    "/api",
    "/api/docs",
    "/swagger",
    "/swagger/index.html",
    "/graphql",
    "/backup",
    "/backup.zip",
    "/db.sql",
    "/.env",
    "/config",
    "/uploads",
]
SECURITY_HEADERS = {
    "strict-transport-security": {
        "name": "Strict-Transport-Security",
        "severity": "high",
        "why": "يحمي من هجمات downgrade ويجبر المتصفح على استخدام HTTPS.",
    },
    "content-security-policy": {
        "name": "Content-Security-Policy",
        "severity": "high",
        "why": "يحد من حقن الأكواد والموارد غير الموثوقة داخل الصفحة.",
    },
    "x-frame-options": {
        "name": "X-Frame-Options",
        "severity": "medium",
        "why": "يقلل خطر Clickjacking عبر منع تضمين الصفحة داخل iframe.",
    },
    "x-content-type-options": {
        "name": "X-Content-Type-Options",
        "severity": "medium",
        "why": "يمنع MIME sniffing ويقلل فرص تنفيذ محتوى بغير نوعه الصحيح.",
    },
    "referrer-policy": {
        "name": "Referrer-Policy",
        "severity": "low",
        "why": "يمنع تسرب معلومات الروابط المرجعية إلى أطراف أخرى.",
    },
    "permissions-policy": {
        "name": "Permissions-Policy",
        "severity": "low",
        "why": "يقيد صلاحيات حساسة مثل الكاميرا والميكروفون والموقع.",
    },
}


@dataclass
class FetchResult:
    url: str
    status: int | None
    headers: dict
    body: str
    error: str | None = None
    elapsed_ms: int | None = None
    method: str = "GET"


def normalize_target(target: str) -> str:
    target = target.strip()
    if not target:
        raise ValueError("الهدف فارغ.")
    if "://" not in target:
        target = f"https://{target}"

    parsed = urlparse(target)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("تدعم المنصة بروتوكول HTTP و HTTPS فقط.")
    if not parsed.hostname:
        raise ValueError("تعذر تحديد اسم النطاق أو عنوان الموقع.")
    return target


def run_scan(target: str, results_dir: Path, profile: str = "deep") -> dict:
    normalized = normalize_target(target)
    parsed = urlparse(normalized)
    hostname = parsed.hostname or ""
    profile = profile if profile in CRAWL_LIMITS else "deep"
    dns_summary = resolve_dns(hostname)

    with ThreadPoolExecutor(max_workers=4) as executor:
        future_https = executor.submit(fetch_url, normalized)
        future_http = executor.submit(fetch_url, f"http://{hostname}")
        future_options = executor.submit(fetch_url, normalized, "OPTIONS")
        future_tls = executor.submit(inspect_tls, hostname) if parsed.scheme == "https" else None
        https_result = future_https.result()
        http_result = future_http.result()
        options_result = future_options.result()
        tls_summary = future_tls.result() if future_tls else None

    active_result = choose_primary_result(https_result, http_result)
    headers = lower_headers(active_result.headers)
    page_profile = profile_page(active_result.body, headers)

    with ThreadPoolExecutor(max_workers=4) as executor:
        future_paths = executor.submit(scan_known_paths, normalized)
        future_ports = executor.submit(scan_common_ports, hostname)
        future_crawl = executor.submit(crawl_internal_pages, normalized, CRAWL_LIMITS[profile])
        future_external = executor.submit(run_external_tools, normalized, profile)
        path_results = future_paths.result()
        port_results = future_ports.result()
        crawl_results = future_crawl.result()
        external_tool_results = future_external.result()

    deep_path_results = discover_deep_paths(normalized, path_results, crawl_results, profile)

    findings = build_findings(
        parsed=parsed,
        https_result=https_result,
        http_result=http_result,
        tls_summary=tls_summary,
        active_result=active_result,
        headers=headers,
        path_results=path_results,
        deep_path_results=deep_path_results,
        port_results=port_results,
        options_result=options_result,
        page_profile=page_profile,
        crawl_results=crawl_results,
        external_tool_results=external_tool_results,
    )
    summary = build_summary(findings)
    strengths = build_strengths(
        parsed=parsed,
        https_result=https_result,
        http_result=http_result,
        tls_summary=tls_summary,
        active_result=active_result,
        headers=headers,
        options_result=options_result,
        path_results=path_results,
        page_profile=page_profile,
    )
    narrative = build_narrative(
        summary=summary,
        findings=findings,
        strengths=strengths,
        https_result=https_result,
        http_result=http_result,
        tls_summary=tls_summary,
    )

    report = {
        "report_id": uuid.uuid4().hex[:12],
        "scanned_at": datetime.now(UTC).isoformat(),
        "target": normalized,
        "hostname": hostname,
        "ip_address": dns_summary["primary_ip"],
        "scope_notice": (
            "هذا الفحص دفاعي وأكاديمي ومخصص فقط للمواقع التي تملكها أو لديك تصريح صريح "
            "لفحصها."
        ),
        "summary": summary,
        "scan_profile": profile,
        "narrative": narrative,
        "surface": {
            "https": serialize_fetch(https_result),
            "http": serialize_fetch(http_result),
            "tls": tls_summary,
            "options": serialize_fetch(options_result),
        },
        "recon": {
            "dns": dns_summary,
            "ports": port_results,
            "known_paths": path_results,
            "deep_paths": deep_path_results,
            "page_profile": page_profile,
            "crawl": crawl_results,
            "external_tools": external_tool_results,
        },
        "strengths": strengths,
        "findings": findings,
        "next_steps": recommend_next_steps(findings, tls_summary, headers, path_results),
    }

    results_dir.mkdir(exist_ok=True)
    report_path = results_dir / f"{report['report_id']}.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


def resolve_dns(hostname: str) -> dict:
    summary = {"primary_ip": None, "addresses": [], "reverse_dns": None, "error": None}
    try:
        infos = socket.getaddrinfo(hostname, None, proto=socket.IPPROTO_TCP)
        addresses = sorted({item[4][0] for item in infos if item[4]})
        summary["addresses"] = addresses
        summary["primary_ip"] = addresses[0] if addresses else None
        if summary["primary_ip"]:
            try:
                summary["reverse_dns"] = socket.gethostbyaddr(summary["primary_ip"])[0]
            except Exception:
                summary["reverse_dns"] = None
    except socket.gaierror as exc:
        summary["error"] = str(exc)
    return summary


def fetch_url(url: str, method: str = "GET") -> FetchResult:
    last_result = None
    for _ in range(FETCH_RETRIES):
        request = Request(
            url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
            method=method,
        )
        started = time.perf_counter()
        try:
            with urlopen(request, timeout=DEFAULT_TIMEOUT) as response:
                body = ""
                if method != "HEAD":
                    body = response.read(400_000).decode("utf-8", errors="replace")
                elapsed_ms = int((time.perf_counter() - started) * 1000)
                return FetchResult(
                    url=response.geturl(),
                    status=response.status,
                    headers=dict(response.headers.items()),
                    body=body,
                    elapsed_ms=elapsed_ms,
                    method=method,
                )
        except HTTPError as exc:
            body = ""
            if method != "HEAD":
                body = exc.read().decode("utf-8", errors="replace")
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            return FetchResult(
                url=url,
                status=exc.code,
                headers=dict(exc.headers.items()),
                body=body,
                error=f"HTTP {exc.code}",
                elapsed_ms=elapsed_ms,
                method=method,
            )
        except URLError as exc:
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            last_result = FetchResult(
                url=url,
                status=None,
                headers={},
                body="",
                error=str(exc.reason),
                elapsed_ms=elapsed_ms,
                method=method,
            )
        except TimeoutError:
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            last_result = FetchResult(
                url=url,
                status=None,
                headers={},
                body="",
                error="Request timed out",
                elapsed_ms=elapsed_ms,
                method=method,
            )
        except Exception as exc:  # pragma: no cover
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            last_result = FetchResult(
                url=url,
                status=None,
                headers={},
                body="",
                error=str(exc),
                elapsed_ms=elapsed_ms,
                method=method,
            )

        if not _is_retryable_error(last_result.error):
            break

    return last_result or FetchResult(url=url, status=None, headers={}, body="", error="Unknown error", method=method)


def inspect_tls(hostname: str) -> dict | None:
    context = ssl.create_default_context()
    try:
        with socket.create_connection((hostname, 443), timeout=DEFAULT_TIMEOUT) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as secure_sock:
                certificate = secure_sock.getpeercert()
                cipher = secure_sock.cipher()
                not_after = certificate.get("notAfter")
                expires_at = (
                    datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=UTC)
                    if not_after
                    else None
                )
                days_left = (expires_at - datetime.now(UTC)).days if expires_at else None
                return {
                    "subject": dict(x[0] for x in certificate.get("subject", [])),
                    "issuer": dict(x[0] for x in certificate.get("issuer", [])),
                    "version": secure_sock.version(),
                    "cipher": cipher[0] if cipher else None,
                    "expires_at": expires_at.isoformat() if expires_at else None,
                    "days_left": days_left,
                    "subject_alt_names": [value for kind, value in certificate.get("subjectAltName", [])],
                }
    except Exception as exc:
        return {"error": str(exc)}


def choose_primary_result(https_result: FetchResult, http_result: FetchResult) -> FetchResult:
    if https_result.status is not None:
        return https_result
    if http_result.status is not None:
        return http_result
    return https_result


def lower_headers(headers: dict) -> dict:
    return {key.lower(): value for key, value in headers.items()}


def scan_common_ports(hostname: str) -> list[dict]:
    with ThreadPoolExecutor(max_workers=min(len(COMMON_WEB_PORTS), 5)) as executor:
        futures = [executor.submit(scan_single_port, hostname, port, label) for port, label in COMMON_WEB_PORTS]
        return [future.result() for future in futures]


def scan_single_port(hostname: str, port: int, label: str) -> dict:
    start = time.perf_counter()
    try:
        with socket.create_connection((hostname, port), timeout=2):
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            return {"port": port, "label": label, "state": "open", "elapsed_ms": elapsed_ms}
    except Exception:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return {"port": port, "label": label, "state": "closed_or_filtered", "elapsed_ms": elapsed_ms}


def scan_known_paths(base_url: str) -> list[dict]:
    with ThreadPoolExecutor(max_workers=min(len(KNOWN_PATHS), MAX_PARALLEL_REQUESTS)) as executor:
        futures = [executor.submit(scan_single_path, base_url, path, label, "GET") for path, label in KNOWN_PATHS]
        return [future.result() for future in futures]


def scan_single_path(base_url: str, path: str, label: str, method: str = "GET") -> dict:
    url = urljoin(base_url, path)
    fetched = fetch_url(url, method=method)
    return {
        "label": label,
        "path": path,
        "url": url,
        "status": fetched.status,
        "error": fetched.error,
        "elapsed_ms": fetched.elapsed_ms,
        "content_type": fetched.headers.get("Content-Type"),
        "body_excerpt": fetched.body[:160],
    }


def discover_deep_paths(base_url: str, path_results: list[dict], crawl_results: dict, profile: str) -> list[dict]:
    if profile == "quick":
        return []

    candidates = set(SENSITIVE_PATH_CANDIDATES)
    candidates.update(extract_candidate_paths_from_known_results(path_results))
    candidates.update(extract_candidate_paths_from_crawl(crawl_results))
    candidates.update(extract_candidate_paths_from_javascript(crawl_results))

    max_candidates = 12 if profile == "deep" else 24
    selected = sorted(candidates)[:max_candidates]
    discovered = []
    with ThreadPoolExecutor(max_workers=min(len(selected) or 1, MAX_PARALLEL_REQUESTS)) as executor:
        future_map = {
            executor.submit(fetch_url, urljoin(base_url, path), "HEAD"): path
            for path in selected
        }
        for future in as_completed(future_map):
            path = future_map[future]
            fetched = future.result()
            if fetched.status in {200, 301, 302, 401, 403}:
                discovered.append(
                    {
                        "path": path,
                        "url": urljoin(base_url, path),
                        "status": fetched.status,
                        "error": fetched.error,
                        "elapsed_ms": fetched.elapsed_ms,
                    }
                )
    return sorted(discovered, key=lambda item: (item["status"] != 200, item["path"]))


def extract_candidate_paths_from_known_results(path_results: list[dict]) -> set[str]:
    candidates = set()
    robots = find_path_result(path_results, "/robots.txt")
    sitemap = find_path_result(path_results, "/sitemap.xml")
    for item in [robots, sitemap]:
        if not item or not item.get("body_excerpt"):
            continue
        body = item["body_excerpt"]
        for match in re.findall(r"/[A-Za-z0-9_\-./]+", body):
            if len(match) < 80:
                candidates.add(match)
    return candidates


def extract_candidate_paths_from_crawl(crawl_results: dict) -> set[str]:
    candidates = set()
    for page in crawl_results.get("pages", []):
        parsed = urlparse(page.get("url") or "")
        if parsed.path and parsed.path != "/":
            candidates.add(parsed.path)
    for js in crawl_results.get("javascript_files", []):
        parsed = urlparse(js)
        if parsed.path:
            candidates.add(parsed.path)
    return candidates


def extract_candidate_paths_from_javascript(crawl_results: dict) -> set[str]:
    candidates = set()
    for item in crawl_results.get("javascript_endpoints", []):
        if item.startswith("/"):
            candidates.add(item)
    return candidates


def crawl_internal_pages(base_url: str, max_pages: int = 10) -> dict:
    parsed_base = urlparse(base_url)
    origin = f"{parsed_base.scheme}://{parsed_base.netloc}"
    queue = [base_url]
    visited = set()
    pages = []
    js_files = set()
    js_endpoints = set()
    emails = set()
    comments = []

    while queue and len(visited) < max_pages:
        current = normalize_crawl_url(queue.pop(0), origin)
        if not current or current in visited:
            continue
        visited.add(current)
        fetched = fetch_url(current)
        if fetched.status != 200 or not fetched.body:
            pages.append({"url": current, "status": fetched.status, "error": fetched.error, "links": 0})
            continue

        links = extract_links(fetched.body, origin)
        scripts = extract_script_sources(fetched.body, origin)
        found_emails = extract_emails(fetched.body)
        found_comments = extract_html_comments(fetched.body)

        js_files.update(scripts)
        emails.update(found_emails)
        comments.extend(found_comments[:5])
        js_endpoints.update(extract_inline_endpoints(fetched.body))

        for link in links:
            if link.startswith(origin) and link not in visited and link not in queue and len(queue) < max_pages * 3:
                queue.append(link)

        if scripts:
            for script_info in fetch_javascript_sources(scripts):
                js_endpoints.update(script_info["endpoints"])
                comments.extend(script_info["comments"][:2])

        pages.append(
            {
                "url": current,
                "status": fetched.status,
                "title": extract_between(fetched.body, "<title>", "</title>"),
                "links": len(links),
                "forms": fetched.body.lower().count("<form"),
                "scripts": len(scripts),
            }
        )

    return {
        "pages_visited": len(visited),
        "pages": pages,
        "javascript_files": sorted(js_files)[:25],
        "javascript_endpoints": sorted(js_endpoints)[:40],
        "emails": sorted(emails)[:20],
        "html_comments": comments[:10],
    }


def normalize_crawl_url(url: str, origin: str) -> str | None:
    if not url:
        return None
    absolute = urljoin(origin, url)
    parsed = urlparse(absolute)
    if parsed.scheme not in {"http", "https"}:
        return None
    cleaned = parsed._replace(fragment="")
    return urlunparse(cleaned)


def extract_links(body: str, origin: str) -> list[str]:
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', body, flags=re.IGNORECASE)
    return [normalize_crawl_url(item, origin) for item in hrefs if normalize_crawl_url(item, origin)]


def extract_script_sources(body: str, origin: str) -> list[str]:
    sources = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', body, flags=re.IGNORECASE)
    return [normalize_crawl_url(item, origin) for item in sources if normalize_crawl_url(item, origin)]


def extract_emails(body: str) -> list[str]:
    return list({item for item in re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', body) if len(item) < 120})


def extract_html_comments(body: str) -> list[str]:
    comments = re.findall(r'<!--(.*?)-->', body, flags=re.DOTALL)
    cleaned = []
    for item in comments:
        compact = " ".join(item.strip().split())
        if compact and len(compact) < 220:
            cleaned.append(compact)
    return cleaned


def extract_inline_endpoints(body: str) -> set[str]:
    return {
        item
        for item in re.findall(r'["\'](\/[A-Za-z0-9_\-./?=&]+)["\']', body)
        if len(item) < 120 and not item.endswith((".png", ".jpg", ".jpeg", ".svg", ".css", ".woff", ".woff2"))
    }


def fetch_javascript_sources(sources: list[str]) -> list[dict]:
    limited_sources = sources[:8]
    results = []
    with ThreadPoolExecutor(max_workers=min(len(limited_sources) or 1, 4)) as executor:
        futures = [executor.submit(fetch_url, src) for src in limited_sources]
        for src, future in zip(limited_sources, futures):
            fetched = future.result()
            body = fetched.body if fetched.status == 200 else ""
            endpoints = extract_inline_endpoints(body)
            comments = extract_html_comments(body) if body else []
            results.append({"url": src, "endpoints": sorted(endpoints)[:20], "comments": comments[:4]})
    return results


def run_external_tools(target: str, profile: str) -> dict:
    result = {
        "nuclei": {"available": False, "status": "skipped", "findings": [], "error": None},
        "zap": {"available": False, "status": "not_configured", "error": None},
    }
    if profile != "authorized_deep":
        result["nuclei"]["error"] = "يعمل فقط في وضع authorized_deep."
        return result

    images = docker_images()
    result["nuclei"]["available"] = "projectdiscovery/nuclei:latest" in images
    result["zap"]["available"] = any("zap" in item.lower() for item in images)

    if result["nuclei"]["available"]:
        result["nuclei"] = run_nuclei_scan(target)
    else:
        result["nuclei"]["error"] = "صورة nuclei غير متاحة محليًا."

    if not result["zap"]["available"]:
        result["zap"]["error"] = "صورة ZAP غير متاحة محليًا بعد."

    return result


def docker_images() -> set[str]:
    try:
        completed = subprocess.run(
            ["docker", "images", "--format", "{{.Repository}}:{{.Tag}}"],
            capture_output=True,
            text=True,
            timeout=15,
            check=False,
        )
        if completed.returncode != 0:
            return set()
        return {line.strip() for line in completed.stdout.splitlines() if line.strip()}
    except Exception:
        return set()


def run_nuclei_scan(target: str) -> dict:
    command = [
        "docker",
        "run",
        "--rm",
        "projectdiscovery/nuclei:latest",
        "-target",
        target,
        "-as",
        "-duc",
        "-silent",
        "-jsonl",
    ]
    try:
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=120,
            check=False,
        )
        if completed.returncode != 0:
            return {
                "available": True,
                "status": "error",
                "findings": [],
                "error": (completed.stderr or completed.stdout or "تعذر تنفيذ nuclei.").strip()[:500],
            }
        findings = []
        for line in completed.stdout.splitlines():
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue
            findings.append(
                {
                    "template": item.get("template-id"),
                    "name": item.get("info", {}).get("name"),
                    "severity": item.get("info", {}).get("severity"),
                    "matched": item.get("matched-at"),
                }
            )
        return {"available": True, "status": "completed", "findings": findings[:25], "error": None}
    except subprocess.TimeoutExpired:
        return {"available": True, "status": "timeout", "findings": [], "error": "انتهت مهلة nuclei قبل اكتمال الفحص."}
    except Exception as exc:
        return {"available": True, "status": "error", "findings": [], "error": str(exc)}


def profile_page(body: str, headers: dict) -> dict:
    body_lower = body.lower()
    title = extract_between(body, "<title>", "</title>")
    generator = extract_meta_content(body_lower, body, "generator")
    csrf_present = "csrf-token" in body_lower or "csrfmiddlewaretoken" in body_lower
    external_scripts = body_lower.count("<script")
    forms_count = body_lower.count("<form")
    login_keywords = any(word in body_lower for word in ["login", "signin", "password", "تسجيل الدخول", "كلمة المرور"])
    framework_hints = []
    for hint, label in [
        ("wp-content", "WordPress"),
        ("laravel", "Laravel"),
        ("__next", "Next.js"),
        ("react", "React"),
        ("vue", "Vue"),
        ("bootstrap", "Bootstrap"),
    ]:
        if hint in body_lower or hint in str(headers).lower():
            framework_hints.append(label)
    return {
        "title": title,
        "generator": generator,
        "csrf_meta_present": csrf_present,
        "forms_count": forms_count,
        "script_tags": external_scripts,
        "login_surface_detected": login_keywords,
        "framework_hints": sorted(set(framework_hints)),
    }


def extract_between(body: str, start_marker: str, end_marker: str) -> str | None:
    lower = body.lower()
    start = lower.find(start_marker)
    if start == -1:
        return None
    start += len(start_marker)
    end = lower.find(end_marker, start)
    if end == -1:
        return None
    return body[start:end].strip()


def extract_meta_content(body_lower: str, body_original: str, meta_name: str) -> str | None:
    token = f'name="{meta_name}"'
    index = body_lower.find(token)
    if index == -1:
        return None
    content_index = body_lower.find('content="', index)
    if content_index == -1:
        return None
    content_index += len('content="')
    end = body_lower.find('"', content_index)
    if end == -1:
        return None
    return body_original[content_index:end].strip()


def build_findings(
    *,
    parsed,
    https_result: FetchResult,
    http_result: FetchResult,
    tls_summary: dict | None,
    active_result: FetchResult,
    headers: dict,
    path_results: list[dict],
    deep_path_results: list[dict],
    port_results: list[dict],
    options_result: FetchResult,
    page_profile: dict,
    crawl_results: dict,
    external_tool_results: dict,
) -> list[dict]:
    findings = []
    
    # الفحص العميق الشامل
    deep_findings = run_deep_scan(active_result.body, headers)
    for df in deep_findings:
        findings.append(finding(
            df.get('severity'),
            df.get('title'),
            df.get('payload'),
            df.get('type'),
            impact=df.get('impact')
        ))
    
    # كشف الثغرات الديناميكية
    dynamic_findings = detect_dynamic_vulnerabilities(active_result.body, headers, active_result.url)
    findings.extend(dynamic_findings)
    
    # كشف ثغرات النماذج
    form_findings = detect_form_vulnerabilities(active_result.body, active_result.url)
    findings.extend(form_findings)
    
    # كشف ثغرات APIs
    api_findings = detect_api_vulnerabilities(active_result.body, active_result.url)
    findings.extend(api_findings)
    
    tls_ok = bool(tls_summary and not tls_summary.get("error"))
    redirected_to_https = bool(http_result.status is not None and http_result.url.startswith("https://"))

    if https_result.status is None:
        if tls_ok or redirected_to_https:
            findings.append(
                finding(
                    "medium",
                    "تعذر جلب الصفحة عبر HTTPS رغم وجود مؤشرات على التشفير",
                    "يوجد Redirect إلى HTTPS أو مؤشرات TLS، لكن تحميل الصفحة عبر HTTPS لم يكتمل. هذا أقرب إلى مشكلة أداء أو توافق أو مهلة اتصال.",
                    "availability",
                    impact="قد يفقد الفاحص أو المستخدم القدرة على تقييم الصفحة أو تحميلها بثبات، وقد تؤثر هذه الحالة على الاعتمادية وثقة المستخدم.",
                    risk_story="المهاجم لا يستفيد مباشرة من هذا وحده، لكنه قد يستغل ضعف الاعتمادية أو بطء الاستجابة لإخفاء سلوك خبيث أو تشتيت فرق الرصد أثناء الحوادث.",
                    remediation="مراجعة إعدادات الخادم والـ reverse proxy وWAF، وقياس زمن TLS handshake والاستجابة من عدة شبكات للتأكد من سبب البطء أو المهلة.",
                )
            )
        else:
            findings.append(
                finding(
                    "critical",
                    "تعذر الوصول إلى الموقع عبر HTTPS",
                    "لم يتمكن النظام من جلب الصفحة الرئيسية عبر HTTPS، ما يمنع تقييم الوضع الأمني بصورة كاملة.",
                    "availability",
                    impact="تعطل الوصول المشفر يعني فقدان طبقة الحماية الأساسية للمستخدمين أو على الأقل تعذر التحقق منها.",
                    risk_story="أي غياب فعلي للقناة المشفرة يرفع خطر اعتراض الاتصال أو التلاعب به إذا توفرت نسخة غير مشفرة أو مسار شبكي غير موثوق.",
                    remediation="التحقق فورًا من الشهادة، إعدادات المنفذ 443، الـ reverse proxy، وسلاسل التوجيه حتى يعمل HTTPS بثبات.",
                )
            )

    if parsed.scheme == "https" and http_result.status is not None and not redirected_to_https:
        findings.append(
            finding(
                "high",
                "HTTP لا يجبر المستخدم على HTTPS",
                "النسخة غير المشفرة من الموقع لا تعيد التوجيه إلى HTTPS بشكل واضح، ما يرفع خطر downgrade واعتراض الجلسات.",
                "transport",
                impact="يمكن للمستخدم الوصول إلى نسخة أقل أمانًا من الموقع إذا دخل عبر HTTP أو من خلال رابط قديم أو وسيط شبكي.",
                risk_story="هذا يفتح مساحة لهجمات downgrade أو اعتراض الجلسات في البيئات غير الموثوقة إذا لم يتم فرض HTTPS بشكل صارم.",
                remediation="فرض redirect دائم من HTTP إلى HTTPS وتفعيل HSTS بعد التأكد من سلامة إعدادات الشهادة.",
            )
        )

    if active_result.elapsed_ms and active_result.elapsed_ms > 3000:
        findings.append(
            finding(
                "low",
                "زمن الاستجابة أعلى من المتوقع",
                f"الاستجابة الأساسية استغرقت تقريبًا {active_result.elapsed_ms}ms، ويستحسن مراجعة الأداء والشبكة أو WAF.",
                "performance",
                impact="البطء يضر تجربة المستخدم وقد يعيق المراقبة والفحص ويزيد احتمالية انتهاء المهلات في الأنظمة الوسيطة.",
                risk_story="الأداء الضعيف لا يعد اختراقًا بذاته، لكنه قد يسهل على المهاجمين إخفاء محاولات ضارة داخل ضوضاء الأداء أو استنزاف الموارد بشكل أسرع.",
                remediation="تحليل أزمنة التطبيق وقاعدة البيانات والـ CDN والـ WAF وسجلات الخادم لتحديد سبب البطء.",
            )
        )

    for header_key, meta in SECURITY_HEADERS.items():
        if header_key not in headers:
            findings.append(
                finding(
                    meta["severity"],
                    f"غياب الترويسة الأمنية {meta['name']}",
                    meta["why"],
                    "headers",
                    impact=header_impact(meta["name"]),
                    risk_story=header_risk_story(meta["name"]),
                    remediation=header_remediation(meta["name"]),
                )
            )

    server_header = headers.get("server", "")
    if server_header:
        findings.append(
            finding(
                "low",
                "الخادم يكشف معلومات تقنية",
                f"ترويسة Server تعرض القيمة `{server_header}`، ويفضل تقليل البصمة التقنية الظاهرة للعامة.",
                "fingerprint",
                impact="كشف التقنية لا يكسر الحماية وحده، لكنه يسهّل على المهاجمين تضييق مجال البحث عن الإعدادات أو الثغرات المناسبة.",
                risk_story="كل معلومة عن نوع الخادم أو الإطار تساعد المهاجم على بناء صورة أوضح عن البيئة المستهدفة.",
                remediation="إخفاء أو تقليل معلومات البصمة التقنية في الترويسات العامة متى كان ذلك ممكنًا.",
            )
        )

    powered_by = headers.get("x-powered-by")
    if powered_by:
        findings.append(
            finding(
                "low",
                "التطبيق يكشف تقنية الخلفية",
                f"تم رصد الترويسة `X-Powered-By: {powered_by}`، ويستحسن إخفاؤها في البيئة الإنتاجية.",
                "fingerprint",
                impact="تحديد منصة التطوير أو لغة التنفيذ يساعد في تضييق مساحة البحث عن الأخطاء المعروفة أو أنماط الاستغلال الشائعة.",
                risk_story="المهاجم يستفيد من هذه المعلومات في تصنيف الهدف وفهم نوع التحديثات أو الثغرات التي قد يبحث عنها لاحقًا.",
                remediation="تعطيل أو إخفاء ترويسات البصمة مثل X-Powered-By في إعدادات الخادم أو التطبيق.",
            )
        )

    set_cookie = active_result.headers.get("Set-Cookie", "")
    cookie_lower = set_cookie.lower()
    if set_cookie and ("secure" not in cookie_lower or "httponly" not in cookie_lower):
        findings.append(
            finding(
                "medium",
                "إعدادات ملفات الارتباط تحتاج تشديدًا",
                "تم رصد Set-Cookie بدون السمات Secure و HttpOnly معًا في الاستجابة الأولى.",
                "cookies",
                impact="الجلسات تصبح أضعف أمام التسريب أو سوء التعامل من المتصفح إذا غابت سمات الحماية الأساسية.",
                risk_story="إعدادات الكوكيز الضعيفة قد تزيد أثر أي مشكلة أخرى مثل XSS أو النقل غير الآمن أو إساءة استخدام الجلسة.",
                remediation="إضافة Secure وHttpOnly لكل كوكيز الجلسات الحساسة، مع SameSite مناسب حسب طبيعة التطبيق.",
            )
        )

    if set_cookie and "samesite" not in cookie_lower:
        findings.append(
            finding(
                "low",
                "الكوكيز لا تعلن SameSite بشكل صريح",
                "يفضل تحديد SameSite بوضوح لتقليل مخاطر CSRF في الجلسات الحساسة.",
                "cookies",
                impact="غياب SameSite يجعل سلوك الكوكيز أقل وضوحًا عبر السياقات المختلفة، خصوصًا في سيناريوهات الطلبات العابرة للمواقع.",
                risk_story="هذا قد يزيد أثر هجمات CSRF إذا وُجدت نقاط دخول أو إجراءات حساسة غير محمية جيدًا.",
                remediation="تعيين SameSite=Lax أو Strict بحسب طبيعة التطبيق وتدفقات تسجيل الدخول والروابط الخارجية.",
            )
        )

    if headers.get("access-control-allow-origin") == "*":
        findings.append(
            finding(
                "medium",
                "سياسة CORS واسعة جدًا",
                "الترويسة Access-Control-Allow-Origin تسمح لجميع المصادر `*`، ويجب مراجعتها إذا كانت الموارد حساسة أو مقيدة بالمستخدم.",
                "cors",
                impact="قد تصبح بعض الموارد قابلة للقراءة من نطاقات خارجية غير متوقعة إذا لم تكن هناك قيود إضافية.",
                risk_story="إذا كانت هناك واجهات حساسة أو بيانات مستخدم، فإن CORS الواسع قد يزيد مساحة التعرض لتطبيقات أو صفحات خارجية.",
                remediation="تقييد Access-Control-Allow-Origin إلى النطاقات الموثوقة فقط، وربطه بسياسة مصادقة صحيحة.",
            )
        )

    allow_header = lower_headers(options_result.headers).get("allow", "")
    dangerous_methods = [method for method in ["PUT", "DELETE", "TRACE"] if method in allow_header.upper()]
    if dangerous_methods:
        findings.append(
            finding(
                "medium",
                "تم الإعلان عن HTTP Methods تحتاج مراجعة",
                f"استجابة OPTIONS أعلنت دعم الطرق: {', '.join(dangerous_methods)}. يجب التأكد أن هذا مقصود ومقيد خلف المصادقة والـ WAF.",
                "methods",
                impact="الطرق الإضافية توسّع سطح الهجوم إن لم تكن محمية أو مستخدمة بشكل مضبوط.",
                risk_story="أي طريقة غير لازمة أو مكشوفة دون ضوابط كافية تعطي المهاجم مساحة أكبر لاختبار السلوك غير المتوقع للخادم أو التطبيق.",
                remediation="تعطيل الطرق غير المستخدمة، ومراجعة المصادقة والتفويض والـ routing في الطبقات الأمامية والخلفية.",
            )
        )

    if page_profile["generator"]:
        findings.append(
            finding(
                "low",
                "الصفحة تكشف مولد أو منصة",
                f"تم رصد Meta Generator بالقيمة `{page_profile['generator']}`، ويفضل إخفاؤها إن لم تكن مطلوبة.",
                "fingerprint",
                impact="هذه المعلومة تضيف مزيدًا من البصمة التقنية عن الموقع.",
                risk_story="عندما يعرف المهاجم نوع المنصة أو المولد يصبح بناء قائمة تحقق للهجمات أو أخطاء التهيئة أسهل.",
                remediation="إزالة Meta Generator أو ضبطه بما لا يكشف تفاصيل غير لازمة عن المنصة.",
            )
        )

    if page_profile["forms_count"] > 0 and not page_profile["csrf_meta_present"]:
        findings.append(
            finding(
                "medium",
                "نماذج موجودة دون مؤشرات CSRF واضحة",
                "تم رصد نماذج HTML دون مؤشرات واضحة على CSRF token في الصفحة الأولى. يلزم تحقق يدوي لأن بعض الأطر تضيف الحماية بطرق أخرى.",
                "forms",
                impact="إذا كانت الحماية الخلفية غير موجودة أو ناقصة فقد تتأثر العمليات الحساسة بالطلبات العابرة للمواقع.",
                risk_story="المشكلة لا تؤكد وجود ثغرة CSRF، لكنها ترفع الحاجة للفحص اليدوي خاصة عند وجود نماذج حساسة أو إجراءات تغيير بيانات.",
                remediation="التحقق من وجود CSRF tokens أو آليات معادلة في جميع النماذج والإجراءات الحساسة من جهة الخادم.",
            )
        )

    if page_profile["login_surface_detected"]:
        findings.append(
            finding(
                "info",
                "تم رصد مؤشرات لسطح تسجيل دخول",
                "الصفحة الرئيسية أو محتواها يوحي بوجود وظائف دخول أو كلمات مرور، ما يجعل مراجعة التحكم بالوصول والمصادقة خطوة مهمة.",
                "surface",
                impact="وجود سطح دخول يعني أن جودة المصادقة وإدارة الجلسة تصبح محورًا أساسيًا في أمن التطبيق.",
                risk_story="صفحات الدخول عادةً تكون هدفًا مباشرًا للمهاجمين لأنها بوابة إلى الحسابات والجلسات واللوحات الإدارية.",
                remediation="إجراء مراجعة مركزة على المصادقة، سياسات كلمة المرور، معدلات المحاولات، وإدارة الجلسات.",
            )
        )

    missing_security_txt = find_path_result(path_results, "/.well-known/security.txt")
    if missing_security_txt and missing_security_txt["status"] in {None, 404}:
        findings.append(
            finding(
                "low",
                "ملف security.txt غير متاح",
                "يفضل توفير `/.well-known/security.txt` لتوضيح قناة الإبلاغ عن الثغرات وسياسات التواصل الأمني.",
                "exposure",
                impact="هذا لا يعني وجود ثغرة تقنية، لكنه يقلل جاهزية الاستجابة المسؤولة عند اكتشاف مشكلة أمنية من طرف خارجي.",
                risk_story="غياب قناة إفصاح واضحة قد يؤخر الإبلاغ عن المشكلات الفعلية أو يجعلها تصل بطرق غير منظمة.",
                remediation="إضافة `/.well-known/security.txt` يتضمن بريدًا أو قناة تواصل واضحة وسياسة الإفصاح.",
            )
        )

    if crawl_results.get("emails"):
        findings.append(
            finding(
                "low",
                "تم رصد عناوين بريد ظاهرة داخل الصفحات",
                "العثور على عناوين بريد بشكل ظاهر ليس ثغرة بحد ذاته، لكنه قد يزيد التعرض للرسائل المزعجة أو محاولات التصيد الموجه.",
                "exposure",
                impact="المعلومات العامة الظاهرة قد تُستخدم في جمع المعلومات أو الاستهداف الاجتماعي للمستخدمين أو الموظفين.",
                risk_story="المهاجمون يستفيدون من أي معلومات اتصال منشورة لبناء حملات تصيد أكثر إقناعًا أو لتحديد الأقسام المستهدفة.",
                remediation="إخفاء العناوين غير الضرورية للعامة أو استبدالها بنماذج تواصل عند الحاجة.",
            )
        )

    if crawl_results.get("html_comments"):
        findings.append(
            finding(
                "low",
                "تم رصد تعليقات HTML داخل الصفحات",
                "وجود تعليقات HTML قد يكون طبيعيًا، لكن يجب التأكد أنها لا تحتوي ملاحظات تشغيلية أو أسماء داخلية أو مسارات حساسة.",
                "exposure",
                impact="التعليقات قد تكشف أسماء أو ملاحظات داخلية غير مخصصة للعامة.",
                risk_story="المهاجم غالبًا يراجع التعليقات والمصادر المخفية بحثًا عن أسماء خدمات أو مسارات أو معلومات تساعد في الاستطلاع.",
                remediation="تنظيف التعليقات غير الضرورية من الصفحات الإنتاجية أو من ملفات القوالب قبل النشر.",
            )
        )

    if crawl_results.get("pages_visited", 0) > 1:
        findings.append(
            finding(
                "info",
                "تم إجراء زحف داخلي محدود للموقع",
                f"تمت مراجعة {crawl_results.get('pages_visited', 0)} صفحات داخلية بشكل آمن لتوسيع تغطية الفحص.",
                "crawl",
                impact="هذا يرفع تغطية الفحص مقارنة بالاقتصار على الصفحة الرئيسية فقط.",
                risk_story="كلما زادت الصفحات التي يمكن الوصول إليها زادت مساحة الاستطلاع أيضًا، لذا فإن المراجعة الدفاعية المستمرة مهمة.",
                remediation="توسيع الفحص لاحقًا ليشمل صفحات أكثر بعد تسجيل الدخول إذا كان ذلك ضمن التصريح.",
            )
        )

    nuclei = external_tool_results.get("nuclei", {})
    if nuclei.get("status") == "completed" and nuclei.get("findings"):
        for item in nuclei["findings"][:10]:
            severity = normalize_external_severity(item.get("severity"))
            findings.append(
                finding(
                    severity,
                    f"Nuclei: {item.get('name') or item.get('template') or 'كشف إضافي'}",
                    f"أداة Nuclei رصدت مؤشرًا إضافيًا على `{item.get('matched') or target_host_from_match(item)}` باستخدام القالب `{item.get('template')}`.",
                    "external-tool",
                    impact="الكشف جاء من أداة خارجية متخصصة، لذا يستحق المراجعة اليدوية للتأكد من السياق وعدم وجود false positive.",
                    risk_story="الأدوات الخارجية توسع نطاق الرصد وتلتقط misconfigurations أو مؤشرات تعرض قد لا تظهر في الفحص المحلي وحده.",
                    remediation="مراجعة النتيجة يدويًا، التحقق من السياق، ثم معالجة السبب الجذري أو تقييد الخدمة/الإعداد المشار إليه.",
                )
            )
    elif nuclei.get("status") == "error":
        findings.append(
            finding(
                "low",
                "تعذر إكمال فحص Nuclei الخارجي",
                nuclei.get("error") or "الأداة الخارجية لم تكمل الفحص.",
                "external-tool",
                impact="عدم اكتمال الأداة الخارجية يقلل عمق التغطية لكنه لا يلغي نتائج الفحص المحلي.",
                risk_story="كل أداة تضيف زاوية رؤية مختلفة، لذلك فشل واحدة منها يعني أن التغطية ليست بأقصى عمق ممكن بعد.",
                remediation="إعادة المحاولة بعد تجهيز قوالب Nuclei أو مراجعة الشبكة والمهلة وسجلات Docker.",
            )
        )

    open_alt_ports = [item["port"] for item in port_results if item["state"] == "open" and item["port"] not in {80, 443}]
    if open_alt_ports:
        findings.append(
            finding(
                "low",
                "تم رصد منافذ ويب إضافية مفتوحة",
                f"المنافذ التالية تبدو متاحة: {', '.join(map(str, open_alt_ports))}. يجب التأكد أن الخدمات عليها مطلوبة ومحمية.",
                "ports",
                impact="كل منفذ إضافي يزيد سطح التعرض ويحتاج مراجعة مستقلة لإعداده وحمايته.",
                risk_story="الخدمات الثانوية أو البيئات الجانبية كثيرًا ما تكون أضعف ضبطًا من الخدمة الرئيسية، ولذلك يراجعها المهاجمون عادةً.",
                remediation="مراجعة ضرورة كل منفذ مفتوح، وإغلاق غير المستخدم منها أو تقييده شبكيًا ومراقبته.",
            )
        )

    if deep_path_results:
        findings.append(
            finding(
                "medium" if any(item["status"] == 200 for item in deep_path_results) else "low",
                "تم اكتشاف مسارات عميقة أو إدارية محتملة",
                "الفحص العميق رصد مسارات داخلية أو إدارية أو تشغيلية محتملة استجابت على الخادم. هذا لا يعني وجود ثغرة مباشرة، لكنه يوسّع سطح المراجعة الأمنية.",
                "deep-discovery",
                impact="وجود واجهات إدارية أو تشغيلية أو نقاط API متاحة يرفع أهمية مراجعة المصادقة والتفويض والعزل والوصول الشبكي.",
                risk_story="المهاجم عادةً يبدأ بجمع هذه المسارات لأنها تكشف بوابات إدارة أو تسجيل دخول أو خدمات خلفية يمكن أن تكون أكثر حساسية من الصفحة الرئيسية.",
                remediation="مراجعة جميع المسارات المكتشفة يدويًا، التأكد من أنها محمية بالمصادقة والـ authorization المناسبين، وحجب غير الضروري منها أو تقييده شبكيًا.",
            )
        )

    if tls_summary:
        if tls_summary.get("error"):
            findings.append(
                finding(
                    "medium",
                    "فحص TLS غير مكتمل",
                    f"تعذر إنهاء فحص TLS أو الـ handshake: {tls_summary['error']}",
                    "tls",
                    impact="تعذر اكتمال الفحص يقلل الثقة في استقرار القناة المشفرة من جميع البيئات والشبكات.",
                    risk_story="المشكلة لا تعني اختراقًا مباشرًا، لكنها قد تشير إلى ضعف اعتمادية أو تهيئة غير مستقرة للقناة المشفرة.",
                    remediation="فحص توافق TLS وسلاسل الشهادة والـ reverse proxy وقياس نجاح الـ handshake من عدة نقاط شبكة.",
                )
            )
        else:
            days_left = tls_summary.get("days_left")
            if days_left is not None and days_left < 30:
                findings.append(
                    finding(
                        "medium",
                        "شهادة TLS قريبة من الانتهاء",
                        "الشهادة المتاحة للموقع ستنتهي خلال أقل من 30 يومًا.",
                        "tls",
                        impact="قرب انتهاء الشهادة قد يؤدي إلى انقطاع الثقة في الموقع وظهور تحذيرات للزوار أو فشل خدمات التكامل.",
                        risk_story="هذا خطر تشغيلي بالدرجة الأولى، لكنه ينعكس مباشرة على الثقة والأمان للمستخدم النهائي.",
                        remediation="تجديد الشهادة مبكرًا ومراجعة آلية التجديد التلقائي والتنبيهات التشغيلية.",
                    )
                )

            tls_version = tls_summary.get("version")
            if tls_version and tls_version not in {"TLSv1.3", "TLSv1.2"}:
                findings.append(
                    finding(
                        "medium",
                        "إصدار TLS قديم أو غير مفضل",
                        f"الخادم استجاب باستخدام {tls_version}. يفضل اعتماد TLS 1.2 أو TLS 1.3 فقط.",
                        "tls",
                        impact="الإصدارات الأقدم تقل فيها متانة الحماية والتوافق مع أفضل الممارسات الحديثة.",
                        risk_story="كلما كان البروتوكول أقدم زادت احتمالات وجود إعدادات أو تفاوضات أضعف يمكن أن يستفيد منها مهاجم على الشبكة.",
                        remediation="تعطيل البروتوكولات القديمة وحصر الدعم على TLS 1.2 وTLS 1.3 مع إعدادات cipher suites مناسبة.",
                    )
                )

    if not findings:
        findings.append(
            finding(
                "info",
                "لم يتم العثور على مشكلات بارزة في الفحص الدفاعي الحالي",
                "النتيجة إيجابية مبدئيًا، لكن ما زال يلزم اختبار أعمق داخل بيئة مصرح بها مع مراجعة يدوية للمصادقة والتحكم بالوصول.",
                "baseline",
                impact="لا توجد مؤشرات مقلقة في هذا النطاق من الفحص السريع، لكن ذلك لا يغطي منطق التطبيق بالكامل.",
                risk_story="الغياب الظاهر للمشكلات في الفحص السطحي لا يعني أن التطبيق محصن من العيوب المنطقية أو أخطاء التفويض.",
                remediation="استكمال الفحص اليدوي واختبارات المنطق والتفويض داخل نطاق مصرح به.",
            )
        )

    return findings


def build_summary(findings: list[dict]) -> dict:
    severities = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for item in findings:
        severity = item["severity"]
        severities[severity] = severities.get(severity, 0) + 1

    score = 100
    score -= severities["critical"] * 30
    score -= severities["high"] * 18
    score -= severities["medium"] * 10
    score -= severities["low"] * 4
    score = max(score, 0)

    if score >= 85:
        posture = "جيد"
    elif score >= 65:
        posture = "متوسط"
    else:
        posture = "ضعيف"

    return {"score": score, "posture": posture, "counts": severities}


def recommend_next_steps(findings: list[dict], tls_summary: dict | None, headers: dict, path_results: list[dict]) -> list[str]:
    steps = [
        "مراجعة Security Headers الأساسية مثل CSP وHSTS وX-Frame-Options وX-Content-Type-Options على مستوى الخادم أو الـ reverse proxy.",
        "التأكد من أن الوصول إلى HTTP يجبر المستخدم دائمًا على HTTPS مع تفعيل HSTS بعد التحقق الكامل من الشهادة.",
        "مراجعة ملفات الارتباط والجلسات للتأكد من وجود Secure وHttpOnly وSameSite، خاصة في صفحات الدخول ولوحات التحكم.",
        "فحص صفحات الدخول والنماذج يدويًا داخل نطاق مصرح به للتحقق من التحكم بالوصول وCSRF والتحقق من الإدخال.",
    ]
    if headers.get("access-control-allow-origin") == "*":
        steps.insert(0, "تضييق CORS ليقتصر على المصادر المطلوبة فقط بدل السماح العام إذا كانت الموارد حساسة.")
    if tls_summary and tls_summary.get("days_left") is not None and tls_summary["days_left"] < 30:
        steps.insert(0, "تجديد شهادة TLS مبكرًا لتجنب انقطاع الخدمة أو ظهور تحذيرات للمتصفح.")
    security_txt = find_path_result(path_results, "/.well-known/security.txt")
    if security_txt and security_txt["status"] in {None, 404}:
        steps.append("إضافة ملف `/.well-known/security.txt` لتسهيل الإبلاغ المسؤول عن الثغرات.")
    return steps


def find_path_result(path_results: list[dict], path: str) -> dict | None:
    for item in path_results:
        if item["path"] == path:
            return item
    return None


def finding(
    severity: str,
    title: str,
    description: str,
    category: str,
    impact: str | None = None,
    risk_story: str | None = None,
    remediation: str | None = None,
) -> dict:
    owasp_category = infer_owasp_category(title=title, category=category)
    fix_priority = infer_fix_priority(severity)
    return {
        "severity": severity,
        "title": title,
        "description": description,
        "category": category,
        "impact": impact,
        "risk_story": risk_story,
        "remediation": remediation,
        "owasp_category": owasp_category,
        "fix_priority": fix_priority,
    }


def build_strengths(
    *,
    parsed,
    https_result: FetchResult,
    http_result: FetchResult,
    tls_summary: dict | None,
    active_result: FetchResult,
    headers: dict,
    options_result: FetchResult,
    path_results: list[dict],
    page_profile: dict,
) -> list[dict]:
    strengths = []
    if https_result.status == 200:
        strengths.append(
            strength(
                "HTTPS يعمل بشكل طبيعي",
                "الصفحة الرئيسية استجابت عبر HTTPS بنجاح، ما يعني أن القناة المشفرة متاحة للمستخدمين.",
            )
        )
    if tls_summary and not tls_summary.get("error"):
        strengths.append(
            strength(
                f"TLS مضبوط بإصدار {tls_summary.get('version')}",
                "القناة المشفرة تستخدم شهادة صالحة وتشفيرًا حديثًا نسبيًا، وهذا من أهم عناصر الحماية الأساسية.",
            )
        )
    if active_result.headers.get("Set-Cookie"):
        cookie_lower = active_result.headers["Set-Cookie"].lower()
        if "secure" in cookie_lower and "httponly" in cookie_lower and "samesite" in cookie_lower:
            strengths.append(
                strength(
                    "إعدادات الكوكيز الأساسية جيدة",
                    "تم رصد Secure وHttpOnly وSameSite في الكوكيز الظاهرة، ما يعطي أساسًا جيدًا لحماية الجلسة.",
                )
            )
    if http_result.status is not None and http_result.url.startswith("https://"):
        strengths.append(
            strength(
                "هناك إعادة توجيه نحو HTTPS",
                "الوصول عبر HTTP ينتهي إلى النسخة المشفرة، ما يقلل خطر بقاء المستخدم على القناة غير المشفرة.",
            )
        )
    if lower_headers(options_result.headers).get("allow", "").upper() in {"GET,HEAD", "HEAD,GET"}:
        strengths.append(
            strength(
                "الطرق المعلنة محدودة",
                "استجابة OPTIONS لم تعلن طرقًا خطرة مثل PUT أو DELETE أو TRACE في الصفحة الرئيسية.",
            )
        )
    robots = find_path_result(path_results, "/robots.txt")
    if robots and robots["status"] == 200:
        strengths.append(
            strength(
                "ملفات البنية الأساسية موجودة جزئيًا",
                "تم العثور على robots.txt، ما يدل على وجود بعض ملفات الخدمة والتنظيم الأساسية.",
            )
        )
    if page_profile.get("csrf_meta_present"):
        strengths.append(
            strength(
                "هناك مؤشر على آلية CSRF في الواجهة",
                "تم رصد CSRF meta token في الصفحة، وهذا مؤشر جيد على وجود ممارسات حماية في التطبيق أو الإطار.",
            )
        )
    return strengths


def build_narrative(
    *,
    summary: dict,
    findings: list[dict],
    strengths: list[dict],
    https_result: FetchResult,
    http_result: FetchResult,
    tls_summary: dict | None,
) -> dict:
    top_risks = [item["title"] for item in findings if item["severity"] in {"critical", "high"}][:3]
    positives = [item["title"] for item in strengths][:3]
    executive = (
        f"التقييم العام للموقع هو {summary['posture']} بدرجة {summary['score']}/100. "
        "النتيجة لا تعني بالضرورة وجود اختراق قائم، لكنها تشير إلى مستوى التشديد الأمني والضبط الوقائي."
    )
    attacker_view = (
        "من منظور مهاجم، أكثر ما يلفت النظر عادةً هو ضعف التهيئة الوقائية أو كشف البصمة التقنية أو البطء أو غياب الرؤوس الأمنية، "
        "لأن هذه المؤشرات تساعد على تضييق مساحة البحث عن نقاط الضعف."
    )
    if tls_summary and not tls_summary.get("error") and https_result.status == 200:
        defensive_note = "من الجيد أن HTTPS يعمل وأن TLS يبدو سليمًا، وهذا يمنع فئة كبيرة من المخاطر الشبكية الأساسية."
    else:
        defensive_note = "القناة المشفرة تحتاج متابعة أكبر لأن الوصول أو فحص TLS لم يكن مكتملًا بثبات."

    return {
        "executive_summary": executive,
        "attacker_view": attacker_view,
        "defender_view": defensive_note,
        "top_risks": top_risks,
        "top_strengths": positives,
    }


def strength(title: str, description: str) -> dict:
    return {"title": title, "description": description}


def header_impact(name: str) -> str:
    return {
        "Strict-Transport-Security": "غياب HSTS يجعل إجبار المتصفح على HTTPS أقل صرامة ويترك مساحة أكبر للرجوع المؤقت إلى HTTP.",
        "Content-Security-Policy": "غياب CSP يقلل قدرة المتصفح على تقييد السكربتات والموارد غير الموثوقة داخل الصفحة.",
        "X-Frame-Options": "غياب X-Frame-Options يجعل تضمين الصفحة داخل iframe أسهل إذا لم توجد ضوابط بديلة.",
        "X-Content-Type-Options": "غياب X-Content-Type-Options قد يضعف ضبط تفسير أنواع المحتوى عند بعض المتصفحات.",
        "Referrer-Policy": "غياب Referrer-Policy قد يسمح بتسرب معلومات مرجعية أكثر مما ينبغي إلى الأطراف الأخرى.",
        "Permissions-Policy": "غياب Permissions-Policy يعني أن تقييد الميزات الحساسة غير مُعلن بوضوح على مستوى المتصفح.",
    }.get(name, "غياب هذه الترويسة يقلل مستوى التشديد الوقائي للتطبيق.")


def header_risk_story(name: str) -> str:
    return {
        "Strict-Transport-Security": "إذا لم يتم تثبيت HTTPS عبر HSTS فقد يستفيد مهاجم على الشبكة من أول زيارة أو من روابط HTTP القديمة لتقليل الحماية.",
        "Content-Security-Policy": "المهاجم يستفيد من غياب CSP عندما توجد مشكلة حقن في التطبيق، لأن CSP كثيرًا ما يكون طبقة احتواء إضافية مهمة.",
        "X-Frame-Options": "بدون حماية من الإطارات قد يحاول طرف خبيث عرض الصفحة داخل واجهة مزيفة لخداع المستخدم بالنقر.",
        "X-Content-Type-Options": "ضعف ضبط نوع المحتوى قد يزيد أثر بعض أخطاء الرفع أو الاستجابة إذا وُجدت.",
        "Referrer-Policy": "قد تتسرب معلومات عن الصفحات أو المعلمات إلى جهات خارجية أكثر من اللازم.",
        "Permissions-Policy": "عند غياب السياسة قد تبقى بعض قدرات المتصفح متاحة أوسع من الحاجة في الصفحات الفرعية أو المكونات الخارجية.",
    }.get(name, "المهاجم يستفيد من هذا الغياب كجزء من ضعف التهيئة العامة وليس بالضرورة كثغرة مستقلة.")


def header_remediation(name: str) -> str:
    return {
        "Strict-Transport-Security": "تفعيل HSTS بقيمة مناسبة مثل `max-age` بعد التحقق الكامل من جاهزية HTTPS على جميع المسارات.",
        "Content-Security-Policy": "بناء سياسة CSP تدريجية تبدأ بالمراقبة ثم التفعيل مع تحديد مصادر السكربتات والأنماط والوسائط الموثوقة.",
        "X-Frame-Options": "إضافة `DENY` أو `SAMEORIGIN` إذا لم تكن هناك حاجة شرعية لتضمين الصفحة داخل iframe.",
        "X-Content-Type-Options": "إضافة `X-Content-Type-Options: nosniff` على مستوى الخادم أو التطبيق.",
        "Referrer-Policy": "اختيار سياسة مناسبة مثل `strict-origin-when-cross-origin` أو أشد حسب احتياج التطبيق.",
        "Permissions-Policy": "تعريف سياسة صريحة لتقييد الميزات الحساسة غير المستخدمة مثل الكاميرا والميكروفون والموقع.",
    }.get(name, "إضافة الترويسة المناسبة على مستوى الخادم أو التطبيق ومراجعة أثرها على التشغيل.")


def infer_owasp_category(*, title: str, category: str) -> str:
    text = f"{title} {category}".lower()
    if "cookie" in text or "csrf" in text or "session" in text or "تسجيل دخول" in text:
        return "A07:2021 - Identification and Authentication Failures"
    if "content-security-policy" in text or "x-frame-options" in text or "header" in text or "permissions-policy" in text:
        return "A05:2021 - Security Misconfiguration"
    if "cors" in text or "method" in text or "port" in text or "server" in text:
        return "A05:2021 - Security Misconfiguration"
    if "tls" in text or "https" in text or "hsts" in text:
        return "A02:2021 - Cryptographic Failures"
    if "performance" in text or "availability" in text:
        return "A05:2021 - Security Misconfiguration"
    return "A05:2021 - Security Misconfiguration"


def infer_fix_priority(severity: str) -> str:
    return {
        "critical": "P1 - عاجل جدًا",
        "high": "P1 - عاجل",
        "medium": "P2 - مرتفع",
        "low": "P3 - تحسين مهم",
        "info": "P4 - متابعة",
    }.get(severity, "P3 - تحسين مهم")


def normalize_external_severity(severity: str | None) -> str:
    mapping = {
        "critical": "critical",
        "high": "high",
        "medium": "medium",
        "low": "low",
        "info": "info",
        "unknown": "low",
    }
    return mapping.get((severity or "").lower(), "low")


def target_host_from_match(item: dict) -> str:
    return item.get("matched") or "الهدف المحدد"


def serialize_fetch(result: FetchResult) -> dict:
    preview_headers = {}
    for key, value in result.headers.items():
        if key.lower() in {
            "server",
            "content-type",
            "set-cookie",
            "location",
            "strict-transport-security",
            "content-security-policy",
            "x-frame-options",
            "x-content-type-options",
            "referrer-policy",
            "permissions-policy",
            "access-control-allow-origin",
            "allow",
            "x-powered-by",
        }:
            preview_headers[key] = value

    return {
        "method": result.method,
        "url": result.url,
        "status": result.status,
        "error": result.error,
        "elapsed_ms": result.elapsed_ms,
        "headers": preview_headers,
        "body_excerpt": result.body[:500],
    }


def _is_retryable_error(error: str | None) -> bool:
    if not error:
        return False
    lowered = error.lower()
    return "timed out" in lowered or "handshake" in lowered or "timeout" in lowered
