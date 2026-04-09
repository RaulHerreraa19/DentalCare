-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "appointment_reminders" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "reminder_type" TEXT NOT NULL DEFAULT 'WHATSAPP_CONFIRM_24H',
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "provider_message_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appointment_reminders_appointment_id_reminder_type_key" ON "appointment_reminders"("appointment_id", "reminder_type");

-- AddForeignKey
ALTER TABLE "appointment_reminders" ADD CONSTRAINT "appointment_reminders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
