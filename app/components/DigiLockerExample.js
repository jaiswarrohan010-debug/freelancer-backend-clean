import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DigiLockerWebView from './DigiLockerWebView';

export default function DigiLockerExample() {
  const [showDigiLocker, setShowDigiLocker] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  const handleDigiLockerSuccess = (data) => {
    console.log('DigiLocker success:', data);
    setVerificationData(data);
    setShowDigiLocker(false);
    
    Alert.alert(
      'Verification Successful',
      'Your documents have been verified successfully!',
      [{ text: 'OK' }]
    );
  };

  const handleDigiLockerError = (error) => {
    console.log('DigiLocker error:', error);
    setShowDigiLocker(false);
    
    Alert.alert(
      'Verification Failed',
      error.message || 'Document verification failed. Please try again.',
      [{ text: 'OK' }]
    );
  };

  const handleCloseDigiLocker = () => {
    setShowDigiLocker(false);
  };

  const startVerification = () => {
    setShowDigiLocker(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={24} color="#6c63ff" />
        <Text style={styles.title}>Document Verification</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Verify your identity using DigiLocker. This will help us ensure the security of our platform.
        </Text>

        <TouchableOpacity style={styles.verifyButton} onPress={startVerification}>
          <Ionicons name="document-text" size={20} color="#fff" />
          <Text style={styles.verifyButtonText}>Start Verification</Text>
        </TouchableOpacity>

        {verificationData && (
          <View style={styles.resultContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.resultText}>Verification completed successfully!</Text>
            <Text style={styles.resultDetails}>
              Status: {verificationData.status}
            </Text>
          </View>
        )}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  verifyButton: {
    backgroundColor: '#6c63ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 20,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 10,
    textAlign: 'center',
  },
  resultDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});
