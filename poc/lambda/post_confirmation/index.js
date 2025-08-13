/**
 * Post-Confirmation Lambda for Cognito User Pool
 * Triggered after a user confirms their signup
 * Syncs user data to the backend NestJS service
 */

const https = require('https');
const http = require('http');

// Environment configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';
const MOCK_MODE = process.env.MOCK_MODE === 'true';

/**
 * Lambda handler for post-confirmation trigger
 */
exports.handler = async (event, context) => {
    console.log('Post-confirmation event:', JSON.stringify(event, null, 2));
    
    try {
        // Extract user information from Cognito event
        const cognitoSub = event.request.userAttributes.sub;
        const email = event.request.userAttributes.email;
        const phoneNumber = event.request.userAttributes.phone_number;
        const username = event.userName;
        
        console.log(`Syncing user: ${username} (${cognitoSub})`);
        
        // In mock mode, just log and return
        if (MOCK_MODE) {
            console.log('Mock mode: simulating user sync');
            return event;
        }
        
        // Prepare user sync payload
        const syncPayload = {
            cognitoSub,
            username,
            email,
            phoneNumber
        };
        
        // Call backend user sync endpoint
        const syncResult = await callBackendSync(syncPayload);
        console.log('User sync result:', syncResult);
        
        return event;
        
    } catch (error) {
        console.error('Error in post-confirmation handler:', error);
        // Don't throw error - this would prevent user confirmation
        // Just log and continue
        return event;
    }
};

/**
 * Call backend user sync endpoint
 */
async function callBackendSync(payload) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);
        const url = new URL(`${BACKEND_URL}/users/sync`);
        
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Lambda/PostConfirmation'
            },
            timeout: 10000
        };
        
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(response);
                    } else {
                        console.error(`Backend sync failed with status ${res.statusCode}:`, data);
                        resolve({ error: `HTTP ${res.statusCode}`, body: data });
                    }
                } catch (parseError) {
                    console.error('Failed to parse backend response:', parseError);
                    resolve({ error: 'Parse error', body: data });
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('Request error:', error);
            resolve({ error: error.message });
        });
        
        req.on('timeout', () => {
            console.error('Request timeout');
            req.destroy();
            resolve({ error: 'Timeout' });
        });
        
        req.write(postData);
        req.end();
    });
}
