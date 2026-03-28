import { View, StyleSheet, FlatList } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useState } from 'react';

export default function Finance() {
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [expenses, setExpenses] = useState([]);

  const addExpense = () => {
    if (!title || !amount) return;

    const newExpense = {
      id: Date.now().toString(),
      title,
      amount,
    };

    setExpenses([newExpense, ...expenses]);
    setTitle('');
    setAmount('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Finance Tracker</Text>

      <TextInput
        label="Title (Food, Travel...)"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <TextInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />

      <Button mode="contained" onPress={addExpense}>
        Add Expense
      </Button>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text>{item.title}</Text>
              <Text>₹ {item.amount}</Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  heading: {
    fontSize: 24,
    marginBottom: 15,
  },
  input: {
    marginBottom: 10,
  },
  card: {
    marginTop: 10,
  },
});