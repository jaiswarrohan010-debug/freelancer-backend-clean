import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../utils/api';

export default function JobDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unassigning, setUnassigning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadJobDetails();
  }, [id]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      
      // Debug logs
      console.log('Loading job details for ID:', id);
      console.log('API_BASE_URL:', API_BASE_URL);
      
      // Get Firebase ID token for authentication
      const user = auth().currentUser;
      if (!user) {
        console.error('No user is currently signed in');
        Alert.alert('Error', 'No user is currently signed in');
        router.back();
        return;
      }
      
      const firebaseIdToken = await user.getIdToken();
      if (!firebaseIdToken) {
        console.error('No authentication token found');
        Alert.alert('Error', 'No authentication token found');
        router.back();
        return;
      }

      console.log('Making request to:', `${API_BASE_URL}/jobs/${id}`);
      const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        if (response.status === 404) {
          Alert.alert('Error', 'Job not found');
          router.back();
          return;
        }
        throw new Error(`Failed to fetch job details: ${response.status} - ${errorText}`);
      }
      
      const jobDetails = await response.json();
      console.log('Job details received:', jobDetails);
      setJob(jobDetails);
    } catch (error) {
      console.error('Error loading job details:', error);
      Alert.alert('Error', 'Failed to load job details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobDetails();
    setRefreshing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job posting? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get Firebase ID token for authentication
              const user = auth().currentUser;
              if (!user) {
                Alert.alert('Error', 'No user is currently signed in');
                return;
              }
              
              const firebaseIdToken = await user.getIdToken();
              if (!firebaseIdToken) {
                Alert.alert('Error', 'No authentication token found');
                return;
              }

              const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${firebaseIdToken}`
                }
              });
              
              if (!response.ok) {
                throw new Error('Failed to delete job');
              }
              
              Alert.alert('Success', 'Job deleted successfully');
              router.replace('/client/home');
            } catch (error) {
              console.error('Error deleting job:', error);
              Alert.alert('Error', 'Failed to delete job');
            }
          },
        },
      ]
    );
  };

  const handleUnassign = async () => {
    setUnassigning(true);
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'No user is currently signed in');
        setUnassigning(false);
        return;
      }
      const firebaseIdToken = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/jobs/${id}/unassign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to unassign job');
      await loadJobDetails();
      Alert.alert('Success', data.message);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to unassign job');
    } finally {
      setUnassigning(false);
    }
  };

  const handlePayment = async () => {
    setProcessingPayment(true);
    try {
      // Generate UPI payment link
      const upiId = 'your-upi-id@bank'; // Replace with actual UPI ID
      const amount = job.price;
      const paymentUrl = `upi://pay?pa=${upiId}&am=${amount}&tn=Job Payment - ${job.title}&cu=INR`;
      
      // Show UPI apps selection
      Alert.alert(
        'Payment',
        `Amount to pay: ₹${amount}\n\nSelect your preferred UPI app:`,
        [
          {
            text: 'Google Pay',
            onPress: () => openPaymentApp(paymentUrl, 'Google Pay')
          },
          {
            text: 'PhonePe',
            onPress: () => openPaymentApp(paymentUrl, 'PhonePe')
          },
          {
            text: 'Paytm',
            onPress: () => openPaymentApp(paymentUrl, 'Paytm')
          },
          {
            text: 'BHIM',
            onPress: () => openPaymentApp(paymentUrl, 'BHIM')
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const openPaymentApp = (paymentUrl, appName) => {
    // For now, we'll simulate payment success
    // In a real app, you would integrate with actual UPI apps
    Alert.alert(
      'Payment Simulation',
      `Opening ${appName} for payment...\n\nIn a real app, this would open ${appName} with the payment details.`,
      [
        {
          text: 'Simulate Success',
          onPress: () => confirmPayment()
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const confirmPayment = async () => {
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'No user is currently signed in');
        return;
      }
      const firebaseIdToken = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/jobs/${id}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to confirm payment');
      await loadJobDetails();
      Alert.alert('Success', 'Payment confirmed! The freelancer has been notified.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to confirm payment');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.container}>
        <Text>Job not found</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Only show edit and delete buttons if job is still open (not assigned or in progress) */}
          {job.status === 'open' && (
            <>
              <TouchableOpacity 
                style={{ backgroundColor: '#007AFF', borderRadius: 6, padding: 6, marginRight: 8 }}
                onPress={() => router.push(`/client/edit-job/${id}`)}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </>
          )}
          {/* Show a message when job is assigned or in progress */}
          {(job.status === 'assigned' || job.status === 'in_progress') && (
            <View style={{ padding: 8 }}>
              <Text style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>
                {job.status === 'assigned' ? 'Assigned' : 'In Progress'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {/* Show in-progress message if job is in progress */}
        {job.status === 'in_progress' && job.freelancer && (
          <View style={{ backgroundColor: '#e6f7ff', borderRadius: 8, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="play-circle-outline" size={20} color="#007AFF" style={{ marginRight: 8 }} />
            <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 16 }}>
              Freelancer ({job.freelancer.name}) started working...
            </Text>
          </View>
        )}
        {/* Freelancer Profile Image at the top */}
        {job.status === 'assigned' && job.freelancer && job.freelancer.profileImage && (
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={{ uri: `${API_BASE_URL}/users/${job.freelancer._id}/photo` }}
              style={{ width: 80, height: 80, borderRadius: 40 }}
            />
          </View>
        )}
        {/* Job Info Below */}
        <View style={styles.section}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.price}>₹{job.price}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <View>
              <Text style={styles.detailText}>{[job.flat, job.street].filter(Boolean).join(', ')}</Text>
              {job.landmark ? <Text style={styles.detailText}>Landmark: {job.landmark}</Text> : null}
              <Text style={styles.detailText}>{[job.city, job.state, job.pincode].filter(Boolean).join(', ')}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={20} color="#666" />
            <Text style={styles.detailText}>{job.peopleRequired} people required</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.detailText}>Gender: {job.genderPreference}</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.detailText}>
              Posted on {new Date(job.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {job.status === 'assigned' && job.freelancer && (
            <View style={styles.detailItem}> 
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={styles.detailText}>Assigned to: {job.freelancer.name}</Text>
            </View>
          )}
        </View>

        {job.status === 'assigned' && job.freelancer && (
          <TouchableOpacity 
            style={styles.freelancerButton}
            onPress={() => router.push(`/client/freelancer-profile?id=${job.freelancer._id}&jobId=${job._id}`)}
          >
            <Ionicons name="person-circle-outline" size={20} color="#fff" />
            <Text style={styles.freelancerButtonText}>View Freelancer Profile</Text>
          </TouchableOpacity>
        )}
        {/* Unassign Freelancer Button (only if assigned and not in progress/completed) */}
        {job.status === 'assigned' && job.freelancer && (
          <TouchableOpacity
            style={{ backgroundColor: '#FF3B30', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12, marginBottom: 0 }}
            onPress={handleUnassign}
            disabled={unassigning}
          >
            <Ionicons name="close-circle-outline" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Unassign Freelancer</Text>
          </TouchableOpacity>
        )}

        {/* Pay Button (only if job is completed) */}
        {job.status === 'completed' && job.freelancer && (
          <TouchableOpacity
            style={{ backgroundColor: '#34C759', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 16, marginBottom: 0 }}
            onPress={handlePayment}
            disabled={processingPayment}
          >
            <Ionicons name="card-outline" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>
              {processingPayment ? 'Processing...' : `Pay ₹${job.price}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
  deleteButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  details: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  freelancerButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  freelancerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 