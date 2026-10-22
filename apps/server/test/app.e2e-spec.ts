import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('AppController (e2e)', () => {
	let app: INestApplication<App>;

	beforeEach(async () => {
		const moduleFixture = await Test.createTestingModule({
			controllers: [AppController],
			providers: [AppService],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	afterEach(async () => {
		await app.close();
	});

	it('/health (GET)', async () => {
		const response = await request(app.getHttpServer()).get('/health');

		expect(response.status).toBe(200);
		expect(response.text).toBe('Server is up and healthy');
	});
});
