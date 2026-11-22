# Security Policy

## Supported versions

Only the latest deployed version of the website and API receives security fixes.
Security changes are delivered through the normal deployment pipeline; there are
no long-term maintenance branches for this project.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for a security problem. The same
policy is published publicly at <https://www.jirehhealthcaresolutions.com/security>.

- Email: [info@jirehhealthcaresolutions.com](mailto:info@jirehhealthcaresolutions.com)
- Web: <https://www.jirehhealthcaresolutions.com/about-us>
- Machine-readable contact: `/.well-known/security.txt`

Include the affected URL or endpoint, the request used, the observed result and
the impact you believe it has. Please avoid submitting real patient/customer
data and avoid destructive testing against production.

**Our response targets:** acknowledge within 3 business days, triage within
7 days, and keep you informed until the issue is fixed and verified. If you
would like to be credited, tell us how you want to be named.

## Scope

- Frontend: `src/`, `public/`, `netlify.toml`
- API: `backend/src/`, `backend/prisma/`, `docker-compose.yml`
- Out of scope: third-party services (Netlify, Neon, Google SMTP), and
  denial-of-service testing against production.

## Security controls (summary)

The full implementation and verification record is in
[docs/SECURITY-REPORT.md](docs/SECURITY-REPORT.md). At a glance:

- Allow-listed CORS origins with an early 403 for any other `Origin`; no credentials.
- Zod `strictObject` request schemas with Unicode/control-character normalisation.
- Strict JSON content-type, body-size, nesting-depth and prototype-pollution guards.
- Three independent honeypots (field, timing, link spam) plus duplicate suppression.
- Per-IP rate limits (200/15 min general, 5/10 min submissions).
- Per-request structured JSON logs with mandatory secret/PII redaction.
- Boot-time safety gate (TLS DB, explicit admin/SMTP, safe CORS, valid SMTP TLS pair).
- SMTP sends only over verified TLS (587 STARTTLS or 465 implicit TLS), with file/URL
  loaders disabled, normalised headers and auto-reply suppression.
- Database CHECK constraints as defence in depth; parameterised Prisma queries only.
- Stable error codes and custom 404 pages — no stack traces or internals in responses.
- OWASP-recommended HTTP security headers explicit on both the API and the SPA
  (strict CSP, 2-year HSTS, COOP/COEP/CORP, Permissions-Policy, no legacy XSS auditor).

## Security tooling

```bash
npm run security:audit        # dependency vulnerabilities (both workspaces)
npm run security:sast         # project Semgrep rules
npm run security:sast:full    # + Semgrep community rules (needs network)
npm run dast                  # 95-check DAST smoke suite against a running API
cd backend && npm test        # 91 unit/integration tests
```

See the report for how to point the DAST suite at a disposable database.
