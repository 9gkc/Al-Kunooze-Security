# Security Policy

## Supported Versions

The default branch (`master`) is the only supported version for security fixes.

## Responsible Use

Al-Kunooze Security is a **passive, authorization-gated** assessment tool. It must only be used against targets you own or have explicit written permission to assess. The scanner does not send exploit payloads, perform intrusive port scans, follow redirects automatically, or accept credentials in target URLs.

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities.

1. Prefer GitHub's private vulnerability reporting feature (Security tab of this repository) when available.
2. If private reporting is unavailable, contact the repository owner through the GitHub profile at https://github.com/9gkc.

Include:
- A clear description of the issue
- Steps to reproduce (safe, non-destructive)
- Potential impact
- A safe way to follow up

Do **not** include credentials, API keys, personal data, or destructive proof-of-concept payloads.

Reports are reviewed in good faith and handled as quickly as practical.

## Security Design Notes

- Private, loopback, link-local, and internal targets are blocked.
- Request timeout is limited to 10 seconds.
- Response body size is capped.
- Rate limiting is applied per client address.
- Authorization confirmation is required for every scan.
- No credentials are accepted in target URLs.
