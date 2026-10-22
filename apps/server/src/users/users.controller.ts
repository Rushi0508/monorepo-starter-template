import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UserFilterQueryDto } from './dto/user-query.dto';
import { UsersService } from './services/users.service';

@ApiTags('Users')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get('me')
	@ApiOperation({ summary: 'Get current user' })
	async me(@Session() session: UserSession) {
		return this.usersService.me(session.user.id);
	}

	@Get()
	@ApiOperation({ summary: 'List users with search and pagination' })
	getUsers(@Query() filter: UserFilterQueryDto) {
		return this.usersService.getUsers(filter);
	}

	@Post()
	@ApiOperation({ summary: 'Create a new user' })
	create(@Body() dto: CreateUserDto) {
		return this.usersService.create(dto);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update a user' })
	update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
		return this.usersService.update(id, dto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a user' })
	delete(@Param('id') id: string, @Session() session: UserSession) {
		return this.usersService.delete(id, session.user.id);
	}
}
