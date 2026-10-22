import type { Metadata } from 'next';
import { Google_Sans, Source_Serif_4 } from 'next/font/google';
import { Suspense } from 'react';
import '@repo/ui/globals.css';
import { cn } from '@repo/ui/lib/utils';
import GlobalLoading from './loading';
import Providers from './providers';

const fontSans = Google_Sans({ subsets: ['latin'], variable: '--font-sans' });
const fontHeading = Source_Serif_4({
	subsets: ['latin'],
	variable: '--font-heading-family',
});

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
				fontHeading.variable
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
