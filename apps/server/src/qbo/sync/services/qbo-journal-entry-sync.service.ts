import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QboClient } from '../../qbo.client';

interface QboJournalEntryLine {
	JournalEntryLineDetail?: {
		PostingType?: string;
		AccountRef?: { value?: string; name?: string };
	};
	Amount?: number;
	Description?: string;
	DetailType?: string;
}

interface QboJournalEntryResponse {
	Id: string;
	DocNumber?: string;
	TxnDate?: string;
	PrivateNote?: string;
	TotalAmt?: number;
	Line?: QboJournalEntryLine[];
	MetaData?: { CreateTime?: string; LastUpdatedTime?: string };
}

@Injectable()
export class QboJournalEntrySyncService {
	private readonly logger = new Logger(QboJournalEntrySyncService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly qboClient: QboClient
	) {}

	async syncAll(realmId: string): Promise<void> {
		this.logger.log('Starting QBO journal entry full sync');
		const entries = await this.qboClient.query<QboJournalEntryResponse>(
			realmId,
			'SELECT * FROM JournalEntry MAXRESULTS 1000'
		);
		this.logger.log(`Fetched ${entries.length} journal entries from QBO`);

		for (const entry of entries) {
			await this.upsertEntry(realmId, entry);
		}

		this.logger.log('QBO journal entry full sync completed');
	}

	async syncUpdatedSince(realmId: string, since?: Date): Promise<void> {
		const sinceStr = since?.toISOString().slice(0, 19);
		this.logger.log(
			`Syncing QBO journal entries updated since ${sinceStr ?? 'beginning'}`
		);

		const query = sinceStr
			? `SELECT * FROM JournalEntry WHERE MetaData.LastUpdatedTime > '${sinceStr}' MAXRESULTS 1000`
			: 'SELECT * FROM JournalEntry MAXRESULTS 1000';

		const entries = await this.qboClient.query<QboJournalEntryResponse>(
			realmId,
			query
		);
		this.logger.log(`Fetched ${entries.length} updated journal entries`);

		for (const entry of entries) {
			await this.upsertEntry(realmId, entry);
		}
	}

	private async upsertEntry(
		realmId: string,
		entry: QboJournalEntryResponse
	): Promise<void> {
		const qboId = entry.Id;

		const record = await this.prisma.qboJournalEntry.upsert({
			where: { qboId },
			update: {
				docNumber: entry.DocNumber ?? null,
				txnDate: entry.TxnDate ? new Date(entry.TxnDate) : null,
				privateNote: entry.PrivateNote ?? null,
				totalAmt: entry.TotalAmt ?? null,
				qboLastUpdatedAt: entry.MetaData?.LastUpdatedTime
					? new Date(entry.MetaData.LastUpdatedTime)
					: null,
			},
			create: {
				qboId,
				realmId,
				docNumber: entry.DocNumber ?? null,
				txnDate: entry.TxnDate ? new Date(entry.TxnDate) : null,
				privateNote: entry.PrivateNote ?? null,
				totalAmt: entry.TotalAmt ?? null,
				qboCreatedAt: entry.MetaData?.CreateTime
					? new Date(entry.MetaData.CreateTime)
					: null,
				qboLastUpdatedAt: entry.MetaData?.LastUpdatedTime
					? new Date(entry.MetaData.LastUpdatedTime)
					: null,
			},
		});

		await this.syncLines(record.id, entry.Line ?? []);
	}

	private async syncLines(
		journalEntryId: string,
		lines: QboJournalEntryLine[]
	): Promise<void> {
		await this.prisma.qboJournalEntryLine.deleteMany({
			where: { journalEntryId },
		});

		const journalLines = lines.filter(
			(l) => l.DetailType === 'JournalEntryLineDetail'
		);

		for (const line of journalLines) {
			await this.prisma.qboJournalEntryLine.create({
				data: {
					journalEntryId,
					postingType: line.JournalEntryLineDetail?.PostingType ?? null,
					accountId: line.JournalEntryLineDetail?.AccountRef?.value ?? null,
					accountName: line.JournalEntryLineDetail?.AccountRef?.name ?? null,
					amount: line.Amount ?? null,
					description: line.Description ?? null,
				},
			});
		}
	}
}
