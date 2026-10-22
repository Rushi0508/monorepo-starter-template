'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardTitle } from '@repo/ui/components/card';
import { ArrowRight, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/general/PageHeader';

interface RootLayoutForNestedRouteProps {
	title: string;
	description: string;
	sections: {
		title: string;
		description: string;
		href: string;
		icon: LucideIcon;
	}[];
	/** Rendered below the section cards */
	children?: ReactNode;
}

export function RootLayoutForNestedRoute({
	title,
	description,
	sections,
	children,
}: RootLayoutForNestedRouteProps) {
	const pathname = usePathname();
	return (
		<div className='space-y-6'>
			<PageHeader title={title} description={description} />
			<div className='grid gap-4 md:grid-cols-2'>
				{sections.map((section) => {
					const Icon = section.icon;
					return (
						<Card key={section.title} className='shadow-xs'>
							<CardContent>
								<div className='flex flex-row items-center justify-between pb-4'>
									<CardTitle className='text-lg font-medium'>
										{section.title}
									</CardTitle>
									<Icon className='text-muted-foreground h-6 w-6' />
								</div>
								<p className='text-muted-foreground mb-3 text-sm'>
									{section.description}
								</p>
								<Button asChild variant='outline' size='sm' className='mt-1'>
									<Link href={`${pathname}${section.href}`}>
										Go to {section.title}
										<ArrowRight className='h-4 w-4' />
									</Link>
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</div>
			{children}
		</div>
	);
}
