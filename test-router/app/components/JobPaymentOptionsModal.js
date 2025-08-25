import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Alert, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../utils/api';

export default function JobPaymentOptionsModal({ visible, onClose, job, freelancer, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  const paymentMethods = [
    {
      id: 'phonepe',
      name: 'PhonePe',
      icon: 'phone-portrait',
      color: '#5f259f',
      description: 'Pay using PhonePe UPI'
    },
    {
      id: 'gpay',
      name: 'Google Pay',
      icon: 'logo-google',
      color: '#4285f4',
      description: 'Pay using Google Pay'
    },
    {
      id: 'paytm',
      name: 'Paytm',
      icon: 'card',
      color: '#00baf2',
      description: 'Pay using Paytm'
    }
  ];

  const handlePayment = async (paymentMethod) => {
    setLoading(true);
    setSelectedMethod(paymentMethod);
    
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      const jwtToken = await AsyncStorage.getItem('@jwt_token');
      
      if (!userData || !jwtToken) {
        Alert.alert('Error', 'Please login again');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/payments/job-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: job._id,
          amount: job.price,
          paymentMethod: paymentMethod
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (paymentMethod === 'phonepe') {
          // Open PhonePe payment URL
          const supported = await Linking.canOpenURL(result.paymentUrl);
          
          if (supported) {
            await Linking.openURL(result.paymentUrl);
            Alert.alert(
              'Payment Initiated',
              'Please complete the payment in PhonePe app. The freelancer will be notified once payment is confirmed.',
              [{ text: 'OK', onPress: onClose }]
            );
            if (onSuccess) onSuccess();
          } else {
            Alert.alert('Error', 'PhonePe app not found. Please install PhonePe to continue.');
          }
        } else {
          // For other payment methods, show coming soon
          Alert.alert(
            'Coming Soon',
            `${paymentMethods.find(pm => pm.id === paymentMethod)?.name} payment will be available soon. Please use PhonePe for now.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert('Payment Failed', result.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
      setSelectedMethod(null);
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
            <Text style={styles.title}>Choose Payment Method</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.jobInfo}>
              <Text style={styles.jobTitle}>{job?.title}</Text>
              <Text style={styles.freelancerName}>Freelancer: {freelancer?.name}</Text>
              <Text style={styles.amount}>Amount: ₹{job?.price}</Text>
            </View>

            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            
            <View style={styles.paymentMethods}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    selectedMethod === method.id && styles.paymentMethodSelected
                  ]}
                  onPress={() => handlePayment(method.id)}
                  disabled={loading}
                >
                  <View style={[styles.methodIcon, { backgroundColor: method.color }]}>
                    <Ionicons name={method.icon} size={24} color="#fff" />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    <Text style={styles.methodDescription}>{method.description}</Text>
                  </View>
                  {loading && selectedMethod === method.id && (
                    <View style={styles.loadingIndicator}>
                      <Ionicons name="hourglass-outline" size={20} color="#007AFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
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
                <Text style={styles.infoValue}>₹{job?.price}</Text>
              </View>
            </View>

            <Text style={styles.disclaimer}>
              Payment will be processed securely. The freelancer will receive the payment in their wallet once confirmed.
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
  jobInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
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
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  paymentMethods: {
    marginBottom: 20,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  paymentMethodSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
  },
  loadingIndicator: {
    marginLeft: 8,
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
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});
