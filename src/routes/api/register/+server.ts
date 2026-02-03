

import { db } from '$lib/db';
import { users, stats, channels } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { fetchGitHubCommits, validateGitHubUsername } from '$lib/utils/github';
import { calculateRatio } from '$lib/utils/calculations';
import { ConflictError, ValidationError, DatabaseError, AppError } from '$lib/errors';
import { logger } from '$lib/logger';
import { checkRateLimit } from '$lib/rate-limit';
import { validate, registerSchema } from '$lib/validation';
import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { RegisterResponse, RegisterRequest } from '$lib/types';

export async function POST({ request }: RequestEvent): Promise<Response> {
	const requestId = crypto.randomUUID();
	const clientIp = request.headers.get('x-forwarded-for') || 'unknown';


	logger.info('Processing registration request', { requestId, clientIp });

	try {

		checkRateLimit(clientIp, 'register');


		let body: unknown;

		try {
			body = await request.json();
		} catch {
			logger.warn('Invalid JSON in registration request', { requestId });

			return json(
				{
					code: 'VALIDATION_ERROR',
					message: 'Invalid JSON in request body',
					status: 400
				},
				{ status: 400 }
			);
		}


		const validation = validate(registerSchema, body);

		if (!validation.success) {
			logger.warn('Validation failed for registration', {
				requestId,
				errors: validation.errors
			});

			return json(
				{
					code: 'VALIDATION_ERROR',
					message: `Validation failed: ${validation.errors?.join(', ')}`,
					status: 400
				},
				{ status: 400 }
			);
		}

		const { githubUsername, telegramChannel } = validation.data;

		logger.info('Registration data validated', {
			requestId,
			githubUsername,
			telegramChannel
		});


		logger.debug('Validating GitHub username', { requestId, githubUsername });

		const gitHubValidation = await validateGitHubUsername(githubUsername);

		if (!gitHubValidation.success) {
			logger.error(
				'GitHub validation failed',
				gitHubValidation.error instanceof Error ? gitHubValidation.error : new Error(String(gitHubValidation.error)),
				{ requestId, githubUsername }
			);

			return json(
				{
					code: 'EXTERNAL_API_ERROR',
					message: 'Unable to verify GitHub username. Please try again.',
					status: 502
				},
				{ status: 502 }
			);
		}

		if (!gitHubValidation.data) {
			logger.warn('GitHub user does not exist', { requestId, githubUsername });

			return json(
				{
					code: 'NOT_FOUND',
					message: `GitHub user "${githubUsername}" not found`,
					status: 404
				},
				{ status: 404 }
			);
		}


		logger.debug('Checking for existing user', { requestId, githubUsername });

		const existingUserResult = await db
			.select({
				id: users.id,
				githubUsername: users.githubUsername,
				telegramChannel: users.telegramChannel
			})
			.from(users)
			.where(eq(users.githubUsername, githubUsername))
			.limit(1);


		logger.debug('Fetching initial GitHub stats', { requestId, githubUsername });

		const commitsResult = await fetchGitHubCommits(githubUsername);

		if (!commitsResult.success) {
			logger.error(
				'Failed to fetch initial GitHub stats',
				commitsResult.error instanceof Error ? commitsResult.error : new Error(String(commitsResult.error)),
				{ requestId, githubUsername }
			);

			return json(
				{
					code: 'EXTERNAL_API_ERROR',
					message: 'Unable to fetch GitHub statistics. Please try again.',
					status: 502
				},
				{ status: 502 }
			);
		}

		const githubCommits = commitsResult.data;


		logger.debug('Fetching channel stats', { requestId, telegramChannel });

		const channelResult = await db
			.select({ messageCount: channels.messageCount })
			.from(channels)
			.where(eq(channels.channelUsername, telegramChannel))
			.limit(1);

		const telegramMessages = channelResult[0]?.messageCount ?? 0;
		const ratio = calculateRatio(githubCommits, telegramMessages);


		if (existingUserResult.length > 0) {

			const existingUser = existingUserResult[0];

			logger.info('Updating existing user', {
				requestId,
				userId: existingUser.id,
				oldChannel: existingUser.telegramChannel,
				newChannel: telegramChannel
			});

			try {
				await db
					.update(users)
					.set({
						telegramChannel,
						updatedAt: new Date()
					})
					.where(eq(users.id, existingUser.id));


				await db
					.insert(stats)
					.values({
						userId: existingUser.id,
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

				const response: RegisterResponse = {
					success: true,
					message: 'User updated successfully',
					user: {
						username: githubUsername,
						channel: telegramChannel,
						commits: githubCommits,
						messages: telegramMessages,
						ratio
					}
				};

				logger.info('Successfully updated user', {
					requestId,
					userId: existingUser.id
				});

				return json(response);

			} catch (dbError) {
				logger.error(
					'Database error updating user',
					dbError instanceof Error ? dbError : new Error(String(dbError)),
					{ requestId, userId: existingUser.id }
				);

				return json(
					{
						code: 'DATABASE_ERROR',
						message: 'Failed to update user. Please try again.',
						status: 500
					},
					{ status: 500 }
				);
			}
		}


		logger.info('Creating new user', {
			requestId,
			githubUsername,
			telegramChannel
		});

		try {

			const newUserResult = await db
				.insert(users)
				.values({
					githubUsername,
					telegramChannel,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning({ id: users.id });

			const newUserId = newUserResult[0].id;


			await db.insert(stats).values({
				userId: newUserId,
				githubCommits,
				telegramMessages,
				ratio: ratio.toString(),
				lastUpdated: new Date()
			});

			const response: RegisterResponse = {
				success: true,
				message: 'User registered successfully',
				user: {
					username: githubUsername,
					channel: telegramChannel,
					commits: githubCommits,
					messages: telegramMessages,
					ratio
				}
			};

			logger.info('Successfully created new user', {
				requestId,
				userId: newUserId
			});

			return json(response, { status: 201 });

		} catch (dbError) {
			logger.error(
				'Database error creating user',
				dbError instanceof Error ? dbError : new Error(String(dbError)),
				{ requestId, githubUsername }
			);

			return json(
				{
					code: 'DATABASE_ERROR',
					message: 'Failed to create user. Please try again.',
					status: 500
				},
				{ status: 500 }
			);
		}

	} catch (err) {

		if (err instanceof AppError) {
			logger.warn('Application error in registration', {
				requestId,
				errorCode: err.code,
				errorMessage: err.message
			});

			return json(err.toApiError(), { status: err.status });
		}


		logger.error(
			'Unexpected error in registration',
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
