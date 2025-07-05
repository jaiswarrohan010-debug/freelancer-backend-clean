import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

const LoginScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Login Screen</Text>
      <Button title="Go to Register" onPress={() => navigation.navigate('Register')} />
      <Button title="Login" onPress={() => navigation.navigate('RoleSelection')} />
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

export default LoginScreen; 