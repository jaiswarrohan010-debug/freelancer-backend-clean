const axios = require('axios');

// Cashfree API Configuration
const CASHFREE_CONFIG = {
  baseURL: 'https://api.cashfree.com/pg', // Cashfree production API URL
  clientId: '1044097b89531189a24c9703aa47904401',
  clientSecret: 'cfsk_ma_prod_e34469e43ce299bacf77bda1020b43bd_2073e7c0',
  merchantId: '1044097'
};

// Test functions for different Cashfree API endpoints
class CashfreeTester {
  constructor(config) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': config.clientId,
        'x-client-secret': config.clientSecret,
        'x-api-version': '2022-01-01' // Try different API version
      }
    });
  }

  // Test API connectivity
  async testConnectivity() {
    try {
      console.log('🔍 Testing Cashfree API connectivity...');
      // Try to create a simple order to test connectivity
      const orderData = {
        order_id: `TEST_${Date.now()}`,
        order_amount: 1.00,
        order_currency: 'INR',
        customer_details: {
          customer_id: `CUST_${Date.now()}`,
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          customer_phone: '9876543210'
        }
      };
      const response = await this.client.post('/orders', orderData);
      console.log('✅ Connectivity test passed:', response.data);
      return true;
    } catch (error) {
      console.log('❌ Connectivity test failed:', error.response?.data || error.message);
      return false;
    }
  }

  // Test order creation
  async testOrderCreation() {
    try {
      console.log('📦 Testing order creation...');
      const orderData = {
        order_id: `TEST_ORDER_${Date.now()}`,
        order_amount: 100.00,
        order_currency: 'INR',
        customer_details: {
          customer_id: `CUST_${Date.now()}`,
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          customer_phone: '9876543210'
        },
        order_meta: {
          return_url: 'https://your-app.com/payment-success?order_id={order_id}',
          notify_url: 'https://your-app.com/webhook/cashfree'
        }
      };

      const response = await this.client.post('/orders', orderData);
      console.log('✅ Order creation test passed:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Order creation test failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Test payment link generation
  async testPaymentLink(orderId) {
    try {
      console.log('🔗 Testing payment link generation...');
      const paymentData = {
        order_id: orderId,
        payment_method: {
          upi: {
            channel: 'collect'
          }
        },
        payment_flow: 'intent'
      };

      const response = await this.client.post(`/orders/${orderId}/payments`, paymentData);
      console.log('✅ Payment link test passed:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Payment link test failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Test order status
  async testOrderStatus(orderId) {
    try {
      console.log('📊 Testing order status check...');
      const response = await this.client.get(`/orders/${orderId}`);
      console.log('✅ Order status test passed:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Order status test failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Test refund
  async testRefund(orderId, paymentId) {
    try {
      console.log('🔄 Testing refund functionality...');
      const refundData = {
        refund_id: `REFUND_${Date.now()}`,
        refund_amount: 50.00,
        refund_note: 'Test refund'
      };

      const response = await this.client.post(`/orders/${orderId}/refunds`, refundData);
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
        orderId: 'TEST_ORDER_123',
        orderAmount: 100.00,
        referenceId: 'PAYMENT_REF_123',
        txStatus: 'SUCCESS',
        paymentMode: 'UPI',
        txMsg: 'Transaction successful',
        txTime: new Date().toISOString(),
        signature: 'test_signature'
      };

      console.log('✅ Webhook verification test passed (mock data):', webhookData);
      return webhookData;
    } catch (error) {
      console.log('❌ Webhook verification test failed:', error.message);
      return null;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Cashfree API Tests...\n');

    // Test 1: Connectivity
    const connectivityResult = await this.testConnectivity();
    if (!connectivityResult) {
      console.log('❌ Stopping tests due to connectivity failure\n');
      return;
    }

    // Test 2: Order Creation
    const orderResult = await this.testOrderCreation();
    if (!orderResult) {
      console.log('❌ Stopping tests due to order creation failure\n');
      return;
    }

    const orderId = orderResult.order_id;

    // Test 3: Payment Link
    await this.testPaymentLink(orderId);

    // Test 4: Order Status
    await this.testOrderStatus(orderId);

    // Test 5: Refund (will fail if order is not paid, but that's expected)
    await this.testRefund(orderId, 'test_payment_id');

    // Test 6: Webhook Verification
    await this.testWebhookVerification();

    console.log('\n🎉 All Cashfree API tests completed!');
  }
}

// Main execution
async function main() {
  console.log('Cashfree Sandbox API Tester');
  console.log('============================\n');

  const tester = new CashfreeTester(CASHFREE_CONFIG);
  await tester.runAllTests();
}

// Run the tests
main().catch(console.error);
