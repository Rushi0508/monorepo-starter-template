'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

export type DialogSearchParam = { param: string; value: string };

/**
 * Keeps a dialog's open state in sync with a search-param deep link
 * (e.g. `?mcp=connect`) without the two sides fighting.
 *
 * The first entry is canonical — it is the one written to the URL. Any extra
 * entries only open the dialog, which keeps older links such as `?skill=add`
 * working after two dialogs were merged into one.
 */
export function useDialogSearchParam(opts: {
	params: DialogSearchParam[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { params, open, onOpenChange } = opts;
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const canonical = params[0];
	const isParamOpen = params.some(
		({ param, value }) => searchParams.get(param) === value
	);

	const syncUrl = useCallback(
		(next: boolean) => {
			if (!canonical) return;
			const query = new URLSearchParams(searchParams.toString());

			// Drop every alias so the URL settles on one representation.
			for (const { param } of params) query.delete(param);
			if (next) query.set(canonical.param, canonical.value);

			const search = query.toString();
			router.replace(search ? `${pathname}?${search}` : pathname, {
				scroll: false,
			});
		},
		[searchParams, pathname, router, params, canonical]
	);

	// State and URL are kept in step through a single ref, so whichever side
	// changes first wins and the other effect sees no work left to do.
	const synced = useRef(open);

	useEffect(() => {
		if (open === synced.current) return;
		synced.current = open;
		syncUrl(open);
	}, [open, syncUrl]);

	useEffect(() => {
		if (isParamOpen === synced.current) return;
		synced.current = isParamOpen;
		onOpenChange(isParamOpen);
	}, [isParamOpen, onOpenChange]);
}
