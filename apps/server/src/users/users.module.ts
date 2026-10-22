import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from 'src/common/auth';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersService } from './services/users.service';
import { UsersController } from './users.controller';

@Module({
	imports: [
		PrismaModule,
		BetterAuthModule.forRoot({
			auth,
			disableGlobalAuthGuard: true,
		}),
	],
	controllers: [UsersController],
	providers: [UsersService],
	exports: [UsersService],
})
export class UsersModule {}
