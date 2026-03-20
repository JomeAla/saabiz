-- Test Users for Saarbiz Platform
-- Run this script against your PostgreSQL database to create test accounts

-- Platform Admin
INSERT INTO "User" (id, email, password, role, "isEmailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@saarbiz.com',
  '$2b$12$u7hKL47lCNXBQoqd7e4Ln.sH.qnDmgDHyeQuGVwuedGgxCffJziWW',
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Seller
INSERT INTO "User" (id, email, password, role, "isEmailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'seller@saarbiz.com',
  '$2b$12$45042f.2EN6bwlAQmbD/vur4ToYu5HvvcHogF1i/tIuebyyzvyHzq',
  'SELLER',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Create Seller profile for the seller user
INSERT INTO "Seller" (id, "userId", "businessName", "payoutEmail", "payoutGateway", "totalEarnings", "pendingPayout")
SELECT 
  gen_random_uuid(),
  u.id,
  'Test Software Co',
  'seller@saarbiz.com',
  'stripe',
  0,
  0
FROM "User" u
WHERE u.email = 'seller@saarbiz.com'
ON CONFLICT ("userId") DO NOTHING;

-- Customer
INSERT INTO "User" (id, email, password, role, "isEmailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'customer@saarbiz.com',
  '$2b$12$JuB8eR52LWTCtLJPjAbgkOK2XoVEZaDRkEx/li7E2dRaXqxwsINwK',
  'CUSTOMER',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Affiliate
INSERT INTO "User" (id, email, password, role, "isEmailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'affiliate@saarbiz.com',
  '$2b$12$Ffa4UAc4HrL06iE8/jtYK.AIRnF/gu9iugwEyDqADU7q12M71Aya6',
  'AFFILIATE',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Create Affiliate profile for the affiliate user
INSERT INTO "Affiliate" (id, "userId", "affiliateCode", "commissionRate", "totalEarnings", "pendingPayout", "totalReferrals", "totalCommission", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  u.id,
  'AFFILIATE2024',
  0.15,
  0,
  0,
  0,
  0,
  NOW(),
  NOW()
FROM "User" u
WHERE u.email = 'affiliate@saarbiz.com'
ON CONFLICT ("userId") DO NOTHING;

-- Verify the users were created
SELECT email, role FROM "User" WHERE email LIKE '%@saarbiz.com';
