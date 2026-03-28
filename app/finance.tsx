import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FinanceScreen() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);

  // Load saved data
  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await AsyncStorage.getItem('expenses');
      if (data !== null) {
        setExpenses(JSON.parse(data));
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Save data
  const saveExpenses = async (data: any[]) => {
    try {
      await AsyncStorage.setItem('expenses', JSON.stringify(data));
    } catch (error) {
      console.log(error);
    }
  };

  // Add expense
  const addExpense = () => {
    if (!title || !amount) return;

    const newExpense = {
      id: Date.now(),
      title: title,
      amount: parseFloat(amount),
      date: new Date().toLocaleString(),
    };

    const updatedExpenses = [newExpense, ...expenses];

    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);

    setTitle('');
    setAmount('');
  };

  // Delete single expense
  const deleteExpense = async (id: number) => {
    const updated = expenses.filter(item => item.id !== id);
    setExpenses(updated);
    await saveExpenses(updated);
  };

  // Total
  const totalExpense = expenses.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  // Clear all
  const clearAll = async () => {
    await AsyncStorage.removeItem('expenses');
    setExpenses([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Finance Tracker</Text>

      {/* Inputs */}
      <TextInput
        placeholder="Enter Title"
        placeholderTextColor="#94a3b8"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <TextInput
        placeholder="Enter Amount"
        placeholderTextColor="#94a3b8"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />

      {/* Add Button */}
      <TouchableOpacity style={styles.addBtn} onPress={addExpense}>
        <Text style={styles.btnText}>Add Expense</Text>
      </TouchableOpacity>

      {/* Total */}
      <Text style={styles.total}>Total: ₹{totalExpense}</Text>

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshBtn} onPress={clearAll}>
        <Text style={styles.btnText}>Refresh</Text>
      </TouchableOpacity>

      {/* List */}
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.row}>
              <Text style={styles.text}>
                {item.title} - ₹{item.amount}
              </Text>

              <Text
                style={styles.delete}
                onPress={() => deleteExpense(item.id)}
              >
                ❌
              </Text>
            </View>

            <Text style={styles.date}>{item.date}</Text>
          </View>
        )}
      />
    </View>
  );
}

// 🎨 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0f172a',
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1e293b',
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    color: '#fff',
  },
  addBtn: {
    backgroundColor: '#22c55e',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  refreshBtn: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  total: {
    marginTop: 20,
    fontSize: 20,
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  item: {
    marginTop: 12,
    padding: 15,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  delete: {
    color: '#ef4444',
    fontSize: 16,
  },
  date: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 5,
  },
});