import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { config } from '../../common/env-config';

@Injectable()
export class S3Service {
	private readonly s3Client: S3Client;

	constructor() {
		this.s3Client = new S3Client({
			region: config.s3.region,
			credentials: {
				accessKeyId: config.s3.accessKeyId,
				secretAccessKey: config.s3.secretAccessKey,
			},
		});
	}

	async uploadFile(
		file: Express.Multer.File,
		folderName: string,
		fileName: string
	) {
		const key = `${folderName}/${fileName}`;

		const command = new PutObjectCommand({
			Bucket: config.s3.bucketName,
			Key: key,
			Body: file.buffer,
			ContentType: file.mimetype,
		});

		await this.s3Client.send(command);

		return {
			key,
			url: `https://${config.s3.bucketName}.s3.${config.s3.region}.amazonaws.com/${key}`,
		};
	}

	async deleteFile(key: string) {
		const command = new DeleteObjectCommand({
			Bucket: config.s3.bucketName,
			Key: key,
		});

		await this.s3Client.send(command);
	}
}
