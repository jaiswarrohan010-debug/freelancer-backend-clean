import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
      const response = await fetch(`${API_BASE_URL}/jobs`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const jobs = await response.json();
      // Filter jobs by current client user (replace with real user ID)
      const clientId = 'current-user-id'; // TODO: Replace with actual logged-in user ID
      const clientJobs = jobs.filter(job => job.client && job.client._id === clientId);
      setPostedJobs(clientJobs);
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
              key={job.id}
              job={job}
              onPress={() => router.push(`/client/job-details/${job.id}`)}
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