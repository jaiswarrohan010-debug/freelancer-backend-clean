import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getJobs, updateJob } from '../utils/jobStorage';

export default function EditJobScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    peopleRequired: '',
    genderPreference: 'Any',
    price: '',
  });

  useEffect(() => {
    loadJobDetails();
  }, [id]);

  const loadJobDetails = async () => {
    try {
      const jobs = await getJobs();
      const jobDetails = jobs.find(j => j.id === id);
      if (jobDetails) {
        setFormData({
          title: jobDetails.title,
          description: jobDetails.description,
          location: jobDetails.location,
          peopleRequired: jobDetails.peopleRequired.toString(),
          genderPreference: jobDetails.genderPreference,
          price: jobDetails.price.toString(),
        });
      } else {
        Alert.alert('Error', 'Job not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading job details:', error);
      Alert.alert('Error', 'Failed to load job details');
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.location || 
        !formData.peopleRequired || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await updateJob(id, {
        ...formData,
        peopleRequired: parseInt(formData.peopleRequired),
        price: parseInt(formData.price),
      });
      Alert.alert('Success', 'Job updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating job:', error);
      Alert.alert('Error', 'Failed to update job');
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
        <Text style={styles.headerTitle}>Edit Job</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Work Title *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="Enter work title"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Enter job description"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(text) => setFormData({ ...formData, location: text })}
            placeholder="Enter location"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of People Required *</Text>
          <TextInput
            style={styles.input}
            value={formData.peopleRequired}
            onChangeText={(text) => setFormData({ ...formData, peopleRequired: text })}
            placeholder="Enter number of people"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender Preference</Text>
          <View style={styles.genderOptions}>
            {['Male', 'Female', 'Any'].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderOption,
                  formData.genderPreference === gender && styles.genderOptionSelected,
                ]}
                onPress={() => setFormData({ ...formData, genderPreference: gender })}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    formData.genderPreference === gender && styles.genderOptionTextSelected,
                  ]}
                >
                  {gender}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price (₹) *</Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            placeholder="Enter price"
            keyboardType="numeric"
          />
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
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
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
}); 