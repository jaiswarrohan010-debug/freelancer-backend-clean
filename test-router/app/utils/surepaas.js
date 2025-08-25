
// SurePaaS Configuration
const SUREPAAS_CONFIG = {
  baseURL: 'https://sandbox.surepaas.com/api', // Replace with your actual SurePaaS sandbox URL
  apiKey: 'YOUR_SUREPAAS_API_KEY', // Replace with your actual API key
  secretKey: 'YOUR_SUREPAAS_SECRET_KEY', // Replace with your actual secret key
  merchantId: 'YOUR_MERCHANT_ID' // Replace with your actual merchant ID
};

class SurePaaSService {
  constructor() {
    this.config = SUREPAAS_CONFIG;
  }

  // Get headers for API requests
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-Merchant-ID': this.config.merchantId
    };
  }

  // Initiate a payment
  async initiatePayment(paymentData) {
    try {
      const response = await fetch(`${this.config.baseURL}/payments/initiate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          amount: paymentData.amount,
          currency: paymentData.currency || 'INR',
          orderId: paymentData.orderId,
          customerName: paymentData.customerName,
          customerEmail: paymentData.customerEmail,
          customerPhone: paymentData.customerPhone,
          description: paymentData.description,
          returnUrl: paymentData.returnUrl,
          cancelUrl: paymentData.cancelUrl
        })
      });

      if (!response.ok) {
        throw new Error(`Payment initiation failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SurePaaS payment initiation error:', error);
      throw error;
    }
  }

  // Check payment status
  async checkPaymentStatus(orderId) {
    try {
      const response = await fetch(`${this.config.baseURL}/payments/status/${orderId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Payment status check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SurePaaS payment status check error:', error);
      throw error;
    }
  }

  // Process refund
  async processRefund(refundData) {
    try {
      const response = await fetch(`${this.config.baseURL}/payments/refund`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          paymentId: refundData.paymentId,
          amount: refundData.amount,
          reason: refundData.reason
        })
      });

      if (!response.ok) {
        throw new Error(`Refund processing failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SurePaaS refund error:', error);
      throw error;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    // Implement webhook signature verification based on SurePaaS documentation
    // This is a placeholder - you'll need to implement according to SurePaaS specs
    try {
      // Add your webhook verification logic here
      return true;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  // Generate order ID
  generateOrderId(prefix = 'ORDER') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Format amount for SurePaaS (convert to smallest currency unit)
  formatAmount(amount, currency = 'INR') {
    if (currency === 'INR') {
      return Math.round(amount * 100); // Convert to paise
    }
    return amount;
  }
}

// Create singleton instance
const surePaaSService = new SurePaaSService();

export default surePaaSService;
