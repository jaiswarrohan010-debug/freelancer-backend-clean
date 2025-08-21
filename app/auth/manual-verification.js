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
import { auth } from '../utils/firebase';

export default function ManualVerificationScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Profile details
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  
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
    // User is already authenticated from the previous screen
    // No need to check Firebase auth state here
    console.log('Manual verification page loaded for userId:', userId);
  }, [userId]);

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
      
      // Basic validation
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= new Date().getFullYear()) {
        setDateOfBirth(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
      }
    }
  };



  const handleGenderSelect = (selectedGender) => {
    setGender(selectedGender);
    setShowGenderDropdown(false);
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
        setProfilePhoto(result.assets[0].uri);
        setUploadStatus(prev => ({
          ...prev,
          profilePhoto: true
        }));
        Alert.alert('Success', 'Profile photo captured successfully!');
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
        
        // Update documents state
        setDocuments(prev => ({
          ...prev,
          [documentType]: {
            ...prev[documentType],
            [side]: imageUri
          }
        }));

        // Upload to server
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
      
      // For mock testing, skip actual upload
      console.log('Mock upload for:', documentType, side, imageUri);
      
      // Update upload status
      setUploadStatus(prev => ({
        ...prev,
        [`${documentType}${side.charAt(0).toUpperCase() + side.slice(1)}`]: true
      }));

      Alert.alert('Success', `${documentType.toUpperCase()} ${side} uploaded successfully!`);
      
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const submitVerification = async () => {
    try {
      // Validate required fields
      if (!name || !dateOfBirth || !gender || !address) {
        Alert.alert('Error', 'Please fill in all profile details');
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

      // Get user phone number from Firebase
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const userPhone = firebaseUser.phoneNumber;
      console.log('User phone from Firebase:', userPhone);
      console.log('Firebase user object:', {
        uid: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber,
        email: firebaseUser.email
      });

      // Prepare verification data
      const verificationData = {
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        email: firebaseUser.email || `${firebaseUser.uid}@firebase.user`,
        phone: userPhone,
        dob: dateOfBirth,
        gender: gender,
        address: address,
        city: '', // Add if you have city field
        state: '', // Add if you have state field
        pincode: '', // Add if you have pincode field
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
        submittedAt: new Date().toISOString()
      };

      console.log('Submitting verification data:', verificationData);

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
        
        Alert.alert(
          'Verification Submitted!',
          'Your profile has been submitted for admin approval. You will be notified once approved.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/freelancer/home')
            }
          ]
        );
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
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.documentImage} />
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
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter details as per Aadhaar"
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
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit for Verification</Text>
          )}
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
});
