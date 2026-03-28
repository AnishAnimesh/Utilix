import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useState } from 'react';

export default function SplitBill() {
  const [amount, setAmount] = useState('');
  const [people, setPeople] = useState('');
  const [result, setResult] = useState('');

  const calculateSplit = () => {
    if (!amount || !people) return;

    const perPerson = parseFloat(amount) / parseInt(people);
    setResult(perPerson.toFixed(2));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Split Bill</Text>

      <TextInput
        label="Total Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        label="Number of People"
        value={people}
        onChangeText={setPeople}
        keyboardType="numeric"
        style={styles.input}
      />

      <Button mode="contained" onPress={calculateSplit}>
        Calculate
      </Button>

      {result ? (
        <Text style={styles.result}>
          Each person pays: ₹ {result}
        </Text>
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