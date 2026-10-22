'use client';

import type { SessionsBreakdownRow } from '@repo/types';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@repo/ui/components/table';
import {
	ChevronDown,
	ChevronRight,
	Monitor,
	MonitorSmartphone,
	Smartphone,
	Tablet,
} from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import {
	SegmentedToggle,
	type SegmentedToggleOption,
} from '../general/SegmentedToggle';

interface SessionsBreakdownTableProps {
	data: SessionsBreakdownRow[];
}

type GroupBy = 'device' | 'channel';

const GROUP_OPTIONS: SegmentedToggleOption<GroupBy>[] = [
	{ value: 'device', label: 'Device', title: 'Group by device' },
	{ value: 'channel', label: 'Channel', title: 'Group by referring channel' },
];

const DEVICE_ICON: Record<string, React.ReactNode> = {
	desktop: <Monitor className='size-3.5' />,
	mobile: <Smartphone className='size-3.5' />,
	tablet: <Tablet className='size-3.5' />,
	// Shopify also reports an "other" bucket; anything unrecognised gets the same
	// neutral glyph rather than being mislabelled as a desktop.
	other: <MonitorSmartphone className='size-3.5' />,
};

const formatChannel = (raw: string) =>
	raw === 'unknown' || !raw
		? 'Direct / Unknown'
		: raw
				.split('_')
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
				.join(' ');

const formatDevice = (raw: string) =>
	raw === 'unknown' || !raw
		? 'Unknown'
		: raw.charAt(0).toUpperCase() + raw.slice(1);

const renderDevice = (raw: string) => (
	<span className='flex items-center gap-1.5'>
		{DEVICE_ICON[raw.toLowerCase()] ?? (
			<MonitorSmartphone className='size-3.5' />
		)}
		{formatDevice(raw)}
	</span>
);

interface BreakdownLeaf {
	key: string;
	sessions: number;
	completedCheckouts: number;
}

interface BreakdownGroup extends BreakdownLeaf {
	children: BreakdownLeaf[];
}

/**
 * Rolls the flat channel × device rows up under whichever dimension is selected,
 * keeping the other one as the expandable detail. The payload already covers the
 * dashboard's date range, so switching the grouping is a regroup, never a refetch.
 */
const groupRows = (
	rows: SessionsBreakdownRow[],
	groupBy: GroupBy
): BreakdownGroup[] => {
	const groups = new Map<string, BreakdownGroup>();

	for (const row of rows) {
		const [parentKey, childKey] =
			groupBy === 'device'
				? [row.deviceType, row.referringChannel]
				: [row.referringChannel, row.deviceType];

		let group = groups.get(parentKey);
		if (!group) {
			group = {
				key: parentKey,
				sessions: 0,
				completedCheckouts: 0,
				children: [],
			};
			groups.set(parentKey, group);
		}

		group.sessions += row.sessions;
		group.completedCheckouts += row.completedCheckouts;
		// The API groups by (channel, device), so each pair appears at most once and
		// children never need merging.
		group.children.push({
			key: childKey,
			sessions: row.sessions,
			completedCheckouts: row.completedCheckouts,
		});
	}

	const bySessionsDesc = (a: BreakdownLeaf, b: BreakdownLeaf) =>
		b.sessions - a.sessions;

	const result = [...groups.values()].sort(bySessionsDesc);
	for (const group of result) group.children.sort(bySessionsDesc);
	return result;
};

export const SessionsBreakdownTableSkeleton = () => (
	<div className='rounded-xl border bg-card p-5 space-y-3'>
		<div className='h-4 w-48 animate-pulse rounded bg-muted' />
		<div className='space-y-2'>
			{Array.from({ length: 5 }).map((_, i) => (
				<div key={i} className='h-8 w-full animate-pulse rounded bg-muted' />
			))}
		</div>
	</div>
);

const SessionsBreakdownTable = ({ data }: SessionsBreakdownTableProps) => {
	const [groupBy, setGroupBy] = useState<GroupBy>('device');
	const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

	const groups = useMemo(() => groupRows(data, groupBy), [data, groupBy]);

	// Keys mean different things per grouping, so a stale open row would expand
	// something unrelated after the toggle.
	const handleGroupChange = (next: GroupBy) => {
		setGroupBy(next);
		setOpenKeys(new Set());
	};

	const toggleRow = (key: string) =>
		setOpenKeys((prev) => {
			const next = new Set(prev);
			if (!next.delete(key)) next.add(key);
			return next;
		});

	return (
		<div className='rounded-xl border bg-card p-5 space-y-4'>
			<div className='flex items-center justify-between gap-4'>
				<p className='text-sm font-semibold'>
					Sessions by Channel &amp; Device
				</p>
				<SegmentedToggle
					value={groupBy}
					onChange={handleGroupChange}
					options={GROUP_OPTIONS}
					ariaLabel='Group sessions by'
					className='w-32'
				/>
			</div>

			<div className='max-h-72 overflow-y-auto'>
				{groups.length === 0 ? (
					<p className='py-4 text-center text-sm text-muted-foreground'>
						No session data for this period.
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{groupBy === 'device' ? 'Device' : 'Referring Channel'}
								</TableHead>
								<TableHead className='text-right'>Sessions</TableHead>
								<TableHead className='text-right'>Checkouts</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{groups.map((group) => {
								const isOpen = openKeys.has(group.key);
								const Chevron = isOpen ? ChevronDown : ChevronRight;

								return (
									<Fragment key={group.key}>
										<TableRow
											role='button'
											tabIndex={0}
											aria-expanded={isOpen}
											onClick={() => toggleRow(group.key)}
											onKeyDown={(event) => {
												if (event.key !== 'Enter' && event.key !== ' ') return;
												event.preventDefault();
												toggleRow(group.key);
											}}
											className='cursor-pointer'
										>
											<TableCell className='font-medium'>
												<span className='flex items-center gap-1.5'>
													<Chevron className='size-3.5 shrink-0 text-muted-foreground' />
													{groupBy === 'device'
														? renderDevice(group.key)
														: formatChannel(group.key)}
												</span>
											</TableCell>
											<TableCell className='text-right tabular-nums'>
												{group.sessions.toLocaleString()}
											</TableCell>
											<TableCell className='text-right tabular-nums'>
												{group.completedCheckouts.toLocaleString()}
											</TableCell>
										</TableRow>

										{isOpen &&
											group.children.map((child) => (
												<TableRow
													key={child.key}
													className='bg-muted/30 hover:bg-muted/30'
												>
													<TableCell className='py-1.5 pl-9 text-muted-foreground'>
														{groupBy === 'device'
															? formatChannel(child.key)
															: renderDevice(child.key)}
													</TableCell>
													<TableCell className='py-1.5 text-right tabular-nums text-muted-foreground'>
														{child.sessions.toLocaleString()}
													</TableCell>
													<TableCell className='py-1.5 text-right tabular-nums text-muted-foreground'>
														{child.completedCheckouts.toLocaleString()}
													</TableCell>
												</TableRow>
											))}
									</Fragment>
								);
							})}
						</TableBody>
					</Table>
				)}
			</div>
		</div>
	);
};

export default SessionsBreakdownTable;
