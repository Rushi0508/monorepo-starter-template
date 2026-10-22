'use client';

import type { DemandPlanType, SkuOptionType } from '@repo/types';
import {
	type CellClassParams,
	type ColDef,
	type GetRowIdParams,
	type IAggFuncParams,
	type IRowNode,
	ModuleRegistry,
	themeQuartz,
	type ValueFormatterParams,
	type ValueGetterParams,
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { AlertTriangle } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import AlertMessage from '@/components/general/AlertMessage';
import {
	SegmentedToggle,
	type SegmentedToggleOption,
} from '@/components/general/SegmentedToggle';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import {
	useForecastMethods,
	usePlanGrid,
	useSetDemandEntry,
	useSkuOptions,
} from '@/queries';
import { FORECAST_METHOD_LABELS } from '../shared/constants';
import { periodLabel } from '../shared/period';
import { ForecastMethodDialog } from '../workspace/ForecastMethodDialog';
import {
	buildRows,
	buildSummary,
	type GridRow,
	type GroupBy,
	groupTotalFor,
	groupValueFor,
	isMoney,
	METRICS,
	type Metric,
	metricLabel,
} from './grid-rows';
import { OverrideDialog, type OverrideTarget } from './OverrideDialog';
import './plan-grid.css';

// Enterprise powers row grouping and aggregation. No licence key is set — an
// internal tool, so AG Grid logs a watermark warning.
ModuleRegistry.registerModules([AllEnterpriseModule]);

const gridTheme = themeQuartz.withParams({
	fontFamily: 'inherit',
	headerFontFamily: 'inherit',
	fontSize: 12,
	headerFontSize: 12,
	headerFontWeight: 600,
	wrapperBorder: false,
	wrapperBorderRadius: 0,
	columnBorder: true,
	headerColumnBorder: true,
	rowBorder: true,
	headerRowBorder: true,
	borderColor: 'var(--border)',
	foregroundColor: 'var(--foreground)',
	accentColor: 'var(--primary)',
	backgroundColor: 'var(--card)',
	// The header stays white; the tint moves to the channel rows, which is what
	// the eye should be grouping by.
	headerBackgroundColor: 'var(--card)',
	oddRowBackgroundColor: 'var(--card)',
	cellHorizontalPadding: 12,
	rowHeight: 38,
	headerHeight: 44,
	rowGroupIndentSize: 0,
});

/** "2026-08" → "AUG '26", short enough for a month column. */
const monthHeader = (period: string) =>
	`${periodLabel(period).slice(0, 3).toUpperCase()} '${period.slice(2, 4)}`;

const cases = (value: number | null) =>
	value === null || value === undefined
		? '—'
		: Math.round(value).toLocaleString();

const money = (value: number | null) =>
	value === null || value === undefined
		? '—'
		: value.toLocaleString(undefined, {
				style: 'currency',
				currency: 'USD',
				maximumFractionDigits: 0,
			});

const signedCases = (value: number | null) => {
	if (value === null || value === undefined) return '—';
	const rounded = Math.round(value);
	return rounded > 0
		? `+${rounded.toLocaleString()}`
		: rounded.toLocaleString();
};

const format = (metric: Metric, value: number | null) => {
	if (metric === 'variance') return signedCases(value);
	return isMoney(metric) ? money(value) : cases(value);
};

const GROUP_OPTIONS: SegmentedToggleOption<GroupBy>[] = [
	{ value: 'channel', label: 'Channel', title: 'Group rows by channel' },
	{ value: 'sku', label: 'SKU', title: 'Group rows by SKU' },
];

const leavesOf = (node?: IRowNode<GridRow> | null): { data?: GridRow }[] =>
	(node?.allLeafChildren ?? []) as { data?: GridRow }[];

export const PlanGrid = ({ plan }: { plan: DemandPlanType }) => {
	const { data: grid, isLoading, error } = usePlanGrid(plan.id);
	const { data: skuOptions = [] } = useSkuOptions();
	const { mutate: setEntry } = useSetDemandEntry(plan.id);

	const [pendingCells, setPendingCells] = useState<Record<string, number>>({});
	const [methodSeries, setMethodSeries] = useState<{
		channel: string;
		skuSettingId: string;
	} | null>(null);
	const [override, setOverride] = useState<OverrideTarget | null>(null);
	const [groupBy, setGroupBy] = useState<GroupBy>('channel');

	// Two grids kept in horizontal step; each needs a handle on the other.
	const mainGrid = useRef<AgGridReact<GridRow>>(null);
	const summaryGrid = useRef<AgGridReact<GridRow>>(null);
	const mainGrids = useMemo(() => [mainGrid], []);
	const summaryGrids = useMemo(() => [summaryGrid], []);

	const { data: methods = [] } = useForecastMethods(plan.id);
	const methodBySeries = useMemo(
		() =>
			new Map(
				methods.map((method) => [
					`${method.channel}|${method.skuSettingId}`,
					method,
				])
			),
		[methods]
	);

	const skuById = useMemo(
		() => new Map(skuOptions.map((option) => [option.id, option])),
		[skuOptions]
	);

	const rows = useMemo(() => (grid ? buildRows(grid) : []), [grid]);
	const summary = useMemo(() => (grid ? buildSummary(grid) : []), [grid]);

	const label = useCallback(
		(sku?: SkuOptionType) =>
			sku?.title?.trim() && sku.title !== sku.sku
				? `${sku.title} - ${sku.sku}`
				: (sku?.sku ?? 'Unknown SKU'),
		[]
	);

	const columnDefs = useMemo<ColDef<GridRow>[]>(() => {
		if (!grid) return [];

		const monthCols: ColDef<GridRow>[] = grid.periods.map((period) => {
			const isForecast = period >= grid.firstForecastPeriod;

			return {
				colId: period,
				headerName: monthHeader(period),
				width: 104,
				type: 'numericColumn',
				valueGetter: (params: ValueGetterParams<GridRow>) =>
					params.data?.values[period] ?? null,
				aggFunc: (params: IAggFuncParams<GridRow>) =>
					groupValueFor(leavesOf(params.rowNode), period, isForecast),
				valueFormatter: (params: ValueFormatterParams<GridRow>) =>
					params.node?.group
						? cases(params.value)
						: params.data
							? format(params.data.metric, params.value)
							: '',
				// Explains the asterisk on a month that has not finished.
				tooltipValueGetter: (params: { data?: GridRow }) =>
					params.data?.metric === 'actual' &&
					params.data.cells[period]?.isPartialActual
						? 'Sales to date — this month is still in progress'
						: null,
				// Only the Plan row of a forecast month can be typed into.
				editable: (params) =>
					params.data?.metric === 'plan' &&
					Boolean(params.data.cells[period]?.isEditable),
				// Only a flagged cell carries a marker — one far enough from the
				// forecast to be worth a second look. An ordinary override is a normal
				// act of planning and needs no decoration.
				cellRenderer: (params: { data?: GridRow; valueFormatted?: string }) => {
					const row = params.data;
					const cell = row?.cells[period];
					if (row?.metric !== 'plan' || !cell?.isFlagged) {
						return params.valueFormatted ?? '';
					}

					return (
						<span className='flex items-center justify-end gap-1'>
							<button
								type='button'
								aria-label='Override details'
								className='shrink-0 text-amber-600'
								onClick={(event) => {
									event.stopPropagation();
									setOverride({
										channel: row.channel,
										skuSettingId: row.skuSettingId,
										period,
										statistical: cell.statisticalUnits,
										previous: cell.planUnits,
										next: null,
										reason: cell.overrideReason,
										note: cell.overrideNote,
									});
								}}
							>
								<AlertTriangle className='size-3' />
							</button>
							{params.valueFormatted ?? ''}
						</span>
					);
				},
				cellClassRules: {
					'pg-editable': (p: CellClassParams<GridRow>) =>
						p.data?.metric === 'plan' &&
						Boolean(p.data.cells[period]?.isEditable),
					'pg-override': (p: CellClassParams<GridRow>) =>
						p.data?.metric === 'plan' &&
						Boolean(p.data.cells[period]?.isOverride),
					'pg-flagged': (p: CellClassParams<GridRow>) =>
						p.data?.metric === 'plan' &&
						Boolean(p.data.cells[period]?.isFlagged),
					'pg-partial': (p: CellClassParams<GridRow>) =>
						p.data?.metric === 'actual' &&
						Boolean(p.data.cells[period]?.isPartialActual),
					'pg-muted': (p: CellClassParams<GridRow>) =>
						p.data?.metric === 'projectedRevenue',
					'pg-variance-up': (p: CellClassParams<GridRow>) =>
						p.data?.metric === 'variance' && (p.data.values[period] ?? 0) > 0,
					'pg-variance-down': (p: CellClassParams<GridRow>) =>
						p.data?.metric === 'variance' && (p.data.values[period] ?? 0) < 0,
					'pg-variance-flat': (p: CellClassParams<GridRow>) =>
						p.data?.metric === 'variance' &&
						(p.data.values[period] ?? null) === 0,
					'pg-group-plan': (p: CellClassParams<GridRow>) =>
						Boolean(p.node?.group) && isForecast,
					'pg-group-actual': (p: CellClassParams<GridRow>) =>
						Boolean(p.node?.group) && !isForecast,
				},
			};
		});

		return [
			{
				colId: 'groupKey',
				rowGroup: true,
				hide: true,
				valueGetter: (params: ValueGetterParams<GridRow>) => {
					if (!params.data || params.data.summaryLabel) return null;
					return groupBy === 'channel'
						? params.data.channel
						: label(skuById.get(params.data.skuSettingId));
				},
			},
			{
				colId: 'label',
				headerName: groupBy === 'channel' ? 'Channel / SKU' : 'SKU / Channel',
				pinned: 'left',
				width: 230,
				showRowGroup: true,
				cellRenderer: 'agGroupCellRenderer',
				cellRendererParams: {
					suppressCount: true,
					innerRenderer: (params: {
						node?: IRowNode<GridRow>;
						data?: GridRow;
						value: string;
					}) => {
						if (params.node?.group) {
							const blocks = leavesOf(params.node).length / METRICS.length;
							const noun = groupBy === 'channel' ? 'SKU' : 'channel';
							return (
								<span className='flex items-center gap-2 leading-none'>
									{params.value}
									<span className='text-xs font-normal text-muted-foreground'>
										{blocks} {blocks === 1 ? noun : `${noun}s`}
									</span>
								</span>
							);
						}

						const row = params.data;
						if (!row || row.summaryLabel) return params.value;
						if (!row.isFirstOfSku) return '';

						const series = methodBySeries.get(
							`${row.channel}|${row.skuSettingId}`
						);

						return (
							<div className='flex flex-col justify-center py-1 leading-tight'>
								<span className='truncate font-medium'>{params.value}</span>
								<button
									type='button'
									className='w-fit truncate text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground'
									onClick={() =>
										setMethodSeries({
											channel: row.channel,
											skuSettingId: row.skuSettingId,
										})
									}
								>
									{series
										? FORECAST_METHOD_LABELS[series.method]
										: 'Forecast method'}
								</button>
							</div>
						);
					},
				},
				valueGetter: (params: ValueGetterParams<GridRow>) => {
					if (params.data?.summaryLabel) return params.data.summaryLabel;
					if (!params.data?.isFirstOfSku) return '';
					return groupBy === 'channel'
						? label(skuById.get(params.data.skuSettingId))
						: params.data.channel;
				},
				cellClass: (p) =>
					p.node?.group
						? 'pg-group-label'
						: p.data?.summaryLabel
							? 'pg-summary-label'
							: p.data?.isFirstOfSku
								? 'pg-sku-label'
								: '',
			},
			{
				colId: 'metric',
				headerName: 'Metric',
				pinned: 'left',
				width: 130,
				valueGetter: (params: ValueGetterParams<GridRow>) =>
					!params.data || params.data.summaryLabel
						? ''
						: metricLabel(params.data.metric),
				cellClass: (p) =>
					p.data?.metric === 'plan' ? 'pg-metric pg-metric-plan' : 'pg-metric',
			},
			...monthCols,
			{
				colId: 'total',
				headerName: 'Total',
				pinned: 'right',
				width: 120,
				type: 'numericColumn',
				valueGetter: (params: ValueGetterParams<GridRow>) =>
					params.data?.total ?? null,
				aggFunc: (params: IAggFuncParams<GridRow>) =>
					groupTotalFor(
						leavesOf(params.rowNode),
						grid.periods,
						grid.firstForecastPeriod
					),
				valueFormatter: (params: ValueFormatterParams<GridRow>) =>
					params.node?.group
						? cases(params.value)
						: params.data
							? format(params.data.metric, params.value)
							: '',
				cellClassRules: {
					'pg-total': () => true,
					'pg-variance-up': (p: CellClassParams<GridRow>) =>
						p.data?.metric === 'variance' && (p.data.total ?? 0) > 0,
					'pg-variance-down': (p: CellClassParams<GridRow>) =>
						p.data?.metric === 'variance' && (p.data.total ?? 0) < 0,
					'pg-variance-flat': (p: CellClassParams<GridRow>) =>
						p.data?.metric === 'variance' && (p.data.total ?? null) === 0,
				},
			},
		];
	}, [grid, label, skuById, methodBySeries, groupBy]);

	/** The same columns, minus the grouping — summary rows belong to no channel. */
	const summaryColumnDefs = useMemo<ColDef<GridRow>[]>(
		() => columnDefs.filter((column) => column.colId !== 'groupKey'),
		[columnDefs]
	);

	const summaryRows = useMemo<GridRow[]>(
		() =>
			summary.map((row) => ({
				id: `summary-${row.key}`,
				channel: '',
				skuSettingId: '',
				metric: row.isMoney ? 'projectedRevenue' : 'plan',
				isFirstOfSku: false,
				values: row.values,
				cells: {},
				total: row.total,
				summaryLabel: row.label,
				isEmphasised: row.isEmphasised,
			})),
		[summary]
	);

	/**
	 * Saved when editing finishes, not while typing. An override never moves the
	 * statistical baseline, so the grid can show the result immediately and the
	 * request is pure persistence.
	 */
	const onCellEditingStopped = useCallback(
		(event: {
			data?: GridRow;
			colDef: { colId?: string };
			oldValue: unknown;
			newValue: unknown;
		}) => {
			const period = event.colDef.colId;
			const row = event.data;
			if (!row || !period || row.metric !== 'plan') return;
			if (event.oldValue === event.newValue) return;

			const parsed =
				event.newValue === null || event.newValue === ''
					? null
					: Number(event.newValue);
			if (parsed !== null && !Number.isFinite(parsed)) return;

			const cell = row.cells[period];
			const statistical = cell?.statisticalUnits ?? null;
			const units = parsed === null ? null : Math.max(0, Math.round(parsed));

			// The API refuses a change this far out without a reason, so ask for one
			// here rather than letting the edit fail with a toast and nowhere to go.
			const deviation =
				units !== null && statistical !== null && statistical !== 0
					? Math.abs(units - statistical) / statistical
					: null;

			if (deviation !== null && deviation > plan.requireReasonAbovePct) {
				setOverride({
					channel: row.channel,
					skuSettingId: row.skuSettingId,
					period,
					statistical,
					previous: typeof event.oldValue === 'number' ? event.oldValue : null,
					next: units,
					reason: cell?.overrideReason ?? null,
					note: cell?.overrideNote ?? null,
				});
				return;
			}

			const key = `${row.channel}|${row.skuSettingId}|${period}`;
			setPendingCells((current) => ({ ...current, [key]: 1 }));

			setEntry(
				{
					channel: row.channel as never,
					skuSettingId: row.skuSettingId,
					period,
					units,
				},
				{
					onSettled: () =>
						setPendingCells((current) => {
							const next = { ...current };
							delete next[key];
							return next;
						}),
				}
			);
		},
		[setEntry, plan.requireReasonAbovePct]
	);

	if (isLoading) return <TableSkeleton rows={10} />;
	if (error)
		return <AlertMessage message={error.message} variant='destructive' />;
	if (!grid || grid.series.length === 0) {
		return (
			<AlertMessage
				message='Nothing in scope to plan. Add channels and SKUs from Configure.'
				variant='default'
			/>
		);
	}

	return (
		<div className='flex max-h-[calc(100vh-13rem)] flex-col overflow-hidden rounded-lg border bg-card'>
			<div className='flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2'>
				<p className='text-xs text-muted-foreground'>
					Cases by month. Revenue is gross — before discounts and refunds, which
					a forecast cannot anticipate.
				</p>
				<div className='flex shrink-0 items-center gap-3'>
					{Object.keys(pendingCells).length > 0 && (
						<span className='text-xs text-muted-foreground'>Saving…</span>
					)}
					<SegmentedToggle
						value={groupBy}
						onChange={setGroupBy}
						options={GROUP_OPTIONS}
						ariaLabel='Group by'
						className='w-32'
					/>
				</div>
			</div>

			<OverrideDialog
				plan={plan}
				target={override}
				sku={override ? skuById.get(override.skuSettingId) : undefined}
				onClose={() => setOverride(null)}
			/>

			<ForecastMethodDialog
				plan={plan}
				showComparison
				series={
					methodSeries
						? (methodBySeries.get(
								`${methodSeries.channel}|${methodSeries.skuSettingId}`
							) ?? null)
						: null
				}
				sku={methodSeries ? skuById.get(methodSeries.skuSettingId) : undefined}
				open={!!methodSeries}
				onClose={() => setMethodSeries(null)}
			/>

			<div className='min-h-0 flex-1 overflow-auto'>
				<div className='w-full'>
					<AgGridReact<GridRow>
						domLayout='autoHeight'
						ref={mainGrid}
						alignedGrids={summaryGrids}
						theme={gridTheme}
						// The row order *is* the data — six metrics per SKU, in sequence.
						// Sorting or moving a column would shuffle metrics between SKUs.
						defaultColDef={{
							sortable: false,
							resizable: true,
							suppressHeaderMenuButton: true,
							suppressMovable: true,
						}}
						rowData={rows}
						columnDefs={columnDefs}
						getRowId={(params: GetRowIdParams<GridRow>) => params.data.id}
						groupDisplayType='custom'
						groupDefaultExpanded={1}
						suppressAggFuncInHeader
						onCellEditingStopped={onCellEditingStopped}
						tooltipShowDelay={200}
						suppressMovableColumns
						stopEditingWhenCellsLoseFocus
						getRowHeight={(params) => (params.node.group ? 44 : 38)}
						getRowClass={(params) => {
							if (params.node.rowPinned) {
								return params.data?.isEmphasised
									? 'pg-summary pg-summary-strong'
									: 'pg-summary';
							}
							return params.data?.isFirstOfSku ? 'pg-sku-start' : '';
						}}
					/>
				</div>

				{/* Aligned so it tracks the month columns as the grid scrolls sideways,
			    while sitting in the page flow rather than pinned to the viewport. */}
				<div className='w-full border-t'>
					<AgGridReact<GridRow>
						domLayout='autoHeight'
						ref={summaryGrid}
						alignedGrids={mainGrids}
						theme={gridTheme}
						rowData={summaryRows}
						columnDefs={summaryColumnDefs}
						getRowId={(params: GetRowIdParams<GridRow>) => params.data.id}
						headerHeight={0}
						rowHeight={36}
						defaultColDef={{
							sortable: false,
							resizable: true,
							suppressHeaderMenuButton: true,
							suppressMovable: true,
						}}
						suppressMovableColumns
						getRowClass={(params) =>
							params.data?.isEmphasised
								? 'pg-summary pg-summary-strong'
								: 'pg-summary'
						}
					/>
				</div>
			</div>
		</div>
	);
};

export default PlanGrid;
