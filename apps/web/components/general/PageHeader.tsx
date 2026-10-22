import type React from 'react';

interface PageHeaderProps {
	title: string;
	/** ReactNode so pages can interpolate a date range or count into the copy */
	description: React.ReactNode;
	/** Right-aligned slot for filters, or a primary action button */
	actions?: React.ReactNode;
}

/**
 * The standard page header: title, supporting line, and an optional actions
 * slot on the right. Use this on every top-level page so titles, spacing and
 * description width stay consistent across the app.
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
	return (
		<div className='flex flex-wrap items-center justify-between gap-4'>
			<div className='min-w-0'>
				<h1 className='font-heading text-3xl leading-none'>{title}</h1>
				<p className='mt-1 max-w-3xl text-sm text-muted-foreground'>
					{description}
				</p>
			</div>
			{actions && <div className='flex items-center gap-2'>{actions}</div>}
		</div>
	);
}
