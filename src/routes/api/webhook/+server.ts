import { Bot, webhookCallback } from 'grammy';
import { TELEGRAM_BOT_TOKEN } from '$env/static/private';
import { db } from '$lib/db';
import { channels, users, stats } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';

const bot = new Bot(TELEGRAM_BOT_TOKEN);

bot.on('channel_post:text', async (ctx) => {
	const channelPost = ctx.channelPost;
	const chat = channelPost.chat;


	const channelUsername = chat.username || chat.title;

	if (!channelUsername) {
		console.log('Channel has no username or title');
		return;
	}

	try {

		const existingChannelResult = await db.select()
			.from(channels)
			.where(eq(channels.channelUsername, channelUsername))
			.limit(1);

		const existingChannel = existingChannelResult[0];

		if (existingChannel) {

			await db.update(channels)
				.set({
					messageCount: sql`${channels.messageCount} + 1`,
					updatedAt: new Date()
				})
				.where(eq(channels.channelUsername, channelUsername));

			console.log(`Incremented message count for ${channelUsername}`);
		} else {

			await db.insert(channels).values({
				channelUsername,
				messageCount: 1,
				isBotAdmin: true
			});

			console.log(`Created new channel entry for ${channelUsername}`);
		}


		const linkedUsers = await db.select().from(users).where(eq(users.telegramChannel, channelUsername));

		for (const user of linkedUsers) {
			await db.update(stats)
				.set({
					telegramMessages: sql`${stats.telegramMessages} + 1`,
					lastUpdated: new Date()
				})
				.where(eq(stats.userId, user.id));
		}

	} catch (error) {
		console.error('Error processing channel message:', error);
	}
});

bot.on('my_chat_member', async (ctx) => {
	const chat = ctx.myChatMember.chat;
	const newStatus = ctx.myChatMember.new_chat_member.status;

	if (chat.type === 'channel' && newStatus === 'administrator') {
		const channelUsername = chat.username || chat.title;

		if (channelUsername) {
			try {
				const existingChannelResult = await db.select()
					.from(channels)
					.where(eq(channels.channelUsername, channelUsername))
					.limit(1);

				const existingChannel = existingChannelResult[0];

				if (existingChannel) {
					await db.update(channels)
						.set({ isBotAdmin: true })
						.where(eq(channels.channelUsername, channelUsername));
				} else {
					await db.insert(channels).values({
						channelUsername,
						isBotAdmin: true
					});
				}

				console.log(`Bot added as admin to ${channelUsername}`);
			} catch (error) {
				console.error('Error updating channel admin status:', error);
			}
		}
	}
});

export const POST = webhookCallback(bot, 'sveltekit');
