import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from './utils/api';

const PROFILE_STORAGE_KEY = '@freelancer_app_profile';

export default function ProfileScreen() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    email: '',
    address: '',
    phone: '',
  });
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        Alert.alert('Error', 'No user is currently signed in');
        setLoading(false);
        return;
      }
      const firebaseIdToken = await firebaseUser.getIdToken();
      console.log('Firebase UID:', firebaseUser.uid);
      // Fetch MongoDB user ID using Firebase UID
      const userDataRes = await fetch(`${API_BASE_URL}/users/${firebaseUser.uid}`, {
        headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
      });
      if (!userDataRes.ok) {
        setLoading(false);
        Alert.alert('Error', 'Failed to fetch user ID');
        return;
      }
      const userData = await userDataRes.json();
      setUserId(userData._id);
      console.log('MongoDB userId:', userData._id);
      // Fetch profile data
      const profileRes = await fetch(`${API_BASE_URL}/users/${userData._id}`, {
        headers: { 'Authorization': `Bearer ${firebaseIdToken}` }
      });
      if (!profileRes.ok) {
        setLoading(false);
        Alert.alert('Error', 'Failed to fetch profile');
        return;
      }
      const profile = await profileRes.json();
      setFormData({
        name: profile.name || '',
        gender: profile.gender || '',
        email: profile.email || '',
        address: profile.address || '',
        phone: profile.phone || '',
      });
      if (profile.profileImage) setProfileImage(profile.profileImage);
      setIsVerified(profile.isVerified === true);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        Alert.alert('Error', 'No user is currently signed in');
        setLoading(false);
        return;
      }
      const firebaseIdToken = await firebaseUser.getIdToken();
      console.log('Firebase UID:', firebaseUser.uid);
      console.log('MongoDB userId:', userId);
      // PATCH only editable fields (email and phone)
      const updateData = {
        email: formData.email,
        phone: formData.phone,
      };
      const patchUrl = `${API_BASE_URL}/users/${userId}`;
      console.log('PATCH URL:', patchUrl);
      const response = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error('Profile update failed (first 200 chars):', text.slice(0, 200));
        let errorMessage = 'Failed to update profile';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = text;
        }
        throw new Error(errorMessage);
      }
      const updatedProfile = await response.json();
      setFormData({
        name: updatedProfile.name || formData.name,
        gender: updatedProfile.gender || formData.gender,
        email: updatedProfile.email || '',
        address: updatedProfile.address || formData.address,
        phone: updatedProfile.phone || '',
      });
      if (updatedProfile.profileImage) setProfileImage(updatedProfile.profileImage);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
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

      <View style={styles.content}>
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
              value={formData.name}
              editable={false}
              placeholder="Will be filled after verification"
            />
            <Text style={styles.readOnlyNote}>Auto-filled after admin approval</Text>
          </View>

          {/* Gender - Read Only */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={formData.gender}
              editable={false}
              placeholder="Will be filled after verification"
            />
            <Text style={styles.readOnlyNote}>Auto-filled after admin approval</Text>
          </View>

          {/* Email - Editable */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              editable={isEditing}
              placeholder="Enter your email"
              keyboardType="email-address"
            />
          </View>

          {/* Address - Read Only */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea, styles.readOnlyInput]}
              value={formData.address}
              editable={false}
              placeholder="Will be filled after verification"
              multiline
              numberOfLines={3}
            />
            <Text style={styles.readOnlyNote}>Auto-filled after admin approval</Text>
          </View>

          {/* Phone - Editable */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              editable={isEditing}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>

          {isEditing && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
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
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
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
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verificationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
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
  },
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
    borderColor: '#e0e0e0',
  },
  readOnlyNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 