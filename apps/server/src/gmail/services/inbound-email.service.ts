import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {
	type InboundEmail,
	InboundEmailStatus,
	type InboundEmailType,
} from '@repo/db';
import { PrismaService } from 'src/prisma/prisma.service';

/** Storage and status transitions for emails received on the Gmail inbox. */
@Injectable()
export class InboundEmailService {
	constructor(private readonly prisma: PrismaService) {}

	async list(type?: InboundEmailType) {
		const data = await this.prisma.inboundEmail.findMany({
			where: type ? { type } : undefined,
			orderBy: [{ receivedAt: 'desc' }, { createdAt: 'desc' }],
		});

		return { data, totalCount: data.length };
	}

	async get(id: string): Promise<InboundEmail> {
		const email = await this.prisma.inboundEmail.findUnique({ where: { id } });
		if (!email) {
			throw new NotFoundException('Inbound email not found');
		}
		return email;
	}

	async delete(id: string) {
		await this.get(id);
		await this.prisma.inboundEmail.delete({ where: { id } });
		return { message: 'Email deleted' };
	}

	/** Mark as PROCESSED without running OCR / downstream actions. */
	async markAsProcessed(id: string): Promise<InboundEmail> {
		const email = await this.get(id);
		if (email.status === InboundEmailStatus.PROCESSING) {
			throw new BadRequestException(
				'Cannot mark as processed while processing is in progress'
			);
		}

		return this.prisma.inboundEmail.update({
			where: { id },
			data: { status: InboundEmailStatus.PROCESSED },
		});
	}

	/**
	 * Claims the oldest PENDING email of a type for a scheduler. Returns null
	 * when there is nothing to do or another tick won the claim.
	 */
	async claimNextPending(type: InboundEmailType): Promise<string | null> {
		const next = await this.prisma.inboundEmail.findFirst({
			where: { type, status: InboundEmailStatus.PENDING },
			orderBy: [{ receivedAt: 'asc' }, { createdAt: 'asc' }],
			select: { id: true },
		});
		if (!next) return null;

		const claimed = await this.prisma.inboundEmail.updateMany({
			where: { id: next.id, status: InboundEmailStatus.PENDING },
			data: { status: InboundEmailStatus.PROCESSING },
		});
		return claimed.count > 0 ? next.id : null;
	}

	/**
	 * Loads an email for its type's processor and moves it to PROCESSING,
	 * unless a scheduler already claimed it.
	 */
	async startProcessing(
		id: string,
		type: InboundEmailType,
		options?: { alreadyClaimed?: boolean }
	): Promise<InboundEmail> {
		const email = await this.get(id);
		if (email.type !== type) {
			throw new BadRequestException(
				`Email ${id} is a ${email.type} email, not ${type}`
			);
		}
		if (options?.alreadyClaimed) return email;

		if (email.status === InboundEmailStatus.PROCESSING) {
			throw new BadRequestException(`Email ${id} is already processing`);
		}

		return this.prisma.inboundEmail.update({
			where: { id },
			data: { status: InboundEmailStatus.PROCESSING },
		});
	}

	async setStatus(id: string, status: InboundEmailStatus): Promise<void> {
		await this.prisma.inboundEmail.update({ where: { id }, data: { status } });
	}
}
