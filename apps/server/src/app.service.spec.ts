import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
	let service: AppService;

	beforeEach(async () => {
		const testingModule: TestingModule = await Test.createTestingModule({
			providers: [AppService],
		}).compile();

		service = testingModule.get<AppService>(AppService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getHello', () => {
		it('should return "Hello World!"', () => {
			const result = service.healthCheck();
			expect(result).toBe('Server is up and healthy');
		});
	});
});
