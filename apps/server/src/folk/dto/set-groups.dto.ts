import { ApiProperty } from '@nestjs/swagger';
import type { SetFolkTrackedGroupsInput } from '@repo/types';
import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class SetFolkTrackedGroupsDto implements SetFolkTrackedGroupsInput {
	@ApiProperty({
		type: [String],
		description: 'Folk group ids to track; anything missing is untracked',
	})
	@IsArray()
	@ArrayUnique()
	@IsString({ each: true })
	folkGroupIds: string[];
}
