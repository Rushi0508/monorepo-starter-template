'use client';

import { ReactNode } from 'react';
import { useBreadcrumbSegment } from '@/contexts/BreadcrumbContext';

interface BreadcrumbSegmentProviderProps {
	segment: string;
	name: string;
	children: ReactNode;
}

/**
 * Provider component that registers a breadcrumb segment name
 * Usage: Wrap your page content with this component to register dynamic breadcrumb names
 */
export function BreadcrumbSegmentProvider({
	segment,
	name,
	children,
}: BreadcrumbSegmentProviderProps) {
	useBreadcrumbSegment(segment, name);
	return <>{children}</>;
}
