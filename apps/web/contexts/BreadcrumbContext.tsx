'use client';

import React, {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react';

interface BreadcrumbSegment {
	segment: string;
	name: string;
}

interface BreadcrumbContextType {
	segments: BreadcrumbSegment[];
	registerSegment: (segment: string, name: string) => void;
	unregisterSegment: (segment: string) => void;
	clearSegments: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
	undefined
);

interface BreadcrumbProviderProps {
	children: ReactNode;
}

export function BreadcrumbProvider({ children }: BreadcrumbProviderProps) {
	const [segments, setSegments] = useState<BreadcrumbSegment[]>([]);

	const registerSegment = useCallback((segment: string, name: string) => {
		setSegments((prev) => {
			const existing = prev.find((s) => s.segment === segment);
			if (existing) {
				return prev.map((s) => (s.segment === segment ? { segment, name } : s));
			}
			return [...prev, { segment, name }];
		});
	}, []);

	const unregisterSegment = useCallback((segment: string) => {
		setSegments((prev) => prev.filter((s) => s.segment !== segment));
	}, []);

	const clearSegments = useCallback(() => {
		setSegments([]);
	}, []);

	const contextValue = useMemo(
		() => ({
			segments,
			registerSegment,
			unregisterSegment,
			clearSegments,
		}),
		[segments, registerSegment, unregisterSegment, clearSegments]
	);

	return (
		<BreadcrumbContext.Provider value={contextValue}>
			{children}
		</BreadcrumbContext.Provider>
	);
}

export function useBreadcrumb() {
	const context = useContext(BreadcrumbContext);
	if (context === undefined) {
		throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
	}
	return context;
}

/**
 * Hook to register a breadcrumb segment name
 * @param segment - The URL segment (e.g., customer ID)
 * @param name - The display name (e.g., customer name)
 */
export function useBreadcrumbSegment(segment: string, name: string) {
	const { registerSegment, unregisterSegment } = useBreadcrumb();

	React.useEffect(() => {
		if (segment && name) {
			registerSegment(segment, name);
			return () => unregisterSegment(segment);
		}
	}, [segment, name, registerSegment, unregisterSegment]);
}
