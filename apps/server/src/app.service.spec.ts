import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
	let service: AppService;

	beforeEach(async () => {
		const testingModule = await Test.createTestingModule({
			providers: [AppService],
		}).compile();

		service = testingModule.get(AppService);
	});

	it('reports healthy', () => {
		expect(service.healthCheck()).toBe('Server is up and healthy');
	});
});
