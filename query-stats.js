import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, uuid, varchar, integer, timestamp, text, boolean } from 'drizzle-orm/pg-core';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

const channels = pgTable('channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelUsername: varchar('channel_username', { length: 255 }).notNull(),
  channelPhoto: text('channel_photo').default(''),
  messageCount: integer('message_count').default(0).notNull(),
  isBotAdmin: boolean('is_bot_admin').default(false).notNull(),
  addedAt: timestamp('added_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  githubUsername: varchar('github_username', { length: 255 }).notNull(),
  telegramChannel: varchar('telegram_channel', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

const statsTable = pgTable('stats', {
  userId: uuid('user_id').primaryKey(),
  githubCommits: integer('github_commits').default(0).notNull(),
  telegramMessages: integer('telegram_messages').default(0).notNull(),
  ratio: text('ratio').default('0').notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull()
});

async function showStats() {
  console.log('=== CHANNELS ===\n');
  const ch = await db.select().from(channels).orderBy(channels.messageCount);
  console.table(ch);

  console.log('\n=== USERS ===\n');
  const us = await db.select().from(users).orderBy(users.createdAt);
  console.table(us);

  console.log('\n=== STATS ===\n');
  const st = await db.select().from(statsTable);
  console.table(st);
}

showStats().catch(console.error);
