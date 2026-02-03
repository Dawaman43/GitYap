import 'dotenv/config';
import { Bot } from 'grammy';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

async function checkAdmin() {
  const channelUsername = 'dcodeer';

  try {
    const me = await bot.api.getMe();
    const chatMember = await bot.api.getChatMember(`@${channelUsername}`, me.id);
    console.log('Bot status:', chatMember.status);
    console.log('Is admin:', ['administrator', 'creator'].includes(chatMember.status));

    if (chatMember.status === 'administrator') {
      console.log('\nPermissions:');
      console.log('- Can delete messages:', chatMember.can_delete_messages);
      console.log('- Can edit messages:', chatMember.can_edit_messages);
      console.log('- Can post messages:', chatMember.can_post_messages);
      console.log('- Can view messages:', chatMember.can_view_messages);
    }
  } catch (error) {
    console.log('❌ Error checking admin:', error.message || error);
  }
}

checkAdmin();
