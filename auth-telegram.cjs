require('dotenv').config();

const MTProto = require('@mtproto/core');

const TELEGRAM_API_ID = process.env.TELEGRAM_API_ID;
const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH;
const TELEGRAM_SESSION = process.env.TELEGRAM_SESSION || 'telegram_session';

if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) {
  console.log('Please set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env');
  process.exit(1);
}

const client = new MTProto({
  apiId: Number(TELEGRAM_API_ID),
  apiHash: TELEGRAM_API_HASH,
  test: false,  // <-- TRY PRODUCTION MODE
  storageOptions: {
    path: TELEGRAM_SESSION + '.json',
  },
});

async function authenticate() {
  console.log('Telegram MTProto Authentication\n');
  console.log('Note: Run this locally, not on Vercel\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (question) => new Promise((resolve) => {
    readline.question(question, (answer) => resolve(answer));
  });

  try {
    console.log('1. Sending code request...');
    const phoneNumber = await askQuestion('Enter your phone number (e.g., +1234567890): ');
    
    const sendCodeResult = await client.call('auth.sendCode', {
      phone_number: phoneNumber,
      settings: {
        _: 'codeSettings',
      },
    });

    console.log('\n2. Code sent! check your Telegram app.');
    const phoneCodeHash = sendCodeResult.phone_code_hash;
    const phoneCode = await askQuestion('Enter the code you received: ');

    const signInResult = await client.call('auth.signIn', {
      phone_number: phoneNumber,
      phone_code: phoneCode,
      phone_code_hash: phoneCodeHash,
    });

    console.log('\n3. Checking 2FA...');
    if (signInResult._ === 'auth.authorizationSignUpRequired') {
      const firstName = await askQuestion('Enter your first name: ');
      const lastName = await askQuestion('Enter your last name (optional): ');
      
      await client.call('auth.signUp', {
        phone_number: phoneNumber,
        phone_code: phoneCode,
        phone_code_hash: phoneCodeHash,
        first_name: firstName,
        last_name: lastName || '',
      });
      console.log('\nAccount created!');
    } else if (signInResult._ === 'auth.authorization') {
      console.log('\nSigned in successfully!');
    }

    if (signInResult.authorization._ === 'authorizationSignIn') {
      const password = await askQuestion('Enter your 2FA password: ');
      await client.call('auth.checkPassword', {
        password: password,
      });
      console.log('\n2FA passed!');
    }

    console.log('\nSession saved to: ' + TELEGRAM_SESSION + '.json');
    console.log('Deploy this file to Vercel for production use.\n');

    readline.close();
  } catch (error) {
    console.log('\nError:', error.message || error);
    readline.close();
  }
}

authenticate();
