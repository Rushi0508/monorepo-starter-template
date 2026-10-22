'use client';

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	defaultFilter,
} from '@repo/ui/components/command';
import { FileText, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Fragment, type ReactNode, useMemo, useState } from 'react';
import { APP_ROUTES } from '@/config/routes';
import { matchesAllTerms, searchDocs } from '@/lib/docs/search';
import { useDocSearchIndex, useTrainingVideos } from '@/queries';

interface NavSearchPaletteProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const MAX_VIDEO_RESULTS = 5;

/** Action items open a dialog rather than a route, so they are left out. */
const ROUTE_SECTIONS = Object.entries(APP_ROUTES).map(
	([section, items]) =>
		[
			section,
			items.filter(
				(item): item is typeof item & { href: string } => !!item.href
			),
		] as const
);

const NavSearchPalette = ({ open, onOpenChange }: NavSearchPaletteProps) => {
	const router = useRouter();
	const [search, setSearch] = useState('');
	const query = search.trim();

	const { data: docIndex } = useDocSearchIndex(open);
	const { data: videos } = useTrainingVideos({ enabled: open });

	// Filtering is done here rather than by cmdk so docs and videos can match
	// on body text and show why they matched. Routes still go through cmdk's
	// own scorer, so they rank exactly as they did before docs were added.
	const routeSections = useMemo(() => {
		if (!query) return ROUTE_SECTIONS;
		return ROUTE_SECTIONS.map(
			([section, items]) =>
				[
					section,
					items
						.map((item) => ({ item, score: defaultFilter(item.name, query) }))
						.filter(({ score }) => score > 0)
						.sort((a, b) => b.score - a.score)
						.map(({ item }) => item),
				] as const
		).filter(([, items]) => items.length);
	}, [query]);

	const docResults = useMemo(
		() => (docIndex ? searchDocs(docIndex, query) : []),
		[docIndex, query]
	);

	const videoResults = useMemo(() => {
		if (!videos || query.length < 2) return [];
		const terms = query.toLowerCase().split(/\s+/);
		return videos
			.filter((video) =>
				matchesAllTerms(`${video.title} ${video.description ?? ''}`, terms)
			)
			.slice(0, MAX_VIDEO_RESULTS);
	}, [videos, query]);

	const handleOpenChange = (next: boolean) => {
		if (!next) setSearch('');
		onOpenChange(next);
	};

	const handleSelect = (href: string) => {
		handleOpenChange(false);
		router.push(href);
	};

	const groups: { key: string; node: ReactNode }[] = routeSections.map(
		([section, items]) => ({
			key: section,
			node: (
				<CommandGroup heading={section}>
					{items.map((item) => (
						<CommandItem
							key={item.href}
							value={`route:${item.href}`}
							onSelect={() => handleSelect(item.href)}
							className='gap-3 py-2.5 text-sm'
						>
							<item.icon className='size-4 shrink-0 text-muted-foreground' />
							{item.name}
						</CommandItem>
					))}
				</CommandGroup>
			),
		})
	);

	if (docResults.length) {
		groups.push({
			key: 'docs',
			node: (
				<CommandGroup heading='Documentation'>
					{docResults.map((doc) => (
						<CommandItem
							key={doc.href}
							value={`doc:${doc.href}`}
							onSelect={() => handleSelect(doc.href)}
							className='items-start gap-3 py-2.5 text-sm'
						>
							<FileText className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
							<div className='min-w-0'>
								<p className='truncate'>{doc.title}</p>
								<p className='truncate text-xs text-muted-foreground'>
									{doc.context}
								</p>
								{doc.snippet && (
									<p className='mt-0.5 line-clamp-2 text-xs text-muted-foreground'>
										{doc.snippet}
									</p>
								)}
							</div>
						</CommandItem>
					))}
				</CommandGroup>
			),
		});
	}

	if (videoResults.length) {
		groups.push({
			key: 'videos',
			node: (
				<CommandGroup heading='Training videos'>
					{videoResults.map((video) => (
						<CommandItem
							key={video.id}
							value={`video:${video.id}`}
							onSelect={() => handleSelect(`/docs/videos?video=${video.id}`)}
							className='items-start gap-3 py-2.5 text-sm'
						>
							<PlayCircle className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
							<div className='min-w-0'>
								<p className='truncate'>{video.title}</p>
								{video.description && (
									<p className='line-clamp-1 text-xs text-muted-foreground'>
										{video.description}
									</p>
								)}
							</div>
						</CommandItem>
					))}
				</CommandGroup>
			),
		});
	}

	return (
		<CommandDialog
			open={open}
			onOpenChange={handleOpenChange}
			title='Search'
			description='Search pages, documentation and training videos'
			showCloseButton={false}
			shouldFilter={false}
			className='max-w-lg'
		>
			<CommandInput
				placeholder='Search pages, docs, training videos…'
				value={search}
				onValueChange={setSearch}
			/>
			<CommandList className='max-h-96'>
				<CommandEmpty>No results found.</CommandEmpty>
				{groups.map((group, index) => (
					<Fragment key={group.key}>
						{group.node}
						{index < groups.length - 1 && <CommandSeparator className='mb-2' />}
					</Fragment>
				))}
			</CommandList>
		</CommandDialog>
	);
};

export default NavSearchPalette;
