const axios = require('axios');

// SurePaaS Sandbox API Configuration
const SUREPAAS_CONFIG = {
  baseURL: 'https://sandbox.surepaas.com/api', // Replace with your actual SurePaaS sandbox URL
  apiKey: 'YOUR_SUREPAAS_API_KEY', // Replace with your actual API key
  secretKey: 'YOUR_SUREPAAS_SECRET_KEY', // Replace with your actual secret key
  merchantId: 'YOUR_MERCHANT_ID' // Replace with your actual merchant ID
};

// Test functions for different SurePaaS API endpoints
class SurePaaSTester {
  constructor(config) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Merchant-ID': config.merchantId
      }
    });
  }

  // Test API connectivity
  async testConnectivity() {
    try {
      console.log('🔍 Testing SurePaaS API connectivity...');
      const response = await this.client.get('/health'); // Adjust endpoint as per SurePaaS docs
      console.log('✅ Connectivity test passed:', response.data);
      return true;
    } catch (error) {
      console.log('❌ Connectivity test failed:', error.message);
      return false;
    }
  }

  // Test payment initiation
  async testPaymentInitiation() {
    try {
      console.log('💳 Testing payment initiation...');
      const paymentData = {
        amount: 100, // Amount in smallest currency unit (paise for INR)
        currency: 'INR',
        orderId: `TEST_${Date.now()}`,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '9876543210',
        description: 'Test payment for SurePaaS integration',
        returnUrl: 'https://your-app.com/payment-success',
        cancelUrl: 'https://your-app.com/payment-cancel'
      };

      const response = await this.client.post('/payments/initiate', paymentData);
      console.log('✅ Payment initiation test passed:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Payment initiation test failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Test payment status check
  async testPaymentStatus(orderId) {
    try {
      console.log('📊 Testing payment status check...');
      const response = await this.client.get(`/payments/status/${orderId}`);
      console.log('✅ Payment status test passed:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Payment status test failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Test refund
  async testRefund(paymentId, amount) {
    try {
      console.log('🔄 Testing refund functionality...');
      const refundData = {
        paymentId: paymentId,
        amount: amount,
        reason: 'Test refund'
      };

      const response = await this.client.post('/payments/refund', refundData);
      console.log('✅ Refund test passed:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Refund test failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Test webhook verification
  async testWebhookVerification() {
    try {
      console.log('🔗 Testing webhook verification...');
      const webhookData = {
        event: 'payment.success',
        data: {
          orderId: 'TEST_ORDER_123',
          paymentId: 'PAY_123456',
          amount: 100,
          status: 'SUCCESS'
        }
      };

      const response = await this.client.post('/webhooks/verify', webhookData);
      console.log('✅ Webhook verification test passed:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Webhook verification test failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting SurePaaS API Tests...\n');
    
    // Test 1: Connectivity
    const connectivityResult = await this.testConnectivity();
    if (!connectivityResult) {
      console.log('❌ Stopping tests due to connectivity failure');
      return;
    }

    // Test 2: Payment Initiation
    const paymentResult = await this.testPaymentInitiation();
    
    // Test 3: Payment Status (if payment was initiated)
    if (paymentResult && paymentResult.orderId) {
      await this.testPaymentStatus(paymentResult.orderId);
    }

    // Test 4: Webhook Verification
    await this.testWebhookVerification();

    console.log('\n🎉 All tests completed!');
  }
}

// Main execution
async function main() {
  console.log('SurePaaS Sandbox API Tester');
  console.log('============================\n');

  // Check if configuration is provided
  if (SUREPAAS_CONFIG.apiKey === 'YOUR_SUREPAAS_API_KEY') {
    console.log('⚠️  Please update the SUREPAAS_CONFIG with your actual credentials:');
    console.log('   - baseURL: Your SurePaaS sandbox API base URL');
    console.log('   - apiKey: Your SurePaaS API key');
    console.log('   - secretKey: Your SurePaaS secret key');
    console.log('   - merchantId: Your SurePaaS merchant ID');
    console.log('\nExample:');
    console.log('const SUREPAAS_CONFIG = {');
    console.log('  baseURL: "https://sandbox.surepaas.com/api",');
    console.log('  apiKey: "your_actual_api_key_here",');
    console.log('  secretKey: "your_actual_secret_key_here",');
    console.log('  merchantId: "your_merchant_id_here"');
    console.log('};');
    return;
  }

  const tester = new SurePaaSTester(SUREPAAS_CONFIG);
  await tester.runAllTests();
}

// Run the tests
main().catch(console.error);
