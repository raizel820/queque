-- AlterTable
ALTER TABLE "SmsSettings" ADD COLUMN     "templateCustom" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "templateNoShow" TEXT NOT NULL DEFAULT '⚠️ BLASTI: Dear {customerName}, your ticket {ticketNumber} at {agencyName} was skipped due to no-show. You can reclaim your position.',
ADD COLUMN     "templateTurnApproaching" TEXT NOT NULL DEFAULT '🔄 BLASTI: Dear {customerName}, your turn is approaching! Ticket {ticketNumber} at {agencyName}. Position: {position}. Est. wait: {estimatedMinutes} min.',
ADD COLUMN     "templateYourTurn" TEXT NOT NULL DEFAULT '🎫 BLASTI: Dear {customerName}, it''s your turn now! Ticket {ticketNumber} at {agencyName}. Please proceed.',
ALTER COLUMN "senderName" SET DEFAULT 'BLASTI';

-- CreateTable
CREATE TABLE "PaymentSettings" (
    "id" TEXT NOT NULL,
    "ccpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bankEnabled" BOOLEAN NOT NULL DEFAULT false,
    "electronicEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ccpAccount" TEXT NOT NULL DEFAULT '',
    "ccpKey" TEXT NOT NULL DEFAULT '',
    "bankName" TEXT NOT NULL DEFAULT '',
    "bankAccount" TEXT NOT NULL DEFAULT '',
    "bankRib" TEXT NOT NULL DEFAULT '',
    "ewalletNumber" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentSettings_pkey" PRIMARY KEY ("id")
);
