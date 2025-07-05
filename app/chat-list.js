import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from './context/ThemeContext';
import { getChats } from './utils/messageStorage';

export default function ChatListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [chats, setChats] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadChats();
    }
  }, [currentUserId]);

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

  const loadChats = async () => {
    try {
      const chatList = await getChats(currentUserId);
      setChats(chatList);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const handleChatPress = (chat) => {
    router.push({
      pathname: '/messages',
      params: {
        jobId: chat.jobId,
        userId: chat.userId,
        userName: chat.userName,
      },
    });
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.chatItem, { borderBottomColor: colors.border }]}
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.chatInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.userName}
        </Text>
        <Text style={[styles.lastMessage, { color: colors.placeholder }]} numberOfLines={1}>
          {item.lastMessage.content}
        </Text>
        <Text style={[styles.jobId, { color: colors.placeholder }]}>
          Job ID: {item.jobId}
        </Text>
      </View>
      <View style={styles.chatMeta}>
        <Text style={[styles.time, { color: colors.placeholder }]}>
          {new Date(item.lastMessage.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        {item.unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => `${item.userId}_${item.jobId}`}
        contentContainerStyle={styles.chatList}
      />
    </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  chatList: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  chatInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  jobId: {
    fontSize: 12,
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 12,
    marginBottom: 4,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 