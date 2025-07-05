import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

const RoleSelectionScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Select Your Role</Text>
      <Button title="Client" onPress={() => navigation.navigate('ClientHome')} />
      <Button title="Freelancer" onPress={() => navigation.navigate('FreelancerHome')} />
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
    marginBottom: 20,
  },
});

export default RoleSelectionScreen; 