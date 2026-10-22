import type { z } from 'zod';
import type { SaueroApiClient } from '../api-client.js';

export type ToolDef = {
	name: string;
	description: string;
	inputSchema: z.ZodObject<z.ZodRawShape>;
	/** Returns plain JSON. Serialization and null-stripping happen in respond.ts. */
	handler: (
		client: SaueroApiClient,
		input: Record<string, unknown>
	) => Promise<unknown>;
};
