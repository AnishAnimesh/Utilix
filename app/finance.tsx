import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function FinanceScreen() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await AsyncStorage.getItem('expenses');
      if (data !== null) setExpenses(JSON.parse(data));
    } catch (error) {
      console.log(error);
    }
  };

  const saveExpenses = async (data: any[]) => {
    try {
      await AsyncStorage.setItem('expenses', JSON.stringify(data));
    } catch (error) {
      console.log(error);
    }
  };

  const addExpense = () => {
    if (!title || !amount) return;
    const newExpense = {
      id: Date.now(),
      title,
      amount: parseFloat(amount),
      date: new Date().toLocaleString(),
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    saveExpenses(updated);
    setTitle('');
    setAmount('');
  };

  const deleteExpense = async (id: number) => {
    const updated = expenses.filter(item => item.id !== id);
    setExpenses(updated);
    await saveExpenses(updated);
  };

  const confirmClearAll = () => {
    Alert.alert('Clear All', 'Are you sure you want to delete all expenses?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('expenses');
          setExpenses([]);
        },
      },
    ]);
  };

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <FlatList
        data={expenses}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}

        ListHeaderComponent={
          <>
            {/* ── Header ── */}
            <View style={styles.header}>
              <View>
                <Text style={styles.heading}>Finance Tracker</Text>
                <Text style={styles.headingSub}>Track your daily spending</Text>
              </View>
              <TouchableOpacity
                onPress={confirmClearAll}
                style={styles.clearBtn}
                activeOpacity={0.75}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>

            {/* ── Total Card ── */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>TOTAL SPENT</Text>
              <Text style={styles.totalAmount}>₹{totalExpense.toFixed(2)}</Text>
              <Text style={styles.totalCount}>{expenses.length} transaction{expenses.length !== 1 ? 's' : ''}</Text>
            </View>

            {/* ── Input Card ── */}
            <View style={styles.inputCard}>
              <Text style={styles.inputCardTitle}>ADD EXPENSE</Text>
              <TextInput
                placeholder="Title  (e.g. Groceries)"
                placeholderTextColor="#cbd5e1"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
              <TextInput
                placeholder="Amount  (e.g. 250)"
                placeholderTextColor="#cbd5e1"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={styles.input}
              />
              <TouchableOpacity
                style={[styles.addBtn, (!title || !amount) && { opacity: 0.5 }]}
                onPress={addExpense}
                activeOpacity={0.85}
                disabled={!title || !amount}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.addBtnText}>Add Expense</Text>
              </TouchableOpacity>
            </View>

            {/* ── List Header ── */}
            {expenses.length > 0 && (
              <Text style={styles.listTitle}>RECENT EXPENSES</Text>
            )}
          </>
        }

        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#e2e8f0" />
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySub}>Add your first expense above</Text>
          </View>
        }

        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={styles.itemIcon}>
                <Ionicons name="cash-outline" size={18} color="#22c55e" />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemAmount}>₹{item.amount.toFixed(2)}</Text>
              <TouchableOpacity
                onPress={() => deleteExpense(item.id)}
                style={styles.deleteBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={15} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 16,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headingSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Total card
  totalCard: {
    backgroundColor: '#22c55e',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.8,
    marginBottom: 6,
  },
  totalAmount: {
    fontSize: 38,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
  totalCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },

  // Input card
  inputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 10,
  },
  inputCardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.8,
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  addBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    shadowColor: '#22c55e',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // List title
  listTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.8,
    marginBottom: 10,
  },

  // Expense item
  item: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  itemDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#cbd5e1',
  },
});