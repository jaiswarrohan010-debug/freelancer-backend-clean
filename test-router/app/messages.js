import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from './context/ThemeContext';
import { getMessagesByJobId, markMessagesAsRead, saveMessage } from './utils/messageStorage';

export default function MessagesScreen() {
  const router = useRouter();
  const { jobId, userId, userName } = useLocalSearchParams();
  const { colors } = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadMessages();
  }, [jobId]);

  const loadCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        const { id } = JSON.parse(userData);
        setCurrentUserId(id);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const jobMessages = await getMessagesByJobId(jobId);
      setMessages(jobMessages);
      if (currentUserId) {
        await markMessagesAsRead(jobId, currentUserId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const message = {
        jobId,
        senderId: currentUserId,
        receiverId: userId,
        content: newMessage.trim(),
        read: false,
      };

      await saveMessage(message);
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === currentUserId;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
        { backgroundColor: isOwnMessage ? colors.primary : colors.card }
      ]}>
        <Text style={[
          styles.messageText,
          { color: isOwnMessage ? '#fff' : colors.text }
        ]}>
          {item.content}
        </Text>
        <Text style={[
          styles.messageTime,
          { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.placeholder }
        ]}>
          {new Date(item.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {userName}
          </Text>
          <Text style={[styles.jobId, { color: colors.placeholder }]}>
            Job ID: {jobId}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.input,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={colors.placeholder}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, { backgroundColor: colors.primary }]}
          onPress={handleSend}
        >
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  jobId: {
    fontSize: 12,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 