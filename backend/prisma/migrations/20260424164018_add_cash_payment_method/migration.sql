-- DropForeignKey
ALTER TABLE "appointment_reminders" DROP CONSTRAINT "appointment_reminders_appointment_id_fkey";

-- DropForeignKey
ALTER TABLE "organization_whatsapp_configs" DROP CONSTRAINT "organization_whatsapp_configs_organization_id_fkey";

-- AddForeignKey
ALTER TABLE "organization_whatsapp_configs" ADD CONSTRAINT "organization_whatsapp_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_reminders" ADD CONSTRAINT "appointment_reminders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
