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
    createPhonePeOrder,
    openPhonePePayment,
    processPhonePePayment,
    validatePhonePeAmount
} from '../utils/phonepe';

export default function PhonePePaymentModal({
  visible,
  onClose,
  amount,
  description = 'Payment',
  onSuccess,
  onFailure,
}) {
  const [customAmount, setCustomAmount] = useState(amount ? amount.toString() : '');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (visible) {
      loadUserData();
      if (amount) {
        setCustomAmount(amount.toString());
      }
    }
  }, [visible, amount]);

  const loadUserData = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        setUserData({
          uid: currentUser.uid,
          email: currentUser.email,
          phone: currentUser.phoneNumber,
          name: currentUser.displayName,
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
      const validation = validatePhonePeAmount(customAmount);
      if (!validation.isValid) {
        Alert.alert('Invalid Amount', validation.error);
        return;
      }

      // Create PhonePe payment order
      const orderData = await createPhonePeOrder(
        validation.amount,
        'INR',
        { description }
      );

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Process payment with PhonePe
      const paymentResult = await processPhonePePayment(orderData, userData);

      if (paymentResult.success) {
        // Open PhonePe payment page
        const openResult = await openPhonePePayment(
          paymentResult.paymentUrl,
          paymentResult.transactionId
        );

        if (openResult.success) {
          Alert.alert(
            'Payment Initiated',
            'PhonePe payment page has been opened. Please complete the payment.',
            [
              {
                text: 'OK',
                onPress: () => {
                  onSuccess?.({
                    ...paymentResult,
                    message: 'Payment initiated successfully',
                  });
                  onClose();
                },
              },
            ]
          );
        } else {
          throw new Error(openResult.error || 'Failed to open payment page');
        }
      } else {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('PhonePe payment error:', error);
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>PhonePe Payment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Payment Icon */}
            <View style={styles.paymentIcon}>
              <Ionicons name="phone-portrait" size={48} color="#5F259F" />
            </View>

            {/* Description */}
            <Text style={styles.description}>{description}</Text>

            {/* Amount Input */}
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.amountInput}
                value={customAmount}
                onChangeText={setCustomAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmountsSection}>
              <Text style={styles.quickAmountsLabel}>Quick Amounts</Text>
              <View style={styles.quickAmountsGrid}>
                {quickAmounts.map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[
                      styles.quickAmountButton,
                      customAmount === quickAmount.toString() && styles.quickAmountButtonActive,
                    ]}
                    onPress={() => setCustomAmount(quickAmount.toString())}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        customAmount === quickAmount.toString() && styles.quickAmountTextActive,
                      ]}
                    >
                      ₹{quickAmount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment Button */}
            <TouchableOpacity
              style={[styles.payButton, loading && styles.payButtonDisabled]}
              onPress={handlePayment}
              disabled={loading || !customAmount}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="phone-portrait" size={20} color="#fff" />
                  <Text style={styles.payButtonText}>Pay with PhonePe</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.infoSection}>
              <Text style={styles.infoText}>
                • Secure payment powered by PhonePe
              </Text>
              <Text style={styles.infoText}>
                • You will be redirected to PhonePe app/website
              </Text>
              <Text style={styles.infoText}>
                • Payment will be processed securely
              </Text>
            </View>
          </ScrollView>
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
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  paymentIcon: {
    alignItems: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  amountSection: {
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  quickAmountsSection: {
    marginBottom: 24,
  },
  quickAmountsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
  },
  quickAmountButtonActive: {
    borderColor: '#5F259F',
    backgroundColor: '#5F259F',
  },
  quickAmountText: {
    fontSize: 14,
    color: '#333',
  },
  quickAmountTextActive: {
    color: '#fff',
  },
  payButton: {
    backgroundColor: '#5F259F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});
