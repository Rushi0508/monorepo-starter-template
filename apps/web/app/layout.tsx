import type { Metadata } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import { Suspense } from 'react';
import '@repo/ui/globals.css';
import { cn } from '@repo/ui/lib/utils';
import GlobalLoading from './loading';
import Providers from './providers';

const fontSans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const fontMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
	title: 'Starter',
	description: 'Next.js + NestJS monorepo starter',
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html
			lang='en'
			suppressHydrationWarning
			className={cn(
				'antialiased font-sans',
				fontSans.variable,
				fontMono.variable
			)}
		>
			<body>
				<Providers>
					<Suspense fallback={<GlobalLoading />}>{children}</Suspense>
				</Providers>
			</body>
		</html>
	);
}
