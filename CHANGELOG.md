# Changelog

All notable changes to Al-Kunooze Security are documented in this file.

## [1.2.0] - 2026-11-22

### Added
- Stronger API client with typed health response and clearer error messages
- Version field consistency across health endpoint and package
- Deeper CSP quality signals (`unsafe-inline`, `unsafe-eval`, broad wildcards)
- Validation that `X-Content-Type-Options` is actually `nosniff`

### Security & Hardening
- Continued reinforcement of passive assessment boundaries
- Atomic report storage
- Expanded private address blocking (including CGNAT)
- Global security response headers
- Rate-limit cleanup
- HSTS max-age quality scoring

### Operational
- Docker healthcheck and improved compose configuration
- Cleaner `.dockerignore`

## [1.1.0] - 2026-11-22

### Added
- Additional passive security header checks (COOP, CORP)
- Global security headers on all responses
- Atomic write for scan storage
- Carrier-grade NAT and multicast address blocking
- Rate-limit map cleanup
- Version field in health endpoint
- Docker healthcheck and `.dockerignore`

### Changed
- Stricter URL parsing and private/local hostname blocking
- README and documentation updates

### Security
- Strengthened default response headers
- Safer file persistence
- Non-root container user

## [1.0.0] - 2026-05

- Initial public release of the passive, authorization-gated web assessment platform
