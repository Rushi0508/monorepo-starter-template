import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from './users.service';

jest.mock('src/prisma/prisma.service', () => ({ PrismaService: class {} }));

const user = {
	id: 'user-1',
	email: 'jane@example.com',
	name: 'Jane',
	image: null,
};

describe('UsersService', () => {
	let service: UsersService;
	const prisma = {
		user: {
			findUnique: jest.fn(),
			findMany: jest.fn(),
			count: jest.fn(),
			update: jest.fn(),
		},
		$transaction: jest.fn((queries: Promise<unknown>[]) =>
			Promise.all(queries)
		),
	};

	beforeEach(async () => {
		const testingModule = await Test.createTestingModule({
			providers: [UsersService, { provide: PrismaService, useValue: prisma }],
		}).compile();

		service = testingModule.get(UsersService);
	});

	describe('me', () => {
		it('returns the user', async () => {
			prisma.user.findUnique.mockResolvedValue(user);

			await expect(service.me(user.id)).resolves.toEqual(user);
		});

		it('throws when the user does not exist', async () => {
			prisma.user.findUnique.mockResolvedValue(null);

			await expect(service.me('missing')).rejects.toThrow(NotFoundException);
		});
	});

	describe('getUsers', () => {
		it('paginates without a search filter', async () => {
			prisma.user.count.mockResolvedValue(1);
			prisma.user.findMany.mockResolvedValue([user]);

			const result = await service.getUsers({});

			expect(result).toEqual({
				data: [user],
				totalCount: 1,
				page: 1,
				limit: 10,
			});
			expect(prisma.user.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: {}, skip: 0, take: 10 })
			);
		});

		it('filters by name or email when searching', async () => {
			prisma.user.count.mockResolvedValue(0);
			prisma.user.findMany.mockResolvedValue([]);

			await service.getUsers({ search: 'jane', page: 2, limit: 5 });

			expect(prisma.user.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						OR: [
							{ name: { contains: 'jane', mode: 'insensitive' } },
							{ email: { contains: 'jane', mode: 'insensitive' } },
						],
					},
					skip: 5,
					take: 5,
				})
			);
		});
	});

	describe('updateMe', () => {
		it('updates the name', async () => {
			prisma.user.update.mockResolvedValue({ ...user, name: 'Janet' });

			const result = await service.updateMe(user.id, { name: 'Janet' });

			expect(result.name).toBe('Janet');
			expect(prisma.user.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: user.id },
					data: { name: 'Janet' },
				})
			);
		});
	});
});
