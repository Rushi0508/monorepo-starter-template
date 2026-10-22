import { isValidPhoneNumber } from 'react-phone-number-input';
import { z } from 'zod';

export const PhoneNumberSchema = z
	.string()
	.trim()
	.min(1, 'Phone number is required')
	.refine((val) => isValidPhoneNumber(val), {
		message: 'Please enter a valid phone number',
	});

export const OptionalPhoneNumberSchema = z.preprocess(
	(value) => {
		if (value === null || value === undefined) return undefined;
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (trimmed === '') return undefined;
			return trimmed.replaceAll(/[\s-]/g, '');
		}
		return value;
	},
	z
		.string()
		.trim()
		.refine((val) => isValidPhoneNumber(val), {
			message: 'Please enter a valid phone number',
		})
		.optional()
);

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
		if (typeof value === 'string') {
			const normalized = value.trim().toLowerCase();
			return (
				normalized === 'true' || normalized === '1' || normalized === 'yes'
			);
		}
		return Boolean(value);
	});

export const numberCoerce = (min: number = 0) =>
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

export const RequiredDateSchema = z.string().refine(
	(val) => {
		if (!val) return false;

		const date = new Date(val);
		return !Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(val);
	},
	{
		message: 'Please enter a valid date',
	}
);

export const JsonSchema = z.any();
export const NumberSchema = z.number().nullable();
