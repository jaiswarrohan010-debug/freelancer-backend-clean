import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SuccessScreen() {
  const router = useRouter();
  const { role, name } = useLocalSearchParams();

  const handleContinue = () => {
    if (role === 'freelancer') {
      router.replace('/freelancer/home');
    } else {
      router.replace('/client/home');
    }
  };

  return (
    <View style={styles.container}>
      {/* Success Animation */}
      <View style={styles.successContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={100} color="#34C759" />
        </View>
        
        <Text style={styles.title}>Account Created Successfully!</Text>
        <Text style={styles.subtitle}>
          Welcome to People, {name || 'User'}! 🎉
        </Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="shield-checkmark" size={20} color="#34C759" />
            <Text style={styles.detailText}>Identity verified with DigiLocker</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="person-check" size={20} color="#34C759" />
            <Text style={styles.detailText}>Profile information updated</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="checkmark-done" size={20} color="#34C759" />
            <Text style={styles.detailText}>Account ready to use</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleContinue}
        >
          <Ionicons name="rocket" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>
            {role === 'freelancer' ? 'Start Finding Work' : 'Start Hiring'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push('/auth/profile-setup')}
        >
          <Ionicons name="settings" size={20} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Complete Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Welcome Message */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>
          {role === 'freelancer' ? 'Ready to Earn?' : 'Ready to Hire?'}
        </Text>
        <Text style={styles.welcomeText}>
          {role === 'freelancer' 
            ? 'Browse available jobs, apply, and start earning money with your skills.'
            : 'Post jobs, find talented freelancers, and get your projects completed.'
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0fff0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#34C759',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  detailsContainer: {
    width: '100%',
    maxWidth: 300,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  detailText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 12,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
