import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DrawerMenu from '../components/DrawerMenu';
import JobCard from '../components/JobCard';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../utils/api';

export default function FreelancerHomeScreen() {
  const router = useRouter();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const { colors } = useTheme();
  const [availableJobs, setAvailableJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/jobs`);
        if (!response.ok) throw new Error('Failed to fetch jobs');
        const jobs = await response.json();
        setAvailableJobs(jobs);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };
    fetchJobs();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Menu */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setIsDrawerVisible(true)}
        >
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Freelancer Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Main Content */}
      <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Jobs</Text>
        
        {availableJobs.length > 0 ? (
          availableJobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              onPress={() => router.push(`/freelancer/job-details/${job._id}`)}
            />
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.placeholder }]}>No jobs available yet</Text>
        )}
      </ScrollView>

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
  menuButton: {
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
}); 