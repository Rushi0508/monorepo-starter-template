import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '@repo/ui/components/avatar';
import { getInitials } from '@repo/utils';

type UserAvatarProps = {
	name: string;
	image?: string | null;
	className?: string;
};

export function UserAvatar({ name, image, className }: UserAvatarProps) {
	return (
		<Avatar className={className}>
			{image && <AvatarImage src={image} alt={name} />}
			<AvatarFallback>{getInitials(name)}</AvatarFallback>
		</Avatar>
	);
}
