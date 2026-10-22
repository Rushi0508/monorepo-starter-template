function toCsv(rows: (string | number | null)[][]): string {
	return rows
		.map((row) =>
			row
				.map((cell) => {
					const value = cell === null || cell === undefined ? '' : String(cell);
					return /[",\n]/.test(value)
						? `"${value.replaceAll('"', '""')}"`
						: value;
				})
				.join(',')
		)
		.join('\n');
}

export function downloadCsv(
	rows: (string | number | null)[][],
	filename: string
) {
	const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

export function downloadCsvFromHeaders(
	headers: readonly string[],
	filename: string
) {
	downloadCsv([[...headers]], filename);
}
