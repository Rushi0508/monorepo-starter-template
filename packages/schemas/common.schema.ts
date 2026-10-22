import { z } from 'zod';

export const StringSchema = z.string().trim();

export const EmailSchema = z
	.email('Invalid email address')
	.trim()
	.toLowerCase()
	.min(1, 'Email is required');

export const OptionalEmailSchema = z.preprocess((value) => {
	if (value === null || value === undefined) return undefined;
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed === '' ? undefined : trimmed;
	}
	return value;
}, z.email('Invalid email address').trim().toLowerCase().optional());

export const booleanCoerce = z
	.union([z.boolean(), z.number(), z.string()])
	.transform((value): boolean => {
		if (typeof value === 'boolean') return value;
		if (typeof value === 'number') return value === 1;
		const normalized = value.trim().toLowerCase();
		return normalized === 'true' || normalized === '1' || normalized === 'yes';
	});

export const numberCoerce = (min = 0) =>
	z
		.union([z.number(), z.string()])
		.transform((value): number => {
			if (typeof value === 'number') return value;
			const parsed = Number(value);
			return Number.isNaN(parsed) ? 0 : parsed;
		})
		.pipe(z.number().min(min, `${min} is the minimum value`));

export const DateSchema = z
	.string()
	.refine((val) => val === '' || !Number.isNaN(Date.parse(val)), {
		message: 'Please enter a valid date',
	});
