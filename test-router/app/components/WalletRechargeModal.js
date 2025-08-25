import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Alert, Linking, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../utils/api';

export default function WalletRechargeModal({ visible, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecharge = async () => {
    if (!amount || parseFloat(amount) < 10) {
      Alert.alert('Error', 'Minimum recharge amount is ₹10');
      return;
    }

    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      const jwtToken = await AsyncStorage.getItem('@jwt_token');
      
      if (!userData || !jwtToken) {
        Alert.alert('Error', 'Please login again');
        return;
      }

      const rechargeAmount = parseFloat(amount) * 100; // Convert to paise

      const response = await fetch(`${API_BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: rechargeAmount,
          currency: 'INR',
          notes: {
            type: 'wallet_recharge',
            amount: amount
          }
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Open PhonePe payment URL
        const supported = await Linking.canOpenURL(result.paymentUrl);
        
        if (supported) {
          await Linking.openURL(result.paymentUrl);
          Alert.alert(
            'Payment Initiated',
            'Please complete the payment in PhonePe app. Your wallet will be updated once payment is confirmed.',
            [{ text: 'OK', onPress: onClose }]
          );
          if (onSuccess) onSuccess();
        } else {
          Alert.alert('Error', 'PhonePe app not found. Please install PhonePe to continue.');
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Recharge error:', error);
      Alert.alert('Error', 'Failed to initiate recharge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Recharge Wallet</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.amountInput}>
              <Text style={styles.amountLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.quickAmounts}>
              <Text style={styles.quickLabel}>Quick Amounts:</Text>
              <View style={styles.amountGrid}>
                {quickAmounts.map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[
                      styles.quickAmountButton,
                      amount === quickAmount.toString() && styles.quickAmountSelected
                    ]}
                    onPress={() => setAmount(quickAmount.toString())}
                  >
                    <Text style={[
                      styles.quickAmountText,
                      amount === quickAmount.toString() && styles.quickAmountTextSelected
                    ]}>
                      ₹{quickAmount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.paymentInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment Method:</Text>
                <Text style={styles.infoValue}>PhonePe</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Amount:</Text>
                <Text style={styles.infoValue}>₹{amount || '0'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Processing Fee:</Text>
                <Text style={styles.infoValue}>₹0</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.rechargeButton, loading && styles.rechargeButtonDisabled]}
              onPress={handleRecharge}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.rechargeButtonText}>Processing...</Text>
              ) : (
                <>
                  <Ionicons name="wallet-outline" size={20} color="#fff" />
                  <Text style={styles.rechargeButtonText}>Recharge Now</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Payment will be processed securely through PhonePe. Your wallet will be updated once payment is confirmed.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  amountInput: {
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  quickAmounts: {
    marginBottom: 20,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  quickAmountSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  quickAmountText: {
    fontSize: 14,
    color: '#333',
  },
  quickAmountTextSelected: {
    color: '#fff',
  },
  paymentInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  rechargeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  rechargeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  rechargeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});
