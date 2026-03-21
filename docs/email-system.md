# SAABIZ Email System Documentation

## Overview

SAABIZ uses **Nodemailer** for email delivery. The system is designed to work with any SMTP provider.

## Current Configuration

### Development Mode (Default)
The system uses **Ethereal Email** for development/testing:
- **Host**: smtp.ethereal.email
- **Port**: 587
- **No credentials required** - emails are logged to console

When SMTP credentials are not configured, the system:
1. Logs email content to console
2. Generates test account URLs for preview

### Production Configuration

**IMPORTANT**: Before deploying to production, you MUST configure a real email provider.

#### Option 1: SendGrid (Recommended)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

#### Option 2: Resend (Modern, Developer-Friendly)
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_your_resend_api_key
```

#### Option 3: AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_aws_access_key
SMTP_PASS=your_aws_secret_key
```

#### Option 4: Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASS=your_mailgun_api_key
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SMTP_HOST` | SMTP server hostname | Yes |
| `SMTP_PORT` | SMTP port (587 for TLS, 465 for SSL) | Yes |
| `SMTP_SECURE` | Use SSL/TLS (true for port 465) | Yes |
| `SMTP_USER` | SMTP username/API key | Yes |
| `SMTP_PASS` | SMTP password/API key | Yes |
| `SMTP_FROM` | Sender email address | No (defaults to noreply@saabiz.com) |
| `FRONTEND_URL` | Frontend URL for email links | Yes |

## Email Templates

The following emails are sent automatically:

| Email | Trigger | Purpose |
|-------|---------|---------|
| **Welcome** | User registration | Onboarding new users |
| **Email Verification** | User registration | Verify email address |
| **Payment Receipt** | Successful purchase | Purchase confirmation |
| **License Key** | After payment | Deliver license key |
| **Subscription Confirmed** | Subscription activated | Subscription start |
| **Subscription Renewal** | Before renewal | Reminder 1 day before |
| **Subscription Canceled** | Subscription cancellation | Confirmation of cancel |
| **License Expiring** | Before license expiry | Reminder 7 days before |
| **Password Reset** | User request | Password reset link |
| **Refund Confirmation** | After refund | Refund processed |
| **Affiliate Commission** | Commission earned | Commission notification |
| **Weekly Report** | Every Monday noon | Admin dashboard report |

## Email Template Styling

All emails use a consistent branded template:
- **Primary Color**: #10b981 (Emerald green)
- **Font**: System fonts (-apple-system, Segoe UI, Roboto)
- **Max Width**: 600px (mobile-friendly)
- **Includes**: Header with gradient, branded footer

## Preview Emails

### Development
When `SMTP_USER` and `SMTP_PASS` are not set, emails are:
1. Logged to console with full content
2. Preview URLs generated via Ethereal

### Production
Configure `SMTP_USER` and `SMTP_PASS` for real email delivery.

## Testing

### Local Testing
1. Start the API server
2. Register a new user or make a test purchase
3. Check console logs for email preview URLs
4. Or visit Ethereal.email inbox

### Test Email Accounts
- [Ethereal.email](https://ethereal.email) - Free fake SMTP service
- [Mailtrap](https://mailtrap.io) - Popular for development
- [MailHog](https://github.com/mailhog/MailHog) - Local email testing

## Checklist Before Production

- [ ] Create account with email provider (SendGrid/Resend/SES)
- [ ] Verify sender domain/email
- [ ] Add SMTP credentials to environment variables
- [ ] Update `FRONTEND_URL` to production URL
- [ ] Update `SMTP_FROM` with verified sender
- [ ] Test all email types (register, purchase, reset)
- [ ] Check spam scores
- [ ] Set up bounce handling (if supported)

## Troubleshooting

### Emails Not Sending
1. Check if `SMTP_USER` and `SMTP_PASS` are set
2. Verify SMTP credentials are correct
3. Check API logs for error messages
4. Ensure firewall allows outbound SMTP

### Emails Going to Spam
1. Use a reputable email provider (SendGrid, SES)
2. Set up SPF, DKIM, DMARC records
3. Verify your sender domain
4. Avoid spam trigger words
5. Keep emails short and relevant

### Rate Limiting
Most email providers have sending limits:
- SendGrid: 100-100,000 emails/day (based on plan)
- SES: 14 emails/second by default
- Resend: 100 emails/day free tier

## Future Improvements

- [ ] Email open/click tracking
- [ ] Unsubscribe links (required for marketing)
- [ ] Email preference center
- [ ] Transactional email provider with better deliverability
- [ ] Email analytics dashboard
