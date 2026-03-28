import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useState } from 'react';

export default function AgeCalculator() {
  const [year, setYear] = useState('');
  const [age, setAge] = useState('');

  const calculateAge = () => {
    if (!year) return;

    const currentYear = new Date().getFullYear();
    const result = currentYear - parseInt(year);

    setAge(result.toString());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Age Calculator</Text>

      <TextInput
        label="Enter Birth Year"
        value={year}
        onChangeText={setYear}
        keyboardType="numeric"
        style={styles.input}
      />

      <Button mode="contained" onPress={calculateAge}>
        Calculate Age
      </Button>

      {age ? (
        <Text style={styles.result}>Your Age: {age} years</Text>
      ) : null}
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
    marginBottom: 15,
  },
  result: {
    marginTop: 20,
    fontSize: 18,
  },
});