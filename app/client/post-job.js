import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../utils/api';

export default function PostJobScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    peopleRequired: '',
    genderPreference: 'Any',
  });
  const [userId, setUserId] = useState(null);
  const [address, setAddress] = useState({
    flat: '',
    street: '',
    landmark: '',
    pincode: '',
    city: '',
    state: '',
    postOfficeName: '',
  });
  // Autofill city/state and post office from pincode
  useEffect(() => {
    if (address.pincode.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${address.pincode}`)
        .then(res => res.json())
        .then(data => {
          if (data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const postOffice = data[0].PostOffice[0];
            setAddress(addr => ({ 
              ...addr, 
              city: postOffice.District || '', 
              state: postOffice.State || '',
              postOfficeName: postOffice.Name || ''
            }));
          } else {
            setAddress(addr => ({ ...addr, city: '', state: '', postOfficeName: '' }));
          }
        })
        .catch(() => {
          setAddress(addr => ({ ...addr, city: '', state: '', postOfficeName: '' }));
        });
    } else {
      setAddress(addr => ({ ...addr, city: '', state: '', postOfficeName: '' }));
    }
  }, [address.pincode]);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const userData = await AsyncStorage.getItem('@user_data');
        if (userData) {
          const user = JSON.parse(userData);
          setUserId(user.id || user._id); // support both id and _id
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserId();
  }, []);

  // Check if all required fields are filled
  const isFormComplete = () => {
    return (
      formData.title.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.price.trim() !== '' &&
      address.flat.trim() !== '' &&
      address.street.trim() !== '' &&
      address.landmark.trim() !== '' &&
      address.pincode.trim() !== '' &&
      address.city.trim() !== '' &&
      address.state.trim() !== '' &&
      formData.peopleRequired.trim() !== ''
    );
  };

  const handleSave = async () => {
    if (!isFormComplete()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    try {
      // Get Firebase ID token for authentication
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'No user is currently signed in. Please login again.');
        return;
      }
      
      const firebaseIdToken = await user.getIdToken();
      if (!firebaseIdToken) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        return;
      }

      const jobData = {
        ...formData,
        price: Number(formData.price),
        peopleRequired: Number(formData.peopleRequired),
        flat: address.flat,
        street: address.street,
        landmark: address.landmark,
        pincode: address.pincode,
        city: address.city,
        state: address.state,
        postOfficeName: address.postOfficeName,
        status: 'open',
      };
      console.log('Firebase ID token:', firebaseIdToken.substring(0, 20) + '...');
      console.log('Posting job data:', jobData);
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseIdToken}`
        },
        body: JSON.stringify(jobData),
      });
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);
      if (!response.ok) throw new Error('Failed to post job');
      Alert.alert('Success', 'Job posted successfully', [
        {
          text: 'OK',
          onPress: () => router.push('/client/home'),
        },
      ]);
    } catch (error) {
      console.error('Error posting job:', error);
      Alert.alert('Error', 'Failed to post job: ' + error.message);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Job Posting',
      'You can post a job later from the dashboard. Would you like to skip for now?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          onPress: () => router.push('/client/home'),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Post a Job</Text>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipButtonText, { color: colors.primary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 80}
      >
        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Job Title</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Enter job title"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { 
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe the job requirements"
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Price (₹)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              placeholder="Enter price"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
            />
          </View>

          {/* Address Fields */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Flat / Building Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={address.flat}
              onChangeText={text => setAddress(addr => ({ ...addr, flat: text }))}
              placeholder="Flat or building name"
              placeholderTextColor={colors.placeholder}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Street Name & Locality</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={address.street}
              onChangeText={text => setAddress(addr => ({ ...addr, street: text }))}
              placeholder="Street name and locality"
              placeholderTextColor={colors.placeholder}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Landmark</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={address.landmark}
              onChangeText={text => setAddress(addr => ({ ...addr, landmark: text }))}
              placeholder="Landmark"
              placeholderTextColor={colors.placeholder}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Pincode</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={address.pincode}
              onChangeText={text => setAddress(addr => ({ ...addr, pincode: text }))}
              placeholder="Pincode"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>City & State</Text>
            <View style={styles.rowContainer}>
              <View style={styles.halfWidth}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  value={address.city}
                  editable={false}
                  placeholder="City"
                  placeholderTextColor={colors.placeholder}
                />
              </View>
              <View style={styles.halfWidth}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  value={address.state}
                  editable={false}
                  placeholder="State"
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>People Required</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.peopleRequired}
              onChangeText={(text) => setFormData({ ...formData, peopleRequired: text })}
              placeholder="Enter number of people"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Gender Preference</Text>
            <View style={styles.genderOptions}>
              {['Any', 'Male', 'Female'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderOption,
                    formData.genderPreference === gender && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFormData({ ...formData, genderPreference: gender })}
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      { color: formData.genderPreference === gender ? '#fff' : colors.text },
                    ]}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>


          
          <TouchableOpacity
            style={[
              styles.submitButton, 
              { 
                backgroundColor: isFormComplete() ? colors.primary : '#ccc',
                opacity: isFormComplete() ? 1 : 0.6
              }
            ]}
            onPress={handleSave}
            disabled={!isFormComplete()}
          >
            <Text style={[
              styles.submitButtonText,
              { color: isFormComplete() ? '#fff' : '#666' }
            ]}>
              Post Job
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    padding: 8,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  form: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  genderOptionText: {
    fontSize: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 0.48,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 