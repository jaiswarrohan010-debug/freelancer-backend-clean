// PhonePe Payment Gateway Integration
import auth from '@react-native-firebase/auth';
import { API_BASE_URL } from './api';

// PhonePe Configuration
const PHONEPE_CONFIG = {
  MERCHANT_ID: 'TEST-M23OKIGC1N363_25081',
  CLIENT_SECRET: 'OWFkNzQxNjAtZjQ2Yi00YjRkLWE0ZDMtOWQxMzQ0NWZiMGZm',
  ENVIRONMENT: 'TEST', // Change to 'PROD' for production
  REDIRECT_URL: 'https://webhook.site/redirect-url',
  CALLBACK_URL: 'https://webhook.site/callback-url',
  BASE_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox', // Change to production URL for live
};

// Payment Status Constants
export const PHONEPE_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

// Generate PhonePe Transaction ID
const generateTransactionId = () => {
  return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Create PhonePe Payment Order
export const createPhonePeOrder = async (amount, currency = 'INR', notes = {}) => {
  try {
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    const firebaseIdToken = await firebaseUser.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/payments/phonepe/create-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseIdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to paise
        currency,
        notes,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create PhonePe payment order');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Create PhonePe order error:', error);
    throw error;
  }
};

// Process PhonePe Payment
export const processPhonePePayment = async (orderData, userData) => {
  try {
    const transactionId = generateTransactionId();
    
    // Prepare payment payload
    const payload = {
      merchantId: PHONEPE_CONFIG.MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: userData.uid || 'USER_' + Date.now(),
      amount: orderData.amount,
      redirectUrl: PHONEPE_CONFIG.REDIRECT_URL,
      redirectMode: 'POST',
      callbackUrl: PHONEPE_CONFIG.CALLBACK_URL,
      mobileNumber: userData.phone || '',
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    // Create base64 encoded payload
    const base64Payload = btoa(JSON.stringify(payload));
    
    // Generate checksum
    const checksum = generateChecksum(base64Payload, PHONEPE_CONFIG.CLIENT_SECRET);
    
    // Prepare request body
    const requestBody = {
      request: base64Payload,
    };

    // Make API call to PhonePe
    const response = await fetch(`${PHONEPE_CONFIG.BASE_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error('PhonePe payment initiation failed');
    }

    const responseData = await response.json();
    
    if (responseData.success) {
      return {
        success: true,
        paymentUrl: responseData.data.instrumentResponse.redirectInfo.url,
        transactionId: transactionId,
        merchantTransactionId: responseData.data.merchantTransactionId,
      };
    } else {
      throw new Error(responseData.message || 'Payment initiation failed');
    }
  } catch (error) {
    console.error('PhonePe payment processing error:', error);
    return {
      success: false,
      error: error.message || 'Payment failed',
      code: 'FAILED',
    };
  }
};

// Generate Checksum for PhonePe
const generateChecksum = (payload, secretKey) => {
  const CryptoJS = require('react-native-crypto-js');
  const data = payload + '/pg/v1/pay' + secretKey;
  const hash = CryptoJS.SHA256(data).toString();
  return hash + '###' + '1';
};

// Verify PhonePe Payment
export const verifyPhonePePayment = async (merchantTransactionId) => {
  try {
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    const firebaseIdToken = await firebaseUser.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/payments/phonepe/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseIdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantTransactionId,
      }),
    });

    if (!response.ok) {
      throw new Error('PhonePe payment verification failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('PhonePe payment verification error:', error);
    throw error;
  }
};

// Open PhonePe Payment Page
export const openPhonePePayment = async (paymentUrl, transactionId) => {
  try {
    // Use React Native Linking to open PhonePe payment URL
    const { Linking } = require('react-native');
    
    // Try to open the payment URL
    const canOpen = await Linking.canOpenURL(paymentUrl);
    if (canOpen) {
      await Linking.openURL(paymentUrl);
      return {
        success: true,
        transactionId,
        message: 'Opening PhonePe payment page...',
      };
    } else {
      // Fallback: Open in browser
      await Linking.openURL(paymentUrl);
      return {
        success: true,
        transactionId,
        message: 'Opening payment page in browser...',
      };
    }
  } catch (error) {
    console.error('Error opening PhonePe payment:', error);
    return {
      success: false,
      error: 'Failed to open payment page',
    };
  }
};

// Handle PhonePe Payment Callback
export const handlePhonePeCallback = async (callbackData) => {
  try {
    const { merchantTransactionId, transactionId, amount, status } = callbackData;
    
    if (status === PHONEPE_STATUS.SUCCESS) {
      // Verify payment on backend
      const verificationResult = await verifyPhonePePayment(merchantTransactionId);
      
      if (verificationResult.success) {
        return {
          success: true,
          paymentData: {
            transactionId,
            merchantTransactionId,
            amount,
            status,
          },
          verificationResult,
        };
      } else {
        return {
          success: false,
          error: 'Payment verification failed',
        };
      }
    } else {
      return {
        success: false,
        error: `Payment ${status.toLowerCase()}`,
        status,
      };
    }
  } catch (error) {
    console.error('PhonePe callback handling error:', error);
    return {
      success: false,
      error: error.message || 'Callback handling failed',
    };
  }
};

// Get PhonePe Payment Status
export const getPhonePePaymentStatus = async (merchantTransactionId) => {
  try {
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    const firebaseIdToken = await firebaseUser.getIdToken();
    
    const response = await fetch(
      `${API_BASE_URL}/payments/phonepe/status/${merchantTransactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get payment status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get PhonePe payment status error:', error);
    throw error;
  }
};

// Format PhonePe Amount
export const formatPhonePeAmount = (amount, currency = 'INR') => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  return formatter.format(amount / 100); // Convert from paise to rupees
};

// Validate PhonePe Amount
export const validatePhonePeAmount = (amount) => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }
  if (numAmount < 1) {
    return { isValid: false, error: 'Minimum amount is ₹1' };
  }
  if (numAmount > 100000) {
    return { isValid: false, error: 'Maximum amount is ₹1,00,000' };
  }
  return { isValid: true, amount: numAmount };
};
