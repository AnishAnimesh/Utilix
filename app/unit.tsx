import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useState } from 'react';

export default function UnitConverter() {
  const [meters, setMeters] = useState('');

  const convertToKm = () => {
    if (!meters) return '';
    return (parseFloat(meters) / 1000).toString();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unit Converter</Text>

      <Text>Enter meters:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={meters}
        onChangeText={setMeters}
      />

      <Text>Kilometers: {convertToKm()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10
  }
});