import 'dotenv/config';
import { telegramClient } from './src/lib/telegram/client.js';

async function testTelegram() {
  console.log('Testing Telegram MTProto client...\n');

  try {
    console.log('1. Checking authorization...');
    const isAuthorized = await telegramClient.isAuthorized();
    console.log('   Authorized:', isAuthorized);

    if (!isAuthorized) {
      console.log('\nNot authorized. Need to run auth flow first.');
      console.log('   Get API credentials from https://my.telegram.org');
      return;
    }

    console.log('\n2. Fetching channel stats for @dcodeer...');
    const stats = await telegramClient.getChannelStats('dcodeer');
    console.log('   Channel: @' + stats.channelUsername);
    console.log('   Messages:', stats.telegramMessages);

    console.log('\n3. Fetching channel info...');
    const info = await telegramClient.getChannelInfo('dcodeer');
    console.log('   Title:', info.title);
    console.log('   Members:', info.memberCount || 'Unknown');

    console.log('\nTelegram MTProto working correctly!');
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.log('\nError:', err.message);
    if (err.message.includes('not authorized')) {
      console.log('\nTo authorize:');
      console.log('1. Get APP_ID and APP_HASH from https://my.telegram.org/apps');
      console.log('2. Set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env');
      console.log('3. Run auth flow');
    }
  }
}

testTelegram();
