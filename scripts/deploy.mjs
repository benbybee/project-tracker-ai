#!/usr/bin/env node

/**
 * Deployment automation script for Sprint 2.6.1
 * Usage: node scripts/deploy.mjs [--dry-run]
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const isDryRun = process.argv.includes('--dry-run');

function runCommand(command, description) {
  console.log(`\n🔧 ${description}`);
  console.log(`   Command: ${command}`);

  if (isDryRun) {
    console.log('   [DRY RUN] - Command not executed');
    return;
  }

  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30000,
    });
    console.log('   ✅ Success');
    if (output.trim()) {
      console.log(`   Output: ${output.trim()}`);
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    throw error;
  }
}

function checkFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }
}

async function main() {
  console.log('🚀 Sprint 2.6.1 Deployment Script');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE DEPLOYMENT'}`);

  try {
    // Pre-flight checks
    console.log('\n📋 Pre-flight Checks');
    checkFileExists('package.json');
    checkFileExists('drizzle.config.ts');
    checkFileExists('vercel.json');
    checkFileExists('src/server/db/migrations/0001_overconfident_joystick.sql');
    console.log('   ✅ All required files present');

    // Check environment variables
    console.log('\n🔍 Environment Check');
    const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      console.log(
        `   ⚠️  Missing environment variables: ${missingVars.join(', ')}`
      );
      console.log('   Note: These should be set in Vercel dashboard');
    } else {
      console.log('   ✅ Required environment variables present');
    }

    // Database migration
    console.log('\n🗄️  Database Migration');
    runCommand('npx drizzle-kit push', 'Apply database migrations');

    // Build test
    console.log('\n🏗️  Build Test');
    runCommand('npm run build', 'Test production build');

    // Git operations
    console.log('\n📝 Git Operations');
    runCommand('git add .', 'Stage all changes');
    runCommand(
      'git commit -m "Sprint 2.6.1 - Deploy preparation"',
      'Commit changes'
    );
    runCommand(
      'git tag -a v2.6.1 -m "Sprint 2.6.1 — UX & Workflow Enhancements"',
      'Create version tag'
    );
    runCommand('git push --tags', 'Push tags to remote');

    // Vercel deployment
    console.log('\n🚀 Vercel Deployment');
    runCommand(
      'VERCEL_FORCE_NO_BUILD_CACHE=1 vercel --prod',
      'Deploy to Vercel (clean build)'
    );

    console.log('\n✅ Deployment completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run smoke tests on your deployed URL');
    console.log('2. Check Vercel function logs for any errors');
    console.log('3. Monitor database performance');
    console.log('4. Test all new features');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check all environment variables are set');
    console.log('2. Verify database connection');
    console.log('3. Ensure all dependencies are installed');
    console.log('4. Check for TypeScript/build errors');
    process.exit(1);
  }
}

main().catch(console.error);
