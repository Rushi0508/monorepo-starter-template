import { SidebarInset } from '@repo/ui/components/sidebar';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocExportMenu } from '@/components/docs/DocExportMenu';
import { DocMeta } from '@/components/docs/DocMeta';
import { DocsTopBar } from '@/components/docs/DocsTopBar';
import { GuideIndex } from '@/components/docs/GuideIndex';
import { GuideMarkdown } from '@/components/docs/GuideMarkdown';
import { GuidePager } from '@/components/docs/GuidePager';
import { GuideToc } from '@/components/docs/GuideToc';
import { ScrollToHash } from '@/components/docs/ScrollToHash';
import { TrainingVideosLink } from '@/components/docs/TrainingVideosLink';
import {
	getDocLinkIndex,
	getDocNav,
	getDocNeighbours,
	getDocPage,
	getDocPages,
} from '@/lib/docs/source';

type DocPageProps = { params: Promise<{ slug?: string[] }> };

/** Bakes every doc into a static page at build time. */
export function generateStaticParams() {
	// The empty slug is the docs root, which renders a generated index of the
	// sections rather than a doc of its own.
	return [
		{ slug: [] as string[] },
		...getDocPages().map(({ slug }) => ({ slug })),
	];
}

/** A slug outside the generated set is a 404, not an on-demand filesystem read. */
export const dynamicParams = false;

export async function generateMetadata({
	params,
}: DocPageProps): Promise<Metadata> {
	const { slug = [] } = await params;
	const doc = getDocPage(slug);

	if (!doc) return { title: slug.length ? 'Docs' : 'Help Center · Sauero' };

	return { title: `${doc.title} · Docs`, description: doc.description };
}

const DocPage = async ({ params }: DocPageProps) => {
	const { slug = [] } = await params;
	const doc = getDocPage(slug);

	if (!doc && slug.length) notFound();

	// The sidebar and the header bar use the short label; the page itself keeps
	// the document's own, often longer, H1.
	const title = doc?.title ?? 'Help Center';
	const heading = doc?.heading ?? 'Help Center';
	const { previous, next } = getDocNeighbours(doc?.href ?? '');

	return (
		<SidebarInset className='h-dvh overflow-hidden'>
			<DocsTopBar title={title} />

			{/* The page scrolls here, not on the body, so smooth anchor jumps for
			    the table of contents are configured on this element. */}
			<div className='flex-1 overflow-y-auto overscroll-contain motion-safe:scroll-smooth'>
				<div className='mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 pt-6 pb-4 lg:grid-cols-[minmax(0,1fr)_14rem] lg:px-8'>
					<article className='min-w-0 max-w-3xl'>
						<header className='mb-4 border-b pb-4'>
							<div className='flex flex-wrap items-start justify-between gap-x-6 gap-y-1'>
								<h1 className='font-heading text-3xl leading-none'>
									{heading}
								</h1>
								{doc && (
									<div className='flex shrink-0 items-center gap-1'>
										<DocMeta frontmatter={doc.frontmatter} />
										<DocExportMenu slug={doc.slug} />
									</div>
								)}
							</div>
							{doc?.description && (
								<p className='mt-1 text-base leading-7 text-muted-foreground'>
									{doc.description}
								</p>
							)}
							{!doc && (
								<p className='mt-1 text-base leading-7 text-muted-foreground'>
									Training videos, how Sauero works, what it can and cannot do,
									and the processes it runs.
								</p>
							)}
						</header>

						{doc ? (
							<>
								<GuideMarkdown
									document={doc.document}
									linkIndex={getDocLinkIndex()}
									// Links inside a doc are relative to the folder it lives in.
									fromDir={doc.sourcePath.split('/').slice(0, -1)}
								/>
								<GuidePager previous={previous} next={next} />
								<ScrollToHash />
							</>
						) : (
							<>
								<TrainingVideosLink />
								<GuideIndex nav={getDocNav()} />
							</>
						)}
					</article>

					<aside className='sticky top-4 hidden h-fit lg:block'>
						{doc && <GuideToc headings={doc.headings} />}
					</aside>
				</div>
			</div>
		</SidebarInset>
	);
};

export default DocPage;
