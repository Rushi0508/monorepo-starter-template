export function formatMoney(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(Math.abs(value) < 0.5 ? 0 : value);
}

export function formatPrice(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

export function formatNumber(value: number): string {
	return Math.round(value).toLocaleString();
}

export function formatPercent(value: number, digits = 1): string {
	return `${(value * 100).toFixed(digits)}%`;
}

export function formatSignedPercent(value: number, digits = 1): string {
	return `${value > 0 ? '+' : ''}${(value * 100).toFixed(digits)}%`;
}

export function formatSignedNumber(value: number): string {
	return `${value > 0 ? '+' : ''}${Math.round(value).toLocaleString()}`;
}

export function accuracyToneClass(accuracyPct: number): string {
	if (accuracyPct >= 0.9) return 'text-emerald-600 dark:text-emerald-400';
	if (accuracyPct >= 0.75) return 'text-amber-600 dark:text-amber-400';
	return 'text-red-600 dark:text-red-400';
}

export function missToneClass(variance: number): string {
	if (variance === 0) return 'text-muted-foreground';
	return variance > 0
		? 'text-emerald-600 dark:text-emerald-400'
		: 'text-red-600 dark:text-red-400';
}
