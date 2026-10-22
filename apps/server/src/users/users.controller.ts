import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterQueryDto } from './dto/user-query.dto';
import { UsersService } from './services/users.service';

@ApiTags('Users')
@ApiCookieAuth()
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get('me')
	@ApiOperation({ summary: 'Get the current user' })
	me(@Session() session: UserSession) {
		return this.usersService.me(session.user.id);
	}

	@Patch('me')
	@ApiOperation({ summary: 'Update the current user' })
	updateMe(@Session() session: UserSession, @Body() dto: UpdateUserDto) {
		return this.usersService.updateMe(session.user.id, dto);
	}

	@Get()
	@ApiOperation({ summary: 'List users with search and pagination' })
	getUsers(@Query() filter: UserFilterQueryDto) {
		return this.usersService.getUsers(filter);
	}
}
