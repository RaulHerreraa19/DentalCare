-- AlterTable
ALTER TABLE "medical_records" ADD COLUMN     "brushing_frequency" TEXT,
ADD COLUMN     "current_medications" TEXT,
ADD COLUMN     "dental_history" TEXT,
ADD COLUMN     "family_history" TEXT,
ADD COLUMN     "non_pathological_history" TEXT,
ADD COLUMN     "pathological_history" TEXT,
ADD COLUMN     "surgeries" TEXT,
ADD COLUMN     "use_floss" BOOLEAN DEFAULT false,
ALTER COLUMN "allergies" SET DATA TYPE TEXT;
