-- AlterTable
ALTER TABLE "patients" ADD COLUMN "curp" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "patients_curp_key" ON "patients"("curp");
