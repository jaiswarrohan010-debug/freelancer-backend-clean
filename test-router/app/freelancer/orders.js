import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../utils/api';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'No user is currently signed in');
        return;
      }
      
      // Get current user data first
      const userData = await AsyncStorage.getItem('@user_data');
      if (!userData) {
        setOrders([]);
        return;
      }
      
      const userInfo = JSON.parse(userData);
      const currentUserId = userInfo.id || userInfo._id;
      
      const firebaseIdToken = await user.getIdToken();
      
      // Use a more specific endpoint to get only paid jobs for this freelancer
      const response = await fetch(`${API_BASE_URL}/jobs/status/paid`, {
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`
        }
      });
      
      if (!response.ok) {
        // Fallback to fetching all jobs if specific endpoint doesn't work
        const allJobsResponse = await fetch(`${API_BASE_URL}/jobs`, {
          headers: {
            'Authorization': `Bearer ${firebaseIdToken}`
          }
        });
        
        if (!allJobsResponse.ok) throw new Error('Failed to fetch orders');
        const allJobs = await allJobsResponse.json();
        
        // Filter jobs that are paid and assigned to current freelancer
        const freelancerOrders = allJobs.filter(job => {
          return job.status === 'paid' && 
                 job.freelancer && 
                 (job.freelancer._id === currentUserId || job.freelancer === currentUserId);
        });
        
        // Sort by payment date (newest first)
        const sortedPayments = freelancerOrders.sort((a, b) => new Date(b.paidAt || b.updatedAt) - new Date(a.paidAt || a.updatedAt));
        
        setOrders(sortedPayments);
      } else {
        const paidJobs = await response.json();
        // Filter for current freelancer
        const freelancerOrders = paidJobs.filter(job => {
          return job.freelancer && 
                 (job.freelancer._id === currentUserId || job.freelancer === currentUserId);
        });
        
        // Sort by payment date (newest first)
        const sortedPayments = freelancerOrders.sort((a, b) => new Date(b.paidAt || b.updatedAt) - new Date(a.paidAt || a.updatedAt));
        
        setOrders(sortedPayments);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#34C759';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Payment Received';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#666', fontSize: 16 }}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {orders.length > 0 ? (
          orders.map((order) => (
            <View key={order._id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderTitle}>{order.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                </View>
              </View>
              
              <Text style={styles.orderDescription} numberOfLines={2}>
                {order.description}
              </Text>
              
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>₹{order.price}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {[order.city, order.state].filter(Boolean).join(', ')}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    Client: {order.client?.name || 'Unknown'}
                  </Text>
                </View>
                
                {order.completedAt && (
                  <View style={styles.detailRow}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      Completed: {formatDate(order.completedAt)}
                    </Text>
                  </View>
                )}
                
                {order.paidAt && (
                  <View style={styles.detailRow}>
                    <Ionicons name="card-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      Paid: {formatDate(order.paidAt)}
                    </Text>
                  </View>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => router.push(`/freelancer/job-details?id=${order._id}`)}
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No paid orders yet</Text>
            <Text style={styles.emptySubtext}>
              Your paid work will appear here once clients complete payment
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
    backgroundColor: '#fff',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  orderDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  viewDetailsText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
}); 