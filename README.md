# SAABIZ - Merchant of Record & Software Monetization Platform

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-10-red?style=for-the-badge" alt="NestJS">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge" alt="Next.js">
  <img src="https://img.shields.io/badge/Prisma-5+-2D3748?style=for-the-badge" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Nx-20-143055?style=for-the-badge" alt="Nx">
</p>

SAABIZ is a comprehensive **Merchant of Record (MoR)** and **software monetization platform** built with NestJS, Next.js 14, PostgreSQL, and Prisma. It enables software developers, SaaS founders, and digital product creators to sell their products globally with integrated payments, subscriptions, licensing, and affiliate management.

## Features

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
- **REST API**: Full API documentation-ready endpoints

### Infrastructure
- **Docker**: Production-ready Dockerfiles for API and Web
- **CI/CD**: GitHub Actions pipeline for automated testing and deployment
- **Nx Monorepo**: Shared libraries, consistent tooling, efficient builds

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | NestJS 10 |
| Frontend | Next.js 14, React 18 |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Cache | Redis 7 |
| Auth | JWT + Passport |
| Payments | Paystack, Flutterwave |
| Styling | Tailwind CSS 4 |
| Monorepo | Nx 20 |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or Docker)
- Redis 7+ (or Docker)
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
pnpm nx run prisma:generate
# Or directly:
npx prisma generate --schema=libs/prisma/schema/schema.prisma

# Run database migrations
pnpm nx run prisma:migrate
# Or directly:
npx prisma migrate deploy --schema=libs/prisma/schema/schema.prisma
```

### Environment Variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/saabiz?schema=public"

# Server
PORT=3001
NODE_ENV=development

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"

# Payment Gateways (configure via admin dashboard or directly in DB)
# PAYSTACK_SECRET_KEY="sk_live_xxx"
# FLUTTERWAVE_SECRET_KEY="FLWSECK-xxx"
```

### Running the Application

```bash
# Development - API Server (port 3001)
pnpm nx serve api

# Development - Web App (port 3000)
pnpm nx serve web

# Run both concurrently
pnpm nx run-many -t serve

# Production build
pnpm nx build api
pnpm nx build web
```

### Docker

```bash
# Build images
docker build -f apps/api/Dockerfile -t saabiz-api .
docker build -f apps/web/Dockerfile -t saabiz-web .

# Or use docker-compose
docker-compose up -d
```

## Project Structure

```
saabiz/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   └── src/app/
│   │       ├── auth/          # JWT authentication, registration, email verification
│   │       ├── payments/       # Paystack & Flutterwave service wrappers
│   │       ├── checkout/      # Payment initialization & tax calculation
│   │       ├── webhooks/      # Payment gateway webhook processing
│   │       ├── products/      # Product CRUD & management
│   │       ├── plans/        # Pricing plan management
│   │       ├── licenses/     # License key generation, validation, OTA updates
│   │       ├── subscriptions/ # Subscription lifecycle, proration, upgrades
│   │       ├── affiliates/    # Affiliate links, commissions, click tracking
│   │       ├── admin/        # Platform admin operations
│   │       ├── seller/        # Seller settings & profile
│   │       ├── invoices/     # Invoice generation
│   │       ├── notifications/# Email notifications
│   │       ├── tax/          # Global tax calculation (VAT/GST)
│   │       ├── cron/         # Scheduled tasks (renewals, expirations)
│   │       ├── logger/       # Winston structured logging
│   │       ├── audit/        # Audit logging
│   │       └── events/       # Event emitter for payment → license → affiliate flow
│   │
│   └── web/                   # Next.js 14 Frontend
│       └── src/app/
│           ├── (auth)/        # Login, register, forgot-password, verify-email, reset-password
│           ├── marketplace/   # Product marketplace
│           ├── checkout/      # Checkout flow with Paystack/Flutterwave
│           ├── customer/      # Customer portal (dashboard, subscriptions, licenses, settings)
│           ├── seller/        # Seller dashboard (products, subscribers, settings)
│           ├── affiliate/     # Affiliate portal (links, commissions, payouts, dashboard)
│           ├── platform-admin/# Admin dashboard (stats, sellers, products, payouts, transactions)
│           └── api/           # Next.js API routes (proxy to backend)
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
    ├── saabiz-master-build-todo.html
    └── saabiz-mor-platform-prd.html
```

## User Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Platform operator — full system access, GMV tracking, payout management |
| `SELLER` | Product creators — manage products, plans, view earnings |
| `CUSTOMER` | End users — purchase subscriptions, manage licenses |
| `AFFILIATE` | Commission-based promoters — create links, track commissions |

## API Endpoints

All API endpoints are prefixed with `/api`.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register as seller |
| POST | `/auth/register-customer` | Register as customer |
| POST | `/auth/login` | User login |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/auth/verify-email` | Verify email address |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List all products (authenticated) |
| POST | `/products` | Create product (seller) |
| GET | `/products/public` | List public products (marketplace) |
| GET | `/products/:id` | Get product details |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |

### Plans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plans` | List plans |
| POST | `/plans` | Create plan (seller) |
| GET | `/plans/:id` | Get plan details |
| PUT | `/plans/:id` | Update plan |
| DELETE | `/plans/:id` | Delete plan |

### Checkout
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/checkout/initialize` | Initialize payment |
| GET | `/checkout/config` | Get active payment gateway config |
| GET | `/checkout/verify/:reference/:gateway` | Verify payment status |

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

Configure via the admin dashboard or directly in the database:

```sql
INSERT INTO "PlatformConfig" (
  "paystackActive", "paystackSecretKey", "paystackPublicKey",
  "flutterwaveActive", "flutterwaveSecretKey", "flutterwavePublicKey"
) VALUES (
  true, 'sk_test_xxx', 'pk_test_xxx',
  true, 'FLWSECK-xxx', 'FLWPUBK-xxx'
);
```

### Webhook URLs
Set these in your Paystack/Flutterwave dashboard:
- Paystack: `https://your-domain.com/api/webhooks/paystack`
- Flutterwave: `https://your-domain.com/api/webhooks/flutterwave`

## Subscription Flow

1. Customer selects product and plan on marketplace
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

See `docs/saabiz-master-build-todo.html` for the full development roadmap.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License — see LICENSE file for details
