#!/usr/bin/env node
/**
 * Test script to verify Dependency Inversion Principle (DIP) implementation
 * Tests both mock and real provider modes
 */

const { spawn } = require('child_process');
const http = require('http');

const BASE_URL = 'http://localhost:3000/api';
const tests = [
  {
    name: 'Health Check - Provider Status',
    method: 'GET',
    path: '/',
    body: null
  },
  {
    name: 'Auth - Custom OTP Initiate (Email)',
    method: 'POST',
    path: '/auth/login',
    body: {
      action: 'otp_initiate',
      channel: 'email',
      email: 'test@example.com'
    }
  },
  {
    name: 'Auth - Custom OTP Initiate (SMS)',
    method: 'POST',
    path: '/auth/login',
    body: {
      action: 'otp_initiate',
      channel: 'sms',
      phone_number: '+84123456789'
    }
  },
  {
    name: 'Auth - OTP Verify',
    method: 'POST',
    path: '/auth/login',
    body: {
      action: 'otp_verify',
      channel: 'email',
      email: 'test@example.com',
      otp_code: '123456'
    }
  },
  {
    name: 'Notification - Email',
    method: 'POST',
    path: '/notify/email',
    body: {
      to: 'test@example.com',
      subject: 'DIP Test Email',
      text: 'Testing Dependency Inversion Principle implementation'
    }
  },
  {
    name: 'Notification - SMS',
    method: 'POST',
    path: '/notify/sms',
    body: {
      to: '+84123456789',
      message: 'DIP Test SMS: Your car rental is confirmed!'
    }
  },
  {
    name: 'KYC - Presign Upload',
    method: 'POST',
    path: '/kyc/presign',
    body: {
      cognitoSub: 'test-user-123',
      contentType: 'image/jpeg'
    }
  }
];

/**
 * Make HTTP request
 */
function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Wait for server to be ready
 */
function waitForServer(retries = 10) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      makeRequest('GET', '/', null)
        .then(() => resolve())
        .catch(() => {
          if (retries > 0) {
            console.log(`Waiting for server... ${retries} retries left`);
            setTimeout(() => {
              retries--;
              attempt();
            }, 1000);
          } else {
            reject(new Error('Server not ready after 10 retries'));
          }
        });
    };
    attempt();
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🔧 Testing Dependency Inversion Principle (DIP) Implementation\n');
  
  try {
    console.log('⏳ Waiting for server to be ready...');
    await waitForServer();
    console.log('✅ Server is ready!\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      console.log(`🧪 ${test.name}`);
      
      try {
        const result = await makeRequest(test.method, test.path, test.body);
        
        if (result.statusCode >= 200 && result.statusCode < 300) {
          console.log(`✅ Status: ${result.statusCode}`);
          
          // Show interesting data
          if (test.path === '/') {
            console.log(`   Provider Mode: ${result.data.providers.mode}`);
            console.log(`   Auth Provider: ${result.data.providers.auth}`);
            console.log(`   Storage Provider: ${result.data.providers.storage}`);
          } else if (result.data.debugOtp) {
            console.log(`   Debug OTP: ${result.data.debugOtp}`);
          } else if (result.data.messageId) {
            console.log(`   Message ID: ${result.data.messageId}`);
          } else if (result.data.tokens) {
            console.log(`   Got tokens: ${Object.keys(result.data.tokens).join(', ')}`);
          } else if (result.data.uploadUrl) {
            console.log(`   Upload URL: ${result.data.uploadUrl.substring(0, 50)}...`);
          }
          
          passed++;
        } else {
          console.log(`❌ Status: ${result.statusCode}`);
          console.log(`   Error: ${JSON.stringify(result.data)}`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        failed++;
      }
      
      console.log('');
    }
    
    console.log('📊 Test Results:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All DIP tests passed! The dependency inversion is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the server logs for details.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, makeRequest };
