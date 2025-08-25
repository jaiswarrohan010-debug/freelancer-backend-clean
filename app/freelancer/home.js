import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [showUnderReviewMessage, setShowUnderReviewMessage] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  const loadCurrentUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      console.log('🔍 Raw user data from storage:', userData);
      if (userData) {
        const user = JSON.parse(userData);
        const userId = user.id || user._id;
        console.log('🔍 Parsed user data:', user);
        console.log('🔍 Extracted user ID:', userId);
        setCurrentUserId(userId);
        
        // Don't show under review message based on stored data alone
        // Wait for backend confirmation
        console.log('🔍 User data loaded, waiting for backend confirmation');
      } else {
        console.log('🔍 No user data found in storage');
        setCurrentUserId(null);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      setCurrentUserId(null);
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
    await checkRejectionStatus(); // Add rejection status check
    setRefreshing(false);
  };

  const checkRejectionStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const firebaseIdToken = await auth().currentUser?.getIdToken();
      if (!firebaseIdToken) return;
      
      // Use Firebase UID instead of MongoDB ID
      const firebaseUid = user.uid || auth().currentUser?.uid;
      const response = await fetch(`${API_BASE_URL}/users/by-firebase-uid/${firebaseUid}`, {
        headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
      });
      
      if (response.ok) {
        const profile = await response.json();
        console.log('🔍 Refresh - User verification status:', profile.verificationStatus);
        
        if (profile.verificationStatus === 'rejected') {
          console.log('❌ Refresh - User is rejected, showing rejection modal');
          setRejectionReason(profile.adminComments || 'Verification documents were not clear or incomplete');
          setShowRejectionModal(true);
          setShowUnderReviewMessage(false);
        } else if (profile.verificationStatus === 'pending') {
          // User is pending verification - show "Under Review" message
          console.log('🔄 Refresh - User is pending verification, showing under review message');
          setShowUnderReviewMessage(true);
          setShowRejectionModal(false);
        } else if (!profile.isVerified && profile.verificationStatus) {
          // User has some verification status but is not verified - show "Under Review" message
          console.log('🔄 Refresh - User has verification status but not verified, showing under review message');
          setShowUnderReviewMessage(true);
          setShowRejectionModal(false);
        } else {
          // User is verified or has no verification status
          setShowUnderReviewMessage(false);
          setShowRejectionModal(false);
        }
      }
    } catch (error) {
      console.error('Error checking rejection status:', error);
    }
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
      
      // Check if user needs verification first
      if (user.needsVerification && user.isNewUser) {
        console.log('🔍 User needs verification, redirecting to manual verification form');
        router.replace(`/auth/manual-verification?userId=${user.id || user._id}&phone=${user.phoneNumber}&role=${user.role}`);
        return;
      }
      
      // If user has submitted verification, check backend for latest status
      if (user.verificationStatus === 'pending' && !user.needsVerification) {
        console.log('🔍 User has submitted verification, checking backend for latest status');
        
        // Fetch latest status from backend
        const firebaseUid = user.uid || firebaseUser.uid;
        const apiUrl = `${API_BASE_URL}/users/by-firebase-uid/${firebaseUid}`;
        
        try {
          const response = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
          });
          
          if (response.ok) {
            const profile = await response.json();
            console.log('🔍 Backend profile status:', {
              verificationStatus: profile.verificationStatus,
              isVerified: profile.isVerified
            });
            
            if (profile.verificationStatus === 'pending' && !profile.isVerified) {
              console.log('🔍 Backend confirms pending status, showing under review message');
              setShowUnderReviewMessage(true);
              setVerificationStatus('pending');
              setIsVerified(false);
            } else if (profile.isVerified === true) {
              console.log('🔍 Backend confirms user is verified, hiding under review message');
              setShowUnderReviewMessage(false);
              setVerificationStatus(profile.verificationStatus);
              setIsVerified(true);
              
              // Update local storage to reflect verified status
              try {
                const userData = await AsyncStorage.getItem('@user_data');
                if (userData) {
                  const user = JSON.parse(userData);
                  user.verificationStatus = profile.verificationStatus;
                  user.isVerified = true;
                  await AsyncStorage.setItem('@user_data', JSON.stringify(user));
                  console.log('🔍 Updated local storage with verified status');
                }
              } catch (error) {
                console.error('🔍 Error updating local storage:', error);
              }
            } else {
              console.log('🔍 Backend status unclear, showing under review message');
              setShowUnderReviewMessage(true);
              setVerificationStatus(profile.verificationStatus);
              setIsVerified(profile.isVerified);
            }
          } else {
            console.log('🔍 Failed to fetch backend status, showing under review message based on local data');
            setShowUnderReviewMessage(true);
            setVerificationStatus('pending');
            setIsVerified(false);
          }
        } catch (error) {
          console.error('🔍 Error fetching backend status:', error);
          setShowUnderReviewMessage(true);
          setVerificationStatus('pending');
          setIsVerified(false);
        }
        
        setProfileChecked(true);
        return;
      }
      
      const firebaseIdToken = await firebaseUser.getIdToken();
      
      // Use Firebase UID instead of MongoDB ID
      const firebaseUid = user.uid || firebaseUser.uid;
      const apiUrl = `${API_BASE_URL}/users/by-firebase-uid/${firebaseUid}`;
      console.log('🔍 Making API call to:', apiUrl);
      console.log('🔍 Using Firebase UID:', firebaseUid);
      console.log('🔍 User object:', user);
      
      const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
      });
      if (!response.ok) {
        console.log('🔍 Failed to fetch user profile:', response.status, response.statusText);
        // If user profile doesn't exist and they need verification, redirect them
        if (response.status === 404 && user.needsVerification) {
          console.log('🔍 User profile not found and needs verification, redirecting to manual verification');
          router.replace(`/auth/manual-verification?userId=${user.id || user._id}&phone=${user.phoneNumber}&role=${user.role}`);
          return;
        }
        setProfileComplete(false);
        setProfileChecked(true);
        return;
      }
      const profile = await response.json();
      console.log('🔍 Profile data received:', profile);
      console.log('🔍 Profile verificationStatus:', profile.verificationStatus);
      console.log('🔍 Profile isVerified:', profile.isVerified);
      console.log('🔍 Profile verification status:', profile.verificationStatus);
      console.log('🔍 Profile verification status (typeof):', typeof profile.verificationStatus);
      console.log('🔍 Profile verification status (length):', profile.verificationStatus ? profile.verificationStatus.length : 'null/undefined');
      console.log('🔍 Profile verification status (trimmed):', profile.verificationStatus ? `"${profile.verificationStatus.trim()}"` : 'null/undefined');
      console.log('🔍 Profile isVerified:', profile.isVerified);
      console.log('🔍 Profile resubmissionCount:', profile.resubmissionCount);
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
      console.log('🔍 Setting verification states:');
      console.log('🔍 profile.isVerified:', profile.isVerified);
      console.log('🔍 profile.verificationStatus:', profile.verificationStatus);
      console.log('🔍 profile.freelancerId:', profile.freelancerId);
      
      setIsVerified(profile.isVerified === true);
      setVerificationStatus(profile.verificationStatus || 'pending');
      setFreelancerId(profile.freelancerId || '');
      setHasBasicProfile(isProfileComplete);
      
      console.log('🔍 States after setting:');
      console.log('🔍 isVerified will be:', profile.isVerified === true);
      console.log('🔍 verificationStatus will be:', profile.verificationStatus || 'pending');
      
      // Handle rejection status
      console.log('🔍 Checking rejection status for user:', user.id || user._id);
      console.log('🔍 User verification status:', profile.verificationStatus);
      console.log('🔍 User is rejected:', profile.verificationStatus === 'rejected');
      console.log('🔍 User resubmission count:', profile.resubmissionCount);
      console.log('🔍 User admin comments:', profile.adminComments);
      
      // Normalize verification status to handle whitespace and case issues
      const normalizedStatus = profile.verificationStatus ? profile.verificationStatus.trim().toLowerCase() : '';
      console.log('🔍 Normalized verification status:', `"${normalizedStatus}"`);
      
      // Check for rejected status first
      if (normalizedStatus === 'rejected') {
        console.log('❌ User is rejected, showing rejection modal');
        setRejectionReason(profile.adminComments || 'Verification documents were not clear or incomplete');
        setShowRejectionModal(true);
        setShowUnderReviewMessage(false);
        return; // Exit early, don't check for pending verifications
      } 
      
      // Check for pending status (including resubmissions)
      if (normalizedStatus === 'pending' || (!profile.isVerified && profile.verificationStatus)) {
        console.log('⏳ User status is pending, showing "Under Review" message');
        console.log('⏳ Setting showUnderReviewMessage to true');
        setShowUnderReviewMessage(true);
        setShowRejectionModal(false);
        setRejectionReason('');
        return; // Exit early, don't check for pending verifications
      } 
      
      // If user is verified, don't show any status messages
      if (profile.isVerified === true) {
        console.log('✅ User is verified, no status messages needed');
        setShowRejectionModal(false);
        setRejectionReason('');
        setShowUnderReviewMessage(false);
      } else {
        console.log('🔍 User status unclear, no status messages');
        setShowRejectionModal(false);
        setRejectionReason('');
        setShowUnderReviewMessage(false);
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
    
    // Additional check for under review status after a short delay
    const timer = setTimeout(() => {
      checkProfileCompletion();
    }, 1000);
    
    // Fallback: Only show "Under Review" if we have confirmation from the backend
    const fallbackTimer = setTimeout(async () => {
      try {
        const userData = await AsyncStorage.getItem('@user_data');
        if (userData) {
          const user = JSON.parse(userData);
          const firebaseUser = auth().currentUser;
          if (firebaseUser) {
            const firebaseUid = user.uid || firebaseUser.uid;
            const firebaseIdToken = await firebaseUser.getIdToken();
            
            // Try to fetch user profile one more time
            const response = await fetch(`${API_BASE_URL}/users/by-firebase-uid/${firebaseUid}`, {
              headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
            });
            
            if (response.ok) {
              const profile = await response.json();
              if (profile.verificationStatus === 'pending' && !profile.isVerified) {
                console.log('🔍 Fallback: Setting showUnderReviewMessage to true based on backend data');
                setShowUnderReviewMessage(true);
              }
            } else {
              console.log('🔍 Fallback: User profile not found in database, not showing under review message');
              setShowUnderReviewMessage(false);
            }
          }
        }
      } catch (error) {
        console.error('Fallback check error:', error);
        // Don't show under review message if we can't verify the status
        setShowUnderReviewMessage(false);
      }
    }, 2000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Add focus effect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Refresh profile data when screen comes into focus
      checkProfileCompletion();
      
      // Check user verification status from backend
      const checkStoredData = async () => {
        try {
          const userData = await AsyncStorage.getItem('@user_data');
          if (userData) {
            const user = JSON.parse(userData);
            
            // Check if user needs verification first
            if (user.needsVerification && user.isNewUser) {
              console.log('🔍 Focus effect: User needs verification, redirecting to manual verification form');
              router.replace(`/auth/manual-verification?userId=${user.id || user._id}&phone=${user.phoneNumber}&role=${user.role}`);
              return;
            }
            
            // If user has submitted verification, check backend for latest status
            if (user.verificationStatus === 'pending' && !user.needsVerification) {
              console.log('🔍 Focus effect: User has submitted verification, checking backend for latest status');
              
              const firebaseUser = auth().currentUser;
              if (firebaseUser) {
                const firebaseUid = user.uid || firebaseUser.uid;
                const firebaseIdToken = await firebaseUser.getIdToken();
                const apiUrl = `${API_BASE_URL}/users/by-firebase-uid/${firebaseUid}`;
                
                try {
                  const response = await fetch(apiUrl, {
                    headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
                  });
                  
                  if (response.ok) {
                    const profile = await response.json();
                    console.log('🔍 Focus effect - Backend profile status:', {
                      verificationStatus: profile.verificationStatus,
                      isVerified: profile.isVerified
                    });
                    
                    if (profile.verificationStatus === 'pending' && !profile.isVerified) {
                      console.log('🔍 Focus effect - Backend confirms pending status, showing under review message');
                      setShowUnderReviewMessage(true);
                      setVerificationStatus('pending');
                      setIsVerified(false);
                    } else if (profile.isVerified === true) {
                      console.log('🔍 Focus effect - Backend confirms user is verified, hiding under review message');
                      setShowUnderReviewMessage(false);
                      setVerificationStatus(profile.verificationStatus);
                      setIsVerified(true);
                      
                      // Update local storage to reflect verified status
                      try {
                        const userData = await AsyncStorage.getItem('@user_data');
                        if (userData) {
                          const user = JSON.parse(userData);
                          user.verificationStatus = profile.verificationStatus;
                          user.isVerified = true;
                          await AsyncStorage.setItem('@user_data', JSON.stringify(user));
                          console.log('🔍 Focus effect - Updated local storage with verified status');
                        }
                      } catch (error) {
                        console.error('🔍 Focus effect - Error updating local storage:', error);
                      }
                    } else {
                      console.log('🔍 Focus effect - Backend status unclear, showing under review message');
                      setShowUnderReviewMessage(true);
                      setVerificationStatus(profile.verificationStatus);
                      setIsVerified(profile.isVerified);
                    }
                  } else {
                    console.log('🔍 Focus effect - Failed to fetch backend status, showing under review message based on local data');
                    setShowUnderReviewMessage(true);
                    setVerificationStatus('pending');
                    setIsVerified(false);
                  }
                } catch (error) {
                  console.error('🔍 Focus effect - Error fetching backend status:', error);
                  setShowUnderReviewMessage(true);
                  setVerificationStatus('pending');
                  setIsVerified(false);
                }
              }
              
              setProfileChecked(true);
              return;
            }
            
            const firebaseUser = auth().currentUser;
            if (firebaseUser) {
              const firebaseUid = user.uid || firebaseUser.uid;
              const firebaseIdToken = await firebaseUser.getIdToken();
              
              const response = await fetch(`${API_BASE_URL}/users/by-firebase-uid/${firebaseUid}`, {
                headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
              });
              
              if (response.ok) {
                const profile = await response.json();
                if (profile.verificationStatus === 'pending' && !profile.isVerified) {
                  console.log('🔍 Focus effect: User has pending verification, showing under review message');
                  setShowUnderReviewMessage(true);
                }
              } else if (response.status === 404 && user.needsVerification) {
                console.log('🔍 Focus effect: User profile not found and needs verification, redirecting to manual verification');
                router.replace(`/auth/manual-verification?userId=${user.id || user._id}&phone=${user.phoneNumber}&role=${user.role}`);
              }
            }
          }
        } catch (error) {
          console.error('Error checking stored data in focus effect:', error);
        }
      };
      
      checkStoredData();
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

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (currentUserId) {
        console.log('🔄 Auto-refreshing dashboard...');
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
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [currentUserId]);

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('🔍 State changed - showUnderReviewMessage:', showUnderReviewMessage);
    console.log('🔍 State changed - verificationStatus:', verificationStatus);
    console.log('🔍 State changed - isVerified:', isVerified);
    console.log('🔍 State changed - profileChecked:', profileChecked);
  }, [showUnderReviewMessage, verificationStatus, isVerified, profileChecked]);

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
      {showUnderReviewMessage && (
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
      
      {/* Debug Info (Temporary) */}
      <View style={{
        backgroundColor: '#f0f0f0',
        padding: 8,
        marginHorizontal: 16,
        marginTop: 8,
      }}>
        <Text style={{ fontSize: 12, color: '#666' }}>
          Status: {showUnderReviewMessage ? 'Under Review' : 'Not Under Review'} | 
          Verification: {verificationStatus} | 
          Verified: {isVerified ? 'Yes' : 'No'}
        </Text>
      </View>
      
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