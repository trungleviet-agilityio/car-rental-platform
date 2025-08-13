/**
 * KYC Callback Lambda for Step Functions
 * Called at the end of KYC validation workflow
 * Updates user KYC status in the backend
 */

const https = require('https');
const http = require('http');

// Environment configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';
const MOCK_MODE = process.env.MOCK_MODE === 'true';

/**
 * Lambda handler for KYC callback
 */
exports.handler = async (event, context) => {
    console.log('KYC callback event:', JSON.stringify(event, null, 2));
    
    try {
        // Extract KYC validation result from Step Functions event
        const cognitoSub = event.cognitoSub;
        const key = event.key;
        const status = event.status || 'verified'; // Default to verified for PoC
        
        if (!cognitoSub || !key) {
            throw new Error('Missing required fields: cognitoSub, key');
        }
        
        console.log(`Updating KYC status for user ${cognitoSub}: ${status}`);
        
        // In mock mode, just return success
        if (MOCK_MODE) {
            console.log('Mock mode: simulating KYC status update');
            return {
                statusCode: 200,
                body: {
                    cognitoSub,
                    kycStatus: status,
                    key
                }
            };
        }
        
        // Prepare KYC callback payload
        const callbackPayload = {
            cognitoSub,
            key,
            status
        };
        
        // Call backend KYC callback endpoint
        const callbackResult = await callBackendKycCallback(callbackPayload);
        console.log('KYC callback result:', callbackResult);
        
        return {
            statusCode: 200,
            body: callbackResult
        };
        
    } catch (error) {
        console.error('Error in KYC callback handler:', error);
        return {
            statusCode: 500,
            body: {
                error: error.message
            }
        };
    }
};

/**
 * Call backend KYC callback endpoint
 */
async function callBackendKycCallback(payload) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);
        const url = new URL(`${BACKEND_URL}/kyc/callback`);
        
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Lambda/KycCallback'
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
                        console.error(`Backend KYC callback failed with status ${res.statusCode}:`, data);
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
