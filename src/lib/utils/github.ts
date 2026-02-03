

import { GITHUB_TOKEN } from '$env/static/private';
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
	}

	return headers;
}

async function fetchAllCommitsCount(username: string): Promise<number> {
	const headers = createGitHubHeaders();
	headers['Accept'] = 'application/vnd.github.cloak-preview+json';

	try {
		logger.info('Fetching all-time commit count via Search API', { username });

		const response = await fetch(
			`${GITHUB_API_BASE}/search/commits?q=author:${encodeURIComponent(username)}&per_page=1`,
			{ headers }
		);

		if (!response.ok) {
			logger.warn('Search API failed, falling back to events', { username, status: response.status });
			return 0;
		}

		const data = await response.json();
		const totalCommits = data.total_count || 0;

		logger.info('Search API success', { username, totalCommits });

		return totalCommits;
	} catch (error) {
		logger.error('Search API error', error as Error, { username });
		return 0;
	}
}

async function fetchRecentCommits(username: string): Promise<number> {
	const headers = createGitHubHeaders();

	try {
		logger.info('Fetching recent events', { username });

		const response = await fetch(
			`${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/events/public?per_page=100`,
			{ headers }
		);

		if (!response.ok) {
			logger.warn('Events API failed', { username, status: response.status });
			return 0;
		}

		const events: GitHubEvent[] = await response.json();

		let commitCount = 0;
		for (const event of events) {
			if (event.type === 'PushEvent' && event.payload?.commits) {
				commitCount += event.payload.commits.length;
			}
		}

		logger.info('Events API success', { username, recentCommits: commitCount });

		return commitCount;
	} catch (error) {
		logger.error('Events API error', error as Error, { username });
		return 0;
	}
}

export async function fetchGitHubCommits(
	username: string
): Promise<Result<number, Error>> {
	if (!username || typeof username !== 'string') {
		return err(new Error('Invalid username provided'));
	}

	const normalizedUsername = username.trim().toLowerCase();

	logger.info('Fetching GitHub commits', { username: normalizedUsername });

	try {
		const allTimeCommits = await fetchAllCommitsCount(normalizedUsername);

		if (allTimeCommits > 0) {
			logger.info('Using all-time commit count', { username: normalizedUsername, count: allTimeCommits });
			return ok(allTimeCommits);
		}

		const recentCommits = await fetchRecentCommits(normalizedUsername);

		logger.info('Using recent commits count', { username: normalizedUsername, count: recentCommits });

		return ok(recentCommits);
	} catch (error) {
		logger.error('Failed to fetch commits', error as Error, { username: normalizedUsername });
		return err(error as Error);
	}
}

export async function fetchGitHubUser(
	username: string
): Promise<Result<GitHubUser | null, Error>> {
	const headers = createGitHubHeaders();
	const normalizedUsername = username.trim().toLowerCase();

	try {
		logger.info('Fetching GitHub user', { username: normalizedUsername });

		const response = await fetch(
			`${GITHUB_API_BASE}/users/${encodeURIComponent(normalizedUsername)}`,
			{ headers }
		);

		if (!response.ok) {
			if (response.status === 404) {
				return ok(null);
			}
			throw new Error(`GitHub API error: ${response.status}`);
		}

		const user: GitHubUser = await response.json();

		logger.info('Successfully fetched GitHub user', { username: normalizedUsername, userId: user.id });

		return ok(user);
	} catch (error) {
		logger.error('Failed to fetch GitHub user', error as Error, { username: normalizedUsername });
		return err(error as Error);
	}
}

export async function validateGitHubUsername(
	username: string
): Promise<Result<boolean, Error>> {
	const result = await fetchGitHubUser(username);

	if (result.success) {
		return ok(result.data !== null);
	}

	return err(result.error);
}
