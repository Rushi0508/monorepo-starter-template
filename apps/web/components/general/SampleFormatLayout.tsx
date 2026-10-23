'use client';

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@repo/ui/components/collapsible';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { type ReactNode } from 'react';
import CustomTooltip from '@/components/general/CustomTooltip';

export const TableHeaderWithTooltip = ({
	title,
	tooltip,
}: {
	title: string;
	tooltip: string;
}) => (
	<th className='border border-border px-3 py-2 text-left'>
		<div className='flex items-center gap-1.5'>
			<span>{title}</span>
			<CustomTooltip content={tooltip}>
				<Info className='h-3.5 w-3.5 cursor-help text-muted-foreground' />
			</CustomTooltip>
		</div>
	</th>
);

interface SampleFormatColumn {
	header: string;
	tooltip: string;
	sampleValue: string;
}

interface SampleFormatLayoutProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	columns: SampleFormatColumn[];
	instructions: ReactNode;
	customSampleRow?: ReactNode;
}

export const SampleFormatLayout = ({
	open,
	onOpenChange,
	columns,
	instructions,
	customSampleRow,
}: SampleFormatLayoutProps) => {
	return (
		<Collapsible
			className='max-w-full overflow-hidden rounded-lg border px-4 py-3'
			open={open}
			onOpenChange={onOpenChange}
		>
			<CollapsibleTrigger asChild className='w-full cursor-pointer'>
				<div className='flex w-full items-center justify-between text-sm'>
					<div className='flex items-center gap-2'>
						<Info className='h-4 w-4 text-muted-foreground' />
						<span className='font-medium'>Sample Format & Instructions</span>
					</div>
					{open ? (
						<ChevronUp className='h-4 w-4' />
					) : (
						<ChevronDown className='h-4 w-4' />
					)}
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent className='mt-4 min-w-0 space-y-4'>
				<div>
					<h4 className='mb-2 font-medium'>Sample Data Format:</h4>
					<div className='max-w-full overflow-x-auto'>
						<table className='w-max min-w-max border-collapse border border-border text-xs'>
							<thead>
								<tr className='bg-muted/50'>
									{columns.map((col) => (
										<TableHeaderWithTooltip
											key={col.header}
											title={col.header}
											tooltip={col.tooltip}
										/>
									))}
								</tr>
							</thead>
							<tbody>
								{customSampleRow || (
									<tr>
										{columns.map((col) => (
											<td
												key={col.header}
												className='border border-border px-3 py-2'
											>
												{col.sampleValue || '-'}
											</td>
										))}
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
				{instructions}
			</CollapsibleContent>
		</Collapsible>
	);
};
