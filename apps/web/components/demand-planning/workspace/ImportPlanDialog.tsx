'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChannelEnum } from '@repo/enums';
import type {
	DemandGridType,
	DemandPlanType,
	SkuOptionType,
} from '@repo/types';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@repo/ui/components/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { cn } from '@repo/ui/lib/utils';
import { UploadCloud } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DownloadTemplateBanner } from '@/components/general/DownloadTemplateBanner';
import {
	FileUploadDialogFooter,
	FileUploadFormFooter,
} from '@/components/general/FileUploadFormFooter';
import { SampleFormatLayout } from '@/components/general/SampleFormatLayout';
import { useFileUploadHandlers } from '@/hooks/useFileUploadHandlers';
import { useImportPlan, usePlanGrid, useSkuOptions } from '@/queries';
import { downloadCsv } from '@/utils/csv-template';
import { periodLabel } from '../shared/period';

const ImportSchema = z.object({
	file: z.instanceof(File, { message: 'Choose a CSV or Excel file' }),
});
type ImportInput = z.infer<typeof ImportSchema>;

const monthHeader = (period: string) => periodLabel(period);

/** Only months the plan can still be edited in belong in the template. */
function editablePeriods(grid: DemandGridType): string[] {
	return grid.periods.filter((period) =>
		grid.series.some((series) => series.cells[period]?.isEditable)
	);
}

function templateRows(
	grid: DemandGridType,
	skuById: Map<string, SkuOptionType>
): (string | number | null)[][] {
	const periods = editablePeriods(grid);
	const rows: (string | number | null)[][] = [
		['Channel', 'SKU', ...periods.map(monthHeader)],
	];

	for (const series of grid.series) {
		rows.push([
			series.channel,
			skuById.get(series.skuSettingId)?.sku ?? series.skuSettingId,
			...periods.map((period) => series.cells[period]?.planUnits ?? null),
		]);
	}
	return rows;
}

export const ImportPlanDialog = ({
	plan,
	open,
	onClose,
}: {
	plan: DemandPlanType;
	open: boolean;
	onClose: () => void;
}) => {
	const [apiError, setApiError] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [showSampleFormat, setShowSampleFormat] = useState(false);

	const { data: grid } = usePlanGrid(plan.id);
	const { data: skuOptions = [] } = useSkuOptions();
	const { mutate: importPlan, isPending } = useImportPlan(plan.id);

	const form = useForm<ImportInput>({
		resolver: zodResolver(ImportSchema),
		defaultValues: { file: undefined },
	});

	const {
		file,
		handleFileChange,
		handleDrop,
		handleDragEnter,
		handleDragLeave,
		handleClose,
	} = useFileUploadHandlers({
		form: form as never,
		setApiError,
		setIsDragging,
		setShowSampleFormat,
		onClose,
	});

	useEffect(() => {
		if (open) {
			form.reset();
			setApiError(null);
			setShowSampleFormat(false);
		}
	}, [open, form]);

	const onSubmit = (data: ImportInput) =>
		importPlan(data.file, {
			onSuccess: () => handleClose(),
			onError: (err: Error) => setApiError(err.message),
		});

	const periods = grid ? editablePeriods(grid) : [];
	const skuById = new Map(skuOptions.map((sku) => [sku.id, sku]));

	return (
		<Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
			<DialogContent className='max-w-2xl overflow-x-hidden'>
				<DialogHeader>
					<DialogTitle>Import into {plan.name}</DialogTitle>
					<DialogDescription>
						Sets the Plan row for each channel and SKU. The template carries
						this plan's current numbers, so you can edit it and upload it back.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<DownloadTemplateBanner
							label='Download template'
							onDownload={() =>
								grid &&
								downloadCsv(
									templateRows(grid, skuById),
									`${plan.name.replaceAll(/\s+/g, '-').toLowerCase()}-template.csv`
								)
							}
						/>

						<SampleFormatLayout
							open={showSampleFormat}
							onOpenChange={setShowSampleFormat}
							columns={[
								{
									header: 'Channel',
									tooltip: 'Must be a channel this plan covers.',
									sampleValue:
										plan.channelScopes[0]?.channel ?? ChannelEnum.DTC,
								},
								{
									header: 'SKU',
									tooltip:
										'The SKU code as it appears in SKU settings, in scope for that channel.',
									sampleValue: 'SAU-SL-12-12CASE',
								},
								{
									header: periods[0] ? monthHeader(periods[0]) : 'Sep 2026',
									tooltip:
										'One column per month. Cases as a whole number; leave blank to keep the current value.',
									sampleValue: '120',
								},
							]}
							instructions={
								<ul className='list-disc space-y-1 pl-4 text-sm'>
									<li>
										One row per channel and SKU, one column per month —{' '}
										{periods.length
											? `${monthHeader(periods[0] as string)} to ${monthHeader(periods[periods.length - 1] as string)}`
											: 'the plan’s forecast window'}
										.
									</li>
									<li>A blank cell leaves that month unchanged.</li>
									<li>
										Months outside the forecast window are ignored; closed
										months cannot be planned.
									</li>
									<li>
										Imported cells are recorded as a manual adjustment, and
										still flag in the grid if they sit far from the forecast.
									</li>
									<li>Nothing is imported unless the whole file is valid.</li>
								</ul>
							}
						/>

						<FormField
							control={form.control}
							name='file'
							render={({ fieldState }) => (
								<FormItem>
									<label
										htmlFor='plan-import-file'
										className={cn(
											'relative block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center',
											isDragging && 'border-primary bg-primary/10',
											fieldState.error && 'border-destructive'
										)}
										onDrop={handleDrop}
										onDragOver={(event) => event.preventDefault()}
										onDragEnter={handleDragEnter}
										onDragLeave={handleDragLeave}
									>
										<FormControl>
											<div>
												<UploadCloud className='mx-auto mb-4 h-12 w-12 text-gray-400' />
												<p className='text-sm'>
													Drag and drop your file here, or click to browse.
												</p>
												<p className='text-xs text-muted-foreground'>
													Supports: .csv, .xlsx, .xls
												</p>
												<Input
													id='plan-import-file'
													type='file'
													className='sr-only'
													onChange={handleFileChange}
													accept='.csv, .xlsx, .xls'
													disabled={isPending}
												/>
											</div>
										</FormControl>
									</label>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FileUploadFormFooter
							file={file}
							form={form as never}
							isPending={isPending}
							apiError={apiError}
							setShowSampleFormat={setShowSampleFormat}
						/>

						<FileUploadDialogFooter
							file={file}
							form={form as never}
							isPending={isPending}
							handleClose={handleClose}
						/>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default ImportPlanDialog;
