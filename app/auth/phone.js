import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, { firebase } from '@react-native-firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../utils/api';

export default function PhoneAuthScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = Platform.OS === 'android' ? `+91${phoneNumber}` : phoneNumber;
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
      setVerificationId(confirmation.verificationId);
      Alert.alert('Success', 'OTP sent successfully!');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }
    setLoading(true);
    try {
      const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, otp);
      const result = await auth().signInWithCredential(credential);
      // Get Firebase ID token for backend authentication
      const idToken = await result.user.getIdToken();
      
      // Call backend to get JWT token
      try {
        const response = await fetch(`${API_BASE_URL}/auth/firebase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken: idToken,
            role: role || 'client',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to authenticate with backend');
        }

        const authData = await response.json();
        
        // Store user info and JWT token
        await AsyncStorage.setItem('@user_data', JSON.stringify({
          uid: result.user.uid,
          phoneNumber: result.user.phoneNumber,
          role: role || 'client',
          id: authData.user.id, // Backend user ID
        }));
        
        // Store JWT token for API requests
        await AsyncStorage.setItem('@jwt_token', authData.token);
      } catch (error) {
        console.error('Backend authentication error:', error);
        Alert.alert('Error', 'Failed to authenticate with server. Please try again.');
        return;
      }
      // Navigate based on role
      if ((role || 'client') === 'client') {
        router.replace('/client/home');
      } else {
        router.replace('/freelancer/home');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In with Phone</Text>
      <Text style={styles.roleLabel}>Role: {role === 'freelancer' ? 'Freelancer' : 'Client'}</Text>
      {!verificationId ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Phone Number (e.g. 9876543210)"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={10}
          />
          <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Sending OTP...' : 'Send OTP'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={6}
          />
          <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center', width: '100%', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  roleLabel: { fontSize: 16, marginBottom: 12, color: '#666' },
}); 