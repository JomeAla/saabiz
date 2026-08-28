-- CreateTable
CREATE TABLE "Honeypot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Honeypot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoneypotHit" (
    "id" TEXT NOT NULL,
    "honeypotId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "machineId" TEXT,
    "domain" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HoneypotHit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotSubmission" (
    "id" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "email" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Honeypot_key_key" ON "Honeypot"("key");

-- CreateIndex
CREATE INDEX "Honeypot_productId_idx" ON "Honeypot"("productId");

-- CreateIndex
CREATE INDEX "HoneypotHit_honeypotId_createdAt_idx" ON "HoneypotHit"("honeypotId", "createdAt");

-- CreateIndex
CREATE INDEX "BotSubmission_createdAt_idx" ON "BotSubmission"("createdAt");

-- AddForeignKey
ALTER TABLE "Honeypot" ADD CONSTRAINT "Honeypot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoneypotHit" ADD CONSTRAINT "HoneypotHit_honeypotId_fkey" FOREIGN KEY ("honeypotId") REFERENCES "Honeypot"("id") ON DELETE CASCADE ON UPDATE CASCADE;