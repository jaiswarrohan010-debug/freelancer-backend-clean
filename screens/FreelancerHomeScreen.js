import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const FreelancerHomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome, Freelancer!</Text>
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

export default FreelancerHomeScreen; 