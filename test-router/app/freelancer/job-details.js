import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../utils/api';

export default function FreelancerJobDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasBasicProfile, setHasBasicProfile] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [startingWork, setStartingWork] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [workDone, setWorkDone] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadJobDetails();
    checkProfileCompletion();
  }, [id]);

  const loadCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      
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

      // Debug logs
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Job ID:', id);
      console.log('Fetching:', `${API_BASE_URL}/jobs/${id}`);
      console.log('Token:', firebaseIdToken);

      // Add cache-busting param to always fetch latest job data
      const response = await fetch(`${API_BASE_URL}/jobs/${id}?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          Alert.alert('Error', 'Job not found');
          router.back();
          return;
        }
        throw new Error('Failed to fetch job details');
      }
      
      const jobDetails = await response.json();
      console.log('Fetched job in job details:', jobDetails);
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

  const checkProfileCompletion = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      if (!userData) {
        setProfileComplete(false);
        setProfileChecked(true);
        return;
      }
      const user = JSON.parse(userData);
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        setProfileComplete(false);
        setProfileChecked(true);
        return;
      }
      const firebaseIdToken = await firebaseUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/users/${user.id || user._id}`, {
        headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
      });
      if (!response.ok) {
        setProfileComplete(false);
        setProfileChecked(true);
        return;
      }
      const profile = await response.json();
      // Check if profile is complete (all required fields filled)
      const isProfileComplete = Boolean(
        profile.name && typeof profile.name === 'string' && profile.name.trim() &&
        profile.address && typeof profile.address === 'string' && profile.address.trim() &&
        profile.gender && typeof profile.gender === 'string' && profile.gender.trim() &&
        profile.profileImage && typeof profile.profileImage === 'string' && profile.profileImage.trim()
      );
      
      // Profile is complete only if verified AND has all required fields
      const isComplete = isProfileComplete && profile.isVerified === true;
      
      setIsVerified(profile.isVerified === true);
      setHasBasicProfile(isProfileComplete);
      setProfileComplete(isComplete);
      setProfileChecked(true);
    } catch (e) {
      setProfileComplete(false);
      setProfileChecked(true);
      setHasBasicProfile(false);
    }
  };

  const handlePickupWork = async () => {
    if (!profileChecked) {
      Alert.alert('Please wait', 'Checking your profile info...');
      return;
    }
    if (!isVerified) {
      Alert.alert('Verification Required', 'Your profile is under review. You cannot pick up work until your documents are approved.');
      return;
    }
    if (!isProfileComplete) {
      Alert.alert('Profile Incomplete', 'Please complete your profile before picking up work.');
      return;
    }
    Alert.alert(
      'Pickup Work',
      'Are you sure you want to pickup this job? This will assign the job to you.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Pickup Work',
          style: 'default',
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

              const response = await fetch(`${API_BASE_URL}/jobs/${id}/pickup`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${firebaseIdToken}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to pickup work');
              }
              await loadJobDetails();
              Alert.alert('Success', 'Job picked up successfully! The client will be notified.');
            } catch (error) {
              console.error('Error picking up work:', error);
              Alert.alert('Error', error.message || 'Failed to pickup work');
            }
          },
        },
      ]
    );
  };

  // Helper: check if job is assigned to current freelancer
  const isAssignedToMe = job && job.status === 'assigned' && currentUser && job.freelancer && (job.freelancer._id === (currentUser.id || currentUser._id));
  // Helper: check if job is in progress and assigned to me
  const isInProgressForMe = job && job.status === 'in_progress' && currentUser && job.freelancer && (job.freelancer._id === (currentUser.id || currentUser._id));
  // Helper: check if job is completed and assigned to me
  const isCompletedForMe = job && job.status === 'completed' && currentUser && job.freelancer && (job.freelancer._id === (currentUser.id || currentUser._id));
  // Helper: check if job is paid and assigned to me
  const isPaidForMe = job && job.status === 'paid' && currentUser && job.freelancer && (job.freelancer._id === (currentUser.id || currentUser._id));

  const handleStartWork = async () => {
    setStartingWork(true);
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'No user is currently signed in');
        setStartingWork(false);
        return;
      }
      const firebaseIdToken = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/jobs/${id}/start-work`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to start work');
      await loadJobDetails();
      Alert.alert('Success', data.message);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to start work');
    } finally {
      setStartingWork(false);
    }
  };

  const handleWorkDone = async () => {
    setWaitingForPayment(true);
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'No user is currently signed in');
        setWaitingForPayment(false);
        return;
      }
      const firebaseIdToken = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/jobs/${id}/work-done`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to mark work as done');
      await loadJobDetails();
      Alert.alert('Success', 'Work marked as completed! Waiting for client payment.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to mark work as done');
    } finally {
      setWaitingForPayment(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 18, marginTop: 16 }}>Loading job details...</Text>
        </View>
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
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Client Profile Image at the top */}
        {job.client && job.client.profileImage && (
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={{ uri: `${API_BASE_URL}/users/${job.client._id}/photo` }}
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

          {job.client && (
            <View style={styles.detailItem}> 
              <Ionicons name="person-circle-outline" size={20} color="#666" />
              <Text style={styles.detailText}>Posted by: {job.client.name}</Text>
            </View>
          )}
          {isAssignedToMe && (
            <View style={styles.detailItem}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={styles.detailText}>Assigned to you</Text>
            </View>
          )}
          {isCompletedForMe && (
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#FF9500" />
              <Text style={styles.detailText}>Work completed - Waiting for client payment</Text>
            </View>
          )}
          {isPaidForMe && (
            <View style={styles.detailItem}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={styles.detailText}>Payment received - Job completed successfully</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.pickupButton,
            (!profileComplete || !profileChecked)
              ? { backgroundColor: '#ccc' }
              : isAssignedToMe 
                ? { backgroundColor: '#34C759' }
                : isInProgressForMe 
                  ? { backgroundColor: '#FF9500' }
                  : isCompletedForMe
                    ? { backgroundColor: '#FF3B30' }
                    : isPaidForMe
                      ? { backgroundColor: '#34C759' }
                      : { backgroundColor: '#007AFF' }
          ]}
          onPress={
            isAssignedToMe 
              ? handleStartWork 
              : isInProgressForMe 
                ? handleWorkDone 
                : handlePickupWork
          }
          disabled={!profileComplete || !profileChecked || waitingForPayment}
        >
          <Ionicons 
            name={
              isAssignedToMe 
                ? "play-circle-outline" 
                : isInProgressForMe 
                  ? "checkmark-circle-outline" 
                  : isCompletedForMe
                    ? "time-outline"
                    : isPaidForMe
                      ? "checkmark-circle"
                      : "briefcase-outline"
            } 
            size={20} 
            color="#fff" 
          />
          <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>
            {isAssignedToMe 
              ? (startingWork ? 'Starting...' : 'Start Work') 
              : isInProgressForMe 
                ? (waitingForPayment ? 'Waiting for Payment...' : 'Work Done') 
                : isCompletedForMe
                  ? 'Waiting for Payment'
                  : isPaidForMe
                    ? 'Received'
                    : 'Pickup Work'
            }
          </Text>
          {waitingForPayment && (
            <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />
          )}
        </TouchableOpacity>
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
  placeholder: {
    width: 40,
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
  pickupButton: {
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 