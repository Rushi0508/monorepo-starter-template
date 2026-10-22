import CustomTooltip from '@/components/general/CustomTooltip';

interface OverflowListProps {
	items?: string[] | string;
	visibleCount?: number;
	className?: string;
}

export function OverflowList({
	items,
	visibleCount = 1,
	className,
}: OverflowListProps) {
	const itemsArray = Array.isArray(items)
		? items
		: (items?.split(',').map((item) => item.trim()) ?? []);
	if (!items || itemsArray.length === 0)
		return <span className='text-xs text-muted-foreground'>—</span>;

	const visible = itemsArray.slice(0, visibleCount);
	const hidden = itemsArray.slice(visibleCount);

	return (
		<div className={`flex flex-wrap items-center gap-1.5 ${className ?? ''}`}>
			<span className='text-xs font-medium text-foreground/80'>
				{visible.join(', ')}
			</span>

			{hidden.length > 0 && (
				<CustomTooltip
					delayDuration={200}
					content={
						<ul className='space-y-0.5'>
							{hidden.map((item) => (
								<li key={item} className='text-xs'>
									{item}
								</li>
							))}
						</ul>
					}
				>
					<span className='cursor-default rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground'>
						+{hidden.length}
					</span>
				</CustomTooltip>
			)}
		</div>
	);
}
