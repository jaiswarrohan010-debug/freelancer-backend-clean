import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useFocusEffect, useRouter, useSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DrawerMenu from '../components/DrawerMenu';
import JobCard from '../components/JobCard';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../utils/api';

export default function FreelancerHomeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verificationSubmitted = searchParams.verificationSubmitted;
  const { colors } = useTheme();
  
  // State management
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('available');
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  
  // Profile and verification state
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasBasicProfile, setHasBasicProfile] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [isVerified, setIsVerified] = useState(false);
  const [freelancerId, setFreelancerId] = useState('');
  const [userData, setUserData] = useState(null);
  
  // UI state
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showUnderReviewMessage, setShowUnderReviewMessage] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(verificationSubmitted === 'true');
  const [verificationLoadingMessage, setVerificationLoadingMessage] = useState('Loading your profile...');

  // Load current user ID from storage
  const loadCurrentUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('🔍 Raw user data from storage:', user);
        const userId = user.id || user._id;
        setCurrentUserId(userId);
        console.log('🔍 User ID loaded:', userId);
      } else {
        console.log('🔍 No user data found in storage');
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  // Fetch jobs from backend
  const fetchJobs = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;
      
      const firebaseIdToken = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch jobs');
      
      const allJobs = await response.json();
      console.log('Jobs fetched successfully:', allJobs.length, 'jobs');
      
      // Separate jobs into available and assigned
      const available = allJobs.filter(job => job.status === 'open');
      const assigned = allJobs.filter(job => {
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
    }
  };

  // Check profile completion and verification status
  const checkProfileCompletion = async () => {
    try {
      if (verificationLoading) {
        setVerificationLoadingMessage('Checking your profile...');
      }
      
      const userData = await AsyncStorage.getItem('@user_data');
      if (!userData) {
        console.log('🔍 No user data found in storage during profile check');
        setProfileComplete(false);
        setProfileChecked(true);
        return;
      }
      
      const user = JSON.parse(userData);
      console.log('🔍 User data during profile check:', user);
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        setProfileComplete(false);
        setProfileChecked(true);
        return;
      }
      
      // Check if user needs verification
      if (user.needsVerification && user.isNewUser) {
        console.log('🔍 User needs verification, redirecting to manual verification');
        router.replace(`/auth/manual-verification?userId=${user.id || user._id}&phone=${user.phoneNumber}&role=${user.role}`);
        return;
      }
      
      // Use MongoDB ID with Firebase authentication for profile lookup
      if (user.id || user._id) {
        const userId = user.id || user._id;
        const firebaseIdToken = await firebaseUser.getIdToken();
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
        });
        
        if (response.ok) {
          const profile = await response.json();
          console.log('🔍 Profile found:', profile._id);
          
          // Hide verification loading
          setVerificationLoading(false);
          
          // Check if profile is complete
          const isProfileComplete = Boolean(
            profile.name && profile.name.trim() &&
            profile.address && profile.address.trim() &&
            profile.gender && profile.gender.trim() &&
            profile.profileImage && profile.profileImage.trim() &&
            profile.experience && profile.experience.trim() &&
            profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0
          );
          
          // Set verification status
          setIsVerified(profile.isVerified === true);
          setVerificationStatus(profile.verificationStatus || 'pending');
          setFreelancerId(profile.freelancerId || '');
          setHasBasicProfile(isProfileComplete);
          
          // Handle verification status
          const status = profile.verificationStatus?.toLowerCase() || 'pending';
          
          if (status === 'rejected') {
            setRejectionReason(profile.adminComments || 'Verification documents were not clear or incomplete');
            setShowRejectionModal(true);
            setShowUnderReviewMessage(false);
          } else if (status === 'pending' || (!profile.isVerified && profile.verificationStatus)) {
            setShowUnderReviewMessage(true);
            setShowRejectionModal(false);
          } else if (profile.isVerified === true) {
            setShowUnderReviewMessage(false);
            setShowRejectionModal(false);
            
            // Update local storage
            try {
              const userData = await AsyncStorage.getItem('@user_data');
              if (userData) {
                const user = JSON.parse(userData);
                user.verificationStatus = profile.verificationStatus;
                user.isVerified = true;
                await AsyncStorage.setItem('@user_data', JSON.stringify(user));
              }
            } catch (error) {
              console.error('Error updating local storage:', error);
            }
          } else {
            setShowUnderReviewMessage(true);
          }
          
          // Set user data for drawer
          setUserData({
            name: profile.name,
            profileImage: profile.profileImage,
            freelancerId: profile.freelancerId
          });
          
          // Set profile completion status
          setProfileComplete(isProfileComplete && profile.isVerified === true);
          setProfileChecked(true);
        } else {
          console.log('🔍 Profile lookup failed:', response.status);
          setProfileComplete(false);
          setProfileChecked(true);
        }
      } else {
        console.log('🔍 No user ID found');
        setProfileComplete(false);
        setProfileChecked(true);
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setProfileComplete(false);
      setProfileChecked(true);
    }
  };

  // Handle job actions
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

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    await checkProfileCompletion();
    setRefreshing(false);
  };

  // Initialize on mount
  useEffect(() => {
    loadCurrentUserId();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchJobs();
      checkProfileCompletion();
    }
  }, [currentUserId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (currentUserId) {
        setIsAutoRefreshing(true);
        try {
          await fetchJobs();
          await checkProfileCompletion();
        } catch (error) {
          console.error('Auto-refresh error:', error);
        } finally {
          setIsAutoRefreshing(false);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUserId]);

  // Refresh on focus
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setIsDrawerVisible(true)}
        >
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Freelancer Dashboard</Text>
        <View style={styles.placeholder}>
          {isAutoRefreshing && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
        </View>
      </View>

      {/* Rejection Modal */}
      <Modal
        visible={showRejectionModal}
        transparent={false}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.rejectionModalContainer}>
          <View style={styles.rejectionModalContent}>
            <View style={styles.rejectionIconContainer}>
              <Ionicons name="close-circle" size={80} color="#f44336" />
            </View>
            
            <Text style={styles.rejectionTitle}>Verification Rejected</Text>
            
            <Text style={styles.rejectionMessage}>
              Your profile verification has been rejected due to:
            </Text>
            
            <Text style={styles.rejectionReason}>{rejectionReason}</Text>
            
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

      {/* Verification Loading Modal */}
      <Modal
        visible={verificationLoading}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.verificationLoadingOverlay}>
          <View style={styles.verificationLoadingContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.verificationLoadingMessage}>{verificationLoadingMessage}</Text>
          </View>
        </View>
      </Modal>

      {/* Verification Status Alert */}
      {showUnderReviewMessage && (
        <View style={styles.underReviewAlert}>
          <Text style={styles.underReviewText}>
            Your profile is Under Review
          </Text>
        </View>
      )}
      
      {/* Verified but Profile Incomplete Alert */}
      {profileChecked && isVerified && !profileComplete && (
        <View style={styles.profileIncompleteAlert}>
          <Text style={styles.profileIncompleteTitle}>
            Your profile has been verified
          </Text>
          <TouchableOpacity
            style={styles.completeProfileButton}
            onPress={() => router.push('/freelancer/profile')}
          >
            <Text style={styles.completeProfileButtonText}>
              Complete profile to pickup work
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'available' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'available' ? '#fff' : colors.text }
          ]}>
            Available Jobs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'assigned' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveTab('assigned')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'assigned' ? '#fff' : colors.text }
          ]}>
            Assigned Jobs
          </Text>
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
              <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                No jobs available yet
              </Text>
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
              <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                No assigned jobs yet
              </Text>
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
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  underReviewAlert: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFCC02',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  underReviewText: {
    color: '#E65100',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  profileIncompleteAlert: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  profileIncompleteTitle: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  completeProfileButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  completeProfileButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 16,
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRightWidth: 1,
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
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
  verificationLoadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationLoadingContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    maxWidth: 300,
    width: '90%',
  },
  verificationLoadingMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
}); 