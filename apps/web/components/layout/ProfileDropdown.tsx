'use client';

import { Button } from '@repo/ui/components/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { UserAvatar } from '@/components/general/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useRedirect } from '@/hooks/useRedirect';

export function ProfileDropdown() {
	const user = useAuth();
	const { handleLogout } = useRedirect();
	const { resolvedTheme, setTheme } = useTheme();
	const isDark = resolvedTheme === 'dark';

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<Button variant='ghost' size='icon' className='rounded-full' />}
			>
				<UserAvatar name={user.name} image={user.image} className='size-8' />
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='min-w-56'>
				<DropdownMenuGroup>
					<DropdownMenuLabel>
						<p className='text-foreground text-sm font-medium'>{user.name}</p>
						<p className='text-muted-foreground text-xs font-normal'>
							{user.email}
						</p>
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => setTheme(isDark ? 'light' : 'dark')}>
					{isDark ? <Sun /> : <Moon />}
					{isDark ? 'Light mode' : 'Dark mode'}
				</DropdownMenuItem>
				<DropdownMenuItem variant='destructive' onClick={() => handleLogout()}>
					<LogOut />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
