-- AlterTable
ALTER TABLE "Agency" ADD COLUMN     "kioskModeEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AgencyStaff" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "permissions" TEXT NOT NULL DEFAULT '{"canManageQueue":true,"canManageServices":false,"canManageStaff":false,"canViewAnalytics":true,"canManageBranches":false,"canManageWorkingHours":false,"canExportData":false,"canManageProfile":false}';

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "counterId" TEXT;

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "nameFr" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "agencyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counter" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "nameFr" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" TEXT NOT NULL,
    "staffId" TEXT,
    "currentReservationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_agencyId_idx" ON "Branch"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "Counter_currentReservationId_key" ON "Counter"("currentReservationId");

-- CreateIndex
CREATE INDEX "Counter_branchId_idx" ON "Counter"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Counter_branchId_number_key" ON "Counter"("branchId", "number");

-- AddForeignKey
ALTER TABLE "AgencyStaff" ADD CONSTRAINT "AgencyStaff_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "Counter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Counter" ADD CONSTRAINT "Counter_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Counter" ADD CONSTRAINT "Counter_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "AgencyStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Counter" ADD CONSTRAINT "Counter_currentReservationId_fkey" FOREIGN KEY ("currentReservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
