import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Text style={styles.logo}>People</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome to People</Text>
        <Text style={styles.subText}>Choose how you want to proceed</Text>

        <TouchableOpacity 
          style={styles.optionButton}
          onPress={() => router.push({ pathname: '/auth/phone', params: { role: 'client' } })}
        >
          <Ionicons name="business" size={32} color="#fff" />
          <Text style={styles.optionText}>Hire Talent</Text>
          <Text style={styles.optionSubText}>Post jobs and find freelancers</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionButton, styles.freelancerButton]}
          onPress={() => router.push({ pathname: '/auth/phone', params: { role: 'freelancer' } })}
        >
          <Ionicons name="person" size={32} color="#fff" />
          <Text style={styles.optionText}>Work as Freelancer</Text>
          <Text style={styles.optionSubText}>Find jobs and earn money</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  optionButton: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  freelancerButton: {
    backgroundColor: '#34C759',
  },
  optionText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  optionSubText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
}); 