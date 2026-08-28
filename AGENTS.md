# SAABIZ Development Notes

Mission-critical context for AI agents and developers working on SAABIZ.

## Stack & Architecture

- **Monorepo**: Nx 20, TypeScript 5.5, pnpm 10
- **API**: NestJS 10 at `apps/api` (global prefix `/api`, port 3001)
- **Web**: Next.js 14 (App Router) at `apps/web` (port 3000)
- **DB**: Prisma 5 + PostgreSQL 17 **native** (localhost:5432, database `saabiz`)
- **Cache**: Redis via **Memurai** (Windows) at `redis://localhost:6379`
- **No Docker** — Postgres + Redis run as native services

## Multi-Domain Tenant Model (core concept)

- `Tenant` / `Domain` models in `libs/prisma/schema/schema.prisma`;
  `Seller.tenantId` and `PlatformConfig.tenantId` link tenants to their data.
- **Platform host** `saabiz.com` (and `localhost`): marketplace + all portals.
- **Tenant hosts** `*.saabiz.com` subdomains or custom domains: branded storefronts.
- Request flow:
  1. Web `apps/web/src/middleware.ts` resolves host → tenant (cached 60s)
     via `GET /api/tenants/resolve?host=`, injects `x-tenant-id` header.
  2. Browser calls **same-origin** `/api/*`; catch-all proxy
     `apps/web/src/app/api/[...path]/route.ts` forwards to the API with
     `x-tenant-id`, `Authorization`, `X-Forwarded-Host`.
  3. API `TenantService.runForRequest` (AsyncLocalStorage) scopes storefront
     queries. `scopeTenantId()` — **null = unknown storefront (404)**,
     **undefined = platform scope**.
- **Never hardcode `http://localhost:3001` in web client code** — use
  `apps/web/src/lib/api.ts` (`api.get/post/put/patch/delete`), it is same-origin.

## Environment (.env at repo root; `.env.example` is the committed template)

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/saabiz?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3001
WEB_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001        # used ONLY server-side (proxy/middleware)
PLATFORM_DOMAIN=saabiz.com
CORS_ORIGINS=http://localhost:3000,https://saabiz.com
FRONTEND_URL=http://localhost:3000               # email link fallback
JWT_SECRET=...
NODE_ENV=development
```

## Running

```bash
.\dev.ps1 -servers        # Windows: checks deps, hosts entries, starts api + web
pnpm dev:api              # API watch mode :3001 (slow first compile ~3 min on this machine)
pnpm dev:web              # Next dev :3000 (cold start can take 10+ min; reuse .next cache)
pnpm build:api            # nx build api
pnpm build:web            # nx build web
npx tsc --noEmit -p apps/web/tsconfig.json   # fast web typecheck
```

## Database Commands

```bash
npx prisma generate --schema=libs/prisma/schema/schema.prisma
npx prisma migrate deploy --schema=libs/prisma/schema/schema.prisma   # apply migrations
pnpm prisma:seed          # ts-node prisma/seed.ts (idempotent; acme + globex tenants)
```

> `prisma migrate dev` requires a TTY and fails non-interactively (CI/agent shells).
> Use `prisma migrate deploy`; to author migrations use
> `prisma migrate diff --from-schema-datasource --to-schema-datamodel --script`.

## Seed Data

| Email | Password | Role |
|-------|----------|------|
| admin@saabiz.com | admin123 | ADMIN |
| seller@saabiz.com | seller123 | SELLER (platform) |
| acme@saabiz.com | seller123 | SELLER (tenant acme) |
| globex@saabiz.com | seller123 | SELLER (tenant globex) |
| customer@saabiz.com | customer123 | CUSTOMER |
| affiliate@saabiz.com | affiliate123 | AFFILIATE |

Tenants: `acme` (acme.saabiz.com) and `globex` (globex.saabiz.com). Products:
`seed-acme-analytics`, `seed-acme-email`, `seed-globex-backup`. Payment configs
are placeholders (inactive).

## Tenant-Aware API Surface (implemented)

- `GET /api/tenants/resolve?host=` and `GET /api/tenants/:id` (public)
- `products/public` (+ `/:id`) — scoped via `seller.tenantId`
- `checkout/config`, `checkout/initialize`, `checkout/embed/*` — tenant-scoped,
  gateway config = tenant config → platform fallback
- `payments` admin config accepts `?tenantId=`; `getEffectiveConfig` fallback
- `webhooks` verify signatures against all configs (single URL serves all tenants)
- Emails (verify/reset/links) use `TenantService.frontendUrl()` (tenant-aware)

## Known Traps

- **Never use `localhost` as the DB host — use `127.0.0.1`**: Node/Prisma
  resolves `localhost` → `::1` (IPv6) first; after a Postgres crash cycle the
  postmaster may bind IPv4 only, so every DB query intermittently fails with
  `Can't reach database server` (visible as 500 logins / timed-out E2E).
  `DATABASE_URL` is pinned to `127.0.0.1` in `.env` / `.env.example` / CI.
- **`TenantService` is a singleton — never add it to another module's
  `providers`**: doing so creates a second instance whose own async-local
  storage is empty, so `scopeTenantId()` silently returns `undefined` and ALL
  tenant scoping (products, checkout) breaks while `req.tenantContext` still
  looks correct. Inject it only from the global `TenancyModule`.
- **Windows Postgres instability during long sessions**: the service can crash
  mid-run (crash recovery is slow). E2E runs: check `pg_isready` then restart
  the API (`Prisma` pools don't auto-recover) and web before each suite run.
- **E2E flow (workers may kill long-lived child processes between commands)**:
  start API (`node -r dotenv/config dist/apps/api/src/main.js`) + web
  (`next start apps/web -p 3000` — ~30s boot, far faster than `next dev`
  cold-compiles) → verify `POST /api/auth/login` → 201 through the proxy →
  run `E2E_NO_WEBSERVER=1 npx playwright test`. Tenant hosts need no
  /etc/hosts changes (Chromium `--host-resolver-rules` in playwright.config).
- **The web catch-all proxy MUST forward the query string** — the API uses
  `?host=`, `?tenantId=`, `?reference=`; forgetting `req.nextUrl.search`
  silently breaks those endpoints through the web.
- **Playwright expect default is 5s** — raise `expect.timeout` for this
  machine (config sets 30s).
- **PostgreSQL crash recovery is slow** on this machine (huge data dir). The
  service may sit in recovery for a long time; queries hang until
  `database system is ready to accept connections` appears in
  `C:\Program Files\PostgreSQL\17\data\log`. `ServicesPipeTimeout` was raised to
  300000 to survive SCM timeouts. Do not kill postgres during recovery.
- **npm registry is slow** (~13s/request); large pnpm operations take minutes.
  Use generous timeouts.
- **Do not** redirect pnpm/nx output with PowerShell `*>` / `>` in agent shells
  (`ChildProcess.kill` issues); use `Start-Process cmd.exe /c` for long-running
  servers and log files, or `2>&1 | Tee-Object`.
- bcrypt native bindings are unavailable on Node 24 → **use bcryptjs**.
- The web **middleware matcher** must stay simple (`/((?!_next/|favicon.ico|js/|images/).*)`) —
  Next 14 rejects regexes with alternation capture groups.
- **Next build needs `NODE_ENV=production`**: `.env` sets `NODE_ENV=development`,
  so `next build` (via `pnpm build:web` / `nx build web`) falls into a
  dev/prod hybrid and fails every static prerender with
  `<Html> should not be imported outside of pages/_document` /
  `Cannot read properties of null (reading 'useContext')`. Fix: run builds
  with `NODE_ENV=production` (`$env:NODE_ENV='production'` or CI env).
- **Tailwind config traps** (web app):
  - Tailwind's PostCSS plugin resolves `tailwind.config.js` from `process.cwd()`.
    Since servers are launched from the repo root (`next dev apps/web`), the config
    was NOT found → the `content` option came up empty → ALL utilities + `@layer`
    classes were pruned → broken layout. Fix: `postcss.config.js` passes the config
    path explicitly (`tailwindcss: { config: __dirname + '/tailwind.config.js' }`).
  - `tailwind.config.js` `content` globs must be `__dirname`-based
    (`path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx,mdx}')`), never `./src/**`.
  - Both config changes require a full dev-server restart to take effect.
- `.glass-card`, `.glass-card-inner`, `.skeleton` are project design classes
  defined in `apps/web/src/app/global.css` — keep them in sync if you tweak
  card styles.

## Documentation

- `docs/plan.md` — roadmap/milestones
- `docs/tasks.md` — work log + known issues + backlog
- `docs/deployment-guide.md` — native multi-domain production deployment
- `docs/email-system.md` — email flows

## Next Work (see docs/tasks.md)

- Tenant management admin UI; seller→tenant scoping of dashboards
- Real payment gateway keys + webhook replay; dunning emails; promotions UI
- Download delivery + activation limits; SDK sync; CI gates; E2E; monitoring