#!/usr/bin/env node

/**
 * Jargon Integration Test Script
 *
 * This script tests all configured data source integrations
 * Run with: node test-integrations.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(name, method, url, body = null) {
  try {
    console.log(`\n🔍 Testing ${name}...`);

    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (response.ok) {
      console.log(`✅ ${name}: SUCCESS`);
      return result;
    } else {
      console.log(`❌ ${name}: FAILED - ${response.status} ${response.statusText}`);
      console.log('   Error:', result);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return null;
  }
}

async function runIntegrationTests() {
  console.log('🚀 JARGON INTEGRATION TESTS');
  console.log('=' .repeat(50));

  // Test 1: Health Check
  const health = await testEndpoint('Health Check', 'GET', `${BASE_URL}/health`);
  if (!health) {
    console.log('\n❌ Server not responding. Make sure to start the server first:');
    console.log('   cd apps/gateway && node simple-server.js');
    return;
  }

  // Test 2: List Data Sources
  const sources = await testEndpoint('Data Sources', 'GET', `${BASE_URL}/sources`);
  if (sources && sources.length > 0) {
    console.log(`   Found ${sources.length} data sources:`);
    sources.forEach(source => {
      console.log(`     - ${source.name} (${source.kind})`);
    });
  }

  // Test 3: List Business Terms
  const terms = await testEndpoint('Business Terms', 'GET', `${BASE_URL}/terms`);
  if (terms && terms.length > 0) {
    console.log(`   Found ${terms.length} business terms`);
  }

  // Test 4: Test different data source types
  if (sources) {
    console.log('\n🔗 Testing Data Source Connections:');

    // Test PostgreSQL if available
    const postgresSource = sources.find(s => s.kind === 'sql');
    if (postgresSource) {
      console.log(`\n🗄️  Testing PostgreSQL (${postgresSource.name}):`);
      await testEndpoint(
        'PostgreSQL Query',
        'POST',
        `${BASE_URL}/execute`,
        {
          sourceId: postgresSource.id,
          object: 'customers',
          select: ['id', 'name'],
          limit: 2
        }
      );
    }

    // Test REST API if available
    const restSource = sources.find(s => s.kind === 'rest');
    if (restSource) {
      console.log(`\n🌐 Testing REST API (${restSource.name}):`);
      await testEndpoint(
        'REST API Query',
        'POST',
        `${BASE_URL}/execute`,
        {
          sourceId: restSource.id,
          object: 'users',
          limit: 2
        }
      );
    }

    // Test Salesforce if configured
    const sfSource = sources.find(s => s.kind === 'salesforce');
    if (sfSource) {
      console.log(`\n☁️  Testing Salesforce (${sfSource.name}):`);
      const sfResult = await testEndpoint(
        'Salesforce Query',
        'POST',
        `${BASE_URL}/execute`,
        {
          sourceId: sfSource.id,
          object: 'Account',
          select: ['Id', 'Name'],
          limit: 1
        }
      );

      if (!sfResult) {
        console.log('   💡 Note: Salesforce needs valid credentials to work');
        console.log('   Set SALESFORCE_INSTANCE_URL and SALESFORCE_ACCESS_TOKEN in .env');
      }
    }
  }

  // Test 5: Semantic Debt Metrics
  await testEndpoint('Semantic Debt Metrics', 'GET', `${BASE_URL}/semantic-debt/metrics`);

  console.log('\n' + '='.repeat(50));
  console.log('🎯 INTEGRATION TESTS COMPLETE');
  console.log('\n📚 Next Steps:');
  console.log('   1. Add more data sources via POST /sources');
  console.log('   2. Define business terms via POST /terms');
  console.log('   3. Create mapping rules via POST /rules');
  console.log('   4. Access admin UI at http://localhost:3000');
  console.log('\n📖 See README.md for detailed setup instructions');
}

// Run the tests
runIntegrationTests().catch(console.error);
