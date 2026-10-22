'use client';

import { Toaster } from '@repo/ui/components/sonner';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ReactQueryClientProvider } from '@/lib/tanstack-query';

const Providers = ({ children }: { children: React.ReactNode }) => (
	<ReactQueryClientProvider>
		<ThemeProvider>
			{children}
			<Toaster richColors closeButton position='top-right' />
			{process.env.NODE_ENV === 'development' && (
				<ReactQueryDevtools initialIsOpen={false} />
			)}
		</ThemeProvider>
	</ReactQueryClientProvider>
);

export default Providers;
