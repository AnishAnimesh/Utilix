import { View, TextInput, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useState } from 'react';

export default function Reminder() {
  const [text, setText] = useState('');

  const saveReminder = () => {
    alert('Reminder saved: ' + text);
    setText('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reminder</Text>

      <TextInput
        placeholder="Enter reminder..."
        value={text}
        onChangeText={setText}
        style={styles.input}
      />

      <Button mode="contained" onPress={saveReminder}>
        Save Reminder
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
    borderWidth: 1,
    padding: 10,
    marginBottom: 20,
  },
});