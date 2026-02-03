import { MTProto } from '@mtproto/core';
import { TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION } from '$env/static/private';
import type { TelegramStats } from '$lib/types';

interface ResolveUsernameResult {
	_: 'contacts.resolveUsername';
	chats: Array<{
		_: string;
		id: number;
		title?: string;
		access_hash?: string;
		username?: string;
	}>;
	users: Array<{
		_: string;
		id: number;
		access_hash?: string;
	}>;
}

interface GetHistoryResult {
	_: 'messages.getHistory';
	messages: Array<{
		_: string;
		id: number;
		date?: number;
		message?: string;
	}>;
	chats: Array<{
		_: string;
		id: number;
		title?: string;
	}>;
	users: Array<{
		_: string;
		id: number;
	}>;
	count: number;
}

interface GetFullChannelResult {
	_: 'channels.getFullChannel';
	full_chat: {
		_: 'channelFull';
		participants_count?: number;
	};
	chats: Array<{
		_: string;
		id: number;
		title?: string;
	}>;
	users: Array<{
		_: string;
		id: number;
	}>;
}

interface GetFullUserResult {
	_: 'users.getFullUser';
	user: {
		_: 'user';
		id: number;
		first_name?: string;
		last_name?: string;
		username?: string;
	};
	full_user: {
		_: 'userFull';
	};
}

class TelegramClient {
	private client: MTProto;
	private initialized: boolean = false;

	constructor() {
		this.client = new MTProto({
			apiId: Number(TELEGRAM_API_ID),
			apiHash: TELEGRAM_API_HASH,
			test: false,
			session: TELEGRAM_SESSION || 'telegram_session',
		});
	}

	async initialize(): Promise<void> {
		if (this.initialized) return;

		try {
			await this.client.call<GetFullUserResult>('users.getFullUser', {
				id: { _: 'me' },
			});
			this.initialized = true;
		} catch (error: any) {
			if (error.error_message === 'AUTH_KEY_UNREGISTERED' || error.error_message === 'SESSION_REVOKED') {
				throw new Error('Telegram session not authorized. Please run auth flow.');
			}
			throw error;
		}
	}

	async resolveChannel(channelUsername: string): Promise<{ id: number; accessHash: string }> {
		await this.initialize();

		const cleanUsername = channelUsername.replace('@', '');

		try {
			const result = await this.client.call<ResolveUsernameResult>('contacts.resolveUsername', {
				username: cleanUsername,
			});

			if (!result || !result.chats || result.chats.length === 0) {
				throw new Error('Channel not found');
			}

			const chat = result.chats[0];

			if (chat._ !== 'channel' && chat._ !== 'channelForbidden') {
				throw new Error('Username is not a channel');
			}

			return {
				id: chat.id,
				accessHash: chat.access_hash || '',
			};
		} catch (error: any) {
			if (error.error_message === 'USERNAME_NOT_OCCUPIED') {
				throw new Error(`Channel @${cleanUsername} not found`);
			}
			throw error;
		}
	}

	async getChannelMessages(channelId: number, accessHash: string): Promise<number> {
		await this.initialize();

		let totalMessages = 0;
		let offsetId = 0;
		const limit = 100;
		let hasMore = true;

		try {
			while (hasMore) {
				const result = await this.client.call<GetHistoryResult>('messages.getHistory', {
					peer: {
						_: 'inputPeerChannel',
						channel_id: channelId,
						access_hash: accessHash,
					},
					offset_id: offsetId,
					offset_date: 0,
					add_offset: 0,
					limit,
					max_id: 0,
					min_id: 0,
					hash: 0,
				});

				if (!result.messages || result.messages.length === 0) {
					hasMore = false;
					break;
				}

				totalMessages += result.messages.filter((msg) => msg._ === 'message').length;

				const lastMsg = result.messages[result.messages.length - 1];
				if (lastMsg && lastMsg.id) {
					offsetId = lastMsg.id;
				}

				if (result.messages.length < limit) {
					hasMore = false;
				}

				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			return totalMessages;
		} catch (error: any) {
			if (error.error_message === 'CHANNEL_PRIVATE' || error.error_message === 'CHANNEL_PUBLIC_GROUP_NA') {
				throw new Error('Bot is not a member of this channel or channel is private');
			}
			throw error;
		}
	}

	async getChannelStats(channelUsername: string): Promise<TelegramStats> {
		await this.initialize();

		try {
			const { id, accessHash } = await this.resolveChannel(channelUsername);
			const totalMessages = await this.getChannelMessages(id, accessHash);

			return {
				channelUsername,
				telegramMessages: totalMessages,
			};
		} catch (error: any) {
			throw new Error(`Failed to get stats for @${channelUsername}: ${error.message}`);
		}
	}

	async getChannelInfo(channelUsername: string): Promise<{ title: string; memberCount?: number }> {
		await this.initialize();

		const cleanUsername = channelUsername.replace('@', '');

		try {
			const result = await this.client.call<ResolveUsernameResult>('contacts.resolveUsername', {
				username: cleanUsername,
			});

			if (!result || !result.chats || result.chats.length === 0) {
				throw new Error('Channel not found');
			}

			const chat = result.chats[0] as any;
			const fullResult = await this.client.call<GetFullChannelResult>('channels.getFullChannel', {
				channel: {
					_: 'inputChannel',
					channel_id: chat.id,
					access_hash: chat.access_hash || '',
				},
			});

			return {
				title: chat.title || cleanUsername,
				memberCount: fullResult.full_chat?.participants_count,
			};
		} catch (error: any) {
			throw new Error(`Failed to get channel info: ${error.message}`);
		}
	}

	async isAuthorized(): Promise<boolean> {
		try {
			await this.initialize();
			return true;
		} catch {
			return false;
		}
	}
}

export const telegramClient = new TelegramClient();
export { TelegramClient };
