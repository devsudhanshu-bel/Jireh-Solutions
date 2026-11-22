# Jireh backend

Express 5 + TypeScript + Prisma 7 (PostgreSQL) + Nodemailer (Gmail SMTP) + Zod.

See [docs/TECH-STACK-AND-LOCAL-SETUP.md](../docs/TECH-STACK-AND-LOCAL-SETUP.md) for full setup and
[docs/SECURITY-CHANGES.md](../docs/SECURITY-CHANGES.md) for the security changelog.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/enquiries` | `name, contact, email, profession, description` |
| `POST /api/bookings` | `name, contact, email, address (optional), service` (`NPWT`, `Advanced Dressing`, `Both`) |
| `GET /api/health` | 200 when the database answers, 503 otherwise |

There are intentionally no read/list/admin endpoints. View data with Neon's SQL editor, `npx prisma studio`, or `psql`.

Each submission is validated, saved, then two emails are sent (all details to `ADMIN_EMAIL`, acknowledgement to the customer).
If SMTP fails the row is already saved: the failure is logged and the API still returns 201 with `emailed: false`.

Responses: `201 {ok:true, emailed:boolean}` on success, `202 {ok:true}` when a spam trap or duplicate suppression fires
(nothing stored or emailed — the response deliberately looks like success), `400 {error:'validation', fields:{…}}` for
field errors, `403 {error:'origin_not_allowed'}` for a disallowed `Origin`, plus stable codes for 404/405/413/415/429/500.
No internal record IDs, stack traces or database details are ever returned.

**Controls:** Unicode-normalising strict Zod schemas; 20 kB body cap, depth ≤ 8, prototype-pollution and JSON-root guards;
three spam traps (hidden `website` field, `<700 ms` timing, >3 links) plus duplicate suppression; 5 submissions / 10 min /
IP and 200 requests / 15 min / IP; CORS allow-list; redacted structured JSON logs; bounded TLS database pool with
statement timeouts and DB `CHECK` constraints. Email is sent only over verified TLS
(587 STARTTLS or 465 implicit TLS) with Nodemailer's file/URL loaders disabled, CRLF-safe
headers and auto-reply suppression. See [../docs/SECURITY-REPORT.md](../docs/SECURITY-REPORT.md).

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

Other supported variables (all documented in `.env.example`): `DB_POOL_MAX`, `DB_CONNECTION_TIMEOUT_MS`,
`DB_STATEMENT_TIMEOUT_MS`, `DB_SSL` (`auto`/`require`/`disable`), `DB_SSL_VERIFY`, `HONEYPOT_MIN_MS`, `MAX_BODY_KB`,
`REQUEST_TIMEOUT_MS`, `TRUST_PROXY`, `SMTP_*`, `LOG_LEVEL`, `NODE_ENV`, `PORT`.

**Boot is fail-closed:** the process exits if SMTP credentials or an explicit `ADMIN_EMAIL` are missing, if any
CORS origin is local or non-HTTPS, if the database connection is not TLS with certificate verification, or if the
SMTP TLS pair is wrong (`587` needs `SMTP_SECURE=false`; `465` needs `SMTP_SECURE=true`). Certificate verification
cannot be disabled by configuration; add a private CA to the container trust store instead. In production the first
three conditions are mandatory; the SMTP pair is checked in every environment. Set `NODE_ENV=production` only after
satisfying all of these.

Security checks: `npm run security:audit`, `npm run security:sast`, `npm run security:sast:full`. From the repo root,
`npm run dast` runs the 95-check live suite (incl. OWASP headers) against a disposable database (`BASE` / `DB_URL` env vars).

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
