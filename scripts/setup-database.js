#!/usr/bin/env node

/**
 * Database Setup Script for LexChronos
 * Handles Prisma migrations, seeding, and database initialization
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 LexChronos Database Setup');
console.log('============================');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.error('📋 Please copy .env.example to .env.local and configure your database URL');
  process.exit(1);
}

// Read environment file to check DATABASE_URL
const envContent = fs.readFileSync(envPath, 'utf8');
if (!envContent.includes('DATABASE_URL=') || envContent.includes('username:password@localhost')) {
  console.error('❌ DATABASE_URL not properly configured!');
  console.error('📋 Please update DATABASE_URL in .env.local with your actual database credentials');
  process.exit(1);
}

try {
  console.log('📝 Step 1: Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('🗄️ Step 2: Checking database connection...');
  execSync('npx prisma db pull --print', { stdio: 'pipe' });

  console.log('🔄 Step 3: Running database migrations...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('🌱 Step 4: Seeding database (if seeding exists)...');
  try {
    execSync('npx prisma db seed', { stdio: 'inherit' });
  } catch (error) {
    console.log('ℹ️ No seeding script found, continuing...');
  }

  console.log('✅ Database setup completed successfully!');
  console.log('🎯 You can now start the application with: npm run dev');

} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  
  // Provide helpful error messages
  if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
    console.error('💡 Troubleshooting:');
    console.error('  - Check if your database server is running');
    console.error('  - Verify DATABASE_URL in .env.local');
    console.error('  - Ensure database credentials are correct');
  }
  
  process.exit(1);
}