# Jireh backend

Express 5 + TypeScript + Prisma 7 (PostgreSQL) + Nodemailer (Gmail SMTP) + Zod.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/enquiries` | `name, contact, email, profession, description` |
| `POST /api/bookings` | `name, contact, email, address (optional), service` (`NPWT`, `Advanced Dressing`, `Both`) |
| `GET /api/health` | 200 when the database answers, 503 otherwise |

There are intentionally no read/list/admin endpoints. View data with Neon's SQL editor, `npx prisma studio`, or `psql`.

Each submission is validated, saved, then two emails are sent (all details to `ADMIN_EMAIL`, acknowledgement to the customer).
If SMTP fails the row is already saved: the failure is logged (`[mail] ...`) and the API still returns 201 with `emailed: false`.
Spam protection: strict schemas, 20 kB body limit, 5 submissions / 10 min / IP, 200 requests / 15 min / IP, CORS allow-list,
and a hidden `website` honeypot field (filled = HTTP 202, nothing stored or emailed).

## Setup

```bash
cd backend
cp .env.example .env      # fill DATABASE_URL, DIRECT_URL, SMTP_USER, SMTP_PASS (Gmail App Password)
npm install
npm run migrate:deploy    # applies prisma/migrations to the database in .env
npm run dev               # http://localhost:4000
```

Frontend (repo root): `npm run dev`. Vite proxies `/api` to `localhost:4000`. For production builds set
`VITE_API_BASE_URL=https://api.your-domain` and add the site origin to `CORS_ORIGINS`.

Neon: `DATABASE_URL` = pooled string (`-pooler` host), `DIRECT_URL` = direct string; only `prisma migrate` uses `DIRECT_URL`.
`npm test` runs the database-independent API tests. `npm run typecheck` / `npm run build` for the compiler.

## Docker / VPS

From the repo root: copy `.env.example` to `.env` (set `POSTGRES_PASSWORD`), prepare `backend/.env` (SMTP, `CORS_ORIGINS`,
`TRUST_PROXY=1`), then `docker compose up -d --build`. The `api` container applies migrations on start, uses the
`pgdata` volume-backed `db` container instead of Neon, and both services have health checks. Terminate TLS with nginx/Caddy
in front of `127.0.0.1:4000`.

## Migrating Neon -> self-hosted PostgreSQL

The schema uses only standard PostgreSQL features, so no code changes are needed; only `DATABASE_URL` changes.

1. Back up Neon (use the **direct** connection string; use a `pg_dump` major version >= the server's):
   ```bash
   pg_dump "$NEON_DIRECT_URL" --format=custom --no-owner --no-privileges --file=jireh.dump
   ```
2. Start the VPS database: `docker compose up -d db`
3. Restore into it:
   ```bash
   docker compose cp jireh.dump db:/tmp/jireh.dump
   docker compose exec db pg_restore -U jireh -d jireh --no-owner --clean --if-exists /tmp/jireh.dump
   ```
   The dump includes the `_prisma_migrations` table, so `migrate deploy` will see everything as already applied.
4. Verify row counts match: `SELECT count(*) FROM enquiries; SELECT count(*) FROM bookings;` on both sides.
5. `docker compose up -d --build api`, check `GET /api/health`, then point the frontend at the new API.
6. To avoid losing submissions during cutover, pause the site (or accept a short maintenance window) between step 1 and step 5,
   then keep the Neon project for a few days before deleting it.

Routine backups on the VPS: a cron job running
`docker compose exec -T db pg_dump -U jireh -Fc jireh > /backups/jireh-$(date +%F).dump`, copied off the server.
