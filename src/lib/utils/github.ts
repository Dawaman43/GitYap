

import { GITHUB_TOKEN } from '$env/static/private';
import { ExternalApiError, NotFoundError } from '../errors';
import { logger } from '../logger';
import type { GitHubEvent, GitHubUser, Result } from '../types';
import { err, ok } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

const MAX_EVENTS_PER_PAGE = 100;

function createGitHubHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		'Accept': 'application/vnd.github.v3+json',
		'User-Agent': 'GitYap-App/1.0'
	};


	if (GITHUB_TOKEN && GITHUB_TOKEN.length > 0 && GITHUB_TOKEN !== 'dummy_token_for_build') {
		headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
		logger.debug('Using authenticated GitHub API request');
	} else {
		logger.debug('Using unauthenticated GitHub API request (lower rate limit)');
	}

	return headers;
}

async function handleGitHubError(
	response: Response,
	username: string,
	operation: string
): Promise<never> {
	let errorMessage: string;
	let isRetryable = false;

	switch (response.status) {
		case 404:
			throw new NotFoundError('GitHub user', username);

		case 403:
			errorMessage = 'GitHub API rate limit exceeded. Try again later or add a GitHub token.';
			isRetryable = true;
			break;

		case 401:
			errorMessage = 'GitHub authentication failed. Check your GitHub token.';
			break;

		case 500:
		case 502:
		case 503:
		case 504:
			errorMessage = `GitHub service temporarily unavailable (${response.status})`;
			isRetryable = true;
			break;

		default:
			errorMessage = `GitHub API error: ${response.status}`;
	}


	let details: Record<string, unknown> = { status: response.status };
	try {
		const body = await response.json();
		details.message = body.message;
		details.documentation_url = body.documentation_url;
	} catch {

	}

	throw new ExternalApiError(
		'GitHub',
		errorMessage,
		response.status,
		isRetryable
	);
}

async function fetchGitHubEvents(
	username: string
): Promise<Result<GitHubEvent[], Error>> {
	const headers = createGitHubHeaders();

	logger.info('Fetching GitHub events', { username, operation: 'fetch_events' });

	try {
		const response = await fetch(
			`${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/events/public?per_page=${MAX_EVENTS_PER_PAGE}`,
			{ headers }
		);

		if (!response.ok) {
			await handleGitHubError(response, username, 'fetch_events');
		}

		const events: GitHubEvent[] = await response.json();

		logger.info('Successfully fetched GitHub events', {
			username,
			eventCount: events.length
		});

		return ok(events);

	} catch (error) {
		if (error instanceof ExternalApiError || error instanceof NotFoundError) {
			return err(error);
		}

		logger.error('Unexpected error fetching GitHub events', error as Error, { username });

		return err(new ExternalApiError(
			'GitHub',
			`Failed to fetch events: ${(error as Error).message}`,
			undefined,
			true
		));
	}
}

function countCommitsFromEvents(events: GitHubEvent[]): number {
	let commitCount = 0;

	for (const event of events) {

		if (event.type === 'PushEvent' && event.payload?.commits) {
			commitCount += event.payload.commits.length;
		}
	}

	return commitCount;
}

export async function fetchGitHubCommits(
	username: string
): Promise<Result<number, Error>> {

	if (!username || typeof username !== 'string') {
		return err(new ExternalApiError(
			'GitHub',
			'Invalid username provided',
			400,
			false
		));
	}

	const normalizedUsername = username.trim().toLowerCase();


	const eventsResult = await fetchGitHubEvents(normalizedUsername);

	if (!eventsResult.success) {
		return err(eventsResult.error);
	}


	const commitCount = countCommitsFromEvents(eventsResult.data);

	logger.info('Calculated GitHub commit count', {
		username: normalizedUsername,
		commitCount,
		eventsProcessed: eventsResult.data.length
	});

	return ok(commitCount);
}

export async function fetchGitHubUser(
	username: string
): Promise<Result<GitHubUser | null, Error>> {
	const headers = createGitHubHeaders();
	const normalizedUsername = username.trim().toLowerCase();

	logger.info('Fetching GitHub user profile', { username: normalizedUsername });

	try {
		const response = await fetch(
			`${GITHUB_API_BASE}/users/${encodeURIComponent(normalizedUsername)}`,
			{ headers }
		);

		if (!response.ok) {
			await handleGitHubError(response, normalizedUsername, 'fetch_user');
		}

		const user: GitHubUser = await response.json();

		logger.info('Successfully fetched GitHub user', {
			username: normalizedUsername,
			userId: user.id
		});

		return ok(user);

	} catch (error) {
		if (error instanceof ExternalApiError || error instanceof NotFoundError) {
			return err(error);
		}

		logger.error('Unexpected error fetching GitHub user', error as Error, {
			username: normalizedUsername
		});

		return err(new ExternalApiError(
			'GitHub',
			`Failed to fetch user: ${(error as Error).message}`,
			undefined,
			true
		));
	}
}

export async function validateGitHubUsername(
	username: string
): Promise<Result<boolean, Error>> {
	const result = await fetchGitHubUser(username);

	if (result.success) {
		return ok(result.data !== null);
	}

	if (result.error instanceof NotFoundError) {
		return ok(false);
	}

	return err(result.error);
}
