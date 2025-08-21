import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function JobCard({ job, role = 'client', onPickupWork, onStartWork, onWorkDone, currentUserId, profileComplete, profileChecked }) {
  const router = useRouter();
  const { colors } = useTheme();

  const isAssignedToCurrentFreelancer =
    role === 'freelancer' &&
    job.status === 'assigned' &&
    job.freelancer &&
    currentUserId &&
    (job.freelancer._id === currentUserId || job.freelancer === currentUserId);

  const isInProgressForCurrentFreelancer =
    role === 'freelancer' &&
    job.status === 'in_progress' &&
    job.freelancer &&
    currentUserId &&
    (job.freelancer._id === currentUserId || job.freelancer === currentUserId);

  const isCompletedForCurrentFreelancer =
    role === 'freelancer' &&
    job.status === 'completed' &&
    job.freelancer &&
    currentUserId &&
    (job.freelancer._id === currentUserId || job.freelancer === currentUserId);

  const isPaidForCurrentFreelancer =
    role === 'freelancer' &&
    job.status === 'paid' &&
    job.freelancer &&
    currentUserId &&
    (job.freelancer._id === currentUserId || job.freelancer === currentUserId);

  const showPickupWork = role === 'freelancer' && job.status === 'open';
  const showStartWork = role === 'freelancer' && isAssignedToCurrentFreelancer;
  const showWorkDone = role === 'freelancer' && isInProgressForCurrentFreelancer;
  const showWaitingForPayment = role === 'freelancer' && isCompletedForCurrentFreelancer;
  const showReceived = role === 'freelancer' && isPaidForCurrentFreelancer;
  const showMessage = role === 'freelancer' && (isAssignedToCurrentFreelancer || isInProgressForCurrentFreelancer || isCompletedForCurrentFreelancer || isPaidForCurrentFreelancer);

  // Client-specific logic
  const showPayButton = role === 'client' && job.status === 'completed' && job.freelancer;


  const handleJobPress = () => {
    if (role === 'freelancer') {
      router.push({
        pathname: '/freelancer/job-details',
        params: { id: job._id }
      });
    } else {
      router.push({
        pathname: '/client/job-details',
        params: { id: job._id }
      });
    }
  };

  const handleMessagePress = () => {
    router.push({
      pathname: '/messages',
      params: {
        jobId: job._id,
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
            <Ionicons name="location-outline" size={14} color={colors.placeholder} />
            <Text style={[styles.detailText, { color: colors.placeholder }]} numberOfLines={1} ellipsizeMode="tail">
              {job.postOfficeName ? `${job.postOfficeName}, ${job.city}` : job.city || job.location || 'Location'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detail}>
              <Ionicons name="people-outline" size={14} color={colors.placeholder} />
              <Text style={[styles.detailText, { color: colors.placeholder }]} numberOfLines={1}>
                {job.peopleRequired} people
              </Text>
            </View>

            <View style={styles.detail}>
              <Ionicons name="person-outline" size={14} color={colors.placeholder} />
              <Text style={[styles.detailText, { color: colors.placeholder }]} numberOfLines={1}>
                {job.genderPreference}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Show freelancer assignment for clients */}
      {role === 'client' && (job.status === 'assigned' || job.status === 'in_progress') && job.freelancer && (
        <View style={styles.assignmentContainer}>
          <Ionicons name={job.status === 'in_progress' ? "play-outline" : "checkmark-outline"} size={16} color="#007AFF" />
          <Text style={styles.assignmentText}>
            {job.status === 'in_progress' 
              ? `Freelancer (${job.freelancer.name || job.freelancer.email || 'Freelancer'}) started working...`
              : `Assigned to ${job.freelancer.name || job.freelancer.email || 'Freelancer'}`
            }
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        {showPickupWork && (
          <TouchableOpacity
            style={[
              styles.messageButton,
              styles.pickupButton,
              (!profileComplete || !profileChecked)
                ? { backgroundColor: '#ccc' }
                : { backgroundColor: '#007AFF' }
            ]}
            onPress={() => onPickupWork && onPickupWork(job)}
            disabled={!profileComplete || !profileChecked}
          >
            <Ionicons name="briefcase-outline" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Pickup Work</Text>
          </TouchableOpacity>
        )}
        {showStartWork && (
          <TouchableOpacity
            style={[styles.messageButton, styles.wideButton, { backgroundColor: '#28C76F' }]}
            onPress={() => onStartWork && onStartWork(job)}
          >
            <Ionicons name="play-circle-outline" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Start Work</Text>
          </TouchableOpacity>
        )}
        {showWorkDone && (
          <TouchableOpacity
            style={[styles.messageButton, styles.wideButton, { backgroundColor: '#FF9500' }]}
            onPress={() => {
              if (onWorkDone) {
                onWorkDone(job);
              } else {
                // This will be implemented later as per user's requirements
                Alert.alert('Work Done', 'Work Done functionality will be implemented later.');
              }
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Work Done</Text>
          </TouchableOpacity>
        )}
        {showWaitingForPayment && (
          <TouchableOpacity
            style={[styles.messageButton, styles.wideButton, { backgroundColor: '#FF9500' }]}
            onPress={() => {
              Alert.alert('Payment Status', 'Waiting for client to complete payment. This job will move to Orders once payment is received.');
            }}
          >
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Waiting for Payment</Text>
          </TouchableOpacity>
        )}
        {showReceived && (
          <TouchableOpacity
            style={[styles.messageButton, styles.wideButton, { backgroundColor: '#34C759' }]}
            onPress={() => {
              Alert.alert('Payment Received', 'Payment has been received for this job!');
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Received</Text>
          </TouchableOpacity>
        )}
        {showPayButton && (
          <TouchableOpacity
            style={[styles.messageButton, styles.wideButton, { backgroundColor: '#34C759' }]}
            onPress={() => {
              // Navigate to job details to show payment options
              router.push({
                pathname: '/client/job-details',
                params: { id: job._id }
              });
            }}
          >
            <Ionicons name="card-outline" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Pay ₹{job.price}</Text>
          </TouchableOpacity>
        )}
        {showMessage && (
          <TouchableOpacity
            style={[styles.messageButton, styles.wideButton, { backgroundColor: colors.primary }]}
            onPress={handleMessagePress}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        )}
      </View>
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
    padding: 12,
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
    flexDirection: 'column',
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 6,
  },
  assignmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  assignmentText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  pickupButton: {
    flex: 1,
    minWidth: 140,
  },
  wideButton: {
    flex: 1,
    minWidth: 120,
  },
}); 