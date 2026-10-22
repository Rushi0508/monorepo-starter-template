-- CreateIndex
CREATE INDEX "folk_company_mappings_proposedCustomerId_idx" ON "folk_company_mappings"("proposedCustomerId");

-- AddForeignKey
ALTER TABLE "folk_company_mappings" ADD CONSTRAINT "folk_company_mappings_proposedCustomerId_fkey" FOREIGN KEY ("proposedCustomerId") REFERENCES "shopify_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
