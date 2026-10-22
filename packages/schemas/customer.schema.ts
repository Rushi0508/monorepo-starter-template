import { z } from 'zod';

export const CreateCustomerSchema = z.object({
	firstName: z.string().trim().min(1, 'First name is required'),
	lastName: z.string().trim().min(1, 'Last name is required'),
	email: z.email('Enter a valid email').optional().or(z.literal('')),
	phone: z.string().trim().optional(),
	company: z.string().trim().optional(),
	address1: z.string().trim().min(1, 'Street address is required'),
	address2: z.string().trim().optional(),
	city: z.string().trim().min(1, 'City is required'),
	provinceCode: z.string().trim().min(1, 'State is required'),
	zip: z.string().trim().min(1, 'ZIP is required'),
	note: z.string().trim().optional(),
});
