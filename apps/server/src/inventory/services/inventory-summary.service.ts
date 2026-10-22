import { Injectable } from '@nestjs/common';
import type {
	GetInventorySummaryResponseType,
	InventoryBreakdownRow,
} from '@repo/types';
import { formatDayKeyInTimeZone } from '@repo/utils';
import { SkuCostService } from 'src/sku/sku-cost.service';
import { BlueboxInventoryService } from '../bluebox/bb-inventory.service';
import { InventorySummaryQueryDto } from '../dto/inventory-summary-query.dto';
import { CommonInventoryService } from './common.service';

const LOCATIONS = ['BlueBox', 'Manuel Brothers'] as const;
type Location = (typeof LOCATIONS)[number];

/** One SKU's stock at one location */
type Cell = {
	sku: string;
	title: string;
	location: Location;
	onHand: number;
	available: number;
	committed: number;
	value: number | null;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

const sumCells = (
	key: string,
	label: string,
	cells: Cell[],
	totalValue: number
): InventoryBreakdownRow => {
	const valued = cells.filter((cell) => cell.value != null);
	const value = valued.length
		? r2(valued.reduce((acc, cell) => acc + (cell.value ?? 0), 0))
		: null;
	return {
		key,
		label,
		onHand: cells.reduce((acc, cell) => acc + cell.onHand, 0),
		available: cells.reduce((acc, cell) => acc + cell.available, 0),
		committed: cells.reduce((acc, cell) => acc + cell.committed, 0),
		value,
		valueShare:
			value != null && totalValue > 0
				? Math.round((value / totalValue) * 10000) / 100
				: null,
	};
};

/** Sources can disagree on SKU casing; SKU settings are matched the same way */
const groupBySku = (cells: Cell[]): Cell[][] => {
	const groups = new Map<string, Cell[]>();
	for (const cell of cells) {
		const key = cell.sku.trim().toLowerCase();
		groups.set(key, [...(groups.get(key) ?? []), cell]);
	}
	return [...groups.values()];
};

const byValueDesc = (a: InventoryBreakdownRow, b: InventoryBreakdownRow) =>
	(b.value ?? -1) - (a.value ?? -1) || a.key.localeCompare(b.key);

@Injectable()
export class InventorySummaryService {
	constructor(
		private readonly bbInventoryService: BlueboxInventoryService,
		private readonly commonInventoryService: CommonInventoryService,
		private readonly skuCostService: SkuCostService
	) {}

	/** Stock across BlueBox and Manuel Brothers, valued at today's COGS */
	async getSummary(
		query: InventorySummaryQueryDto,
		timeZone: string
	): Promise<GetInventorySummaryResponseType> {
		const { breakdownBy = 'sku' } = query;

		const [bluebox, manuelBrothers] = await Promise.all([
			this.bbInventoryService.getInventory(),
			this.commonInventoryService.getLocationInventory('manuel-brothers'),
		]);

		const raw: Omit<Cell, 'value'>[] = [
			...bluebox.data.map((row) => ({
				sku: row.sku,
				title: row.description ?? row.sku,
				location: 'BlueBox' as const,
				onHand: row.onHand,
				available: row.available,
				committed: row.committed,
			})),
			...manuelBrothers.map((row) => ({
				sku: row.sku,
				title: row.description ?? row.sku,
				location: 'Manuel Brothers' as const,
				onHand: row.onHand,
				available: row.available,
				committed: row.committed,
			})),
		];

		const lookup = await this.skuCostService.loadLookup(
			raw.map((cell) => cell.sku)
		);
		const today = formatDayKeyInTimeZone(new Date(), timeZone);

		const cells: Cell[] = raw.map((cell) => {
			const cogs = lookup.cogs(cell.sku, today);
			return { ...cell, value: cogs ? cell.onHand * cogs.amount : null };
		});

		const totals = {
			onHand: cells.reduce((acc, cell) => acc + cell.onHand, 0),
			available: cells.reduce((acc, cell) => acc + cell.available, 0),
			committed: cells.reduce((acc, cell) => acc + cell.committed, 0),
			value: r2(cells.reduce((acc, cell) => acc + (cell.value ?? 0), 0)),
		};

		const breakdown =
			breakdownBy === 'sku'
				? this.buildSkuBreakdown(cells, totals.value)
				: this.buildLocationBreakdown(cells, totals.value);

		return { totals, breakdownBy, breakdown };
	}

	/** One row per SKU, expanding into its locations */
	private buildSkuBreakdown(cells: Cell[], totalValue: number) {
		return groupBySku(cells)
			.map((skuCells) => {
				const [first] = skuCells as [Cell];
				return {
					...sumCells(first.sku, first.title, skuCells, totalValue),
					children: LOCATIONS.flatMap((location) => {
						const here = skuCells.filter((cell) => cell.location === location);
						return here.length
							? [sumCells(location, location, here, totalValue)]
							: [];
					}),
				};
			})
			.sort(byValueDesc);
	}

	/** One row per location, expanding into its SKUs */
	private buildLocationBreakdown(cells: Cell[], totalValue: number) {
		return LOCATIONS.map((location) => {
			const here = cells.filter((cell) => cell.location === location);
			return {
				...sumCells(location, location, here, totalValue),
				children: groupBySku(here)
					.map((skuCells) => {
						const [first] = skuCells as [Cell];
						return sumCells(first.sku, first.title, skuCells, totalValue);
					})
					.sort(byValueDesc),
			};
		});
	}
}
