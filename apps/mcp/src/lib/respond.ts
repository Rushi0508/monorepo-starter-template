import { compactJson } from './shape.js';

export type McpTextResult = {
	content: [{ type: 'text'; text: string }];
	isError?: boolean;
};

/**
 * Serialize a tool result. Deliberately not pretty-printed — indentation on a
 * large payload is pure token cost with no benefit to the model. Nulls and
 * empty arrays are stripped on the way out.
 */
export function respondSuccess(data: unknown): McpTextResult {
	return {
		content: [
			{ type: 'text' as const, text: JSON.stringify(compactJson(data)) },
		],
	};
}

export function respondError(message: string): McpTextResult {
	return {
		isError: true,
		content: [{ type: 'text' as const, text: `Error: ${message}` }],
	};
}
