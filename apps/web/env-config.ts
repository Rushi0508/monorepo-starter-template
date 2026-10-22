export const envConfig = {
	appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
	apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
	betterAuthUrl: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || '',
	mcpUrl: process.env.NEXT_PUBLIC_MCP_URL || 'http://localhost:3002/mcp',
};
