
// Cashfree Verification API Configuration
const CASHFREE_VERIFICATION_CONFIG = {
  baseURL: 'https://sandbox.cashfree.com/verification',
  clientId: 'CF10751692D2IC9OL3LO7C73FBB62G',
  clientSecret: 'cfsk_ma_test_7e0691d1e563f117ea2319053362831c_f8be14b0'
};

class CashfreeVerification {
  constructor() {
    this.baseURL = CASHFREE_VERIFICATION_CONFIG.baseURL;
    this.clientId = CASHFREE_VERIFICATION_CONFIG.clientId;
    this.clientSecret = CASHFREE_VERIFICATION_CONFIG.clientSecret;
  }

  // Generate OTP for Aadhaar verification
  async generateAadhaarOTP(aadhaarNumber) {
    try {
      const response = await fetch(`${this.baseURL}/offline-aadhaar/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.clientId,
          'x-client-secret': this.clientSecret
        },
        body: JSON.stringify({
          aadhaar_number: aadhaarNumber
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data,
          message: 'OTP sent successfully'
        };
      } else {
        return {
          success: false,
          error: data,
          message: data.message || 'Failed to generate OTP'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Network error occurred'
      };
    }
  }

  // Verify Aadhaar OTP
  async verifyAadhaarOTP(aadhaarNumber, otp) {
    try {
      const response = await fetch(`${this.baseURL}/offline-aadhaar/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.clientId,
          'x-client-secret': this.clientSecret
        },
        body: JSON.stringify({
          aadhaar_number: aadhaarNumber,
          otp: otp
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data,
          message: 'Aadhaar verified successfully'
        };
      } else {
        return {
          success: false,
          error: data,
          message: data.message || 'Failed to verify Aadhaar'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Network error occurred'
      };
    }
  }

  // Verify PAN
  async verifyPAN(pan, name) {
    try {
      const response = await fetch(`${this.baseURL}/pan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.clientId,
          'x-client-secret': this.clientSecret
        },
        body: JSON.stringify({
          pan: pan,
          name: name
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data,
          message: 'PAN verified successfully'
        };
      } else {
        return {
          success: false,
          error: data,
          message: data.message || 'Failed to verify PAN'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Network error occurred'
      };
    }
  }
}

export default new CashfreeVerification();
