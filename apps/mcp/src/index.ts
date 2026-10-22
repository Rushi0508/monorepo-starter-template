#!/usr/bin/env node
import 'dotenv/config';

/**
 * Sauero MCP Server — remote, Streamable HTTP transport.
 *
 * Auth is MCP OAuth via Better Auth (1.6). Clients send Authorization: Bearer
 * on each request. The MCP server validates the token with Nest
 * (`/api/auth/mcp/get-session`), then forwards the same bearer to Sauero APIs
 * — no OTP tools and no shared disk token.
 *
 * Required env:
 *   SAUERO_API_URL      – Sauero REST API base URL
 *   MCP_AUTH_API_URL    – Auth API base URL (issuer / get-session host)
 *   MCP_PUBLIC_URL      – Public MCP URL (OAuth resource / audience)
 *
 * Optional env:
 *   MCP_PORT            – HTTP port (default 3002)
 */

import { randomUUID } from 'node:crypto';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express, { type Request, type Response } from 'express';
import { SaueroApiClient } from './api-client.js';
import { createMcpServer } from './server-factory.js';

function getRequiredEnv(name: string): string {
	const val = process.env[name];
	if (!val) {
		console.error(`[sauero-mcp] Missing required env: ${name}`);
		process.exit(1);
	}
	return val;
}

const apiUrl = getRequiredEnv('SAUERO_API_URL');
const mcpAuthApiUrl = getRequiredEnv('MCP_AUTH_API_URL').replace(/\/$/, '');
const mcpPublicUrl = getRequiredEnv('MCP_PUBLIC_URL');
const port = Number(process.env['MCP_PORT'] ?? 3002);
const mcpOrigin = new URL(mcpPublicUrl).origin;
const authApiBase = `${mcpAuthApiUrl}/api/auth`;
const GET_SESSION_TIMEOUT_MS = 10_000;
const SESSION_IDLE_MS = 60 * 60 * 1000;
const SESSION_SWEEP_MS = 5 * 60 * 1000;
const MAX_SESSIONS = 500;

async function proxyAuthDiscovery(
	res: Response,
	targetPath: string
): Promise<void> {
	try {
		const upstream = await fetch(`${authApiBase}${targetPath}`, {
			method: 'GET',
			headers: { Accept: 'application/json' },
			signal: AbortSignal.timeout(GET_SESSION_TIMEOUT_MS),
		});
		const contentType = upstream.headers.get('content-type');
		if (contentType) {
			res.setHeader('Content-Type', contentType);
		}
		res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
	} catch (err) {
		console.error(
			`[sauero-mcp] Discovery proxy failed for ${targetPath}:`,
			err
		);
		res.status(502).json({ error: 'Auth discovery proxy failed' });
	}
}

type SessionEntry = {
	transport: StreamableHTTPServerTransport;
	server: McpServer;
	client: SaueroApiClient;
	userId: string;
	lastSeen: number;
};

const sessions = new Map<string, SessionEntry>();

function touchSession(entry: SessionEntry): void {
	entry.lastSeen = Date.now();
}

function evictSession(id: string, reason: 'idle' | 'capacity'): void {
	const entry = sessions.get(id);
	if (!entry) return;
	sessions.delete(id);
	void entry.transport.close().catch((err: unknown) => {
		console.error(`[sauero-mcp] Error closing session ${id}:`, err);
	});
	console.error(`[sauero-mcp] Session evicted (${reason}): ${id}`);
}

function ensureSessionCapacity(): void {
	while (sessions.size >= MAX_SESSIONS) {
		let oldestId: string | undefined;
		let oldestSeen = Number.POSITIVE_INFINITY;
		for (const [id, entry] of sessions) {
			if (entry.lastSeen < oldestSeen) {
				oldestSeen = entry.lastSeen;
				oldestId = id;
			}
		}
		if (!oldestId) break;
		evictSession(oldestId, 'capacity');
	}
}

const sessionSweepTimer = setInterval(() => {
	const now = Date.now();
	for (const [id, entry] of [...sessions.entries()]) {
		if (now - entry.lastSeen > SESSION_IDLE_MS) {
			evictSession(id, 'idle');
		}
	}
}, SESSION_SWEEP_MS);
sessionSweepTimer.unref();

type McpOAuthSession = {
	userId?: string | null;
	accessTokenExpiresAt?: string;
};

type ResolveUserResult =
	| { kind: 'ok'; userId: string }
	| { kind: 'unauthorized' }
	| { kind: 'error'; message: string };

async function resolveMcpUserId(
	authorization: string | undefined
): Promise<ResolveUserResult> {
	if (!authorization?.toLowerCase().startsWith('bearer ')) {
		return { kind: 'unauthorized' };
	}

	let response: globalThis.Response;
	try {
		response = await fetch(`${mcpAuthApiUrl}/api/auth/mcp/get-session`, {
			method: 'GET',
			headers: { Authorization: authorization },
			signal: AbortSignal.timeout(GET_SESSION_TIMEOUT_MS),
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[sauero-mcp] get-session request failed:', message);
		return {
			kind: 'error',
			message: 'Failed to validate authentication token',
		};
	}

	if (response.status === 401 || response.status === 403) {
		return { kind: 'unauthorized' };
	}

	if (!response.ok) {
		console.error(`[sauero-mcp] get-session returned HTTP ${response.status}`);
		return {
			kind: 'error',
			message: `Auth service unavailable (HTTP ${response.status})`,
		};
	}

	let data: McpOAuthSession | null;
	try {
		data = (await response.json()) as McpOAuthSession | null;
	} catch (err) {
		console.error('[sauero-mcp] get-session invalid JSON:', err);
		return { kind: 'error', message: 'Invalid auth service response' };
	}

	if (!data?.userId) {
		return { kind: 'unauthorized' };
	}

	if (data.accessTokenExpiresAt) {
		const expiresAt = new Date(data.accessTokenExpiresAt);
		if (Number.isFinite(expiresAt.getTime()) && expiresAt < new Date()) {
			return { kind: 'unauthorized' };
		}
	}

	return { kind: 'ok', userId: data.userId };
}

function unauthorized(res: Response): void {
	const wwwAuthenticate = `Bearer resource_metadata="${mcpOrigin}/.well-known/oauth-protected-resource"`;
	res.setHeader('WWW-Authenticate', wwwAuthenticate);
	res.setHeader(
		'Access-Control-Expose-Headers',
		'WWW-Authenticate, mcp-session-id'
	);
	res.status(401).json({
		jsonrpc: '2.0',
		error: {
			code: -32000,
			message: 'Unauthorized: Authentication required',
			'www-authenticate': wwwAuthenticate,
		},
		id: null,
	});
}

function authServiceError(res: Response, message: string): void {
	res.status(503).json({
		jsonrpc: '2.0',
		error: {
			code: -32000,
			message,
		},
		id: null,
	});
}

const app = express();
app.use(express.json());

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Content-Type, Authorization, mcp-session-id, mcp-protocol-version'
	);
	res.setHeader(
		'Access-Control-Expose-Headers',
		'mcp-session-id, WWW-Authenticate'
	);
	if (req.method === 'OPTIONS') {
		res.sendStatus(204);
		return;
	}
	next();
});

function sessionIdFromRequest(req: Request): string | undefined {
	const raw = req.headers['mcp-session-id'];
	if (typeof raw === 'string' && raw.length > 0) return raw;
	return undefined;
}

function authorizationFromRequest(req: Request): string | undefined {
	const raw = req.headers.authorization;
	return typeof raw === 'string' ? raw : undefined;
}

app.post('/mcp', async (req: Request, res: Response) => {
	const sessionId = sessionIdFromRequest(req);

	try {
		const authResult = await resolveMcpUserId(authorizationFromRequest(req));
		if (authResult.kind === 'unauthorized') {
			unauthorized(res);
			return;
		}
		if (authResult.kind === 'error') {
			authServiceError(res, authResult.message);
			return;
		}
		const { userId } = authResult;
		const authorization = authorizationFromRequest(req);

		const existing = sessionId ? sessions.get(sessionId) : undefined;
		if (existing) {
			if (existing.userId !== userId) {
				unauthorized(res);
				return;
			}
			if (authorization) {
				existing.client.setAuthorization(authorization);
			}
			touchSession(existing);
			await existing.transport.handleRequest(req, res, req.body);
			return;
		}

		if (!sessionId && isInitializeRequest(req.body)) {
			if (!authorization) {
				unauthorized(res);
				return;
			}
			const client = new SaueroApiClient(apiUrl);
			client.setAuthorization(authorization);
			const server = createMcpServer(client);

			const transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: () => randomUUID(),
				onsessioninitialized: (id) => {
					ensureSessionCapacity();
					sessions.set(id, {
						transport,
						server,
						client,
						userId,
						lastSeen: Date.now(),
					});
					console.error(`[sauero-mcp] Session initialized: ${id}`);
				},
				onsessionclosed: (id) => {
					sessions.delete(id);
					console.error(`[sauero-mcp] Session closed: ${id}`);
				},
			});

			transport.onclose = () => {
				const sid = transport.sessionId;
				if (sid && sessions.has(sid)) {
					sessions.delete(sid);
					console.error(`[sauero-mcp] Transport closed for session ${sid}`);
				}
			};

			await server.connect(transport);
			await transport.handleRequest(req, res, req.body);
			return;
		}

		res.status(400).json({
			jsonrpc: '2.0',
			error: {
				code: -32000,
				message: 'Bad Request: No valid session ID provided',
			},
			id: null,
		});
	} catch (err) {
		console.error('[sauero-mcp] Request error:', err);
		if (!res.headersSent) {
			res.status(500).json({
				jsonrpc: '2.0',
				error: { code: -32603, message: 'Internal server error' },
				id: null,
			});
		}
	}
});

app.get('/mcp', async (req: Request, res: Response) => {
	const authResult = await resolveMcpUserId(authorizationFromRequest(req));
	if (authResult.kind === 'unauthorized') {
		unauthorized(res);
		return;
	}
	if (authResult.kind === 'error') {
		authServiceError(res, authResult.message);
		return;
	}
	const { userId } = authResult;
	const authorization = authorizationFromRequest(req);

	const sessionId = sessionIdFromRequest(req);
	const entry = sessionId ? sessions.get(sessionId) : undefined;
	if (!entry) {
		res.status(400).send('Invalid or missing session ID');
		return;
	}
	if (entry.userId !== userId) {
		unauthorized(res);
		return;
	}
	if (authorization) {
		entry.client.setAuthorization(authorization);
	}
	touchSession(entry);
	await entry.transport.handleRequest(req, res);
});

app.delete('/mcp', async (req: Request, res: Response) => {
	const authResult = await resolveMcpUserId(authorizationFromRequest(req));
	if (authResult.kind === 'unauthorized') {
		unauthorized(res);
		return;
	}
	if (authResult.kind === 'error') {
		authServiceError(res, authResult.message);
		return;
	}
	const { userId } = authResult;
	const authorization = authorizationFromRequest(req);

	const sessionId = sessionIdFromRequest(req);
	const entry = sessionId ? sessions.get(sessionId) : undefined;
	if (!entry) {
		res.status(400).send('Invalid or missing session ID');
		return;
	}
	if (entry.userId !== userId) {
		unauthorized(res);
		return;
	}
	if (authorization) {
		entry.client.setAuthorization(authorization);
	}
	touchSession(entry);
	try {
		await entry.transport.handleRequest(req, res);
	} catch (err) {
		console.error('[sauero-mcp] Session termination error:', err);
		if (!res.headersSent) {
			res.status(500).send('Error processing session termination');
		}
	}
});

app.get('/health', (_req, res) =>
	res.json({ status: 'ok', resource: mcpPublicUrl })
);

app.get(
	'/.well-known/oauth-authorization-server',
	(_req, res) =>
		void proxyAuthDiscovery(res, '/.well-known/oauth-authorization-server')
);
app.get(
	'/.well-known/openid-configuration',
	(_req, res) =>
		void proxyAuthDiscovery(res, '/.well-known/oauth-authorization-server')
);
app.get(
	'/.well-known/oauth-protected-resource',
	(_req, res) =>
		void proxyAuthDiscovery(res, '/.well-known/oauth-protected-resource')
);

process.on('uncaughtException', (err) =>
	console.error('[sauero-mcp] Uncaught exception:', err)
);
process.on('unhandledRejection', (r) =>
	console.error('[sauero-mcp] Unhandled rejection:', r)
);

const httpServer = app.listen(port, () => {
	console.error(`[sauero-mcp] Streamable HTTP server listening on :${port}`);
	console.error(`[sauero-mcp] MCP endpoint: http://0.0.0.0:${port}/mcp`);
	console.error(`[sauero-mcp] Resource: ${mcpPublicUrl}`);
});

httpServer.on('error', (err: NodeJS.ErrnoException) => {
	console.error(
		err.code === 'EADDRINUSE'
			? `[sauero-mcp] Port ${port} already in use — set MCP_PORT to another port`
			: `[sauero-mcp] Server error: ${String(err)}`
	);
});
