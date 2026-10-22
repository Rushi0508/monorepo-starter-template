'use client';

import { useEffect } from 'react';

/**
 * Lands a link like /docs/business/calculations#costs on its section. The
 * browser tries that jump on load, but the docs render only once the auth check
 * finishes, so the heading does not exist yet and the jump is lost. This runs
 * when the doc mounts and makes it again.
 */
export function ScrollToHash() {
	useEffect(() => {
		const id = decodeURIComponent(window.location.hash.slice(1));
		if (!id) return;

		document
			.getElementById(id)
			?.scrollIntoView({ block: 'start', behavior: 'instant' });
	}, []);

	return null;
}
