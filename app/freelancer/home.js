import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DrawerMenu from '../components/DrawerMenu';
import JobCard from '../components/JobCard';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../utils/api';

export default function FreelancerHomeScreen() {
  const router = useRouter();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const { colors } = useTheme();
  const [availableJobs, setAvailableJobs] = useState([]);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasBasicProfile, setHasBasicProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'assigned'
  const [verificationStatus, setVerificationStatus] = useState('pending'); // 'pending', 'verified', 'rejected'
  const [isVerified, setIsVerified] = useState(false);
  const [freelancerId, setFreelancerId] = useState('');
  const [userData, setUserData] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const loadCurrentUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id || user._id);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const fetchJobs = async () => {
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

      console.log('Fetching jobs from:', `${API_BASE_URL}/jobs`);
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`
        }
      });
      console.log('Jobs response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jobs fetch error:', errorText);
        throw new Error('Failed to fetch jobs');
      }
      const allJobs = await response.json();
      console.log('Jobs fetched successfully:', allJobs.length, 'jobs');
      
      // Separate jobs into available and assigned
      let available = allJobs.filter(job => job.status === 'open');
      let assigned = allJobs.filter(job => {
        if ((job.status === 'assigned' || job.status === 'in_progress' || job.status === 'completed') && job.freelancer && currentUserId) {
          if (typeof job.freelancer === 'string' && job.freelancer === currentUserId) return true;
          if (typeof job.freelancer === 'object' && (job.freelancer._id === currentUserId || job.freelancer === currentUserId)) return true;
        }
        return false;
      });
      setAvailableJobs(available);
      setAssignedJobs(assigned);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Don't show alert for network errors, just log them
      // The jobs will remain empty and user can retry with pull-to-refresh
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    await checkProfileCompletion();
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
      console.log('Profile data received:', profile);
      // Check if profile is complete (all required fields filled)
      const isProfileComplete = Boolean(
        profile.name && typeof profile.name === 'string' && profile.name.trim() &&
        profile.address && typeof profile.address === 'string' && profile.address.trim() &&
        profile.gender && typeof profile.gender === 'string' && profile.gender.trim() &&
        profile.profileImage && typeof profile.profileImage === 'string' && profile.profileImage.trim() &&
        profile.experience && typeof profile.experience === 'string' && profile.experience.trim() &&
        profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0
      );
      
      // Profile is complete only if verified AND has all required fields
      const isComplete = isProfileComplete && profile.isVerified === true;
      
      // Set verification status
      setIsVerified(profile.isVerified === true);
      setVerificationStatus(profile.verificationStatus || 'pending');
      setFreelancerId(profile.freelancerId || '');
      setHasBasicProfile(isProfileComplete);
      
      // Handle rejection status
      if (profile.verificationStatus === 'rejected') {
        setRejectionReason(profile.adminComments || 'Verification documents were not clear or incomplete');
        setShowRejectionModal(true);
      } else if (profile.verificationStatus === 'pending') {
        // Check if user has any pending verification entries
        try {
          const verificationResponse = await fetch(`${API_BASE_URL}/verifications/initial`, {
            headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
          });
          
          if (verificationResponse.ok) {
            const initialVerifications = await verificationResponse.json();
            const userInitialVerification = initialVerifications.verifications?.find(v => v.userId === (user.id || user._id));
            
            const resubmissionResponse = await fetch(`${API_BASE_URL}/verifications/resubmissions`, {
              headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
            });
            
            let userResubmissionVerification = null;
            if (resubmissionResponse.ok) {
              const resubmissionVerifications = await resubmissionResponse.json();
              userResubmissionVerification = resubmissionVerifications.verifications?.find(v => v.userId === (user.id || user._id));
            }
            
            // If user has any pending verification (initial or resubmission), don't show rejection modal
            if (userInitialVerification || userResubmissionVerification) {
              console.log('User has pending verification, showing "Under Review"');
              setShowRejectionModal(false);
              setRejectionReason('');
            } else {
              // User clicked "Re-Submit" but hasn't completed verification yet
              setRejectionReason(profile.adminComments || 'Verification documents were not clear or incomplete');
              setShowRejectionModal(true);
            }
          } else {
            // Fallback to old logic if verification endpoints fail
            const hasVerificationDocuments = profile.documents && 
              profile.documents.aadhaar && 
              profile.documents.aadhaar.front && 
              profile.documents.aadhaar.back &&
              profile.documents.pan && 
              profile.documents.pan.front;
            
            if (!hasVerificationDocuments) {
              setRejectionReason(profile.adminComments || 'Verification documents were not clear or incomplete');
              setShowRejectionModal(true);
            } else {
              setShowRejectionModal(false);
              setRejectionReason('');
            }
          }
        } catch (error) {
          console.error('Error checking verification status:', error);
          // Fallback to old logic
          const hasVerificationDocuments = profile.documents && 
            profile.documents.aadhaar && 
            profile.documents.aadhaar.front && 
            profile.documents.aadhaar.back &&
            profile.documents.pan && 
            profile.documents.pan.front;
          
          if (!hasVerificationDocuments) {
            setRejectionReason(profile.adminComments || 'Verification documents were not clear or incomplete');
            setShowRejectionModal(true);
          } else {
            setShowRejectionModal(false);
            setRejectionReason('');
          }
        }
      } else {
        setShowRejectionModal(false);
        setRejectionReason('');
      }
      
      // Set user data for drawer
      setUserData({
        name: profile.name,
        profileImage: profile.profileImage,
        freelancerId: profile.freelancerId
      });
      console.log('Profile completion status:', isComplete);
      console.log('Profile completion check:', {
        name: Boolean(profile.name && typeof profile.name === 'string' && profile.name.trim()),
        address: Boolean(profile.address && typeof profile.address === 'string' && profile.address.trim()),
        gender: Boolean(profile.gender && typeof profile.gender === 'string' && profile.gender.trim()),
        profileImage: Boolean(profile.profileImage && typeof profile.profileImage === 'string' && profile.profileImage.trim()),
        experience: Boolean(profile.experience && typeof profile.experience === 'string' && profile.experience.trim()),
        skills: Boolean(profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0),
        isProfileComplete,
        isVerified: profile.isVerified === true,
        isComplete,
        freelancerId: profile.freelancerId
      });
      setProfileComplete(isComplete);
      setProfileChecked(true);
    } catch (e) {
      setProfileComplete(false);
      setProfileChecked(true);
      setHasBasicProfile(false);
    }
  };

  // Add this function to handle start work from the dashboard
  const handleStartWork = async (job) => {
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'No user is currently signed in');
        return;
      }
      const firebaseIdToken = await user.getIdToken();
              const response = await fetch(`${API_BASE_URL}/jobs/${job._id}/start-work`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to start work');
      fetchJobs();
      Alert.alert('Success', data.message);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to start work');
    }
  };

  // Add this function to handle work done from the dashboard
  const handleWorkDone = async (job) => {
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'No user is currently signed in');
        return;
      }
      const firebaseIdToken = await user.getIdToken();
              const response = await fetch(`${API_BASE_URL}/jobs/${job._id}/work-done`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to mark work as done');
      fetchJobs();
      Alert.alert('Success', 'Work marked as completed! Waiting for client payment.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to mark work as done');
    }
  };

  useEffect(() => {
    loadCurrentUserId();
    fetchJobs();
    checkProfileCompletion();
  }, []);

  // Add focus effect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Refresh profile data when screen comes into focus
      checkProfileCompletion();
    }, [])
  );

  useEffect(() => {
    // Only filter after currentUserId is loaded and jobs are fetched
    if (!currentUserId) return;
    fetchJobs();
    checkProfileCompletion();
  }, [currentUserId]);

  // Refresh jobs when screen comes into focus (e.g., when returning from job details)
  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        fetchJobs();
        checkProfileCompletion();
      }
    }, [currentUserId])
  );

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

      {/* Rejection Modal */}
      <Modal
        visible={showRejectionModal}
        transparent={false}
        animationType="fade"
        onRequestClose={() => {}} // Prevent closing with back button
      >
        <View style={styles.rejectionModalContainer}>
          <View style={styles.rejectionModalContent}>
            <View style={styles.rejectionIconContainer}>
              <Ionicons name="close-circle" size={80} color="#f44336" />
            </View>
            
            <Text style={styles.rejectionTitle}>
              Verification Rejected
            </Text>
            
            <Text style={styles.rejectionMessage}>
              Your profile verification has been rejected due to:
            </Text>
            
            <Text style={styles.rejectionReason}>
              {rejectionReason}
            </Text>
            
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={async () => {
                try {
                  const firebaseUser = auth().currentUser;
                  if (!firebaseUser) {
                    Alert.alert('Error', 'No user is currently signed in');
                    return;
                  }
                  
                  const firebaseIdToken = await firebaseUser.getIdToken();
                  const response = await fetch(`${API_BASE_URL}/users/${currentUserId}/resubmit-verification`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${firebaseIdToken}`,
                      'Content-Type': 'application/json',
                    },
                  });
                  
                  const data = await response.json();
                  
                  if (response.ok) {
                    // Navigate to the dedicated resubmission page
                    router.push('/auth/resubmit-verification');
                  } else {
                    Alert.alert('Error', data.message || 'Failed to resubmit verification');
                  }
                } catch (error) {
                  console.error('Error resubmitting verification:', error);
                  Alert.alert('Error', 'Failed to resubmit verification. Please try again.');
                }
              }}
            >
              <Text style={styles.createAccountButtonText}>
                Re-Submit for verification
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Verification Status Alert */}
      {profileChecked && !isVerified && (
        <View style={{
          backgroundColor: '#FFF3E0',
          borderColor: '#FFCC02',
          borderWidth: 1,
          borderRadius: 8,
          padding: 16,
          marginHorizontal: 16,
          marginTop: 16,
          alignItems: 'center',
        }}>
          <Text style={{ color: '#E65100', fontWeight: 'bold', fontSize: 15, textAlign: 'center' }}>
            Your profile is Under Review
          </Text>
        </View>
      )}

      {/* Verified but Profile Incomplete Alert */}
      {profileChecked && isVerified && !profileComplete && (
        <View style={{
          backgroundColor: '#E8F5E8',
          borderColor: '#4CAF50',
          borderWidth: 1,
          borderRadius: 8,
          padding: 16,
          marginHorizontal: 16,
          marginTop: 16,
          alignItems: 'center',
        }}>
          <Text style={{ color: '#2E7D32', fontWeight: 'bold', fontSize: 15, textAlign: 'center', marginBottom: 8 }}>
            Your profile has been verified
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#4CAF50',
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 6,
              marginTop: 8,
            }}
            onPress={() => router.push('/freelancer/profile')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
              Complete profile to pickup work
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab Selector */}
      <View style={{ flexDirection: 'row', marginTop: 16, marginBottom: 16, alignSelf: 'center', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
        <TouchableOpacity
          style={{
            paddingVertical: 10,
            paddingHorizontal: 28,
            backgroundColor: activeTab === 'available' ? colors.primary : colors.card,
            borderRightWidth: 1,
            borderRightColor: colors.border,
          }}
          onPress={() => setActiveTab('available')}
        >
          <Text style={{ color: activeTab === 'available' ? '#fff' : colors.text, fontWeight: 'bold', fontSize: 16 }}>Available Jobs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            paddingVertical: 10,
            paddingHorizontal: 28,
            backgroundColor: activeTab === 'assigned' ? colors.primary : colors.card,
          }}
          onPress={() => setActiveTab('assigned')}
        >
          <Text style={{ color: activeTab === 'assigned' ? '#fff' : colors.text, fontWeight: 'bold', fontSize: 16 }}>Assigned Jobs</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={[styles.content, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'available' && (
          <>
            {availableJobs.length > 0 ? (
              availableJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  role="freelancer"
                  currentUserId={currentUserId}
                  profileComplete={profileComplete}
                  profileChecked={profileChecked}
                  onPickupWork={async (job) => {
                    if (!profileChecked) {
                      Alert.alert('Please wait', 'Checking your profile info...');
                      return;
                    }
                    if (!isVerified) {
                      Alert.alert('Verification Required', 'Your profile is under review. You cannot pick up work until your documents are approved.');
                      return;
                    }
                    if (!profileComplete) {
                      Alert.alert('Profile Incomplete', 'Please complete your profile before picking up work.');
                      return;
                    }
                    try {
                      const user = auth().currentUser;
                      if (!user) {
                        Alert.alert('Error', 'No user is currently signed in');
                        return;
                      }
                      const firebaseIdToken = await user.getIdToken();
                      const response = await fetch(`${API_BASE_URL}/jobs/${job._id}/pickup`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${firebaseIdToken}`,
                          'Content-Type': 'application/json',
                        },
                      });
                      if (!response.ok) {
                        throw new Error('Failed to pick up job');
                      }
                      fetchJobs();
                    } catch (error) {
                      Alert.alert('Error', error.message);
                    }
                  }}
                  onStartWork={handleStartWork}
                  onWorkDone={handleWorkDone}
                />
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.placeholder }]}>No jobs available yet</Text>
            )}
          </>
        )}
        {activeTab === 'assigned' && (
          <>
            {assignedJobs.length > 0 ? (
              assignedJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  role="freelancer"
                  currentUserId={currentUserId}
                  profileComplete={profileComplete}
                  profileChecked={profileChecked}
                  onPickupWork={null}
                  onStartWork={handleStartWork}
                  onWorkDone={handleWorkDone}
                />
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.placeholder }]}>No assigned jobs yet</Text>
            )}
          </>
        )}
      </ScrollView>

      <DrawerMenu
        visible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        userRole="freelancer"
        userData={userData}
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
  // Rejection Modal Styles
  rejectionModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectionModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    maxWidth: 350,
    width: '90%',
  },
  rejectionIconContainer: {
    marginBottom: 20,
  },
  rejectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 20,
    textAlign: 'center',
  },
  rejectionMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  rejectionReason: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
    fontStyle: 'italic',
    paddingHorizontal: 10,
  },
  createAccountButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 200,
  },
  createAccountButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 