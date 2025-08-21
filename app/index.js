import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../1000013213 (1).png')} 
            style={styles.appIcon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appTitle}>People</Text>
        <Text style={styles.appSubtitle}>Connect • Find • Complete</Text>
      </View>

      {/* Role Options */}
      <View style={styles.roleOptions}>
        <TouchableOpacity 
          style={styles.roleButton}
          onPress={() => router.push('/auth/login?role=client')}
        >
          <Text style={styles.roleButtonText}>Hire Talent</Text>
          <Text style={styles.roleButtonSubtext}>Hire skilled professionals for your projects</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.roleButton, styles.freelancerButton]}
          onPress={() => router.push('/auth/login?role=freelancer')}
        >
          <Text style={styles.roleButtonText}>Work as Freelancer</Text>
          <Text style={styles.roleButtonSubtext}>Find work opportunities and earn great income</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appIcon: {
    width: 50,
    height: 50,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  roleOptions: {
    gap: 16,
  },
  roleButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: 120,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roleButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  freelancerButton: {
    backgroundColor: '#34C759',
  },
}); 