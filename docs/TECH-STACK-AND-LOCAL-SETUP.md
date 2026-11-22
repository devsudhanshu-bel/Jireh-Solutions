# Tech Stack & Local Setup

**Project:** Jireh Healthcare Solutions — marketing website + submission API.
**Last updated:** 22 November 2026.

Everything you need to understand what the project is built with and run it on your own
machine. For security controls and verification, see [SECURITY-REPORT.md](SECURITY-REPORT.md)
and [SECURITY-CHANGES.md](SECURITY-CHANGES.md).

---

## 1. What this project is

A public marketing site for a healthcare solutions company. Visitors can submit an
**enquiry** or book an **appointment** through two forms. The frontend collects the
details, a small Express API validates and stores them in PostgreSQL, and Nodemailer
sends an admin notification plus a customer acknowledgement. Email is best-effort — a
send failure is logged but never loses the saved submission.

There is **no login, no user accounts, no admin UI and no public read API**. All credentials
are server-side environment variables.

```
Browser (React SPA)
        │  POST /api/enquiries | /api/bookings  (JSON)
        ▼
Vite dev proxy  →  Express API (:4000)
                       │  Zod validation + spam traps + rate limit
                       ├──► PostgreSQL (Prisma 7 / @prisma/adapter-pg)
                       └──► Gmail SMTP (Nodemailer, TLS)
Production: dist/ on Netlify (netlify.toml)  +  API in Docker on a VPS (docker-compose.yml)
```

---

## 2. Tech stack

### Frontend (`src/`)

| Concern | Choice |
|---|---|
| UI library | React 19 (`react`, `react-dom`) |
| Build tool | Vite 8 (`vite`, `@vitejs/plugin-react`) |
| Language | TypeScript 7 (strict, project references via `tsconfig*.json`) |
| Styling | Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`) — CSS-first config in `src/index.css` |
| Animation | Framer Motion 14 (`framer-motion`, wrappers in `src/lib/motion.ts`) |
| Maps | Leaflet 1.9 + React Leaflet 5 (`leaflet`, `react-leaflet`) and a Google Maps iframe |
| Routing | Custom lightweight router (`src/lib/router.ts`, `RouterProvider.tsx`) — no react-router |
| Linting | oxlint (`.oxlintrc.json`) |
| Forms | Plain React state + hidden honeypot fields; posts through `src/lib/api.ts` |
| Data | Static content modules in `src/data/` (`site`, `about`, `services`, `airway`, `partners`, `woundCare`) |

Key files: `src/App.tsx` (routes), `src/pages/*` (pages incl. `NotFound`, `Security`),
`src/components/*` (layout, sections, forms, UI primitives), `src/lib/api.ts` (API client,
reads `VITE_API_BASE_URL`).

### Backend (`backend/`)

| Concern | Choice |
|---|---|
| Runtime | Node.js ≥ 22, ESM (`"type": "module"`) |
| Server | Express 5 |
| Validation | Zod 4 (`strictObject` schemas in `src/schemas.ts`) |
| ORM | Prisma 7 with the `@prisma/adapter-pg` driver adapter (`prisma.config.ts`, `prisma/schema.prisma`) |
| Database driver | `pg` 8 (bounded `Pool`, configured in `src/db.ts`) |
| Email | Nodemailer 10 (`src/mailer.ts`, HTML/text templates in `src/emailTemplates.ts`) |
| Security middleware | Helmet 8 + `express-rate-limit` 8 + custom middleware in `src/middleware/security.ts` |
| Env validation | `dotenv` 18 + a Zod schema in `src/env.ts` (fails closed) |
| Dev runner | `tsx` (watch mode) |
| Tests | Node's built-in test runner via `tsx --test` (`backend/test/*.test.ts`) |

### Database schema

Two Prisma models, in `backend/prisma/schema.prisma`:

- **`Enquiry`** — `name`, `contact`, `email`, `profession`, `description`, `createdAt`.
- **`Booking`** — `name`, `contact`, `email`, `address?`, `service`, `createdAt`.

Migrations (apply in order):

1. `20261121000000_init` — creates the tables.
2. `20261122000000_security_constraints` — adds `CHECK` constraints and indexes.

Prisma client is generated into `backend/src/generated/prisma/` (git-ignored).

### Infrastructure & tooling

| Item | Purpose |
|---|---|
| `netlify.toml` | Hosts the built SPA: HTTPS redirects, SPA→`404.html` fallback, security headers, immutable asset caching, `/security` forward |
| `docker-compose.yml` | API + self-hosted PostgreSQL for a VPS (persistent volumes, health checks) |
| `backend/Dockerfile` | Multi-stage API image (install → `prisma generate` + compile → run) |
| `.semgrep.yml` | 8 project-specific SAST rules |
| `scripts/dast-smoke.mjs` | 95-check live DAST smoke suite |
| `.github/dependabot.yml` | Weekly npm + GitHub Actions dependency updates |
| `SECURITY.md`, `public/.well-known/security.txt` | Vulnerability disclosure policy (site page: `/security`) |

---

## 3. Prerequisites

- **Node.js 22+** and npm (the backend declares `engines.node >= 22`).
- **PostgreSQL** — a Neon project is convenient; any PostgreSQL works locally. For a local
  container only setup, `docker-compose.yml` is provided.
- **Gmail account with an [App Password](https://myaccount.google.com/apppasswords)** — optional
  in development. Without SMTP credentials, submissions are still stored but no mail is sent.
- npm 11 note: lifecycle scripts for `@prisma/engines`, `esbuild` and `prisma` are blocked by
  default. Approve them (`npm config set allow-scripts` / interactive approval) in CI and
  production installs, or `prisma generate` and the Vite build will lack their binaries.

---

## 4. Run locally (two terminals)

Both servers must run for the forms to work. With only the frontend, submissions fail
because there is no backend for Vite to proxy `/api` to.

### Terminal 1 — API (http://localhost:4000)

```bash
cd backend
npm install
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
```

Edit `backend/.env` (minimum for local development):

| Variable | Local value |
|---|---|
| `DATABASE_URL` | `postgresql://jireh:change-me@localhost:5432/jireh` (Neon: the **pooled** host) |
| `DIRECT_URL` | Optional; Neon **direct** host used for migrations |
| `DB_SSL` | `auto` (honours `sslmode` in the URL); `disable` for a plaintext local DB; `require` for Neon |
| `DB_SSL_VERIFY` | `true` (production refuses `false`) |
| `CORS_ORIGINS` | `http://localhost:5173` |
| `SMTP_USER` / `SMTP_PASS` | Gmail address + 16-char App Password (optional locally) |
| `SMTP_PORT` / `SMTP_SECURE` | `587` + `false` (STARTTLS) **or** `465` + `true` — must be paired |
| `ADMIN_EMAIL` | Notification recipient (required explicitly in production) |

Then create the tables and start the API:

```bash
npm run migrate:deploy       # applies both migrations
npm run dev                  # tsx watch src/server.ts
```

Verify: <http://localhost:4000/api/health> returns `{"status":"ok"}` when the DB responds,
`503` when it does not. A misconfigured environment makes the process **refuse to boot**
with an `Unsafe configuration:` message listing the offending field names.

### Terminal 2 — frontend (http://localhost:5173)

From the repository root:

```bash
npm install
npm run dev
```

`vite.config.ts` proxies `/api/*` → `http://localhost:4000`, so no frontend env var is
needed in development. Open <http://localhost:5173>.

---

## 5. Commands reference

### Root (`package.json`)

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server on :5173 (proxies `/api`) |
| `npm run build` | `tsc -b` + production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | oxlint |
| `npm run security:audit` | `npm audit --audit-level=high` |
| `npm run security:sast` | Semgrep with the 8 project rules (`src` + `backend/src`) |
| `npm run security:sast:full` | Project rules + `p/ci` + `p/typescript` community rules |
| `npm run dast` | 95-check live DAST suite (needs a running API + `DB_URL`; **disposable DB only** — it inserts rows) |

### Backend (`backend/package.json`)

| Command | Purpose |
|---|---|
| `npm run dev` | `tsx watch src/server.ts` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | All backend tests (no DB or email needed) |
| `npm run test:security` | Security/middleware tests only |
| `npm run build` / `npm start` | `prisma generate` + compile, then run `dist/server.js` |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run migrate:dev` / `migrate:deploy` | Create/apply migrations |
| `npm run security:audit` / `security:sast` / `security:sast:full` | Backend-scoped security checks |
| `npx prisma studio` | Browse saved enquiries and bookings |

### Running the DAST suite

```bash
# with the API above running and a throwaway PostgreSQL database:
BASE=http://127.0.0.1:4000 DB_URL='postgresql://jireh:testpass@127.0.0.1:55432/jireh' npm run dast
```

It writes test rows and asserts they land, so never point it at production or a database
you care about. The API should be started with `TRUST_PROXY=1` when the suite supplies
`X-Forwarded-For` IPs; otherwise `express-rate-limit` warns and per-IP checks fail.

---

## 6. Configuration reference

All backend variables are validated in `backend/src/env.ts`; the authoritative, commented
template is `backend/.env.example`. Production additionally requires: HTTPS-only
`CORS_ORIGINS` (no localhost), an explicit `ADMIN_EMAIL`, configured SMTP credentials, a
TLS database, `DB_SSL_VERIFY=true`, and a correct SMTP port/`SMTP_SECURE` pair.

Frontend build-time variable: `VITE_API_BASE_URL` — set it to the API's public URL when
building for production. **Keep it in sync with the Netlify CSP `connect-src`** in
`netlify.toml` (currently `https://api.jirehhealthcaresolutions.com`).

Other tunables: `PORT`, `LOG_LEVEL`, `DB_POOL_MAX`, `DB_CONNECTION_TIMEOUT_MS`,
`DB_STATEMENT_TIMEOUT_MS`, `TRUST_PROXY` (reverse-proxy hops), `MAX_BODY_KB`,
`REQUEST_TIMEOUT_MS`, `HONEYPOT_MIN_MS`.

Never commit `.env` or `backend/.env` — both are git-ignored; only `.env.example` files are tracked.

---

## 7. Production notes (brief)

- **Frontend:** `npm run build`, host `dist/`. `netlify.toml` supplies redirects, the SPA
  404 fallback, security headers and caching. Set `VITE_API_BASE_URL` at build time.
- **Backend:** `docker compose up -d --build` runs the API + PostgreSQL. The Neon-to-VPS
  backup/restore procedure and Docker setup are in [backend/README.md](../backend/README.md).
- **Domains:** add the site origin to `CORS_ORIGINS`; submit the apex to `hstspreload.org`
  only after confirming the whole zone is HTTPS.
- **Security:** the fail-closed boot gate, header policy and spam/rate-limit controls are
  documented in [SECURITY-REPORT.md](SECURITY-REPORT.md). Report issues per
  [SECURITY.md](../SECURITY.md) (published at `/security`).
