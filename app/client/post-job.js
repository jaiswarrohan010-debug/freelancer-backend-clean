import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.price || !formData.location || !formData.peopleRequired) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    try {
      const jobData = {
        ...formData,
        client: userId,
        status: 'open',
      };
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });
      if (!response.ok) throw new Error('Failed to post job');
      Alert.alert('Success', 'Job posted successfully', [
        {
          text: 'OK',
          onPress: () => router.push('/client/home'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to post job');
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
            <Text style={[styles.label, { color: colors.text }]}>Job Title *</Text>
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
            <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
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
            <Text style={[styles.label, { color: colors.text }]}>Price (₹) *</Text>
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

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="Enter location"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>People Required *</Text>
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
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.submitButtonText}>Post Job</Text>
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