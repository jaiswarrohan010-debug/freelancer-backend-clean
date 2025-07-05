import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ClientHomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome, Client!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
  },
});

export default ClientHomeScreen; 