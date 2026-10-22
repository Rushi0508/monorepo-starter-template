-- CreateTable
CREATE TABLE "qbo_connections" (
    "id" UUID NOT NULL,
    "realmId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qbo_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qbo_journal_entries" (
    "id" UUID NOT NULL,
    "qboId" TEXT NOT NULL,
    "realmId" TEXT NOT NULL,
    "docNumber" TEXT,
    "txnDate" TIMESTAMP(3),
    "privateNote" TEXT,
    "totalAmt" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "qboCreatedAt" TIMESTAMP(3),
    "qboLastUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "qbo_journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qbo_journal_entry_lines" (
    "id" UUID NOT NULL,
    "journalEntryId" UUID NOT NULL,
    "postingType" TEXT,
    "accountId" TEXT,
    "accountName" TEXT,
    "amount" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qbo_journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qbo_bills" (
    "id" UUID NOT NULL,
    "qboId" TEXT NOT NULL,
    "realmId" TEXT NOT NULL,
    "docNumber" TEXT,
    "txnDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "vendorId" TEXT,
    "vendorName" TEXT,
    "totalAmt" DOUBLE PRECISION,
    "balance" DOUBLE PRECISION,
    "paymentStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "qboCreatedAt" TIMESTAMP(3),
    "qboLastUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "qbo_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qbo_bill_lines" (
    "id" UUID NOT NULL,
    "billId" UUID NOT NULL,
    "accountId" TEXT,
    "accountName" TEXT,
    "amount" DOUBLE PRECISION,
    "description" TEXT,
    "billableStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qbo_bill_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qbo_invoices" (
    "id" UUID NOT NULL,
    "qboId" TEXT NOT NULL,
    "realmId" TEXT NOT NULL,
    "docNumber" TEXT,
    "txnDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "customerId" TEXT,
    "customerName" TEXT,
    "totalAmt" DOUBLE PRECISION,
    "balance" DOUBLE PRECISION,
    "paymentStatus" TEXT,
    "emailStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "qboCreatedAt" TIMESTAMP(3),
    "qboLastUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "qbo_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qbo_invoice_lines" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "itemId" TEXT,
    "itemName" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "qty" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qbo_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qbo_payments" (
    "id" UUID NOT NULL,
    "qboId" TEXT NOT NULL,
    "realmId" TEXT NOT NULL,
    "txnDate" TIMESTAMP(3),
    "totalAmt" DOUBLE PRECISION,
    "customerId" TEXT,
    "customerName" TEXT,
    "paymentMethodId" TEXT,
    "paymentMethodName" TEXT,
    "checkNum" TEXT,
    "depositAccountName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "qboCreatedAt" TIMESTAMP(3),
    "qboLastUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "qbo_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qbo_payment_linked_invoices" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "invoiceQboId" TEXT,
    "amount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qbo_payment_linked_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qbo_connections_realmId_key" ON "qbo_connections"("realmId");

-- CreateIndex
CREATE UNIQUE INDEX "qbo_journal_entries_qboId_key" ON "qbo_journal_entries"("qboId");

-- CreateIndex
CREATE INDEX "qbo_journal_entries_realmId_idx" ON "qbo_journal_entries"("realmId");

-- CreateIndex
CREATE INDEX "qbo_journal_entries_txnDate_idx" ON "qbo_journal_entries"("txnDate");

-- CreateIndex
CREATE INDEX "qbo_journal_entry_lines_journalEntryId_idx" ON "qbo_journal_entry_lines"("journalEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "qbo_bills_qboId_key" ON "qbo_bills"("qboId");

-- CreateIndex
CREATE INDEX "qbo_bills_realmId_idx" ON "qbo_bills"("realmId");

-- CreateIndex
CREATE INDEX "qbo_bills_vendorId_idx" ON "qbo_bills"("vendorId");

-- CreateIndex
CREATE INDEX "qbo_bills_txnDate_idx" ON "qbo_bills"("txnDate");

-- CreateIndex
CREATE INDEX "qbo_bill_lines_billId_idx" ON "qbo_bill_lines"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "qbo_invoices_qboId_key" ON "qbo_invoices"("qboId");

-- CreateIndex
CREATE INDEX "qbo_invoices_realmId_idx" ON "qbo_invoices"("realmId");

-- CreateIndex
CREATE INDEX "qbo_invoices_customerId_idx" ON "qbo_invoices"("customerId");

-- CreateIndex
CREATE INDEX "qbo_invoices_txnDate_idx" ON "qbo_invoices"("txnDate");

-- CreateIndex
CREATE INDEX "qbo_invoice_lines_invoiceId_idx" ON "qbo_invoice_lines"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "qbo_payments_qboId_key" ON "qbo_payments"("qboId");

-- CreateIndex
CREATE INDEX "qbo_payments_realmId_idx" ON "qbo_payments"("realmId");

-- CreateIndex
CREATE INDEX "qbo_payments_customerId_idx" ON "qbo_payments"("customerId");

-- CreateIndex
CREATE INDEX "qbo_payments_txnDate_idx" ON "qbo_payments"("txnDate");

-- CreateIndex
CREATE INDEX "qbo_payment_linked_invoices_paymentId_idx" ON "qbo_payment_linked_invoices"("paymentId");

-- CreateIndex
CREATE INDEX "qbo_payment_linked_invoices_invoiceQboId_idx" ON "qbo_payment_linked_invoices"("invoiceQboId");

-- AddForeignKey
ALTER TABLE "qbo_journal_entry_lines" ADD CONSTRAINT "qbo_journal_entry_lines_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "qbo_journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qbo_bill_lines" ADD CONSTRAINT "qbo_bill_lines_billId_fkey" FOREIGN KEY ("billId") REFERENCES "qbo_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qbo_invoice_lines" ADD CONSTRAINT "qbo_invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "qbo_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qbo_payment_linked_invoices" ADD CONSTRAINT "qbo_payment_linked_invoices_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "qbo_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
