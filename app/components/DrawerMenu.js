import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function DrawerMenu({ visible, onClose, userRole }) {
  const router = useRouter();
  const { colors } = useTheme();

  const menuItems = userRole === 'client' 
    ? [
        { icon: 'home-outline', label: 'Dashboard', route: '/client/home' },
        { icon: 'time-outline', label: 'History', route: '/client/history' },
        { icon: 'chatbubble-ellipses-outline', label: 'Messages', route: '/chat-list' },
        { icon: 'person-outline', label: 'Profile', route: '/client/profile' },
        { icon: 'settings-outline', label: 'Settings', route: '/client/settings' },
      ]
    : [
        { icon: 'home-outline', label: 'Dashboard', route: '/freelancer/home' },
        { icon: 'receipt-outline', label: 'Orders', route: '/freelancer/orders' },
        { icon: 'wallet-outline', label: 'Wallet', route: '/freelancer/wallet' },
        { icon: 'chatbubble-ellipses-outline', label: 'Messages', route: '/chat-list' },
        { icon: 'person-outline', label: 'Profile', route: '/freelancer/profile' },
        { icon: 'settings-outline', label: 'Settings', route: '/freelancer/settings' },
      ];

  const handleMenuItemPress = (route) => {
    onClose();
    router.push(route);
  };

  const handleLogout = () => {
    onClose();
    router.replace('/');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.drawer, { backgroundColor: colors.card }]}> 
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}> 
              {userRole === 'client' ? 'Client Menu' : 'Freelancer Menu'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.menuItems}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={() => handleMenuItemPress(item.route)}
              >
                <Ionicons name={item.icon} size={24} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.logoutButton, { borderTopColor: colors.border }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '80%',
    height: '100%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 'auto',
    borderTopWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 16,
  },
}); 