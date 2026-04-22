const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET');
    
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection SUCCESSFUL');
    process.exit(0);
  } catch (e) {
    console.log('❌ Database connection FAILED');
    console.log('Error:', e.message);
    process.exit(1);
  }
}

testConnection();
