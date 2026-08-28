# SAABIZ Deployment Guide

SAABIZ is a **multi-domain Merchant of Record & Software Monetization Platform**.
Each tenant (software seller) gets its own storefront domain (e.g. `acme.saabiz.com`
or a fully custom domain), while the platform domain (`saabiz.com`) hosts the
marketplace, admin portal, seller portal, and customer portal.

The platform runs **natively** (Node.js + PostgreSQL + Redis) — no Docker required.

---

## Architecture

```
                            Internet
                               │
                     ┌─────────▼──────────┐
                     │   Nginx (TLS/SSL)  │  wildcard *.saabiz.com + tenant custom domains
                     └────┬──────────┬────┘
                          │          │
                   ┌──────▼───┐  ┌───▼────────┐
                   │ Web      │  │ API        │  http://localhost:3000 │ http://localhost:3001
                   │ Next.js  │  │ NestJS     │  (Next proxies /api/* to the API)
                   └──────────┘  └───┬────────┘
                                     │
                        ┌────────────▼───────────┐
                        │ PostgreSQL 17 (native) │  localhost:5432
                        │ Redis (Memurai/Redis)  │  localhost:6379
                        └────────────────────────┘
```

### Multi-domain flow

1. A request arrives for `acme.saabiz.com` (web).
2. `apps/web/src/middleware.ts` resolves the tenant by Host header (cached, 60s)
   against `GET /api/tenants/resolve?host=...`, then sets an `x-tenant-id` header.
3. All client calls go to the **same-origin** `/api/*` path, which is proxied by
   the catch-all route `apps/web/src/app/api/[...path]/route.ts` to the NestJS API
   (`NEXT_PUBLIC_API_URL`), forwarding `x-tenant-id`, `Authorization`, and
   `X-Forwarded-Host`.
4. The API (`apps/api/src/app/tenancy/tenant.service.ts`) builds a
   `TenantContext` (AsyncLocalStorage) and scopes storefront queries
   (products, checkout, payment config, webhooks) to that tenant.
5. A host that resolves to no tenant gets a platform (`x-tenant-id: platform`)
   context; the marketplace and all portals live there.

---

## Prerequisites

- Node.js 20+ (tested on 24)
- pnpm 10+
- PostgreSQL 14+ (tested on 17)
- Redis 6+ (tested on Windows via Memurai Developer, and Redis 7 on Linux)
- Nginx (production)
- SMTP provider (SendGrid, Resend, etc.)
- Paystack and/or Flutterwave account with API keys

---

## Local Development (Windows / Linux / macOS)

### 1. Provision servers natively

- **PostgreSQL** — install natively, create the database:
  ```bash
  createdb saabiz
  ```
- **Redis** — install natively:
  - Windows: install **Memurai Developer** (Redis-compatible service on `localhost:6379`).
  - Linux/macOS: `sudo apt install redis-server` / `brew install redis`.

### 2. Configure environment

```bash
cp .env.example .env
```

Key variables (see `.env.example` for the full list):

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/saabiz?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="generate-a-long-random-string"
NODE_ENV=development

PORT=3001                 # API
WEB_PORT=3000             # Web
NEXT_PUBLIC_API_URL=http://localhost:3001

PLATFORM_DOMAIN=saabiz.com
CORS_ORIGINS=http://localhost:3000,https://saabiz.com

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM="SAABIZ" <noreply@saabiz.com>
```

> `NEXT_PUBLIC_API_URL` is used **server-side only** (Next proxy + middleware).
> The browser never talks to the API directly — all traffic stays same-origin,
> which is what makes per-tenant context propagation work.

### 3. Install, migrate, seed

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate   # runs `prisma migrate dev` for development
# or apply existing migrations:
npx prisma migrate deploy --schema=libs/prisma/schema/schema.prisma
pnpm prisma:seed      # optional demo data (acme + globex tenants)
```

### 4. Local tenant hosts (Windows)

Add to `C:\Windows\System32\drivers\etc\hosts` (as Administrator):

```
127.0.0.1 acme.saabiz.com
127.0.0.1 globex.saabiz.com
```

Or just run `.\dev.ps1 -hosts` from the repo root (elevated).

### 5. Run

```bash
pnpm run dev:all          # API (:3001) + Web (:3000) concurrently
# or individually:
pnpm run dev:api
pnpm run dev:web
```

Verify:

| URL | What |
|-----|------|
| http://localhost:3000 | Platform homepage / marketplace |
| http://localhost:3000/api/docs | Swagger (dev) |
| http://localhost:3001/api/health | API health |
| http://acme.saabiz.com:3000 | Acme tenant storefront |
| http://globex.saabiz.com:3000 | Globex tenant storefront |

Storefront products/checkout are scoped per host — `acme.saabiz.com` only shows
Acme products, etc.

---

## Production Deployment (Linux)

### Step 1 — System dependencies

```bash
sudo apt update && sudo apt install -y nginx postgresql redis-server
```

### Step 2 — App user & clone

```bash
sudo useradd -m -s /bin/bash saabiz
sudo git clone https://github.com/your-org/saabiz.git /opt/saabiz
sudo chown -R saabiz:saabiz /opt/saabiz
```

### Step 3 — Node + pnpm (as app user)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
corepack enable && corepack prepare pnpm@10 --activate
```

### Step 4 — PostgreSQL + Redis

```bash
sudo systemctl enable --now postgresql redis-server
sudo -u postgres createdb saabiz
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'change-me';"
```

### Step 5 — Build

```bash
cd /opt/saabiz
pnpm install
npx prisma migrate deploy --schema=libs/prisma/schema/schema.prisma
pnpm build   # nx build api + web
```

### Step 6 — Run as services (systemd)

**API** — `/etc/systemd/system/saabiz-api.service`:

```ini
[Unit]
Description=SAABIZ API
After=network.target postgresql.service redis-server.service

[Service]
User=saabiz
WorkingDirectory=/opt/saabiz
Environment=NODE_ENV=production
ExecStart=/opt/saabiz/node_modules/.bin/nx run api:serve
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Web** — `/etc/systemd/system/saabiz-web.service` (same shape, `nx run web:serve`).

```bash
sudo systemctl enable --now saabiz-api saabiz-web
```

> In production, build with `pnpm build` and serve the compiled output via
> `node apps/api/dist/main.js` and `next start apps/web` (or Nginx-proxied
> standalone output) — see `project.json` targets. `nx serve` is fine for
> single-node deployments; for scale-out use PM2 cluster mode.

### Step 7 — Nginx + SSL (multi-domain)

Wildcard certificate for `*.saabiz.com` plus your tenant custom domains:

```nginx
server {
  listen 80;
  server_name saabiz.com *.saabiz.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name saabiz.com *.saabiz.com;

  ssl_certificate     /etc/letsencrypt/live/saabiz.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/saabiz.com/privkey.pem;

  client_max_body_size 20m;

  location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

Generate certificates:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d saabiz.com -d "*.saabiz.com"
```

For a tenant's **custom domain** (e.g. `software.acme.co`), point that domain's
DNS at the server (A/CNAME) and include it in the Nginx `server_name` + certificate.

### Step 8 — DNS records

| Type | Name | Value |
|------|------|-------|
| A | `@` | SERVER_IP |
| A | `*` | SERVER_IP |
| A | `api` | SERVER_IP |
| CNAME | `www` | `@` |

Tenant custom domains: CNAME to `saabiz.com` (or A record to SERVER_IP).

### Step 9 — Webhooks & payment config

1. Log in to `https://saabiz.com/platform-admin/payments` (admin).
2. Enter Paystack/Flutterwave keys; toggle active; save.
3. Tenant-specific payment configs are managed per tenant via the same screen
   (`?tenantId=` query) or the tenant admin.
4. Configure webhooks in the gateway dashboards:

```
Paystack:    https://saabiz.com/api/webhooks/paystack
Flutterwave: https://saabiz.com/api/webhooks/flutterwave
```

> Webhook signature verification iterates all payment configs (platform + each
> tenant), so webhooks work for every tenant from a single URL.

### Step 10 — Email

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

Alternative (Resend):

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_xxx
```

### Step 11 — Backups

```bash
# PostgreSQL
pg_dump -U saabiz saabiz > /backups/saabiz_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql -U saabiz saabiz < /backups/saabiz_YYYYMMDD.sql
```

Automate with cron:

```cron
0 3 * * * pg_dump -U saabiz saabiz | gzip > /backups/saabiz_$(date +\%Y\%m\%d).sql.gz
```

### Monitoring (Windows / Linux)

Windows (native dev machine):
- `scripts/monitor.ps1` — probes `:3001/api/health` (+ `/db`, `/redis`) and
  `:3000`; exit 0 = healthy, 1 = degraded.
- `scripts/backup-db.ps1` — pg_dump → gzip (.NET, no external gzip needed),
  14-file retention into `backups/`.
- `scripts/setup-windows-automation.ps1` (elevated) — registers scheduled
  tasks: `SAABIZ-DailyBackup` (03:00) and `SAABIZ-Monitor` (every 10 min).
- Shortcuts: `pnpm backup:db`, `pnpm monitor`.

Linux production:
```cron
*/10 * * * * cd /opt/saabiz && ./scripts/monitor.sh  # (or curl the health endpoints + alert)
```
Wrap the probe in a script that emails/notifies on non-zero exit (e.g. via
`msmtp`, `curl` to a healthcheck service, or Sentry alerts — Sentry is
enabled automatically when `SENTRY_DSN` is set in the environment).

---

## Production Checklist

### Security
- [ ] Long random `JWT_SECRET`; different values in each environment
- [ ] TLS with wildcard certificate; HSTS header
- [ ] Firewall (ufw): allow 22, 80, 443 only
- [ ] fail2ban enabled
- [ ] Rate limiting on API (enabled by default in `main.ts`)
- [ ] `NODE_ENV=production` (Swagger disabled, `JWT_SECRET` enforced)
- [ ] Restrict `CORS_ORIGINS` to real origins

### Operations
- [ ] Log rotation (`LOG_DIR`, winston daily rotate)
- [ ] Uptime monitoring + error alerting
- [ ] Daily DB backups, tested restore
- [ ] `pg_hba.conf` tuned (SSL on; no `hostssl`-without-`ssl` warnings)

### Multi-tenant
- [ ] `PLATFORM_DOMAIN` correct; wildcard DNS + cert for `*.saabiz.com`
- [ ] Tenant custom domains added to `Domain` table (admin) + Nginx `server_name`
- [ ] Test each storefront: products list, checkout config, webhook replay

---

## Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| API won't start: `Can't reach database server` | PostgreSQL not running / still recovering. `systemctl status postgresql`; check `data/log/postgresql-*.log` for `database system is ready to accept connections` |
| Storefront shows platform products | Tenant host not resolving — check `GET /api/tenants/resolve?host=<tenant-host>`; ensure Host header reaches the API (Nginx `Host $host`), or the `Domain` row is active |
| Storefront returns 404 `Unknown storefront domain` | Host resolves to a tenant that is inactive or has no product |
| Webhooks 400 | Payment config `webhookSecret` mismatch; verify the tenant's config in the DB |
| Checkout redirects to wrong URL | `flutterwave.service.ts` uses `TenantService.frontendUrl()`; ensure tenant primary domain is set (`isPrimary`) |
| CORS errors in browser | Origin must be in `CORS_ORIGINS`, end with `.<platform-domain>`, or be a known tenant host |

---

## Support

- [GitHub Issues](https://github.com/your-org/saabiz/issues)
- See also `docs/plan.md` (roadmap) and `docs/tasks.md` (work log)
