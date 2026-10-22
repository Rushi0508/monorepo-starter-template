import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from '../services/s3.service';

jest.mock('@aws-sdk/client-s3', () => ({
	S3Client: jest.fn(),
	PutObjectCommand: jest.fn(),
	DeleteObjectCommand: jest.fn(),
}));

describe('S3Service', () => {
	let service: S3Service;
	let mockSend: jest.Mock;

	beforeEach(async () => {
		mockSend = jest.fn();
		(S3Client as jest.Mock).mockImplementation(() => ({ send: mockSend }));

		const module: TestingModule = await Test.createTestingModule({
			providers: [S3Service],
		}).compile();

		service = module.get<S3Service>(S3Service);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('uploadFile', () => {
		it('should upload a file and return key and url', async () => {
			mockSend.mockResolvedValue({});

			const mockFile = {
				buffer: Buffer.from('test'),
				mimetype: 'application/pdf',
				originalname: 'test.pdf',
			} as Express.Multer.File;

			const result = await service.uploadFile(
				mockFile,
				'documents',
				'file.pdf'
			);

			expect(PutObjectCommand).toHaveBeenCalled();
			expect(mockSend).toHaveBeenCalled();
			expect(result).toHaveProperty('key', 'documents/file.pdf');
			expect(result).toHaveProperty('url');
			expect(result.url).toContain('documents/file.pdf');
		});
	});

	describe('deleteFile', () => {
		it('should delete a file by key', async () => {
			mockSend.mockResolvedValue({});

			await service.deleteFile('documents/file.pdf');

			expect(DeleteObjectCommand).toHaveBeenCalled();
			expect(mockSend).toHaveBeenCalled();
		});
	});
});
