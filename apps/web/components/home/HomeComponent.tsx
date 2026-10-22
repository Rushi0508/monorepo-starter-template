'use client';

import { ComingSoon } from '@/components/general/ComingSoon';
import { PageHeader } from '@/components/general/PageHeader';
import { useAuth } from '@/contexts/AuthContext';

const getGreeting = () => {
	const hour = new Date().getHours();
	if (hour < 12) return 'Good morning';
	if (hour < 18) return 'Good afternoon';
	return 'Good evening';
};

const HomeComponent = () => {
	const user = useAuth();

	return (
		<div className='space-y-6'>
			<PageHeader
				title={`${getGreeting()}, ${user.name.split(' ')[0]}`}
				description='Your dashboard will live here.'
			/>
			<ComingSoon upcoming='Add your first widgets to this page.' />
		</div>
	);
};

export default HomeComponent;
