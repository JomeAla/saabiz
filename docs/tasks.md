# SAABIZ — Tasks & Work Log

Work log for the native-stack / multi-domain migration. Ordered oldest → newest.

## Completed

- [x] **Install Memurai Developer 4.1.2** (Redis-compatible service, `localhost:6379`).
      winget failed with 1603 (non-admin) → elevated MSI install; `memurai-cli ping` → PONG.
- [x] **Rewrite `.env` / `.env.example`** for native stack:
      `DATABASE_URL` → localhost:5432, `REDIS_URL` → localhost:6379,
      `PLATFORM_DOMAIN=saabiz.com`, CORS includes `https://*.saabiz.com`,
      `PORT=3001`, `WEB_PORT=3000`.
- [x] **Scrap Docker**: deleted `docker-compose.yml`, `Dockerfile.api`, `docker/`,
      all `apps/*/Dockerfile*` variants, `*.log`, `fix-and-start.*`,
      `package.json.1290654096`.
- [x] **Clean outer repo** (`C:\Users\jomea\Saarbiz`): removed broken `saabiz`
      gitlink, orphan `saarbiz`, `build_api.pid`; added root `README.md` + `.gitignore`.
- [x] **bcrypt → bcryptjs 3.0.3** (`MODULE_NOT_FOUND bcrypt_lib.node` on Node 24);
      imports updated in `auth.service.ts`, `admin.service.ts`, `prisma/seed.ts`.
- [x] **Prisma schema**: `Tenant`, `Domain`; `Seller.tenantId` @unique;
      `PlatformConfig.tenantId` @unique; stripe fields removed.
- [x] **Migration `20260820000000_multi_domain_tenants`** authored via
      `prisma migrate diff --from-schema-datasource --to-schema-datamodel --script`
      (`prisma migrate dev` needs a TTY), applied with `prisma migrate deploy`
      (all 5 migrations applied). Also adds: `DiscountType` enum,
      `SubscriptionStatus IN_GRACE_PERIOD`, License `activations`/`machineId`,
      Plan `maxActivations`, Product `downloadUrl`/`version`,
      Subscription `graceUntil`/`paymentFailedAt`, Transaction `promotionId`,
      User verification/reset fields, `AuditLog`, `Promotion`.
- [x] **Seed rewrite** (`prisma/seed.ts`): idempotent (upsert/createMany
      skipDuplicates); platform accounts + tenants `acme`/`globex` +
      products/plans + payment configs. Verified: 2 tenants, 2 domains,
      3 sellers, 3 products, 2 platform configs.
- [x] **Tenancy module** (`apps/api/src/app/tenancy/`): `TenantService`
      (AsyncLocalStorage, host normalize, platform detection, 60s cache,
      `scopeTenantId`, `frontendUrl`), `TenantsController` (`/tenants/resolve`,
      `/tenants/:id`), decorator, global module.
- [x] **API main.ts**: tenant middleware, dynamic CORS, `JWT_SECRET` check in
      prod, default port 3001, Swagger at `/api/docs` (dev).
- [x] **Tenant-aware API services**: auth email links (`frontendUrl`),
      admin verify link, licenses Redis URL, payments `getEffectiveConfig`
      + `?tenantId`, Paystack/Flutterwave `getHeaders` + Flutterwave
      `redirect_url` fix, checkout rewrite (`resolveConfig`/`assertTenantScope`),
      embed controller rewrite, public products scoping, webhook signature
      verification across configs.
- [x] **checkout-widget.js**: API/web URLs derived from script origin or
      `data-api-url` (no hardcoded localhost).
- [x] **Web multi-domain layer**:
      - `apps/web/src/middleware.ts` — host → tenant (`x-tenant-id` request header)
      - `apps/web/src/app/api/[...path]/route.ts` — catch-all proxy (method,
        body, auth, tenant, host forwarding)
      - deleted 19 broken per-route proxies (they used `http://localhost:3001`
        without the `/api` prefix and dropped tenant context)
      - `lib/api.ts` — same-origin client (auth auto-injected)
      - replaced ~68 hardcoded `localhost:3001` calls across 22 pages/components
      - login page `useState`-as-effect bug fixed
      - branding normalized `saarbiz.com` → `saabiz.com` (web UI + metadata)
      - `metadataBase` added to layout metadata
- [x] **Builds green**: `nx build api --skip-nx-cache`; web typecheck
      (`tsc --noEmit -p apps/web/tsconfig.json`); fixed promotions
      `discountType` typing.
- [x] **dev.ps1**: prerequisites check, hosts entries (`acme`/`globex`),
      one-command `-servers` start.
- [x] **Live smoke tests**: API health; tenant resolve; per-host storefront
      scoping (acme=2, globex=1, platform=3 products); checkout config via
      `x-forwarded-host`; login through the web proxy (201, admin role).
- [x] **docs/deployment-guide.md** rewritten (native, multi-domain, Nginx + SSL,
      systemd, backups). `docs/plan.md` + `docs/tasks.md` created.
- [x] **Honeypot feature** (anti-piracy + bot trap):
      - Prisma `Honeypot` / `HoneypotHit` / `BotSubmission` models + migration
        `20260822000000_honeypot_licenses`
      - `apps/api/src/app/honeypots/` module: admin CRUD (`/api/honeypots`),
        `/api/honeypots/:id/hits`, `/api/honeypots/bot-submissions`
      - Decoy-key detection wired into `/api/licenses/verify`, `ota-check`,
        `ota-validate`, `activate`, `deactivate`, `status` — pirates get a
        plausible success response but never a real download URL; each use is
        recorded (endpoint, machineId, domain, IP, UA), audit-logged
        (`HONEYPOT_HIT`) and alerted by email to the seller + admins
      - Bot trap: invisible `website` field on register / register-customer /
        forgot-password — filled submissions are silently dropped, recorded
        (`BOT_SUBMISSION`) and shown in the admin UI
      - Admin UI at `/platform-admin/honeypots` (list/create/toggle/delete
        decoy keys, hit viewer, bot submissions log)
      - Seed adds demo decoys `SAABIZ-H0N3YP0T-ACME01` / `SAABIZ-H0N3YP0T-GLBX01`
- [x] **E2E fix**: `e2e/tests/smoke.spec.ts` login emails used the old
      `@saarbiz.com` domain (no such accounts) — corrected to `@saabiz.com`.
- [x] **Promotions UI is actually DONE** despite the stale backlog entry —
      full CRUD admin page at `/platform-admin/promotions` + `/api/admin/promotions`
- [x] **Tenant management UI** — `/platform-admin/tenants`: create tenants
      (slug/domains/branding/seller assignment), domain add/remove/primary,
      branding editor, per-tenant analytics, deactivate; API:
      `/api/admin/tenants*` (+ `GET /admin/tenants/:id/analytics`); sellers
      now include `tenant` info; seller dashboard shows the storefront card
- [x] **Seller→tenant scoping** — per-tenant analytics aggregation
      (`seller.tenantId`), seller dashboard tenant/storefront data
- [x] **Webhook log + replay** — new `WebhookEvent` table (gateway, event,
      reference, signature, rawBody, payload, status, replay info); every
      incoming webhook recorded (processing→processed/duplicate/ignored/failed);
      admin UI at `/platform-admin/webhooks` with one-click replay
      (`POST /api/admin/webhooks/:id/replay`; idempotent — replays respect
      the duplicate guard)
- [x] **Payment-failure dunning** — webhooks now handle `charge.failed` /
      `invoice.payment_failed` / Flutterwave failure events → subscription →
      `IN_GRACE_PERIOD` + `paymentFailedAt` + `graceUntil` (7d) + licenses
      deactivated + `sendPaymentFailedEmail`; cron escalates day 3 (reminder)
      and day 6 (final warning) via `lastDunningSentAt` tracking
- [x] **Activation-limits UI + license management** — seller `subscribers`
      now returns machineId/activations/maxActivations (plan-aware);
      `POST /api/licenses/revoke/:id` + `reactivate/:id` (SELLER or ADMIN);
      SubscribersManager shows activation cell + revoke/reactivate buttons
- [x] **SDK sync** — JS SDK: `checkForUpdate` now sends the license key
      (was silently missing → server matched arbitrary licenses!), `status`
      changed GET→POST to match the API, downloadUrl mapped from response,
      new `otaValidate`/`checkUpdate`/`status` helpers; PHP SDK: activation
      result now includes machineId/isActivated; SDK tsconfig + DOM lib;
      **API hardening**: `ota-check`/`ota-validate` now require `licenseKey`
      (previously Prisma dropped `undefined` and matched the first license)
- [x] **Monitoring + backups** — `scripts/monitor.ps1` (API/DB/Redis/web probe,
      exit code), `scripts/backup-db.ps1` (pg_dump→gzip via .NET, 14-file
      retention), `scripts/setup-windows-automation.ps1` (scheduled tasks:
      daily 03:00 backup, 10-min monitor); `pnpm backup:db` / `pnpm monitor`;
      Sentry enabled via `SENTRY_DSN`; `/api/health` now serves `/db` + `/redis`
      probes on the same route (prefix-shading bug fixed)
- [x] **CI repair** — `.github/workflows/ci-cd.yml` rewritten for pnpm/Nx
      (master/develop), Docker jobs removed (no Dockerfiles remain), E2E job
      runs real DB/Redis services + migrate + seed + built servers +
      Playwright(Chromium); `@playwright/test` added to devDeps; playwright
      config uses env-gated webServer (CI = pre-started servers);
      `NODE_ENV=production` pinned for builds
- [x] **Web prod-build green** — root cause fixed: `.env` sets
      `NODE_ENV=development` which broke `next build` static prerendering
      (`<Html>`/`useContext` null errors); build with `NODE_ENV=production`
      (documented in AGENTS.md "Known Traps")
- [x] **E2E: multi-host storefront suite (7/7 green)** — `e2e/tests/storefront.spec.ts`:
      per-host product scoping (UI + API), tenant resolve through middleware,
      checkout config shape, unknown-host 404. Tenant hosts mapped via Chrome
      `--host-resolver-rules` (no /etc/hosts needed).
- [x] **E2E: full smoke suite green (28 tests)** — fixed stale selectors
      (login heading/placeholder, marketplace heading, exact-name headings on
      subscribers/licenses/billing/links/commissions, logout button label);
      raised expect timeout for this machine.
- [x] **Bug: affiliate login routed to `/customer/dashboard`** — the login page's
      role branching swallowed AFFILIATE; now routes to `/affiliate/dashboard`.
- [x] **Bug: catch-all web proxy dropped query strings** — `?host=`, `?tenantId=`,
      `?reference=` never reached the API through the web (resolve returned
      `platform`, tenant-scoped admin endpoints broken). Fixed with
      `req.nextUrl.search` in `apps/web/src/app/api/[...path]/route.ts`.
- [x] **Bug: duplicate TenantService provider broke ALL tenant scoping** —
      AdminModule's providers included `TenantService`, creating a second
      instance with an empty AsyncLocalStorage (`scopeTenantId()` → undefined;
      every storefront showed all products). Removed — singleton restored,
      `x-tenant-id`/`x-forwarded-host` scoping verified per host.
- [x] **Stability: DATABASE_URL pinned to `127.0.0.1`** (Node resolves
      `localhost`→`::1` first; after Postgres crash cycles it binds IPv4 only
      → intermittent "Can't reach database server"). Applied to `.env`,
      `.env.example` and the CI E2E job. Also fresh `pg_ctl` start procedures
      and `E2E_NO_WEBSERVER=1` documented in AGENTS.md.
- [x] **Multi-host E2E works in CI** — github workflow E2E job uses
      `127.0.0.1` DB URL, pre-built servers, Chromium only; storefront tests
      need no hosts magic (resolver rules live in playwright.config).

## In Progress

- [ ] (None currently)

## Known Issues / Notes

- **Webhook subscription payments once failed at runtime** — `transactionData.subscriptionId`
  was written directly; Prisma `CreateInput` only accepts `subscription: { connect }`
  for relation FKs. Fixed in `webhooks.service.ts`. This bug meant any recurring-plan
  purchase via webhook 500'd — it was never exercised by tests before.
- **`next build` requires `NODE_ENV=production`** (see AGENTS.md traps).
- **`/api/health` prefix-shadowed `/db` and `/redis`** — Express `app.use('/api/health')`
  matched all subpaths; probes are now routed inside one handler.

- **PostgreSQL on Windows**: after an unclean shutdown the service can sit in
  crash recovery for a long time (huge data dir, slow fsync) — the SCM start
  timeout can kill the service. Raised `ServicesPipeTimeout` to 300000.
  The postmaster may still accept TCP while recovering; queries hang until
  `database system is ready to accept connections` appears in
  `C:\Program Files\PostgreSQL\17\data\log`.
- **Next dev server is slow on this machine** (cold webpack cache ~7 min to
  ready, first page compile ~10 min). Subsequent starts reuse `.next` cache.
- **HMR**: middleware matcher excludes `/_next/` to keep the dev HMR socket off
  the middleware path.
- **Rate limits** in `main.ts` (15-min window 100 req; login 20/min per email).

## Backlog

- [ ] Real Paystack/Flutterwave keys (placeholders currently; configure via
      Platform Admin → Payments once test/live keys are issued)
- [ ] Monitoring: add email/PagerDuty alerting on monitor failure + Sentry
      DSN configuration (item deferred to production)
