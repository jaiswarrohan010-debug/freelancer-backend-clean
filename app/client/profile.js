import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import CheckBox from 'expo-checkbox';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../utils/api';

const PROFILE_STORAGE_KEY = '@client_profile';

export default function ClientProfileScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [emailError, setEmailError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  // Address fields
  const [flat, setFlat] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [profileSaved, setProfileSaved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successAnim = useState(new Animated.Value(0))[0];

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
    })();
  }, []);

  // Fetch city/state from pincode
  useEffect(() => {
    if (pincode.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        .then(res => res.json())
        .then(data => {
          if (data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
            setCity(data[0].PostOffice[0].District || '');
            setState(data[0].PostOffice[0].State || '');
          } else {
            setCity('');
            setState('');
          }
        })
        .catch(() => {
          setCity('');
          setState('');
        });
    } else {
      setCity('');
      setState('');
    }
  }, [pincode]);

  // Pre-fill logic (fetch profile from backend)
  useEffect(() => {
    (async () => {
      const userData = await AsyncStorage.getItem('@user_data');
      let id = null;
      if (userData) {
        const currentUser = JSON.parse(userData);
        id = currentUser.id || currentUser._id;
      }
      setUserId(id);
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
            console.log('Fetched profile:', profile);
            // Pre-fill form fields
            if (profile.name) {
              const nameParts = profile.name.split(' ');
              setFirstName(nameParts[0] || '');
              setLastName(nameParts.slice(1).join(' ') || '');
            }
            setEmail(profile.email || '');
            setFlat(profile.flat || '');
            setStreet(profile.street || '');
            setLandmark(profile.landmark || '');
            setPincode(profile.pincode || '');
            setCity(profile.city || '');
            setState(profile.state || '');
            if (profile.profileImage) {
              const baseUrl = API_BASE_URL.replace(/\/api$/, '');
              const imgUrl = profile.profileImage.startsWith('http') ? profile.profileImage : `${baseUrl}${profile.profileImage}`;
              setProfileImage(imgUrl);
            } else {
              setProfileImage(null);
            }
            setAgreed(true);
            setProfileSaved(true);
            setIsEditing(false);
          }
        } catch (e) {
          // Ignore fetch errors
        }
      }
    })();
  }, []);

  // Add image picker handlers
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permission.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        Alert.alert('Error', 'No user is currently signed in');
        setSaving(false);
        return;
      }
      const firebaseIdToken = await firebaseUser.getIdToken();
      let id = userId;
      // Always call /api/auth/firebase to ensure user exists or is created
      const authRes = await fetch(`${API_BASE_URL}/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: firebaseIdToken, role: 'client' }),
      });
      const authResText = await authRes.text();
      if (!authRes.ok) throw new Error('Failed to create or fetch user');
      const authData = JSON.parse(authResText);
      id = authData.user.id;
      await AsyncStorage.setItem('@user_data', JSON.stringify({
        uid: firebaseUser.uid,
        role: 'client',
        id,
      }));
      setUserId(id);
      // If profileImage is a local file, upload it
      let profileImageUrl = null;
      if (profileImage && profileImage.startsWith('file://')) {
        const formData = new FormData();
        formData.append('profileImage', {
          uri: profileImage,
          name: 'profile.jpg',
          type: 'image/jpeg',
        });
        const uploadRes = await fetch(`${API_BASE_URL}/users/${id}/photo`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${firebaseIdToken}`,
            'Accept': 'application/json',
          },
          body: formData,
        });
        const uploadResText = await uploadRes.text();
        if (!uploadRes.ok) {
          let errorData;
          try { errorData = JSON.parse(uploadResText); } catch { errorData = { message: uploadResText }; }
          throw new Error(errorData.message || 'Failed to upload profile photo');
        }
        const uploadData = JSON.parse(uploadResText);
        profileImageUrl = uploadData.profileImage;
      }
      // PATCH profile info (overwrite if exists)
      const updateData = {
        name: `${firstName} ${lastName}`.trim(),
        email,
        flat,
        street,
        landmark,
        pincode,
        city,
        state,
        profileImage: profileImageUrl || undefined,
      };
      console.log('PATCH updateData:', updateData);
      const patchUrl = `${API_BASE_URL}/users/${id}`;
      const response = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const responseText = await response.text();
      if (!response.ok) {
        let errorMessage = 'Failed to update profile';
        try { errorMessage = JSON.parse(responseText).message || errorMessage; } catch {}
        throw new Error(errorMessage);
      }
      const updatedUser = JSON.parse(responseText);
      await AsyncStorage.setItem('@user_data', JSON.stringify(updatedUser));
      setSaveError(false);
      setProfileSaved(true);
      setIsEditing(false);
      // Animated success message
      setShowSuccess(true);
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(successAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => setShowSuccess(false));
        }, 1200);
      });
    } catch (error) {
      setSaveError(true);
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const isFormComplete = firstName && lastName && email && flat && street && landmark && pincode && city && state && agreed;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 18, marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  if (saveError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: '#FF3B30', fontWeight: 'bold', fontSize: 18, marginBottom: 24 }}>Failed to save profile</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#007AFF', padding: 16, borderRadius: 8 }}
          onPress={async () => {
            try {
              await auth().signOut();
              await AsyncStorage.clear();
              router.replace('/auth/phone?role=client');
            } catch (error) {
              Alert.alert('Error', 'Failed to log out and clear storage.');
            }
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.content}>
          {/* Profile Photo Section */}
          <View style={styles.photoContainer}>
            {profileImage && userId ? (
              <Image
                source={{ uri: `${API_BASE_URL}/users/${userId}/photo` }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.defaultPhoto}>
                <Ionicons name="person" size={60} color="#ccc" />
              </View>
            )}
          </View>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                editable={isEditing}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                editable={isEditing}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (text && !emailRegex.test(text)) {
                    setEmailError('Please enter a valid email id');
                  } else {
                    setEmailError('');
                  }
                }}
                placeholder="Enter your email"
                keyboardType="email-address"
                editable={isEditing}
              />
              {emailError ? (
                <Text style={{ color: 'red', marginTop: 4 }}>{emailError}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Flat / Building Name</Text>
              <TextInput
                style={styles.input}
                value={flat}
                onChangeText={setFlat}
                placeholder="Enter flat or building name"
                editable={isEditing}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Name & Locality</Text>
              <TextInput
                style={styles.input}
                value={street}
                onChangeText={setStreet}
                placeholder="Enter street name and locality"
                editable={isEditing}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Landmark</Text>
              <TextInput
                style={styles.input}
                value={landmark}
                onChangeText={setLandmark}
                placeholder="Enter landmark"
                editable={isEditing}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={styles.input}
                value={pincode}
                onChangeText={setPincode}
                placeholder="Enter pincode"
                keyboardType="number-pad"
                maxLength={6}
                editable={isEditing}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={city}
                editable={false}
                placeholder="City will be auto-filled"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={state}
                editable={false}
                placeholder="State will be auto-filled"
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
            <CheckBox
              value={agreed}
              onValueChange={isEditing ? setAgreed : undefined}
              color={isEditing ? '#007AFF' : '#aaa'}
              style={{ marginRight: 8 }}
              disabled={!isEditing}
            />
            <Text style={{ fontSize: 14, color: isEditing ? '#333' : '#aaa' }}>I agree with the terms and conditions</Text>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: isEditing ? '#34C759' : '#007AFF',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 16,
              flexDirection: 'row',
              justifyContent: 'center',
              opacity: isEditing && !agreed ? 0.5 : 1,
            }}
            onPress={() => {
              if (isEditing) {
                if (agreed) {
                  handleSave();
                }
              } else {
                setIsEditing(true);
              }
            }}
            disabled={saving || (isEditing && !agreed)}
          >
            <Ionicons name={isEditing ? 'save-outline' : 'create-outline'} size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>
              {isEditing ? (saving ? 'Saving...' : 'Save Profile') : 'Edit/Save Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {showSuccess && (
        <Animated.View style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          alignItems: 'center',
          opacity: successAnim,
          zIndex: 100,
        }}>
          <View style={{ backgroundColor: '#34C759', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Profile has been saved!</Text>
          </View>
        </Animated.View>
      )}
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
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  defaultPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#333',
  },
  genderOptionTextSelected: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
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
  formSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  placeholder: {
    width: 40,
  },
}); 