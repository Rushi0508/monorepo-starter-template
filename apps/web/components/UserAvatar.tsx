import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import { cn } from '@repo/ui/lib/utils';
import { getInitials } from '@repo/utils';

interface UserAvatarProps {
	name: string;
	image?: string;
	isYou?: boolean;
	showName?: boolean;
	className?: string;
	textClassName?: string;
	showJustFirstName?: boolean;
}

const UserAvatar = ({
	name,
	image,
	isYou = false,
	showName = true,
	className,
	textClassName,
	showJustFirstName = false,
}: UserAvatarProps) => {
	return (
		<div className='flex items-center gap-2'>
			<Avatar className={cn('h-8 w-8', className)}>
				<AvatarImage src={image ?? undefined} alt={name} />
				<AvatarFallback className='bg-primary text-primary-foreground text-xs'>
					{getInitials(name)}
				</AvatarFallback>
			</Avatar>
			{showName && (
				<span className={cn('text-sm font-medium', textClassName)}>
					{showJustFirstName ? name.split(' ')[0] : name}{' '}
					{isYou ? (
						<Badge variant='secondary' className='uppercase'>
							You
						</Badge>
					) : null}
				</span>
			)}
		</div>
	);
};

export default UserAvatar;
