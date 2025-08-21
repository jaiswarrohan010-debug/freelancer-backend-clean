import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import CashfreeVerification from '../utils/cashfree-verification';

export default function AadhaarVerificationTest() {
  const [aadhaarNumber, setAadhaarNumber] = useState('539388807808');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const generateOTP = async () => {
    setLoading(true);
    try {
      const result = await CashfreeVerification.generateAadhaarOTP(aadhaarNumber);
      console.log('Generate OTP Result:', result);
      
      if (result.success) {
        setOtpSent(true);
        Alert.alert('Success', 'OTP sent successfully');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setVerifying(true);
    try {
      const result = await CashfreeVerification.verifyAadhaarOTP(aadhaarNumber, otp);
      console.log('Verify OTP Result:', result);
      
      if (result.success) {
        Alert.alert('Success', 'Aadhaar verified successfully!');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aadhaar Verification Test</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Aadhaar Number</Text>
        <TextInput
          style={styles.input}
          value={aadhaarNumber}
          onChangeText={setAadhaarNumber}
          placeholder="Enter Aadhaar number"
          keyboardType="numeric"
          maxLength={12}
          editable={!otpSent}
        />
      </View>

      {!otpSent ? (
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={generateOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Generate OTP</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>OTP</Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter OTP"
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={verifyOTP}
            disabled={verifying}
          >
            {verifying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={generateOTP}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Resend OTP</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333'
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12
  },
  primaryButton: {
    backgroundColor: '#007AFF'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600'
  }
});
