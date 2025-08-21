import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import JobCard from '../components/JobCard';
import { API_BASE_URL } from '../utils/api';

export default function MyJobsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = async () => {
    try {
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
        console.log('Current user data:', user);
        console.log('All jobs:', allJobs);
        
        // Filter jobs by current client user - use MongoDB ID
        const clientJobs = allJobs.filter(job => {
          console.log('Job client:', job.client);
          console.log('User ID:', user.id || user._id);
          return job.client && (job.client._id === (user.id || user._id) || job.client === (user.id || user._id));
        });
        
        console.log('Filtered client jobs:', clientJobs);
        setJobs(clientJobs);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      Alert.alert('Error', 'Failed to load jobs');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  useEffect(() => {
    loadJobs();
  }, []);

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
        <Text style={styles.headerTitle}>My Posted Jobs</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Jobs List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              onPress={() => router.push(`/client/job-details/${job._id}`)}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No jobs posted yet</Text>
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
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
}); 