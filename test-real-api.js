#!/usr/bin/env node

// Test script to help you connect to a real API
// Usage: node test-real-api.js [api-url]

const https = require('https');
const http = require('http');

const API_URL = process.argv[2] || 'http://localhost:3001';

// Test endpoints we need for the semantic debt app
const endpoints = [
  '/health',
  '/terms',
  '/sources',
  '/semantic-debt/metrics',
  '/semantic-debt/dashboard'
];

console.log(`🧪 Testing API connection to: ${API_URL}`);
console.log('=' .repeat(50));

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = API_URL + endpoint;
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            endpoint,
            status: res.statusCode,
            success: res.statusCode === 200,
            data: jsonData,
            url
          });
        } catch (e) {
          resolve({
            endpoint,
            status: res.statusCode,
            success: res.statusCode === 200,
            data: data.substring(0, 100) + '...',
            url,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        endpoint,
        status: null,
        success: false,
        error: err.message,
        url
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        endpoint,
        status: null,
        success: false,
        error: 'Timeout',
        url
      });
    });
  });
}

async function runTests() {
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);

    if (result.success) {
      console.log(`✅ ${endpoint}: ${result.status} - OK`);
      if (endpoint === '/semantic-debt/metrics' && result.data) {
        console.log(`   📊 Sample data keys: ${Object.keys(result.data).join(', ')}`);
      }
    } else {
      console.log(`❌ ${endpoint}: ${result.status || 'ERROR'} - ${result.error || 'Failed'}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('💡 To use a different API, run:');
  console.log('   node test-real-api.js https://your-api.com');
  console.log('\n📝 To update your frontend to use this API:');
  console.log('   1. Edit frontend/lib/api-config.ts');
  console.log('   2. Change the baseUrl to your API URL');
  console.log('   3. Restart the frontend: npm run dev');
}

runTests().catch(console.error);
