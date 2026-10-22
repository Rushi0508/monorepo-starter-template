const EMAIL_IFRAME_CSP =
	"default-src 'none'; img-src https: http: data: cid:; style-src 'unsafe-inline' https:; font-src https: data:;";

const EMAIL_IFRAME_HEAD = `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${EMAIL_IFRAME_CSP}"><base target="_blank" rel="noopener noreferrer"><style>body{margin:0;padding:12px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.5;color:#111827;background:#fff;word-break:break-word;}img{max-width:100%;height:auto;}a{color:#2563eb;}</style>`;

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function looksLikeHtml(value: string): boolean {
	const trimmed = value.trim();
	return (
		/^<!DOCTYPE\s+html/i.test(trimmed) ||
		/^<html[\s>]/i.test(trimmed) ||
		/<\/[a-z][^>]*>/i.test(trimmed) ||
		/<(div|table|p|br|span|h[1-6]|img|a|strong|em|ul|ol|li|style)[\s>/]/i.test(
			trimmed
		)
	);
}

/** Build a full HTML document suitable for iframe srcDoc (CSP + base target). */
export function buildEmailIframeDocument(raw: string): string {
	const html = looksLikeHtml(raw)
		? raw.trim()
		: `<pre style="margin:0;white-space:pre-wrap;font-family:inherit;">${escapeHtml(raw)}</pre>`;

	if (/<html[\s>]/i.test(html)) {
		if (/<head[\s>]/i.test(html)) {
			return html.replace(/<head([^>]*)>/i, `<head$1>${EMAIL_IFRAME_HEAD}`);
		}
		return html.replace(
			/<html([^>]*)>/i,
			`<html$1><head>${EMAIL_IFRAME_HEAD}</head>`
		);
	}

	return `<!DOCTYPE html><html><head>${EMAIL_IFRAME_HEAD}</head><body>${html}</body></html>`;
}
