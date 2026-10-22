import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@repo/db';
import { PrismaService } from './prisma.service';

jest.mock('@repo/db', () => ({
	PrismaClient: jest.fn().mockImplementation(function (this: {
		$connect: jest.Mock;
		$disconnect: jest.Mock;
	}) {
		this.$connect = jest.fn();
		this.$disconnect = jest.fn();
		return this;
	}),
}));

jest.mock('@prisma/adapter-pg', () => ({
	PrismaPg: jest.fn().mockImplementation((options) => options),
}));

jest.mock('src/common/env-config', () => ({
	config: { urls: { db: 'postgresql://test:test@localhost:5432/test' } },
}));

describe('PrismaService', () => {
	let service: PrismaService;

	beforeEach(async () => {
		const testingModule = await Test.createTestingModule({
			providers: [PrismaService],
		}).compile();

		service = testingModule.get(PrismaService);
	});

	it('creates the client with the pg adapter', () => {
		expect(PrismaPg).toHaveBeenCalledWith({
			connectionString: 'postgresql://test:test@localhost:5432/test',
		});
		expect(PrismaClient).toHaveBeenCalledWith({
			adapter: expect.any(Object),
			log: ['error', 'warn', 'info'],
			errorFormat: 'pretty',
		});
	});

	it('connects on module init', async () => {
		const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

		await service.onModuleInit();

		expect(connectSpy).toHaveBeenCalledTimes(1);
	});

	it('rethrows connection errors', async () => {
		const error = new Error('Connection failed');
		jest.spyOn(service, '$connect').mockRejectedValue(error);
		const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

		await expect(service.onModuleInit()).rejects.toThrow(error);
		expect(consoleSpy).toHaveBeenCalledWith(
			'Failed to connect to database:',
			error
		);

		consoleSpy.mockRestore();
	});

	it('disconnects on module destroy', async () => {
		const disconnectSpy = jest
			.spyOn(service, '$disconnect')
			.mockResolvedValue();

		await service.onModuleDestroy();

		expect(disconnectSpy).toHaveBeenCalledTimes(1);
	});
});
