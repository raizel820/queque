-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "reclaimRequestedAt" TIMESTAMP(3),
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderSentAt" TIMESTAMP(3),
ADD COLUMN     "skippedAt" TIMESTAMP(3),
ADD COLUMN     "skippedForNoShow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsReminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsReminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "reminderMinutes" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "smsNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "SmsSettings" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'algeria_sms',
    "apiUrl" TEXT NOT NULL DEFAULT '',
    "apiKey" TEXT NOT NULL DEFAULT '',
    "senderName" TEXT NOT NULL DEFAULT 'QueueWise',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "smsPerReminder" INTEGER NOT NULL DEFAULT 1,
    "maxSmsPerDay" INTEGER NOT NULL DEFAULT 5,
    "testPhoneNumber" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT '',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "smsSettingsId" TEXT,

    CONSTRAINT "SmsLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SmsLog" ADD CONSTRAINT "SmsLog_smsSettingsId_fkey" FOREIGN KEY ("smsSettingsId") REFERENCES "SmsSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
