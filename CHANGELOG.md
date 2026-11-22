# Changelog

All notable changes to Al-Kunooze Security are documented in this file.

## [1.1.0] - 2026-11-22

### Added
- Additional passive security header checks (Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy)
- Global security headers on all responses (X-Frame-Options, COOP, CORP, Permissions-Policy)
- Atomic write for scan storage (temp file + rename) to reduce corruption risk
- Carrier-grade NAT and multicast address blocking in private IP detection
- Rate-limit map cleanup to prevent unbounded growth
- Version field in health endpoint
- Docker healthcheck
- `.dockerignore` for cleaner builds
- Improved `docker-compose.yml` with healthcheck configuration

### Changed
- User-Agent updated to reflect version 1.1
- Stricter URL parsing with clearer error messages
- Improved private/local hostname blocking
- README updated to reflect current capabilities and version 1.1

### Security
- Strengthened default response headers
- More robust input validation and private address filtering
- Safer file persistence for scan reports
- Non-root container user with dedicated data directory ownership

## [1.0.0] - 2026-05

- Initial public release of the passive, authorization-gated web assessment platform
