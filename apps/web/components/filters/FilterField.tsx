import { Label } from '@repo/ui/components/label';
import type { ReactNode } from 'react';

interface FilterFieldProps {
	label: string;
	children: ReactNode;
	className?: string;
	description?: string;
}

export const FilterField = ({
	label,
	children,
	className,
	description,
}: FilterFieldProps) => {
	return (
		<div className={`space-y-2 ${className ?? ''}`}>
			<div>
				<Label className='text-sm font-medium'>{label}</Label>

				{description && (
					<p className='text-xs text-muted-foreground mt-1'>{description}</p>
				)}
			</div>

			{children}
		</div>
	);
};
