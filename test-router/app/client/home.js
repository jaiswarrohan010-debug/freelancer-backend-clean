import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DrawerMenu from '../components/DrawerMenu';
import JobCard from '../components/JobCard';
import { API_BASE_URL } from '../utils/api';

export default function ClientHomeScreen() {
  const router = useRouter();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [postedJobs, setPostedJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

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
      const jobs = await response.json();
      
      // Get current user data
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('Current user data:', user);
        console.log('All jobs:', jobs);
        
        // Filter jobs by current client user - use MongoDB ID
        const clientJobs = jobs.filter(job => {
          console.log('Job client:', job.client);
          console.log('User ID:', user.id || user._id);
          // Exclude paid jobs from dashboard - they should appear in history
          return job.client && 
                 (job.client._id === (user.id || user._id) || job.client === (user.id || user._id)) &&
                 job.status !== 'paid';
        });
        
        console.log('Filtered client jobs:', clientJobs);
        setPostedJobs(clientJobs);
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

  // Refresh jobs when screen comes into focus (e.g., when returning from job details)
  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [])
  );

  const handleMenuPress = () => {
    setIsDrawerVisible(!isDrawerVisible);
  };

  const handleMenuItemPress = (route) => {
    setIsDrawerVisible(false);
    router.push(route);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Clear all stored data
            AsyncStorage.clear();
            // Navigate to auth screen
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Menu */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={handleMenuPress}
        >
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Log Firebase ID Token Button */}
      <TouchableOpacity
        style={{ backgroundColor: '#34c759', padding: 12, borderRadius: 8, alignItems: 'center', margin: 16 }}
        onPress={async () => {
          try {
            const user = auth().currentUser;
            if (!user) {
              console.log('No user is currently signed in.');
              Alert.alert('Error', 'No user is currently signed in.');
              return;
            }
            const idToken = await user.getIdToken();
            console.log('FIREBASE ID TOKEN:', idToken);
            Alert.alert('ID Token logged to Metro console!');
          } catch (error) {
            console.log('Error getting ID token:', error);
            Alert.alert('Error', error.message);
          }
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Log Firebase ID Token</Text>
      </TouchableOpacity>

      {isMenuVisible && (
        <View style={styles.menu}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleMenuItemPress('/client/profile')}
          >
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleMenuItemPress('/client/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <TouchableOpacity 
          style={styles.postJobButton}
          onPress={() => router.push('/client/post-job')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.postJobButtonText}>Post a New Job</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Your Posted Jobs</Text>
        
        {postedJobs.length > 0 ? (
          postedJobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              role="client"
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No jobs posted yet</Text>
        )}
      </ScrollView>

      <DrawerMenu
        visible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        userRole="client"
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuButton: {
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
  menu: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutText: {
    color: '#FF3B30',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  postJobButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  postJobButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
}); 