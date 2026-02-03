import 'dotenv/config';
import { Bot } from 'grammy';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

async function countMessages() {
  const channelUsername = 'dcodeer';
  const chatId = '-1003235392293';

  console.log(`Counting messages in @${channelUsername}...\n`);

  try {
    let totalCount = 0;
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const updates = await bot.api.getUpdates({
        offset: offset,
        limit: limit,
        timeout: 1
      });

      if (updates.length === 0) {
        hasMore = false;
        continue;
      }

      let batchCount = 0;
      for (const update of updates) {
        if (update.channel_post && update.channel_post.chat.username === channelUsername) {
          batchCount++;
          totalCount++;
        }
      }

      offset = updates[updates.length - 1].id + 1;
      console.log(`Fetched ${updates.length} updates, ${batchCount} from channel...`);

      if (updates.length < limit) {
        hasMore = false;
      }
    }

    console.log(`\n📊 Total channel messages: ${totalCount}`);
  } catch (error) {
    console.log('❌ Error:', error.message || error);
  }
}

countMessages();
