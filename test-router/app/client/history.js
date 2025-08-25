import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../utils/api';

export default function ClientHistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [payments, setPayments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      // Get Firebase ID token for authentication
      const user = auth().currentUser;
      if (!user) {
        console.error('No user is currently signed in');
        return;
      }
      
      const firebaseIdToken = await user.getIdToken();
      if (!firebaseIdToken) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/jobs`, {
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const allJobs = await response.json();
      
      // Get current user data
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        const user = JSON.parse(userData);
        
        // Filter jobs by current client user that have been paid
        const paidJobs = allJobs.filter(job => {
          const isClientJob = job.client && (job.client._id === (user.id || user._id) || job.client === (user.id || user._id));
          const isPaidJob = job.status === 'paid' && job.freelancer;
          return isClientJob && isPaidJob;
        });
        
        // Sort by payment date (newest first)
        const sortedPayments = paidJobs.sort((a, b) => new Date(b.paidAt || b.updatedAt) - new Date(a.paidAt || a.updatedAt));
        
        setPayments(sortedPayments);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      Alert.alert('Error', 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // Refresh payments when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [])
  );

  const getPaymentStatusColor = () => {
    return '#34C759'; // Green for completed payments
  };

  const getPaymentStatusIcon = () => {
    return 'checkmark-circle'; // Checkmark for completed payments
  };

  const getPaymentStatusText = () => {
    return 'Paid'; // Text for completed payments
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentDate = (job) => {
    // Use payment date if available, otherwise use updated date
    return job.paidAt || job.updatedAt || job.createdAt;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>Payment History</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.placeholder }]}>Loading...</Text>
      </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payment History</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {payments.length > 0 ? (
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: colors.primary }]}>
              <Text style={styles.headerCell}>Work</Text>
              <Text style={styles.headerCell}>Freelancer</Text>
              <Text style={styles.headerCell}>Amount</Text>
              <Text style={styles.headerCell}>Date</Text>
            </View>

            {/* Table Rows */}
            {payments.map((payment, index) => (
              <TouchableOpacity
                key={payment._id}
                style={[
                  styles.tableRow, 
                  { 
                    backgroundColor: index % 2 === 0 ? colors.card : colors.background,
                    borderColor: colors.border 
                  }
                ]}
                onPress={() => router.push(`/client/job-details/${payment._id}`)}
              >
                <View style={styles.cell}>
                  <Text style={[styles.cellTitle, { color: colors.text }]} numberOfLines={1}>
                    {payment.title}
                  </Text>
                  <Text style={[styles.cellSubtitle, { color: colors.placeholder }]} numberOfLines={1}>
                    {payment.description}
                  </Text>
                </View>
                
                <View style={styles.cell}>
                  <Text style={[styles.cellText, { color: colors.text }]} numberOfLines={1}>
                    {payment.freelancer?.name || 'N/A'}
                  </Text>
                  <Text style={[styles.cellSubtitle, { color: colors.placeholder }]} numberOfLines={1}>
                    {payment.postOfficeName ? `${payment.postOfficeName}, ${payment.city}` : payment.city || 'Location'}
                  </Text>
                </View>
                
                <View style={styles.cell}>
                  <Text style={[styles.cellAmount, { color: colors.primary }]}>
                    ₹{payment.price}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor() + '20' }]}>
                    <Ionicons name={getPaymentStatusIcon()} size={12} color={getPaymentStatusColor()} />
                    <Text style={[styles.statusText, { color: getPaymentStatusColor() }]}>
                      {getPaymentStatusText()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cell}>
                  <Text style={[styles.cellText, { color: colors.text }]} numberOfLines={1}>
                    {formatDate(getPaymentDate(payment))}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={64} color={colors.placeholder} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Payment History</Text>
            <Text style={[styles.emptyText, { color: colors.placeholder }]}>
              You haven't made any payments yet. Your paid job history will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  tableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cellTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  cellText: {
    fontSize: 14,
    marginBottom: 2,
  },
  cellSubtitle: {
    fontSize: 12,
    marginBottom: 2,
  },
  cellAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 