<img width="1730" height="909" alt="Al-Kunooze-Security" src="https://github.com/user-attachments/assets/c096f175-d8e2-4326-84a8-80de866b8763" />

# Al-Kunooze Security

**Al-Kunooze Security** is a defensive, passive security assessment platform for authorized web targets. It combines a React workspace with an Express API to inspect public DNS, HTTPS reachability, response timing, and browser-facing security headers, then turns the observed evidence into a scored JSON report.

![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?style=flat-square&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite)
![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Version](https://img.shields.io/badge/Version-1.2.0-blue?style=flat-square)

## Product scope

The current implementation is intentionally **passive and authorization-gated**. A scan requires an explicit confirmation that the operator owns the target or has permission to assess it. The service resolves public DNS, makes one controlled HTTP request, evaluates transport and response headers, records timing and status evidence, calculates a posture score, and stores the report locally.

> The scanner does not send exploit payloads, perform intrusive port sweeps, accept credentials in target URLs, or modify the target system.

| Capability | Current behavior |
|---|---|
| Target input | HTTP/HTTPS domain or URL normalization |
| Public DNS | IPv4/IPv6 lookup and reverse DNS context |
| Transport | HTTPS detection and HTTP-to-HTTPS redirect observation |
| Headers | HSTS (including max-age quality), CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP, CORP |
| Risk output | Severity-ranked findings, posture score, strengths, and remediation steps |
| Reports | Local JSON persistence (atomic writes) with list, detail, and download endpoints |
| Safety controls | Authorization gate, private/local/CGNAT address blocking, request timeout, response size limit, rate limiting, manual redirects |

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Wouter, Framer Motion |
| UI | Tailwind CSS 4, Radix/shadcn components, Lucide icons |
| Development server | Express with Vite middleware |
| Production server | Bundled Node.js/Express server serving the Vite build |
| Persistence | Local JSON file at `.data/scans.json` (atomic writes) |
| Container | Docker + Docker Compose with healthcheck |

## Getting started

### Requirements

- Node.js 20 or newer
- pnpm

```bash
git clone https://github.com/9gkc/Al-Kunooze-Security.git
cd Al-Kunooze-Security
pnpm install
cp .env.example .env
```

### Development

```bash
pnpm dev
```

Open `http://localhost:3000`.

Useful checks before committing:

```bash
pnpm check
git diff --check
```

### Production build

```bash
pnpm build
NODE_ENV=production pnpm start
```

```bash
PORT=8080 NODE_ENV=production pnpm start
```

### Docker (recommended for a quick real run)

```bash
docker compose up --build -d
```

Service: `http://localhost:3000`  
Scan data is stored in a named volume.

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Service status, version (`1.2`), timestamp |
| `GET` | `/api/scans` | Report summaries |
| `GET` | `/api/scans/:id` | Full report |
| `GET` | `/api/scans/:id/download` | Download report as JSON |
| `POST` | `/api/scans` | Run an authorized passive assessment |

```bash
curl -X POST http://localhost:3000/api/scans \
  -H 'Content-Type: application/json' \
  -d '{
    "target": "https://your-authorized-domain.example",
    "profile": "deep",
    "authorizationConfirmed": true
  }'
```

Profiles: `quick`, `deep`, `authorized_deep` (filtering only — never exploitative).

## Application routes

| Route | Purpose |
|---|---|
| `/` | Overview and live API status |
| `/scanner` | Authorized scan form, progress, findings, export |
| `/reports` | Stored reports |
| `/services` | Capabilities and safety boundaries |
| `/about` | Mission and stack |

## Operational notes

Reports are stored locally (newest 50). Writes are atomic. Private, local, loopback, and CGNAT targets are blocked. Redirects are observed, not followed blindly.

This release does not include multi-user accounts or cloud multi-tenant deployment. Those require access control and a clear privacy model before they are claimed as product features.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT — see [LICENSE](LICENSE).

## Author

[Ali Al-Karrar](https://github.com/9gkc)

---

**Built with precision. Secured by design.**
