import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { PrismaService } from './app/prisma.service';
import { TenantService } from './app/tenancy/tenant.service';
import { LoggerMiddleware } from './app/logger/logger.middleware';
import rateLimit from 'express-rate-limit';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const tenantService = app.get(TenantService);

  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }

  // Resolve tenant context from the request host for every request
  app.use(tenantService.runForRequest.bind(tenantService));

  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().toLowerCase())
    .filter(Boolean);
  const platformHost = tenantService.platformHost;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const o = origin.toLowerCase();
      if (corsOrigins.includes(o)) return callback(null, true);

      try {
        const host = new URL(origin).hostname.toLowerCase().replace(/^www\./, '');
        // Wildcard for tenant subdomains of the platform root domain
        if (host.endsWith(`.${platformHost}`)) return callback(null, true);
        // Dynamically discovered tenant (custom) domains
        if (tenantService.getKnownHosts().includes(host)) return callback(null, true);
      } catch {
        /* invalid origin format */
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-Host'],
  });

  // Sentry (enabled when SENTRY_DSN is set)
  if (process.env.SENTRY_DSN) {
    try {
      const Sentry = require('@sentry/node');
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express(),
        ],
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      });
      app.use(Sentry.Handlers.requestHandler() as any);
      app.use(Sentry.Handlers.errorHandler() as any);
      Logger.log('Sentry initialized', 'Bootstrap');
    } catch (error) {
      Logger.warn('Failed to initialize Sentry: ' + (error as Error).message);
    }
  }

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  }));

  app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: 'Too many login attempts, please try again later.' },
    keyGenerator: (req: any) => (req.body as any)?.email || req.ip,
  }));

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.use(`/${globalPrefix}/health`, (req: any, res: any, next: any) => {
    const path = req.path || '';

    if (path === '' || path === '/') {
      return res.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    if (path === '/db') {
      return (async () => {
        try {
          const prisma = app.get(PrismaService);
          await prisma.$queryRaw`SELECT 1`;
          res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
        } catch (error) {
          res.status(503).json({ status: 'unhealthy', database: 'disconnected', timestamp: new Date().toISOString() });
        }
      })();
    }

    if (path === '/redis') {
      return (async () => {
        try {
          const Redis = require('ioredis');
          const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { lazyConnect: true });
          await redis.connect();
          const pong = await redis.ping();
          redis.disconnect();
          res.json({ status: 'healthy', redis: pong === 'PONG' ? 'connected' : 'unknown', timestamp: new Date().toISOString() });
        } catch (error) {
          res.status(503).json({ status: 'unhealthy', redis: 'disconnected', timestamp: new Date().toISOString() });
        }
      })();
    }

    next();
  });

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SAABIZ API')
      .setDescription('SAABIZ - Multi-domain Merchant of Record & Software Monetization Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('products', 'Product management')
      .addTag('plans', 'Plan management')
      .addTag('checkout', 'Checkout & payments')
      .addTag('licenses', 'License validation')
      .addTag('subscriptions', 'Subscription management')
      .addTag('webhooks', 'Payment webhooks')
      .addTag('admin', 'Platform administration')
      .addTag('affiliates', 'Affiliate system')
      .addTag('seller', 'Seller dashboard')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${globalPrefix}/docs`, app, document);
    Logger.log(`Swagger docs available at http://localhost:${process.env.PORT || 3001}/${globalPrefix}/docs`, 'Bootstrap');
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();