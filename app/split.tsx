import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  name: string;
  avatar: string; // initials
  color: string;
  paid: boolean;
  share: number; // percentage or fixed
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  members: Member[];
  date: string;
  category: string;
}

type SplitMode = 'equal' | 'percentage' | 'exact';
type Tab = 'expenses' | 'balances' | 'add';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEMBER_COLORS = ['#1dbf73', '#ff652f', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899'];

const CATEGORIES = [
  { key: 'food',      label: 'Food',      icon: 'restaurant-outline' as const },
  { key: 'transport', label: 'Transport', icon: 'car-outline' as const },
  { key: 'home',      label: 'Home',      icon: 'home-outline' as const },
  { key: 'shopping',  label: 'Shopping',  icon: 'bag-outline' as const },
  { key: 'fun',       label: 'Fun',       icon: 'game-controller-outline' as const },
  { key: 'other',     label: 'Other',     icon: 'ellipsis-horizontal-outline' as const },
];

const DEFAULT_MEMBERS: Member[] = [
  { id: '1', name: 'You',   avatar: 'YO', color: '#1dbf73', paid: false, share: 0 },
  { id: '2', name: 'Alex',  avatar: 'AL', color: '#ff652f', paid: false, share: 0 },
  { id: '3', name: 'Priya', avatar: 'PR', color: '#3b82f6', paid: false, share: 0 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAmount(n: number) {
  return `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, color, size = 36 }: { name: string; color: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.33 }]}>{getInitials(name)}</Text>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SplitBill() {
  const [tab, setTab] = useState<Tab>('expenses');
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      description: 'Dinner at Barbeque Nation',
      amount: 2400,
      paidBy: '1',
      category: 'food',
      date: 'Today',
      members: DEFAULT_MEMBERS.map((m, i) => ({ ...m, share: 800 })),
    },
    {
      id: '2',
      description: 'Ola cab to airport',
      amount: 650,
      paidBy: '2',
      category: 'transport',
      date: 'Yesterday',
      members: DEFAULT_MEMBERS.map(m => ({ ...m, share: parseFloat((650 / 3).toFixed(2)) })),
    },
  ]);

  // ── Add Expense state ──
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('1');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [category, setCategory] = useState('food');
  const [members, setMembers] = useState<Member[]>(DEFAULT_MEMBERS);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const totalAmount = parseFloat(amount) || 0;

  // Compute each member's share for equal split
  const equalShare = members.length > 0 ? totalAmount / members.length : 0;

  const addMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    const id = Date.now().toString();
    const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
    setMembers(m => [...m, { id, name, avatar: getInitials(name), color, paid: false, share: 0 }]);
    setNewMemberName('');
    setShowAddMember(false);
  };

  const removeMember = (id: string) => {
    if (members.length <= 2) { Alert.alert('Need at least 2 members'); return; }
    setMembers(m => m.filter(mem => mem.id !== id));
    if (paidBy === id) setPaidBy(members.find(m => m.id !== id)?.id ?? '1');
  };

  const saveExpense = () => {
    if (!desc.trim() || totalAmount <= 0) {
      Alert.alert('Please enter description and amount');
      return;
    }
    const share = totalAmount / members.length;
    const newExp: Expense = {
      id: Date.now().toString(),
      description: desc.trim(),
      amount: totalAmount,
      paidBy,
      category,
      date: 'Just now',
      members: members.map(m => ({ ...m, share })),
    };
    setExpenses(e => [newExp, ...e]);
    setDesc(''); setAmount(''); setSplitMode('equal'); setCategory('food');
    setTab('expenses');
  };

  // ── Balance calculation ──
  const balances: Record<string, number> = {};
  DEFAULT_MEMBERS.forEach(m => { balances[m.id] = 0; });
  expenses.forEach(exp => {
    const share = exp.amount / exp.members.length;
    exp.members.forEach(m => {
      if (!balances[m.id]) balances[m.id] = 0;
      balances[m.id] -= share;
    });
    if (!balances[exp.paidBy]) balances[exp.paidBy] = 0;
    balances[exp.paidBy] += exp.amount;
  });

  const paidByMember = members.find(m => m.id === paidBy);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── Top Header ── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.groupName}>Weekend Trip 🏖</Text>
          <Text style={styles.groupSub}>{members.length} members · {expenses.length} expenses</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* ── Tab Bar ── */}
      <View style={styles.tabBar}>
        {(['expenses', 'balances'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabItem, tab === t && styles.tabItemActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ── */}
      {tab === 'expenses' && (
        <ScrollView style={styles.flex} contentContainerStyle={styles.listPad} showsVerticalScrollIndicator={false}>
          {expenses.map(exp => {
            const cat = CATEGORIES.find(c => c.key === exp.category);
            const payer = members.find(m => m.id === exp.paidBy) ?? members[0];
            const myShare = exp.amount / exp.members.length;
            return (
              <TouchableOpacity key={exp.id} style={styles.expenseCard} activeOpacity={0.85}>
                {/* Category icon */}
                <View style={styles.expCatIcon}>
                  <Ionicons name={cat?.icon ?? 'ellipsis-horizontal-outline'} size={18} color="#1dbf73" />
                </View>

                {/* Info */}
                <View style={styles.expInfo}>
                  <Text style={styles.expDesc} numberOfLines={1}>{exp.description}</Text>
                  <Text style={styles.expMeta}>
                    <Text style={{ color: payer.color, fontWeight: '700' }}>{payer.name}</Text>
                    {' paid · '}{exp.date}
                  </Text>
                </View>

                {/* Amount */}
                <View style={styles.expAmountCol}>
                  <Text style={styles.expTotal}>{fmtAmount(exp.amount)}</Text>
                  <Text style={styles.expShare}>you owe {fmtAmount(myShare)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {expenses.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={52} color="#e5e7eb" />
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptySub}>Tap + to add your first expense</Text>
            </View>
          )}
        </ScrollView>
      )}

      {tab === 'balances' && (
        <ScrollView style={styles.flex} contentContainerStyle={styles.listPad} showsVerticalScrollIndicator={false}>
          {/* Summary */}
          <View style={styles.balanceSummary}>
            <Text style={styles.balanceSummaryTitle}>GROUP SUMMARY</Text>
            <Text style={styles.balanceSummaryTotal}>
              Total spent: {fmtAmount(expenses.reduce((s, e) => s + e.amount, 0))}
            </Text>
          </View>

          {members.map(mem => {
            const bal = balances[mem.id] ?? 0;
            const isPos = bal >= 0;
            return (
              <View key={mem.id} style={styles.balanceCard}>
                <Avatar name={mem.name} color={mem.color} size={40} />
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceName}>{mem.name}</Text>
                  <Text style={[styles.balanceStatus, { color: isPos ? '#1dbf73' : '#ef4444' }]}>
                    {isPos ? `gets back ${fmtAmount(bal)}` : `owes ${fmtAmount(bal)}`}
                  </Text>
                </View>
                <View style={[styles.balancePill, { backgroundColor: isPos ? '#dcfce7' : '#fee2e2' }]}>
                  <Text style={[styles.balancePillText, { color: isPos ? '#16a34a' : '#dc2626' }]}>
                    {isPos ? '+' : '-'}{fmtAmount(bal)}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Settle up suggestions */}
          <Text style={styles.settleTitle}>SETTLE UP</Text>
          {Object.entries(balances)
            .filter(([, b]) => b < -0.01)
            .map(([id, bal]) => {
              const debtor  = members.find(m => m.id === id);
              const creditor = members.find(m => (balances[m.id] ?? 0) > 0.01);
              if (!debtor || !creditor) return null;
              return (
                <View key={id} style={styles.settleCard}>
                  <Avatar name={debtor.name} color={debtor.color} size={34} />
                  <View style={styles.settleArrow}>
                    <Text style={styles.settleAmount}>{fmtAmount(Math.abs(bal))}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#9ca3af" />
                  </View>
                  <Avatar name={creditor.name} color={creditor.color} size={34} />
                  <TouchableOpacity style={styles.settleBtn}>
                    <Text style={styles.settleBtnText}>Settle</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
        </ScrollView>
      )}

      {tab === 'add' && (
        <ScrollView style={styles.flex} contentContainerStyle={styles.listPad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Description */}
          <View style={styles.addCard}>
            <Text style={styles.addLabel}>DESCRIPTION</Text>
            <TextInput
              style={styles.addInput}
              placeholder="e.g. Dinner, Hotel, Fuel..."
              placeholderTextColor="#d1d5db"
              value={desc}
              onChangeText={setDesc}
              returnKeyType="next"
            />
          </View>

          {/* Amount */}
          <View style={styles.addCard}>
            <Text style={styles.addLabel}>AMOUNT</Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                style={styles.addAmountInput}
                placeholder="0.00"
                placeholderTextColor="#d1d5db"
                value={amount}
                onChangeText={t => { if (/^\d*\.?\d*$/.test(t)) setAmount(t); }}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.addCard}>
            <Text style={styles.addLabel}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setCategory(cat.key)}
                  style={[styles.catBtn, category === cat.key && styles.catBtnActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons name={cat.icon} size={18} color={category === cat.key ? '#1dbf73' : '#9ca3af'} />
                  <Text style={[styles.catLabel, category === cat.key && { color: '#1dbf73' }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Paid by */}
          <View style={styles.addCard}>
            <Text style={styles.addLabel}>PAID BY</Text>
            <TouchableOpacity style={styles.paidByBtn} onPress={() => setShowPaidModal(true)} activeOpacity={0.8}>
              {paidByMember && <Avatar name={paidByMember.name} color={paidByMember.color} size={32} />}
              <Text style={styles.paidByName}>{paidByMember?.name ?? 'Select'}</Text>
              <Ionicons name="chevron-down" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Split between */}
          <View style={styles.addCard}>
            <View style={styles.splitHeader}>
              <Text style={styles.addLabel}>SPLIT BETWEEN</Text>
              <TouchableOpacity onPress={() => setShowAddMember(true)} style={styles.addMemberBtn}>
                <Ionicons name="person-add-outline" size={14} color="#1dbf73" />
                <Text style={styles.addMemberText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Split mode tabs */}
            <View style={styles.splitModeTabs}>
              {(['equal', 'percentage', 'exact'] as SplitMode[]).map(mode => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setSplitMode(mode)}
                  style={[styles.splitModeBtn, splitMode === mode && styles.splitModeBtnActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.splitModeText, splitMode === mode && styles.splitModeTextActive]}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {members.map(mem => (
              <View key={mem.id} style={styles.memberRow}>
                <Avatar name={mem.name} color={mem.color} size={36} />
                <Text style={styles.memberName}>{mem.name}</Text>
                <View style={styles.memberShareBox}>
                  {splitMode === 'equal' ? (
                    <Text style={styles.memberShareText}>{fmtAmount(equalShare)}</Text>
                  ) : (
                    <TextInput
                      style={styles.memberShareInput}
                      placeholder={splitMode === 'percentage' ? '0%' : '₹0'}
                      placeholderTextColor="#d1d5db"
                      keyboardType="decimal-pad"
                    />
                  )}
                </View>
                <TouchableOpacity onPress={() => removeMember(mem.id)} style={styles.removeMemberBtn}>
                  <Ionicons name="close-circle" size={18} color="#d1d5db" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Save */}
          <TouchableOpacity style={styles.saveBtn} onPress={saveExpense} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save Expense</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── FAB ── */}
      {tab !== 'add' && (
        <TouchableOpacity style={styles.fab} onPress={() => setTab('add')} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* ── Paid By Modal ── */}
      <Modal visible={showPaidModal} transparent animationType="slide" onRequestClose={() => setShowPaidModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowPaidModal(false)} activeOpacity={1}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Who paid?</Text>
            {members.map(mem => (
              <TouchableOpacity
                key={mem.id}
                onPress={() => { setPaidBy(mem.id); setShowPaidModal(false); }}
                style={[styles.modalItem, paidBy === mem.id && styles.modalItemActive]}
                activeOpacity={0.8}
              >
                <Avatar name={mem.name} color={mem.color} size={36} />
                <Text style={styles.modalItemName}>{mem.name}</Text>
                {paidBy === mem.id && <Ionicons name="checkmark-circle" size={20} color="#1dbf73" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Add Member Modal ── */}
      <Modal visible={showAddMember} transparent animationType="slide" onRequestClose={() => setShowAddMember(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowAddMember(false)} activeOpacity={1}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Member</Text>
            <TextInput
              style={styles.memberInput}
              placeholder="Enter name..."
              placeholderTextColor="#d1d5db"
              value={newMemberName}
              onChangeText={setNewMemberName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={addMember}
            />
            <TouchableOpacity style={styles.addMemberConfirmBtn} onPress={addMember} activeOpacity={0.85}>
              <Text style={styles.addMemberConfirmText}>Add Member</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#ffffff' },
  flex:   { flex: 1 },
  listPad: { paddingHorizontal: 16, paddingBottom: 100 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  groupName: { fontSize: 20, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  groupSub:  { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  tabItem: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: '#1dbf73' },
  tabLabel: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  tabLabelActive: { color: '#1dbf73' },

  // Expense card
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    gap: 12,
  },
  expCatIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
    alignItems: 'center', justifyContent: 'center',
  },
  expInfo: { flex: 1 },
  expDesc: { fontSize: 15, fontWeight: '600', color: '#111827' },
  expMeta: { fontSize: 12, color: '#9ca3af', marginTop: 3 },
  expAmountCol: { alignItems: 'flex-end' },
  expTotal: { fontSize: 15, fontWeight: '700', color: '#111827' },
  expShare: { fontSize: 11, color: '#ef4444', marginTop: 2 },

  // Avatar
  avatar: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', letterSpacing: 0.3 },

  // Balance
  balanceSummary: {
    backgroundColor: '#f9fafb', borderRadius: 14, padding: 16,
    marginTop: 12, marginBottom: 4,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  balanceSummaryTitle: { fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 1.5 },
  balanceSummaryTotal: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 4 },

  balanceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ffffff', borderRadius: 14, padding: 14,
    marginTop: 8, borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  balanceInfo: { flex: 1 },
  balanceName:   { fontSize: 15, fontWeight: '600', color: '#111827' },
  balanceStatus: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  balancePill: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  balancePillText: { fontSize: 13, fontWeight: '700' },

  settleTitle: {
    fontSize: 10, fontWeight: '700', color: '#9ca3af',
    letterSpacing: 1.5, marginTop: 20, marginBottom: 8,
  },
  settleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#ffffff', borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6',
  },
  settleArrow: { flex: 1, alignItems: 'center' },
  settleAmount: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 2 },
  settleBtn: {
    backgroundColor: '#1dbf73', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  settleBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  // Add expense
  addCard: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 16,
    marginTop: 10, borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1, gap: 10,
  },
  addLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 1.5 },
  addInput: {
    fontSize: 16, color: '#111827', fontWeight: '500',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    paddingBottom: 8, paddingTop: 2,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rupee: { fontSize: 28, fontWeight: '700', color: '#1dbf73' },
  addAmountInput: {
    flex: 1, fontSize: 32, fontWeight: '800',
    color: '#111827', letterSpacing: -1, paddingVertical: 0,
  },

  // Category
  catRow: { gap: 8, paddingBottom: 2 },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6',
  },
  catBtnActive: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  catLabel: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },

  // Paid by
  paidByBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f9fafb', borderRadius: 12,
    borderWidth: 1, borderColor: '#f3f4f6', padding: 12,
  },
  paidByName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },

  // Split
  splitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addMemberBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  addMemberText: { fontSize: 12, fontWeight: '700', color: '#1dbf73' },

  splitModeTabs: { flexDirection: 'row', gap: 6 },
  splitModeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center',
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6',
  },
  splitModeBtnActive: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  splitModeText: { fontSize: 12, fontWeight: '700', color: '#9ca3af' },
  splitModeTextActive: { color: '#1dbf73' },

  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f9fafb',
  },
  memberName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  memberShareBox: {
    backgroundColor: '#f9fafb', borderRadius: 8, borderWidth: 1,
    borderColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 6, minWidth: 80, alignItems: 'center',
  },
  memberShareText: { fontSize: 14, fontWeight: '700', color: '#1dbf73' },
  memberShareInput: { fontSize: 14, fontWeight: '700', color: '#111827', minWidth: 60, textAlign: 'center' },
  removeMemberBtn: { padding: 2 },

  // Save
  saveBtn: {
    backgroundColor: '#1dbf73', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 14,
    shadowColor: '#1dbf73', shadowOpacity: 0.35, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  // FAB
  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: '#1dbf73', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1dbf73', shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 }, elevation: 20,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb',
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 14 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12,
    borderWidth: 1, borderColor: 'transparent', marginBottom: 4,
  },
  modalItemActive: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  modalItemName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },

  // Add member
  memberInput: {
    backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1,
    borderColor: '#f3f4f6', paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 16, color: '#111827', marginBottom: 12,
  },
  addMemberConfirmBtn: {
    backgroundColor: '#1dbf73', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center',
  },
  addMemberConfirmText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#d1d5db', marginTop: 8 },
  emptySub:   { fontSize: 13, color: '#e5e7eb' },
});