<img width="1730" height="909" alt="Al-Kunooze-Security" src="https://github.com/user-attachments/assets/c096f175-d8e2-4326-84a8-80de866b8763" />

# Al-Kunooze Security

> **Live demo:** [Open Al-Kunooze-Security in your browser](https://9gkc.github.io/Al-Kunooze-Security/)

**Al-Kunooze Security** is a defensive, passive security assessment platform for authorized web targets. It combines a React workspace with an Express API to inspect public DNS, HTTPS reachability, response timing, and browser-facing security headers, then turns the observed evidence into a scored JSON report.

![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=flat-square&logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?style=flat-square&logo=tailwindcss) ![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite) ![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express)

## Product scope

The current implementation is intentionally **passive and authorization-gated**. A scan requires an explicit confirmation that the operator owns the target or has permission to assess it. The service resolves public DNS, makes one controlled HTTP request, evaluates transport and response headers, records timing and status evidence, calculates a posture score, and stores the report locally.

> The scanner does not send exploit payloads, perform intrusive port sweeps, accept credentials in target URLs, or modify the target system.

| Capability | Current behavior |
|---|---|
| Target input | HTTP/HTTPS domain or URL normalization |
| Public DNS | IPv4/IPv6 lookup and reverse DNS context |
| Transport | HTTPS detection and HTTP-to-HTTPS redirect observation |
| Headers | HSTS, CSP, content type, clickjacking, referrer, and permissions checks |
| Risk output | Severity-ranked findings, posture score, strengths, and remediation steps |
| Reports | Local JSON persistence with list, detail, and download endpoints |
| Safety controls | Authorization gate, private/local address blocking, request timeout, response size limit, and manual redirects |

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Wouter, Framer Motion |
| UI | Tailwind CSS 4, Radix/shadcn components, Lucide icons |
| Development server | Express 5 with Vite middleware |
| Production server | Bundled Node.js/Express server serving the Vite build |
| Persistence | Local JSON file at `.data/scans.json` |
| Validation | TypeScript compiler and Git diff checks |

## Getting started

### Requirements

Use Node.js 20 or newer and pnpm. The repository includes a `pnpm-lock.yaml`; install dependencies from the repository root.

```bash
git clone https://github.com/9gkc/Al-Kunooze-Security.git
cd Al-Kunooze-Security
pnpm install
cp .env.example .env
```

### Development

The development command starts the Express API and mounts Vite middleware on the same port. The default address is `http://localhost:3000`.

```bash
pnpm dev
```

The following checks are useful before committing changes:

```bash
pnpm check
git diff --check
```

### Production build

Build the frontend and bundle the server, then run the generated server with `NODE_ENV=production`.

```bash
pnpm build
NODE_ENV=production pnpm start
```

The port can be changed with `PORT`:

```bash
PORT=8080 NODE_ENV=production pnpm start
```

Reports are persisted to `.data/scans.json`. This is suitable for a local or single-instance deployment. A multi-user production deployment should replace this file store with a database and add authentication, authorization, rate limiting, and encrypted audit storage before exposing the service publicly.

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Returns service status and timestamp |
| `GET` | `/api/scans` | Returns report summaries without full findings |
| `GET` | `/api/scans/:id` | Returns one complete report |
| `GET` | `/api/scans/:id/download` | Downloads one report as JSON |
| `POST` | `/api/scans` | Runs an authorized passive assessment and stores the result |

Example request:

```bash
curl -X POST http://localhost:3000/api/scans \
  -H 'Content-Type: application/json' \
  -d '{
    "target": "https://your-authorized-domain.example",
    "profile": "deep",
    "authorizationConfirmed": true
  }'
```

Supported profiles are `quick`, `deep`, and `authorized_deep`. The current profiles control result filtering; they do not enable exploitative or intrusive behavior.

## Application routes

| Route | Purpose |
|---|---|
| `/` | Product overview and live API status indicator |
| `/scanner` | Authorized passive scan form, progress, evidence, findings, and export |
| `/reports` | Stored report list, posture filters, details, refresh, and download |
| `/services` | Implemented capability and safety-boundary overview |
| `/about` | Mission, operating principles, and current technology stack |

## Data and operational notes

Reports are intentionally stored locally and capped at the newest 50 records. The service applies a 10-second request timeout and blocks local, link-local, loopback, private IPv4, and private IPv6 targets. Redirects are observed rather than followed automatically, which keeps the assessment bounded to the submitted URL.

The current application does not include user accounts, a database, a job queue, a distributed worker, or a cloud deployment configuration. Those are appropriate next steps for a shared team product, but they should be added together with an access-control model and an operational privacy policy rather than implied by the current interface.

## License

MIT

## Author

[Ali Al-Karrar](https://github.com/9gkc)

---

**Built with precision. Secured by design.**
