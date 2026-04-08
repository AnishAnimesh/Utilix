import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  name: string;
  color: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;       // member id
  splitAmong: string[]; // member ids
  category: string;
  date: string;
  note: string;
}

interface Settlement {
  id: string;
  from: string; // member id
  to: string;   // member id
  amount: number;
  date: string;
}

type Tab = 'expenses' | 'balances' | 'members';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEMBER_COLORS = [
  '#1dbf73', '#ff652f', '#3b82f6', '#a855f7',
  '#f59e0b', '#ec4899', '#06b6d4', '#84cc16',
];

const CATEGORIES = [
  { key: 'food',      label: 'Food',      icon: 'restaurant-outline'        as const },
  { key: 'transport', label: 'Transport', icon: 'car-outline'               as const },
  { key: 'home',      label: 'Home',      icon: 'home-outline'              as const },
  { key: 'shopping',  label: 'Shopping',  icon: 'bag-outline'               as const },
  { key: 'fun',       label: 'Fun',       icon: 'game-controller-outline'   as const },
  { key: 'travel',    label: 'Travel',    icon: 'airplane-outline'          as const },
  { key: 'other',     label: 'Other',     icon: 'ellipsis-horizontal-outline' as const },
];

const STORAGE_KEY = 'splitbill_data_v2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, color, size = 36 }: { name: string; color: string; size?: number }) {
  return (
    <View style={[st.avatar, {
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color + '22', borderColor: color + '66',
    }]}>
      <Text style={[st.avatarTxt, { color, fontSize: size * 0.33 }]}>{getInitials(name)}</Text>
    </View>
  );
}

// ─── Compute balances ─────────────────────────────────────────────────────────

function computeBalances(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[],
): Record<string, number> {
  const bal: Record<string, number> = {};
  members.forEach(m => { bal[m.id] = 0; });

  expenses.forEach(exp => {
    const share = exp.amount / exp.splitAmong.length;
    exp.splitAmong.forEach(id => { bal[id] = (bal[id] ?? 0) - share; });
    bal[exp.paidBy] = (bal[exp.paidBy] ?? 0) + exp.amount;
  });

  // Apply settlements
  settlements.forEach(s => {
    bal[s.from] = (bal[s.from] ?? 0) + s.amount;
    bal[s.to]   = (bal[s.to]   ?? 0) - s.amount;
  });

  return bal;
}

// Simplify debts → minimal transactions
function simplifyDebts(
  members: Member[],
  balances: Record<string, number>,
): { from: Member; to: Member; amount: number }[] {
  const debtors  = members.filter(m => (balances[m.id] ?? 0) < -0.01)
    .map(m => ({ m, amt: balances[m.id] })).sort((a, b) => a.amt - b.amt);
  const creditors = members.filter(m => (balances[m.id] ?? 0) > 0.01)
    .map(m => ({ m, amt: balances[m.id] })).sort((a, b) => b.amt - a.amt);

  const txns: { from: Member; to: Member; amount: number }[] = [];
  let di = 0, ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const debt   = Math.abs(debtors[di].amt);
    const credit = creditors[ci].amt;
    const pay    = Math.min(debt, credit);
    txns.push({ from: debtors[di].m, to: creditors[ci].m, amount: pay });
    debtors[di].amt  += pay;
    creditors[ci].amt -= pay;
    if (Math.abs(debtors[di].amt)  < 0.01) di++;
    if (Math.abs(creditors[ci].amt) < 0.01) ci++;
  }
  return txns;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SplitBill() {
  const [members,     setMembers]     = useState<Member[]>([
    { id: '1', name: 'You',   color: '#1dbf73' },
    { id: '2', name: 'Alex',  color: '#ff652f' },
    { id: '3', name: 'Priya', color: '#3b82f6' },
  ]);
  const [expenses,    setExpenses]    = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [tab,         setTab]         = useState<Tab>('expenses');

  // Add-expense form
  const [showAddExp,   setShowAddExp]   = useState(false);
  const [desc,         setDesc]         = useState('');
  const [amount,       setAmount]       = useState('');
  const [paidBy,       setPaidBy]       = useState('1');
  const [splitAmong,   setSplitAmong]   = useState<string[]>(['1','2','3']);
  const [category,     setCategory]     = useState('food');
  const [expNote,      setExpNote]      = useState('');
  const [showPaidModal,setShowPaidModal]= useState(false);

  // Add member
  const [showAddMember,setShowAddMember]= useState(false);
  const [newName,      setNewName]      = useState('');

  // Settle modal
  const [showSettle,   setShowSettle]   = useState(false);
  const [settleFrom,   setSettleFrom]   = useState('');
  const [settleTo,     setSettleTo]     = useState('');
  const [settleAmt,    setSettleAmt]    = useState('');

  // ── Persistence ────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.members)     setMembers(data.members);
          if (data.expenses)    setExpenses(data.expenses);
          if (data.settlements) setSettlements(data.settlements);
          if (data.members?.length > 0) {
            setPaidBy(data.members[0].id);
            setSplitAmong(data.members.map((m: Member) => m.id));
          }
        }
      } catch (e) { console.log('Load error', e); }
    })();
  }, []);

  const persist = useCallback(async (
    m: Member[], e: Expense[], s: Settlement[]
  ) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ members: m, expenses: e, settlements: s }));
    } catch (err) { console.log('Save error', err); }
  }, []);

  const updateMembers     = (m: Member[])     => { setMembers(m);     persist(m, expenses, settlements); };
  const updateExpenses    = (e: Expense[])    => { setExpenses(e);    persist(members, e, settlements); };
  const updateSettlements = (s: Settlement[]) => { setSettlements(s); persist(members, expenses, s); };

  // ── Derived ────────────────────────────────────────────────────────

  const balances = computeBalances(members, expenses, settlements);
  const txns     = simplifyDebts(members, balances);
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  // ── Add expense ────────────────────────────────────────────────────

  const saveExpense = () => {
    const amt = parseFloat(amount);
    if (!desc.trim() || isNaN(amt) || amt <= 0) {
      Alert.alert('Please enter a description and valid amount'); return;
    }
    if (splitAmong.length === 0) {
      Alert.alert('Select at least one member to split with'); return;
    }
    const exp: Expense = {
      id: Date.now().toString(),
      description: desc.trim(),
      amount: amt,
      paidBy,
      splitAmong,
      category,
      date: todayLabel(),
      note: expNote.trim(),
    };
    updateExpenses([exp, ...expenses]);
    setDesc(''); setAmount(''); setExpNote(''); setCategory('food');
    setSplitAmong(members.map(m => m.id));
    setPaidBy(members[0]?.id ?? '1');
    setShowAddExp(false);
  };

  const deleteExpense = (id: string) => {
    Alert.alert('Delete Expense', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => updateExpenses(expenses.filter(e => e.id !== id)) },
    ]);
  };

  // ── Add member ─────────────────────────────────────────────────────

  const addMember = () => {
    const name = newName.trim();
    if (!name) return;
    const id    = Date.now().toString();
    const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
    const newM  = { id, name, color };
    const newMs = [...members, newM];
    updateMembers(newMs);
    setSplitAmong(prev => [...prev, id]);
    setNewName(''); setShowAddMember(false);
  };

  const removeMember = (id: string) => {
    if (members.length <= 2) { Alert.alert('Need at least 2 members'); return; }
    const hasExpense = expenses.some(e => e.paidBy === id || e.splitAmong.includes(id));
    if (hasExpense) {
      Alert.alert('Cannot remove', 'This member is part of an existing expense.'); return;
    }
    const newMs = members.filter(m => m.id !== id);
    updateMembers(newMs);
    setSplitAmong(prev => prev.filter(mid => mid !== id));
  };

  // ── Record settlement ──────────────────────────────────────────────

  const recordSettlement = () => {
    const amt = parseFloat(settleAmt);
    if (!settleFrom || !settleTo || isNaN(amt) || amt <= 0) {
      Alert.alert('Fill in all fields'); return;
    }
    if (settleFrom === settleTo) { Alert.alert('From and To must be different'); return; }
    const s: Settlement = {
      id: Date.now().toString(),
      from: settleFrom, to: settleTo, amount: amt, date: todayLabel(),
    };
    updateSettlements([s, ...settlements]);
    setSettleAmt(''); setShowSettle(false);
  };

  const deleteSettlement = (id: string) => {
    Alert.alert('Remove settlement?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => updateSettlements(settlements.filter(s => s.id !== id)) },
    ]);
  };

  const clearAll = () => {
    Alert.alert('Clear Everything', 'This will delete all expenses, members, and settlements. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All', style: 'destructive', onPress: () => {
          const defaultMs = [
            { id: '1', name: 'You',   color: '#1dbf73' },
            { id: '2', name: 'Alex',  color: '#ff652f' },
            { id: '3', name: 'Priya', color: '#3b82f6' },
          ];
          setMembers(defaultMs);
          setExpenses([]);
          setSettlements([]);
          setSplitAmong(defaultMs.map(m => m.id));
          setPaidBy('1');
          persist(defaultMs, [], []);
        },
      },
    ]);
  };

  const toggleSplitMember = (id: string) => {
    setSplitAmong(prev =>
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const paidByMember = members.find(m => m.id === paidBy);

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── Top Header ── */}
      <View style={st.topBar}>
        <View>
          <Text style={st.groupName}>Split Bill</Text>
          <Text style={st.groupSub}>
            {members.length} members · {fmt(totalSpent)} total
          </Text>
        </View>
        <View style={st.topActions}>
          <TouchableOpacity onPress={() => setShowAddMember(true)} style={st.topBtn}>
            <Ionicons name="person-add-outline" size={18} color="#1dbf73" />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAll} style={st.topBtn}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tab Bar ── */}
      <View style={st.tabBar}>
        {(['expenses', 'balances', 'members'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t} onPress={() => setTab(t)}
            style={[st.tabItem, tab === t && st.tabItemActive]}
            activeOpacity={0.8}
          >
            <Text style={[st.tabLabel, tab === t && st.tabLabelActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ══════════ EXPENSES TAB ══════════ */}
      {tab === 'expenses' && (
        <FlatList
          data={expenses}
          keyExtractor={e => e.id}
          contentContainerStyle={st.listPad}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={st.empty}>
              <Ionicons name="receipt-outline" size={52} color="#e5e7eb" />
              <Text style={st.emptyTitle}>No expenses yet</Text>
              <Text style={st.emptySub}>Tap + to add your first expense</Text>
            </View>
          }
          renderItem={({ item: exp }) => {
            const cat    = CATEGORIES.find(c => c.key === exp.category);
            const payer  = members.find(m => m.id === exp.paidBy);
            const myId   = members[0]?.id;
            const myShare = exp.splitAmong.includes(myId ?? '')
              ? exp.amount / exp.splitAmong.length : 0;
            return (
              <View style={st.expenseCard}>
                <View style={st.expCatIcon}>
                  <Ionicons name={cat?.icon ?? 'ellipsis-horizontal-outline'} size={18} color="#1dbf73" />
                </View>
                <View style={st.expInfo}>
                  <Text style={st.expDesc} numberOfLines={1}>{exp.description}</Text>
                  <Text style={st.expMeta}>
                    <Text style={{ color: payer?.color ?? '#1dbf73', fontWeight: '700' }}>{payer?.name ?? '?'}</Text>
                    {' paid · '}{exp.date}
                  </Text>
                  {exp.note ? <Text style={st.expNote} numberOfLines={1}>{exp.note}</Text> : null}
                  <Text style={st.expSplitInfo}>
                    Split {exp.splitAmong.length} ways
                  </Text>
                </View>
                <View style={st.expRight}>
                  <Text style={st.expTotal}>{fmt(exp.amount)}</Text>
                  {myShare > 0 && (
                    <Text style={st.expShare}>you owe {fmt(myShare)}</Text>
                  )}
                  <TouchableOpacity onPress={() => deleteExpense(exp.id)} style={st.delBtn}>
                    <Ionicons name="trash-outline" size={14} color="#ef444488" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ══════════ BALANCES TAB ══════════ */}
      {tab === 'balances' && (
        <ScrollView style={st.flex} contentContainerStyle={st.listPad} showsVerticalScrollIndicator={false}>

          {/* Summary */}
          <View style={st.summaryCard}>
            <View style={st.summaryItem}>
              <Text style={st.summaryVal}>{fmt(totalSpent)}</Text>
              <Text style={st.summaryLbl}>Total Spent</Text>
            </View>
            <View style={st.summaryDiv} />
            <View style={st.summaryItem}>
              <Text style={st.summaryVal}>{expenses.length}</Text>
              <Text style={st.summaryLbl}>Expenses</Text>
            </View>
            <View style={st.summaryDiv} />
            <View style={st.summaryItem}>
              <Text style={st.summaryVal}>{settlements.length}</Text>
              <Text style={st.summaryLbl}>Settled</Text>
            </View>
          </View>

          {/* Per-member balance */}
          <Text style={st.sectionTitle}>BALANCES</Text>
          {members.map(mem => {
            const bal   = balances[mem.id] ?? 0;
            const isPos = bal >= 0.01;
            const isNeg = bal <= -0.01;
            return (
              <View key={mem.id} style={st.balCard}>
                <Avatar name={mem.name} color={mem.color} size={40} />
                <View style={st.balInfo}>
                  <Text style={st.balName}>{mem.name}</Text>
                  <Text style={[st.balStatus, { color: isPos ? '#1dbf73' : isNeg ? '#ef4444' : '#94a3b8' }]}>
                    {isPos ? `gets back ${fmt(bal)}` : isNeg ? `owes ${fmt(bal)}` : 'settled up'}
                  </Text>
                </View>
                <View style={[st.balPill, {
                  backgroundColor: isPos ? '#dcfce7' : isNeg ? '#fee2e2' : '#f3f4f6',
                }]}>
                  <Text style={[st.balPillTxt, {
                    color: isPos ? '#16a34a' : isNeg ? '#dc2626' : '#9ca3af',
                  }]}>
                    {isPos ? '+' : ''}{fmt(bal)}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Suggested settlements */}
          {txns.length > 0 && (
            <>
              <Text style={[st.sectionTitle, { marginTop: 20 }]}>SETTLE UP</Text>
              {txns.map((t, i) => (
                <View key={i} style={st.settleCard}>
                  <Avatar name={t.from.name} color={t.from.color} size={34} />
                  <View style={st.settleArrow}>
                    <Text style={st.settleAmt}>{fmt(t.amount)}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#9ca3af" />
                  </View>
                  <Avatar name={t.to.name} color={t.to.color} size={34} />
                  <TouchableOpacity
                    style={st.settleBtn}
                    onPress={() => {
                      setSettleFrom(t.from.id);
                      setSettleTo(t.to.id);
                      setSettleAmt(t.amount.toFixed(2));
                      setShowSettle(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={st.settleBtnTxt}>Record</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {txns.length === 0 && expenses.length > 0 && (
            <View style={st.allSettled}>
              <Ionicons name="checkmark-circle-outline" size={28} color="#1dbf73" />
              <Text style={st.allSettledTxt}>All settled up!</Text>
            </View>
          )}

          {/* Settlement history */}
          {settlements.length > 0 && (
            <>
              <Text style={[st.sectionTitle, { marginTop: 20 }]}>SETTLEMENT HISTORY</Text>
              {settlements.map(s => {
                const from = members.find(m => m.id === s.from);
                const to   = members.find(m => m.id === s.to);
                return (
                  <View key={s.id} style={st.histCard}>
                    <Ionicons name="checkmark-circle" size={18} color="#1dbf73" />
                    <View style={st.histInfo}>
                      <Text style={st.histTxt}>
                        <Text style={{ fontWeight: '700', color: from?.color }}>{from?.name}</Text>
                        {' paid '}
                        <Text style={{ fontWeight: '700', color: to?.color }}>{to?.name}</Text>
                        {' · '}{fmt(s.amount)}
                      </Text>
                      <Text style={st.histDate}>{s.date}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteSettlement(s.id)}>
                      <Ionicons name="close-circle-outline" size={18} color="#d1d5db" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </>
          )}

          {/* Manual settle button */}
          <TouchableOpacity style={st.manualSettleBtn} onPress={() => { setSettleFrom(''); setSettleTo(''); setSettleAmt(''); setShowSettle(true); }} activeOpacity={0.85}>
            <Ionicons name="swap-horizontal-outline" size={16} color="#1dbf73" />
            <Text style={st.manualSettleTxt}>Record Manual Payment</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ══════════ MEMBERS TAB ══════════ */}
      {tab === 'members' && (
        <ScrollView style={st.flex} contentContainerStyle={st.listPad} showsVerticalScrollIndicator={false}>
          <Text style={st.sectionTitle}>GROUP MEMBERS</Text>
          {members.map((mem, i) => {
            const bal    = balances[mem.id] ?? 0;
            const isPos  = bal >= 0.01;
            const isNeg  = bal <= -0.01;
            const memExp = expenses.filter(e => e.paidBy === mem.id).length;
            return (
              <View key={mem.id} style={st.memberCard}>
                <Avatar name={mem.name} color={mem.color} size={44} />
                <View style={st.memberInfo}>
                  <Text style={st.memberName}>{mem.name}{i === 0 ? ' (You)' : ''}</Text>
                  <Text style={st.memberMeta}>{memExp} expense{memExp !== 1 ? 's' : ''} paid</Text>
                </View>
                <View style={[st.balPill, {
                  backgroundColor: isPos ? '#dcfce7' : isNeg ? '#fee2e2' : '#f3f4f6',
                }]}>
                  <Text style={[st.balPillTxt, {
                    color: isPos ? '#16a34a' : isNeg ? '#dc2626' : '#9ca3af',
                    fontSize: 12,
                  }]}>
                    {isPos ? '+' : ''}{fmt(bal)}
                  </Text>
                </View>
                {i > 0 && (
                  <TouchableOpacity onPress={() => removeMember(mem.id)} style={st.delBtn}>
                    <Ionicons name="person-remove-outline" size={16} color="#ef444488" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          <TouchableOpacity style={st.addMemberBigBtn} onPress={() => setShowAddMember(true)} activeOpacity={0.85}>
            <Ionicons name="person-add-outline" size={18} color="#1dbf73" />
            <Text style={st.addMemberBigTxt}>Add Member</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── FAB ── */}
      <TouchableOpacity style={st.fab} onPress={() => setShowAddExp(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* ══════════ ADD EXPENSE MODAL ══════════ */}
      <Modal visible={showAddExp} animationType="slide" transparent onRequestClose={() => setShowAddExp(false)}>
        <View style={st.modalOverlay}>
          <View style={[st.modalSheet, { maxHeight: '94%' }]}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>Add Expense</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Description */}
              <Text style={st.fieldLbl}>DESCRIPTION</Text>
              <TextInput style={st.fieldInput} placeholder="e.g. Dinner, Cab, Hotel..."
                placeholderTextColor="#d1d5db" value={desc} onChangeText={setDesc} autoFocus returnKeyType="next" />

              {/* Amount */}
              <Text style={st.fieldLbl}>AMOUNT</Text>
              <View style={st.amtRow}>
                <Text style={st.rupee}>₹</Text>
                <TextInput style={st.amtInput} placeholder="0.00" placeholderTextColor="#d1d5db"
                  value={amount} onChangeText={t => { if (/^\d*\.?\d*$/.test(t)) setAmount(t); }}
                  keyboardType="decimal-pad" returnKeyType="done" />
              </View>

              {/* Note */}
              <Text style={st.fieldLbl}>NOTE (OPTIONAL)</Text>
              <TextInput style={[st.fieldInput, { height: 60, textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder="Add a note..." placeholderTextColor="#d1d5db"
                value={expNote} onChangeText={setExpNote} multiline />

              {/* Category */}
              <Text style={st.fieldLbl}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.catRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.key} onPress={() => setCategory(cat.key)}
                    style={[st.catChip, category === cat.key && st.catChipActive]} activeOpacity={0.8}>
                    <Ionicons name={cat.icon} size={16} color={category === cat.key ? '#1dbf73' : '#9ca3af'} />
                    <Text style={[st.catChipTxt, category === cat.key && { color: '#1dbf73' }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Paid by */}
              <Text style={st.fieldLbl}>PAID BY</Text>
              <TouchableOpacity style={st.paidByBtn} onPress={() => setShowPaidModal(true)} activeOpacity={0.8}>
                {paidByMember && <Avatar name={paidByMember.name} color={paidByMember.color} size={30} />}
                <Text style={st.paidByName}>{paidByMember?.name ?? 'Select'}</Text>
                <Ionicons name="chevron-down" size={16} color="#9ca3af" />
              </TouchableOpacity>

              {/* Split among */}
              <Text style={st.fieldLbl}>SPLIT AMONG (tap to toggle)</Text>
              <View style={st.splitGrid}>
                {members.map(mem => {
                  const selected = splitAmong.includes(mem.id);
                  return (
                    <TouchableOpacity key={mem.id} onPress={() => toggleSplitMember(mem.id)}
                      style={[st.splitChip, selected && { backgroundColor: mem.color + '18', borderColor: mem.color }]}
                      activeOpacity={0.8}>
                      <Avatar name={mem.name} color={mem.color} size={28} />
                      <Text style={[st.splitChipTxt, selected && { color: mem.color }]}>{mem.name}</Text>
                      {selected && <Ionicons name="checkmark-circle" size={14} color={mem.color} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {splitAmong.length > 0 && parseFloat(amount) > 0 && (
                <Text style={st.splitHint}>
                  Each pays {fmt(parseFloat(amount) / splitAmong.length)}
                </Text>
              )}

              <TouchableOpacity style={st.saveBtn} onPress={saveExpense} activeOpacity={0.85}>
                <Text style={st.saveBtnTxt}>Save Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.cancelBtn} onPress={() => setShowAddExp(false)} activeOpacity={0.75}>
                <Text style={st.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════ PAID BY MODAL ══════════ */}
      <Modal visible={showPaidModal} transparent animationType="slide" onRequestClose={() => setShowPaidModal(false)}>
        <TouchableOpacity style={st.modalOverlay} onPress={() => setShowPaidModal(false)} activeOpacity={1}>
          <View style={st.modalSheet}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>Who paid?</Text>
            {members.map(mem => (
              <TouchableOpacity key={mem.id}
                onPress={() => { setPaidBy(mem.id); setShowPaidModal(false); }}
                style={[st.modalItem, paidBy === mem.id && st.modalItemActive]} activeOpacity={0.8}>
                <Avatar name={mem.name} color={mem.color} size={36} />
                <Text style={st.modalItemName}>{mem.name}</Text>
                {paidBy === mem.id && <Ionicons name="checkmark-circle" size={20} color="#1dbf73" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ══════════ ADD MEMBER MODAL ══════════ */}
      <Modal visible={showAddMember} transparent animationType="slide" onRequestClose={() => setShowAddMember(false)}>
        <TouchableOpacity style={st.modalOverlay} onPress={() => setShowAddMember(false)} activeOpacity={1}>
          <View style={st.modalSheet}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>Add Member</Text>
            <TextInput style={st.fieldInput} placeholder="Enter name..."
              placeholderTextColor="#d1d5db" value={newName} onChangeText={setNewName}
              autoFocus returnKeyType="done" onSubmitEditing={addMember} />
            <TouchableOpacity style={[st.saveBtn, { marginTop: 12 }]} onPress={addMember} activeOpacity={0.85}>
              <Text style={st.saveBtnTxt}>Add Member</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ══════════ SETTLE MODAL ══════════ */}
      <Modal visible={showSettle} transparent animationType="slide" onRequestClose={() => setShowSettle(false)}>
        <TouchableOpacity style={st.modalOverlay} onPress={() => setShowSettle(false)} activeOpacity={1}>
          <View style={st.modalSheet}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>Record Payment</Text>

            <Text style={st.fieldLbl}>FROM (who paid)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {members.map(m => (
                <TouchableOpacity key={m.id} onPress={() => setSettleFrom(m.id)}
                  style={[st.splitChip, settleFrom === m.id && { backgroundColor: m.color + '18', borderColor: m.color }]}
                  activeOpacity={0.8}>
                  <Avatar name={m.name} color={m.color} size={26} />
                  <Text style={[st.splitChipTxt, settleFrom === m.id && { color: m.color }]}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[st.fieldLbl, { marginTop: 14 }]}>TO (who receives)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {members.map(m => (
                <TouchableOpacity key={m.id} onPress={() => setSettleTo(m.id)}
                  style={[st.splitChip, settleTo === m.id && { backgroundColor: m.color + '18', borderColor: m.color }]}
                  activeOpacity={0.8}>
                  <Avatar name={m.name} color={m.color} size={26} />
                  <Text style={[st.splitChipTxt, settleTo === m.id && { color: m.color }]}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[st.fieldLbl, { marginTop: 14 }]}>AMOUNT</Text>
            <View style={st.amtRow}>
              <Text style={st.rupee}>₹</Text>
              <TextInput style={st.amtInput} placeholder="0.00" placeholderTextColor="#d1d5db"
                value={settleAmt} onChangeText={setSettleAmt} keyboardType="decimal-pad" />
            </View>

            <TouchableOpacity style={[st.saveBtn, { marginTop: 16 }]} onPress={recordSettlement} activeOpacity={0.85}>
              <Text style={st.saveBtnTxt}>Record Payment</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#ffffff' },
  flex:    { flex: 1 },
  listPad: { paddingHorizontal: 16, paddingBottom: 100 },

  // Top bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 16 : 8, paddingBottom: 12,
  },
  groupName:  { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  groupSub:   { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  topActions: { flexDirection: 'row', gap: 8 },
  topBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#f9fafb',
    borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center',
  },

  // Tab bar
  tabBar:        { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tabItem:       { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: '#1dbf73' },
  tabLabel:      { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  tabLabelActive:{ color: '#1dbf73' },

  // Expense card
  expenseCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#ffffff',
    borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1, gap: 12,
  },
  expCatIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', alignItems: 'center', justifyContent: 'center' },
  expInfo:    { flex: 1 },
  expDesc:    { fontSize: 15, fontWeight: '600', color: '#111827' },
  expMeta:    { fontSize: 12, color: '#9ca3af', marginTop: 3 },
  expNote:    { fontSize: 11, color: '#cbd5e1', marginTop: 2, fontStyle: 'italic' },
  expSplitInfo: { fontSize: 11, color: '#d1d5db', marginTop: 2 },
  expRight:   { alignItems: 'flex-end', gap: 3 },
  expTotal:   { fontSize: 15, fontWeight: '700', color: '#111827' },
  expShare:   { fontSize: 11, color: '#ef4444' },
  delBtn:     { padding: 4, marginTop: 2 },

  // Avatar
  avatar:    { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontWeight: '800', letterSpacing: 0.3 },

  // Summary card
  summaryCard: {
    flexDirection: 'row', backgroundColor: '#f9fafb', borderRadius: 16, padding: 16,
    marginTop: 12, marginBottom: 4, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center',
  },
  summaryItem:  { flex: 1, alignItems: 'center' },
  summaryVal:   { fontSize: 18, fontWeight: '800', color: '#111827' },
  summaryLbl:   { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  summaryDiv:   { width: 1, height: 32, backgroundColor: '#e5e7eb' },

  sectionTitle: { fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 1.5, marginTop: 16, marginBottom: 8 },

  // Balance card
  balCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffffff',
    borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  balInfo:    { flex: 1 },
  balName:    { fontSize: 15, fontWeight: '600', color: '#111827' },
  balStatus:  { fontSize: 12, marginTop: 2, fontWeight: '500' },
  balPill:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  balPillTxt: { fontSize: 13, fontWeight: '700' },

  // Settle
  settleCard:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6' },
  settleArrow:  { flex: 1, alignItems: 'center' },
  settleAmt:    { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 2 },
  settleBtn:    { backgroundColor: '#1dbf73', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  settleBtnTxt: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  allSettled:    { alignItems: 'center', paddingVertical: 20, gap: 6 },
  allSettledTxt: { fontSize: 15, fontWeight: '700', color: '#1dbf73' },

  // Settlement history
  histCard:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  histInfo:  { flex: 1 },
  histTxt:   { fontSize: 13, color: '#374151' },
  histDate:  { fontSize: 11, color: '#86efac', marginTop: 2 },

  manualSettleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f0fdf4', borderRadius: 12, borderWidth: 1, borderColor: '#86efac', paddingVertical: 13, marginTop: 16 },
  manualSettleTxt: { fontSize: 14, fontWeight: '700', color: '#1dbf73' },

  // Members
  memberCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffffff',
    borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  memberMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  addMemberBigBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f0fdf4', borderRadius: 14, borderWidth: 1, borderColor: '#86efac', paddingVertical: 15, marginTop: 8 },
  addMemberBigTxt: { fontSize: 15, fontWeight: '700', color: '#1dbf73' },

  // FAB
  fab: { position: 'absolute', bottom: 28, right: 20, width: 56, height: 56, borderRadius: 18, backgroundColor: '#1dbf73', alignItems: 'center', justifyContent: 'center', shadowColor: '#1dbf73', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 }, elevation: 20 },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 14 },
  modalItem:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', marginBottom: 4 },
  modalItemActive: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  modalItemName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },

  fieldLbl:   { fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 1.5, marginBottom: 8, marginTop: 14 },
  fieldInput: { backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', marginBottom: 2 },

  amtRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  rupee:    { fontSize: 28, fontWeight: '700', color: '#1dbf73' },
  amtInput: { flex: 1, fontSize: 30, fontWeight: '800', color: '#111827', letterSpacing: -1, paddingVertical: 0 },

  catRow:     { gap: 8, paddingBottom: 4 },
  catChip:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6' },
  catChipActive: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  catChipTxt: { fontSize: 12, fontWeight: '600', color: '#9ca3af' },

  paidByBtn:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', padding: 12 },
  paidByName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },

  splitGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  splitChip:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6' },
  splitChipTxt: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  splitHint:    { fontSize: 12, color: '#1dbf73', fontWeight: '600', textAlign: 'center', marginTop: 4, marginBottom: 4 },

  saveBtn:    { backgroundColor: '#1dbf73', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 18, shadowColor: '#1dbf73', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  saveBtnTxt: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  cancelBtn:  { paddingVertical: 14, alignItems: 'center' },
  cancelTxt:  { color: '#9ca3af', fontWeight: '600', fontSize: 14 },

  // Empty
  empty:      { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#d1d5db', marginTop: 8 },
  emptySub:   { fontSize: 13, color: '#e5e7eb' },
});