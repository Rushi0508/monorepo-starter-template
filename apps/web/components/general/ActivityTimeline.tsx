'use client';

import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Searchbar from '@/components/Searchbar';

/**
 * The activity feed used by every audit-log sheet.
 *
 * Each entry is one sentence that already names its actor, so the line beneath
 * carries only the time. Recent entries read as "Today" / "Yesterday" because
 * that is how people talk about a change they made an hour ago.
 *
 * A long trail reads like a transcript, so it searches like one: every hit is
 * highlighted in place and the controls step through them, rather than
 * filtering the list down and losing the surrounding order.
 */

export type ActivityItem = {
	id: string;
	/** A full sentence, e.g. "Rushi Gandhi finalized the plan". */
	activity: string;
	/**
	 * When it happened. Callers pass whichever field they sort by — a coalesced
	 * edit is stamped when it last changed, not when it was first made.
	 */
	at: Date | string;
};

export const formatActivityTime = (value: Date | string): string => {
	const date = new Date(value);
	if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
	if (isYesterday(date)) return `Yesterday, ${format(date, 'h:mm a')}`;
	return format(date, 'd MMM yyyy, h:mm a');
};

type Segment = { text: string; isMatch: boolean };

/**
 * Splits a sentence around every case-insensitive hit.
 *
 * Deliberately indexOf rather than a regex: the needle is whatever was typed,
 * so a stray "(" would otherwise throw.
 */
function splitByMatch(text: string, needle: string): Segment[] {
	if (!needle) return [{ text, isMatch: false }];

	const haystack = text.toLowerCase();
	const target = needle.toLowerCase();
	const segments: Segment[] = [];
	let cursor = 0;

	while (cursor < text.length) {
		const found = haystack.indexOf(target, cursor);
		if (found === -1) {
			segments.push({ text: text.slice(cursor), isMatch: false });
			break;
		}
		if (found > cursor) {
			segments.push({ text: text.slice(cursor, found), isMatch: false });
		}
		segments.push({
			text: text.slice(found, found + target.length),
			isMatch: true,
		});
		cursor = found + target.length;
	}

	return segments;
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
	const [query, setQuery] = useState('');
	const [active, setActive] = useState(0);
	const matchRefs = useRef<(HTMLElement | null)[]>([]);

	const needle = query.trim();

	// Each row carries where its hits start in the overall count, so a highlight
	// knows its own position without the render loop keeping a counter.
	const { rows, total } = useMemo(() => {
		let offset = 0;
		const built = items.map((item) => {
			const segments = splitByMatch(item.activity, needle);
			const start = offset;
			offset += segments.filter((segment) => segment.isMatch).length;
			return { item, segments, start };
		});
		return { rows: built, total: offset };
	}, [items, needle]);

	useEffect(() => setActive(0), []);

	useEffect(() => {
		matchRefs.current[active]?.scrollIntoView({
			block: 'nearest',
			behavior: 'smooth',
		});
	}, [active]);

	const step = (delta: number) => {
		if (total === 0) return;
		// Wraps, so stepping past the last hit returns to the first.
		setActive((current) => (current + delta + total) % total);
	};

	return (
		<div className='space-y-2 pb-1'>
			{/* Sticks to the top of whichever sheet is scrolling, so stepping to a
			    hit further down does not scroll the controls out of reach. The
			    negative margin lets the background bleed past the parent's padding,
			    so entries do not show through at the edges. */}
			<div className='sticky top-0 z-10 -mx-4 flex items-center gap-1 border-b bg-background px-4 py-2'>
				<div className='flex-1'>
					<Searchbar
						value={query}
						onChange={(value) => {
							setQuery(value);
							setActive(0);
						}}
						onKeyDown={(event) => {
							if (event.key !== 'Enter') return;
							event.preventDefault();
							step(event.shiftKey ? -1 : 1);
						}}
						placeholder='Search activity'
						inputClassName='h-8 max-w-none text-xs'
					/>
				</div>

				{needle !== '' && (
					<span className='shrink-0 text-[11px] tabular-nums text-muted-foreground'>
						{total === 0 ? 'None' : `${active + 1}/${total}`}
					</span>
				)}

				<Button
					type='button'
					variant='ghost'
					size='icon'
					className='size-8 shrink-0 text-muted-foreground'
					aria-label='Previous match'
					disabled={total === 0}
					onClick={() => step(-1)}
				>
					<ChevronUp className='size-4' />
				</Button>
				<Button
					type='button'
					variant='ghost'
					size='icon'
					className='size-8 shrink-0 text-muted-foreground'
					aria-label='Next match'
					disabled={total === 0}
					onClick={() => step(1)}
				>
					<ChevronDown className='size-4' />
				</Button>
				{needle !== '' && (
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='size-8 shrink-0 text-muted-foreground'
						aria-label='Clear search'
						onClick={() => {
							setQuery('');
							setActive(0);
						}}
					>
						<X className='size-4' />
					</Button>
				)}
			</div>

			<ol className='space-y-0'>
				{rows.map(({ item, segments, start }) => {
					let matchIndex = start;

					return (
						<li key={item.id} className='relative border-l pb-4 pl-4 last:pb-0'>
							{/* Sits on the border line itself, so the rail reads as continuous. */}
							<span className='absolute left-[-4.5px] top-1.5 size-2 rounded-full bg-border' />
							<p className='text-sm'>
								{segments.map((segment, index) => {
									if (!segment.isMatch) {
										return <span key={index}>{segment.text}</span>;
									}

									const position = matchIndex++;
									const isActive = position === active;

									return (
										<mark
											key={index}
											ref={(node) => {
												matchRefs.current[position] = node;
											}}
											className={cn(
												// Clears the sticky search bar when scrolled to.
												'scroll-mt-14 rounded-sm px-0.5',
												isActive
													? 'bg-amber-300 text-foreground dark:bg-amber-500/70'
													: 'bg-amber-200/60 text-foreground dark:bg-amber-500/30'
											)}
										>
											{segment.text}
										</mark>
									);
								})}
							</p>
							<p className='mt-0.5 text-xs text-muted-foreground'>
								{formatActivityTime(item.at)}
							</p>
						</li>
					);
				})}
			</ol>
		</div>
	);
}

export default ActivityTimeline;
