import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useState } from 'react';

export default function PasswordGenerator() {
  const [password, setPassword] = useState('');

  const generatePassword = () => {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let newPassword = '';

    for (let i = 0; i < 10; i++) {
      newPassword += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }

    setPassword(newPassword);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Password Generator</Text>

      <TextInput
        value={password}
        placeholder="Generated password"
        style={styles.input}
        editable={false}
      />

      <Button mode="contained" onPress={generatePassword}>
        Generate Password
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    marginBottom: 20,
  },
});