import { Google_Sans, Source_Serif_4 } from 'next/font/google';

export const googleSans = Google_Sans({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
	display: 'swap',
	variable: '--font-sans',
});

export const sourceSerif = Source_Serif_4({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-heading-family',
});
