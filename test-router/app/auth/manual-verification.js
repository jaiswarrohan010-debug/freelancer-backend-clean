import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { API_BASE_URL } from '../utils/api';

export default function ManualVerificationScreen() {
  const router = useRouter();
  const { userId, phone, role } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Profile details
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  
  // Date input state
  const [dateInput, setDateInput] = useState('');
  
  // Gender dropdown state
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  
  // Profile photo
  const [profilePhoto, setProfilePhoto] = useState(null);
  
  // Document uploads
  const [documents, setDocuments] = useState({
    aadhaar: { front: null, back: null },
    pan: { front: null },
    drivingLicense: { front: null, back: null }
  });
  
  // Delivery work preference
  const [deliveryWork, setDeliveryWork] = useState(false);
  
  // Upload status
  const [uploadStatus, setUploadStatus] = useState({
    profilePhoto: false,
    aadhaarFront: false,
    aadhaarBack: false,
    panFront: false,
    drivingLicenseFront: false,
    drivingLicenseBack: false
  });
  
  // Resubmission state
  const [isResubmitting, setIsResubmitting] = useState(false);

  useEffect(() => {
    // User is already authenticated from the previous screen
    // No need to check Firebase auth state here
    console.log('Manual verification page loaded for userId:', userId, 'phone:', phone, 'role:', role);
    
    // Check if user is resubmitting by checking URL params and verification status
    checkUserVerificationStatus();
    
    // Check if user should be redirected back to rejection modal
    checkRejectionStatus();
  }, [userId, phone, role]);
  
  const checkUserVerificationStatus = async () => {
    try {
      // Check if we came from resubmission (URL parameter)
      const isResubmit = router.searchParams?.resubmit;
      
      if (isResubmit === 'true') {
        setIsResubmitting(true);
        console.log('User is resubmitting verification (from URL parameter)');
        return;
      }
      
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        const user = JSON.parse(userData);
        const userId = user.id || user._id;
        
        // Fetch current user status from backend
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        if (response.ok) {
          const profile = await response.json();
          
          // Check if user has resubmitted (any resubmissionCount > 0 indicates previous rejection)
          if (profile.resubmissionCount && profile.resubmissionCount > 0) {
            setIsResubmitting(true);
            console.log('User is resubmitting verification, resubmission count:', profile.resubmissionCount);
          }
        }
      }
    } catch (error) {
      console.error('Error checking user verification status:', error);
    }
  };

  const checkRejectionStatus = async () => {
    try {
      // Check if we came from resubmission (URL parameter)
      const isResubmit = router.searchParams?.resubmit;
      
      // If user is resubmitting, don't redirect them back to dashboard
      if (isResubmit === 'true') {
        console.log('User is resubmitting, allowing access to manual verification');
        return;
      }
      
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        const user = JSON.parse(userData);
        const userId = user.id || user._id;
        
        // Check if user data indicates rejection
        if (user.isRejected || user.verificationStatus === 'rejected') {
          console.log('User is rejected (from stored data), redirecting to dashboard');
                  router.replace('/freelancer/home?verificationSubmitted=true');
        return;
        }
        
        // Fetch current user status from backend
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        if (response.ok) {
          const profile = await response.json();
          
          // If user is still rejected, redirect back to dashboard (which will show rejection modal)
          if (profile.verificationStatus === 'rejected') {
            console.log('User is still rejected (from backend), redirecting to dashboard');
            router.replace('/freelancer/home?verificationSubmitted=true');
          }
        }
      }
    } catch (error) {
      console.error('Error checking rejection status:', error);
    }
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateInput = (text) => {
    // Remove all non-numeric characters
    const numbers = text.replace(/\D/g, '');
    
    // Limit to 8 digits (ddmmyyyy)
    const limitedNumbers = numbers.slice(0, 8);
    
    // Format as dd/mm/yyyy
    if (limitedNumbers.length >= 5) {
      return `${limitedNumbers.slice(0, 2)}/${limitedNumbers.slice(2, 4)}/${limitedNumbers.slice(4)}`;
    } else if (limitedNumbers.length >= 3) {
      return `${limitedNumbers.slice(0, 2)}/${limitedNumbers.slice(2)}`;
    } else if (limitedNumbers.length >= 1) {
      return limitedNumbers;
    }
    
    return '';
  };

  const [dateError, setDateError] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [nameError, setNameError] = useState('');

  const handleDateInputChange = (text) => {
    const formatted = formatDateInput(text);
    setDateInput(formatted);
    
    // Clear error when user starts typing
    if (text.length > 0) {
      setDateError('');
    }
    
    // If we have a complete date (dd/mm/yyyy), validate and set it
    if (formatted.length === 10) {
      const parts = formatted.split('/');
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      
      // Enhanced validation with proper calendar date checking
      const currentDate = new Date();
      const inputDate = new Date(year, month - 1, day);
      
      // Check if the date actually exists in calendar
      const isValidDate = inputDate.getDate() === day && 
                         inputDate.getMonth() === month - 1 && 
                         inputDate.getFullYear() === year;
      
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= currentDate.getFullYear() && isValidDate) {
        // Check if it's not a future date
        if (inputDate <= currentDate) {
          setDateOfBirth(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
          setDateError('');
        } else {
          setDateError('Date of birth cannot be in the future');
          setDateOfBirth('');
        }
      } else {
        setDateError('Please enter a valid date');
        setDateOfBirth('');
      }
    }
  };



  const handleGenderSelect = (selectedGender) => {
    setGender(selectedGender);
    setShowGenderDropdown(false);
  };

  const handlePincodeChange = (text) => {
    // Only allow numeric input
    const numericText = text.replace(/\D/g, '');
    
    // Limit to 6 digits
    const limitedText = numericText.slice(0, 6);
    
    setPincode(limitedText);
    
    // Show error message if not 6 digits
    if (limitedText.length > 0 && limitedText.length < 6) {
      setPincodeError('Please enter a valid pincode');
    } else {
      setPincodeError('');
    }
  };

  const takeProfilePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front, // Force front camera
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfilePhoto(imageUri);
        
        // Upload profile photo to server
        try {
          const formData = new FormData();
          formData.append('document', {
            uri: imageUri,
            type: 'image/jpeg',
            name: `profile_photo_${Date.now()}.jpg`
          });
          
          console.log('Uploading profile photo:', imageUri);
          
          const response = await fetch(`${API_BASE_URL}/upload/single`, {
            method: 'POST',
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          console.log('Profile photo upload response status:', response.status);
          
          if (response.ok) {
            const result = await response.json();
            console.log('Profile photo upload result:', result);
            const completeProfileUrl = result.file.url.startsWith('http') 
              ? result.file.url 
              : `https://freelancer-backend-jv21.onrender.com${result.file.url}`;
            setProfilePhoto(completeProfileUrl); // Update with complete server URL
            setUploadStatus(prev => ({
              ...prev,
              profilePhoto: true
            }));
            Alert.alert('Success', 'Profile photo uploaded successfully!');
          } else {
            const errorText = await response.text();
            console.error('Profile photo upload response error:', errorText);
            throw new Error(`Upload failed: ${response.status} - ${errorText}`);
          }
        } catch (uploadError) {
          console.error('Profile photo upload error:', uploadError);
          Alert.alert('Error', `Failed to upload profile photo: ${uploadError.message}`);
        }
      }
    } catch (error) {
      console.error('Error taking profile photo:', error);
      Alert.alert('Error', 'Failed to take profile photo');
    }
  };

  const pickImage = async (documentType, side) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Upload to server first, then update state with server URL
        await uploadDocument(documentType, side, imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadDocument = async (documentType, side, imageUri) => {
    try {
      setUploading(true);
      
      console.log('Uploading document:', documentType, side, imageUri);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('document', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `${documentType}_${side}_${Date.now()}.jpg`
      });
      
      // Upload file to server
      const response = await fetch(`${API_BASE_URL}/upload/single`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload response error:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Upload result:', result);
      console.log('Server URL received:', result.file.url);
      
      // Update documents state with complete server URL
      const completeUrl = result.file.url.startsWith('http') 
        ? result.file.url 
        : `https://freelancer-backend-jv21.onrender.com${result.file.url}`;
      
      setDocuments(prev => {
        const newState = {
          ...prev,
          [documentType]: {
            ...prev[documentType],
            [side]: completeUrl
          }
        };
        console.log('Updated documents state:', newState);
        console.log('Complete URL for image:', completeUrl);
        return newState;
      });
      
      // Update upload status
      setUploadStatus(prev => ({
        ...prev,
        [`${documentType}${side.charAt(0).toUpperCase() + side.slice(1)}`]: true
      }));

      Alert.alert('Success', `${documentType.toUpperCase()} ${side} uploaded successfully!`);
      
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', `Failed to upload document: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const submitVerification = async () => {
    try {
      // Validate name has both first and last name
      const nameParts = name.trim().split(' ').filter(part => part.length > 0);
      if (nameParts.length < 2) {
        setNameError('Please enter both first name and last name');
        return;
      }

      // Validate required fields
      if (!name || !dateOfBirth || !gender || !address || !pincode) {
        Alert.alert('Error', 'Please fill in all profile details');
        return;
      }

      // Validate pincode
      if (pincode.length !== 6) {
        Alert.alert('Error', 'Please enter a valid 6-digit pincode');
        return;
      }

      // Validate date of birth
      if (!dateOfBirth) {
        Alert.alert('Error', 'Please enter a valid date of birth');
        return;
      }

      // Validate profile photo
      if (!profilePhoto) {
        Alert.alert('Error', 'Please take a profile photo');
        return;
      }

      // Validate required documents
      if (!documents.aadhaar.front || !documents.aadhaar.back) {
        Alert.alert('Error', 'Please upload both sides of Aadhaar card');
        return;
      }

      if (!documents.pan.front) {
        Alert.alert('Error', 'Please upload PAN card front');
        return;
      }

      if (deliveryWork && (!documents.drivingLicense.front || !documents.drivingLicense.back)) {
        Alert.alert('Error', 'Please upload both sides of Driving License for delivery work');
        return;
      }

      setLoading(true);
      setLoadingMessage('Submitting for verification...');

      // Get user phone number from stored user data or URL params
      let userPhone = null;
      let userRole = null;
      
      if (phone) {
        // User came from login (no userId)
        userPhone = phone;
        userRole = role;
        console.log('User phone from URL params:', userPhone, 'role:', userRole);
      } else {
        // User came from existing flow (has userId)
        try {
          const userDataString = await AsyncStorage.getItem('@user_data');
          if (userDataString) {
            const userData = JSON.parse(userDataString);
            userPhone = userData.phoneNumber;
            userRole = userData.role;
            console.log('User phone from stored data:', userPhone, 'role:', userRole);
          }
        } catch (error) {
          console.log('Error getting stored user data:', error);
        }
      }

      if (!userPhone) {
        Alert.alert('Error', 'Unable to get user phone number. Please try logging in again.');
        return;
      }

      // Get Firebase UID if available
      let firebaseUid = null;
      try {
        const firebaseUser = auth().currentUser;
        if (firebaseUser) {
          firebaseUid = firebaseUser.uid;
        }
      } catch (error) {
        console.log('Could not get Firebase UID:', error);
      }

      // Prepare verification data
      const verificationData = {
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        email: `${userPhone}@user.com`, // Default email since we don't have Firebase user
        phone: userPhone,
        role: userRole || 'freelancer',
        dob: dateOfBirth,
        gender: gender,
        address: address,
        pincode: pincode,
        documents: {
          profilePhoto: profilePhoto,
          aadharFront: documents.aadhaar.front,
          aadharBack: documents.aadhaar.back,
          panCard: documents.pan.front,
          drivingLicenseFront: deliveryWork ? documents.drivingLicense.front : null,
          drivingLicenseBack: deliveryWork ? documents.drivingLicense.back : null
        },
        verificationStatus: 'pending',
        isVerified: false,
        submittedAt: new Date().toISOString(),
        createUser: !userId || userId.startsWith('temp_'), // Flag to indicate if we need to create a user
        firebaseUid: firebaseUid // Add Firebase UID
      };

      console.log('📤 Submitting verification data:', verificationData);
      console.log('📤 userId from params:', userId);
      console.log('📤 createUser flag:', !userId || userId.startsWith('temp_'));
      console.log('📤 is temporary ID:', userId && userId.startsWith('temp_'));

      // Send verification data to backend
      const response = await fetch(`${API_BASE_URL}/verification/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData)
      });

      console.log('Verification submission response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Verification submitted successfully:', responseData);
        
        // Update local user data to reflect the completed verification
        const userData = await AsyncStorage.getItem('@user_data');
        if (userData) {
          const user = JSON.parse(userData);
          // Update with the new user ID from the response and mark verification as submitted
          user.id = responseData.user._id;
          user._id = responseData.user._id;
          user.verificationStatus = 'pending';
          user.isRejected = false;
          user.needsVerification = false; // Mark as verification submitted
          user.isNewUser = false; // Mark as not new user anymore
          // Keep the existing Firebase UID
          if (!user.uid && firebaseUid) {
            user.uid = firebaseUid;
          }
          await AsyncStorage.setItem('@user_data', JSON.stringify(user));
          console.log('Updated local user data after verification completion:', {
            userId: user.id,
            verificationStatus: user.verificationStatus,
            needsVerification: user.needsVerification,
            isNewUser: user.isNewUser
          });
        } else {
          // If no user data exists, create new user data
          const newUserData = {
            id: responseData.user._id,
            _id: responseData.user._id,
            phoneNumber: phone,
            role: 'freelancer',
            verificationStatus: 'pending',
            isRejected: false,
            needsVerification: false, // Mark as verification submitted
            isNewUser: false // Mark as not new user anymore
          };
          await AsyncStorage.setItem('@user_data', JSON.stringify(newUserData));
          console.log('Created new user data after verification completion:', newUserData);
        }
        
        // Now check if user record was created successfully
        setLoadingMessage('Verifying submission...');
        
        // Wait a moment for database to update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to find the user record to confirm it was created
        let userFound = false;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!userFound && attempts < maxAttempts) {
          attempts++;
          setLoadingMessage(`Verifying submission... (Attempt ${attempts}/${maxAttempts})`);
          
          try {
            // Try multiple lookup methods
            const firebaseUid = responseData.user.firebaseUid || (await auth().currentUser?.uid);
            const userPhone = responseData.user.phone;
            const userId = responseData.user._id;
            
            let profile = null;
            
            // Method 1: Try Firebase UID lookup
            if (firebaseUid) {
              try {
                const response = await fetch(`${API_BASE_URL}/users/by-firebase-uid/${firebaseUid}`);
                if (response.ok) {
                  profile = await response.json();
                  console.log('✅ User found via Firebase UID');
                }
              } catch (error) {
                console.log('Firebase UID lookup failed:', error.message);
              }
            }
            
            // Method 2: Try phone number lookup
            if (!profile && userPhone) {
              try {
                const response = await fetch(`${API_BASE_URL}/users/by-phone/${userPhone}`);
                if (response.ok) {
                  profile = await response.json();
                  console.log('✅ User found via phone number');
                }
              } catch (error) {
                console.log('Phone lookup failed:', error.message);
              }
            }
            
            // Method 3: Try MongoDB ID lookup
            if (!profile && userId) {
              try {
                const response = await fetch(`${API_BASE_URL}/users/${userId}`);
                if (response.ok) {
                  profile = await response.json();
                  console.log('✅ User found via MongoDB ID');
                }
              } catch (error) {
                console.log('MongoDB ID lookup failed:', error.message);
              }
            }
            
                    if (profile) {
          userFound = true;
          console.log('✅ User record confirmed in database');
          setLoadingMessage('Verification submitted successfully!');
          
          // Wait a moment to show success message
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Redirect to dashboard with spinner still active
          router.replace('/freelancer/home?verificationSubmitted=true');
          break;
        } else {
          console.log(`❌ User not found in database (attempt ${attempts})`);
          if (attempts < maxAttempts) {
            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
          } catch (error) {
            console.error('Error checking user record:', error);
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (!userFound) {
          console.log('⚠️ User record not found after multiple attempts, but proceeding anyway');
          setLoadingMessage('Verification submitted successfully!');
          
          // Wait a moment to show completion message
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Redirect to dashboard with spinner still active
          router.replace('/freelancer/home?verificationSubmitted=true');
        }
      } else {
        const errorText = await response.text();
        console.log('Failed to submit verification:', response.status, errorText);
        throw new Error('Failed to submit verification');
      }

    } catch (error) {
      console.error('Submit verification error:', error);
      Alert.alert('Error', 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  const renderDocumentUpload = (documentType, side, label, required = true) => {
    const isUploaded = uploadStatus[`${documentType}${side.charAt(0).toUpperCase() + side.slice(1)}`];
    const imageUri = documents[documentType]?.[side];
    
    console.log(`Rendering ${documentType} ${side}:`, {
      imageUri,
      isUploaded,
      documents: documents[documentType]
    });

    // Check if imageUri is a valid URL
    const isValidUrl = imageUri && (imageUri.startsWith('http://') || imageUri.startsWith('https://') || imageUri.startsWith('file://'));

    return (
      <View style={styles.documentSection}>
        <Text style={styles.documentLabel}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        
        <TouchableOpacity
          style={[styles.uploadButton, isUploaded && styles.uploadedButton]}
          onPress={() => pickImage(documentType, side)}
          disabled={uploading}
        >
          {imageUri && isValidUrl ? (
            <Image 
              source={{ uri: imageUri }} 
              style={styles.documentImage}
              onError={(error) => {
                console.error('Image load error:', error);
                console.error('Failed URL:', imageUri);
              }}
              onLoad={() => console.log('Image loaded successfully:', imageUri)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.uploadContent}>
              <Text style={styles.uploadText}>📷</Text>
              <Text style={styles.uploadText}>Upload {label}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {isUploaded && (
          <Text style={styles.uploadedText}>✅ Uploaded</Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Profile</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={[styles.input, nameError && styles.inputError]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              // Clear error when user starts typing
              if (text.length > 0) {
                setNameError('');
              }
              
              // Check if name contains both first and last name
              const nameParts = text.trim().split(' ').filter(part => part.length > 0);
              if (text.length > 0 && nameParts.length < 2) {
                setNameError('Please enter both first name and last name');
              } else {
                setNameError('');
              }
            }}
            placeholder="Enter details as per Aadhaar"
            placeholderTextColor="#999"
          />
          {nameError ? (
            <Text style={styles.errorText}>{nameError}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth *</Text>
          <TextInput
            style={[styles.input, dateError && styles.inputError]}
            value={dateInput}
            onChangeText={handleDateInputChange}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={10}
          />
          {dateError ? (
            <Text style={styles.errorText}>{dateError}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowGenderDropdown(true)}
          >
            <Text style={gender ? styles.inputText : styles.placeholderText}>
              {gender || "Select Gender"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter details as per Aadhaar"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>



        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pincode *</Text>
          <TextInput
            style={[styles.input, pincodeError && styles.inputError]}
            value={pincode}
            onChangeText={handlePincodeChange}
            placeholder="Enter 6-digit pincode"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={6}
          />
          {pincodeError ? (
            <Text style={styles.errorText}>{pincodeError}</Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Profile Photo</Text>
        <View style={styles.profilePhotoSection}>
          <Text style={styles.subsectionTitle}>Take a clear photo of yourself</Text>
          <TouchableOpacity
            style={[styles.profilePhotoButton, profilePhoto && styles.profilePhotoUploaded]}
            onPress={takeProfilePhoto}
            disabled={uploading}
          >
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profilePhotoImage} />
            ) : (
              <View style={styles.profilePhotoContent}>
                <Text style={styles.profilePhotoText}>📷</Text>
                <Text style={styles.profilePhotoText}>Take Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          {uploadStatus.profilePhoto && (
            <Text style={styles.uploadedText}>✅ Profile photo captured</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Document Upload</Text>

        <Text style={styles.subsectionTitle}>Aadhaar Card</Text>
        <View style={styles.documentRow}>
          {renderDocumentUpload('aadhaar', 'front', 'Front Side')}
          {renderDocumentUpload('aadhaar', 'back', 'Back Side')}
        </View>

        <Text style={styles.subsectionTitle}>PAN Card</Text>
        {renderDocumentUpload('pan', 'front', 'Front Side')}

        <View style={styles.deliverySection}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>I want to work for delivery jobs</Text>
            <Switch
              value={deliveryWork}
              onValueChange={setDeliveryWork}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={deliveryWork ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          
          {deliveryWork && (
            <>
              <Text style={styles.subsectionTitle}>Driving License</Text>
              <View style={styles.documentRow}>
                {renderDocumentUpload('drivingLicense', 'front', 'Front Side')}
                {renderDocumentUpload('drivingLicense', 'back', 'Back Side')}
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={submitVerification}
          disabled={loading || uploading}
        >
          <Text style={styles.submitButtonText}>
            {isResubmitting ? 'Re-Submit for Verification' : 'Submit for Verification'}
          </Text>
        </TouchableOpacity>
      </View>



      {/* Gender Dropdown Modal */}
      <Modal
        visible={showGenderDropdown}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => handleGenderSelect('Male')}
            >
              <Text style={styles.dropdownOptionText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => handleGenderSelect('Female')}
            >
              <Text style={styles.dropdownOptionText}>Female</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowGenderDropdown(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading Modal */}
      <Modal
        visible={loading}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.loadingModalOverlay}>
          <View style={styles.loadingModalContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingMessage}>{loadingMessage}</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
    marginTop: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  documentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  documentSection: {
    flex: 1,
    marginHorizontal: 5,
  },
  documentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  uploadButton: {
    height: 120,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  uploadedButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f9f0',
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  documentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  uploadedText: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 5,
  },
  profilePhotoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhotoButton: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    marginTop: 10,
  },
  profilePhotoUploaded: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f9f0',
  },
  profilePhotoContent: {
    alignItems: 'center',
  },
  profilePhotoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  profilePhotoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 58,
  },
  deliverySection: {
    marginTop: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  datePickerContainer: {
    marginVertical: 20,
  },
  datePickerText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#fff',
  },
  dropdownOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 5,
    marginLeft: 5,
  },
  loadingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '500',
  },
});
