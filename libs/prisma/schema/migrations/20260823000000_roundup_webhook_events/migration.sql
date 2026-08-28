-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "lastDunningSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "reference" TEXT,
    "signature" TEXT,
    "rawBody" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "error" TEXT,
    "configId" TEXT,
    "replayCount" INTEGER NOT NULL DEFAULT 0,
    "lastReplayAt" TIMESTAMP(3),
    "lastReplayStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebhookEvent_gateway_createdAt_idx" ON "WebhookEvent"("gateway", "createdAt");