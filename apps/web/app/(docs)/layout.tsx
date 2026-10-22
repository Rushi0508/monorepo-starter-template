import type React from 'react';
import { GuideSidebar } from '@/components/docs/GuideSidebar';
import { AuthProvider } from '@/contexts/AuthContext';
import { getDocNav } from '@/lib/docs/source';
import './guide.css';

/**
 * Docs shell. The docs get their own sidebar — the doc tree, not the app nav —
 * so they read as a guide rather than another screen of the product.
 *
 * Still behind AuthProvider: the docs describe internal details, which are
 * not public. AuthProvider is a client boundary, but the tree below it is
 * server-rendered and passed through as children, so the pages stay static.
 *
 * SidebarProvider already wraps the whole app in app/providers.tsx, so this
 * layout supplies only the sidebar itself.
 */
const DocsLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<AuthProvider>
			<GuideSidebar nav={getDocNav()} />
			{children}
		</AuthProvider>
	);
};

export default DocsLayout;
