import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Wallet from './components/Wallet';

export default function WalletScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Wallet />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 