# SAABIZ - Multi-domain Merchant of Record & Software Monetization Platform

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-10-red?style=for-the-badge" alt="NestJS">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge" alt="Next.js">
  <img src="https://img.shields.io/badge/Prisma-5+-2D3748?style=for-the-badge" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Nx-20-143055?style=for-the-badge" alt="Nx">
</p>

SAABIZ is a comprehensive **multi-domain Merchant of Record (MoR)** and **software monetization platform** built with NestJS, Next.js 14, PostgreSQL, and Prisma. Each software seller (tenant) gets its own branded storefront on a subdomain (`tenant.saabiz.com`) or custom domain, while the platform domain hosts the marketplace and all portals. It enables software developers, SaaS founders, and digital product creators to sell their products globally with integrated payments, subscriptions, licensing, and affiliate management.

## Features

### Multi-Tenant Storefronts
- **Tenant Domains**: Each seller tenant owns subdomain (`*.saabiz.com`) or custom domains
- **Host-Based Routing**: Web middleware resolves the tenant from the Host header (`x-tenant-id`) and the API scopes every storefront query
- **Tenant Payment Config**: Per-tenant payment gateway config with platform fallback
- **Tenant Branding**: Per-tenant logo, tagline, colors (settings in `Tenant.settings`)

### Payments & Billing
- **Multi-Gateway Payments**: Paystack and Flutterwave with full webhook support
- **Subscription Management**: Monthly, annual, and one-time billing with automatic proration
- **Tax Calculation**: Automatic VAT/GST calculation for 50+ countries
- **Global Reach**: Multi-currency support with real-time conversion

### Licensing & Distribution
- **License Key Generation**: Secure license key system with Redis-cached validation API
- **OTA Updates**: Over-the-air license management and revocation
- **Download Management**: Versioned product download URLs

### Seller Tools
- **Seller Dashboard**: Product management, subscriber tracking, earnings overview
- **Payout Management**: Automated seller payouts via Paystack/Flutterwave

### Customer Experience
- **Marketplace**: Browse and filter products by category
- **Customer Portal**: Self-service subscription management, license keys, billing history
- **Checkout Widget**: Embeddable JS widget for external sites

### Platform Administration
- **Admin Dashboard**: GMV tracking, revenue by gateway, platform statistics
- **Product Management**: Freeze/unfreeze products, view all listings
- **Seller Management**: View sellers, process payouts
- **Transaction Management**: Full transaction history with refund support

### Affiliate System
- **Affiliate Links**: Per-product affiliate tracking with commission rates
- **Commission Tracking**: Automatic commission calculation and attribution
- **Affiliate Dashboard**: Click/conversion tracking, commission history, payouts

### Developer Experience
- **JavaScript SDK**: License validation in Node.js and browser environments
- **PHP SDK + WordPress Plugin**: Integration with PHP apps and WordPress sites
- **REST API**: Full API documentation-ready endpoints (Swagger at `/api/docs`)

### Infrastructure
- **Native Stack**: No Docker — PostgreSQL 17 + Redis (Memurai on Windows) run natively
- **Nx Monorepo**: Shared libraries, consistent tooling, efficient builds
- **CI/CD**: GitHub Actions pipeline for automated testing and deployment

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | NestJS 10 |
| Frontend | Next.js 14, React 18 |
| Database | PostgreSQL 17 |
| ORM | Prisma 5 |
| Cache | Redis (Memurai on Windows) |
| Auth | JWT + Passport |
| Payments | Paystack, Flutterwave |
| Styling | Tailwind CSS 3 |
| Monorepo | Nx 20 |

## Getting Started

### Prerequisites

- Node.js 18+ (tested on 24)
- PostgreSQL 15+ (tested on 17)
- Redis 6+ (Windows: **Memurai Developer**, a Redis-compatible Windows service)
- pnpm 10+

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
npx prisma generate --schema=libs/prisma/schema/schema.prisma

# Apply migrations
npx prisma migrate deploy --schema=libs/prisma/schema/schema.prisma

# Seed demo data (tenants acme + globex, products, users)
pnpm prisma:seed
```

### Environment Variables

Create a `.env` file in the root (see `.env.example`):

```env
# Database (native PostgreSQL)
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/saabiz?schema=public"

# Server
PORT=3001
NODE_ENV=development

# Redis (Memurai on Windows)
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Multi-domain
PLATFORM_DOMAIN="saabiz.com"
NEXT_PUBLIC_API_URL="http://localhost:3001"
CORS_ORIGINS="http://localhost:3000,https://saabiz.com"

# Frontend URL (for email links)
FRONTEND_URL="http://localhost:3000"

# Payment Gateways (configure via admin dashboard or directly in DB)
# PAYSTACK_SECRET_KEY="sk_live_xxx"
# FLUTTERWAVE_SECRET_KEY="FLWSECK-xxx"
```

### Running the Application

```bash
# Windows (one command: prerequisites, hosts entries, both servers)
.\dev.ps1 -servers

# Or manually:
# API Server (port 3001)
pnpm dev:api

# Web App (port 3000)
pnpm dev:web

# Both concurrently
pnpm dev:all

# Production build
pnpm build:api
pnpm build:web
```

### Local Tenant Hosts

To test tenant storefronts locally, map the seeded tenant hosts to 127.0.0.1
(`.\dev.ps1 -hosts` as Administrator, or edit `C:\Windows\System32\drivers\etc\hosts`):

```
127.0.0.1 acme.saabiz.com
127.0.0.1 globex.saabiz.com
```

Then visit `http://acme.saabiz.com:3000` — the storefront only shows that
tenant's products; `http://localhost:3000` shows the platform marketplace.

## How Multi-Domain Routing Works

1. Request arrives for a tenant host (e.g. `acme.saabiz.com`).
2. `apps/web/src/middleware.ts` resolves the tenant via
   `GET /api/tenants/resolve?host=...` (60s cache) and injects an `x-tenant-id` header.
3. All browser traffic goes to the **same-origin** `/api/*` path; the catch-all
   proxy `apps/web/src/app/api/[...path]/route.ts` forwards it to the NestJS API
   (`NEXT_PUBLIC_API_URL`), preserving `x-tenant-id`, `Authorization`, and `X-Forwarded-Host`.
4. The API (`apps/api/src/app/tenancy/tenant.service.ts`) scopes storefront
   queries (products, checkout, payment config, webhooks) to the tenant via
   AsyncLocalStorage.
5. Unknown hosts get a platform context (marketplace + portals).

## Project Structure

```
saabiz/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   └── src/app/
│   │       ├── tenancy/       # Tenant context, host resolution, /tenants routes
│   │       ├── auth/          # JWT authentication, registration, email verification
│   │       ├── payments/      # Paystack & Flutterwave service wrappers
│   │       ├── checkout/      # Payment initialization & tax calculation
│   │       ├── webhooks/      # Payment gateway webhook processing
│   │       ├── products/      # Product CRUD & management
│   │       ├── plans/         # Pricing plan management
│   │       ├── licenses/      # License key generation, validation, OTA updates
│   │       ├── subscriptions/ # Subscription lifecycle, proration, upgrades
│   │       ├── affiliates/    # Affiliate links, commissions, click tracking
│   │       ├── admin/         # Platform admin operations
│   │       ├── seller/        # Seller settings & profile
│   │       ├── invoices/      # Invoice generation
│   │       ├── notifications/ # Email notifications
│   │       ├── tax/           # Global tax calculation (VAT/GST)
│   │       ├── cron/          # Scheduled tasks (renewals, expirations)
│   │       ├── logger/        # Winston structured logging
│   │       ├── audit/         # Audit logging
│   │       └── events/        # Event emitter for payment → license → affiliate flow
│   │
│   └── web/                   # Next.js 14 Frontend
│       └── src/
│           ├── middleware.ts  # Host → tenant resolution (x-tenant-id)
│           ├── app/
│           │   ├── (auth)/        # Login, register, forgot-password, verify-email, reset-password
│           │   ├── marketplace/   # Product marketplace
│           │   ├── checkout/      # Checkout flow with Paystack/Flutterwave
│           │   ├── customer/      # Customer portal (dashboard, subscriptions, licenses, settings)
│           │   ├── seller/        # Seller dashboard (products, subscribers, settings)
│           │   ├── affiliate/     # Affiliate portal (links, commissions, payouts, dashboard)
│           │   ├── platform-admin/# Admin dashboard (stats, sellers, products, payouts, transactions)
│           │   └── api/[...path]/ # Catch-all proxy to the NestJS API
│           └── lib/api.ts        # Same-origin API client (auth auto-injected)
│
├── libs/
│   └── prisma/                # Prisma schema, migrations, seed scripts
│       └── schema/
│           └── schema.prisma
│
├── sdks/
│   ├── js/                    # JavaScript SDK (Node.js + browser)
│   └── php/                   # PHP SDK + WordPress plugin
│
└── docs/                      # Project documentation
    ├── plan.md               # Roadmap & milestones
    ├── tasks.md              # Work log
    ├── deployment-guide.md   # Native multi-domain deployment
    └── email-system.md       # Email/notification flows
```

## User Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Platform operator — full system access, GMV tracking, payout management |
| `SELLER` | Product creators — manage products, plans, view earnings |
| `CUSTOMER` | End users — purchase subscriptions, manage licenses |
| `AFFILIATE` | Commission-based promoters — create links, track commissions |

Seed credentials (after `pnpm prisma:seed`):

| Email | Password | Role |
|-------|----------|------|
| admin@saabiz.com | admin123 | ADMIN |
| seller@saabiz.com | seller123 | SELLER (platform) |
| acme@saabiz.com | seller123 | SELLER (tenant acme) |
| globex@saabiz.com | seller123 | SELLER (tenant globex) |
| customer@saabiz.com | customer123 | CUSTOMER |
| affiliate@saabiz.com | affiliate123 | AFFILIATE |

## API Endpoints

All API endpoints are prefixed with `/api`. Swagger docs at `/api/docs` (dev).
The browser always calls the **same-origin** `/api/*` path (proxied to the API).

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register as seller |
| POST | `/auth/register-customer` | Register as customer |
| POST | `/auth/login` | User login |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/auth/verify-email` | Verify email address |

### Tenants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tenants/resolve?host=` | Resolve host to tenant (0/1 lookup, public) |
| GET | `/tenants/:id` | Public tenant profile |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List all products (authenticated) |
| POST | `/products` | Create product (seller) |
| GET | `/products/public` | List public products (tenant-scoped storefront) |
| GET | `/products/public/:id` | Get product + plans |
| GET | `/products/:id` | Get product details |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |

### Checkout
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/checkout/initialize` | Initialize payment |
| GET | `/checkout/config` | Get active payment gateway config (tenant-aware) |
| GET | `/checkout/verify/:reference/:gateway` | Verify payment status |
| GET | `/checkout/embed/:productId/:planId` | Embedded checkout page |
| GET | `/checkout/initialize-embed` | Initialize embed checkout (POST) |

### Subscriptions (Customer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subscriptions/my-subscriptions` | Get customer subscriptions + licenses |
| POST | `/subscriptions/cancel` | Cancel subscription |
| POST | `/subscriptions/upgrade` | Upgrade to a higher plan |
| GET | `/subscriptions/plans/:productId` | Get available plans |

### Licenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/licenses/validate` | Validate license key (public, Redis-cached) |
| GET | `/licenses/verify` | Full license verification |
| POST | `/licenses/activate` | Activate license instance |
| GET | `/licenses/download/:id` | Download product (authenticated) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Platform statistics |
| GET | `/admin/sellers` | List all sellers |
| GET | `/admin/products` | List all products |
| POST | `/admin/products/freeze` | Freeze/unfreeze product |
| GET | `/admin/payouts` | Seller payout info |
| POST | `/admin/payouts` | Process seller payout |
| GET | `/admin/transactions` | Transaction history |
| POST | `/admin/transactions/:id/refund` | Refund transaction |
| GET/POST | `/admin/payments/config` | Platform payment config (`?tenantId=` for tenants) |
| GET | `/admin/promotions` | List promotions |
| POST/PATCH/DELETE | `/admin/promotions/:id` | Manage promotions |
| GET | `/admin/users`, `/admin/subscriptions` | User & subscription administration |

### Affiliates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/affiliates/profile` | Get affiliate profile |
| POST | `/affiliates/profile` | Update affiliate settings |
| GET | `/affiliates/links` | Get affiliate links |
| POST | `/affiliates/links` | Create affiliate link for product |
| GET | `/affiliates/commissions` | View commission history |
| GET | `/affiliates/payouts` | View payout history |
| GET | `/affiliates/track/:code` | Track affiliate click (public) |
| POST | `/affiliates/track` | Track conversion (public) |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhooks/paystack` | Paystack payment webhooks |
| POST | `/webhooks/flutterwave` | Flutterwave payment webhooks |

## Payment Gateway Configuration

Configure via the admin dashboard (`/platform-admin/payments`) or directly in the
database. Tenant-specific configs are stored on `PlatformConfig.tenantId` (null =
platform default; a tenant config overrides it for that tenant's storefront).

### Webhook URLs
Set these in your Paystack/Flutterwave dashboard:
- Paystack: `https://your-domain.com/api/webhooks/paystack`
- Flutterwave: `https://your-domain.com/api/webhooks/flutterwave`

Webhook signature verification checks every payment config (platform + tenants),
so a single webhook URL serves all tenants.

## Subscription Flow

1. Customer selects product and plan on the tenant's storefront
2. Checkout page loads with tax calculation based on customer's country
3. Customer enters email and selects payment gateway (Paystack/Flutterwave)
4. Checkout initializes payment → customer redirected to gateway
5. Payment gateway processes payment
6. Webhook receives `charge.success` / `charge.completed`
7. Transaction, subscription (if recurring), and license created
8. Events fired: `payment.completed` → `license.created` → email notifications
9. Affiliate commission credited (if `?ref=CODE` was used)
10. Customer redirected to success page with license key

## License System

License keys are generated automatically on purchase. Validate using the JS/PHP SDK:

```javascript
import { SaabizLicense } from '@saabiz/js-sdk';

const result = await SaabizLicense.validate({
  apiUrl: 'https://api.saabiz.com',
  key: 'SAABIZ-XXXXXXXXXXXX',
  productId: 'uuid',
  instanceId: 'machine-id',
});

if (result.valid) {
  // Activate features
}
```

## Affiliate System

1. Affiliates register and create links per product
2. Links are shared (`https://saabiz.com/?ref=AFFILIATE_CODE`)
3. Checkout captures affiliate code → metadata passed to payment gateway
4. On successful payment, webhook credits commission to affiliate
5. Commissions tracked in affiliate dashboard
6. Admin processes affiliate payouts

## Roadmap

See `docs/plan.md` for milestones and `docs/tasks.md` for the work log.

## Deployment

See `docs/deployment-guide.md` — native (no-Docker) production deployment with
Nginx, systemd, wildcard SSL for `*.saabiz.com`, and tenant custom domains.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License — see LICENSE file for details