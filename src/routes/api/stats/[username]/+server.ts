

import { db } from '$lib/db';
import { users, stats, channels } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { fetchGitHubCommits } from '$lib/utils/github';
import { calculateRatio, getUserType, calculatePercentageDifference } from '$lib/utils/calculations';
import { NotFoundError, DatabaseError, AppError } from '$lib/errors';
import { logger } from '$lib/logger';
import { checkRateLimit } from '$lib/rate-limit';
import { validate, usernameParamSchema } from '$lib/validation';
import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { UserStatsResponse } from '$lib/types';

export async function GET({ params, request }: RequestEvent): Promise<Response> {
	const requestId = crypto.randomUUID();
	const clientIp = request.headers.get('x-forwarded-for') || 'unknown';


	logger.info('Processing stats request', {
		requestId,
		username: params.username,
		clientIp
	});

	try {

		checkRateLimit(clientIp, 'stats');


		const validation = validate(usernameParamSchema, { username: params.username });

		if (!validation.success) {
			logger.warn('Validation failed for stats request', {
				requestId,
				errors: validation.errors,
				providedUsername: params.username
			});

			return json(
				{
					code: 'VALIDATION_ERROR',
					message: `Invalid username: ${validation.errors?.join(', ')}`,
					status: 400
				},
				{ status: 400 }
			);
		}

		const { username } = validation.data;


		logger.debug('Fetching user from database', { requestId, username });

		const userResult = await db
			.select({
				id: users.id,
				githubUsername: users.githubUsername,
				telegramChannel: users.telegramChannel,
				createdAt: users.createdAt
			})
			.from(users)
			.where(eq(users.githubUsername, username))
			.limit(1);

		if (userResult.length === 0) {
			logger.warn('User not found', { requestId, username });
			throw new NotFoundError('User', username);
		}

		const user = userResult[0];


		logger.debug('Fetching channel stats', {
			requestId,
			username,
			channel: user.telegramChannel
		});

		const channelResult = await db
			.select({
				messageCount: channels.messageCount,
				channelPhoto: channels.channelPhoto
			})
			.from(channels)
			.where(eq(channels.channelUsername, user.telegramChannel))
			.limit(1);

		const telegramMessages = channelResult[0]?.messageCount ?? 0;
		const channelPhoto = channelResult[0]?.channelPhoto ?? '';


		logger.debug('Fetching GitHub commits', { requestId, username });

		const commitsResult = await fetchGitHubCommits(username);

		if (!commitsResult.success) {
			logger.error(
				'Failed to fetch GitHub commits',
				commitsResult.error instanceof Error ? commitsResult.error : new Error(String(commitsResult.error)),
				{ requestId, username }
			);


			throw commitsResult.error;
		}

		const githubCommits = commitsResult.data;


		const ratio = calculateRatio(githubCommits, telegramMessages);
		const userType = getUserType(githubCommits, telegramMessages);
		const percentageDifference = calculatePercentageDifference(githubCommits, telegramMessages);


		logger.debug('Updating user stats in database', {
			requestId,
			username,
			commits: githubCommits,
			messages: telegramMessages,
			ratio
		});

		try {
			await db
				.insert(stats)
				.values({
					userId: user.id,
					githubCommits,
					telegramMessages,
					ratio: ratio.toString(),
					lastUpdated: new Date()
				})
				.onConflictDoUpdate({
					target: stats.userId,
					set: {
						githubCommits,
						telegramMessages,
						ratio: ratio.toString(),
						lastUpdated: new Date()
					}
				});
		} catch (dbError) {
			logger.error(
				'Failed to update user stats',
				dbError instanceof Error ? dbError : new Error(String(dbError)),
				{ requestId, username, userId: user.id }
			);

		}


		const response: UserStatsResponse = {
			username,
			githubCommits,
			telegramMessages,
			ratio,
			telegramChannel: user.telegramChannel,
			channelPhoto,
			userType,
			percentageDifference
		};

		logger.info('Successfully processed stats request', {
			requestId,
			username,
			duration: Date.now()
		});

		return json(response);

	} catch (err) {

		if (err instanceof AppError) {
			logger.warn('Application error in stats request', {
				requestId,
				errorCode: err.code,
				errorMessage: err.message,
				username: params.username
			});

			return json(err.toApiError(), { status: err.status });
		}


		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}


		logger.error(
			'Unexpected error in stats request',
			err instanceof Error ? err : new Error(String(err)),
			{ requestId, username: params.username }
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
