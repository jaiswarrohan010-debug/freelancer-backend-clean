import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../utils/api';

export default function FreelancerProfileScreen() {
  const router = useRouter();
  const { id, jobId } = useLocalSearchParams();
  const [freelancer, setFreelancer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFreelancerProfile();
  }, [id]);

  const loadFreelancerProfile = async () => {
    try {
      setLoading(true);
      
      // Get Firebase ID token for authentication
      const user = auth().currentUser;
      if (!user) {
        console.error('No user is currently signed in');
        Alert.alert('Error', 'No user is currently signed in');
        router.back();
        return;
      }
      
      const firebaseIdToken = await user.getIdToken();
      if (!firebaseIdToken) {
        console.error('No authentication token found');
        Alert.alert('Error', 'No authentication token found');
        router.back();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${firebaseIdToken}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          Alert.alert('Error', 'Freelancer not found');
          router.back();
          return;
        }
        throw new Error('Failed to fetch freelancer profile');
      }
      
      const freelancerData = await response.json();
      setFreelancer(freelancerData);
    } catch (error) {
      console.error('Error loading freelancer profile:', error);
      Alert.alert('Error', 'Failed to load freelancer profile');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!freelancer) {
    return (
      <View style={styles.container}>
        <Text>Freelancer not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Freelancer Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Profile Photo */}
        <View style={styles.photoContainer}>
          {freelancer.profileImage ? (
            <Image 
              source={{ uri: `${API_BASE_URL}/users/${freelancer._id}/photo` }} 
              style={styles.profilePhoto}
            />
          ) : (
            <View style={styles.defaultPhoto}>
              <Ionicons name="person" size={60} color="#ccc" />
            </View>
          )}
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.name}>{freelancer.name}</Text>
          <Text style={styles.role}>Freelancer</Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{freelancer.phone || 'Not provided'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{freelancer.email || 'Not provided'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{freelancer.address || 'Not provided'}</Text>
          </View>

          {freelancer.gender && (
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <Text style={styles.infoText}>Gender: {freelancer.gender}</Text>
            </View>
          )}
        </View>

        {/* Skills */}
        {freelancer.skills && freelancer.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {freelancer.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Experience */}
        {freelancer.experience && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <Text style={styles.bio}>{freelancer.experience}</Text>
          </View>
        )}

        {/* Contact Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => {
              if (freelancer.phone) {
                Linking.openURL(`tel:${freelancer.phone}`);
              } else {
                Alert.alert('No Phone Number', 'Phone number not available');
              }
            }}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.buttonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => {
              // Navigate to messages with this freelancer
              router.push(`/messages?jobId=${jobId || 'general'}&userId=${freelancer._id}&userName=${freelancer.name}`);
            }}
          >
            <Ionicons name="chatbubble" size={20} color="#fff" />
            <Text style={styles.buttonText}>Message</Text>
          </TouchableOpacity>
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
  placeholder: {
    width: 40,
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
  section: {
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  bio: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  skillText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
}); 