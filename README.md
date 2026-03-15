# SAABIZ - Merchant of Record & Software Monetization Platform

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-Ready-blue?style=for-the-badge" alt="NestJS">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge" alt="Next.js">
  <img src="https://img.shields.io/badge/Prisma-5+-2D3748?style=for-the-badge" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge" alt="PostgreSQL">
</p>

SAABIZ is a comprehensive **Merchant of Record (MoR)** and **software monetization platform** built with NestJS, Next.js, and PostgreSQL. It enables software developers, SaaS founders, and digital product creators to sell their products globally with integrated payments, subscriptions, licensing, and affiliate management.

## Features

### Core Features
- **Multi-Gateway Payments**: Paystack, Flutterwave, Stripe support
- **Subscription Management**: Monthly/annual billing with proration
- **License Key Generation**: Secure license key system with validation API
- **Customer Portal**: Self-service subscription management
- **Platform Admin Dashboard**: GMV tracking, seller payouts, product management
- **Affiliate System**: Commission tracking and affiliate payouts

### Architecture
- **Backend**: NestJS with modular architecture
- **Frontend**: Next.js 14 with React 18
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with role-based access control

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | NestJS 10 |
| Frontend | Next.js 14, React 18 |
| Database | PostgreSQL 15 |
| ORM | Prisma 5 |
| Auth | JWT + Passport |
| Payments | Paystack, Flutterwave, Stripe |
| Styling | Tailwind CSS 4 |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- pnpm (recommended)

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
npx prisma generate --schema=libs/prisma/schema/schema.prisma

# Run database migrations
npx prisma migrate dev --name init --schema=libs/prisma/schema/schema.prisma
```

### Environment Variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/saabiz?schema=public"

# Server
PORT=3000

# Redis (optional, for caching)
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
```

### Running the Application

```bash
# Development - API Server (port 3001)
npx nx serve api

# Development - Web App (port 3000)
npx nx serve web

# Or run both
pnpm run dev:all
```

## Project Structure

```
saabiz/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   └── src/app/
│   │       ├── auth/       # Authentication
│   │       ├── payments/   # Payment gateways
│   │       ├── checkout/   # Checkout flow
│   │       ├── webhooks/   # Payment webhooks
│   │       ├── products/   # Product management
│   │       ├── plans/      # Pricing plans
│   │       ├── licenses/   # License management
│   │       ├── subscriptions/ # Subscription engine
│   │       ├── admin/      # Platform admin
│   │       └── affiliates/ # Affiliate system
│   │
│   └── web/                # Next.js Frontend
│       └── src/app/
│           ├── (auth)/      # Auth pages
│           ├── customer/    # Customer portal
│           ├── seller/      # Seller dashboard
│           ├── platform-admin/ # Admin dashboard
│           └── checkout/    # Checkout pages
│
├── libs/
│   └── prisma/             # Database schema
│       └── schema/
│           └── schema.prisma
│
└── docs/                   # Project documentation
    ├── saabiz-master-build-todo.html
    └── saabiz-mor-platform-prd.html
```

## User Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Platform operator - full system access |
| `SELLER` | Product creators - manage products & plans |
| `CUSTOMER` | End users - purchase & manage subscriptions |
| `AFFILIATE` | Commission-based promoters |

## API Endpoints

### Authentication
- `POST /auth/register` - Register as seller
- `POST /auth/register-customer` - Register as customer
- `POST /auth/login` - User login

### Products
- `GET/POST /products` - List/Create products
- `GET/PUT/DELETE /products/:id` - Product CRUD

### Plans
- `GET/POST /plans` - List/Create plans
- `GET/PUT/DELETE /plans/:id` - Plan CRUD

### Checkout
- `POST /checkout/initialize` - Initialize payment

### Subscriptions (Customer)
- `GET /subscriptions/my-subscriptions` - Get customer subscriptions
- `POST /subscriptions/cancel` - Cancel subscription
- `POST /subscriptions/upgrade` - Upgrade subscription

### Licenses
- `POST /licenses/validate` - Validate license key

### Admin
- `GET /admin/dashboard` - Platform statistics
- `GET /admin/sellers` - List all sellers
- `GET /admin/products` - List all products
- `POST /admin/products/freeze` - Freeze/unfreeze product
- `GET /admin/payouts` - Seller payout info
- `POST /admin/payouts` - Process payout

### Affiliates
- `GET /affiliates/links` - Get affiliate links
- `POST /affiliates/track` - Track referral
- `GET /affiliates/commissions` - View commissions

## Payment Gateways

### Configuration

Configure payment gateways via the admin dashboard or directly in the database:

```sql
INSERT INTO "PlatformConfig" (
  "paystackActive", "paystackSecretKey", "paystackPublicKey",
  "flutterwaveActive", "flutterwaveSecretKey", "flutterwavePublicKey",
  "stripeActive", "stripeSecretKey", "stripePublicKey"
) VALUES (
  true, 'sk_live_xxx', 'pk_live_xxx',
  true, 'FLWSECK-xxx', 'FLWPUBK-xxx',
  true, 'sk_live_xxx', 'pk_live_xxx'
);
```

### Webhook Endpoints

- `POST /webhooks/paystack` - Paystack webhooks
- `POST /webhooks/flutterwave` - Flutterwave webhooks  
- `POST /webhooks/stripe` - Stripe webhooks

## Subscription Flow

1. Customer selects product and plan
2. Checkout initializes payment via selected gateway
3. Payment gateway processes payment
4. Webhook receives payment confirmation
5. Subscription and license created
6. Customer receives license key
7. Subscription renews automatically via webhooks

## License System

License keys are generated automatically on purchase. Validation endpoint:

```bash
POST /licenses/validate
{
  "key": "SAABIZ-XXXXXXXXXXXX",
  "productId": "uuid"
}
```

## Affiliate System

1. Sellers create affiliate links with commission rates
2. Affiliates share links
3. Purchases tracked via `?ref=AFFILIATE_CODE`
4. Commissions calculated and credited
5. Payouts processed via admin dashboard

## Roadmap

See `docs/saabiz-master-build-todo.html` for full development roadmap.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: `docs/`
- Issues: GitHub Issues
- Email: support@saabiz.com

---

Built with ❤️ using NestJS + Next.js
