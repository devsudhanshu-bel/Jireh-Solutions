# Security Hardening & Verification Report

**Project:** Jireh Healthcare Solutions website + submission API
**Date:** 22 November 2026
**Scope:** `src/` (React 19 SPA), `backend/` (Express 5 / Prisma 7 / Zod / Nodemailer), `netlify.toml`, `docker-compose.yml`
**Method:** in-place hardening → white-box review → SAST → dependency audit → live DAST against a disposable PostgreSQL 18 instance → fix → re-verify

---

## Executive summary

The site already had a reasonable baseline (Helmet, CORS, rate limits, Zod strict objects, a hidden honeypot, HTML-escaped email templates). The review found that most controls were **shallow** — they existed but could be bypassed, leaked information, or were not enforced at the storage layer. All identified gaps are now fixed and verified.

| Area | Before | After |
|---|---|---|
| Input validation | Type checks only; control/zero-width/bidi characters and markup passed through | NFC normalisation, invisible-character stripping, Unicode-aware charsets, code-point length limits |
| Payload validation | `express.json()` defaults; arrays, deep JSON and `__proto__` accepted | 20 kB cap, strict object root, depth ≤ 8, prototype-pollution reviver, strict JSON content type |
| CORS | Reflected origin with permissive configuration | Explicit allow-list, **403 for any other origin** before handlers, `credentials: false` |
| Credentials | Defaults and raw values could reach logs | Zod-validated at boot, fail-closed production gate, redacted JSON logging, no secrets in startup summary |
| Spam protection | One string honeypot | Three traps (field / timing / link spam) + duplicate suppression, uniform `202 {ok:true}` with jitter |
| Database | Plain connection string, unbounded pool, Prisma query logs | Bounded pool, timeouts, explicit TLS policy, error-only logs, DB `CHECK` constraints |
| Errors | Prisma/stack details could reach clients | One central handler, stable error codes, redacted logs, request ID |
| 404 handling | SPA catch-all (soft 404) and Express default | Real `404.html` with status 404, SPA `NotFound` page, JSON 404 for API, `405 + Allow` |
| Security headers | Helmet defaults only; gaps in COEP/Permissions-Policy and no host-side drift tests | All OWASP-relevant headers explicit on API + SPA, with unit and DAST assertions |
| Security tooling | None | Semgrep rules, npm audit scripts, 95-check DAST suite, Dependabot, SECURITY.md |

**Final results:** unit/integration tests **91/91**, DAST **95/95**, Semgrep **0 findings** (8 project rules and 84 rules in the full community scan), `npm audit` **0 vulnerabilities** in both workspaces, typecheck and production builds clean.

---

## 1. Implemented controls

### 1.1 Server-side input validation — `backend/src/schemas.ts`

- Every field is normalised with `String.normalize('NFC')`, then stripped of C0/C1 control characters (except newline in multiline fields), zero-width characters, soft hyphens and bidirectional overrides — a common way to hide payloads or spoof displayed names.
- Lengths are counted in **Unicode code points** (`[...v].length`), so emoji and non-Latin scripts cannot smuggle oversized values past a byte/UTF-16 check.
- Structured fields use allow-list character classes, not deny-lists:
  - `name`, `profession`, `address`: Unicode letters/marks/numbers plus a small safe punctuation set (`\p{L}\p{M}\p{N}` with `u` flag) — Telugu/Devanagari names work; `<`, `>`, quotes-in-markup, `=`, backticks and `;` never reach the email templates.
  - `email`: RFC-5321-style dot-atom + DNS labels + alphabetic TLD, 3–254 chars, local part ≤ 64, lower-cased.
  - `contact`: digits with optional leading `+`, 7–15 digits, normalised to `+<digits>`.
  - `service`: `z.enum(['NPWT', 'Advanced Dressing', 'Both'])`.
  - `description`: 1–4 000 code points, multiline, no charset restriction (free text is HTML-escaped in `emailTemplates.ts`).
- All request objects use `z.strictObject`, so an unexpected key such as `role: 'admin'` is rejected. `fieldErrors()` expands Zod's single `unrecognized_keys` issue into one message per offending field **without echoing the submitted value**.

### 1.2 API request and payload validation — `backend/src/app.ts`, `middleware/security.ts`

Middleware order is deliberate: request context → Helmet → CORS guard → CORS → no-store → JSON requirement → rate limit → body parser → routes → 404/405 → error handler.

- `requireJson`: POST without `application/json` (or `application/*+json`) gets `415` — before any parsing.
- `express.json({ limit: '20kb', strict: true })`: arrays and primitive roots are rejected.
- `safeReviver` (JSON.parse reviver): throws on `__proto__`, `prototype` and `constructor` keys — prototype pollution is impossible.
- `inspectJson` (raw-body `verify` hook): scans bytes before parsing, caps nesting at depth 8 and requires an object root, defeating JSON bombs.
- Express hardening: `x-powered-by` disabled, ETags disabled, `json escape` enabled, simple query parser (no nested-object injection), `Cache-Control: no-store` on all `/api` responses.
- Helmet: strict CSP (`default-src 'none'` and every fetch directive closed), `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, COOP `same-origin`, COEP `require-corp`, CORP `same-site`, HSTS (63 072 000 s + `includeSubDomains` + `preload`) in production. See §1.11 for the complete OWASP header matrix.
- Two rate-limit tiers: **200 requests / 15 min** for the whole API and **5 submissions / 10 min** per form endpoint, keyed on a normalised IP (IPv6 /56). Every response exposes `RateLimit-Policy`, `RateLimit` and `X-Request-Id`.

### 1.3 CORS — `backend/src/env.ts`, `middleware/security.ts`

- `CORS_ORIGINS` is parsed into canonical origins; `*`, paths, credentials in URLs, non-http(s) schemes and malformed entries make the process **exit at boot**.
- `corsGuard()` runs **before** `cors()` and before any route. A request carrying an `Origin` that is not on the allow-list receives `403 {error:'origin_not_allowed'}` — it never reaches a handler. The opaque `Origin: null` (sandboxed iframes / `file://`) is rejected for the same reason.
- `cors()` reflects only allow-listed origins, allows `GET, POST, OPTIONS` and the headers `Content-Type, Accept`, sets `credentials: false`, and answers preflight with `204`.
- In production every origin must be `https://`; localhost/127.0.0.1 origins are refused. CORS is a browser control — the API has no cookies or bearer tokens, so no CSRF token is needed.

### 1.4 Environment variables and credentials — `backend/src/env.ts`, `lib/logger.ts`

- All 22 environment variables are parsed once by a Zod schema with numeric bounds and enum checks. Invalid config exits with **field names only** — never the offending values.
- Production boot is fail-closed. It refuses to start if:
  - `SMTP_USER`/`SMTP_PASS` are missing,
  - `ADMIN_EMAIL` is not explicitly set (the development default is not accepted),
  - any CORS origin is local or non-HTTPS,
  - the database connection is not TLS (`sslmode=require|verify-ca|verify-full` or `DB_SSL=require`),
  - `DB_SSL_VERIFY=false`, or
  - either direction of the `SMTP_SECURE` / `SMTP_PORT` mismatch (STARTTLS vs implicit TLS) — this check applies in **every** environment, not just production.
- `describeEnv()` emits only non-secret facts (host, SSL mode, pool size, whether SMTP/admin email are configured). Passwords, SMTP credentials and full URLs never appear.
- All `console.*` calls in request paths were replaced by `logger` (JSON lines, level-filtered). `redact()` masks password/token/secret/authorization/cookie keys, masks emails and phone numbers, and strips credentials from connection URLs before logging. IPs are salted SHA-256 hashes, not raw addresses. Query strings and request bodies are never logged.

### 1.5 Honeypot-based spam protection — `backend/src/schemas.ts`, `routes/submissions.ts`, frontend forms

Three independent traps run **before** schema validation so a bot learns nothing about the validation rules:

1. **Hidden field.** The `website` field is `position:absolute; left:-9999px; tabindex=-1; aria-hidden`, visually hidden from humans. `isHoneypot()` treats *any* non-empty value as a hit — string, whitespace-only string, number, boolean, array or object. A bot that fills it cannot pass by sending a different JSON type.
2. **Timing trap.** The client sends `elapsedMs` measured from form mount; submissions faster than `HONEYPOT_MIN_MS` (default 700 ms) are trapped. A human cannot realistically fill six fields that fast.
3. **Link-spam heuristic.** More than 3 URLs (`http(s)://`, `www.`, `t.me/`, `bit.ly/`, `.onion`) in the description or address is trapped.

In-memory duplicate suppression keys on submission kind + email + contact + content, and records the key **only after a successful database write**. Trapped requests are not stored, not emailed, and get the same `202 {ok:true}` with a 150–300 ms jitter so the trap cannot be fingerprinted by response shape or timing. Successful submissions return `201 {ok:true, emailed:boolean}` — the internal record `id` is no longer disclosed.

### 1.6 Secure database connection — `backend/src/db.ts`, `prisma/migrations/20261122000000_security_constraints`

- A single bounded `pg.Pool` (`DB_POOL_MAX` default 10) with 30 s idle timeout, 10 s connection timeout and 10 s statement/query timeouts prevents a stuck query from pinning a request or exhausting connections.
- TLS is explicit (`auto` honours `sslmode` in the URL; `require` sets `rejectUnauthorized` from `DB_SSL_VERIFY`; `disable` is dev-only and blocked by the production gate). Idle/pool/connection errors are logged but cannot crash the process.
- Prisma logs **errors only** — `query` logging would write submitted PII to stdout. All values go through Prisma's parameterised builder; `$queryRaw` appears only as the constant health probe `SELECT 1`.
- DB-level defence in depth: 10 `CHECK ... NOT VALID` constraints enforce the same length/enum rules at the storage layer (existing rows are grandfathered; all new writes are checked), plus indexes on `createdAt` for admin triage. Verified live: a direct `INSERT` with `service='Hacked'` and one with an empty name are both rejected by PostgreSQL.

### 1.7 Error handling without information disclosure — `middleware/security.ts`, `server.ts`

- One central `errorHandler` is the only place an error becomes a response. Clients see stable codes (`invalid_json`, `invalid_payload`, `payload_too_large`, `unsupported_media_type`, `origin_not_allowed`, `rate_limited`, `not_found`, `method_not_allowed`, `server_error`); details go to the redacted log with the request ID.
- Body-parser error taxonomy is mapped explicitly; anything unclassified becomes a generic `500` with no stack, SQL, file path or library name. If headers were already sent the connection is destroyed rather than risking a leaked stack.
- `server.ts` adds request timeouts (15 s default) and graceful shutdown on `SIGTERM`/`SIGINT`; `uncaughtException`/`unhandledRejection` are logged and terminate the process instead of leaving it in an undefined state.
- HTML error pages contain no dynamic content; the built-in 404 page has `<meta name="robots" content="noindex,nofollow">` and an `X-Robots-Tag` header.

### 1.8 Custom 404 pages

- **API:** unknown `/api/*` path → `404 {error:'not_found'}` (JSON) or a branded HTML 404 for `Accept: text/html`. A GET on a write-only endpoint also returns 404 so it cannot be distinguished from a missing route; other unsupported methods get `405` with `Allow: GET, POST, HEAD, OPTIONS`.
- **SPA:** `src/pages/NotFound.tsx` is the catch-all route; `public/404.html` is a static branded page shipped into `dist/`.
- **Netlify:** `netlify.toml` explicitly forwards only the real client routes to `index.html`; everything else is `404` with `/404.html`. There is no soft-404 catch-all to the SPA shell. `robots.txt` and `.well-known/security.txt` are also shipped.

### 1.9 SAST / DAST assets

| Asset | Purpose |
|---|---|
| `.semgrep.yml` | 8 project-specific rules: no raw HTML sinks, no `eval`/`new Function`, no unsafe Prisma raw SQL, no wildcard CORS, no hard-coded secrets, no exception text in responses, no disabled TLS verification, no unescaped email headers |
| `npm run security:sast` / `security:sast:full` | Local rules / local + `p/ci` + `p/typescript` community packs |
| `npm run security:audit` | `npm audit --audit-level=high` in both workspaces |
| `scripts/dast-smoke.mjs` (`npm run dast`) | 95 live checks: full OWASP header set, CORS (incl. suffix/null-origin tricks), content-type/charset/JSON structure, field validation, SQLi/XSS/CRLF payloads, all honeypots, happy paths with DB assertions, rate limits, 404/405, raw-socket path traversal, information disclosure, DB constraints |
| `.github/dependabot.yml` | Weekly npm (root + backend), GitHub Actions and Docker updates |
| `SECURITY.md` | Disclosure process, scope, control summary, command reference |
| `backend/test/security.test.ts` | 38 additional tests covering the above middleware, OWASP headers, `netlify.toml` drift, log redaction and helpers |
| `backend/test/smtp.test.ts` | 13 tests: certificate verification, TLS floor, STARTTLS requirement, disabled file/URL loaders, bounded timeouts, header injection, auto-reply suppression, and boot-gate rejection of unsafe SMTP configs |

### 1.10 Secure SMTP delivery — `backend/src/mailer.ts`

- **Transport TLS:** `secure` and `requireTLS` are derived from the validated `SMTP_SECURE`/`SMTP_PORT` pair (465 = implicit TLS, 587 = STARTTLS). Credentials are never offered on a plaintext connection. `tls.rejectUnauthorized: true` and `minVersion: TLSv1.2` verify the server certificate and hostname — there is no environment variable to weaken this.
- **No attacker-controlled files or URLs:** `disableFileAccess: true` and `disableUrlAccess: true` remove Nodemailer's path/URL loaders. The logo is read from a fixed, code-owned path once at boot and attached as an in-memory buffer, so no request value can ever select a file or remote URL.
- **Immutable addresses:** `SMTP_HOST` is restricted to hostname characters (no spaces, credentials or paths); `SMTP_FROM` must be an address or `Name <address>` with no control characters; `SMTP_USER`/`ADMIN_EMAIL` are checked at boot. Every header value passes through `oneLine()` again before use, so a CRLF from any source becomes a space and cannot inject `Bcc:`/`Content-Type:` headers. Subjects are built from the same normalised name. The MIME output is asserted to contain no injected headers.
- **No reply loops:** both the admin notification and the customer acknowledgement carry `X-Auto-Response-Suppress: OOF, AutoReply, Notification` and distinct `replyTo` values.
- **Failure isolation:** both sends run via `Promise.allSettled`; failures are logged with masked addresses and generic messages and never affect the saved submission or its `201` response.
- **Bounded network exposure:** 10 s connect/greeting and 20 s socket timeouts prevent a slow SMTP server from pinning a request.

### 1.11 HTTP security response headers — OWASP cheat sheet review

Reviewed against [OWASP HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html) (22 Nov 2026). Headers are **explicitly configured** in `backend/src/app.ts`, `middleware/security.ts` and `netlify.toml` rather than inherited from Helmet defaults, so a dependency upgrade cannot silently remove one. A unit test reads `netlify.toml` to prevent configuration drift between the API and the SPA host.

| Header | API | SPA (Netlify) | Notes |
|---|---|---|---|
| `Content-Security-Policy` | `default-src 'none'`; every fetch directive `'none'`; inline style allowed **only** for the static HTML 404 | `script-src 'self'`, `script-src-attr 'none'`, `worker-src 'none'`, `object-src 'none'`, `frame-ancestors 'none'`, strict font/image/connect lists | Inline styles are required by Leaflet/Framer Motion; no inline scripts in `index.html` |
| `Strict-Transport-Security` | Production only: `max-age=63072000; includeSubDomains; preload` | `max-age=63072000; includeSubDomains; preload` | Never emitted over plaintext (test dev server asserts absence). Submit the **apex** to `hstspreload.org` only after verifying the whole zone is HTTPS |
| `X-Content-Type-Options` | `nosniff` | `nosniff` | Correct `Content-Type` + `charset=utf-8` verified for JSON/HTML |
| `X-Frame-Options` | `DENY` | `DENY` | Kept alongside CSP `frame-ancestors 'none'` for legacy browsers |
| `X-XSS-Protection` | `0` | `0` | Explicitly **off**: the legacy auditor can introduce XSS; CSP is the defence |
| `Referrer-Policy` | `no-referrer` (stricter) | `strict-origin-when-cross-origin` | The SPA needs origin-level Referer for normal navigation analytics |
| `Cache-Control` / `Pragma` | `no-store, max-age=0` / `no-cache` | `must-revalidate` for the SPA shell, immutable for hashed `/assets/*` | No API response is stored by shared caches |
| `Set-Cookie` | **Absent** | **Absent** | No sessions, tokens or CSRF cookies; DAST asserts no `Set-Cookie` |
| `Cross-Origin-Opener-Policy` | `same-origin` | `same-origin` | Isolates top-level browsing contexts |
| `Cross-Origin-Embedder-Policy` | `require-corp` | **Deliberately absent** | The SPA loads Google Fonts, ArcGIS tiles and a Google Maps iframe that do not send CORP headers; enforcing COEP would break the site. Revisit after self-hosting those assets. The API loads no subresources, so `require-corp` is safe there |
| `Cross-Origin-Resource-Policy` | `same-site` | `same-origin` | Limits who may embed each response |
| `Permissions-Policy` | 28 features disabled for all origins (`camera`, `microphone`, `geolocation`, `payment`, `usb`, `autoplay`, `midi`, `serial`, `xr-spatial-tracking`, …) | same policy in `netlify.toml` | Helmet 8 has no middleware for this; one frozen value is shared and asserted in tests |
| `X-Robots-Tag` | `noindex, nofollow` on **all** API responses | `noindex, nofollow` on `/404.html` only | The API has nothing indexable; marketing pages stay indexable |
| `X-Permitted-Cross-Domain-Policies` | `none` | `none` | Blocks legacy Flash/PDF cross-domain policy files |
| `X-DNS-Prefetch-Control` | `off` | `off` | Prevents DNS leakage for links/prefetches |
| `X-Download-Options` | `noopen` | N/A (static host) | Legacy IE download execution defence |
| `Origin-Agent-Cluster` | `?1` | N/A | Origin-keyed agent clusters; set by Helmet and asserted |
| `Server` / `X-Powered-By` | No `Server` emitted by Express; `X-Powered-By` removed | Platform banner only (non-informative) | `.NET`-specific `X-AspNet-Version`/`X-AspNetMvc-Version` do not apply |
| `Expect-CT`, `Public-Key-Pins` | **Absent** | **Absent** | Both deprecated; DAST asserts absence |

`Content-Type` is always explicit (Express JSON sets `charset=utf-8`; the built-in 404 sets `text/html; charset=utf-8`), and no user-supplied file is ever served, so the cheat sheet's `Content-Disposition: attachment` rule does not apply.

---

## 2. Pentest / DAST findings and fixes

A live API was started with a disposable local PostgreSQL 18.7 database and the 95-check suite was run. Notable issues discovered and corrected during this engagement:

| # | Finding | Fix |
|---|---|---|
| 1 | Honeypot whitespace (`"   "`) was treated as empty because the check used `trim()` | `isHoneypot()` now treats any string with `length > 0` as a hit; non-string types are also caught |
| 2 | `PUT /api/enquiries` returned `415` instead of `405` because the JSON-content-type guard ran for every non-GET method | `requireJson` now applies only to `POST`; unsupported methods reach the `405 + Allow` handler |
| 3 | Zod's `unrecognized_keys` was reported as one generic `_` error, so clients were not told which extra field was rejected | `fieldErrors()` expands `unrecognized_keys` into per-field messages |
| 4 | `npm audit` reported 3 high-severity transitive issues: `effect@3.20.0` ReDoS (`GHSA-7589-6fvf-x4pw`) via Prisma 7's `@prisma/config`; the suggested fix downgraded Prisma to 6.12.0 (breaking) | Added `overrides: { "effect": "3.22.1" }` in `backend/package.json`. Verified `prisma generate`, `migrate deploy`, typecheck, tests and all 95 DAST checks still pass. Audit is now clean. **Re-validate this override when upgrading Prisma.** |
| 5 | Semgrep config used an invalid YAML scalar and an unsupported `tsx` language identifier | Rewrote with quoted patterns and `typescript` (which covers `.tsx`); both project and community scans now run cleanly |
| 6 | Short-lived test runs collided on the in-memory rate-limit and duplicate-suppression state, producing false failures | DAST suite now randomises source IPs and email addresses per run |
| 7 | Dedicated SMTP follow-up audit found four gaps: a `secure:false` literal that ignored `SMTP_SECURE`, no explicit certificate/TLS-version policy, Nodemailer file/URL loaders left enabled, and unvalidated host/FROM values; auto-replies could also loop | TLS settings now derive from validated env (`secure` + `requireTLS`, `rejectUnauthorized:true`, `minVersion:TLSv1.2`); `disableFileAccess`/`disableUrlAccess` set; logo bytes loaded at boot instead of via a send-time path; `SMTP_HOST`/`SMTP_FROM`/`SMTP_USER` validated at boot; every header passed through `oneLine`; `X-Auto-Response-Suppress` added to both messages. Covered by 13 new tests. |
| 8 | OWASP header review found headers only present by Helmet default (no explicit guarantee), no `Permissions-Policy`, COEP absent, HSTS capped at 1 year without `preload`, no `X-Robots-Tag` on the API and no host-config drift test | All applicable headers set explicitly (see §1.11); frozen `Permissions-Policy`; COEP on the API (documented omission on the SPA); 2-year HSTS; `X-Robots-Tag` on every API response; 14 new DAST checks and 5 new unit tests including a `netlify.toml` assertion. Final live run: **95/95**. |

No exploitable vulnerability remained in the final pass. The DAST suite deliberately includes negative controls: SQLi/XSS/CRLF payloads are confirmed to either get `400` or be stored as inert text, trapped requests are confirmed **not** to add database rows, and direct SQL inserts that violate the `CHECK` constraints are confirmed to fail.

---

## 3. Verification evidence

All commands were run locally on 22 Nov 2026 (Node 24.19.0, npm 11.17.0, PostgreSQL 18.7).

| Check | Command | Result |
|---|---|---|
| Backend unit/integration tests | `cd backend && npm test` | **91 pass / 0 fail** (38 middleware + 28 email + 13 SMTP + 12 API) |
| Backend typecheck | `cd backend && npx tsc -p tsconfig.json --noEmit` | clean |
| Frontend build | `npm run build` | success (`✓ built in 3.06s`); Vite notes one >500 kB chunk (advisory, not a security issue) |
| Lint | `npm run lint` | one pre-existing React warning in `Navbar.tsx` (state in effect); no security findings |
| SAST — project rules | `npm run security:sast` | **0 findings**, 8 rules, 72 targets |
| SAST — community rules | `npm run security:sast:full` | **0 findings**, 84 rules applied, 73 targets |
| Dependency audit (frontend) | `npm audit --audit-level=high` | **0 vulnerabilities** |
| Dependency audit (backend) | `npm audit --omit=dev --audit-level=high` | **0 vulnerabilities** (after the `effect` override) |
| DAST — database up | `BASE=… DB_URL=… npm run dast` | **95/95 checks passed**, re-run after the SMTP + OWASP header hardening |
| DAST — database down | stop PostgreSQL, call health + POST | `/api/health` → **503 `{"status":"unavailable"}`**; valid POST → **500** with generic body and no internals |
| SMTP boot gate | spawn `env.ts` with each unsafe combination | ports 465/587 mismatches, credential-bearing host and CRLF FROM all exit **1** with field names only; correct pair exits **0** |

Representative verified responses:

```
GET /api/health                             200 {"status":"ok"}
GET /api/health  Origin: https://evil.example  403 {"error":"origin_not_allowed"}
POST /api/enquiries  Content-Type: text/plain   415 {"error":"unsupported_media_type"}
POST /api/enquiries  {"__proto__":{...}}        400 {"error":"invalid_payload"}
POST /api/enquiries  {"website":"x"}            202 {"ok":true}   # nothing stored
POST /api/enquiries  valid                      201 {"ok":true,"emailed":false}
GET  /api/does-not-exist                        404 {"error":"not_found"}
PUT  /api/enquiries                             405 Allow: GET, POST, HEAD, OPTIONS
```

Security headers confirmed on every response: `X-Request-Id` (UUID), strict `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 0`, `X-DNS-Prefetch-Control: off`, `X-Download-Options: noopen`, `X-Permitted-Cross-Domain-Policies: none`, `Origin-Agent-Cluster: ?1`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store, max-age=0`, `X-Robots-Tag: noindex, nofollow`, COOP `same-origin`, COEP `require-corp`, CORP `same-site`, a 28-feature `Permissions-Policy`, `Vary: Origin`, and rate-limit metadata. `X-Powered-By`, `Expect-CT`, HPKP and `Set-Cookie` are absent. Full matrix and rationale: §1.11.

---

## 4. Residual risks and recommended operational controls

These are accepted limitations of the current architecture, not open defects:

1. **In-memory rate limiting and duplicate suppression.** Correct for the single `docker-compose` container. If the API is scaled to multiple replicas, back both with Redis or the limits are per-replica.
2. **Honeypots are heuristic.** The timing value is client-supplied and can be forged by a determined bot; it is one of three independent traps, not the only control. If spam persists, add a provider challenge (e.g. Cloudflare Turnstile) or a WAF in front of the API.
3. **Email is best-effort.** If SMTP fails the submission is still saved and `emailed:false` is returned; monitor logs for `mail.*` failures so enquiries are not missed. Certificate verification cannot be disabled by configuration — if the provider uses a private CA, install that CA in the container trust store instead of weakening `tls.rejectUnauthorized`. Email delivery remains subject to the provider's availability and anti-spam reputation.
4. **CSP origin coupling.** The Netlify `connect-src` is hard-coded to `https://api.jirehhealthcaresolutions.com`. Whenever `VITE_API_BASE_URL` changes, `netlify.toml` must be updated in the same deploy or form submissions will be blocked by the browser.
5. **Public policy page.** `public/.well-known/security.txt` points to `/security` and `/security#acknowledgements`; both now resolve to a published page (`src/pages/Security.tsx`, linked from the footer and forwarded by `netlify.toml`). Keep the URL and the `#acknowledgements` anchor stable when redesigning the site.
6. **Prisma override.** `effect@3.22.1` is pinned via `overrides` to remove the CLI-config ReDoS without downgrading Prisma 7. Re-run `npm audit`, `prisma generate`, `migrate deploy` and the test suite after every Prisma upgrade.
7. **npm 11 lifecycle scripts.** npm 11 blocks postinstall scripts by default (`@prisma/engines`, `esbuild`, `prisma`). Approve them explicitly in CI (`npm approve-scripts …` or the project's allow-list) so engines and native binaries are present in production builds.
8. **No authenticated admin surface by design.** There are no read/list endpoints; staff access data through Neon SQL, `prisma studio` or `psql`. Protect those credentials and restrict network access to the database — the application layer offers no second line of defence there.
9. **Chunk size.** The frontend bundle is ~655 kB (200 kB gzipped). Code-splitting would improve load performance but has no direct security impact.

---

## 5. Deployment checklist

- [ ] Copy `backend/.env.example` → `.env`; set a strong `DATABASE_URL` **with TLS**, `ADMIN_EMAIL`, `SMTP_USER`, `SMTP_PASS`, and the exact `CORS_ORIGINS` (https, no trailing slash). Pair SMTP correctly: `587` + `SMTP_SECURE=false`, or `465` + `SMTP_SECURE=true`.
- [ ] Set `NODE_ENV=production` and `TRUST_PROXY` to the real proxy hop count (not `1` blindly).
- [ ] Run `npm ci` in both workspaces, approve required lifecycle scripts, then `npx prisma migrate deploy`.
- [ ] Confirm boot does not exit on the production safety gate; `GET /api/health` returns `200`.
- [ ] Set `VITE_API_BASE_URL` at build time and confirm the Netlify CSP `connect-src` matches it.
- [ ] Run `npm run security:audit`, `npm run security:sast`, `npm test` and the DAST suite against a **disposable** database before shipping.
- [ ] Confirm `/security` and `/security#acknowledgements` resolve (targets of `security.txt`) after the frontend deploy.
- [ ] Keep Dependabot PRs enabled and re-run the checks on every dependency bump.

---

## Appendix — files created or rewritten

**Backend:** `src/env.ts`, `src/app.ts`, `src/server.ts`, `src/db.ts`, `src/schemas.ts`, `src/mailer.ts`, `src/emailTemplates.ts`, `src/middleware/security.ts`, `src/middleware/rateLimit.ts`, `src/lib/logger.ts`, `src/lib/httpError.ts`, `src/lib/dedupe.ts`, `src/routes/submissions.ts`, `test/security.test.ts`, `test/email.test.ts`, `test/smtp.test.ts`, `.env.example`, `package.json`, `prisma/migrations/20261122000000_security_constraints/migration.sql`

**Frontend / repo:** `src/lib/api.ts`, `src/pages/NotFound.tsx`, `src/pages/Security.tsx`, `src/App.tsx`, `src/components/enquiry/EnquiryModal.tsx`, `src/components/services/AppointmentForm.tsx`, `public/404.html`, `public/robots.txt`, `public/.well-known/security.txt`, `src/components/layout/Footer.tsx`, `netlify.toml`, `.gitignore`, `package.json`, `.semgrep.yml`, `SECURITY.md`, `.github/dependabot.yml`, `scripts/dast-smoke.mjs`, `docs/SECURITY-REPORT.md`

**Documentation:** root `README.md` and `backend/README.md` updated for the new environment variables, response shapes and security commands.
