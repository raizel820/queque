-- AlterTable
ALTER TABLE "SmsPurchase" ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "receiptUrl" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
