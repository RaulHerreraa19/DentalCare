-- Add patient signature fields to medical records
ALTER TABLE "medical_records"
ADD COLUMN IF NOT EXISTS "patient_signature_url" TEXT,
ADD COLUMN IF NOT EXISTS "patient_signature_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "patient_signature_hash" TEXT;