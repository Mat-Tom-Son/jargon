#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testAuth() {
  console.log('🧪 Testing JWT Authentication...\n');
  
  try {
    // Test 1: Login with correct credentials
    console.log('1. Testing login with admin/admin...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log(`   Token: ${loginData.token.substring(0, 20)}...`);
    console.log(`   User: ${loginData.user.username} (${loginData.user.role})\n`);
    
    // Test 2: Verify token
    console.log('2. Testing token verification...');
    const verifyResponse = await fetch(`${BASE_URL}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    if (!verifyResponse.ok) {
      throw new Error(`Token verification failed: ${verifyResponse.status}`);
    }
    
    const verifyData = await verifyResponse.json();
    console.log('✅ Token verification successful');
    console.log(`   Valid: ${verifyData.valid}`);
    console.log(`   User: ${verifyData.user.username}\n`);
    
    // Test 3: Test protected endpoint (if any exist)
    console.log('3. Testing API access with token...');
    const apiResponse = await fetch(`${BASE_URL}/health`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    if (!apiResponse.ok) {
      throw new Error(`API access failed: ${apiResponse.status}`);
    }
    
    console.log('✅ API access with token successful\n');
    
    // Test 4: Test invalid credentials
    console.log('4. Testing invalid credentials...');
    const badLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrong' })
    });
    
    if (badLoginResponse.ok) {
      throw new Error('Login should have failed with wrong password');
    }
    
    console.log('✅ Invalid credentials properly rejected\n');
    
    console.log('🎉 All authentication tests passed!');
    console.log('\n📋 Quick Usage:');
    console.log('   1. Set JWT_SECRET environment variable');
    console.log('   2. POST /auth/login with {"username":"admin","password":"admin"}');
    console.log('   3. Use returned token in Authorization: Bearer <token> header');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the gateway server is running on port 3001');
    console.log('   cd apps/gateway && npm run dev');
  }
}

testAuth();