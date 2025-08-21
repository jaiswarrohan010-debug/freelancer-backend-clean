# SurePaaS API Testing Guide

This guide will help you test your SurePaaS sandbox API to ensure it's working correctly before integrating it into your application.

## Files Created

1. **`test-surepaas-api.js`** - Main test script
2. **`test-package.json`** - Dependencies for the test script
3. **`app/utils/surepaas.js`** - Integration utility for your React Native app
4. **`SUREPAAS_TEST_README.md`** - This guide

## Setup Instructions

### Step 1: Install Dependencies

```bash
# Install axios for the test script
npm install axios

# Or if you want to use the test-package.json
npm install --package-lock-only
npm install
```

### Step 2: Configure Your SurePaaS Credentials

Edit the `test-surepaas-api.js` file and update the `SUREPAAS_CONFIG` object with your actual credentials:

```javascript
const SUREPAAS_CONFIG = {
  baseURL: 'https://sandbox.surepaas.com/api', // Your actual SurePaaS sandbox URL
  apiKey: 'your_actual_api_key_here',
  secretKey: 'your_actual_secret_key_here',
  merchantId: 'your_merchant_id_here'
};
```

### Step 3: Run the Test

```bash
node test-surepaas-api.js
```

## What the Test Script Does

The test script will perform the following tests:

1. **Connectivity Test** - Checks if the API is reachable
2. **Payment Initiation Test** - Tests creating a new payment
3. **Payment Status Test** - Checks payment status using the order ID
4. **Webhook Verification Test** - Tests webhook functionality

## Expected Output

If everything is working correctly, you should see output like:

```
SurePaaS Sandbox API Tester
============================

🚀 Starting SurePaaS API Tests...

🔍 Testing SurePaaS API connectivity...
✅ Connectivity test passed: { status: 'ok' }

💳 Testing payment initiation...
✅ Payment initiation test passed: { orderId: 'TEST_1234567890', paymentUrl: '...' }

📊 Testing payment status check...
✅ Payment status test passed: { status: 'PENDING', orderId: 'TEST_1234567890' }

🔗 Testing webhook verification...
✅ Webhook verification test passed: { verified: true }

🎉 All tests completed!
```

## Troubleshooting

### Common Issues

1. **"Please update the SUREPAAS_CONFIG"**
   - Make sure you've updated the configuration with your actual credentials

2. **"Connectivity test failed"**
   - Check your internet connection
   - Verify the base URL is correct
   - Ensure your API key is valid

3. **"Payment initiation test failed"**
   - Verify your merchant ID is correct
   - Check if your account is activated in sandbox mode
   - Ensure all required fields are provided

4. **"401 Unauthorized"**
   - Check your API key and secret key
   - Verify your merchant ID

### API Endpoint Adjustments

The test script uses common API endpoints, but you may need to adjust them based on SurePaaS's actual API documentation:

- `/health` - Health check endpoint
- `/payments/initiate` - Payment initiation
- `/payments/status/{orderId}` - Payment status check
- `/payments/refund` - Refund processing
- `/webhooks/verify` - Webhook verification

## Integration into Your App

Once the tests pass, you can integrate SurePaaS into your React Native app using the `app/utils/surepaas.js` utility:

```javascript
import surePaaSService from './utils/surepaas';

// Example usage in your payment component
const handlePayment = async () => {
  try {
    const paymentData = {
      amount: surePaaSService.formatAmount(100), // ₹100 in paise
      currency: 'INR',
      orderId: surePaaSService.generateOrderId(),
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '9876543210',
      description: 'Payment for job completion',
      returnUrl: 'https://your-app.com/payment-success',
      cancelUrl: 'https://your-app.com/payment-cancel'
    };

    const result = await surePaaSService.initiatePayment(paymentData);
    console.log('Payment initiated:', result);
    
    // Redirect user to payment URL or handle as needed
    if (result.paymentUrl) {
      // Open payment URL in WebView or browser
    }
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

## Security Notes

- Never commit your actual API credentials to version control
- Use environment variables for production
- Implement proper webhook signature verification
- Always validate payment responses on your server

## Next Steps

After successful testing:

1. Update the `app/utils/surepaas.js` file with your actual credentials
2. Integrate the payment flow into your job payment components
3. Set up webhook endpoints on your server
4. Test the complete payment flow in your app
5. Move to production when ready

## Support

If you encounter issues:

1. Check SurePaaS's official documentation
2. Verify your sandbox account status
3. Contact SurePaaS support with your merchant ID
4. Check the API response details for specific error messages
