import 'dotenv/config';
import { Bot } from 'grammy';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

async function testChannel() {
  const channelUsername = 'dcodeer';

  try {
    console.log(`Testing bot access to @${channelUsername}...\n`);

    const chat = await bot.api.getChat(`@${channelUsername}`);
    console.log('✅ Channel found!');
    console.log('Chat ID:', chat.id);
    console.log('Title:', chat.title || 'N/A');
    console.log('Username:', chat.username);
    console.log('Type:', chat.type);

    if (chat.photo) {
      console.log('Has photo: YES');
      const file = await bot.api.getFile(chat.photo.big_file_id);
      console.log('Photo URL:', `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`);
    } else {
      console.log('Has photo: NO');
    }
  } catch (error) {
    console.log('❌ Error:', error.message || error);
    if (error.error_code === 400 || error.description?.includes('chat not found')) {
      console.log('\nPossible causes:');
      console.log('- Channel does not exist');
      console.log('- Bot is not a member/admin');
      console.log('- Channel is private');
    }
  }
}

testChannel();
