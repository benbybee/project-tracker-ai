#!/usr/bin/env node

/**
 * OpenAI Connection Test Script
 * Tests if your OpenAI API key is valid and working
 */

import OpenAI from 'openai';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const API_KEY = process.env.OPENAI_API_KEY;

console.log('\n🔍 OpenAI Connection Diagnostic\n');
console.log('================================\n');

// Step 1: Check if API key exists
if (!API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is not set');
  console.log('\n📝 Action Required:');
  console.log('   1. Create a .env.local file in your project root');
  console.log('   2. Add: OPENAI_API_KEY=sk-your-actual-key-here');
  console.log('   3. Get a key from: https://platform.openai.com/api-keys\n');
  process.exit(1);
}

// Step 2: Check API key format
console.log(`✓ API Key found`);
console.log(`  Prefix: ${API_KEY.substring(0, 10)}...`);
console.log(`  Length: ${API_KEY.length} characters`);

if (!API_KEY.startsWith('sk-')) {
  console.error('\n❌ Invalid API key format (should start with "sk-")');
  process.exit(1);
}

console.log(`  Format: Valid\n`);

// Step 3: Test API connection
console.log('Testing OpenAI API connection...\n');

try {
  const openai = new OpenAI({ apiKey: API_KEY });
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'user', content: 'Respond with just "OK" if you receive this.' }
    ],
    max_tokens: 10,
  });

  const reply = response.choices[0]?.message?.content;
  
  if (reply) {
    console.log('✅ SUCCESS! OpenAI API is working correctly');
    console.log(`   Model: ${response.model}`);
    console.log(`   Response: "${reply}"`);
    console.log(`   Usage: ${response.usage?.total_tokens || 0} tokens\n`);
    console.log('🎉 Your API key is valid and working!\n');
    process.exit(0);
  } else {
    console.error('❌ API returned empty response');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ FAILED to connect to OpenAI API\n');
  
  if (error.status === 401) {
    console.error('🔑 Authentication Error (401)');
    console.log('\n📝 Your API key is invalid or expired.');
    console.log('   Actions:');
    console.log('   1. Go to https://platform.openai.com/api-keys');
    console.log('   2. Create a new API key');
    console.log('   3. Update your .env.local file');
    console.log('   4. Update Vercel environment variables\n');
  } else if (error.status === 429) {
    console.error('⏱️  Rate Limit Error (429)');
    console.log('\n📝 You have exceeded your API rate limit or quota.');
    console.log('   Actions:');
    console.log('   1. Check your OpenAI account billing');
    console.log('   2. Add credits if needed');
    console.log('   3. Wait a few minutes and try again\n');
  } else if (error.status === 403) {
    console.error('🚫 Permission Error (403)');
    console.log('\n📝 Your API key lacks necessary permissions.');
    console.log('   Actions:');
    console.log('   1. Check if your OpenAI account is active');
    console.log('   2. Verify billing is set up');
    console.log('   3. Create a new API key\n');
  } else {
    console.error(`❓ Error: ${error.message}`);
    console.log(`   Status: ${error.status || 'unknown'}`);
    console.log(`   Type: ${error.type || 'unknown'}`);
    console.log(`   Code: ${error.code || 'unknown'}\n`);
  }
  
  console.log('Full error details:');
  console.log(JSON.stringify({
    message: error.message,
    status: error.status,
    type: error.type,
    code: error.code,
  }, null, 2));
  console.log('\n');
  
  process.exit(1);
}

