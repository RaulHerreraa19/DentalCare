-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "RecordStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ConsentType" AS ENUM ('DATA_PRIVACY', 'DENTAL_TREATMENT', 'WHATSAPP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ConsentSignatureType" AS ENUM ('DRAWN', 'CLICK_WRAP', 'OTP', 'ELECTRONIC_SIGNATURE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Medical records: add state and signature metadata
ALTER TABLE "medical_records"
ADD COLUMN IF NOT EXISTS "status" "RecordStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN IF NOT EXISTS "current_version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "locked_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "signed_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "signature_hash" TEXT;

UPDATE "medical_records"
SET "status" = 'ACTIVE',
    "current_version" = 1
WHERE "status" IS NULL OR "status" = 'DRAFT';

-- Versioned medical record snapshots
CREATE TABLE "medical_record_versions" (
    "id" TEXT NOT NULL,
    "medical_record_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "created_by" TEXT NOT NULL,
    "change_reason" TEXT,
    "sections" JSONB NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "signed_at" TIMESTAMP(3),
    "signature_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_record_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "medical_record_versions_medical_record_id_version_number_key" ON "medical_record_versions"("medical_record_id", "version_number");

ALTER TABLE "medical_record_versions"
ADD CONSTRAINT "medical_record_versions_medical_record_id_fkey"
FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "medical_record_versions"
ADD CONSTRAINT "medical_record_versions_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "medical_record_versions" (
    "id",
    "medical_record_id",
    "version_number",
    "created_by",
    "change_reason",
    "sections",
    "is_locked",
    "signed_at",
    "signature_hash",
    "created_at"
)
SELECT
    mr."id" || '-v1',
    mr."id",
    1,
    mr."doctor_id",
    'Migración inicial del expediente',
    jsonb_build_object(
        'identification', jsonb_build_object(
            'patient_id', p."id",
            'organization_id', p."organization_id",
            'full_name', p."first_name" || ' ' || p."last_name",
            'first_name', p."first_name",
            'last_name', p."last_name",
            'date_of_birth', p."date_of_birth",
            'gender', p."gender",
            'email', p."email",
            'phone', p."phone",
            'address', p."address",
            'emergency_contact', p."emergency_contact",
            'doctor_id', mr."doctor_id"
        ),
        'history', jsonb_build_object(
            'family_history', mr."family_history",
            'pathological_history', mr."pathological_history",
            'non_pathological_history', mr."non_pathological_history",
            'allergies', mr."allergies",
            'surgeries', mr."surgeries",
            'current_medications', mr."current_medications",
            'dental_history', mr."dental_history",
            'brushing_frequency', mr."brushing_frequency",
            'use_floss', COALESCE(mr."use_floss", false)
        ),
        'interview', COALESCE(mr."clinical_notes", '{}'::jsonb),
        'exploration', jsonb_build_object(
            'extraoral_exam', COALESCE(mr."clinical_notes"->>'extraoral_exam', NULL),
            'intraoral_exam', COALESCE(mr."clinical_notes"->>'intraoral_exam', NULL),
            'periodontal_status', COALESCE(mr."clinical_notes"->>'periodontal_status', NULL),
            'radiographic_findings', COALESCE(mr."clinical_notes"->>'radiographic_findings', NULL)
        ),
        'diagnosis', jsonb_build_object(
            'primary_diagnosis', mr."diagnosis",
            'diagnostic_basis', COALESCE(mr."clinical_notes"->>'diagnostic_basis', NULL)
        ),
        'plan', jsonb_build_object(
            'treatment_plan', mr."treatment_plan",
            'medications', mr."medications"
        ),
        'evolution', jsonb_build_object(
            'latest_note_id', NULL,
            'latest_note_type', NULL,
            'latest_note_content', NULL
        ),
        'odontogram', jsonb_build_object(
            'version', NULL,
            'tooth_data', NULL
        )
    ),
    false,
    NULL,
    NULL,
    mr."created_at"
FROM "medical_records" mr
JOIN "patients" p ON p."id" = mr."patient_id";

-- Medical notes: add author, versioning and audit fields
ALTER TABLE "medical_notes"
ADD COLUMN IF NOT EXISTS "author_id" TEXT,
ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "locked_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "medical_notes" mn
SET "author_id" = mr."doctor_id"
FROM "medical_records" mr
WHERE mr."id" = mn."medical_record_id" AND mn."author_id" IS NULL;

ALTER TABLE "medical_notes"
ALTER COLUMN "author_id" SET NOT NULL;

ALTER TABLE "medical_notes"
ADD CONSTRAINT "medical_notes_author_id_fkey"
FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "medical_note_versions" (
    "id" TEXT NOT NULL,
    "medical_note_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "created_by" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "note_type" "NoteType" NOT NULL DEFAULT 'CONSULTATION',
    "attachments" JSONB,
    "is_signed" BOOLEAN NOT NULL DEFAULT false,
    "signed_at" TIMESTAMP(3),
    "signature_hash" TEXT,
    "change_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_note_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "medical_note_versions_medical_note_id_version_number_key" ON "medical_note_versions"("medical_note_id", "version_number");

ALTER TABLE "medical_note_versions"
ADD CONSTRAINT "medical_note_versions_medical_note_id_fkey"
FOREIGN KEY ("medical_note_id") REFERENCES "medical_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "medical_note_versions"
ADD CONSTRAINT "medical_note_versions_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "medical_note_versions" (
    "id",
    "medical_note_id",
    "version_number",
    "created_by",
    "content",
    "note_type",
    "attachments",
    "is_signed",
    "signed_at",
    "signature_hash",
    "created_at"
)
SELECT
    mn."id" || '-v1',
    mn."id",
    COALESCE(mn."version", 1),
    mn."author_id",
    mn."content",
    mn."note_type",
    mn."attachments",
    mn."is_signed",
    mn."signed_at",
    mn."signature_hash",
    mn."created_at"
FROM "medical_notes" mn;

-- Odontograms: add author and signature metadata
ALTER TABLE "odontograms"
ADD COLUMN IF NOT EXISTS "created_by" TEXT,
ADD COLUMN IF NOT EXISTS "status" "RecordStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN IF NOT EXISTS "is_locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "signed_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "signature_hash" TEXT;

UPDATE "odontograms" o
SET "created_by" = mr."doctor_id",
    "status" = 'ACTIVE'
FROM "medical_records" mr
WHERE mr."id" = o."medical_record_id" AND o."created_by" IS NULL;

ALTER TABLE "odontograms"
ALTER COLUMN "created_by" SET NOT NULL;

ALTER TABLE "odontograms"
ADD CONSTRAINT "odontograms_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Consents
CREATE TABLE "consents" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "consent_type" "ConsentType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "language" TEXT NOT NULL DEFAULT 'es_MX',
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "accepted_at" TIMESTAMP(3),
    "accepted_by" TEXT,
    "signature_type" "ConsentSignatureType",
    "document_hash" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "consents_patient_id_consent_type_version_key" ON "consents"("patient_id", "consent_type", "version");

ALTER TABLE "consents"
ADD CONSTRAINT "consents_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "consents"
ADD CONSTRAINT "consents_patient_id_fkey"
FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "consents"
ADD CONSTRAINT "consents_accepted_by_fkey"
FOREIGN KEY ("accepted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Audit log enrichment
ALTER TABLE "audit_logs"
ADD COLUMN IF NOT EXISTS "organization_id" TEXT,
ADD COLUMN IF NOT EXISTS "patient_id" TEXT,
ADD COLUMN IF NOT EXISTS "resource_type" TEXT,
ADD COLUMN IF NOT EXISTS "resource_id" TEXT,
ADD COLUMN IF NOT EXISTS "access_granted" BOOLEAN,
ADD COLUMN IF NOT EXISTS "ip_address" TEXT,
ADD COLUMN IF NOT EXISTS "user_agent" TEXT,
ADD COLUMN IF NOT EXISTS "before_snapshot" JSONB,
ADD COLUMN IF NOT EXISTS "after_snapshot" JSONB,
ADD COLUMN IF NOT EXISTS "reason" TEXT;

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_patient_id_fkey"
FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Helpful indexes for clinical lookups
CREATE INDEX "medical_notes_medical_record_id_idx" ON "medical_notes"("medical_record_id");
CREATE INDEX "medical_notes_author_id_idx" ON "medical_notes"("author_id");
CREATE INDEX "odontograms_medical_record_id_idx" ON "odontograms"("medical_record_id");
CREATE INDEX "odontograms_created_by_idx" ON "odontograms"("created_by");
CREATE INDEX "consents_patient_id_idx" ON "consents"("patient_id");
CREATE INDEX "consents_organization_id_idx" ON "consents"("organization_id");
CREATE INDEX "medical_record_versions_created_by_idx" ON "medical_record_versions"("created_by");
CREATE INDEX "medical_note_versions_created_by_idx" ON "medical_note_versions"("created_by");
