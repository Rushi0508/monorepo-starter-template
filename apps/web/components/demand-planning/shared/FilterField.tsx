import type React from 'react';
import CustomTooltip from '@/components/general/CustomTooltip';

interface FilterFieldProps {
	label: string;
	tooltip?: string;
	children: React.ReactNode;
}

export function FilterField({ label, tooltip, children }: FilterFieldProps) {
	return (
		<div className='flex flex-col gap-1'>
			<span className='flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
				{label}
				{tooltip && <CustomTooltip content={tooltip} />}
			</span>
			{children}
		</div>
	);
}
