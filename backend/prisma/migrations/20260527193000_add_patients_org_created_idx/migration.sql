-- Phase 1 pagination support: tenant-scoped listing/sorting index.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "patients_organization_id_created_at_idx"
ON "patients"("organization_id", "created_at" DESC);
