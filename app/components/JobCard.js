import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function JobCard({ job }) {
  const router = useRouter();
  const { colors } = useTheme();

  const handleJobPress = () => {
    router.push({
      pathname: '/client/job-details',
      params: { id: job.id }
    });
  };

  const handleMessagePress = () => {
    router.push({
      pathname: '/messages',
      params: {
        jobId: job.id,
        userId: job.freelancerId,
        userName: job.freelancerName,
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <TouchableOpacity style={styles.content} onPress={handleJobPress}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{job.title}</Text>
          <Text style={[styles.price, { color: colors.primary }]}>₹{job.price}</Text>
        </View>

        <Text style={[styles.description, { color: colors.placeholder }]} numberOfLines={2}>
          {job.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.detail}>
            <Ionicons name="location-outline" size={16} color={colors.placeholder} />
            <Text style={[styles.detailText, { color: colors.placeholder }]}>{job.location}</Text>
          </View>

          <View style={styles.detail}>
            <Ionicons name="people-outline" size={16} color={colors.placeholder} />
            <Text style={[styles.detailText, { color: colors.placeholder }]}>{job.peopleRequired} people</Text>
          </View>

          <View style={styles.detail}>
            <Ionicons name="person-outline" size={16} color={colors.placeholder} />
            <Text style={[styles.detailText, { color: colors.placeholder }]}>{job.genderPreference}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.messageButton, { backgroundColor: colors.primary }]}
        onPress={handleMessagePress}
      >
        <Ionicons name="chatbubble-outline" size={20} color="#fff" />
        <Text style={styles.messageButtonText}>Message</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    marginLeft: 4,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 