import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../utils/api';

export default function JobPaymentModal({ visible, onClose, job, freelancer }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
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

      const user = JSON.parse(userData);
      const paymentAmount = parseFloat(amount) * 100; // Convert to paise

      const response = await fetch(`${API_BASE_URL}/payments/job-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: job._id,
          amount: paymentAmount,
          freelancerId: freelancer.firebaseUid
        })
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          'Payment Successful',
          `Payment of ₹${amount} has been sent to ${freelancer.name}`,
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert('Payment Failed', result.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.title}>Pay Freelancer</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.jobInfo}>
              <Text style={styles.jobTitle}>{job?.title}</Text>
              <Text style={styles.freelancerName}>To: {freelancer?.name}</Text>
            </View>

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

            <View style={styles.paymentInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Job:</Text>
                <Text style={styles.infoValue}>{job?.title}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Freelancer:</Text>
                <Text style={styles.infoValue}>{freelancer?.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Amount:</Text>
                <Text style={styles.infoValue}>₹{amount || '0'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.payButton, loading && styles.payButtonDisabled]}
              onPress={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.payButtonText}>Processing...</Text>
              ) : (
                <>
                  <Ionicons name="card-outline" size={20} color="#fff" />
                  <Text style={styles.payButtonText}>Pay Now</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Payment will be deducted from your wallet balance and credited to the freelancer's wallet.
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
    maxHeight: '80%',
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
  jobInfo: {
    marginBottom: 20,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  freelancerName: {
    fontSize: 16,
    color: '#666',
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
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});
