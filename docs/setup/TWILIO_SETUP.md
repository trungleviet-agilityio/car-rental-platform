# 📱 Twilio Integration Setup Guide

This guide will help you switch from mock phone verification to real Twilio integration.

## 🔧 Prerequisites

- Twilio account (free trial available)
- Phone number for testing
- Access to receive SMS messages

## 📋 Step-by-Step Setup

### 1. **Create Twilio Account**

1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free account
3. Verify your email and phone number
4. Complete the getting started flow

### 2. **Get Your Credentials**

From the Twilio Console Dashboard, copy these values:

- **Account SID**: Found on dashboard (starts with `AC...`)
- **Auth Token**: Found on dashboard (click "View" to reveal)

### 3. **Create Verify Service**

1. In Twilio Console, navigate to **Verify** → **Services**
2. Click **"Create new Service"**
3. Enter service name: `Car Rental Platform`
4. Leave other settings as default
5. Click **"Create"**
6. Copy the **Service SID** (starts with `VA...`)

### 4. **Configure Environment Variables**

Edit your `.env` file and update these values:

```bash
# =================
# TWILIO CONFIG  
# =================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# =================
# SERVICE PROVIDERS (IMPORTANT!)
# =================
NOTIFICATION_PROVIDER=twilio
```

### 5. **Test Configuration**

Run this command to verify your Twilio credentials:

```bash
# Test Twilio connection
curl -X POST "https://verify.twilio.com/v2/Services/YOUR_SERVICE_SID/Verifications" \
  -d "To=+1234567890" \
  -d "Channel=sms" \
  -u "YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN"
```

## 🚀 **Testing the Integration**

### **Start the Server**

```bash
# Make sure you're using the updated .env file
npm run start:dev
```

### **Test Phone Verification**

```bash
# 1. Register a user with your real phone number
curl -X POST http://localhost:3000/api/v1/auth/signup/start \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "Password123!",
    "firstName": "Your",
    "lastName": "Name",
    "phoneNumber": "+1234567890"
  }'

# 2. Check your phone for the SMS verification code
# You should receive a real SMS with a 6-digit code

# 3. Verify the code (you'll need to get the user ID from step 1)
curl -X POST http://localhost:3000/api/v1/auth/phone/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "code": "123456"
  }'
```

## 📱 **Phone Number Format**

- **US/Canada**: `+1234567890`
- **UK**: `+447123456789`  
- **Vietnam**: `+84987654321`
- **General**: `+[country_code][phone_number]`

**Important**: Use your real phone number in E.164 format!

## 🔧 **Troubleshooting**

### **Common Issues**

1. **"Invalid credentials"**
   ```bash
   # Verify your Account SID and Auth Token are correct
   # Check there are no extra spaces or characters
   ```

2. **"Service not found"**
   ```bash
   # Verify your Verify Service SID is correct
   # Make sure the service is active in Twilio Console
   ```

3. **"Phone number not verified"**
   ```bash
   # For trial accounts, you can only send to verified phone numbers
   # Add your phone number to verified numbers in Twilio Console
   ```

4. **"Insufficient funds"**
   ```bash
   # Free trial has limited credits
   # Each SMS costs about $0.0075
   # Add payment method for continued testing
   ```

### **Debug Mode**

Enable detailed logging by setting:

```bash
LOG_LEVEL=debug
```

Then check the server logs for detailed Twilio API calls.

## 💰 **Twilio Pricing**

- **Free Trial**: $15.50 credit
- **SMS Cost**: ~$0.0075 per message
- **Voice Call**: ~$0.013 per minute
- **Verify Service**: Additional $0.05 per verification

## 🔒 **Security Best Practices**

1. **Never commit credentials to Git**
   ```bash
   # .env is already in .gitignore
   # Double-check your credentials aren't in code
   ```

2. **Use environment variables**
   ```bash
   # Always load from .env file
   # Never hardcode credentials
   ```

3. **Rotate credentials regularly**
   ```bash
   # Generate new Auth Token in Twilio Console periodically
   ```

## 🎯 **Next Steps**

Once Twilio is working:

1. Test the complete onboarding flow
2. Try with different phone numbers
3. Test with international numbers
4. Set up webhook endpoints for delivery status
5. Implement rate limiting for abuse prevention

## 📞 **Support**

- **Twilio Docs**: https://www.twilio.com/docs/verify
- **Console**: https://console.twilio.com/
- **Support**: https://support.twilio.com/

---

**Ready to test? Update your `.env` file and restart the server!** 🚀
