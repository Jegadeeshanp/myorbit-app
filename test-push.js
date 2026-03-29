const { sendToToken } = require('./lib/firebase-admin');
const { prisma } = require('./lib/prisma');

async function run() {
  const record = await prisma.pushToken.findFirst();

  if (!record?.token) {
    throw new Error('❌ Token missing');
  }

  console.log('✅ Token found:', record.token);

  await sendToToken(record.token, {
    title: '🔥 Test Notification',
    body: 'If you see this, push notifications work!',
    url: '/orbit/tasks',
  });

  console.log('✅ Notification sent');
}

run().catch(console.error);