import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@repo/db';
@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	constructor() {
		const connectionString = process.env.DATABASE_URL;
		const adapter = new PrismaPg({
			connectionString,
			ssl: {
				rejectUnauthorized: false,
			},
		});

		super({
			adapter,
			log: ['error', 'warn', 'info'],
			errorFormat: 'pretty',
		});
	}

	async onModuleInit() {
		try {
			await this.$connect();
		} catch (error) {
			console.error('Failed to connect to database:', error);
			throw error;
		}
	}

	async onModuleDestroy() {
		await this.$disconnect();
	}
}
