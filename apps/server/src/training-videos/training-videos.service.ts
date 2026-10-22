import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import type { TrainingVideoType } from '@repo/types';
import { toVideoEmbedUrl } from '@repo/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import {
	CreateTrainingVideoDto,
	UpdateTrainingVideoDto,
} from './dto/create-training-video.dto';

const assertSupportedUrl = (url: string) => {
	if (!toVideoEmbedUrl(url)) {
		throw new BadRequestException(
			'Only Loom and Tella video links are supported'
		);
	}
};

@Injectable()
export class TrainingVideosService {
	constructor(private readonly prisma: PrismaService) {}

	async list(): Promise<TrainingVideoType[]> {
		const videos = await this.prisma.trainingVideo.findMany({
			include: { createdBy: { select: { id: true, name: true } } },
			orderBy: { createdAt: 'desc' },
		});

		return videos;
	}

	async create(
		dto: CreateTrainingVideoDto,
		userId: string
	): Promise<{ message: string }> {
		assertSupportedUrl(dto.url);

		await this.prisma.trainingVideo.create({
			data: {
				title: dto.title,
				description: dto.description || null,
				url: dto.url,
				createdById: userId,
			},
		});

		return { message: 'Training video added' };
	}

	async update(
		id: string,
		dto: UpdateTrainingVideoDto
	): Promise<{ message: string }> {
		await this.requireVideo(id);
		if (dto.url !== undefined) assertSupportedUrl(dto.url);

		await this.prisma.trainingVideo.update({
			where: { id },
			data: {
				title: dto.title,
				description:
					dto.description === undefined ? undefined : dto.description || null,
				url: dto.url,
			},
		});

		return { message: 'Training video updated' };
	}

	async delete(id: string): Promise<{ message: string }> {
		await this.requireVideo(id);
		await this.prisma.trainingVideo.delete({ where: { id } });
		return { message: 'Training video deleted' };
	}

	private async requireVideo(id: string) {
		const video = await this.prisma.trainingVideo.findUnique({ where: { id } });
		if (!video) throw new NotFoundException('Training video not found');
		return video;
	}
}
