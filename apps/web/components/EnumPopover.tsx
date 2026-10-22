import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@repo/ui/components/popover';
import { cn } from '@repo/ui/lib/utils';
import { Check } from 'lucide-react';
import { EnumBadge } from './general/CustomBadge';

type EnumLike = Record<string, string | number>;

interface EnumPopoverProps<T extends EnumLike> {
	enumObj: T;
	value: T[keyof T];
	onChange: (newValue: T[keyof T]) => void;
	exclude?: T[keyof T][];
	activeClassName?: string;
	className?: string;
}

export const EnumPopover = <T extends EnumLike>({
	enumObj,
	value,
	onChange,
	exclude,
	activeClassName,
	className,
}: EnumPopoverProps<T>) => {
	const enumValues = Object.values(enumObj).filter(
		(v) => typeof v === 'string' && !exclude?.includes(v as T[keyof T])
	) as T[keyof T][];

	return (
		<Popover>
			<PopoverTrigger className={className}>
				<EnumBadge
					value={value as unknown as string}
					showChevron
					className={cn(activeClassName, className && 'w-full')}
				/>
			</PopoverTrigger>

			<PopoverContent className='w-[200px] cursor-pointer p-0' align='end'>
				{enumValues.map((v) => (
					<button
						type='button'
						key={String(v)}
						onClick={() => onChange(v)}
						className='hover:bg-accent flex items-center justify-between space-x-2 p-2 w-full'
					>
						<EnumBadge value={v as unknown as string} />
						<Check
							className={cn(
								'ml-auto h-4 w-4 transition-opacity',
								value === v ? 'opacity-100' : 'opacity-0'
							)}
						/>
					</button>
				))}
			</PopoverContent>
		</Popover>
	);
};
