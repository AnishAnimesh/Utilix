import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useState } from 'react';

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState('');

  // simple fixed rate (USD → INR)
  const convert = () => {
    if (!amount) return;
    const converted = parseFloat(amount) * 94.78; // approx rate
    setResult(converted.toFixed(2) + ' INR');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Currency Converter</Text>

      <TextInput
        label="USD Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />

      <Button mode="contained" onPress={convert}>
        Convert
      </Button>

      {result ? (
        <Text style={styles.result}>Result: {result}</Text>
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