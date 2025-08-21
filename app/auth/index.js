import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AuthScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Welcome</Text>

      {/* Simple Auth Options */}
      <View style={styles.authOptions}>
        <TouchableOpacity 
          style={styles.authButton}
          onPress={() => router.push('/auth/role-selection')}
        >
          <Text style={styles.authButtonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.authButton, styles.loginButton]}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={[styles.authButtonText, styles.loginButtonText]}>Login</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
  },
  authOptions: {
    gap: 16,
  },
  authButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loginButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  loginButtonText: {
    color: '#007AFF',
  },
});
