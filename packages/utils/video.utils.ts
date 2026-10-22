const LOOM_PATH = /^\/(?:share|embed)\/([a-zA-Z0-9]+)\/?$/;
const TELLA_PATH = /^\/video\/([a-zA-Z0-9-]+)(?:\/(?:view|embed))?\/?$/;

/**
 * Turns a pasted Loom or Tella link into the URL their player serves inside an
 * iframe. Returns null for anything else, which is how callers tell whether a
 * link is supported.
 */
export const toVideoEmbedUrl = (url: string): string | null => {
	let parsed: URL;
	try {
		parsed = new URL(url.trim());
	} catch {
		return null;
	}
	if (parsed.protocol !== 'https:') return null;

	const host = parsed.hostname.replace(/^www\./, '');

	if (host === 'loom.com') {
		const id = LOOM_PATH.exec(parsed.pathname)?.[1];
		return id ? `https://www.loom.com/embed/${id}` : null;
	}

	if (host === 'tella.tv') {
		const id = TELLA_PATH.exec(parsed.pathname)?.[1];
		return id ? `https://www.tella.tv/video/${id}/embed` : null;
	}

	return null;
};
