# Jireh Healthcare Solutions

Company website (React 19 + Vite + Tailwind CSS v4 + Framer Motion) with an Express/TypeScript backend that stores
enquiries and appointment requests in PostgreSQL (Neon) and sends email notifications through Gmail SMTP.

```
.
├── src/                 frontend (React + Vite)
├── backend/             API (Express 5, Prisma 7, Nodemailer, Zod) — see backend/README.md
├── docker-compose.yml   API + self-hosted PostgreSQL for a future VPS
└── .env.example         POSTGRES_PASSWORD for docker-compose
```

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
| `ADMIN_EMAIL` | Who receives notifications (default `the.masked.as@gmail.com`) |
| `CORS_ORIGINS` | Allowed site origins, default `http://localhost:5173` |

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

## Production

- **Frontend:** build with `npm run build` and host `dist/` (a `netlify.toml` is included). Set
  `VITE_API_BASE_URL` to the API's public URL at build time and add the site's origin to the backend's `CORS_ORIGINS`.
- **Backend on a VPS:** `docker compose up -d --build` runs the API and PostgreSQL with persistent volumes and health
  checks. Setup and the Neon-to-VPS backup/restore procedure are in [backend/README.md](backend/README.md).

## Security

Never commit `.env` files. `.env` and `backend/.env` are git-ignored; only the `.env.example` templates are tracked.
