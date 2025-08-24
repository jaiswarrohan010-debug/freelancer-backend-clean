import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { API_BASE_URL } from '../utils/api';

export default function ResubmitVerificationScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    console.log('Resubmit verification page loaded for userId:', userId);
    loadUserData();
  }, [userId]);
  
  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        const user = JSON.parse(userData);
        const userId = user.id || user._id;
        
        // Fetch current user data from backend
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        if (response.ok) {
          const profile = await response.json();
          
          // Pre-fill form with existing data
          setName(profile.name || '');
          setDateOfBirth(profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '');
          setGender(profile.gender || '');
          setAddress(profile.address || '');
          setPincode(profile.pincode || '');
          setDeliveryWork(profile.deliveryWork || false);
          
          // Pre-fill documents if they exist
          if (profile.documents) {
            setDocuments({
              aadhaar: {
                front: profile.documents.aadhaar?.front || null,
                back: profile.documents.aadhaar?.back || null
              },
              pan: {
                front: profile.documents.pan?.front || null
              },
              drivingLicense: {
                front: profile.documents.drivingLicense?.front || null,
                back: profile.documents.drivingLicense?.back || null
              }
            });
            
            // Update upload status
            setUploadStatus({
              profilePhoto: Boolean(profile.profileImage),
              aadhaarFront: Boolean(profile.documents.aadhaar?.front),
              aadhaarBack: Boolean(profile.documents.aadhaar?.back),
              panFront: Boolean(profile.documents.pan?.front),
              drivingLicenseFront: Boolean(profile.documents.drivingLicense?.front),
              drivingLicenseBack: Boolean(profile.documents.drivingLicense?.back)
            });
          }
          
          // Set profile photo
          if (profile.profileImage) {
            setProfilePhoto(profile.profileImage);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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

  const takeProfilePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Upload profile photo to server
        await uploadProfilePhoto(imageUri);
      }
    } catch (error) {
      console.error('Error taking profile photo:', error);
      Alert.alert('Error', 'Failed to take profile photo');
    }
  };

  const uploadProfilePhoto = async (imageUri) => {
    try {
      setUploading(true);
      
      console.log('Uploading profile photo:', imageUri);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('document', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `profile_photo_${Date.now()}.jpg`
      });
      
      // Upload file to server
      const response = await fetch(`${API_BASE_URL}/upload/single`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Profile photo upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile photo upload response error:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Profile photo upload result:', result);
      console.log('Profile photo server URL received:', result.file.url);
      
      // Update profile photo with complete server URL
      const completeUrl = result.file.url.startsWith('http') 
        ? result.file.url 
        : `https://freelancer-backend-jv21.onrender.com${result.file.url}`;
      
      setProfilePhoto(completeUrl);
      setUploadStatus(prev => ({ ...prev, profilePhoto: true }));
      console.log('Profile photo uploaded successfully:', completeUrl);
      
      Alert.alert('Success', 'Profile photo uploaded successfully!');
      
    } catch (error) {
      console.error('Profile photo upload error:', error);
      Alert.alert('Error', `Failed to upload profile photo: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const submitResubmission = async () => {
    try {
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

      // Get user phone number from stored user data
      let userPhone = null;
      let userRole = null;
      
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

      if (!userPhone) {
        Alert.alert('Error', 'Unable to get user phone number. Please try logging in again.');
        return;
      }

      // Prepare verification data
      const verificationData = {
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        email: `${userPhone}@user.com`,
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
        verificationStatus: 'pending', // This will change to pending when actually submitted
        isVerified: false,
        submittedAt: new Date().toISOString(),
        createUser: false, // This is resubmission, not new user creation
        isResubmission: true // Flag to indicate this is a resubmission
      };

      console.log('Submitting resubmission data:', verificationData);

      // Send verification data to backend
      const response = await fetch(`${API_BASE_URL}/verification/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData)
      });

      console.log('Resubmission response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Resubmission submitted successfully:', responseData);
        
        // Update local user data to reflect the completed resubmission
        const userData = await AsyncStorage.getItem('@user_data');
        if (userData) {
          const user = JSON.parse(userData);
          user.verificationStatus = 'pending';
          user.isRejected = false;
          await AsyncStorage.setItem('@user_data', JSON.stringify(user));
          console.log('Updated local user data after resubmission completion');
        }
        
        Alert.alert(
          'Resubmission Submitted!',
          'Your profile has been resubmitted for admin approval. You will be notified once approved.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/freelancer/home')
            }
          ]
        );
      } else {
        const errorText = await response.text();
        console.log('Failed to submit resubmission:', response.status, errorText);
        throw new Error('Failed to submit resubmission');
      }

    } catch (error) {
      console.error('Submit resubmission error:', error);
      Alert.alert('Error', 'Failed to submit resubmission');
    } finally {
      setLoading(false);
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

  const handleDateInputChange = (text) => {
    const formatted = formatDateInput(text);
    setDateInput(formatted);
    
    // If we have a complete date (dd/mm/yyyy), validate and set it
    if (formatted.length === 10) {
      const parts = formatted.split('/');
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      
      // Enhanced validation
      const currentDate = new Date();
      const inputDate = new Date(year, month - 1, day);
      
      // Check if date is valid
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= currentDate.getFullYear()) {
        // Check if it's not a future date
        if (inputDate <= currentDate) {
          setDateOfBirth(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        } else {
          Alert.alert('Invalid Date', 'Date of birth cannot be in the future');
          setDateInput('');
          setDateOfBirth('');
        }
      } else {
        Alert.alert('Invalid Date', 'Please enter a valid date of birth');
        setDateInput('');
        setDateOfBirth('');
      }
    }
  };

  const handlePincodeChange = (text) => {
    // Only allow numeric input
    const numericText = text.replace(/\D/g, '');
    
    // Limit to 6 digits
    const limitedText = numericText.slice(0, 6);
    
    setPincode(limitedText);
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
        <Text style={styles.headerTitle}>Re-Submit Verification</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth *</Text>
          <TextInput
            style={styles.input}
            value={dateInput}
            onChangeText={handleDateInputChange}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowGenderDropdown(!showGenderDropdown)}
          >
            <Text style={[styles.dropdownText, !gender && styles.placeholderText]}>
              {gender || 'Select gender'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          
          {showGenderDropdown && (
            <View style={styles.dropdownOptions}>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => {
                  setGender('Male');
                  setShowGenderDropdown(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => {
                  setGender('Female');
                  setShowGenderDropdown(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>Female</Text>
              </TouchableOpacity>

            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your complete address"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pincode *</Text>
          <TextInput
            style={styles.input}
            value={pincode}
            onChangeText={handlePincodeChange}
            placeholder="Enter 6-digit pincode"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={6}
          />
        </View>

        <Text style={styles.sectionTitle}>Profile Photo *</Text>
        <TouchableOpacity
          style={[styles.uploadButton, uploadStatus.profilePhoto && styles.uploadedButton]}
          onPress={takeProfilePhoto}
          disabled={uploading}
        >
          {profilePhoto ? (
            <Image 
              source={{ uri: profilePhoto }} 
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.uploadContent}>
              <Text style={styles.uploadText}>📷</Text>
              <Text style={styles.uploadText}>Take Profile Photo</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {uploadStatus.profilePhoto && (
          <Text style={styles.uploadedText}>✅ Profile Photo Uploaded</Text>
        )}

        <Text style={styles.sectionTitle}>Required Documents</Text>
        
        {renderDocumentUpload('aadhaar', 'front', 'Aadhaar Card Front')}
        {renderDocumentUpload('aadhaar', 'back', 'Aadhaar Card Back')}
        {renderDocumentUpload('pan', 'front', 'PAN Card Front')}

        <View style={styles.deliverySection}>
          <View style={styles.deliveryHeader}>
            <Text style={styles.deliveryTitle}>Delivery Work</Text>
            <Switch
              value={deliveryWork}
              onValueChange={setDeliveryWork}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={deliveryWork ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.deliveryDescription}>
            Enable if you want to do delivery work
          </Text>
        </View>

        {deliveryWork && (
          <>
            {renderDocumentUpload('drivingLicense', 'front', 'Driving License Front')}
            {renderDocumentUpload('drivingLicense', 'back', 'Driving License Back')}
          </>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submitResubmission}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              Re-Submit for Verification
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
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
    marginTop: 20,
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownOptions: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 5,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadedButton: {
    borderColor: '#4CAF50',
    borderStyle: 'solid',
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  documentImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  uploadedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  documentSection: {
    marginBottom: 20,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  deliverySection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deliveryDescription: {
    fontSize: 14,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
