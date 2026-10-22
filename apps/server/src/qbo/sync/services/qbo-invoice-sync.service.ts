import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QboClient } from '../../qbo.client';

interface QboInvoiceLine {
	SalesItemLineDetail?: {
		ItemRef?: { value?: string; name?: string };
		UnitPrice?: number;
		Qty?: number;
	};
	Amount?: number;
	Description?: string;
	DetailType?: string;
}

interface QboInvoiceResponse {
	Id: string;
	DocNumber?: string;
	TxnDate?: string;
	DueDate?: string;
	CustomerRef?: { value?: string; name?: string };
	TotalAmt?: number;
	Balance?: number;
	EmailStatus?: string;
	Line?: QboInvoiceLine[];
	MetaData?: { CreateTime?: string; LastUpdatedTime?: string };
}

@Injectable()
export class QboInvoiceSyncService {
	private readonly logger = new Logger(QboInvoiceSyncService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly qboClient: QboClient
	) {}

	async syncAll(realmId: string): Promise<void> {
		this.logger.log('Starting QBO invoice full sync');
		const invoices = await this.qboClient.query<QboInvoiceResponse>(
			realmId,
			'SELECT * FROM Invoice MAXRESULTS 1000'
		);
		this.logger.log(`Fetched ${invoices.length} invoices from QBO`);

		for (const invoice of invoices) {
			await this.upsertInvoice(realmId, invoice);
		}

		this.logger.log('QBO invoice full sync completed');
	}

	async syncUpdatedSince(realmId: string, since?: Date): Promise<void> {
		const sinceStr = since?.toISOString().slice(0, 19);
		this.logger.log(
			`Syncing QBO invoices updated since ${sinceStr ?? 'beginning'}`
		);

		const query = sinceStr
			? `SELECT * FROM Invoice WHERE MetaData.LastUpdatedTime > '${sinceStr}' MAXRESULTS 1000`
			: 'SELECT * FROM Invoice MAXRESULTS 1000';

		const invoices = await this.qboClient.query<QboInvoiceResponse>(
			realmId,
			query
		);
		this.logger.log(`Fetched ${invoices.length} updated invoices`);

		for (const invoice of invoices) {
			await this.upsertInvoice(realmId, invoice);
		}
	}

	private async upsertInvoice(
		realmId: string,
		invoice: QboInvoiceResponse
	): Promise<void> {
		const qboId = invoice.Id;

		const paymentStatus =
			invoice.Balance === 0
				? 'paid'
				: invoice.Balance &&
						invoice.TotalAmt &&
						invoice.Balance < invoice.TotalAmt
					? 'partial'
					: 'open';

		const record = await this.prisma.qboInvoice.upsert({
			where: { qboId },
			update: {
				docNumber: invoice.DocNumber ?? null,
				txnDate: invoice.TxnDate ? new Date(invoice.TxnDate) : null,
				dueDate: invoice.DueDate ? new Date(invoice.DueDate) : null,
				customerId: invoice.CustomerRef?.value ?? null,
				customerName: invoice.CustomerRef?.name ?? null,
				totalAmt: invoice.TotalAmt ?? null,
				balance: invoice.Balance ?? null,
				paymentStatus,
				emailStatus: invoice.EmailStatus ?? null,
				qboLastUpdatedAt: invoice.MetaData?.LastUpdatedTime
					? new Date(invoice.MetaData.LastUpdatedTime)
					: null,
			},
			create: {
				qboId,
				realmId,
				docNumber: invoice.DocNumber ?? null,
				txnDate: invoice.TxnDate ? new Date(invoice.TxnDate) : null,
				dueDate: invoice.DueDate ? new Date(invoice.DueDate) : null,
				customerId: invoice.CustomerRef?.value ?? null,
				customerName: invoice.CustomerRef?.name ?? null,
				totalAmt: invoice.TotalAmt ?? null,
				balance: invoice.Balance ?? null,
				paymentStatus,
				emailStatus: invoice.EmailStatus ?? null,
				qboCreatedAt: invoice.MetaData?.CreateTime
					? new Date(invoice.MetaData.CreateTime)
					: null,
				qboLastUpdatedAt: invoice.MetaData?.LastUpdatedTime
					? new Date(invoice.MetaData.LastUpdatedTime)
					: null,
			},
		});

		await this.syncLines(record.id, invoice.Line ?? []);
	}

	private async syncLines(
		invoiceId: string,
		lines: QboInvoiceLine[]
	): Promise<void> {
		await this.prisma.qboInvoiceLine.deleteMany({ where: { invoiceId } });

		const salesLines = lines.filter(
			(l) => l.DetailType === 'SalesItemLineDetail'
		);

		for (const line of salesLines) {
			await this.prisma.qboInvoiceLine.create({
				data: {
					invoiceId,
					itemId: line.SalesItemLineDetail?.ItemRef?.value ?? null,
					itemName: line.SalesItemLineDetail?.ItemRef?.name ?? null,
					unitPrice: line.SalesItemLineDetail?.UnitPrice ?? null,
					qty: line.SalesItemLineDetail?.Qty ?? null,
					amount: line.Amount ?? null,
					description: line.Description ?? null,
				},
			});
		}
	}
}
