import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { API_BASE_URL } from '../utils/api';

export default function PhoneAuthScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false); // For OTP send
  const [verifying, setVerifying] = useState(false); // For OTP verification
  const [signInTimer, setSignInTimer] = useState(20); // seconds
  const timerRef = useRef(null);

  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setVerifying(false);
    try {
      const formattedPhone = `${countryCode}${phoneNumber}`;
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
      // Wait for auth state to be ready and navigate only when user is available
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
            
            // Make the actual backend call to get user verification status
            const response = await fetch(`${API_BASE_URL}/auth/firebase`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                idToken: idToken,
                role: role || 'client',
                phone: user.phoneNumber, // Send phone number for new user creation
                action: 'signup', // Specify this is account creation
              }),
            });
            const responseText = await response.text();
            console.log('Backend response status:', response.status);
            console.log('Backend response text:', responseText);
            
            if (!response.ok) {
              console.log('Backend authentication failed, throwing error');
              throw new Error(`Backend error: ${response.status} - ${responseText}`);
            }
            
            const authData = JSON.parse(responseText);
            console.log('Parsed auth data:', authData);
            
            // Only proceed if we have valid authentication data
            if (!authData.user || !authData.user.id) {
              console.log('Invalid authentication response, throwing error');
              throw new Error('Invalid authentication response from server');
            }
            
            // Additional check to ensure we have the required fields
            if (authData.isNewUser === undefined || authData.needsVerification === undefined) {
              console.log('Missing required fields in auth response, throwing error');
              throw new Error('Incomplete authentication response from server');
            }
            
            const userData = {
              uid: user.uid,
              phoneNumber: user.phoneNumber,
              role: role || 'client',
              id: authData.user.id, // Backend user ID
              isNewUser: authData.isNewUser,
              needsVerification: authData.needsVerification
            };
            
            console.log('Storing user data:', userData);
            await AsyncStorage.setItem('@user_data', JSON.stringify(userData));
            await AsyncStorage.setItem('@jwt_token', authData.token);
            console.log('User data and token stored successfully');
            
            // Navigate based on user status
            console.log('Navigation logic:', {
              role: authData.user.role,
              isNewUser: authData.isNewUser,
              needsVerification: authData.needsVerification,
              userId: authData.user.id
            });
            
            // Navigate based on user status (immediately after successful authentication)
            console.log('Navigation check:', {
              role: authData.user.role,
              isNewUser: authData.isNewUser,
              needsVerification: authData.needsVerification,
              shouldGoToVerification: authData.isNewUser || authData.needsVerification
            });
            
            if (authData.user.role === 'client') {
              console.log('Navigating to client home');
              router.replace('/client/home');
            } else {
              // For freelancers
              if (authData.isNewUser || authData.needsVerification) {
                // New user or needs verification - go to manual verification
                console.log('Navigating to manual verification');
                router.replace(`/auth/manual-verification?userId=${authData.user.id}`);
              } else {
                // Verified freelancer - go to dashboard
                console.log('Navigating to freelancer home');
                router.replace('/freelancer/home');
              }
            }
          } catch (error) {
            console.error('Authentication error details:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            
            // Clear any stored user data on authentication failure
            try {
              await AsyncStorage.removeItem('@user_data');
              await AsyncStorage.removeItem('@jwt_token');
              console.log('Cleared stored user data due to authentication failure');
            } catch (clearError) {
              console.error('Error clearing stored data:', clearError);
            }
            
            Alert.alert('Backend Error', `Failed to authenticate with server: ${error.message}`);
          } finally {
            unsubscribe();
            setVerifying(false);
          }
        }
      });
    } catch (error) {
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
              {role === 'client' ? 'Hire Talent' : 'Work as Freelancer'}
            </Text>
            <Text style={styles.appSubtitle}>Create your account</Text>
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
                <TouchableOpacity 
                  style={styles.countryCodeContainer}
                  onPress={() => {
                    // You can add a country picker modal here
                    Alert.alert('Country Code', 'Currently only +91 (India) is supported');
                  }}
                >
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                  <Ionicons name="chevron-down" size={16} color="#007AFF" />
                </TouchableOpacity>
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
              <View style={styles.otpHeader}>
                <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
                <Text style={styles.otpTitle}>Enter Verification Code</Text>
                <Text style={styles.otpSubtitle}>
                  Code sent to {countryCode} {phoneNumber}
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="key" size={20} color="#007AFF" />
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
                style={[styles.button, (loading || verifying) && styles.buttonDisabled]} 
                onPress={handleVerifyOtp} 
                disabled={loading || verifying}
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
                  Didn't receive code? Resend
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
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
  
  // Header Section
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

  // Loading State
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },

  // Form Container
  formContainer: {
    paddingHorizontal: 30,
    marginTop: 20,
  },

  // OTP Header
  otpHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  // Input Container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 16,
    paddingRight: 16,
  },

  // Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
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

  // Help Text
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Resend Button
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
}); 