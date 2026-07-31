-- AlterTable
ALTER TABLE "sale_items" ADD COLUMN     "vat_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vat_rate_name" VARCHAR(100);
