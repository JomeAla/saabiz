# SAABIZ Development Notes

## Current Status

### Servers Running
- **API Server**: http://localhost:3001/api
- **Web Server**: http://localhost:3000
- **Marketplace**: http://localhost:3000/marketplace
- **Checkout**: http://localhost:3000/checkout
- **API Docs**: http://localhost:3001/api/docs

### Test Data Created
- **Seller**: seller@test.com (password: password123)
- **Products**:
  - SaaS Analytics Pro (Basic $9.99/mo, Pro $29.99/mo, Enterprise $99.99/yr)
  - Email Marketing Suite (Starter $19.99/mo)

### Payment Gateway Configuration
- **Current Status**: Stripe removed, Paystack and Flutterwave remain
- **Location**: Admin Panel > Payments (http://localhost:3000/admin/payments)

## Recently Completed (March 2026)

### Security Hardening
- Added CORS configuration (configurable via CORS_ORIGINS env)
- Added Helmet.js for secure HTTP headers
- Added rate limiting (100 requests/15min, 20 login attempts/min)
- Added Audit Logging module for tracking sensitive operations

### Monitoring & Logging
- Added Winston logging with daily rotate file transport
- Added Sentry integration (configure SENTRY_DSN in .env)
- HTTP request/response logging middleware

### Event Bus
- Internal event system using NestJS EventEmitter
- Events: payment.completed, license.created, subscription.canceled, affiliate.commission
- Automatic notifications and commission processing via events

### API Documentation
- Swagger/OpenAPI docs available at /api/docs
- Decorators added to licenses and OTA controllers

### JavaScript SDK
- New SDK at sdks/js/ for client-side license validation
- Supports: validateLicense, checkForUpdate, activateLicense, deactivateLicense

## New Environment Variables

```env
# Security
CORS_ORIGINS=http://localhost:3000,https://saabiz.com
NODE_ENV=development
LOG_LEVEL=info
LOG_DIR=./logs

# Sentry (optional)
# SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

## Database Migration Required

Run the following to add the AuditLog table:
```bash
cd libs/prisma/schema
npx prisma generate
cd apps/api
npx prisma db push
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

## Known Issues Fixed
1. Stripe payment integration removed (March 2026) - only Paystack and Flutterwave remain
2. Fixed TypeScript errors in webhooks.service.ts, affiliates.service.ts, products.service.ts
3. Added PrismaService providers to multiple modules
4. Web API routes - using direct API calls to http://localhost:3001 instead of proxy

## Remaining Work
1. Configure real payment gateway keys when available
2. Test complete checkout flow with real payment gateway
3. Fix web API route proxy issue (optional - current workaround works)
4. Run Prisma migration for AuditLog table
5. Test event bus functionality
