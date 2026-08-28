# SAABIZ — Project Plan

Status of the multi-domain, native-stack migration and platform roadmap.

## Mission

Turn SAABIZ into a **multi-tenant Merchant of Record platform** where each
software seller (tenant) has its own branded storefront on a subdomain or custom
domain, while the platform domain (`saabiz.com`) hosts the marketplace and the
admin / seller / customer / affiliate portals.

## Milestones

### M1 — Native Stack (DONE)
- Drop Docker entirely; run Postgres + Redis natively
- Windows: PostgreSQL 17 service + Memurai Developer (Redis) on 6379
- Rewrite `.env` / `.env.example` for the native stack
- bcrypt → bcryptjs (native bindings unavailable on Node 24)
- Clean workspace root; remove Docker artifacts, orphan files

### M2 — Multi-Domain Data Model (DONE)
- Prisma `Tenant` + `Domain` models; `Seller.tenantId`, `PlatformConfig.tenantId`
- Migration `20260820000000_multi_domain_tenants` (also brings
  discounts/promotions, audit log, licenses activations, grace period,
  download URLs, email verification/reset fields)
- Idempotent seed: platform accounts + `acme` / `globex` tenants with storefronts

### M3 — Tenant-Aware API (DONE)
- `TenancyModule` (global): AsyncLocalStorage `TenantContext`, host resolution
  with 60s cache, `scopeTenantId()` (undefined = platform, null = unknown storefront)
- `TenantsController`: `GET /api/tenants/resolve?host=`, `GET /api/tenants/:id`
- Tenant middleware in `main.ts`; dynamic CORS (env + `*.platform` + known hosts)
- Tenant-scoped: public products, checkout (config/init/embed), payments config,
  gateway headers (Paystack/Flutterwave), webhook signature verification
- Flutterwave redirect URL now tenant-aware (`frontendUrl`)

### M4 — Multi-Domain Web Layer (DONE)
- `apps/web/src/middleware.ts`: Host → tenant resolution, sets `x-tenant-id`
- Catch-all proxy `apps/web/src/app/api/[...path]/route.ts` replaces 19 broken
  per-route proxies (they missed the `/api` prefix and never forwarded host/tenant)
- `lib/api.ts`: same-origin client (auto auth header, get/post/put/patch/delete)
- Removed ~68 hardcoded `http://localhost:3001` call sites across 22 files
- Fixed login page `useState()`-as-effect bug; normalized `saarbiz.com` → `saabiz.com`
- `metadataBase` set for correct OG URLs

### M5 — Dev Experience (DONE)
- `dev.ps1`: prerequisites check, hosts-file entries, one-command dev start
- Local hosts: `acme.saabiz.com`, `globex.saabiz.com` → 127.0.0.1

### M6 — Verification (DONE)
- API + Web builds green (`nx build api`, web typecheck)
- Live smoke tests: tenant resolve, per-host product scoping, checkout config,
  login through the web proxy, platform vs tenant storefronts

### M7 — Documentation (DONE)
- `docs/deployment-guide.md` rewritten for native + multi-domain deployment
- `README.md` / `AGENTS.md` / `docs/email-system.md` updated
- This plan + `docs/tasks.md`

### M8 — Honeypot: anti-piracy & bot defense (DONE)
- Decoy license keys (`Honeypot` / `HoneypotHit`) — keys planted in leaked
  builds; any use on `licenses/verify`, `ota-check`, `ota-validate`,
  `activate/deactivate/status` is recorded (machine, domain, IP, UA),
  audit-logged and emailed to seller + admins; pirates get a plausible
  success response but never the real download URL
- Bot trap (`BotSubmission`) — invisible `website` field on register /
  register-customer / forgot-password; filled submissions are silently
  dropped and logged
- Admin UI at `/platform-admin/honeypots`; seed decoys
  `SAABIZ-H0N3YP0T-ACME01` / `SAABIZ-H0N3YP0T-GLBX01`

## Roadmap (Next)

### R1 — Tenant management UI (DONE)
- Admin screen to create tenants, add domains, set branding (logo/tagline/colors),
  manage per-tenant payment config
- Per-tenant analytics + primary-domain management (deactivate = storefront 404)

### R2 — Platform & tenant admin hardening (DONE)
- Seller dashboards expose their tenant/storefront; per-tenant analytics
  endpoints (`GET /api/admin/tenants/:id/analytics`)
- Platform-wide aggregations unchanged

### R3 — Payments & billing depth (DONE)
- Webhook event log + one-click replay UI (idempotent)
- Dunning: payment-failed emails on webhook failure → IN_GRACE_PERIOD
  (7-day grace, license deactivated), day-3 reminder + day-6 final warning,
  auto-cancel after grace
- Real gateway keys: configure via Platform Admin → Payments
  (test placeholders until real keys are supplied)

### R4 — Licensing & delivery (DONE)
- Download delivery (`downloadUrl` + versioning) on paid plans
- Activation limits (`maxActivations`), machine lock/unlock flow
- SDKs synced (js + php): activation/status fixed, keyed OTA checks,
  `ota-check`/`ota-validate` now require licenseKey

### R5 — Production hardening (DONE)
- CI: pnpm/Nx lint + typecheck + build + Playwright E2E on master (GitHub Actions)
- E2E (Playwright): full smoke (all portals) + multi-host storefront suite —
  28/28 green (tenant hosts via `--host-resolver-rules`, no /etc/hosts)
- Monitoring: health probes (API/DB/Redis), `scripts/monitor.ps1`,
  10-min scheduled task; DB backup automation (daily pg_dump, 14 retained);
  Sentry ready via `SENTRY_DSN`
- Remaining (production): real gateway keys, alerting destinations + Sentry DSN

## Definitions

- **Platform host** — `saabiz.com` (and `localhost` in dev): marketplace + portals
- **Tenant host** — `*.saabiz.com` subdomain or custom domain; storefront only
- **Unknown storefront** — host matches no active tenant → 404 on storefront APIs
- **x-tenant-id** — internal header set by the web middleware, honored by the API
