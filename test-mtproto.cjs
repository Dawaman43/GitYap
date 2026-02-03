require('dotenv').config();

const MTProto = require('@mtproto/core');

const TELEGRAM_API_ID = process.env.TELEGRAM_API_ID;
const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH;
const TELEGRAM_SESSION = process.env.TELEGRAM_SESSION || 'telegram_session';

if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH || TELEGRAM_API_ID === 'YOUR_API_ID_HERE') {
  console.log('Please set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env');
  console.log('Get credentials from https://my.telegram.org/apps');
  process.exit(1);
}

const client = new MTProto({
  apiId: Number(TELEGRAM_API_ID),
  apiHash: TELEGRAM_API_HASH,
  test: false,
  storageOptions: {
    path: TELEGRAM_SESSION + '.json',
  },
});

async function testMTProto() {
  console.log('Testing Telegram MTProto...\n');

  try {
    console.log('1. Checking authorization...');
    const result = await client.call('users.getFullUser', { id: { _: 'me' } });
    console.log('   Authorized: YES');
    console.log('   User:', result.user?.first_name || 'Unknown');

    console.log('\n2. Fetching @dcodeer channel...');
    const resolve = await client.call('contacts.resolveUsername', { username: 'dcodeer' });
    console.log('   Channel found:', resolve.chats?.[0]?.title || '@dcodeer');
    const channelId = resolve.chats?.[0]?.id;
    const accessHash = resolve.chats?.[0]?.access_hash;

    if (!channelId) {
      console.log('   Could not get channel ID');
      return;
    }

    console.log('\n3. Fetching message count (first 100)...');
    const history = await client.call('messages.getHistory', {
      peer: {
        _: 'inputPeerChannel',
        channel_id: channelId,
        access_hash: accessHash,
      },
      offset_id: 0,
      offset_date: 0,
      add_offset: 0,
      limit: 100,
      max_id: 0,
      min_id: 0,
      hash: 0,
    });

    const messages = history.messages || [];
    const messageCount = messages.filter(function(m) { return m._ === 'message'; }).length;
    console.log('   Messages in last batch:', messageCount);
    console.log('   Total available:', history.count || 'Unknown');

    console.log('\nMTProto working correctly!');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.log('\nError:', err.message);
    if (err.message.includes('AUTH_KEY')) {
      console.log('\nNot authorized. Session file may not exist.');
      console.log('The first run requires interactive authentication.');
    }
  }
}

testMTProto();
