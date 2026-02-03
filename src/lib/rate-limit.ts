

import { RateLimitError } from './errors';

interface RateLimitEntry {

	count: number;

	windowStart: number;
}

interface RateLimitConfig {

	limit: number;

	windowSeconds: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const defaultConfigs: Record<string, RateLimitConfig> = {

	register: { limit: 5, windowSeconds: 60 },


	stats: { limit: 30, windowSeconds: 60 },
	similars: { limit: 20, windowSeconds: 60 },
	leaderboard: { limit: 30, windowSeconds: 60 },


	webhook: { limit: 100, windowSeconds: 60 },


	default: { limit: 60, windowSeconds: 60 }
};

function cleanupOldEntries(): void {
	const now = Date.now();
	const maxAge = 24 * 60 * 60 * 1000;

	for (const [key, entry] of rateLimitStore.entries()) {
		if (now - entry.windowStart > maxAge) {
			rateLimitStore.delete(key);
		}
	}
}

setInterval(cleanupOldEntries, 60 * 60 * 1000);

export function checkRateLimit(
	identifier: string,
	endpointType: keyof typeof defaultConfigs = 'default'
): void {
	const config = defaultConfigs[endpointType] || defaultConfigs.default;
	const now = Date.now();
	const windowMs = config.windowSeconds * 1000;

	const key = `${endpointType}:${identifier}`;
	const entry = rateLimitStore.get(key);

	if (!entry) {

		rateLimitStore.set(key, {
			count: 1,
			windowStart: now
		});
		return;
	}


	if (now - entry.windowStart > windowMs) {

		rateLimitStore.set(key, {
			count: 1,
			windowStart: now
		});
		return;
	}


	if (entry.count >= config.limit) {
		throw new RateLimitError(config.limit, config.windowSeconds);
	}


	entry.count++;
}

export function getRateLimitStatus(
	identifier: string,
	endpointType: keyof typeof defaultConfigs = 'default'
): {
	limit: number;
	remaining: number;
	resetAt: Date;
} {
	const config = defaultConfigs[endpointType] || defaultConfigs.default;
	const key = `${endpointType}:${identifier}`;
	const entry = rateLimitStore.get(key);

	if (!entry) {
		return {
			limit: config.limit,
			remaining: config.limit,
			resetAt: new Date(Date.now() + config.windowSeconds * 1000)
		};
	}

	const windowMs = config.windowSeconds * 1000;
	const windowExpired = Date.now() - entry.windowStart > windowMs;

	if (windowExpired) {
		return {
			limit: config.limit,
			remaining: config.limit,
			resetAt: new Date(Date.now() + config.windowSeconds * 1000)
		};
	}

	return {
		limit: config.limit,
		remaining: Math.max(0, config.limit - entry.count),
		resetAt: new Date(entry.windowStart + windowMs)
	};
}

export function createRateLimitHook() {
	return async function handle({ event, resolve }: { event: { url: { pathname: string }; request: { headers: Headers } }; resolve: () => Promise<Response> }) {
		const path = event.url.pathname;
		const endpointType = getEndpointType(path);


		const ip = event.request.headers.get('x-forwarded-for') ||
			         event.request.headers.get('x-real-ip') ||
			         'unknown';


		try {
			checkRateLimit(ip, endpointType);
		} catch (error) {
			if (error instanceof RateLimitError) {
				return new Response(
					JSON.stringify(error.toApiError()),
					{
						status: 429,
						headers: {
							'Content-Type': 'application/json',
							'X-RateLimit-Limit': String(error.details?.limit),
							'X-RateLimit-Window': String(error.details?.windowSeconds)
						}
					}
				);
			}
			throw error;
		}


		const response = await resolve();
		const status = getRateLimitStatus(ip, endpointType);

		const newHeaders = new Headers(response.headers);
		newHeaders.set('X-RateLimit-Limit', String(status.limit));
		newHeaders.set('X-RateLimit-Remaining', String(status.remaining));
		newHeaders.set('X-RateLimit-Reset', status.resetAt.toISOString());

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: newHeaders
		});
	};
}

function getEndpointType(path: string): keyof typeof defaultConfigs {
	if (path === '/api/webhook') return 'webhook';
	if (path.startsWith('/api/stats')) return 'stats';
	if (path.startsWith('/api/similars')) return 'similars';
	if (path.startsWith('/api/leaderboard')) return 'leaderboard';
	if (path === '/api/register') return 'register';
	return 'default';
}
