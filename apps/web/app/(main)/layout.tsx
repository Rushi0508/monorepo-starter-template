import { AppHeader } from '@/components/layout/AppHeader';
import { AuthProvider } from '@/contexts/AuthContext';

const MainLayout = ({ children }: { children: React.ReactNode }) => (
	<AuthProvider>
		<AppHeader />
		<main className='mx-auto w-full max-w-6xl px-4 py-6'>{children}</main>
	</AuthProvider>
);

export default MainLayout;
