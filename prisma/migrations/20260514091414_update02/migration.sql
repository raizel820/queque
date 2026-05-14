-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "entityId" TEXT,
ALTER COLUMN "message" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "ratedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Notification_entityId_idx" ON "Notification"("entityId");
