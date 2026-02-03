

import { db } from '$lib/db';
import { users, stats } from '$lib/db/schema';
import { eq, sql, ne, and, like } from 'drizzle-orm';
import { NotFoundError, AppError, DatabaseError } from '$lib/errors';
import { logger } from '$lib/logger';
import { checkRateLimit } from '$lib/rate-limit';
import { validate, similarsQuerySchema } from '$lib/validation';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { SimilarUsersResponse, SimilarUser } from '$lib/types';

const ITEMS_PER_PAGE = 12;

export async function GET({ url, request }: RequestEvent): Promise<Response> {
	const requestId = crypto.randomUUID();
	const clientIp = request.headers.get('x-forwarded-for') || 'unknown';


	logger.info('Processing similar users request', {
		requestId,
		clientIp,
		query: url.searchParams.toString()
	});

	try {

		checkRateLimit(clientIp, 'similars');


		const queryParams = {
			username: url.searchParams.get('username') || '',
			page: url.searchParams.get('page') || '1',
			search: url.searchParams.get('search') || ''
		};


		const validation = validate(similarsQuerySchema, queryParams);

		if (!validation.success) {
			logger.warn('Validation failed for similar users request', {
				requestId,
				errors: validation.errors,
				providedParams: queryParams
			});

			return json(
				{
					code: 'VALIDATION_ERROR',
					message: `Invalid query parameters: ${validation.errors?.join(', ')}`,
					status: 400
				},
				{ status: 400 }
			);
		}

		const { username, page, search } = validation.data;


		logger.debug('Fetching target user stats', { requestId, username });

		const targetUserResult = await db
			.select({
				id: users.id,
				githubUsername: users.githubUsername,
				ratio: stats.ratio
			})
			.from(users)
			.leftJoin(stats, eq(users.id, stats.userId))
			.where(eq(users.githubUsername, username))
			.limit(1);

		if (!targetUserResult.length || !targetUserResult[0].ratio) {
			logger.warn('Target user not found or has no stats', { requestId, username });
			throw new NotFoundError('User', username);
		}

		const targetUser = targetUserResult[0];
		const targetRatio = parseFloat(targetUser.ratio!);


		const offset = (page - 1) * ITEMS_PER_PAGE;

		logger.debug('Fetching similar users', {
			requestId,
			targetUserId: targetUser.id,
			targetRatio,
			page,
			search: search || '(none)'
		});


		let conditions: ReturnType<typeof ne> = ne(users.id, targetUser.id);

		if (search) {
			conditions = and(conditions, like(users.githubUsername, `%${search}%`)) as ReturnType<typeof ne>;
		}


		const similarUsersResult = await db
			.select({
				username: users.githubUsername,
				githubCommits: stats.githubCommits,
				telegramMessages: stats.telegramMessages,
				ratio: stats.ratio
			})
			.from(users)
			.leftJoin(stats, eq(users.id, stats.userId))
			.where(conditions)
			.orderBy(sql`ABS(CAST(${stats.ratio} AS DECIMAL) - ${targetRatio})`)
			.limit(ITEMS_PER_PAGE)
			.offset(offset);


		const countResult = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(users)
			.leftJoin(stats, eq(users.id, stats.userId))
			.where(conditions);

		const totalCount = countResult[0]?.count ?? 0;
		const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);


		const formattedUsers: SimilarUser[] = similarUsersResult.map((user) => ({
			username: user.username,
			githubCommits: user.githubCommits ?? 0,
			telegramMessages: user.telegramMessages ?? 0,
			ratio: parseFloat(user.ratio || '0'),
			ratioDifference: Math.abs(parseFloat(user.ratio || '0') - targetRatio)
		}));


		const response: SimilarUsersResponse = {
			users: formattedUsers,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1
			}
		};

		logger.info('Successfully processed similar users request', {
			requestId,
			username,
			resultCount: formattedUsers.length,
			totalCount
		});

		return json(response);

	} catch (err) {

		if (err instanceof AppError) {
			logger.warn('Application error in similar users request', {
				requestId,
				errorCode: err.code,
				errorMessage: err.message
			});

			return json(err.toApiError(), { status: err.status });
		}


		logger.error(
			'Unexpected error in similar users request',
			err instanceof Error ? err : new Error(String(err)),
			{ requestId }
		);


		return json(
			{
				code: 'INTERNAL_ERROR',
				message: 'An unexpected error occurred. Please try again later.',
				status: 500
			},
			{ status: 500 }
		);
	}
}
