#!/usr/bin/env node

// 🎯 DEMO: Testing Real API Connections
// This shows you how to connect your semantic debt app to different APIs

const https = require('https');
const http = require('http');

console.log('🚀 Semantic Debt App - Real API Connection Demo');
console.log('=' .repeat(60));

const API_TESTS = [
  {
    name: 'Mock Server (Current)',
    url: 'http://localhost:3001',
    description: 'Your current mock server with semantic debt endpoints'
  },
  {
    name: 'JSONPlaceholder (Public API)',
    url: 'https://jsonplaceholder.typicode.com',
    description: 'Free REST API for testing - posts can be mapped to terms',
    mapping: {
      '/posts': '→ /terms (business terms)',
      '/users': '→ /sources (data sources)',
      '/comments': '→ /rules (mapping rules)'
    }
  },
  {
    name: 'GitHub API (Real Example)',
    url: 'https://api.github.com',
    description: 'Real API example - GitHub issues and repos',
    mapping: {
      '/repos/vercel/next.js/issues': '→ /terms (business terms)',
      '/users/octocat/repos': '→ /sources (data sources)'
    }
  },
  {
    name: 'ReqRes API (User Data)',
    url: 'https://reqres.in/api',
    description: 'Mock user API for testing user/governance data',
    mapping: {
      '/users': '→ /terms (user definitions)',
      '/users': '→ /sources (user sources)'
    }
  }
];

async function testApi(apiConfig) {
  console.log(`\n📡 Testing: ${apiConfig.name}`);
  console.log(`   ${apiConfig.description}`);
  console.log(`   URL: ${apiConfig.url}`);

  if (apiConfig.mapping) {
    console.log('   🔗 Endpoint Mapping:');
    Object.entries(apiConfig.mapping).forEach(([from, to]) => {
      console.log(`      ${from} ${to}`);
    });
  }

  // Test basic connectivity
  try {
    const client = apiConfig.url.startsWith('https') ? https : http;
    const response = await new Promise((resolve, reject) => {
      const req = client.get(apiConfig.url, { timeout: 5000 }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });

    console.log(`   ✅ Connected! Status: ${response.status}`);

    if (response.status === 200) {
      try {
        const jsonData = JSON.parse(response.data);
        if (Array.isArray(jsonData)) {
          console.log(`   📊 Found ${jsonData.length} items`);
          if (jsonData.length > 0) {
            console.log(`   🔍 Sample keys: ${Object.keys(jsonData[0]).join(', ')}`);
          }
        } else {
          console.log(`   📊 Response keys: ${Object.keys(jsonData).join(', ')}`);
        }
      } catch (e) {
        console.log(`   📄 Raw response: ${response.data.substring(0, 100)}...`);
      }
    }

  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
  }
}

async function runDemo() {
  for (const api of API_TESTS) {
    await testApi(api);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 HOW TO SWITCH YOUR APP TO A REAL API:');
  console.log('=' .repeat(60));

  console.log('\n1️⃣  Edit: frontend/lib/api-config.ts');
  console.log('   Uncomment one of the API configurations at the top');

  console.log('\n2️⃣  Example - Switch to JSONPlaceholder:');
  console.log('   // Change this line:');
  console.log('   // baseUrl: \'http://localhost:3001\',');
  console.log('   // To this:');
  console.log('   // baseUrl: \'https://jsonplaceholder.typicode.com\',');

  console.log('\n3️⃣  Update endpoint mapping:');
  console.log('   terms: \'/posts\',  // Maps posts to business terms');
  console.log('   sources: \'/users\', // Maps users to data sources');

  console.log('\n4️⃣  Restart your frontend:');
  console.log('   cd frontend && npm run dev');

  console.log('\n5️⃣  Test the connection:');
  console.log('   node test-real-api.js https://your-api.com');

  console.log('\n' + '='.repeat(60));
  console.log('💡 PRO TIPS:');
  console.log('• Start with simple APIs like JSONPlaceholder');
  console.log('• Use the test script to verify endpoints work');
  console.log('• Add error handling for API failures');
  console.log('• Consider API rate limits and authentication');
  console.log('• Test with your production API endpoints');

  console.log('\n🚀 Ready to connect to your real API? Let\'s do it!');
}

runDemo().catch(console.error);
