'use client';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { Separator } from '@repo/ui/components/separator';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRedirect } from '@/hooks/useRedirect';
import UserAvatar from '../UserAvatar';

const ProfileDropdown = () => {
	const user = useAuth();
	const { handleLogout } = useRedirect();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className='outline-none'>
				<UserAvatar
					name={user?.name ?? ''}
					image={user?.image ?? undefined}
					className='size-7'
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-fit min-w-48'>
				<div className='px-1.5 py-1 text-left'>
					<p className='text-sm font-medium leading-tight'>{user?.name}</p>
					<p className='text-muted-foreground text-xs leading-tight'>
						{user?.email}
					</p>
				</div>
				<Separator className='my-1' />
				<DropdownMenuItem
					onClick={() => handleLogout()}
					className='cursor-pointer'
				>
					<LogOut className='size-4 shrink-0' />
					Logout
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ProfileDropdown;
