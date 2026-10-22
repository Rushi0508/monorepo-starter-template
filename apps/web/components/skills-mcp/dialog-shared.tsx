'use client';

import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const CopyableCode = ({ value }: { value: string }) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error('Could not copy — select the text and copy manually');
		}
	};

	// A single-line value stretches the button to match the field exactly; a
	// block of JSON pins it to the top so it lines up with the first row.
	const isMultiline = value.includes('\n');

	return (
		<div
			className={cn(
				'flex gap-2',
				isMultiline ? 'items-start' : 'items-stretch'
			)}
		>
			<code className='min-w-0 flex-1 overflow-x-auto whitespace-pre rounded-md border bg-muted px-3 py-1.5 font-mono text-xs leading-6'>
				{value}
			</code>
			<Button
				variant='outline'
				size='sm'
				onClick={handleCopy}
				aria-label='Copy to clipboard'
				className={cn('shrink-0', isMultiline ? 'h-9' : 'h-auto self-stretch')}
			>
				{copied ? (
					<Check className='size-4 text-emerald-600' />
				) : (
					<Copy className='size-4' />
				)}
			</Button>
		</div>
	);
};

export const Step = ({
	index,
	children,
}: {
	index: number;
	children: React.ReactNode;
}) => (
	<li className='flex gap-3'>
		<span className='flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground'>
			{index}
		</span>
		<span className='text-sm leading-5'>{children}</span>
	</li>
);
