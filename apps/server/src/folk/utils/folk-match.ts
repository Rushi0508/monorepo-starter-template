export type MatchCandidateAddress = {
	address1: string | null;
	city: string | null;
	zip: string | null;
};

export type MatchCandidate = {
	id: string;
	displayName: string;
	/** Business names off the customer's addresses, not the addresses themselves. */
	companyNames: string[];
	addresses: MatchCandidateAddress[];
};

const MATCH_THRESHOLD = 0.55;
const NAME_WEIGHT = 0.7;
const ADDRESS_WEIGHT = 0.3;

const LEGAL_SUFFIXES = new Set([
	'inc',
	'llc',
	'llp',
	'ltd',
	'plc',
	'co',
	'corp',
	'corporation',
	'company',
	'the',
]);

const ZIP = /\b(\d{5})(?:-\d{4})?\b/;
const LEADING_NUMBER = /^\s*(\d+)/;

function normalize(value: string): string {
	return value
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

function tokenize(value: string): string[] {
	return normalize(value)
		.split(' ')
		.filter((token) => token && !LEGAL_SUFFIXES.has(token));
}

function levenshtein(a: string, b: string): number {
	if (a === b) return 0;
	if (!a.length) return b.length;
	if (!b.length) return a.length;

	const row = Array.from({ length: b.length + 1 }, (_, i) => i);
	for (let i = 1; i <= a.length; i += 1) {
		let prev = row[0];
		row[0] = i;
		for (let j = 1; j <= b.length; j += 1) {
			const current = row[j];
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
			prev = current;
		}
	}
	return row[b.length];
}

function editScore(a: string, b: string): number {
	if (!a || !b) return 0;
	if (a === b) return 1;
	return Math.max(0, 1 - levenshtein(a, b) / Math.max(a.length, b.length));
}

/** Dice over token sets: order-independent and tolerant of extra words. */
function tokenScore(left: string[], right: string[]): number {
	if (!left.length || !right.length) return 0;
	const a = new Set(left);
	const b = new Set(right);
	let shared = 0;
	for (const token of a) if (b.has(token)) shared += 1;
	return (2 * shared) / (a.size + b.size);
}

export function nameSimilarity(left: string, right: string): number {
	const a = tokenize(left);
	const b = tokenize(right);
	if (!a.length || !b.length) return 0;

	const joinedA = a.join(' ');
	const joinedB = b.join(' ');
	if (joinedA === joinedB) return 1;

	// Token overlap catches reordering and extra words; edit distance catches typos.
	return Math.max(tokenScore(a, b), editScore(joinedA, joinedB));
}

function zipOf(value: string): string | null {
	return ZIP.exec(value)?.[1] ?? null;
}

function streetNumberOf(value: string): string | null {
	return LEADING_NUMBER.exec(value.trim())?.[1] ?? null;
}

function cityOf(folkAddress: string): string | null {
	const parts = folkAddress.split(',').map((part) => part.trim());
	return parts.length >= 2 ? (parts[1] ?? null) : null;
}

/**
 * Weighted by how much each part narrows things down: two branches of the same
 * chain share a city and often a zip, so the street number is what separates
 * them. Returns null when neither side has anything comparable.
 */
function addressAffinity(
	folkAddress: string,
	candidate: MatchCandidateAddress
): number | null {
	let earned = 0;
	let possible = 0;

	const folkZip = zipOf(folkAddress);
	const candidateZip = candidate.zip ? zipOf(candidate.zip) : null;
	if (folkZip && candidateZip) {
		possible += 0.4;
		if (folkZip === candidateZip) earned += 0.4;
	}

	const folkStreet = streetNumberOf(folkAddress);
	const candidateStreet = candidate.address1
		? streetNumberOf(candidate.address1)
		: null;
	if (folkStreet && candidateStreet) {
		possible += 0.45;
		if (folkStreet === candidateStreet) earned += 0.45;
	}

	const folkCity = cityOf(folkAddress);
	if (folkCity && candidate.city) {
		possible += 0.15;
		if (normalize(folkCity) === normalize(candidate.city)) earned += 0.15;
	}

	return possible === 0 ? null : earned / possible;
}

function bestAddressAffinity(
	folkAddresses: string[],
	candidateAddresses: MatchCandidateAddress[]
): number | null {
	let best: number | null = null;

	for (const folkAddress of folkAddresses) {
		for (const candidate of candidateAddresses) {
			const affinity = addressAffinity(folkAddress, candidate);
			if (affinity !== null && (best === null || affinity > best)) {
				best = affinity;
			}
		}
	}

	return best;
}

export type ProposedMatch = { customerId: string; score: number };

export function proposeCustomer(
	folkCompanyName: string,
	folkAddresses: string[] | undefined,
	candidates: MatchCandidate[]
): ProposedMatch | null {
	let best: ProposedMatch | null = null;

	for (const candidate of candidates) {
		const nameScore = Math.max(
			nameSimilarity(folkCompanyName, candidate.displayName),
			...candidate.companyNames.map((companyName) =>
				nameSimilarity(folkCompanyName, companyName)
			),
			0
		);
		if (nameScore === 0) continue;

		const addressScore = bestAddressAffinity(
			folkAddresses ?? [],
			candidate.addresses
		);

		// Address only participates when both sides have something to compare, so a
		// customer without an address is not penalised for it.
		const score =
			addressScore === null
				? nameScore
				: nameScore * NAME_WEIGHT + addressScore * ADDRESS_WEIGHT;

		if (!best || score > best.score) {
			best = { customerId: candidate.id, score };
		}
	}

	return best && best.score >= MATCH_THRESHOLD ? best : null;
}
