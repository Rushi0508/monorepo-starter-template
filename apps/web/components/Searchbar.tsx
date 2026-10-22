import { Input } from '@repo/ui/components/input';
import { cn } from '@repo/ui/lib/utils';
import { Search } from 'lucide-react';
import type React from 'react';

interface SearchbarProps {
	placeholder?: string;
	onChange: (value: string) => void;
	value?: string;
	inputClassName?: string;
	onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

const Searchbar = ({
	placeholder = 'Search',
	onChange,
	value,
	inputClassName,
	onKeyDown,
}: SearchbarProps) => {
	return (
		<div className='w-full relative'>
			<Input
				placeholder={placeholder}
				className={cn('w-full max-w-md pl-9', inputClassName)}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={onKeyDown}
				value={value}
			/>
			<Search className='size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2' />
		</div>
	);
};

export default Searchbar;
