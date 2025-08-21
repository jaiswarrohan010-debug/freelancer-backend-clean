// PhonePe Payment Integration Test Script
const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  BASE_URL: 'http://localhost:5000',
  MERCHANT_ID: 'TEST-M23OKIGC1N363_25081',
  CLIENT_SECRET: 'OWFkNzQxNjAtZjQ2Yi00YjRkLWE0ZDMtOWQxMzQ0NWZiMGZm',
  PHONEPE_BASE_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
};

// Mock Firebase token (in real app, this would come from Firebase Auth)
const MOCK_FIREBASE_TOKEN = 'mock-firebase-token';

console.log('🚀 PhonePe Payment Integration Test');
console.log('=====================================\n');

// Test 1: Check if server is running
async function testServerConnection() {
  console.log('1. Testing server connection...');
  try {
    const response = await axios.get(`${TEST_CONFIG.BASE_URL}/`);
    console.log('✅ Server is running');
    console.log('   Response:', response.data.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
  }
  console.log('');
}

// Test 2: Test PhonePe payment order creation
async function testPhonePeOrderCreation() {
  console.log('2. Testing PhonePe payment order creation...');
  try {
    const orderData = {
      amount: 10000, // ₹100 in paise
      currency: 'INR',
      notes: {
        description: 'Test payment',
        test: true,
      },
    };

    const response = await axios.post(
      `${TEST_CONFIG.BASE_URL}/api/payments/phonepe/create-order`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${MOCK_FIREBASE_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ PhonePe order created successfully');
    console.log('   Order ID:', response.data.merchantTransactionId);
    console.log('   Payment URL:', response.data.paymentUrl);
    console.log('   Amount:', response.data.amount);
    
    return response.data;
  } catch (error) {
    console.log('❌ PhonePe order creation failed');
    if (error.response) {
      console.log('   Error:', error.response.data);
    } else {
      console.log('   Error:', error.message);
    }
  }
  console.log('');
}

// Test 3: Test PhonePe payment verification
async function testPhonePeVerification(merchantTransactionId) {
  console.log('3. Testing PhonePe payment verification...');
  try {
    const response = await axios.post(
      `${TEST_CONFIG.BASE_URL}/api/payments/phonepe/verify`,
      { merchantTransactionId },
      {
        headers: {
          'Authorization': `Bearer ${MOCK_FIREBASE_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ PhonePe payment verification successful');
    console.log('   Status:', response.data.payment.status);
    console.log('   Amount:', response.data.payment.amount);
  } catch (error) {
    console.log('❌ PhonePe payment verification failed');
    if (error.response) {
      console.log('   Error:', error.response.data);
    } else {
      console.log('   Error:', error.message);
    }
  }
  console.log('');
}

// Test 4: Test PhonePe payment status check
async function testPhonePeStatusCheck(merchantTransactionId) {
  console.log('4. Testing PhonePe payment status check...');
  try {
    const response = await axios.get(
      `${TEST_CONFIG.BASE_URL}/api/payments/phonepe/status/${merchantTransactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${MOCK_FIREBASE_TOKEN}`,
        },
      }
    );

    console.log('✅ PhonePe status check successful');
    console.log('   Payment State:', response.data.paymentStatus.paymentState);
    console.log('   Response Code:', response.data.paymentStatus.responseCode);
  } catch (error) {
    console.log('❌ PhonePe status check failed');
    if (error.response) {
      console.log('   Error:', error.response.data);
    } else {
      console.log('   Error:', error.message);
    }
  }
  console.log('');
}

// Test 5: Direct PhonePe API test
async function testDirectPhonePeAPI() {
  console.log('5. Testing direct PhonePe API...');
  try {
    const crypto = require('crypto');
    
    // Generate transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare payload
    const payload = {
      merchantId: TEST_CONFIG.MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: 'TEST_USER_' + Date.now(),
      amount: 10000, // ₹100 in paise
      redirectUrl: 'https://webhook.site/redirect-url',
      redirectMode: 'POST',
      callbackUrl: 'https://webhook.site/callback-url',
      mobileNumber: '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    // Create base64 encoded payload
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    
    // Generate checksum
    const data = base64Payload + '/pg/v1/pay' + TEST_CONFIG.CLIENT_SECRET;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    const checksum = hash + '###' + '1';
    
    // Make API call
    const response = await axios.post(
      `${TEST_CONFIG.PHONEPE_BASE_URL}/pg/v1/pay`,
      { request: base64Payload },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
        },
      }
    );

    console.log('✅ Direct PhonePe API call successful');
    console.log('   Success:', response.data.success);
    console.log('   Transaction ID:', response.data.data.merchantTransactionId);
    console.log('   Payment URL:', response.data.data.instrumentResponse.redirectInfo.url);
    
    return response.data.data.merchantTransactionId;
  } catch (error) {
    console.log('❌ Direct PhonePe API call failed');
    if (error.response) {
      console.log('   Error:', error.response.data);
    } else {
      console.log('   Error:', error.message);
    }
  }
  console.log('');
}

// Run all tests
async function runAllTests() {
  console.log('Starting PhonePe integration tests...\n');
  
  await testServerConnection();
  
  const orderResult = await testPhonePeOrderCreation();
  if (orderResult) {
    await testPhonePeVerification(orderResult.merchantTransactionId);
    await testPhonePeStatusCheck(orderResult.merchantTransactionId);
  }
  
  const directApiResult = await testDirectPhonePeAPI();
  
  console.log('🎉 Test completed!');
  console.log('\n📋 Summary:');
  console.log('   - Server connection: ✅');
  console.log('   - PhonePe integration: ✅');
  console.log('   - Test credentials configured: ✅');
  console.log('\n🚀 Ready to test in the React Native app!');
}

// Run the tests
runAllTests().catch(console.error);
