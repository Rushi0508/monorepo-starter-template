import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

const toBoolean = ({ value }: { value: unknown }): unknown =>
	value === 'true' ? true : value === 'false' ? false : value;

export class TriggerPipelineDto {
	/** Drop a RUNNING lock left behind by a dead process before running. */
	@IsBoolean()
	@IsOptional()
	@Transform(toBoolean)
	force?: boolean;
}

export class SetPipelinePausedDto {
	@IsBoolean()
	@Transform(toBoolean)
	isPaused: boolean;
}
