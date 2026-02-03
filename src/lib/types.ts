

export interface User {

	id: string;

	githubUsername: string;

	telegramChannel: string;

	createdAt: Date;

	updatedAt: Date;
}

export interface UserStats {

	userId: string;

	githubCommits: number;

	telegramMessages: number;

	ratio: number;

	lastUpdated: Date;
}

export interface Channel {

	id: string;

	channelUsername: string;

	channelPhoto: string;

	messageCount: number;

	isBotAdmin: boolean;

	addedAt: Date;

	updatedAt: Date;
}

export interface DailyStats {

	id: string;

	userId: string;

	date: Date;

	commits: number;

	messages: number;
}

export type UserType = 'coder' | 'yapper' | 'balanced';

export interface UserWithStats extends User {

	stats: UserStats | null;
}

export interface UserStatsResponse {

	username: string;

	githubCommits: number;

	telegramMessages: number;

	ratio: number;

	telegramChannel: string;

	channelPhoto: string;

	userType: UserType;

	percentageDifference: string;
}

export interface SimilarUser {

	username: string;

	githubCommits: number;

	telegramMessages: number;

	ratio: number;

	ratioDifference: number;
}

export interface SimilarUsersResponse {

	users: SimilarUser[];

	pagination: PaginationMetadata;
}

export interface LeaderboardEntry {

	rank: number;

	username: string;

	githubCommits: number;

	telegramMessages: number;

	ratio: number;

	totalActivity: number;
}

export interface LeaderboardResponse {

	users: LeaderboardEntry[];

	pagination: PaginationMetadata;

	sort: SortConfig;
}

export interface PaginationMetadata {

	currentPage: number;

	totalPages: number;

	totalCount: number;

	hasNextPage: boolean;

	hasPrevPage: boolean;
}

export interface SortConfig {

	by: 'total' | 'commits' | 'messages' | 'ratio';

	order: 'asc' | 'desc';
}

export interface ApiError {

	code: string;

	message: string;

	status: number;

	details?: Record<string, unknown>;
}

export interface ApiSuccess<T> {

	data: T;

	message?: string;
}

export interface RegisterRequest {

	githubUsername: string;

	telegramChannel: string;
}

export interface RegisterResponse {

	success: boolean;

	message: string;

	user?: {
		username: string;
		channel: string;
		commits: number;
		messages: number;
		ratio: number;
	};
}

export interface GitHubUser {
	login: string;
	id: number;
	avatar_url: string;
	html_url: string;
	name: string | null;
	company: string | null;
	blog: string | null;
	location: string | null;
	email: string | null;
	bio: string | null;
	public_repos: number;
	public_gists: number;
	followers: number;
	following: number;
	created_at: string;
	updated_at: string;
}

export interface GitHubEvent {
	id: string;
	type: string;
	actor: {
		id: number;
		login: string;
		display_login: string;
	};
	repo: {
		id: number;
		name: string;
	};
	payload: {
		commits?: Array<{
			sha: string;
			message: string;
			author: {
				name: string;
				email: string;
			};
		}>;
	};
	created_at: string;
}

export interface TelegramChannelPost {
	message_id: number;
	chat: {
		id: number;
		type: string;
		title?: string;
		username?: string;
	};
	date: number;
	text?: string;
}

export interface TelegramStats {
	channelUsername: string;
	telegramMessages: number;
	channelInfo?: {
		title: string;
		memberCount?: number;
	};
}

export interface TelegramAuthState {
	phoneCodeHash?: string;
	phoneNumber?: string;
}

export type Result<T, E = Error> =
	| { success: true; data: T; error: null }
	| { success: false; data: null; error: E };

export function ok<T>(data: T): Result<T> {
	return { success: true, data, error: null };
}

export function err<E>(error: E): Result<never, E> {
	return { success: false, data: null, error };
}

export function isValidUserType(value: string): value is UserType {
	return ['coder', 'yapper', 'balanced'].includes(value);
}

export function isValidSortField(value: string): value is SortConfig['by'] {
	return ['total', 'commits', 'messages', 'ratio'].includes(value);
}

export function isValidSortOrder(value: string): value is SortConfig['order'] {
	return ['asc', 'desc'].includes(value);
}
