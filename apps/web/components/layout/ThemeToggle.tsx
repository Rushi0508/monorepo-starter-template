'use client';

import { Button } from '@repo/ui/components/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import CustomTooltip from '@/components/general/CustomTooltip';

const ThemeToggle = () => {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	const isDark = mounted && resolvedTheme === 'dark';
	const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

	return (
		<CustomTooltip content={label} delayDuration={200}>
			<Button
				variant='ghost'
				size='icon'
				className='size-8'
				aria-label={label}
				onClick={() => setTheme(isDark ? 'light' : 'dark')}
			>
				{isDark ? <Sun className='size-4' /> : <Moon className='size-4' />}
			</Button>
		</CustomTooltip>
	);
};

export default ThemeToggle;
