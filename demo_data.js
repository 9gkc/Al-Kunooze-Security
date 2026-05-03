const demoReport = {
  "report_id": "demo_12345",
  "scanned_at": new Date().toISOString(),
  "target": "https://example-demo.com",
  "hostname": "example-demo.com",
  "ip_address": "93.184.216.34",
  "summary": {
    "score": 72,
    "counts": { "high": 1, "medium": 2, "low": 3, "info": 5 }
  },
  "findings": [
    {
      "title": "Missing Security Headers",
      "severity": "medium",
      "owasp_category": "A05:2021-Security Misconfiguration",
      "description": "The server is missing important security headers like HSTS and CSP.",
      "impact": "Attackers could perform clickjacking or man-in-the-middle attacks.",
      "fix_priority": "Medium",
      "risk_story": "An attacker could intercept the communication between the user and the server."
    },
    {
      "title": "Outdated JavaScript Library",
      "severity": "low",
      "owasp_category": "A06:2021-Vulnerable and Outdated Components",
      "description": "The site uses an old version of jQuery (1.12.4).",
      "impact": "Known vulnerabilities in old libraries could be exploited.",
      "fix_priority": "Low",
      "risk_story": "An attacker might use known exploits for this specific version."
    }
  ],
  "strengths": [
    { "title": "HTTPS Enabled", "description": "The site uses a valid SSL certificate." },
    { "title": "No Directory Listing", "description": "Sensitive directories are not exposed." }
  ],
  "recon": {
    "dns": { "primary_ip": "93.184.216.34", "addresses": ["93.184.216.34"] },
    "ports": [{ "port": 443, "service": "HTTPS", "status": "open" }],
    "known_paths": [{ "path": "/robots.txt", "status": 200 }],
    "deep_paths": [],
    "page_profile": { "title": "Example Domain", "forms": 0 },
    "crawl": []
  }
};
