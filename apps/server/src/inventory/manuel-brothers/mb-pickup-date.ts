/** Pickup location for MB replenishment / iDrive prep. */
export const MB_PICKUP_ADDRESS =
	'iDrive Fulfillment, 12795 W. Northern Avenue, Building 2, Glendale, AZ 85307';

const WEEKDAY_TO_DOW: Record<string, number> = {
	Sun: 0,
	Mon: 1,
	Tue: 2,
	Wed: 3,
	Thu: 4,
	Fri: 5,
	Sat: 6,
};

/**
 * MB cadence (America/Phoenix):
 * - Enter BlueBox by Thursday → prep Friday → pallet ready Monday morning
 * - Created Mon–Thu → following Monday
 * - Created Fri–Sun (missed Thu cutoff) → Monday after next
 */
export function calculateMbPickupDate(from: Date = new Date()): Date {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: 'America/Phoenix',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		weekday: 'short',
	}).formatToParts(from);

	const year = Number(parts.find((p) => p.type === 'year')?.value);
	const month = Number(parts.find((p) => p.type === 'month')?.value);
	const day = Number(parts.find((p) => p.type === 'day')?.value);
	const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
	const dow = WEEKDAY_TO_DOW[weekday] ?? 1;

	let daysUntilPickupMonday: number;
	if (dow >= 1 && dow <= 4) {
		// Mon→7, Tue→6, Wed→5, Thu→4
		daysUntilPickupMonday = (8 - dow) % 7 || 7;
	} else {
		// Fri→10, Sat→9, Sun→8
		const toNextMonday = dow === 0 ? 1 : (8 - dow) % 7;
		daysUntilPickupMonday = toNextMonday + 7;
	}

	// Calendar date in Phoenix (no DST); store as UTC noon to keep the date stable
	const pickup = new Date(
		Date.UTC(year, month - 1, day + daysUntilPickupMonday, 12, 0, 0)
	);
	return pickup;
}

export function formatMbPickupDate(date: Date): string {
	return new Intl.DateTimeFormat('en-US', {
		timeZone: 'UTC',
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	}).format(date);
}
