#!/usr/bin/env node

/**
 * Post-deployment smoke test script
 * Usage: node scripts/smoke-test.mjs <deployment-url>
 */

import https from 'https';
import http from 'http';

const deploymentUrl = process.argv[2];
if (!deploymentUrl) {
  console.error('❌ Please provide deployment URL');
  console.log('Usage: node scripts/smoke-test.mjs <deployment-url>');
  process.exit(1);
}

const baseUrl = deploymentUrl.startsWith('http') ? deploymentUrl : `https://${deploymentUrl}`;

function makeRequest(url, description) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    console.log(`🔍 Testing: ${description}`);
    console.log(`   URL: ${url}`);
    
    const req = client.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`   ✅ ${res.statusCode} - ${description}`);
          resolve({ status: res.statusCode, data });
        } else {
          console.log(`   ❌ ${res.statusCode} - ${description}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error - ${description}: ${error.message}`);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log(`   ❌ Timeout - ${description}`);
      reject(new Error('Request timeout'));
    });
  });
}

async function runSmokeTests() {
  console.log('🧪 Sprint 2.6.1 Smoke Tests');
  console.log(`Testing: ${baseUrl}\n`);
  
  const tests = [
    { url: `${baseUrl}/`, description: 'Home page' },
    { url: `${baseUrl}/dashboard`, description: 'Dashboard' },
    { url: `${baseUrl}/projects`, description: 'Projects page' },
    { url: `${baseUrl}/board`, description: 'Kanban board' },
    { url: `${baseUrl}/daily`, description: 'Daily planner' },
    { url: `${baseUrl}/completed`, description: 'Completed tasks' },
    { url: `${baseUrl}/activity`, description: 'Activity feed' },
    { url: `${baseUrl}/chat`, description: 'Chat interface' },
    { url: `${baseUrl}/summary`, description: 'Daily summary' },
    { url: `${baseUrl}/api/maintenance/archive-completed`, description: 'Cron endpoint' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await makeRequest(test.url, test.description);
      passed++;
    } catch (error) {
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All smoke tests passed! Deployment is healthy.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the deployment for issues.');
    process.exit(1);
  }
}

runSmokeTests().catch(console.error);
