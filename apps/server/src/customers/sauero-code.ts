import { customAlphabet } from 'nanoid';

const alphabet = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6);

export function generateSaueroCode(): string {
	return `sb-${alphabet()}`;
}
