import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { PrismaService } from './app/prisma.service';
import { LoggerMiddleware } from './app/logger/logger.middleware';
import rateLimit from 'express-rate-limit';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3002'];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin) || origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Sentry disabled
  if (false && process.env.SENTRY_DSN) {
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

  app.use(`/${globalPrefix}/health`, (req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(`/${globalPrefix}/health/db`, async (req: any, res: any) => {
    try {
      const prisma = app.get(PrismaService);
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(503).json({ status: 'unhealthy', database: 'disconnected', timestamp: new Date().toISOString() });
    }
  });

  // Swagger disabled due to missing dependency
  /*
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SAABIZ API')
    .setDescription('SAABIZ - Merchant of Record & Software Monetization Platform')
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
  */

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
