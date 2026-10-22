import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QboClient } from '../../qbo.client';

interface QboBillLine {
	AccountBasedExpenseLineDetail?: {
		AccountRef?: { value?: string; name?: string };
		BillableStatus?: string;
	};
	Amount?: number;
	Description?: string;
	DetailType?: string;
}

interface QboBillResponse {
	Id: string;
	DocNumber?: string;
	TxnDate?: string;
	DueDate?: string;
	VendorRef?: { value?: string; name?: string };
	TotalAmt?: number;
	Balance?: number;
	Line?: QboBillLine[];
	MetaData?: { CreateTime?: string; LastUpdatedTime?: string };
}

@Injectable()
export class QboBillSyncService {
	private readonly logger = new Logger(QboBillSyncService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly qboClient: QboClient
	) {}

	async syncAll(realmId: string): Promise<void> {
		this.logger.log('Starting QBO bill full sync');
		const bills = await this.qboClient.query<QboBillResponse>(
			realmId,
			'SELECT * FROM Bill MAXRESULTS 1000'
		);
		this.logger.log(`Fetched ${bills.length} bills from QBO`);

		for (const bill of bills) {
			await this.upsertBill(realmId, bill);
		}

		this.logger.log('QBO bill full sync completed');
	}

	async syncUpdatedSince(realmId: string, since?: Date): Promise<void> {
		const sinceStr = since?.toISOString().slice(0, 19);
		this.logger.log(
			`Syncing QBO bills updated since ${sinceStr ?? 'beginning'}`
		);

		const query = sinceStr
			? `SELECT * FROM Bill WHERE MetaData.LastUpdatedTime > '${sinceStr}' MAXRESULTS 1000`
			: 'SELECT * FROM Bill MAXRESULTS 1000';

		const bills = await this.qboClient.query<QboBillResponse>(realmId, query);
		this.logger.log(`Fetched ${bills.length} updated bills`);

		for (const bill of bills) {
			await this.upsertBill(realmId, bill);
		}
	}

	private async upsertBill(
		realmId: string,
		bill: QboBillResponse
	): Promise<void> {
		const qboId = bill.Id;

		const paymentStatus =
			bill.Balance === 0
				? 'paid'
				: bill.Balance && bill.TotalAmt && bill.Balance < bill.TotalAmt
					? 'partial'
					: 'open';

		const record = await this.prisma.qboBill.upsert({
			where: { qboId },
			update: {
				docNumber: bill.DocNumber ?? null,
				txnDate: bill.TxnDate ? new Date(bill.TxnDate) : null,
				dueDate: bill.DueDate ? new Date(bill.DueDate) : null,
				vendorId: bill.VendorRef?.value ?? null,
				vendorName: bill.VendorRef?.name ?? null,
				totalAmt: bill.TotalAmt ?? null,
				balance: bill.Balance ?? null,
				paymentStatus,
				qboLastUpdatedAt: bill.MetaData?.LastUpdatedTime
					? new Date(bill.MetaData.LastUpdatedTime)
					: null,
			},
			create: {
				qboId,
				realmId,
				docNumber: bill.DocNumber ?? null,
				txnDate: bill.TxnDate ? new Date(bill.TxnDate) : null,
				dueDate: bill.DueDate ? new Date(bill.DueDate) : null,
				vendorId: bill.VendorRef?.value ?? null,
				vendorName: bill.VendorRef?.name ?? null,
				totalAmt: bill.TotalAmt ?? null,
				balance: bill.Balance ?? null,
				paymentStatus,
				qboCreatedAt: bill.MetaData?.CreateTime
					? new Date(bill.MetaData.CreateTime)
					: null,
				qboLastUpdatedAt: bill.MetaData?.LastUpdatedTime
					? new Date(bill.MetaData.LastUpdatedTime)
					: null,
			},
		});

		await this.syncLines(record.id, bill.Line ?? []);
	}

	private async syncLines(billId: string, lines: QboBillLine[]): Promise<void> {
		await this.prisma.qboBillLine.deleteMany({ where: { billId } });

		const expenseLines = lines.filter(
			(l) => l.DetailType === 'AccountBasedExpenseLineDetail'
		);

		for (const line of expenseLines) {
			await this.prisma.qboBillLine.create({
				data: {
					billId,
					accountId:
						line.AccountBasedExpenseLineDetail?.AccountRef?.value ?? null,
					accountName:
						line.AccountBasedExpenseLineDetail?.AccountRef?.name ?? null,
					amount: line.Amount ?? null,
					description: line.Description ?? null,
					billableStatus:
						line.AccountBasedExpenseLineDetail?.BillableStatus ?? null,
				},
			});
		}
	}
}
