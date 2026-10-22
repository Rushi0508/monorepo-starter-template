import { Injectable } from '@nestjs/common';
import type { ConfigurationType } from '@repo/types';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';

const DEFAULTS = {
	d2cMaxTransitDays: 7,
	b2bMaxTransitDays: 7,
} as const;

@Injectable()
export class ConfigurationService {
	constructor(private readonly prisma: PrismaService) {}

	async getConfiguration(): Promise<ConfigurationType> {
		const config = await this.prisma.configuration.findFirst();

		if (!config) {
			return await this.prisma.configuration.create({ data: DEFAULTS });
		}

		return config;
	}

	async updateConfiguration(
		dto: UpdateConfigurationDto
	): Promise<{ message: string }> {
		const existing = await this.prisma.configuration.findFirst();

		const data = {
			d2cMaxTransitDays: dto.d2cMaxTransitDays,
			b2bMaxTransitDays: dto.b2bMaxTransitDays,
			mbDistributorEmail: dto.mbDistributorEmail ?? null,
			mbDistributorCcEmails: dto.mbDistributorCcEmails ?? null,
		};

		if (existing) {
			await this.prisma.configuration.update({
				where: { id: existing.id },
				data,
			});
		} else {
			await this.prisma.configuration.create({ data });
		}

		return { message: 'Configuration updated successfully' };
	}
}
