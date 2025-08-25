import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    formatAmount,
    getPaymentHistory,
    getWalletBalance,
} from '../utils/payment';
import PhonePePaymentModal from './PhonePePaymentModal';

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPhonePeModal, setShowPhonePeModal] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadBalance(),
        loadTransactions(),
      ]);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const balanceData = await getWalletBalance();
      setBalance(balanceData.balance || 0);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const historyData = await getPaymentHistory(20, 0);
      setTransactions(historyData.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const handlePaymentSuccess = (paymentResult) => {
    console.log('Payment successful:', paymentResult);
    loadWalletData(); // Refresh wallet data
  };

  const handlePaymentFailure = (paymentResult) => {
    console.log('Payment failed:', paymentResult);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'credit':
        return 'arrow-down-circle';
      case 'debit':
        return 'arrow-up-circle';
      case 'refund':
        return 'refresh-circle';
      default:
        return 'card';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'credit':
        return '#4CAF50';
      case 'debit':
        return '#F44336';
      case 'refund':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceTitle}>Wallet Balance</Text>
          <Ionicons name="wallet" size={24} color="#007AFF" />
        </View>
        <Text style={styles.balanceAmount}>
          {formatAmount(balance)}
        </Text>
        <TouchableOpacity
          style={styles.addMoneyButton}
          onPress={() => setShowPhonePeModal(true)}
        >
          <Ionicons name="phone-portrait" size={20} color="#fff" />
          <Text style={styles.addMoneyText}>Add Money with PhonePe</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Ionicons name="card" size={24} color="#007AFF" />
          </View>
          <Text style={styles.actionText}>Send Money</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Ionicons name="download" size={24} color="#007AFF" />
          </View>
          <Text style={styles.actionText}>Withdraw</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Ionicons name="time" size={24} color="#007AFF" />
          </View>
          <Text style={styles.actionText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.transactionsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Your transaction history will appear here
              </Text>
            </View>
          ) : (
            transactions.map((transaction, index) => (
              <View key={transaction.id || index} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={getTransactionIcon(transaction.type)}
                    size={24}
                    color={getTransactionColor(transaction.type)}
                  />
                </View>
                
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>
                    {transaction.description || 'Transaction'}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.createdAt)}
                  </Text>
                </View>
                
                <View style={styles.transactionAmount}>
                  <Text
                    style={[
                      styles.amountText,
                      { color: getTransactionColor(transaction.type) },
                    ]}
                  >
                    {transaction.type === 'debit' ? '-' : '+'}
                    {formatAmount(transaction.amount)}
                  </Text>
                  <Text style={styles.transactionStatus}>
                    {transaction.status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* PhonePe Payment Modal */}
      <PhonePePaymentModal
        visible={showPhonePeModal}
        onClose={() => setShowPhonePeModal(false)}
        description="Wallet Recharge"
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  balanceCard: {
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
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  addMoneyButton: {
    backgroundColor: '#5F259F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  addMoneyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 80,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  transactionsSection: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  transactionsList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
  },
}); 