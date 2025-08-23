import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { API_BASE_URL } from '../utils/api';

export default function LoginScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const selectedRole = role || 'client';
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [signInTimer, setSignInTimer] = useState(20);
  const timerRef = useRef(null);

  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setVerifying(false);
    try {
      const formattedPhone = Platform.OS === 'android' ? `+91${phoneNumber}` : phoneNumber;
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
      setVerificationId(confirmation.verificationId);
      Alert.alert('Success', 'OTP sent successfully!');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }
    setVerifying(true);
    setSignInTimer(20);
    let hasError = false; // Flag to track if there was an error
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSignInTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setVerifying(false);
          Alert.alert('Timeout', 'Sign in timed out. Please try again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    try {
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
      await auth().signInWithCredential(credential);
      const unsubscribe = auth().onAuthStateChanged(async (user) => {
        console.log('onAuthStateChanged user:', user);
        if (user) {
          clearInterval(timerRef.current);
          try {
            const idToken = await user.getIdToken();
            if (!idToken) {
              Alert.alert('Error', 'Failed to get Firebase ID token');
              unsubscribe();
              setVerifying(false);
              return;
            }
            console.log('Making request to:', `${API_BASE_URL}/auth/firebase`);
            const response = await fetch(`${API_BASE_URL}/auth/firebase`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                idToken: idToken,
                role: selectedRole,
                action: 'login', // Specify this is a login attempt
              }),
            });
            const responseText = await response.text();
            console.log('Backend response status:', response.status);
            console.log('Backend response text:', responseText);
            
            if (!response.ok) {
              if (response.status === 404) {
                console.log('❌ 404 Error: No user found, throwing error');
                throw new Error('No user found with this phone number. Please create an account first.');
              }
              console.log('❌ Backend error:', response.status, responseText);
              throw new Error(`Backend error: ${response.status} - ${responseText}`);
            }
            const authData = JSON.parse(responseText);
            await AsyncStorage.setItem('@user_data', JSON.stringify({
              uid: user.uid,
              phoneNumber: user.phoneNumber,
              role: authData.user.role,
              id: authData.user.id,
              isNewUser: authData.isNewUser,
              needsVerification: authData.needsVerification,
              verificationStatus: authData.verificationStatus,
              isRejected: authData.isRejected
            }));
            await AsyncStorage.setItem('@jwt_token', authData.token);
            
            // Navigate based on user's role and verification status
            console.log('Login navigation logic:', {
              role: authData.user.role,
              needsVerification: authData.needsVerification,
              verificationStatus: authData.verificationStatus,
              isRejected: authData.isRejected,
              userId: authData.user.id
            });
            
            // Add a small delay to ensure authentication state is properly set
            setTimeout(() => {
              // Check if there was an error before navigating
              if (hasError) {
                console.log('❌ Skipping navigation due to error');
                return;
              }
              
              if (authData.user.role === 'client') {
                console.log('Login: Navigating to client home');
                router.replace('/client/home');
              } else {
                // For freelancers
                if (authData.isRejected) {
                  // Rejected user - go to dashboard to show rejection modal
                  console.log('Login: Navigating to freelancer home (rejected user)');
                  router.replace('/freelancer/home');
                } else if (authData.needsVerification) {
                  // Needs verification - go to manual verification
                  console.log('Login: Navigating to manual verification');
                  router.push(`/auth/manual-verification?userId=${authData.user.id}`);
                } else {
                  // Verified freelancer - go to dashboard
                  console.log('Login: Navigating to freelancer home');
                  router.replace('/freelancer/home');
                }
              }
            }, 1000);
          } catch (error) {
            console.error('❌ Authentication error caught:', error.message);
            console.error('Error name:', error.name);
            console.error('Error stack:', error.stack);
            hasError = true; // Set error flag
            Alert.alert('Backend Error', `Failed to authenticate with server: ${error.message}`);
            // Ensure we don't proceed with navigation
            return;
          } finally {
            unsubscribe();
            setVerifying(false);
          }
        }
      });
    } catch (error) {
      console.error('❌ Outer catch block - OTP verification error:', error.message);
      console.error('Error name:', error.name);
      console.error('Error stack:', error.stack);
      hasError = true; // Set error flag
      Alert.alert('Authentication Error', `OTP verification failed: ${error.message}`);
      clearInterval(timerRef.current);
      setVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.appTitle}>
            {selectedRole === 'client' ? 'Hire Talent' : 'Work as Freelancer'}
          </Text>
          <Text style={styles.appSubtitle}>Sign in to your account</Text>
        </View>

        {/* Loading State */}
        {verifying && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Signing you in...</Text>
              <Text style={styles.timerText}>{signInTimer}s remaining</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(signInTimer / 20) * 100}%` }]} />
              </View>
            </View>
          </View>
        )}

        {/* Phone Number Input */}
        {!verificationId ? (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="call" size={20} color="#007AFF" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSendOtp} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
              <Text style={styles.buttonText}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.helpText}>
              We'll send a verification code to your phone number
            </Text>
          </View>
        ) : (
          /* OTP Input */
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="lock-closed" size={20} color="#007AFF" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                maxLength={6}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.button, verifying && styles.buttonDisabled]} 
              onPress={handleVerifyOtp} 
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark" size={20} color="#fff" />
              )}
              <Text style={styles.buttonText}>
                {verifying ? 'Verifying...' : 'Verify OTP'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.resendButton}
              onPress={handleSendOtp}
              disabled={loading}
            >
              <Text style={styles.resendText}>
                {loading ? 'Sending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text 
              style={styles.linkText}
              onPress={() => router.push(`/auth/phone?role=${selectedRole}`)}
            >
              Create one here
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  formContainer: {
    paddingHorizontal: 30,
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  resendText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 30,
    paddingTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
