import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const PROFILE_STORAGE_KEY = '@freelancer_profile';

export default function FreelancerProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [profile, setProfile] = useState({
    name: '',
    gender: '',
    email: '',
    address: '',
    image: null,
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (data) setProfile(JSON.parse(data));
    } catch (e) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera roll permissions are required!');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setProfile({ ...profile, image: result.assets[0].uri });
    }
  };

  const handleSave = async () => {
    if (!profile.name || !profile.email) {
      Alert.alert('Validation', 'Name and Email are required');
      return;
    }
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      setEditing(false);
      Alert.alert('Success', 'Profile saved');
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading...</Text></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.card }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Freelancer Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={editing ? pickImage : undefined} style={styles.imageContainer}>
          {profile.image ? (
            <Image source={{ uri: profile.image }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle-outline" size={100} color={colors.placeholder} />
          )}
          {editing && <View style={styles.editIcon}><Ionicons name="camera" size={24} color="#fff" /></View>}
        </TouchableOpacity>
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={profile.name}
            onChangeText={text => setProfile({ ...profile, name: text })}
            editable={editing}
            placeholder="Enter your name"
            placeholderTextColor={colors.placeholder}
          />
          <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={profile.gender}
            onChangeText={text => setProfile({ ...profile, gender: text })}
            editable={editing}
            placeholder="Gender"
            placeholderTextColor={colors.placeholder}
          />
          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={profile.email}
            onChangeText={text => setProfile({ ...profile, email: text })}
            editable={editing}
            placeholder="Email"
            placeholderTextColor={colors.placeholder}
            keyboardType="email-address"
          />
          <Text style={[styles.label, { color: colors.text }]}>Address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={profile.address}
            onChangeText={text => setProfile({ ...profile, address: text })}
            editable={editing}
            placeholder="Address"
            placeholderTextColor={colors.placeholder}
          />
        </View>
        <View style={styles.buttonRow}>
          {editing ? (
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.editButton, { borderColor: colors.primary }]} onPress={() => setEditing(true)}>
              <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  profileSection: { alignItems: 'center', marginTop: 24 },
  imageContainer: { position: 'relative', marginBottom: 16 },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  editIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#007AFF', borderRadius: 16, padding: 4 },
  form: { width: '90%' },
  label: { fontSize: 16, marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  editButton: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32 },
  editButtonText: { fontSize: 16, fontWeight: 'bold' },
  saveButton: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
}); 