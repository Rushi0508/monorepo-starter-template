'use client';
import { SidebarProvider } from '@repo/ui/components/sidebar';
import { Toaster } from '@repo/ui/components/sonner';
import { ThemeProvider } from '@repo/ui/components/theme-provider';
import { TooltipProvider } from '@repo/ui/components/tooltip';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BreadcrumbProvider } from '@/contexts/BreadcrumbContext';
import { poppins } from '@/lib/fonts';

const Providers = ({ children }: { children: React.ReactNode }) => {
	return (
		<SidebarProvider>
			<ThemeProvider
				attribute='class'
				forcedTheme='light'
				disableTransitionOnChange
			>
				<BreadcrumbProvider>
					<Toaster
						duration={2500}
						richColors
						closeButton
						position='top-right'
						style={{ fontFamily: poppins.style.fontFamily }}
					/>
					<TooltipProvider>{children}</TooltipProvider>
					{process.env.NODE_ENV === 'development' && (
						<ReactQueryDevtools initialIsOpen={false} />
					)}
				</BreadcrumbProvider>
			</ThemeProvider>
		</SidebarProvider>
	);
};

export default Providers;
