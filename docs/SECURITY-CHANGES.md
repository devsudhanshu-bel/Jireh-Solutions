# Security Changes — Changelog

**Project:** Jireh Healthcare Solutions website + submission API
**Date:** 22 November 2026
**Companion documents:** [SECURITY-REPORT.md](SECURITY-REPORT.md) (implementation + verification evidence) and [SECURITY.md](../SECURITY.md) (disclosure policy).

This file is the scannable **"what changed and why"** record. It is intentionally a
changelog, not a pentest write-up: for payload lists, test commands and raw evidence,
see [SECURITY-REPORT.md](SECURITY-REPORT.md).

---

## 1. Summary

The project started with a reasonable baseline (Helmet, CORS, rate limits, strict Zod
objects, a hidden honeypot, HTML-escaped emails). The controls were shallow: they
existed but could be bypassed, leaked internals, or were only enforced in the
application layer. Every item below is now implemented, verified and — where relevant —
asserted by an automated test so it cannot silently regress.

| # | Area | Change | Where |
|---|---|---|---|
| 1 | Server-side input validation | NFC normalisation, invisible/control/bidi character stripping, Unicode-aware charsets, code-point length limits, per-field messages | `backend/src/schemas.ts` |
| 2 | API payload validation | Strict `application/json` + `charset=utf-8`, 20 kB body cap, nesting-depth guard, prototype-pollution key rejection, explicit field mapping into Prisma | `backend/src/app.ts`, `middleware/security.ts`, `routes/submissions.ts` |
| 3 | CORS | Allow-list only; disallowed `Origin` → `403` **before** handlers; `Vary: Origin`; `credentials: false`; no wildcard/`null`/credential-bearing origins | `backend/src/env.ts`, `middleware/security.ts` |
| 4 | Credentials & environment | Fail-closed boot gate; TLS-only DB; no cert-verification override; secrets never logged; `describeEnv()` is secret-free | `backend/src/env.ts`, `lib/logger.ts` |
| 5 | Spam protection | Three independent traps (hidden field, `<700 ms` timing, >3 links) + duplicate suppression; uniform `202 {ok:true}` with jitter | `schemas.ts`, `routes/submissions.ts`, both frontend forms |
| 6 | Database | Bounded pool + timeouts, TLS decided explicitly, storage-layer `CHECK` constraints and indexes, parameterised Prisma queries only | `backend/src/db.ts`, `prisma/migrations/20261122000000_security_constraints/migration.sql` |
| 7 | Error handling | Stable machine codes; no stack traces, SQL, file paths or versions in responses/health; redacted structured logs | `middleware/security.ts`, `server.ts`, `lib/logger.ts` |
| 8 | 404 handling | Real `404.html` for browsers (Netlify forward + Vite fallback), JSON 404 for API, `X-Robots-Tag: noindex` | `public/404.html`, `netlify.toml`, `src/App.tsx`, `src/pages/NotFound.tsx` |
| 9 | SAST / DAST tooling | Semgrep rules, npm audit scripts, 95-check live DAST suite, Dependabot, `SECURITY.md`, published `/security` page | `.semgrep.yml`, `scripts/dast-smoke.mjs`, `.github/dependabot.yml`, `src/pages/Security.tsx` |
| 10 | SMTP | Verified TLS (587 STARTTLS or 465 implicit), `rejectUnauthorized`, TLS ≥ 1.2, file/URL loaders disabled, header injection stripped, auto-reply loops suppressed | `backend/src/mailer.ts`, `emailTemplates.ts`, `env.ts` |
| 11 | OWASP HTTP headers | Every applicable header explicit on API + SPA; frozen `Permissions-Policy`; COEP on API; 2-year HSTS; drift test reads `netlify.toml` | `backend/src/app.ts`, `middleware/security.ts`, `netlify.toml` |
| 12 | Credential obfuscation | Industrial secret handling (no password UI exists): masked log values, provider-token/assignment redaction, safe error sanitisation | `backend/src/lib/logger.ts` |

---

## 2. Detailed changes

### 2.1 Input & payload validation

- Zod `strictObject` schemas normalise with NFC, strip zero-width/bidi/control characters,
  and restrict names/contacts/emails to explicit Unicode ranges with code-point limits.
- Unknown fields are rejected with a **per-field** message (previously a generic `_` key).
- `express.json()` is replaced with a strict content-type/charset guard, a 20 kB size cap,
  a JSON nesting-depth limit and a reviver that refuses `__proto__` / `constructor` keys.
- Unsupported methods reach `405 + Allow` instead of falling into the JSON guard (`PUT` used
  to return `415`). Only `POST` requires JSON.
- Database writes use an explicit allow-listed field mapping — user objects are never spread
  into a Prisma call.

### 2.2 CORS & HTTP surface

- Origins are validated at boot (scheme + host only, no path/query/wildcard/credentials).
  Production rejects `http://`, `localhost` and loopback origins.
- Any request whose `Origin` is not on the list is answered `403 {error:"origin_not_allowed"}`
  by early middleware, before it can reach a route. `Vary: Origin` is always set.
- No cookies, sessions or credentialed requests exist, so CSRF has no ambient authority
  to abuse; the API is a pure JSON write surface.

### 2.3 Credentials, environment & obfuscation

- `env.ts` validates **all** variables at boot and refuses to start on an unsafe
  combination (missing `ADMIN_EMAIL`/SMTP credentials in production, non-TLS DB,
  `DB_SSL_VERIFY=false`, mismatched SMTP port/secure pairing). Validation errors name
  fields only, never values.
- Certificate verification cannot be disabled by configuration — a private CA must be
  added to the container trust store.
- **Password fields:** the application has no login, no admin UI and no `type="password"`
  input anywhere; the only credentials are server-side (SMTP app password, DB URL).
  "Obfuscation in password entering areas" is therefore implemented as industrial
  **secret handling**, not as a reversible client-side encoding (which would be security
  theatre):
  - every log line passes through `redact()`, which masks emails and hashes IPs;
  - `maskSecret()` masks any secret that must be surfaced;
  - provider tokens (`ghp_…`, `xoxb-…`, AWS keys, JWTs) and `key=value`/`key: value`
    secret assignments embedded in free-form error text are replaced with `[redacted]`;
  - `sanitizeError()` is used at every error-logging site (request errors, DB pool/health
    errors, process-level handlers) so an upstream message cannot smuggle a credential
    into stdout or a log aggregator.
- Secrets live only in git-ignored `.env` files; `.env.example` contains placeholders.

### 2.4 Spam protection

- Hidden `website` field: any non-empty value (including whitespace or a non-string) is a hit.
- Timing trap: submissions completed in under 700 ms are silently dropped.
- Link trap: descriptions with more than three links are dropped.
- Duplicate suppression on a normalised key. Trapped/duplicate requests all return the
  identical `202 {ok:true}` with small jitter, store nothing and do not send mail.

### 2.5 Database & email

- A single bounded `pg` pool with connect/statement/query timeouts; TLS explicitly decided;
  Prisma query logging stays off so submitted PII is never written to stdout.
- `CHECK` constraints and indexes mirror the application validation as defence in depth,
  so a direct SQL insert cannot bypass the enum/length rules.
- SMTP uses validated env for `secure` + `requireTLS`, `rejectUnauthorized: true`,
  `minVersion: TLSv1.2`, disabled file/URL loaders, bounded timeouts, boot-time logo bytes,
  `oneLine()` on every header and `X-Auto-Response-Suppress` on both messages.
- Email is best-effort: a send failure is logged and the saved submission still returns
  `201 {ok:true, emailed:false}`.

### 2.6 HTTP security headers (OWASP cheat sheet)

All headers are now **explicit** in configuration rather than inherited from Helmet
defaults, so a dependency upgrade cannot silently drop one. Highlights:

- API CSP: `default-src 'none'` with every fetch directive closed (`script-src`,
  `connect-src`, `img-src`, `font-src`, `worker-src`, …) and `upgrade-insecure-requests`.
- HSTS: `max-age=63072000; includeSubDomains; preload` in production / on the SPA.
- `X-XSS-Protection: 0` explicitly (the legacy auditor can create XSS).
- `Permissions-Policy`: 28 features disabled for all origins; shared frozen value.
- COOP `same-origin`, COEP `require-corp` and CORP on the API; COEP is deliberately
  **absent** on the SPA because Google Fonts, ArcGIS tiles and the Maps iframe do not
  send CORP headers and would break (documented in the config and the report).
- `X-Robots-Tag: noindex, nofollow` on all API responses; no `Set-Cookie`, no `Expect-CT`,
  no HPKP, no `X-Powered-By`.

The full header-by-header matrix and rationale is in
[SECURITY-REPORT.md § 1.11](SECURITY-REPORT.md#111-http-security-response-headers--owasp-cheat-sheet-review).

---

## 3. Pentest findings fixed

| # | Finding | Fix |
|---|---|---|
| 1 | Honeypot whitespace (`"   "`) treated as empty via `trim()` | Any non-empty string / non-string is a hit |
| 2 | `PUT /api/enquiries` returned `415` not `405` | JSON guard applies only to `POST` |
| 3 | `unrecognized_keys` reported as generic `_` error | Expanded to per-field messages |
| 4 | 3 high-severity `effect@3.20.0` ReDoS advisories via Prisma 7 | `overrides: { "effect": "3.22.1" }` (re-validate on Prisma upgrade) |
| 5 | Semgrep config had invalid YAML scalar + unsupported `tsx` language | Quoted patterns + `typescript` |
| 6 | Short test runs collided on in-memory rate-limit/duplicate state | DAST randomises source IP + email per run |
| 7 | SMTP gaps: ignored `SMTP_SECURE`, no TLS policy, loaders enabled, unvalidated host/FROM, auto-reply loops | Full TLS policy + validation + `oneLine()` + suppression (13 new tests) |
| 8 | OWASP headers implicit/absent, 1-year HSTS, no drift test | Explicit header set, frozen policy, 2-year HSTS, 14 DAST + 5 unit checks |

---

## 4. File cleanup

Removed only assets verified to have **zero references** and no behavioural role:

- `src/assets/logos/jireh-logo-old.png` — superseded original logo, unreferenced.
- `src/assets/logos/eeva-logo-1.png` — numbered duplicate; `eeva-logo.png` is the imported one.
- `public/jireh-logo.png` — byte-identical (MD5 `fe328dc…`) to the imported
  `src/assets/logos/jireh-logo.png`; favicon uses `/icon.png` and mail uses `backend/assets/jireh-logo.png`.

Generated, git-ignored build output (`dist/`, `backend/dist/`, `backend/src/generated/prisma/`)
was **left in place** — it is regenerable by `npm run build` / `npm run prisma:generate` and
is not part of the source tree. No source module is unreferenced; both Prisma migrations are
complementary (init + security constraints).

---

## 5. Result

- Backend unit/integration tests: **91 pass / 0 fail**.
- Live DAST: **95/95 checks passed** (against a disposable PostgreSQL instance).
- Semgrep: **0 findings** (8 project rules; 84 rules in the full community scan).
- `npm audit`: **0 vulnerabilities** in both workspaces.
- Typecheck and production builds clean; lint has one pre-existing React warning in
  `Navbar.tsx:38` (set-state-in-effect), unrelated to security.

See [SECURITY-REPORT.md § 3](SECURITY-REPORT.md#3-verification-evidence) for commands and
raw output, and § 4 for residual risks / operational controls.
