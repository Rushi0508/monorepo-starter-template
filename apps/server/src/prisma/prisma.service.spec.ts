import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@repo/db';
import { PrismaService } from './prisma.service';

// Mock the entire @repo/db module
jest.mock('@repo/db', () => {
	const mockConnect = jest.fn();
	const mockDisconnect = jest.fn();

	return {
		PrismaClient: jest.fn().mockImplementation(function (
			this: any,
			config: any
		) {
			// Store the config for testing
			this.config = config;
			this.$connect = mockConnect;
			this.$disconnect = mockDisconnect;
			return this;
		}),
	};
});

// Mock PrismaPg adapter
jest.mock('@prisma/adapter-pg', () => {
	return {
		PrismaPg: jest.fn().mockImplementation((config: any) => {
			return {
				connectionString: config.connectionString,
				provider: 'postgres',
				adapterName: 'pg',
			};
		}),
	};
});

// Mock environment variable
const originalEnv = process.env;
beforeAll(() => {
	process.env = {
		...originalEnv,
		DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
	};
});

afterAll(() => {
	process.env = originalEnv;
});

describe('PrismaService', () => {
	let service: PrismaService;

	beforeEach(async () => {
		// Clear mocks before each test
		jest.clearAllMocks();

		const testingModule: TestingModule = await Test.createTestingModule({
			providers: [PrismaService],
		}).compile();

		service = testingModule.get<PrismaService>(PrismaService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('should extend PrismaClient', () => {
		expect(service).toBeInstanceOf(PrismaService);
	});

	describe('constructor', () => {
		it('should initialize with correct configuration', () => {
			// Check that PrismaPg was called with correct config
			expect(PrismaPg).toHaveBeenCalledWith({
				connectionString: 'postgresql://test:test@localhost:5432/test',
			});

			// Check that PrismaClient constructor was called with correct config
			expect(PrismaClient).toHaveBeenCalledWith({
				adapter: expect.any(Object),
				log: ['error', 'warn', 'info'],
				errorFormat: 'pretty',
			});
		});

		it('should handle missing DATABASE_URL environment variable', () => {
			// Temporarily unset DATABASE_URL
			delete process.env.DATABASE_URL;

			// Create a new service instance
			new PrismaService();

			// Should still call PrismaPg but with undefined connectionString
			expect(PrismaPg).toHaveBeenCalledWith({
				connectionString: undefined,
			});

			// Restore DATABASE_URL
			process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
		});
	});

	describe('onModuleInit', () => {
		it('should connect to database successfully', async () => {
			const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

			await service.onModuleInit();

			expect(connectSpy).toHaveBeenCalledTimes(1);
		});

		it('should throw error when database connection fails', async () => {
			const connectError = new Error('Connection failed');
			const _connectSpy = jest
				.spyOn(service, '$connect')
				.mockRejectedValue(connectError);
			const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

			await expect(service.onModuleInit()).rejects.toThrow(connectError);
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to connect to database:',
				connectError
			);

			consoleErrorSpy.mockRestore();
		});

		it('should handle connection success without error logging', async () => {
			const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();
			const consoleErrorSpy = jest.spyOn(console, 'error');

			await service.onModuleInit();

			expect(connectSpy).toHaveBeenCalledTimes(1);
			expect(consoleErrorSpy).not.toHaveBeenCalled();

			consoleErrorSpy.mockRestore();
		});

		it('should handle non-Error exceptions', async () => {
			const connectError = 'String error';
			const _connectSpy = jest
				.spyOn(service, '$connect')
				.mockRejectedValue(connectError);
			const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

			await expect(service.onModuleInit()).rejects.toBe(connectError);
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to connect to database:',
				connectError
			);

			consoleErrorSpy.mockRestore();
		});
	});

	describe('onModuleDestroy', () => {
		it('should disconnect from database', async () => {
			const disconnectSpy = jest
				.spyOn(service, '$disconnect')
				.mockResolvedValue();

			await service.onModuleDestroy();

			expect(disconnectSpy).toHaveBeenCalledTimes(1);
		});

		it('should handle disconnection errors gracefully', async () => {
			const disconnectError = new Error('Disconnection failed');
			const _disconnectSpy = jest
				.spyOn(service, '$disconnect')
				.mockRejectedValue(disconnectError);

			// onModuleDestroy doesn't have error handling, so it should throw
			await expect(service.onModuleDestroy()).rejects.toThrow(disconnectError);
		});

		it('should call disconnect even if connection never succeeded', async () => {
			const disconnectSpy = jest
				.spyOn(service, '$disconnect')
				.mockResolvedValue();

			// Call destroy without init
			await service.onModuleDestroy();

			expect(disconnectSpy).toHaveBeenCalledTimes(1);
		});
	});
});
