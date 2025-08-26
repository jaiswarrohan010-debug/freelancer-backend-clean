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
  const [verificationLoading, setVerificationLoading] = useState(verificationSubmitted === 'true');
  const [verificationLoadingMessage, setVerificationLoadingMessage] = useState('Loading your profile...');

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

  const checkProfileCompletion = async (retryCount = 0) => {
    try {
      // Update loading message if verification loading is active
      if (verificationLoading) {
        setVerificationLoadingMessage(`Checking your profile... (Attempt ${retryCount + 1})`);
      }
      
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
        
        // Try multiple lookup methods to handle timing issues
        let profile = null;
        let lookupMethod = '';
        
                // Method 1: Try phone number lookup first (most reliable after verification)
        if (user.phoneNumber) {
          try {
            // Try with Firebase phone number (with country code)
            const apiUrl = `${API_BASE_URL}/users/by-phone/${user.phoneNumber}`;
            console.log('🔍 Trying phone number lookup (primary):', apiUrl);
            
            const response = await fetch(apiUrl, {
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
              profile = await response.json();
              lookupMethod = 'phone-number';
              console.log('🔍 Successfully found user via phone number');
            } else {
              console.log('🔍 Phone number lookup failed:', response.status);
              
              // Try without country code as fallback
              const phoneWithoutCountryCode = user.phoneNumber.replace(/^\+91/, '');
              if (phoneWithoutCountryCode !== user.phoneNumber) {
                const fallbackApiUrl = `${API_BASE_URL}/users/by-phone/${phoneWithoutCountryCode}`;
                console.log('🔍 Trying phone number lookup without country code:', fallbackApiUrl);
                
                const fallbackResponse = await fetch(fallbackApiUrl, {
                  headers: { 'Content-Type': 'application/json' }
                });
                
                if (fallbackResponse.ok) {
                  profile = await fallbackResponse.json();
                  lookupMethod = 'phone-number-no-country-code';
                  console.log('🔍 Successfully found user via phone number without country code');
                } else {
                  console.log('🔍 Phone number lookup without country code failed:', fallbackResponse.status);
                }
              }
            }
          } catch (error) {
            console.log('🔍 Phone number lookup error:', error.message);
          }
        }

        // Method 2: Try MongoDB ID lookup (fallback)
        if (!profile && (user.id || user._id)) {
          try {
            const userId = user.id || user._id;
            const apiUrl = `${API_BASE_URL}/users/${userId}`;
            console.log('🔍 Trying MongoDB ID lookup (fallback):', apiUrl);
            
            const response = await fetch(apiUrl, {
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
              profile = await response.json();
              lookupMethod = 'mongodb-id';
              console.log('🔍 Successfully found user via MongoDB ID');
            } else {
              console.log('🔍 MongoDB ID lookup failed:', response.status);
            }
          } catch (error) {
            console.log('🔍 MongoDB ID lookup error:', error.message);
          }
        }

        // Method 2: Try Firebase UID lookup (fallback - not deployed yet)
        if (!profile && (user.uid || firebaseUser.uid)) {
          try {
            const firebaseUid = user.uid || firebaseUser.uid;
            const firebaseIdToken = await firebaseUser.getIdToken();
            const apiUrl = `${API_BASE_URL}/users/by-firebase-uid/${firebaseUid}`;
            console.log('🔍 Trying Firebase UID lookup (fallback):', apiUrl);
            
            const response = await fetch(apiUrl, {
              headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
            });
            
            if (response.ok) {
              profile = await response.json();
              lookupMethod = 'firebase-uid';
              console.log('🔍 Successfully found user via Firebase UID');
            } else {
              console.log('🔍 Firebase UID lookup failed:', response.status, '- Backend route not deployed yet');
            }
          } catch (error) {
            console.log('🔍 Firebase UID lookup error:', error.message);
          }
        }


        
        // Process the result
        if (profile) {
          console.log('🔍 Backend profile status (found via', lookupMethod, '):', {
            verificationStatus: profile.verificationStatus,
            isVerified: profile.isVerified
          });
          
          // Hide verification loading spinner since we found the profile
          setVerificationLoading(false);
          
          // Check if profile is complete (all required fields filled)
          const isProfileComplete = Boolean(
            profile.name && typeof profile.name === 'string' && profile.name.trim() &&
            profile.address && typeof profile.address === 'string' && profile.address.trim() &&
            profile.gender && typeof profile.gender === 'string' && profile.gender.trim() &&
            profile.profileImage && typeof profile.profileImage === 'string' && profile.profileImage.trim() &&
            profile.experience && typeof profile.experience === 'string' && profile.experience.trim() &&
            profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0
          );
          
          // Set verification status
          setIsVerified(profile.isVerified === true);
          setVerificationStatus(profile.verificationStatus || 'pending');
          setFreelancerId(profile.freelancerId || '');
          setHasBasicProfile(isProfileComplete);
          
          // Handle rejection status
          const normalizedStatus = profile.verificationStatus ? profile.verificationStatus.trim().toLowerCase() : '';
          
          if (normalizedStatus === 'rejected') {
            console.log('❌ User is rejected, showing rejection modal');
            setRejectionReason(profile.adminComments || 'Verification documents were not clear or incomplete');
            setShowRejectionModal(true);
            setShowUnderReviewMessage(false);
          } else if (normalizedStatus === 'pending' || (!profile.isVerified && profile.verificationStatus)) {
            console.log('⏳ User status is pending, showing "Under Review" message');
            setShowUnderReviewMessage(true);
            setShowRejectionModal(false);
            setRejectionReason('');
          } else if (profile.isVerified === true) {
            console.log('✅ User is verified, no status messages needed');
            setShowUnderReviewMessage(false);
            setShowRejectionModal(false);
            setRejectionReason('');
            
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
          
          // Set user data for drawer
          setUserData({
            name: profile.name,
            profileImage: profile.profileImage,
            freelancerId: profile.freelancerId
          });
          
          // Set profile completion status
          const isComplete = isProfileComplete && profile.isVerified === true;
          setProfileComplete(isComplete);
        } else {
          console.log('🔍 All lookup methods failed, checking local data for guidance');
          
          // Check local storage to see if user just completed verification
          const userData = await AsyncStorage.getItem('@user_data');
          if (userData) {
            const localUser = JSON.parse(userData);
            console.log('🔍 Local user data:', {
              verificationStatus: localUser.verificationStatus,
              needsVerification: localUser.needsVerification,
              isNewUser: localUser.isNewUser,
              phoneNumber: localUser.phoneNumber
            });
            
            // If user just completed verification (needsVerification = false, verificationStatus = 'pending')
            if (localUser.verificationStatus === 'pending' && !localUser.needsVerification) {
              console.log('🔍 User just completed verification, showing under review message');
              setShowUnderReviewMessage(true);
              setVerificationStatus('pending');
              setIsVerified(false);
              
              // Hide verification loading spinner since we're showing the status
              setVerificationLoading(false);
              
              // Try to refresh user data from backend using phone number
              if (localUser.phoneNumber) {
                console.log('🔍 Attempting to refresh user data using phone number:', localUser.phoneNumber);
                try {
                  // Try with Firebase phone number (with country code)
                  let response = await fetch(`${API_BASE_URL}/users/by-phone/${localUser.phoneNumber}`);
                  
                  if (!response.ok) {
                    // Try without country code as fallback
                    const phoneWithoutCountryCode = localUser.phoneNumber.replace(/^\+91/, '');
                    if (phoneWithoutCountryCode !== localUser.phoneNumber) {
                      console.log('🔍 Trying without country code:', phoneWithoutCountryCode);
                      response = await fetch(`${API_BASE_URL}/users/by-phone/${phoneWithoutCountryCode}`);
                    }
                  }
                  
                  if (response.ok) {
                    const freshUser = await response.json();
                    console.log('🔍 Found fresh user data:', freshUser._id);
                    
                    // Update local storage with fresh user ID
                    localUser.id = freshUser._id;
                    localUser._id = freshUser._id;
                    await AsyncStorage.setItem('@user_data', JSON.stringify(localUser));
                    console.log('🔍 Updated local storage with fresh user ID');
                  }
                } catch (error) {
                  console.log('🔍 Failed to refresh user data:', error.message);
                }
              }
            } else if (localUser.needsVerification && localUser.isNewUser) {
              console.log('🔍 User needs verification, redirecting to manual verification');
              router.replace(`/auth/manual-verification?userId=${localUser.id || localUser._id}&phone=${localUser.phoneNumber}&role=${localUser.role}`);
              return;
            } else {
              console.log('🔍 User status unclear, showing under review message as fallback');
              setShowUnderReviewMessage(true);
              setVerificationStatus('pending');
              setIsVerified(false);
            }
          } else {
            console.log('🔍 No local user data, showing under review message as fallback');
            setShowUnderReviewMessage(true);
            setVerificationStatus('pending');
            setIsVerified(false);
          }
        }
        
        // If no profile found and this is a retry attempt, try again after a delay
        if (!profile && retryCount < 3) {
          console.log(`🔍 Profile not found on attempt ${retryCount + 1}, retrying in 2 seconds...`);
          setTimeout(() => {
            checkProfileCompletion(retryCount + 1);
          }, 2000);
          return;
        }
        
        setProfileChecked(true);
        return;
      }
      
      // If we reach here, no profile was found by any method after all retries
      console.log('🔍 No profile found by any lookup method after all retries');
      setProfileComplete(false);
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

      {/* Verification Loading Modal */}
      <Modal
        visible={verificationLoading}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}} // Prevent closing with back button
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
  // Verification Loading Modal Styles
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