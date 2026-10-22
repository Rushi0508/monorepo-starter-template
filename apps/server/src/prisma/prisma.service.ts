import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@repo/db';
import { config } from 'src/common/env-config';

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	constructor() {
		super({
			adapter: new PrismaPg({ connectionString: config.urls.db }),
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
