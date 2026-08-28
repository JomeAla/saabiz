import { PrismaClient, Role, Interval } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding tenants, users, products and payment configs...\n');

  // ---------------------------------------------------------------
  // Platform Admin
  // ---------------------------------------------------------------
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@saabiz.com' },
    update: {},
    create: {
      email: 'admin@saabiz.com',
      password: adminPassword,
      role: Role.ADMIN,
      isEmailVerified: true,
    },
  });
  console.log('✅ Platform Admin created:');
  console.log('   Email: admin@saabiz.com');
  console.log('   Password: admin123');
  console.log('');

  // ---------------------------------------------------------------
  // Platform-level seller (no tenant)
  // ---------------------------------------------------------------
  const sellerPassword = await bcrypt.hash('seller123', 12);
  await prisma.user.upsert({
    where: { email: 'seller@saabiz.com' },
    update: {},
    create: {
      email: 'seller@saabiz.com',
      password: sellerPassword,
      role: Role.SELLER,
      isEmailVerified: true,
      seller: {
        create: {
          businessName: 'Test Software Co',
          payoutEmail: 'seller@saabiz.com',
          payoutGateway: 'paystack',
        },
      },
    },
  });
  console.log('✅ Platform seller created:');
  console.log('   Email: seller@saabiz.com');
  console.log('   Password: seller123');
  console.log('');

  // ---------------------------------------------------------------
  // Demo tenant: Acme Software (storefront at acme.saabiz.com)
  // ---------------------------------------------------------------
  const acmeTenant = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      name: 'Acme Software',
      slug: 'acme',
      settings: {
        logoUrl: '',
        primaryColor: '#7c3aed',
        tagline: 'Software that scales with your business',
        currency: 'NGN',
      },
    },
  });
  await prisma.domain.upsert({
    where: { host: 'acme.saabiz.com' },
    update: {},
    create: {
      host: 'acme.saabiz.com',
      tenantId: acmeTenant.id,
      isPrimary: true,
      isVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'acme@saabiz.com' },
    update: {},
    create: {
      email: 'acme@saabiz.com',
      password: sellerPassword,
      role: Role.SELLER,
      isEmailVerified: true,
      seller: {
        create: {
          tenantId: acmeTenant.id,
          businessName: 'Acme Software',
          payoutEmail: 'acme@saabiz.com',
          payoutGateway: 'paystack',
        },
      },
    },
  });
  console.log('✅ Tenant "Acme Software" created:');
  console.log('   Storefront: http://acme.saabiz.com');
  console.log('   Email: acme@saabiz.com / Password: seller123');
  console.log('');

  // ---------------------------------------------------------------
  // Demo tenant: Globex Digital (storefront at globex.saabiz.com)
  // ---------------------------------------------------------------
  const globexTenant = await prisma.tenant.upsert({
    where: { slug: 'globex' },
    update: {},
    create: {
      name: 'Globex Digital',
      slug: 'globex',
      settings: {
        logoUrl: '',
        primaryColor: '#0ea5e9',
        tagline: 'Reliable digital tools for modern teams',
        currency: 'NGN',
      },
    },
  });
  await prisma.domain.upsert({
    where: { host: 'globex.saabiz.com' },
    update: {},
    create: {
      host: 'globex.saabiz.com',
      tenantId: globexTenant.id,
      isPrimary: true,
      isVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'globex@saabiz.com' },
    update: {},
    create: {
      email: 'globex@saabiz.com',
      password: sellerPassword,
      role: Role.SELLER,
      isEmailVerified: true,
      seller: {
        create: {
          tenantId: globexTenant.id,
          businessName: 'Globex Digital',
          payoutEmail: 'globex@saabiz.com',
          payoutGateway: 'flutterwave',
        },
      },
    },
  });
  console.log('✅ Tenant "Globex Digital" created:');
  console.log('   Storefront: http://globex.saabiz.com');
  console.log('   Email: globex@saabiz.com / Password: seller123');
  console.log('');

  // ---------------------------------------------------------------
  // Customer + Affiliate
  // ---------------------------------------------------------------
  const customerPassword = await bcrypt.hash('customer123', 12);
  await prisma.user.upsert({
    where: { email: 'customer@saabiz.com' },
    update: {},
    create: {
      email: 'customer@saabiz.com',
      password: customerPassword,
      role: Role.CUSTOMER,
      isEmailVerified: true,
    },
  });
  console.log('✅ Customer created:');
  console.log('   Email: customer@saabiz.com');
  console.log('   Password: customer123');
  console.log('');

  const affiliatePassword = await bcrypt.hash('affiliate123', 12);
  await prisma.user.upsert({
    where: { email: 'affiliate@saabiz.com' },
    update: {},
    create: {
      email: 'affiliate@saabiz.com',
      password: affiliatePassword,
      role: Role.AFFILIATE,
      isEmailVerified: true,
      affiliate: {
        create: {
          affiliateCode: 'AFFILIATE2024',
          commissionRate: 0.15,
        },
      },
    },
  });
  console.log('✅ Affiliate created:');
  console.log('   Email: affiliate@saabiz.com');
  console.log('   Password: affiliate123');
  console.log('');

  // ---------------------------------------------------------------
  // Products + plans for tenant storefronts
  // ---------------------------------------------------------------
  const acmeUser = await prisma.user.findUnique({ where: { email: 'acme@saabiz.com' } });
  const globexUser = await prisma.user.findUnique({ where: { email: 'globex@saabiz.com' } });
  const acmeSeller = acmeUser ? await prisma.seller.findUnique({ where: { userId: acmeUser.id } }) : null;
  const globexSeller = globexUser ? await prisma.seller.findUnique({ where: { userId: globexUser.id } }) : null;

  if (acmeSeller) {
    const analyticsProduct = await prisma.product.upsert({
      where: { id: 'seed-acme-analytics' },
      update: {},
      create: {
        id: 'seed-acme-analytics',
        sellerId: acmeSeller.id,
        name: 'SaaS Analytics Pro',
        description: 'Funnel analytics, retention cohorts and revenue tracking for SaaS teams.',
        downloadUrl: 'https://acme.saabiz.com/downloads/saas-analytics-pro.zip',
        version: '1.2.0',
        plans: {
          createMany: {
            data: [
              {
                id: 'seed-acme-analytics-basic',
                name: 'Basic',
                price: 9.99,
                interval: Interval.MONTHLY,
                isDefault: true,
                maxActivations: 1,
              },
              {
                id: 'seed-acme-analytics-pro',
                name: 'Pro',
                price: 29.99,
                interval: Interval.MONTHLY,
                isDefault: false,
                maxActivations: 5,
              },
              {
                id: 'seed-acme-analytics-enterprise',
                name: 'Enterprise',
                price: 99.99,
                interval: Interval.ANNUAL,
                isDefault: false,
                maxActivations: 0,
              },
            ],
            skipDuplicates: true,
          },
        },
      },
    });
    console.log(`✅ Product "${analyticsProduct.name}" created for Acme Software`);
  }

  if (acmeSeller) {
    await prisma.product.upsert({
      where: { id: 'seed-acme-email' },
      update: {},
      create: {
        id: 'seed-acme-email',
        sellerId: acmeSeller.id,
        name: 'Email Marketing Suite',
        description: 'Automated email campaigns, drip sequences and audience segmentation.',
        downloadUrl: 'https://acme.saabiz.com/downloads/email-marketing-suite.zip',
        version: '2.0.1',
        plans: {
          createMany: {
            data: [
              {
                id: 'seed-acme-email-starter',
                name: 'Starter',
                price: 19.99,
                interval: Interval.MONTHLY,
                isDefault: true,
                maxActivations: 1,
              },
            ],
            skipDuplicates: true,
          },
        },
      },
    });
    console.log('✅ Product "Email Marketing Suite" created for Acme Software');
  }

  if (globexSeller) {
    await prisma.product.upsert({
      where: { id: 'seed-globex-backup' },
      update: {},
      create: {
        id: 'seed-globex-backup',
        sellerId: globexSeller.id,
        name: 'Cloud Backup Pro',
        description: 'Automated off-site backups with one-click restore for small businesses.',
        downloadUrl: 'https://globex.saabiz.com/downloads/cloud-backup-pro.zip',
        version: '3.4.2',
        plans: {
          createMany: {
            data: [
              {
                id: 'seed-globex-backup-solo',
                name: 'Solo',
                price: 14.99,
                interval: Interval.MONTHLY,
                isDefault: true,
                maxActivations: 1,
              },
              {
                id: 'seed-globex-backup-team',
                name: 'Team',
                price: 49.99,
                interval: Interval.ANNUAL,
                isDefault: false,
                maxActivations: 10,
              },
            ],
            skipDuplicates: true,
          },
        },
      },
    });
    console.log('✅ Product "Cloud Backup Pro" created for Globex Digital');
  }
  console.log('');

  // ---------------------------------------------------------------
  // Honeypot decoy license keys (for testing the anti-piracy trap)
  // ---------------------------------------------------------------
  const acmeAnalytics = await prisma.product.findUnique({ where: { id: 'seed-acme-analytics' } });
  if (acmeAnalytics) {
    await prisma.honeypot.upsert({
      where: { key: 'SAABIZ-H0N3YP0T-ACME01' },
      update: {},
      create: {
        productId: acmeAnalytics.id,
        key: 'SAABIZ-H0N3YP0T-ACME01',
        label: 'Planted in leaked v1.2.0 build (forum)',
      },
    });
    console.log('✅ Honeypot key "SAABIZ-H0N3YP0T-ACME01" created for SaaS Analytics Pro');
  }

  const globexBackup = await prisma.product.findUnique({ where: { id: 'seed-globex-backup' } });
  if (globexBackup) {
    await prisma.honeypot.upsert({
      where: { key: 'SAABIZ-H0N3YP0T-GLBX01' },
      update: {},
      create: {
        productId: globexBackup.id,
        key: 'SAABIZ-H0N3YP0T-GLBX01',
        label: 'Planted in leaked v3.4.2 build (torrent)',
      },
    });
    console.log('✅ Honeypot key "SAABIZ-H0N3YP0T-GLBX01" created for Cloud Backup Pro');
  }
  console.log('');

  // ---------------------------------------------------------------
  // Payment configs (placeholder keys, inactive until real keys added)
  // ---------------------------------------------------------------
  await prisma.platformConfig.upsert({
    where: { id: 'seed-platform-payment-config' },
    update: {},
    create: {
      id: 'seed-platform-payment-config',
      tenantId: null,
      paystackPublicKey: 'pk_test_placeholder',
      paystackSecretKey: 'sk_test_placeholder',
      paystackActive: false,
      flutterwavePublicKey: 'FLWPUBK_TEST_placeholder',
      flutterwaveSecretKey: 'FLWSECK_TEST_placeholder',
      flutterwaveEncryptionKey: 'FLWSECK_TEST_placeholder_enc',
      flutterwaveActive: false,
    },
  });

  await prisma.platformConfig.upsert({
    where: { id: 'seed-acme-payment-config' },
    update: {},
    create: {
      id: 'seed-acme-payment-config',
      tenantId: acmeTenant.id,
      paystackPublicKey: 'pk_test_placeholder',
      paystackSecretKey: 'sk_test_placeholder',
      paystackActive: false,
      flutterwaveActive: false,
    },
  });
  console.log('✅ Payment configs seeded (placeholder keys, inactive)');
  console.log('   Configure real keys via Admin Panel > Payments');
  console.log('');

  console.log('========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });