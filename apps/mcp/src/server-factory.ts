import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SaueroApiClient } from './api-client.js';
import { respondError, respondSuccess } from './lib/respond.js';
import { tools } from './tools/index.js';

/**
 * Creates a fresh McpServer bound to a dedicated SaueroApiClient instance.
 * Called once per MCP HTTP session; user identity is set from the OAuth bearer.
 */
export function createMcpServer(client: SaueroApiClient): McpServer {
	const server = new McpServer({ name: 'sauero', version: '0.1.0' });

	for (const tool of tools) {
		server.registerTool(
			tool.name,
			{
				description: tool.description,
				inputSchema: tool.inputSchema.shape,
			},
			async (input) => {
				try {
					const result = await tool.handler(
						client,
						input as Record<string, unknown>
					);
					return respondSuccess(result);
				} catch (err: unknown) {
					const message = err instanceof Error ? err.message : String(err);
					return respondError(message);
				}
			}
		);
	}

	return server;
}
