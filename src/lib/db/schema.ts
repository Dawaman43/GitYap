import { pgTable, uuid, varchar, integer, timestamp, decimal, boolean, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	githubUsername: varchar('github_username', { length: 255 }).notNull().unique(),
	telegramChannel: varchar('telegram_channel', { length: 255 }).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
	githubUsernameIdx: index('github_username_idx').on(table.githubUsername),
	telegramChannelIdx: index('telegram_channel_idx').on(table.telegramChannel)
}));

export const stats = pgTable('stats', {
	userId: uuid('user_id').references(() => users.id).primaryKey(),
	githubCommits: integer('github_commits').default(0).notNull(),
	telegramMessages: integer('telegram_messages').default(0).notNull(),
	ratio: decimal('ratio', { precision: 20, scale: 10 }).default('0').notNull(),
	lastUpdated: timestamp('last_updated').defaultNow().notNull()
});

export const channels = pgTable('channels', {
	id: uuid('id').defaultRandom().primaryKey(),
	channelUsername: varchar('channel_username', { length: 255 }).notNull().unique(),
	channelPhoto: varchar('channel_photo', { length: 512 }).default('').notNull(),
	messageCount: integer('message_count').default(0).notNull(),
	isBotAdmin: boolean('is_bot_admin').default(false).notNull(),
	addedAt: timestamp('added_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
	channelUsernameIdx: index('channel_username_idx').on(table.channelUsername)
}));

export const dailyStats = pgTable('daily_stats', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').references(() => users.id).notNull(),
	date: timestamp('date').notNull(),
	commits: integer('commits').default(0).notNull(),
	messages: integer('messages').default(0).notNull()
}, (table) => ({
	userDateIdx: index('user_date_idx').on(table.userId, table.date)
}));
