import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    createPaymentOrder,
    formatAmount,
    processPayment,
    validateAmount,
} from '../utils/payment';

export default function PaymentModal({ 
  visible, 
  onClose, 
  amount, 
  description, 
  onSuccess, 
  onFailure 
}) {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({});
  const [customAmount, setCustomAmount] = useState(amount?.toString() || '');

  useEffect(() => {
    if (visible) {
      loadUserData();
    }
  }, [visible]);

  const loadUserData = async () => {
    try {
      const firebaseUser = auth().currentUser;
      if (firebaseUser) {
        setUserData({
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          phone: firebaseUser.phoneNumber,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Validate amount
      const validation = validateAmount(customAmount);
      if (!validation.isValid) {
        Alert.alert('Invalid Amount', validation.error);
        return;
      }

      // Create payment order
      const orderData = await createPaymentOrder(
        validation.amount,
        'INR',
        { description }
      );

      // Process payment with Razorpay
      const paymentResult = await processPayment(orderData, userData);

      if (paymentResult.success) {
        Alert.alert(
          'Payment Successful',
          'Your payment has been processed successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess?.(paymentResult);
                onClose();
              },
            },
          ]
        );
      } else {
        if (paymentResult.code === 'CANCELLED') {
          Alert.alert('Payment Cancelled', 'Payment was cancelled by user');
        } else {
          Alert.alert('Payment Failed', paymentResult.error);
          onFailure?.(paymentResult);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', error.message || 'Something went wrong');
      onFailure?.({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Make Payment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.amountSection}>
              <Text style={styles.sectionTitle}>Amount</Text>
              
              <TextInput
                style={styles.amountInput}
                value={customAmount}
                onChangeText={setCustomAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                editable={!loading}
              />

              <Text style={styles.quickAmountsTitle}>Quick Amounts</Text>
              <View style={styles.quickAmountsContainer}>
                {quickAmounts.map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[
                      styles.quickAmountButton,
                      customAmount === quickAmount.toString() && styles.selectedAmount,
                    ]}
                    onPress={() => setCustomAmount(quickAmount.toString())}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        customAmount === quickAmount.toString() && styles.selectedAmountText,
                      ]}
                    >
                      ₹{quickAmount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{description}</Text>
              </View>
            )}

            <View style={styles.userInfoSection}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <View style={styles.userInfoRow}>
                <Ionicons name="person" size={16} color="#666" />
                <Text style={styles.userInfoText}>
                  {userData.name || 'Not provided'}
                </Text>
              </View>
              <View style={styles.userInfoRow}>
                <Ionicons name="mail" size={16} color="#666" />
                <Text style={styles.userInfoText}>
                  {userData.email || 'Not provided'}
                </Text>
              </View>
              <View style={styles.userInfoRow}>
                <Ionicons name="call" size={16} color="#666" />
                <Text style={styles.userInfoText}>
                  {userData.phone || 'Not provided'}
                </Text>
              </View>
            </View>

            <View style={styles.securitySection}>
              <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
              <Text style={styles.securityText}>
                Your payment is secured by Razorpay
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.payButton, loading && styles.payButtonDisabled]}
              onPress={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="card" size={20} color="#fff" />
                  <Text style={styles.payButtonText}>
                    Pay {customAmount ? formatAmount(customAmount * 100) : '₹0'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  amountSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
  },
  quickAmountsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  selectedAmount: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  quickAmountText: {
    fontSize: 14,
    color: '#333',
  },
  selectedAmountText: {
    color: '#fff',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  userInfoSection: {
    marginBottom: 24,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  securitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  securityText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 8,
  },
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 