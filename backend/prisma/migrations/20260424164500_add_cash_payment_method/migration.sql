-- Add payment method enum and field to cash register movements
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CARD');

ALTER TABLE "cash_registers"
ADD COLUMN "payment_method" "PaymentMethod";
