import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ClientSettingsScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await auth().signOut();
      // Clear all stored data
      await AsyncStorage.clear();
      // Navigate to auth screen
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Add your settings UI here */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: '#007AFF', marginTop: 16 }]}
          onPress={async () => {
            try {
              await auth().signOut();
              await AsyncStorage.clear();
              Alert.alert('Success', 'Signed out and AsyncStorage cleared!');
              router.replace('/auth/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to log out and clear storage.');
            }
          }}
        >
          <Ionicons name="trash-outline" size={24} color="#007AFF" />
          <Text style={[styles.logoutText, { color: '#007AFF' }]}>Log out & Clear Storage</Text>
        </TouchableOpacity>
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
    marginTop: 40,
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 