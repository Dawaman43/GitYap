

import { db } from '$lib/db';
import { users, stats } from '$lib/db/schema';
import { desc, asc, sql, eq } from 'drizzle-orm';
import { AppError, DatabaseError } from '$lib/errors';
import { logger } from '$lib/logger';
import { checkRateLimit } from '$lib/rate-limit';
import { validate, leaderboardQuerySchema } from '$lib/validation';
import { isValidSortField, isValidSortOrder } from '$lib/types';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { LeaderboardResponse, LeaderboardEntry } from '$lib/types';

const ITEMS_PER_PAGE = 20;

export async function GET({ url, request }: RequestEvent): Promise<Response> {
	const requestId = crypto.randomUUID();
	const clientIp = request.headers.get('x-forwarded-for') || 'unknown';


	logger.info('Processing leaderboard request', {
		requestId,
		clientIp,
		query: url.searchParams.toString()
	});

	try {

		checkRateLimit(clientIp, 'leaderboard');


		const queryParams = {
			page: url.searchParams.get('page') || '1',
			sort: url.searchParams.get('sort') || 'total',
			order: url.searchParams.get('order') || 'desc'
		};


		const validation = validate(leaderboardQuerySchema, queryParams);

		if (!validation.success) {
			logger.warn('Validation failed for leaderboard request', {
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

		const { page, sort, order } = validation.data;


		const offset = (page - 1) * ITEMS_PER_PAGE;

		logger.debug('Fetching leaderboard data', {
			requestId,
			page,
			sort,
			order,
			offset
		});


		let orderByClause;
		switch (sort) {
			case 'commits':
				orderByClause = order === 'asc'
					? asc(stats.githubCommits)
					: desc(stats.githubCommits);
				break;
			case 'messages':
				orderByClause = order === 'asc'
					? asc(stats.telegramMessages)
					: desc(stats.telegramMessages);
				break;
			case 'ratio':
				orderByClause = order === 'asc'
					? asc(sql`CAST(${stats.ratio} AS DECIMAL)`)
					: desc(sql`CAST(${stats.ratio} AS DECIMAL)`);
				break;
			case 'total':
			default:
				orderByClause = order === 'asc'
					? asc(sql`(${stats.githubCommits} + ${stats.telegramMessages})`)
					: desc(sql`(${stats.githubCommits} + ${stats.telegramMessages})`);
				break;
		}


		const leaderboardData = await db
			.select({
				username: users.githubUsername,
				githubCommits: stats.githubCommits,
				telegramMessages: stats.telegramMessages,
				ratio: stats.ratio,
				totalActivity: sql<number>`${stats.githubCommits} + ${stats.telegramMessages}`
			})
			.from(users)
			.innerJoin(stats, eq(users.id, stats.userId))
			.orderBy(orderByClause)
			.limit(ITEMS_PER_PAGE)
			.offset(offset);


		const countResult = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(users)
			.innerJoin(stats, eq(users.id, stats.userId));

		const totalCount = countResult[0]?.count ?? 0;
		const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);


		const rankedUsers: LeaderboardEntry[] = leaderboardData.map((user, index) => ({
			rank: offset + index + 1,
			username: user.username,
			githubCommits: user.githubCommits ?? 0,
			telegramMessages: user.telegramMessages ?? 0,
			ratio: parseFloat(user.ratio || '0'),
			totalActivity: user.totalActivity ?? 0
		}));


		const response: LeaderboardResponse = {
			users: rankedUsers,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1
			},
			sort: {
				by: sort,
				order
			}
		};

		logger.info('Successfully processed leaderboard request', {
			requestId,
			page,
			resultCount: rankedUsers.length,
			totalCount
		});

		return json(response);

	} catch (err) {

		if (err instanceof AppError) {
			logger.warn('Application error in leaderboard request', {
				requestId,
				errorCode: err.code,
				errorMessage: err.message
			});

			return json(err.toApiError(), { status: err.status });
		}


		logger.error(
			'Unexpected error in leaderboard request',
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
