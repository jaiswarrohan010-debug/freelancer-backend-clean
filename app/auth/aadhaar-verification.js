import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { API_BASE_URL } from '../utils/api';

export default function AadhaarVerificationScreen() {
  const router = useRouter();
  const { role, userId, phoneNumber } = useLocalSearchParams();
  
  const [aadhaarNumber, setAadhaarNumber] = useState('539388807808');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Generate OTP for Aadhaar verification
  const generateOTP = async () => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setLoading(true);
    try {
      // CashfreeVerification temporarily disabled
      Alert.alert(
        'Feature Disabled', 
        'Aadhaar verification via Cashfree is temporarily disabled. Please use manual verification instead.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify Aadhaar OTP and complete registration
  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP');
      return;
    }

    setVerifying(true);
    try {
      // CashfreeVerification temporarily disabled
      Alert.alert(
        'Feature Disabled', 
        'Aadhaar verification via Cashfree is temporarily disabled. Please use manual verification instead.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Update user profile with verification data
  const updateUserProfile = async (verificationData) => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const user = JSON.parse(userData);

      const updateResponse = await fetch(`${API_BASE_URL}/users/${user.id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify({
          aadhaarNumber: aadhaarNumber,
          isVerified: true,
          verificationMethod: 'cashfree_aadhaar',
          verificationData: verificationData,
          verifiedAt: new Date().toISOString(),
          verificationStatus: 'verified'
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update profile');
      }

      // Update local user data
      const updatedUser = await updateResponse.json();
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));

    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aadhaar Verification</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Verify Your Identity</Text>
          <Text style={styles.subtitle}>
            Please provide your Aadhaar number to verify your identity
          </Text>

          {/* Aadhaar Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Aadhaar Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 12-digit Aadhaar number"
              value={aadhaarNumber}
              onChangeText={setAadhaarNumber}
              keyboardType="numeric"
              maxLength={12}
              editable={!otpSent}
            />
          </View>

          {/* Generate OTP Button */}
          {!otpSent && (
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
          )}

          {/* OTP Input */}
          {otpSent && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <Text style={styles.otpInfo}>
                  OTP sent to your Aadhaar-linked mobile number
                </Text>
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={verifyOTP}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify Aadhaar</Text>
                )}
              </TouchableOpacity>

              {/* Test OTP for Sandbox */}
              <TouchableOpacity
                style={[styles.button, styles.testButton]}
                onPress={() => setOtp('123456')}
              >
                <Text style={styles.testButtonText}>🧪 Use Test OTP (123456)</Text>
              </TouchableOpacity>

              {/* Resend OTP */}
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={generateOTP}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>Resend OTP</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Sandbox Mode Notice */}
          <View style={styles.sandboxContainer}>
            <Ionicons name="warning" size={20} color="#ff9800" />
            <Text style={styles.sandboxText}>
              🧪 SANDBOX MODE: This is a test environment. 
              Use test Aadhaar number: 539388807808
            </Text>
          </View>

          {/* Info Section */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={20} color="#666" />
            <Text style={styles.infoText}>
              Your Aadhaar number will be encrypted and stored securely. 
              This verification is mandatory for freelancer registration.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22
  },
  inputContainer: {
    marginBottom: 24
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333'
  },
  otpInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic'
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16
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
  },
  testButton: {
    backgroundColor: '#ff9800',
    borderWidth: 0
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginTop: 20
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20
  },
  sandboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ff9800'
  },
  sandboxText: {
    fontSize: 14,
    color: '#e65100',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500'
  }
});
