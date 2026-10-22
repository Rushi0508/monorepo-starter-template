import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: '../../apps/server/.env', quiet: true });

export default defineConfig({
	datasource: {
		url: process.env.DATABASE_URL!,
	},
});
