// Payment System Configuration and Utilities
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { API_BASE_URL } from './api';

// Razorpay Configuration
const RAZORPAY_CONFIG = {
  // Replace with your actual Razorpay credentials
  KEY_ID: 'rzp_test_YOUR_KEY_ID', // Test key for development
  KEY_SECRET: 'YOUR_KEY_SECRET', // Keep this secure on backend only
  CURRENCY: 'INR',
  COMPANY_NAME: 'Your Company Name',
  DESCRIPTION: 'Payment for services',
};

// Payment Status Constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Payment Types
export const PAYMENT_TYPES = {
  JOB_PAYMENT: 'job_payment',
  WITHDRAWAL: 'withdrawal',
  SUBSCRIPTION: 'subscription',
  WALLET_RECHARGE: 'wallet_recharge',
};

// Create Payment Order
export const createPaymentOrder = async (amount, currency = 'INR', notes = {}) => {
  try {
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    const firebaseIdToken = await firebaseUser.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/payments/create-order`, {
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
      throw new Error('Failed to create payment order');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Create payment order error:', error);
    throw error;
  }
};

// Process Payment with Razorpay
export const processPayment = async (orderData, userData) => {
  try {
    const options = {
      description: RAZORPAY_CONFIG.DESCRIPTION,
      image: 'https://your-logo-url.com/logo.png',
      currency: RAZORPAY_CONFIG.CURRENCY,
      key: RAZORPAY_CONFIG.KEY_ID,
      amount: orderData.amount,
      name: RAZORPAY_CONFIG.COMPANY_NAME,
      order_id: orderData.id,
      prefill: {
        email: userData.email || '',
        contact: userData.phone || '',
        name: userData.name || '',
      },
      theme: { color: '#007AFF' },
    };

    // Import Razorpay dynamically to avoid issues
    const RazorpayCheckout = require('react-native-razorpay').default;
    
    const paymentData = await RazorpayCheckout.open(options);
    
    // Verify payment on backend
    const verificationResult = await verifyPayment(paymentData);
    
    return {
      success: true,
      paymentData,
      verificationResult,
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    
    if (error.code === 'PAYMENT_CANCELLED') {
      return {
        success: false,
        error: 'Payment was cancelled by user',
        code: 'CANCELLED',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Payment failed',
      code: 'FAILED',
    };
  }
};

// Verify Payment on Backend
export const verifyPayment = async (paymentData) => {
  try {
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    const firebaseIdToken = await firebaseUser.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseIdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};

// Get Payment History
export const getPaymentHistory = async (limit = 20, offset = 0) => {
  try {
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    const firebaseIdToken = await firebaseUser.getIdToken();
    
    const response = await fetch(
      `${API_BASE_URL}/payments/history?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch payment history');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get payment history error:', error);
    throw error;
  }
};

// Get Wallet Balance
export const getWalletBalance = async () => {
  try {
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    const firebaseIdToken = await firebaseUser.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/payments/wallet-balance`, {
      headers: {
        'Authorization': `Bearer ${firebaseIdToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch wallet balance');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get wallet balance error:', error);
    throw error;
  }
};

// Request Withdrawal
export const requestWithdrawal = async (amount, bankDetails) => {
  try {
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    const firebaseIdToken = await firebaseUser.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/payments/withdraw`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseIdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        bankDetails,
      }),
    });

    if (!response.ok) {
      throw new Error('Withdrawal request failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Withdrawal request error:', error);
    throw error;
  }
};

// Store Payment Data Locally
export const storePaymentData = async (paymentData) => {
  try {
    await AsyncStorage.setItem('last_payment', JSON.stringify(paymentData));
  } catch (error) {
    console.error('Error storing payment data:', error);
  }
};

// Get Stored Payment Data
export const getStoredPaymentData = async () => {
  try {
    const data = await AsyncStorage.getItem('last_payment');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving payment data:', error);
    return null;
  }
};

// Format Amount for Display
export const formatAmount = (amount, currency = 'INR') => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  return formatter.format(amount / 100); // Convert from paise to rupees
};

// Validate Amount
export const validateAmount = (amount) => {
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