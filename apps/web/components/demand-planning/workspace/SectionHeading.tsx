import { cn } from '@repo/ui/lib/utils';
import { Pencil } from 'lucide-react';

export const SectionHeading = ({
	title,
	onEdit,
	className = '',
	headingClassName = '',
}: {
	title: string;
	onEdit?: () => void;
	className?: string;
	headingClassName?: string;
}) => (
	<div className={cn('flex items-center justify-between gap-2', className)}>
		<h3 className={cn('text-sm font-medium', headingClassName)}>{title}</h3>
		{onEdit && (
			<button
				type='button'
				className='shrink-0 text-muted-foreground hover:text-foreground pr-2'
				aria-label={`Edit ${title.toLowerCase()}`}
				onClick={onEdit}
			>
				<Pencil className='size-4' />
			</button>
		)}
	</div>
);
