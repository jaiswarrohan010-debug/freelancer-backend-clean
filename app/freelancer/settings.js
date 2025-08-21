import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const SETTINGS_STORAGE_KEY = '@freelancer_settings';

export default function FreelancerSettingsScreen() {
  const router = useRouter();
  const { colors, toggleTheme, isDarkMode } = useTheme();
  const [settings, setSettings] = useState({
    darkMode: isDarkMode,
    notificationSound: true,
    emailNotifications: true,
    locationServices: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (data) setSettings(JSON.parse(data));
    } catch (e) {
      Alert.alert('Error', 'Failed to load settings');
    }
  };

  const toggleSetting = async (key) => {
    let newSettings = { ...settings, [key]: !settings[key] };
    if (key === 'darkMode') toggleTheme();
    setSettings(newSettings);
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.card }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        <View style={styles.settingRow}>
          <Ionicons name="moon" size={22} color={colors.primary} style={styles.settingIcon} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
          <Switch
            value={settings.darkMode}
            onValueChange={() => toggleSetting('darkMode')}
            thumbColor={settings.darkMode ? colors.primary : '#ccc'}
          />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.settingRow}>
          <Ionicons name="notifications" size={22} color={colors.primary} style={styles.settingIcon} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>Notification Sound</Text>
          <Switch
            value={settings.notificationSound}
            onValueChange={() => toggleSetting('notificationSound')}
            thumbColor={settings.notificationSound ? colors.primary : '#ccc'}
          />
        </View>
        <View style={styles.settingRow}>
          <Ionicons name="mail" size={22} color={colors.primary} style={styles.settingIcon} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>Email Notifications</Text>
          <Switch
            value={settings.emailNotifications}
            onValueChange={() => toggleSetting('emailNotifications')}
            thumbColor={settings.emailNotifications ? colors.primary : '#ccc'}
          />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy & Location</Text>
        <View style={styles.settingRow}>
          <Ionicons name="location" size={22} color={colors.primary} style={styles.settingIcon} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>Location Services</Text>
          <Switch
            value={settings.locationServices}
            onValueChange={() => toggleSetting('locationServices')}
            thumbColor={settings.locationServices ? colors.primary : '#ccc'}
          />
        </View>
      </View>
      <View style={styles.section}>
        <TouchableOpacity 
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderRadius: 8,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: '#007AFF',
            marginTop: 24,
            justifyContent: 'center',
          }}
          onPress={async () => {
            try {
              await AsyncStorage.clear();
              if (auth && auth().signOut) await auth().signOut();
              Alert.alert('Success', 'Signed out and AsyncStorage cleared!');
              router.replace('/auth/phone?role=freelancer');
            } catch (error) {
              Alert.alert('Error', 'Failed to log out and clear storage.');
            }
          }}
        >
          <Ionicons name="trash-outline" size={24} color="#007AFF" />
          <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>Log out & Clear Storage</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  settingIcon: { marginRight: 12 },
  settingLabel: { flex: 1, fontSize: 16 },
}); 