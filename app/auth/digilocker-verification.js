import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import DigiLockerWebView from '../components/DigiLockerWebView';
import { API_BASE_URL } from '../utils/api';

export default function DigiLockerVerificationScreen() {
  const router = useRouter();
  const { role, userId, phoneNumber } = useLocalSearchParams();
  const [showDigiLocker, setShowDigiLocker] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDigiLockerSuccess = async (data) => {
    console.log('DigiLocker success:', data);
    setVerificationData(data);
    setShowDigiLocker(false);
    
    // Extract Aadhaar data from DigiLocker response
    try {
      setLoading(true);
      
      // Parse the verification data
      const aadhaarData = parseAadhaarData(data);
      
      if (!aadhaarData) {
        Alert.alert('Error', 'Could not extract Aadhaar data. Please try again.');
        return;
      }

      // Update user profile with Aadhaar data
      const userData = await AsyncStorage.getItem('@user_data');
      const jwtToken = await AsyncStorage.getItem('@jwt_token');
      
      if (!userData || !jwtToken) {
        Alert.alert('Error', 'User session not found. Please login again.');
        router.replace('/auth');
        return;
      }

      const user = JSON.parse(userData);
      
      // Update user profile with Aadhaar data using verification endpoint
      const updateResponse = await fetch(`${API_BASE_URL}/users/${user.id}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: aadhaarData.name,
          dateOfBirth: aadhaarData.dateOfBirth,
          gender: aadhaarData.gender,
          address: aadhaarData.address,
          aadhaarNumber: aadhaarData.aadhaarNumber,
          verificationData: data
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update user profile');
      }

      // Navigate to success screen
      router.replace(`/auth/success?role=${role}&name=${aadhaarData.name || 'User'}`);

    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDigiLockerError = (error) => {
    console.log('DigiLocker error:', error);
    setShowDigiLocker(false);
    
    Alert.alert(
      'Verification Failed',
      error.message || 'Document verification failed. Please try again.',
      [
        {
          text: 'Try Again',
          onPress: () => setShowDigiLocker(true)
        }
      ]
    );
  };

  const handleCloseDigiLocker = () => {
    setShowDigiLocker(false);
  };

  const startVerification = () => {
    setShowDigiLocker(true);
  };



  // Parse Aadhaar data from DigiLocker response
  const parseAadhaarData = (data) => {
    try {
      // This is a placeholder - you'll need to adjust based on actual DigiLocker response format
      if (data && data.data) {
        return {
          name: data.data.name || data.data.fullName,
          dateOfBirth: data.data.dateOfBirth || data.data.dob,
          gender: data.data.gender,
          address: data.data.address || data.data.fullAddress,
          aadhaarNumber: data.data.aadhaarNumber || data.data.uid
        };
      }
      return null;
    } catch (error) {
      console.error('Error parsing Aadhaar data:', error);
      return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Identity Verification</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={80} color="#007AFF" />
        </View>

        <Text style={styles.title}>Verify Your Identity</Text>
        <Text style={styles.subtitle}>
          Complete your account setup with secure DigiLocker verification
        </Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.infoText}>Government-verified identity</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.infoText}>Secure and encrypted</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.infoText}>Quick verification process</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={startVerification}
            disabled={loading}
          >
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>
              {loading ? 'Processing...' : 'Start Verification'}
            </Text>
          </TouchableOpacity>


        </View>

        <Text style={styles.helpText}>
          Verification helps ensure the security of our platform and builds trust with clients.
        </Text>
      </View>

      {/* DigiLocker WebView Modal */}
      <Modal
        visible={showDigiLocker}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <DigiLockerWebView
          onSuccess={handleDigiLockerSuccess}
          onError={handleDigiLockerError}
          onClose={handleCloseDigiLocker}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  infoContainer: {
    width: '100%',
    marginBottom: 40,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 30,
  },
});
