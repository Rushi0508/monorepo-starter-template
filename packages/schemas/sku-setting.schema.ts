import { z } from 'zod';
import { StringSchema } from './common.schema';

export const CreateSkuSettingSchema = z.object({
	sku: StringSchema.min(1, 'SKU is required'),
	title: StringSchema.min(1, 'Title is required'),
});
