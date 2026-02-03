

import { z } from 'zod';

export const githubUsernameSchema = z
	.string()
	.min(1, 'GitHub username is required')
	.max(39, 'GitHub username cannot exceed 39 characters')
	.regex(
		/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/,
		'Invalid GitHub username format'
	)
	.transform((val) => val.toLowerCase().trim());

export const telegramChannelSchema = z
	.string()
	.min(1, 'Telegram channel is required')
	.max(32, 'Telegram channel username cannot exceed 32 characters')
	.regex(
		/^@?[a-zA-Z0-9_]{5,32}$/,
		'Invalid Telegram channel format (must be 5-32 alphanumeric characters)'
	)
	.transform((val) => {
		const cleaned = val.trim().toLowerCase();
		return cleaned.startsWith('@') ? cleaned.slice(1) : cleaned;
	});

export const registerSchema = z.object({
	githubUsername: githubUsernameSchema,
	telegramChannel: telegramChannelSchema
});

export const paginationSchema = z.object({
	page: z
		.string()
		.optional()
		.transform((val) => (val ? parseInt(val, 10) : 1))
		.refine((val) => val >= 1, 'Page must be at least 1'),
	pageSize: z
		.string()
		.optional()
		.transform((val) => (val ? parseInt(val, 10) : 12))
		.refine((val) => val >= 1 && val <= 100, 'Page size must be between 1 and 100')
});

export const similarsQuerySchema = z.object({
	username: githubUsernameSchema,
	page: z
		.string()
		.optional()
		.transform((val) => (val ? parseInt(val, 10) : 1))
		.refine((val) => val >= 1, 'Page must be at least 1'),
	search: z
		.string()
		.optional()
		.transform((val) => (val ? val.toLowerCase().trim() : ''))
});

export const leaderboardQuerySchema = z.object({
	page: z
		.string()
		.optional()
		.transform((val) => (val ? parseInt(val, 10) : 1))
		.refine((val) => val >= 1, 'Page must be at least 1'),
	sort: z
		.enum(['total', 'commits', 'messages', 'ratio'])
		.optional()
		.default('total'),
	order: z
		.enum(['asc', 'desc'])
		.optional()
		.default('desc')
});

export const usernameParamSchema = z.object({
	username: githubUsernameSchema
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SimilarsQueryInput = z.infer<typeof similarsQuerySchema>;
export type LeaderboardQueryInput = z.infer<typeof leaderboardQuerySchema>;
export type UsernameParamInput = z.infer<typeof usernameParamSchema>;

export function validate<T>(schema: z.ZodSchema<T>, data: unknown):
	| { success: true; data: T; errors: null }
	| { success: false; data: null; errors: string[] } {
	const result = schema.safeParse(data);

	if (result.success) {
		return { success: true, data: result.data, errors: null };
	} else {
		const errors = result.error.issues.map((issue) =>
			`${issue.path.join('.')}: ${issue.message}`
		);
		return { success: false, data: null, errors };
	}
}

export function validateOrThrow<T>(
	schema: z.ZodSchema<T>,
	data: unknown,
	context?: string
): T {
	const result = schema.safeParse(data);

	if (result.success) {
		return result.data;
	} else {
		const message = result.error.issues
			.map((issue) => issue.message)
			.join(', ');
		throw new Error(
			context
				? `Validation failed for ${context}: ${message}`
				: `Validation failed: ${message}`
		);
	}
}
