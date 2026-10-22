import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@repo/db';
import type { AuthContextType, GetUsersResponseType } from '@repo/types';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserFilterQueryDto } from '../dto/user-query.dto';

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	async me(userId: string): Promise<AuthContextType> {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, email: true, name: true, image: true },
		});
		if (!user) {
			throw new NotFoundException('User not found');
		}
		return user;
	}

	async getUsers(filter: UserFilterQueryDto): Promise<GetUsersResponseType> {
		const { search, page = 1, limit = 10 } = filter;

		const where: Prisma.UserWhereInput = search
			? {
					OR: [
						{ name: { contains: search, mode: 'insensitive' } },
						{ email: { contains: search, mode: 'insensitive' } },
					],
				}
			: {};

		const [totalCount, data] = await this.prisma.$transaction([
			this.prisma.user.count({ where }),
			this.prisma.user.findMany({
				where,
				select: { id: true, name: true, email: true, createdAt: true },
				orderBy: { createdAt: 'desc' },
				skip: (page - 1) * limit,
				take: limit,
			}),
		]);

		return { data, totalCount, page, limit };
	}

	async updateMe(userId: string, dto: UpdateUserDto): Promise<AuthContextType> {
		return this.prisma.user.update({
			where: { id: userId },
			data: { name: dto.name },
			select: { id: true, email: true, name: true, image: true },
		});
	}
}
