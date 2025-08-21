import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
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
import { API_BASE_URL } from '../utils/api';

export default function BankAccountVerification({ onVerificationComplete }) {
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedData, setVerifiedData] = useState(null);

  const verifyAccount = async () => {
    if (!accountNumber || !ifscCode) {
      Alert.alert('Error', 'Please enter both account number and IFSC code');
      return;
    }

    // Validate account number format
    if (!/^\d{9,18}$/.test(accountNumber)) {
      Alert.alert('Error', 'Account number should be 9-18 digits');
      return;
    }

    // Validate IFSC code format
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
      Alert.alert('Error', 'Invalid IFSC code format');
      return;
    }

    setVerifying(true);

    try {
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const firebaseIdToken = await firebaseUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/bank-verification/verify-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountNumber: accountNumber,
          ifscCode: ifscCode.toUpperCase()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setVerifiedData(data);
        Alert.alert(
          'Account Verified!',
          `Account Holder: ${data.accountHolderName}\nBank: ${data.bankName || 'N/A'}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Save Details', 
              onPress: () => saveBankDetails(data.accountHolderName)
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', data.error || 'Unable to verify account');
      }
    } catch (error) {
      console.error('Bank verification error:', error);
      Alert.alert('Error', 'Failed to verify account. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const saveBankDetails = async (accountHolderName) => {
    try {
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const firebaseIdToken = await firebaseUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/bank-verification/update-bank-details`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountNumber: accountNumber,
          ifscCode: ifscCode.toUpperCase(),
          accountHolderName: accountHolderName
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Bank details saved successfully!');
        if (onVerificationComplete) {
          onVerificationComplete(data.bankDetails);
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to save bank details');
      }
    } catch (error) {
      console.error('Save bank details error:', error);
      Alert.alert('Error', 'Failed to save bank details');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bank Account Verification</Text>
      <Text style={styles.subtitle}>
        Enter your bank account details to automatically fetch the account holder name
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Account Number</Text>
        <TextInput
          style={styles.input}
          value={accountNumber}
          onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, ''))}
          placeholder="Enter account number"
          keyboardType="numeric"
          maxLength={18}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>IFSC Code</Text>
        <TextInput
          style={styles.input}
          value={ifscCode}
          onChangeText={(text) => setIfscCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="Enter IFSC code"
          autoCapitalize="characters"
          maxLength={11}
        />
      </View>

      <TouchableOpacity 
        style={[styles.verifyButton, verifying && styles.verifyButtonDisabled]}
        onPress={verifyAccount}
        disabled={verifying}
      >
        {verifying ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.verifyButtonText}>Verify Account</Text>
          </>
        )}
      </TouchableOpacity>

      {verifiedData && (
        <View style={styles.verifiedContainer}>
          <View style={styles.verifiedHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.verifiedTitle}>Account Verified</Text>
          </View>
          
          <View style={styles.verifiedDetails}>
            <Text style={styles.detailItem}>
              <Text style={styles.detailLabel}>Account Holder: </Text>
              {verifiedData.accountHolderName}
            </Text>
            {verifiedData.bankName && (
              <Text style={styles.detailItem}>
                <Text style={styles.detailLabel}>Bank: </Text>
                {verifiedData.bankName}
              </Text>
            )}
            <Text style={styles.detailItem}>
              <Text style={styles.detailLabel}>Account Number: </Text>
              {accountNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}
            </Text>
            <Text style={styles.detailItem}>
              <Text style={styles.detailLabel}>IFSC Code: </Text>
              {ifscCode}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>• Enter your account number and IFSC code</Text>
        <Text style={styles.infoText}>• We'll verify the account with your bank</Text>
        <Text style={styles.infoText}>• Fetch the registered account holder name</Text>
        <Text style={styles.infoText}>• Save verified bank details to your profile</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20
  },
  inputContainer: {
    marginBottom: 16
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    marginBottom: 20
  },
  verifyButtonDisabled: {
    backgroundColor: '#ccc'
  },
  verifyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8
  },
  verifiedContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#34C759'
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  verifiedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
    marginLeft: 8
  },
  verifiedDetails: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8
  },
  detailItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6
  },
  detailLabel: {
    fontWeight: '600',
    color: '#666'
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20
  }
});
