-- AlterEnum
ALTER TYPE "SaleStatus" ADD VALUE 'VOIDED';

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "rank" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "address_line1" VARCHAR(255),
ADD COLUMN     "address_line2" VARCHAR(255),
ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
ADD COLUMN     "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "invoice_counters" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "prefix" VARCHAR(10) NOT NULL,
    "counter_date" VARCHAR(8) NOT NULL,
    "last_sequence" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invoice_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_counters_tenant_id_idx" ON "invoice_counters"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_counters_tenant_id_prefix_counter_date_key" ON "invoice_counters"("tenant_id", "prefix", "counter_date");

-- CreateIndex
CREATE INDEX "roles_rank_idx" ON "roles"("rank");

-- AddForeignKey
ALTER TABLE "invoice_counters" ADD CONSTRAINT "invoice_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
