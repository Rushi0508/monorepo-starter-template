import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import type { Prisma } from '@repo/db';
import { AuthContextType, GetUsersResponseType } from '@repo/types';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from '../dto/create-user.dto';
import { UserFilterQueryDto } from '../dto/user-query.dto';

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	async me(userId: string): Promise<AuthContextType> {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});
		if (!user) {
			throw new UnauthorizedException('User is not added in the system.');
		}

		return {
			id: user.id,
			email: user.email,
			name: user.name,
			image: user.image,
		};
	}

	async getUsers(filter: UserFilterQueryDto): Promise<GetUsersResponseType> {
		const { search, page = 1, limit = 10 } = filter;

		const where: Prisma.UserWhereInput = {};

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ email: { contains: search, mode: 'insensitive' } },
			];
		}

		const [totalCount, data] = await Promise.all([
			this.prisma.user.count({ where }),
			this.prisma.user.findMany({
				where,
				select: {
					id: true,
					name: true,
					email: true,
				},
				orderBy: {
					createdAt: 'desc',
				},
				skip: (page - 1) * limit,
				take: limit,
			}),
		]);

		return { data, totalCount, page, limit };
	}

	async create(dto: CreateUserDto): Promise<{ message: string }> {
		const existing = await this.prisma.user.findUnique({
			where: { email: dto.email },
		});
		if (existing) {
			throw new ConflictException(
				`User with email "${dto.email}" already exists`
			);
		}

		await this.prisma.user.create({
			data: {
				name: dto.name,
				email: dto.email,
				emailVerified: true,
			},
		});

		return { message: 'User created successfully' };
	}

	async update(id: string, dto: UpdateUserDto): Promise<{ message: string }> {
		const existing = await this.prisma.user.findUnique({ where: { id } });
		if (!existing) {
			throw new NotFoundException(`User with id "${id}" not found`);
		}

		await this.prisma.user.update({
			where: { id },
			data: { name: dto.name },
		});

		return { message: 'User updated successfully' };
	}

	async delete(
		id: string,
		currentUserId: string
	): Promise<{ message: string }> {
		if (id === currentUserId) {
			throw new BadRequestException('You cannot delete your own account');
		}

		const existing = await this.prisma.user.findUnique({ where: { id } });
		if (!existing) {
			throw new NotFoundException(`User with id "${id}" not found`);
		}

		await this.prisma.user.delete({ where: { id } });

		return { message: 'User deleted successfully' };
	}
}
