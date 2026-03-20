import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test users...\n');

  // Platform Admin
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@saarbiz.com' },
    update: {},
    create: {
      email: 'admin@saarbiz.com',
      password: adminPassword,
      role: Role.ADMIN,
      isEmailVerified: true,
    },
  });
  console.log('✅ Platform Admin created:');
  console.log('   Email: admin@saarbiz.com');
  console.log('   Password: admin123');
  console.log('');

  // Seller
  const sellerPassword = await bcrypt.hash('seller123', 12);
  const seller = await prisma.user.upsert({
    where: { email: 'seller@saarbiz.com' },
    update: {},
    create: {
      email: 'seller@saarbiz.com',
      password: sellerPassword,
      role: Role.SELLER,
      isEmailVerified: true,
      seller: {
        create: {
          businessName: 'Test Software Co',
          payoutEmail: 'seller@saarbiz.com',
          payoutGateway: 'stripe',
        },
      },
    },
  });
  console.log('✅ Seller created:');
  console.log('   Email: seller@saarbiz.com');
  console.log('   Password: seller123');
  console.log('');

  // Customer
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@saarbiz.com' },
    update: {},
    create: {
      email: 'customer@saarbiz.com',
      password: customerPassword,
      role: Role.CUSTOMER,
      isEmailVerified: true,
    },
  });
  console.log('✅ Customer created:');
  console.log('   Email: customer@saarbiz.com');
  console.log('   Password: customer123');
  console.log('');

  // Affiliate
  const affiliatePassword = await bcrypt.hash('affiliate123', 12);
  const affiliate = await prisma.user.upsert({
    where: { email: 'affiliate@saarbiz.com' },
    update: {},
    create: {
      email: 'affiliate@saarbiz.com',
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
  console.log('   Email: affiliate@saarbiz.com');
  console.log('   Password: affiliate123');
  console.log('');

  console.log('========================================');
  console.log('All test accounts created successfully!');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('Error creating users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
