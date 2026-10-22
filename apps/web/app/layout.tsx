import type { Metadata } from 'next';
import { Suspense } from 'react';
import Providers from '@/app/providers';
import { googleSans, sourceSerif } from '@/lib/fonts';
import GlobalLoading from './loading';
import '@repo/ui/globals.css';
import { ReactQueryClientProvider } from '@/lib/tanstack-query';

export const metadata: Metadata = {
	title: 'Sauero',
	description: 'Sauero',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' className={sourceSerif.variable} suppressHydrationWarning>
			<body className={`${googleSans.className} antialiased overflow-hidden`}>
				<ReactQueryClientProvider>
					<Suspense fallback={<GlobalLoading />}>
						<Providers>{children}</Providers>
					</Suspense>
				</ReactQueryClientProvider>
			</body>
		</html>
	);
}
