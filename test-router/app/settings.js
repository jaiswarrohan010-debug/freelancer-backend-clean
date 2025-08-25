import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const SETTINGS_STORAGE_KEY = '@freelancer_app_settings';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    // Appearance
    darkMode: false,
    fontSize: 'medium', // small, medium, large
    language: 'English',
    currency: 'INR',
    
    // Notifications
    notifications: true,
    notificationSound: true,
    emailNotifications: true,
    jobAlerts: true,
    messageNotifications: true,
    
    // Privacy & Location
    locationServices: true,
    profileVisibility: 'public', // public, private
    showOnlineStatus: true,
    allowMessages: true,
    
    // Data & Storage
    autoSave: true,
    dataUsage: 'balanced', // low, balanced, high
    cacheSize: '1GB',
    clearCache: false,
    
    // Security
    biometricAuth: false,
    twoFactorAuth: false,
    sessionTimeout: '30min', // 15min, 30min, 1hour
    
    // App Preferences
    defaultView: 'list', // list, grid
    sortJobsBy: 'recent', // recent, price, distance
    showJobDistance: true,
    showJobRatings: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleSetting = async (key) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will remove temporary files and data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            // Implement cache clearing logic here
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const renderSettingItem = (icon, title, description, key, type = 'switch') => {
    if (type === 'switch') {
      return (
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <View style={styles.settingIcon}>
              <Ionicons name={icon} size={24} color="#007AFF" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{title}</Text>
              <Text style={styles.settingDescription}>{description}</Text>
            </View>
          </View>
          <Switch
            value={settings[key]}
            onValueChange={() => toggleSetting(key)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings[key] ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      );
    }

    if (type === 'action') {
      return (
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => key === 'clearCache' && handleClearCache()}
        >
          <View style={styles.settingInfo}>
            <View style={styles.settingIcon}>
              <Ionicons name={icon} size={24} color="#007AFF" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{title}</Text>
              <Text style={styles.settingDescription}>{description}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      );
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          {renderSettingItem(
            'moon-outline',
            'Dark Mode',
            'Enable dark theme for the app',
            'darkMode'
          )}
          {renderSettingItem(
            'text-outline',
            'Font Size',
            'Adjust text size for better readability',
            'fontSize',
            'action'
          )}
          {renderSettingItem(
            'language-outline',
            'Language',
            'Change app language',
            'language',
            'action'
          )}
          {renderSettingItem(
            'cash-outline',
            'Currency',
            'Set your preferred currency',
            'currency',
            'action'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {renderSettingItem(
            'notifications-outline',
            'Push Notifications',
            'Receive notifications about new jobs and updates',
            'notifications'
          )}
          {renderSettingItem(
            'volume-high-outline',
            'Notification Sound',
            'Play sound for notifications',
            'notificationSound'
          )}
          {renderSettingItem(
            'mail-outline',
            'Email Notifications',
            'Receive email notifications',
            'emailNotifications'
          )}
          {renderSettingItem(
            'briefcase-outline',
            'Job Alerts',
            'Get notified about new job opportunities',
            'jobAlerts'
          )}
          {renderSettingItem(
            'chatbubble-outline',
            'Message Notifications',
            'Receive notifications for new messages',
            'messageNotifications'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Location</Text>
          {renderSettingItem(
            'location-outline',
            'Location Services',
            'Allow app to access your location',
            'locationServices'
          )}
          {renderSettingItem(
            'eye-outline',
            'Profile Visibility',
            'Control who can see your profile',
            'profileVisibility',
            'action'
          )}
          {renderSettingItem(
            'radio-outline',
            'Online Status',
            'Show when you are online',
            'showOnlineStatus'
          )}
          {renderSettingItem(
            'chatbubble-ellipses-outline',
            'Allow Messages',
            'Let others send you messages',
            'allowMessages'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          {renderSettingItem(
            'save-outline',
            'Auto Save',
            'Automatically save your work',
            'autoSave'
          )}
          {renderSettingItem(
            'cellular-outline',
            'Data Usage',
            'Control app data consumption',
            'dataUsage',
            'action'
          )}
          {renderSettingItem(
            'trash-outline',
            'Clear Cache',
            'Free up storage space',
            'clearCache',
            'action'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          {renderSettingItem(
            'finger-print-outline',
            'Biometric Authentication',
            'Use fingerprint or face ID to login',
            'biometricAuth'
          )}
          {renderSettingItem(
            'shield-checkmark-outline',
            'Two-Factor Authentication',
            'Add an extra layer of security',
            'twoFactorAuth'
          )}
          {renderSettingItem(
            'time-outline',
            'Session Timeout',
            'Set automatic logout time',
            'sessionTimeout',
            'action'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          {renderSettingItem(
            'grid-outline',
            'Default View',
            'Choose your preferred view style',
            'defaultView',
            'action'
          )}
          {renderSettingItem(
            'swap-vertical-outline',
            'Sort Jobs By',
            'Set default job sorting',
            'sortJobsBy',
            'action'
          )}
          {renderSettingItem(
            'navigate-outline',
            'Show Job Distance',
            'Display distance to job location',
            'showJobDistance'
          )}
          {renderSettingItem(
            'star-outline',
            'Show Job Ratings',
            'Display job ratings and reviews',
            'showJobRatings'
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 