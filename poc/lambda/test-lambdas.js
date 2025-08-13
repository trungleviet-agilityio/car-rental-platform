#!/usr/bin/env node
/**
 * Test script for Lambda functions
 * Tests both mock and real scenarios
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configurations
const tests = [
    {
        name: 'Login Handler - Mock Mode',
        lambda: 'login_handler',
        env: { MOCK_MODE: 'true' },
        events: [
            {
              name: 'initiate_auth',
              body: { action: 'initiate_auth', phone_number: '+1234567890' }
            },
            {
              name: 'respond_to_challenge',
              body: { action: 'respond_to_challenge', session: 'mock_session', otp_code: '123456' }
            },
            {
              name: 'password_auth',
              body: { action: 'password', username: 'test@example.com', password: 'TestPass123!' }
            }
        ]
    },
    {
        name: 'Post Confirmation - Mock Mode',
        lambda: 'post_confirmation',
        env: { MOCK_MODE: 'true' },
        events: [
            {
                name: 'user_confirmation',
                body: {
                    request: {
                        userAttributes: {
                            sub: 'test-cognito-sub-123',
                            email: 'test@example.com',
                            phone_number: '+1234567890'
                        }
                    },
                    userName: 'test@example.com'
                }
            }
        ]
    },
    {
        name: 'KYC Validator - Mock Mode',
        lambda: 'kyc_validator',
        env: { MOCK_MODE: 'true', VALIDATION_DELAY_MS: '1000' },
        events: [
            {
                name: 'validate_document',
                body: {
                    cognitoSub: 'test-cognito-sub-123',
                    key: 'kyc/test-cognito-sub-123/1234567890-document.jpg'
                }
            }
        ]
    },
    {
        name: 'KYC Callback - Mock Mode',
        lambda: 'kyc_callback',
        env: { MOCK_MODE: 'true' },
        events: [
            {
                name: 'kyc_callback',
                body: {
                    cognitoSub: 'test-cognito-sub-123',
                    key: 'kyc/test-cognito-sub-123/1234567890-document.jpg',
                    status: 'verified'
                }
            }
        ]
    }
];

/**
 * Run a single test
 */
async function runTest(test) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log('='.repeat(50));
    
    const lambdaDir = path.join(__dirname, test.lambda);
    const handlerFile = test.lambda === 'login_handler' ? 'login_handler.js' : 'index.js';
    
    if (!fs.existsSync(path.join(lambdaDir, handlerFile))) {
        console.log(`❌ Handler file not found: ${handlerFile}`);
        return false;
    }
    
    let allPassed = true;
    
    for (const event of test.events) {
        console.log(`\n📝 Event: ${event.name}`);
        
        try {
            const result = await runLambdaEvent(lambdaDir, handlerFile, event.body, test.env);
            console.log('✅ Result:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.log('❌ Error:', error.message);
            allPassed = false;
        }
    }
    
    return allPassed;
}

/**
 * Run a Lambda event
 */
async function runLambdaEvent(lambdaDir, handlerFile, eventBody, env = {}) {
    return new Promise((resolve, reject) => {
        // Create a temporary test file
        const testContent = `
const handler = require('./${handlerFile}');

async function test() {
    // Different event formats for different lambda types
    const isApiGateway = ${handlerFile === 'login_handler.js'};
    const event = isApiGateway ? ${JSON.stringify({
        body: JSON.stringify(eventBody),
        headers: { 'Content-Type': 'application/json' }
    })} : ${JSON.stringify(eventBody)};
    
    const context = {
        getRemainingTimeInMillis: () => 30000,
        functionName: 'test-function',
        functionVersion: '1.0',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
        memoryLimitInMB: 128,
        awsRequestId: 'test-request-id'
    };
    
    try {
        const handlerName = ${handlerFile === 'login_handler.js' ? "'lambda_handler'" : "'handler'"};
        const result = await handler[handlerName](event, context);
        process.stdout.write('RESULT_START');
        process.stdout.write(JSON.stringify(result));
        process.stdout.write('RESULT_END');
    } catch (error) {
        process.stderr.write('ERROR: ' + error.message);
        process.exit(1);
    }
}

test();
`;
        
        const testFile = path.join(lambdaDir, 'test-runner.js');
        fs.writeFileSync(testFile, testContent);
        
        // Set environment variables
        const testEnv = { ...process.env, ...env };
        
        // Run the test
        const child = spawn('node', ['test-runner.js'], {
            cwd: lambdaDir,
            env: testEnv,
            stdio: 'pipe'
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('close', (code) => {
            // Clean up test file
            try {
                fs.unlinkSync(testFile);
            } catch (e) {
                // Ignore cleanup errors
            }
            
            if (code === 0) {
                try {
                    // Extract result between markers
                    const startMarker = 'RESULT_START';
                    const endMarker = 'RESULT_END';
                    const startIdx = stdout.indexOf(startMarker);
                    const endIdx = stdout.indexOf(endMarker);
                    
                    if (startIdx !== -1 && endIdx !== -1) {
                        const resultJson = stdout.substring(startIdx + startMarker.length, endIdx);
                        const result = JSON.parse(resultJson);
                        resolve(result);
                    } else {
                        reject(new Error(`Result markers not found in output: ${stdout}`));
                    }
                } catch (parseError) {
                    reject(new Error(`Failed to parse result: ${parseError.message}\nOutput: ${stdout}`));
                }
            } else {
                reject(new Error(`Process exited with code ${code}: ${stderr}`));
            }
        });
        
        child.on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * Main test runner
 */
async function main() {
    console.log('🚀 Starting Lambda function tests...\n');
    
    let totalTests = 0;
    let passedTests = 0;
    
    for (const test of tests) {
        totalTests++;
        const passed = await runTest(test);
        if (passed) {
            passedTests++;
        }
    }
    
    console.log('\n📊 Test Summary');
    console.log('='.repeat(50));
    console.log(`Total: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('\n❌ Some tests failed');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runTest, runLambdaEvent };
