import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../utils/api';

export default function FreelancerProfileScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [emailError, setEmailError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [gender, setGender] = useState('');
  const [pincode, setPincode] = useState('');
  const [freelancerId, setFreelancerId] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [reEnterBankAccountNumber, setReEnterBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankAccountError, setBankAccountError] = useState('');
  const [accountNumberMatchError, setAccountNumberMatchError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const successAnim = useState(new Animated.Value(0))[0];
  const [isEditing, setIsEditing] = useState(true); // Allow editing on first load
  const [profileSaved, setProfileSaved] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Function to validate account number matching
  const validateAccountNumberMatch = (account1, account2) => {
    if (account1 && account2 && account1 !== account2) {
      setAccountNumberMatchError('Account number not matching');
    } else {
      setAccountNumberMatchError('');
    }
  };

  // No user existence check on mount, just get userId from storage if present
  useEffect(() => {
    (async () => {
      const userData = await AsyncStorage.getItem('@user_data');
      let id = null;
      if (userData) {
        const currentUser = JSON.parse(userData);
        id = currentUser.id || currentUser._id;
      }
      setUserId(id);
      console.log('Freelancer Profile: Loading profile for user ID:', id);
      console.log('Freelancer Profile: Changes applied - read-only fields should be visible');
      
      // Fetch profile from backend and pre-fill fields
      if (id) {
        try {
          const firebaseUser = auth().currentUser;
          if (!firebaseUser) return;
          const firebaseIdToken = await firebaseUser.getIdToken();
          const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
          });
          if (response.ok) {
            const profile = await response.json();
            console.log('Freelancer Profile: Profile data received:', profile);
            
            // Pre-fill form fields
            // Auto-fill verification data if user is verified (except email)
            setFullName(profile.isVerified ? (profile.name || '') : '');
            setEmail(''); // Don't auto-fill email, let freelancer fill it
            setPhone(profile.phone || '');
            setAddress(profile.isVerified ? (profile.address || '') : '');
            setPincode(profile.isVerified ? (profile.pincode || '') : '');
            setFreelancerId(profile.freelancerId || '');
            setExperience(profile.experience || '');
            setSkills(Array.isArray(profile.skills) ? profile.skills.join(', ') : '');
            setGender(profile.isVerified ? (profile.gender || '') : '');
            
            // Load bank details
            console.log('Profile bank details:', profile.bankDetails);
            if (profile.bankDetails) {
              setBankAccountNumber(profile.bankDetails.accountNumber || '');
              setReEnterBankAccountNumber(profile.bankDetails.accountNumber || '');
              setIfscCode(profile.bankDetails.ifscCode || '');
              console.log('Bank details loaded:', {
                accountNumber: profile.bankDetails.accountNumber,
                ifscCode: profile.bankDetails.ifscCode
              });
            } else {
              console.log('No bank details found in profile');
            }
            
            // Preload profile image with full URL if needed (only if verified)
            if (profile.isVerified && profile.profileImage) {
              // Remove '/api' from API_BASE_URL for static images
              const baseUrl = API_BASE_URL.replace(/\/api$/, '');
              const imgUrl = profile.profileImage.startsWith('http') ? profile.profileImage : `${baseUrl}${profile.profileImage}`;
              console.log('profileImage', imgUrl);
              setProfileImage(imgUrl);
            } else {
              setProfileImage(null);
            }
            
            // Set verification status
            setIsVerified(profile.isVerified || false);
            
            // Pre-tick the checkbox (agreed) and set to not editing
            setAgreed(true);
            console.log('agreed', true);
            setProfileSaved(true);
            setIsEditing(false);
            
            // Set verification status
            setIsVerified(profile.isVerified === true);
            console.log('Freelancer Profile: Verification status:', profile.isVerified);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(false);
      
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) {
        setEmailError('Please enter a valid email address');
        setSaving(false);
        return;
      }
      setEmailError('');

      // Validate bank account details if provided
      if (bankAccountNumber || reEnterBankAccountNumber || ifscCode) {
        if (!bankAccountNumber || !reEnterBankAccountNumber || !ifscCode) {
          setBankAccountError('Please fill all bank account fields');
          setSaving(false);
          return;
        }
        if (bankAccountNumber !== reEnterBankAccountNumber) {
          setBankAccountError('Bank account numbers do not match');
          setSaving(false);
          return;
        }
        if (bankAccountNumber.length < 9 || bankAccountNumber.length > 18) {
          setBankAccountError('Invalid bank account number length');
          setSaving(false);
          return;
        }
        if (ifscCode.length !== 11) {
          setBankAccountError('IFSC code must be 11 characters');
          setSaving(false);
          return;
        }
      }
      setBankAccountError('');
      setAccountNumberMatchError('');

      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        Alert.alert('Error', 'No user is currently signed in');
        setSaving(false);
        return;
      }
      const firebaseIdToken = await firebaseUser.getIdToken();

      // Only save editable fields (email, experience, skills, bank details)
      const updateData = {
        email: email,
        experience: experience,
        skills: skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        bankDetails: {
          accountNumber: bankAccountNumber,
          ifscCode: ifscCode
        }
      };

      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile update failed:', errorText);
        setSaveError(true);
        setSaving(false);
        return;
      }

      const updatedProfile = await response.json();
      
      // Update local state with server response
      setFullName(updatedProfile.name || fullName);
      setEmail(updatedProfile.email || '');
      setAddress(updatedProfile.address || address);
      setPincode(updatedProfile.pincode || pincode);
      setGender(updatedProfile.gender || gender);
      
      if (updatedProfile.bankDetails) {
        setBankAccountNumber(updatedProfile.bankDetails.accountNumber || '');
        setReEnterBankAccountNumber(updatedProfile.bankDetails.accountNumber || '');
        setIfscCode(updatedProfile.bankDetails.ifscCode || '');
      }

      setProfileSaved(true);
      setIsEditing(false);
      setShowSuccess(true);
      
      // Animate success message
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowSuccess(false));

    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Photo - Read Only */}
        <View style={styles.imageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person" size={40} color="#666" />
            </View>
          )}
          {!isVerified && (
            <View style={styles.verificationBadge}>
              <Text style={styles.verificationText}>Pending Verification</Text>
            </View>
          )}
          {isVerified && freelancerId && (
            <View style={styles.freelancerIdBadge}>
              <Text style={styles.freelancerIdText}>ID: {freelancerId}</Text>
            </View>
          )}
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.form}>
          {/* Full Name - Read Only */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={fullName}
              editable={false}
              placeholder="Will be filled after verification"
              placeholderTextColor="#999"
            />
            <Text style={styles.readOnlyNote}>Auto-filled after approval</Text>
          </View>

          {/* Gender - Read Only */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={gender}
              editable={false}
              placeholder="Will be filled after verification"
              placeholderTextColor="#999"
            />
            <Text style={styles.readOnlyNote}>Auto-filled after approval</Text>
          </View>

          {/* Email - Editable */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              value={email}
              onChangeText={setEmail}
              editable={isEditing}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>



          {/* Address - Read Only */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea, styles.readOnlyInput]}
              value={address}
              editable={false}
              placeholder="Will be filled after verification"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
            <Text style={styles.readOnlyNote}>Auto-filled after approval</Text>
          </View>

          {/* Pincode - Read Only */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={pincode}
              editable={false}
              placeholder="Will be filled after verification"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <Text style={styles.readOnlyNote}>Auto-filled after approval</Text>
          </View>

          {/* Skills - Editable */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Skills (comma separated)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={skills}
              onChangeText={setSkills}
              editable={isEditing}
              placeholder="Delivery, Plumbing, Electrical, Cooking, Mechanic, Care Taking, Tailoring, etc."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Experience - Editable */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Experience (Years)</Text>
            <TextInput
              style={styles.input}
              value={experience}
              onChangeText={setExperience}
              editable={isEditing}
              placeholder="Enter your experience in years"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          {/* Bank Account Details - Editable */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bank Account Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={[styles.input, bankAccountError ? styles.inputError : null]}
                value={bankAccountNumber}
                onChangeText={(text) => {
                  setBankAccountNumber(text);
                  validateAccountNumberMatch(text, reEnterBankAccountNumber);
                }}
                editable={isEditing}
                placeholder="Enter your bank account number"
                keyboardType="numeric"
                secureTextEntry
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Re-enter Account Number</Text>
              <TextInput
                style={[styles.input, bankAccountError ? styles.inputError : null]}
                value={reEnterBankAccountNumber}
                onChangeText={(text) => {
                  setReEnterBankAccountNumber(text);
                  validateAccountNumberMatch(bankAccountNumber, text);
                }}
                editable={isEditing}
                placeholder="Re-enter your bank account number"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>IFSC Code</Text>
              <TextInput
                style={[styles.input, bankAccountError ? styles.inputError : null]}
                value={ifscCode}
                onChangeText={setIfscCode}
                editable={isEditing}
                placeholder="Enter your IFSC code"
                placeholderTextColor="#999"
                autoCapitalize="characters"
              />
            </View>

            {bankAccountError ? (
              <Text style={styles.errorText}>{bankAccountError}</Text>
            ) : null}
            {accountNumberMatchError ? (
              <Text style={styles.errorText}>{accountNumberMatchError}</Text>
            ) : null}
          </View>

          {isEditing && (
            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          )}

          {saveError && (
            <Text style={styles.errorText}>Failed to save profile. Please try again.</Text>
          )}
        </View>
      </ScrollView>

      {/* Success Message */}
      <Animated.View 
        style={[
          styles.successMessage,
          {
            opacity: successAnim,
            transform: [{
              translateY: successAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            }],
          },
        ]}
      >
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        <Text style={styles.successText}>Profile updated successfully!</Text>
      </Animated.View>
    </KeyboardAvoidingView>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Extra padding for save button
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  verificationText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  freelancerIdBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  freelancerIdText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  verifiedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 8,
  },
  form: {
    //
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
    color: '#555',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
    minHeight: 56, // Ensure enough height for Picker
    justifyContent: 'center', // Center Picker vertically
  },
  picker: {
    height: 56, // Increased height for better visibility
    minWidth: '100%', // Ensure Picker takes full width
    color: '#333',
    backgroundColor: 'transparent',
  },
  readOnlyNote: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  successMessage: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
}); 