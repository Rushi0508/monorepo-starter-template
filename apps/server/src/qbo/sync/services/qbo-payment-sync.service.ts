import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QboClient } from '../../qbo.client';

interface QboLinkedTxn {
	TxnId?: string;
	TxnType?: string;
}

interface QboPaymentLine {
	LinkedTxn?: QboLinkedTxn[];
	Amount?: number;
}

interface QboPaymentResponse {
	Id: string;
	TxnDate?: string;
	TotalAmt?: number;
	CustomerRef?: { value?: string; name?: string };
	PaymentMethodRef?: { value?: string; name?: string };
	CheckNum?: string;
	DepositToAccountRef?: { name?: string };
	Line?: QboPaymentLine[];
	MetaData?: { CreateTime?: string; LastUpdatedTime?: string };
}

@Injectable()
export class QboPaymentSyncService {
	private readonly logger = new Logger(QboPaymentSyncService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly qboClient: QboClient
	) {}

	async syncAll(realmId: string): Promise<void> {
		this.logger.log('Starting QBO payment full sync');
		const payments = await this.qboClient.query<QboPaymentResponse>(
			realmId,
			'SELECT * FROM Payment MAXRESULTS 1000'
		);
		this.logger.log(`Fetched ${payments.length} payments from QBO`);

		for (const payment of payments) {
			await this.upsertPayment(realmId, payment);
		}

		this.logger.log('QBO payment full sync completed');
	}

	async syncUpdatedSince(realmId: string, since?: Date): Promise<void> {
		const sinceStr = since?.toISOString().slice(0, 19);
		this.logger.log(
			`Syncing QBO payments updated since ${sinceStr ?? 'beginning'}`
		);

		const query = sinceStr
			? `SELECT * FROM Payment WHERE MetaData.LastUpdatedTime > '${sinceStr}' MAXRESULTS 1000`
			: 'SELECT * FROM Payment MAXRESULTS 1000';

		const payments = await this.qboClient.query<QboPaymentResponse>(
			realmId,
			query
		);
		this.logger.log(`Fetched ${payments.length} updated payments`);

		for (const payment of payments) {
			await this.upsertPayment(realmId, payment);
		}
	}

	private async upsertPayment(
		realmId: string,
		payment: QboPaymentResponse
	): Promise<void> {
		const qboId = payment.Id;

		const record = await this.prisma.qboPayment.upsert({
			where: { qboId },
			update: {
				txnDate: payment.TxnDate ? new Date(payment.TxnDate) : null,
				totalAmt: payment.TotalAmt ?? null,
				customerId: payment.CustomerRef?.value ?? null,
				customerName: payment.CustomerRef?.name ?? null,
				paymentMethodId: payment.PaymentMethodRef?.value ?? null,
				paymentMethodName: payment.PaymentMethodRef?.name ?? null,
				checkNum: payment.CheckNum ?? null,
				depositAccountName: payment.DepositToAccountRef?.name ?? null,
				qboLastUpdatedAt: payment.MetaData?.LastUpdatedTime
					? new Date(payment.MetaData.LastUpdatedTime)
					: null,
			},
			create: {
				qboId,
				realmId,
				txnDate: payment.TxnDate ? new Date(payment.TxnDate) : null,
				totalAmt: payment.TotalAmt ?? null,
				customerId: payment.CustomerRef?.value ?? null,
				customerName: payment.CustomerRef?.name ?? null,
				paymentMethodId: payment.PaymentMethodRef?.value ?? null,
				paymentMethodName: payment.PaymentMethodRef?.name ?? null,
				checkNum: payment.CheckNum ?? null,
				depositAccountName: payment.DepositToAccountRef?.name ?? null,
				qboCreatedAt: payment.MetaData?.CreateTime
					? new Date(payment.MetaData.CreateTime)
					: null,
				qboLastUpdatedAt: payment.MetaData?.LastUpdatedTime
					? new Date(payment.MetaData.LastUpdatedTime)
					: null,
			},
		});

		await this.syncLinkedInvoices(record.id, payment.Line ?? []);
	}

	private async syncLinkedInvoices(
		paymentId: string,
		lines: QboPaymentLine[]
	): Promise<void> {
		await this.prisma.qboPaymentLinkedInvoice.deleteMany({
			where: { paymentId },
		});

		for (const line of lines) {
			const invoiceLinks = (line.LinkedTxn ?? []).filter(
				(txn) => txn.TxnType === 'Invoice'
			);

			for (const link of invoiceLinks) {
				await this.prisma.qboPaymentLinkedInvoice.create({
					data: {
						paymentId,
						invoiceQboId: link.TxnId ?? null,
						amount: line.Amount ?? null,
					},
				});
			}
		}
	}
}
