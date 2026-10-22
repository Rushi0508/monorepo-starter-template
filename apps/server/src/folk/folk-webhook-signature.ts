import { createHmac, timingSafeEqual } from 'node:crypto';

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

export type FolkSignatureCheck =
	| { valid: true }
	| {
			valid: false;
			reason: 'malformed-timestamp' | 'stale-timestamp' | 'signature-mismatch';
			expected?: string;
	  };

function decodeWebhookSecret(secret: string): Buffer {
	const trimmed = secret.trim();
	const withoutPrefix = trimmed.startsWith('whsec_')
		? trimmed.slice('whsec_'.length)
		: trimmed;
	return Buffer.from(withoutPrefix, 'base64');
}

export function verifyFolkWebhookSignature(params: {
	rawBody: Buffer;
	webhookId: string;
	webhookTimestamp: string;
	webhookSignature: string;
	secret: string;
}): FolkSignatureCheck {
	const timestamp = Number.parseInt(params.webhookTimestamp, 10);
	if (!Number.isFinite(timestamp)) {
		return { valid: false, reason: 'malformed-timestamp' };
	}

	const nowSeconds = Math.floor(Date.now() / 1000);
	if (Math.abs(nowSeconds - timestamp) > TIMESTAMP_TOLERANCE_SECONDS) {
		return { valid: false, reason: 'stale-timestamp' };
	}

	const signedContent = Buffer.concat([
		Buffer.from(`${params.webhookId}.${params.webhookTimestamp}.`, 'utf8'),
		params.rawBody,
	]);
	const expected = createHmac('sha256', decodeWebhookSecret(params.secret))
		.update(signedContent)
		.digest();

	const candidates = params.webhookSignature.split(' ').flatMap((part) => {
		const [version, value] = part.split(',', 2);
		if (version !== 'v1' || !value) return [];
		return [value];
	});

	const matched = candidates.some((candidate) => {
		try {
			const actual = Buffer.from(candidate, 'base64');
			return (
				actual.length === expected.length && timingSafeEqual(actual, expected)
			);
		} catch {
			return false;
		}
	});

	return matched
		? { valid: true }
		: {
				valid: false,
				reason: 'signature-mismatch',
				expected: `v1,${expected.toString('base64')}`,
			};
}
