'use client';

import { InboundEmailTypeEnum } from '@repo/enums';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@repo/ui/components/tabs';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/general/PageHeader';
import InboundEmailList from './InboundEmailList';

const TABS = [
	{ value: 'pod', label: 'POD', type: InboundEmailTypeEnum.POD },
	{ value: 'pickup', label: 'Pickup', type: InboundEmailTypeEnum.PICKUP },
] as const;

const InboundEmailsComponent = () => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const tab =
		TABS.find((t) => t.value === searchParams.get('tab'))?.value ?? 'pod';

	const changeTab = (value: string) => {
		router.replace(`${pathname}?tab=${value}`, { scroll: false });
	};

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Inbound Emails'
				description='Emails received on the connected Gmail inbox. The Gmail connection is managed on the Configuration page.'
			/>

			<Tabs value={tab} onValueChange={changeTab} className='gap-4'>
				<TabsList>
					{TABS.map((t) => (
						<TabsTrigger key={t.value} value={t.value} className='px-4'>
							{t.label}
						</TabsTrigger>
					))}
				</TabsList>

				{TABS.map((t) => (
					<TabsContent key={t.value} value={t.value}>
						<InboundEmailList type={t.type} />
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
};

export default InboundEmailsComponent;
