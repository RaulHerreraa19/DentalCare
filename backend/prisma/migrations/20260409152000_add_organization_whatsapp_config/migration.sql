-- CreateTable
CREATE TABLE "organization_whatsapp_configs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "dry_run" BOOLEAN NOT NULL DEFAULT true,
    "access_token" TEXT,
    "phone_number_id" TEXT,
    "api_version" TEXT NOT NULL DEFAULT 'v21.0',
    "template_name" TEXT NOT NULL DEFAULT 'appointment_confirmation_24h',
    "template_lang" TEXT NOT NULL DEFAULT 'es_MX',
    "webhook_verify_token" TEXT,
    "reminders_enabled" BOOLEAN NOT NULL DEFAULT false,
    "job_interval_ms" INTEGER NOT NULL DEFAULT 300000,
    "window_minutes" INTEGER NOT NULL DEFAULT 15,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_whatsapp_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_whatsapp_configs_organization_id_key" ON "organization_whatsapp_configs"("organization_id");

-- AddForeignKey
ALTER TABLE "organization_whatsapp_configs" ADD CONSTRAINT "organization_whatsapp_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
