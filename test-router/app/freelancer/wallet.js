import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DrawerMenu from '../components/DrawerMenu';
import { API_BASE_URL } from '../utils/api';

export default function FreelancerWalletScreen() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [userProfile, setUserProfile] = useState(null);


  const fetchWalletData = async () => {
    try {
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        Alert.alert('Error', 'No user is currently signed in');
        return;
      }

      const firebaseIdToken = await firebaseUser.getIdToken();
      const userData = await AsyncStorage.getItem('@user_data');
      
      if (!userData) {
        Alert.alert('Error', 'Please login again');
        return;
      }

      const user = JSON.parse(userData);
      const headers = {
        'Authorization': `Bearer ${firebaseIdToken}`,
        'Content-Type': 'application/json'
      };

      // Fetch balance and transactions in parallel for better performance
      const [balanceResponse, transactionsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/wallet/balance`, { headers }),
        fetch(`${API_BASE_URL}/wallet/transactions`, { headers })
      ]);

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setBalance(balanceData.balance);
      }

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        console.log('Wallet: Transactions received:', transactionsData.transactions.length, 'transactions');
        setTransactions(transactionsData.transactions);
      } else {
        console.log('Wallet: Failed to fetch transactions:', transactionsResponse.status);
      }

      // Fetch user profile to check bank details using Firebase token
      try {
        const firebaseUser = auth().currentUser;
        if (firebaseUser) {
          const firebaseIdToken = await firebaseUser.getIdToken();
          const profileResponse = await fetch(`${API_BASE_URL}/users/${user.id || user._id}`, {
            headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
          });
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('Wallet: User profile loaded:', profileData.bankDetails);
            setUserProfile(profileData);
          } else {
            console.log('Wallet: Failed to load profile:', profileResponse.status);
          }
        }
      } catch (profileError) {
        console.error('Wallet: Error loading profile:', profileError);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Refresh profile data when component comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Wallet screen focused, refreshing profile data');
      fetchWalletData();
    }, [])
  );

  const handleWithdrawalSubmit = async () => {
    try {
      console.log('Submitting withdrawal request for amount:', balance);
      
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const firebaseIdToken = await firebaseUser.getIdToken(true);
      console.log('Withdrawal: Token generated, length:', firebaseIdToken.length);
      
      // Create withdrawal transaction
      const withdrawalResponse = await fetch(`${API_BASE_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: balance,
          bankDetails: userProfile.bankDetails
        })
      });

      if (withdrawalResponse.ok) {
        const withdrawalData = await withdrawalResponse.json();
        console.log('Withdrawal submitted successfully:', withdrawalData);
        
        // Update local state
        setBalance(0);
        setTransactions(prevTransactions => [
          {
            id: withdrawalData.transaction._id,
            type: 'debit',
            category: 'withdrawal',
            amount: balance,
            currency: 'INR',
            status: 'pending',
            description: 'Withdrawal to bank account',
            createdAt: new Date().toISOString(),
            withdrawalStatus: 'pending'
          },
          ...prevTransactions
        ]);

        Alert.alert(
          'Withdrawal Requested',
          'Your withdrawal request has been submitted successfully.',
          [{ 
            text: 'OK', 
            style: 'default',
            onPress: () => console.log('Withdrawal confirmed')
          }]
        );
      } else {
        const errorData = await withdrawalResponse.json();
        console.error('Withdrawal failed:', errorData);
        Alert.alert('Error', errorData.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Withdrawal submit error:', error);
      Alert.alert('Error', 'Failed to submit withdrawal request. Please try again.');
    }
  };

  const handleWithdraw = () => {
    console.log('Withdraw clicked. User profile:', userProfile);
    console.log('Bank details:', userProfile?.bankDetails);
    
    // Check if user has bank details
    const hasBankDetails = userProfile?.bankDetails?.accountNumber && 
                          userProfile?.bankDetails?.ifscCode;

    console.log('Has bank details:', hasBankDetails);

    if (!hasBankDetails) {
      Alert.alert(
        'Bank Details Required',
        'To withdraw funds, please add your bank details in the profile section first.\n\nGo to Profile → Bank Account Details to add your information.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Bank Details', onPress: () => {
            // Navigate to profile screen
            Alert.alert(
              'Information', 
              'Please go to Profile page to add your bank account details.\n\nYou\'ll need:\n• Bank Account Number\n• IFSC Code\n\nOnce added, you can withdraw your earnings!'
            );
          }}
        ]
      );
      return;
    }

    // Check if user has sufficient balance
    if (balance <= 0) {
      Alert.alert(
        'Insufficient Balance',
        'You need to have funds in your wallet to make a withdrawal.\n\nComplete more jobs to earn money!',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Show withdrawal form with styled content
    const maskedAccountNumber = userProfile.bankDetails.accountNumber.length > 4 
      ? '*'.repeat(userProfile.bankDetails.accountNumber.length - 4) + userProfile.bankDetails.accountNumber.slice(-4)
      : userProfile.bankDetails.accountNumber;

    Alert.alert(
      'Withdraw Funds',
      `Bank Details:\n┌─────────────────────────┐\n│ Account: ${maskedAccountNumber} │\n│ IFSC: ${userProfile.bankDetails.ifscCode} │\n└─────────────────────────┘\n\nYour withdrawal will be processed within 2-3 business days.`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('Withdrawal cancelled')
        },
        { 
          text: 'Proceed', 
          style: 'default',
          onPress: () => {
            handleWithdrawalSubmit();
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchWalletData();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => setIsDrawerVisible(true)}
        >
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Ionicons name="wallet-outline" size={32} color="#007AFF" />
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[
                styles.withdrawButton, 
                { 
                  opacity: userProfile?.bankDetails?.accountNumber ? 1 : 0.6,
                  backgroundColor: userProfile?.bankDetails?.accountNumber ? '#34C759' : '#007AFF'
                }
              ]} 
              onPress={handleWithdraw}
            >
              <Ionicons 
                name={userProfile?.bankDetails?.accountNumber ? "wallet-outline" : "add-circle-outline"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.withdrawButtonText}>
                {userProfile?.bankDetails?.accountNumber ? 'Withdraw' : 'Add Bank Details'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Transaction History</Text>
      <ScrollView 
        style={styles.transactions}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {transactions.length > 0 ? (
          transactions.map(tx => (
            <View key={tx.id} style={styles.transactionItem}>
              <Ionicons
                name={tx.type === 'credit' ? 'arrow-down-outline' : 'arrow-up-outline'}
                size={20}
                color={tx.type === 'credit' ? '#34C759' : '#FF3B30'}
                style={{ marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.txDescription}>
                  {tx.category === 'job_payment' ? `Payment for: ${tx.jobTitle || 'Job'}` : tx.description}
                </Text>
                <Text style={styles.txDate}>
                  {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>

              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#34C759' : '#FF3B30' }] }>
                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
          </View>
        )}
      </ScrollView>
      </View>

      <DrawerMenu
        visible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        userRole="freelancer"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 12,
  },
  balanceCard: {
    backgroundColor: '#f4f8ff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    flex: 1,
  },
  withdrawButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  transactions: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  txDescription: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  txDate: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  txClient: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
    fontWeight: '500',
  },
  txAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  txStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
}); 