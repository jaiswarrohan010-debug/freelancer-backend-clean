import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import PhonePePaymentModal from './PhonePePaymentModal';

export default function PhonePeTest() {
  const [showPhonePeModal, setShowPhonePeModal] = useState(false);
  const [testAmount, setTestAmount] = useState(100);

  const handlePaymentSuccess = (result) => {
    console.log('PhonePe Payment Success:', result);
    Alert.alert(
      'Payment Successful',
      'PhonePe payment has been initiated successfully!',
      [{ text: 'OK' }]
    );
  };

  const handlePaymentFailure = (result) => {
    console.log('PhonePe Payment Failed:', result);
    Alert.alert(
      'Payment Failed',
      result.error || 'Payment failed. Please try again.',
      [{ text: 'OK' }]
    );
  };

  const testAmounts = [50, 100, 500, 1000, 2000];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="phone-portrait" size={48} color="#5F259F" />
        <Text style={styles.title}>PhonePe Payment Test</Text>
        <Text style={styles.subtitle}>
          Test the PhonePe payment integration with different amounts
        </Text>
      </View>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Test Amounts</Text>
        <View style={styles.amountGrid}>
          {testAmounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.amountButton,
                testAmount === amount && styles.amountButtonActive,
              ]}
              onPress={() => setTestAmount(amount)}
            >
              <Text
                style={[
                  styles.amountText,
                  testAmount === amount && styles.amountTextActive,
                ]}
              >
                ₹{amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Test Information</Text>
        <View style={styles.infoItem}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <Text style={styles.infoText}>
            Using PhonePe test credentials
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark" size={16} color="#666" />
          <Text style={styles.infoText}>
            Test environment - no real money will be charged
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="card" size={16} color="#666" />
          <Text style={styles.infoText}>
            Supports UPI, cards, net banking, and wallets
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.testButton}
        onPress={() => setShowPhonePeModal(true)}
      >
        <Ionicons name="phone-portrait" size={24} color="#fff" />
        <Text style={styles.testButtonText}>
          Test PhonePe Payment - ₹{testAmount}
        </Text>
      </TouchableOpacity>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How to Test:</Text>
        <Text style={styles.instructionText}>
          1. Tap the test button above
        </Text>
        <Text style={styles.instructionText}>
          2. PhonePe payment page will open
        </Text>
        <Text style={styles.instructionText}>
          3. Use test credentials to complete payment
        </Text>
        <Text style={styles.instructionText}>
          4. Check console logs for payment status
        </Text>
      </View>

      {/* PhonePe Payment Modal */}
      <PhonePePaymentModal
        visible={showPhonePeModal}
        onClose={() => setShowPhonePeModal(false)}
        amount={testAmount}
        description={`Test Payment - ₹${testAmount}`}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  testSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  amountButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
  },
  amountButtonActive: {
    borderColor: '#5F259F',
    backgroundColor: '#5F259F',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  amountTextActive: {
    color: '#fff',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  testButton: {
    backgroundColor: '#5F259F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructions: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});
