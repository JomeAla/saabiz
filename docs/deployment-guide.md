# SAABIZ Deployment Guide

This guide covers deploying SAABIZ to a production server.

## Prerequisites

- Ubuntu 20.04+ (recommended) or similar Linux distribution
- Docker & Docker Compose installed
- Domain name pointed to your server's IP
- SMTP provider account (SendGrid, Resend, etc.)
- Paystack and/or Flutterwave account with API keys

## Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 40 GB | 100+ GB SSD |
| Bandwidth | 1 TB | Unlimited |

## Step 1: Server Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### Install Docker Compose
```bash
sudo apt install docker-compose -y
```

## Step 2: Clone & Configure

### Clone Repository
```bash
git clone https://github.com/your-org/saabiz.git /opt/saabiz
cd /opt/saabiz
```

### Create Environment File
```bash
cp .env.example .env
nano .env
```

### Configure Environment Variables

```env
# Database
POSTGRES_USER=saabiz
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=saabiz
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=your-redis-password
REDIS_PORT=6379

# Security
JWT_SECRET=generate-a-very-long-random-string

# URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com

# Email (Production)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM="SAABIZ" <noreply@yourdomain.com>

# Environment
NODE_ENV=production
```

## Step 3: Database Setup

### Start Database Containers
```bash
docker-compose up -d postgres redis
```

### Run Migrations
```bash
docker-compose exec api npx prisma migrate deploy
```

### Seed Database (Optional)
```bash
docker-compose exec api npx prisma db seed
```

## Step 4: Build & Deploy

### Build Docker Images
```bash
docker-compose build
```

### Start All Services
```bash
docker-compose up -d
```

### Check Status
```bash
docker-compose ps
docker-compose logs -f
```

## Step 5: SSL Setup (Recommended)

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL Certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### Update Nginx Config

After generating SSL, update `docker/nginx.conf` with HTTPS settings.

## Step 6: Configure Payment Gateways

### Paystack
1. Create account at [paystack.com](https://paystack.com)
2. Get API keys from Dashboard → Settings → API Keys
3. Add keys to database via Admin Panel at `/admin/payments`

### Flutterwave
1. Create account at [flutterwave.com](https://flutterwave.com)
2. Get API keys from Dashboard → Settings → API Keys
3. Add keys to database via Admin Panel at `/admin/payments`

### Webhook Configuration

Configure webhooks in your payment gateway dashboards:

**Paystack:**
```
https://api.yourdomain.com/api/webhooks/paystack
```

**Flutterwave:**
```
https://api.yourdomain.com/api/webhooks/flutterwave
```

## Step 7: Configure Email

### SendGrid Setup
1. Create account at [sendgrid.com](https://sendgrid.com)
2. Create API Key: Settings → API Keys → Create API Key
3. Verify Sender Authentication (required)

Update `.env`:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### Resend (Alternative)
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_your_resend_api_key
```

## Step 8: Production Checklist

### Security
- [ ] Change all default passwords
- [ ] Enable SSL/TLS
- [ ] Configure firewall (ufw)
- [ ] Set up fail2ban
- [ ] Enable rate limiting
- [ ] Review CORS origins

### Monitoring
- [ ] Set up log rotation
- [ ] Configure uptime monitoring
- [ ] Set up error alerting
- [ ] Configure backups

### Backup Strategy
```bash
# Database backup
docker-compose exec postgres pg_dump -U saabiz saabiz > backup_$(date +%Y%m%d).sql

# Volume backup
docker-compose exec postgres tar -czf /tmp/db_backup.tar.gz /var/lib/postgresql/data
```

## Step 9: Update DNS

Add the following DNS records:

| Type | Name | Value |
|------|------|-------|
| A | @ | YOUR_SERVER_IP |
| A | api | YOUR_SERVER_IP |
| CNAME | www | @ |

## Troubleshooting

### Check Logs
```bash
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f nginx
```

### Restart Services
```bash
docker-compose restart
```

### Rebuild After Updates
```bash
git pull origin main
docker-compose build
docker-compose up -d
```

### Database Issues
```bash
# Check database connection
docker-compose exec api node -e "require('./libs/prisma').PrismaService')"

# Reset database
docker-compose exec postgres psql -U saabiz -c "DROP DATABASE saabiz;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE saabiz;"
docker-compose exec api npx prisma migrate deploy
```

### Common Issues

**502 Bad Gateway:**
- Check if API and Web containers are running
- Check logs for startup errors

**Database Connection Error:**
- Verify DATABASE_URL in .env
- Check if postgres container is healthy

**Email Not Sending:**
- Verify SMTP credentials
- Check email logs in API

## Maintenance

### Update Application
```bash
git pull origin main
docker-compose build
docker-compose up -d
docker image prune -f
```

### Backup
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U saabiz saabiz > /backups/saabiz_$DATE.sql
```

### Restore
```bash
docker-compose exec -T postgres psql -U saabiz saabiz < /backups/saabiz_YYYYMMDD.sql
```

## Support

For issues, please check:
- [GitHub Issues](https://github.com/your-org/saabiz/issues)
- [SAABIZ Documentation](https://docs.saabiz.com)
