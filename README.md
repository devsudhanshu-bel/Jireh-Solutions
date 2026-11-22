# Jireh Healthcare Solutions

Company website (React 19 + Vite + Tailwind CSS v4 + Framer Motion) with an Express/TypeScript backend that stores
enquiries and appointment requests in PostgreSQL (Neon) and sends email notifications through Gmail SMTP.

```
.
├── src/                 frontend (React + Vite)
├── backend/             API (Express 5, Prisma 7, Nodemailer, Zod) — see backend/README.md
├── docs/                security report, security changelog, tech stack & local setup
├── scripts/             live DAST smoke suite
├── docker-compose.yml   API + self-hosted PostgreSQL for a future VPS
├── SECURITY.md          vulnerability disclosure policy
└── .env.example         POSTGRES_PASSWORD for docker-compose
```

**Documentation**

- [docs/TECH-STACK-AND-LOCAL-SETUP.md](docs/TECH-STACK-AND-LOCAL-SETUP.md) — full stack overview and step-by-step local setup.
- [docs/SECURITY-CHANGES.md](docs/SECURITY-CHANGES.md) — scannable changelog of every security change.
- [docs/SECURITY-REPORT.md](docs/SECURITY-REPORT.md) — implementation, pentest findings and verification evidence.

## Prerequisites

- Node.js 22 or newer and npm
- A PostgreSQL database (a Neon project works) and, for email, a Gmail account with an
  [App Password](https://myaccount.google.com/apppasswords)

## Quick start (two terminals)

Both servers must be running for the forms to work. If only the frontend runs, form submissions fail with
`502 Bad Gateway` because Vite has no backend to proxy `/api` to.

### 1. Backend — http://localhost:4000

```bash
cd backend
npm install
cp .env.example .env     # on Windows PowerShell: Copy-Item .env.example .env
```

Edit `backend/.env`:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (Neon: the pooled one) |
| `DIRECT_URL` | Optional. Neon direct (non-pooled) string used for migrations |
| `SMTP_USER` / `SMTP_PASS` | Gmail address and App Password. Optional in development: without them submissions are still saved, but no emails are sent |
| `ADMIN_EMAIL` | Who receives notifications. Development default `the.masked.as@gmail.com`; **must be set explicitly in production** |
| `CORS_ORIGINS` | Comma-separated allowed origins, default `http://localhost:5173`. Production requires HTTPS origins only — see `backend/.env.example` for the TLS/pool/logging options |

Then create the tables (once, and after pulling new migrations) and start the API:

```bash
npm run migrate:deploy
npm run dev
```

Check it: <http://localhost:4000/api/health> should return `{"status":"ok"}`.

### 2. Frontend — http://localhost:5173

From the repository root:

```bash
npm install
npm run dev
```

Vite proxies `/api/*` to `http://localhost:4000`, so no frontend configuration is needed in development.

## Useful commands

| Where | Command | Purpose |
| --- | --- | --- |
| root | `npm run build` | Type-check and build the frontend into `dist/` |
| root | `npm run lint` | Lint the frontend |
| root | `npm run preview` | Serve the production build locally |
| root | `npm run security:audit` | Dependency vulnerability scan (fails on high/critical) |
| root | `npm run security:sast` / `security:sast:full` | Semgrep project rules / project + community rules |
| root | `npm run dast` | 95 live API checks incl. the OWASP header set (needs a running API and `DB_URL` — disposable DB only) |
| `backend/` | `npm test` | Run backend tests (no database or email needed) |
| `backend/` | `npm run typecheck` | Type-check the backend |
| `backend/` | `npm run build` / `npm start` | Compile and run the production server |
| `backend/` | `npx prisma studio` | Browse saved enquiries and bookings |

## API

| Endpoint | Purpose |
| --- | --- |
| `POST /api/enquiries` | `name, contact, email, profession, description` |
| `POST /api/bookings` | `name, contact, email, address (optional), service` (`NPWT`, `Advanced Dressing`, `Both`) |
| `GET /api/health` | 200 when the database responds, 503 otherwise |

Every submission is validated, saved, then emailed to the admin with an acknowledgement to the customer. If email fails
the saved record is kept and the failure is logged. There are no public read endpoints.

Responses: `201 {ok:true, emailed:boolean}` on success, `202 {ok:true}` for a spam-trapped or duplicate submission
(nothing stored), `400` with per-field messages for validation errors, `403` for a disallowed `Origin`, and stable
machine codes for all other errors. No internal IDs or error details are returned.

## Production

- **Frontend:** build with `npm run build` and host `dist/` (a `netlify.toml` is included). Set
  `VITE_API_BASE_URL` to the API's public URL at build time and add the site's origin to the backend's `CORS_ORIGINS`.
- **Backend on a VPS:** `docker compose up -d --build` runs the API and PostgreSQL with persistent volumes and health
  checks. Setup and the Neon-to-VPS backup/restore procedure are in [backend/README.md](backend/README.md).

## Security

Never commit `.env` files. `.env` and `backend/.env` are git-ignored; only the `.env.example` templates are tracked.

Server-side validation, CORS allow-listing, honeypot/duplicate spam traps, TLS database configuration, redacted logging,
fail-closed production checks, and custom 404 pages are all implemented. The full control list, pentest findings,
fixes and verification evidence are in [docs/SECURITY-REPORT.md](docs/SECURITY-REPORT.md). To report a vulnerability,
follow [SECURITY.md](SECURITY.md) (published on the site at `/security` and at `/.well-known/security.txt`). Unknown site routes serve a real
`404.html`; unknown API routes return JSON 404.
