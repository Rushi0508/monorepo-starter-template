import type React from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AuthProvider } from '@/contexts/AuthContext';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<AuthProvider>
			<AppSidebar>
				<div className='overflow-y-auto h-[calc(100dvh-61px)] px-6 py-4'>
					{children}
				</div>
			</AppSidebar>
		</AuthProvider>
	);
};

export default MainLayout;
