#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Validates that all required environment variables are set
 */

const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'DATABASE_URL'
];

const optionalEnvVars = [
  'OPENAI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('🔍 Environment Variables Check\n');

let hasErrors = false;

// Check required variables
console.log('Required Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`  ❌ ${varName}: Missing`);
    hasErrors = true;
  } else if (varName === 'NEXTAUTH_SECRET' && value === 'your-secret-key-here') {
    console.log(`  ⚠️  ${varName}: Using placeholder value`);
    hasErrors = true;
  } else if (varName === 'NEXTAUTH_URL' && value === 'http://localhost:3000') {
    console.log(`  ⚠️  ${varName}: Using localhost (may need production URL)`);
  } else if (varName === 'DATABASE_URL' && value.includes('dummy')) {
    console.log(`  ⚠️  ${varName}: Using dummy value (database not configured)`);
    hasErrors = true;
  } else {
    console.log(`  ✅ ${varName}: Set`);
  }
});

// Check optional variables
console.log('\nOptional Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`  ⚪ ${varName}: Not set`);
  } else {
    console.log(`  ✅ ${varName}: Set`);
  }
});

if (hasErrors) {
  console.log('\n❌ Environment validation failed!');
  console.log('\nTo fix this:');
  console.log('1. Set NEXTAUTH_SECRET: openssl rand -base64 32');
  console.log('2. Set NEXTAUTH_URL: https://your-app.vercel.app');
  console.log('3. Set DATABASE_URL: your-postgres-connection-string');
  console.log('\nFor Vercel deployment:');
  console.log('- Go to Vercel Dashboard → Project → Settings → Environment Variables');
  console.log('- Add the required variables for Production environment');
  process.exit(1);
} else {
  console.log('\n✅ Environment validation passed!');
}