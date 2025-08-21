import AsyncStorage from '@react-native-async-storage/async-storage';

const MESSAGES_STORAGE_KEY = '@messages';

export const saveMessage = async (message) => {
  try {
    const messages = await getMessages();
    const newMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, newMessage];
    await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updatedMessages));
    return newMessage;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

export const getMessages = async () => {
  try {
    const messages = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
    return messages ? JSON.parse(messages) : [];
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

export const getMessagesByJobId = async (jobId) => {
  try {
    const messages = await getMessages();
    const jobMessages = messages.filter(message => message.jobId === jobId);
    // Sort by timestamp in ascending order (oldest first, newest last)
    return jobMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } catch (error) {
    console.error('Error getting messages by job ID:', error);
    return [];
  }
};

export const getMessagesByUserId = async (userId) => {
  try {
    const messages = await getMessages();
    return messages.filter(message => 
      message.senderId === userId || message.receiverId === userId
    );
  } catch (error) {
    console.error('Error getting messages by user ID:', error);
    return [];
  }
};

export const getChats = async (userId) => {
  try {
    const messages = await getMessages();
    const chats = new Map();

    messages.forEach(message => {
      if (message.senderId === userId || message.receiverId === userId) {
        const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
        const chatKey = `${otherUserId}_${message.jobId}`;
        
        if (!chats.has(chatKey)) {
          chats.set(chatKey, {
            userId: otherUserId,
            jobId: message.jobId,
            lastMessage: message,
            unreadCount: message.receiverId === userId && !message.read ? 1 : 0,
          });
        } else {
          const chat = chats.get(chatKey);
          if (message.timestamp > chat.lastMessage.timestamp) {
            chat.lastMessage = message;
          }
          if (message.receiverId === userId && !message.read) {
            chat.unreadCount += 1;
          }
        }
      }
    });

    return Array.from(chats.values()).sort((a, b) => 
      new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
    );
  } catch (error) {
    console.error('Error getting chats:', error);
    return [];
  }
};

export const markMessagesAsRead = async (jobId, userId) => {
  try {
    const messages = await getMessages();
    const updatedMessages = messages.map(message => {
      if (message.jobId === jobId && message.receiverId === userId && !message.read) {
        return { ...message, read: true };
      }
      return message;
    });
    await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updatedMessages));
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}; 