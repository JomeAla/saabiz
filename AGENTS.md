# SAABIZ Development Notes

## Current Status

### Servers Running
- **API Server**: http://localhost:3001/api
- **Web Server**: http://localhost:3000
- **Marketplace**: http://localhost:3000/marketplace
- **Checkout**: http://localhost:3000/checkout

### Test Data Created
- **Seller**: seller@test.com (password: password123)
- **Products**:
  - SaaS Analytics Pro (Basic $9.99/mo, Pro $29.99/mo, Enterprise $99.99/yr)
  - Email Marketing Suite (Starter $19.99/mo)

### Payment Gateway Configuration
- **Current Status**: Paystack and Flutterwave configured
- **Location**: Admin Panel > Payments (http://localhost:3000/admin/payments)

## Recently Completed (March 2026)

### Dockerization
- Dockerfiles added for API and Web apps
- docker-compose.yml with PostgreSQL 16, Redis 7, API, and Web services
- saabiz-postgres and saabiz-redis containers already running

### SDKs
- JavaScript SDK at sdks/js/ for client-side license validation
- PHP SDK at sdks/php/ for WordPress/PHP integration
- Supports: validateLicense, checkForUpdate, activateLicense, deactivateLicense

### GitHub Actions CI/CD
- Full CI/CD pipeline with test, build, docker-build, and deploy jobs
- Docker Hub image publishing configured

### Project Infrastructure
- Monorepo structure with Nx 20
- Prisma 5 with PostgreSQL
- TypeScript 5.5.2

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:Mylordhelpme12@localhost:5434/saabiz?schema=public"
PORT=3001
REDIS_URL="redis://localhost:6380"
JWT_SECRET="SAABIZ_JWT_SECRET_2026_KEY"
NEXT_PUBLIC_API_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3000,https://saabiz.com
NODE_ENV=development
LOG_LEVEL=info
LOG_DIR=./logs
```

## Database Migration Required

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Or push schema (for development)
pnpm prisma:push
```

## TODO: Real Payment Gateway Keys Required

### Need to Configure:
1. **Paystack** (Nigeria/Africa)
   - Get keys from: https://dashboard.paystack.co/#/settings/developer
   - Public Key: pk_...
   - Secret Key: sk_...

2. **Flutterwave** (Africa + PayPal)
   - Get keys from: https://dashboard.flutterwave.com/settings/api
   - Public Key: FLWPUBK-...
   - Secret Key: FLWSECK-...
   - Encryption Key: from dashboard

### How to Configure:
1. Go to http://localhost:3000/admin/payments
2. Login as admin
3. Enter the API keys for each gateway
4. Toggle the gateway "Active" switch
5. Click "Save Configuration"

## Remaining Work
1. Configure real payment gateway keys when available
2. Test complete checkout flow with real payment gateway
3. Build Docker images for production deployment
4. Set up Contabo deployment
5. Add monitoring dashboard (Phase 3 Scale)
