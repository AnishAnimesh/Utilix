import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  Modal,
  Switch,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'low' | 'medium' | 'high';
type RepeatMode = 'none' | 'daily' | 'weekly' | 'monthly';

interface Reminder {
  id: string;
  title: string;
  note: string;
  time: string;         // "HH:MM"
  date: string;         // "YYYY-MM-DD"
  priority: Priority;
  repeat: RepeatMode;
  done: boolean;
  category: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITIES: { key: Priority; label: string; color: string }[] = [
  { key: 'low',    label: 'Low',    color: '#22c55e' },
  { key: 'medium', label: 'Medium', color: '#f59e0b' },
  { key: 'high',   label: 'High',   color: '#ef4444' },
];

const REPEATS: { key: RepeatMode; label: string }[] = [
  { key: 'none',    label: 'No repeat' },
  { key: 'daily',   label: 'Daily' },
  { key: 'weekly',  label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

const CATEGORIES = [
  { key: 'personal', label: 'Personal', icon: 'person-outline'    as const, color: '#3b82f6' },
  { key: 'work',     label: 'Work',     icon: 'briefcase-outline'  as const, color: '#8b5cf6' },
  { key: 'health',   label: 'Health',   icon: 'heart-outline'      as const, color: '#ef4444' },
  { key: 'finance',  label: 'Finance',  icon: 'wallet-outline'     as const, color: '#f59e0b' },
  { key: 'other',    label: 'Other',    icon: 'apps-outline'       as const, color: '#64748b' },
];

const HOURS   = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(d: string) {
  const today = todayStr();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  if (d === today) return 'Today';
  if (d === tomorrowStr) return 'Tomorrow';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function getCategoryMeta(key: string) {
  return CATEGORIES.find(c => c.key === key) ?? CATEGORIES[4];
}

function getPriorityMeta(key: Priority) {
  return PRIORITIES.find(p => p.key === key)!;
}

// ─── Reminder Card ────────────────────────────────────────────────────────────

function ReminderCard({
  item,
  onToggle,
  onDelete,
}: {
  item: Reminder;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const cat  = getCategoryMeta(item.category);
  const pri  = getPriorityMeta(item.priority);
  const rep  = REPEATS.find(r => r.key === item.repeat)!;

  return (
    <View style={[
      s.reminderCard,
      item.done && { opacity: 0.55 },
      { borderLeftColor: pri.color, borderLeftWidth: 3 },
    ]}>
      {/* Top row */}
      <View style={s.cardTop}>
        <TouchableOpacity onPress={onToggle} style={s.checkBtn} activeOpacity={0.8}>
          <View style={[
            s.checkbox,
            item.done && { backgroundColor: '#22c55e', borderColor: '#22c55e' },
          ]}>
            {item.done && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
        </TouchableOpacity>

        <View style={s.cardBody}>
          <Text style={[s.cardTitle, item.done && s.cardTitleDone]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.note ? (
            <Text style={s.cardNote} numberOfLines={1}>{item.note}</Text>
          ) : null}
        </View>

        <TouchableOpacity onPress={onDelete} style={s.deleteBtn} activeOpacity={0.75}>
          <Ionicons name="trash-outline" size={16} color="#ef444488" />
        </TouchableOpacity>
      </View>

      {/* Meta chips */}
      <View style={s.cardMeta}>
        <View style={[s.metaChip, { backgroundColor: cat.color + '15', borderColor: cat.color + '40' }]}>
          <Ionicons name={cat.icon} size={11} color={cat.color} />
          <Text style={[s.metaText, { color: cat.color }]}>{cat.label}</Text>
        </View>

        <View style={[s.metaChip, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}>
          <Ionicons name="time-outline" size={11} color="#64748b" />
          <Text style={[s.metaText, { color: '#64748b' }]}>{formatTime(item.time)}</Text>
        </View>

        <View style={[s.metaChip, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}>
          <Ionicons name="calendar-outline" size={11} color="#64748b" />
          <Text style={[s.metaText, { color: '#64748b' }]}>{formatDate(item.date)}</Text>
        </View>

        {item.repeat !== 'none' && (
          <View style={[s.metaChip, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <Ionicons name="repeat-outline" size={11} color="#3b82f6" />
            <Text style={[s.metaText, { color: '#3b82f6' }]}>{rep.label}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Add Reminder Modal ───────────────────────────────────────────────────────

function AddModal({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (r: Reminder) => void;
}) {
  const [title,    setTitle]    = useState('');
  const [note,     setNote]     = useState('');
  const [hour,     setHour]     = useState('08');
  const [minute,   setMinute]   = useState('00');
  const [date,     setDate]     = useState(todayStr());
  const [priority, setPriority] = useState<Priority>('medium');
  const [repeat,   setRepeat]   = useState<RepeatMode>('none');
  const [category, setCategory] = useState('personal');

  const handleAdd = () => {
    if (!title.trim()) { Alert.alert('Title required'); return; }
    onAdd({
      id: Date.now().toString(),
      title: title.trim(),
      note: note.trim(),
      time: `${hour}:${minute}`,
      date,
      priority,
      repeat,
      done: false,
      category,
    });
    setTitle(''); setNote(''); setHour('08'); setMinute('00');
    setDate(todayStr()); setPriority('medium'); setRepeat('none'); setCategory('personal');
    onClose();
  };

  // quick date presets
  const today = todayStr();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>New Reminder</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Title */}
            <Text style={s.fieldLabel}>TITLE</Text>
            <TextInput
              style={s.fieldInput}
              placeholder="What to remember?"
              placeholderTextColor="#cbd5e1"
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="next"
            />

            {/* Note */}
            <Text style={s.fieldLabel}>NOTE (OPTIONAL)</Text>
            <TextInput
              style={[s.fieldInput, { height: 72, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="Add details..."
              placeholderTextColor="#cbd5e1"
              value={note}
              onChangeText={setNote}
              multiline
            />

            {/* Category */}
            <Text style={s.fieldLabel}>CATEGORY</Text>
            <View style={s.chipRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setCategory(cat.key)}
                  style={[
                    s.catChip,
                    category === cat.key && { backgroundColor: cat.color + '18', borderColor: cat.color },
                  ]}
                  activeOpacity={0.75}
                >
                  <Ionicons name={cat.icon} size={14} color={category === cat.key ? cat.color : '#94a3b8'} />
                  <Text style={[s.catChipText, category === cat.key && { color: cat.color }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Priority */}
            <Text style={s.fieldLabel}>PRIORITY</Text>
            <View style={s.chipRow}>
              {PRIORITIES.map(p => (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => setPriority(p.key)}
                  style={[
                    s.priChip,
                    priority === p.key && { backgroundColor: p.color + '18', borderColor: p.color },
                  ]}
                  activeOpacity={0.75}
                >
                  <View style={[s.priDot, { backgroundColor: p.color }]} />
                  <Text style={[s.priChipText, priority === p.key && { color: p.color }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date presets */}
            <Text style={s.fieldLabel}>DATE</Text>
            <View style={[s.chipRow, { marginBottom: 8 }]}>
              {[{ label: 'Today', val: today }, { label: 'Tomorrow', val: tomorrowStr }].map(d => (
                <TouchableOpacity
                  key={d.val}
                  onPress={() => setDate(d.val)}
                  style={[s.dateChip, date === d.val && { backgroundColor: '#eff6ff', borderColor: '#3b82f6' }]}
                  activeOpacity={0.75}
                >
                  <Text style={[s.dateChipText, date === d.val && { color: '#3b82f6' }]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
              <View style={s.dateInput}>
                <TextInput
                  style={s.dateInputField}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {/* Time */}
            <Text style={s.fieldLabel}>TIME</Text>
            <View style={s.timeRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.timeScroll}>
                {HOURS.map(h => (
                  <TouchableOpacity key={h} onPress={() => setHour(h)}
                    style={[s.timeChip, hour === h && { backgroundColor: '#eff6ff', borderColor: '#3b82f6' }]}
                    activeOpacity={0.75}>
                    <Text style={[s.timeChipText, hour === h && { color: '#3b82f6', fontWeight: '700' }]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={s.timeSep}>:</Text>
              <View style={s.minuteRow}>
                {MINUTES.map(m => (
                  <TouchableOpacity key={m} onPress={() => setMinute(m)}
                    style={[s.timeChip, minute === m && { backgroundColor: '#eff6ff', borderColor: '#3b82f6' }]}
                    activeOpacity={0.75}>
                    <Text style={[s.timeChipText, minute === m && { color: '#3b82f6', fontWeight: '700' }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Repeat */}
            <Text style={s.fieldLabel}>REPEAT</Text>
            <View style={s.chipRow}>
              {REPEATS.map(r => (
                <TouchableOpacity key={r.key} onPress={() => setRepeat(r.key)}
                  style={[s.repeatChip, repeat === r.key && { backgroundColor: '#eff6ff', borderColor: '#3b82f6' }]}
                  activeOpacity={0.75}>
                  <Text style={[s.repeatChipText, repeat === r.key && { color: '#3b82f6' }]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Save */}
            <TouchableOpacity style={s.saveBtn} onPress={handleAdd} activeOpacity={0.85}>
              <Ionicons name="alarm-outline" size={18} color="#fff" />
              <Text style={s.saveBtnText}>Set Reminder</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.75}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ReminderScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showModal, setShowModal] = useState(false);

  // ── Persistence ────────────────────────────────────────────────────
  const STORAGE_KEY = 'utilix_reminders';

  // Load on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setReminders(JSON.parse(raw));
      } catch (e) {
        console.log('Failed to load reminders', e);
      }
    })();
  }, []);

  // Save whenever reminders change
  const saveReminders = useCallback(async (data: Reminder[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.log('Failed to save reminders', e);
    }
  }, []);
  const [showDone, setShowDone]   = useState(true);
  const [filter, setFilter]       = useState<string>('all');

  const toggle = (id: string) => {
    setReminders(r => {
      const updated = r.map(rem => rem.id === id ? { ...rem, done: !rem.done } : rem);
      saveReminders(updated);
      return updated;
    });
  };
  const remove = (id: string) => {
    Alert.alert('Delete', 'Remove this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setReminders(r => {
          const updated = r.filter(rem => rem.id !== id);
          saveReminders(updated);
          return updated;
        });
      }},
    ]);
  };

  const addReminder = (r: Reminder) => {
    setReminders(prev => {
      const updated = [r, ...prev];
      saveReminders(updated);
      return updated;
    });
  };

  const filtered = reminders.filter(r => {
    if (!showDone && r.done) return false;
    if (filter !== 'all' && r.category !== filter) return false;
    return true;
  });

  const pending = reminders.filter(r => !r.done).length;
  const done    = reminders.filter(r => r.done).length;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.heading}>Reminders</Text>
          <Text style={s.headingSub}>{pending} pending · {done} done</Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)} style={s.addBtn} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Summary cards ── */}
      <View style={s.summaryRow}>
        <View style={[s.summaryCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
          <Ionicons name="alarm-outline" size={20} color="#3b82f6" />
          <Text style={[s.summaryNum, { color: '#3b82f6' }]}>{pending}</Text>
          <Text style={s.summaryLabel}>Pending</Text>
        </View>
        <View style={[s.summaryCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#22c55e" />
          <Text style={[s.summaryNum, { color: '#22c55e' }]}>{done}</Text>
          <Text style={s.summaryLabel}>Done</Text>
        </View>
        <View style={[s.summaryCard, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
          <Ionicons name="list-outline" size={20} color="#f59e0b" />
          <Text style={[s.summaryNum, { color: '#f59e0b' }]}>{reminders.length}</Text>
          <Text style={s.summaryLabel}>Total</Text>
        </View>
      </View>

      {/* ── Filter row ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={[s.filterChip, filter === 'all' && { backgroundColor: '#0f172a', borderColor: '#0f172a' }]}
          activeOpacity={0.75}
        >
          <Text style={[s.filterChipText, filter === 'all' && { color: '#fff' }]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            onPress={() => setFilter(cat.key)}
            style={[s.filterChip, filter === cat.key && { backgroundColor: cat.color + '18', borderColor: cat.color }]}
            activeOpacity={0.75}
          >
            <Ionicons name={cat.icon} size={12} color={filter === cat.key ? cat.color : '#94a3b8'} />
            <Text style={[s.filterChipText, filter === cat.key && { color: cat.color }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Show done toggle ── */}
      <View style={s.toggleRow}>
        <Text style={s.toggleLabel}>Show completed</Text>
        <Switch
          value={showDone}
          onValueChange={setShowDone}
          trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
          thumbColor={showDone ? '#3b82f6' : '#f1f5f9'}
        />
      </View>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="alarm-outline" size={48} color="#e2e8f0" />
            <Text style={s.emptyTitle}>No reminders</Text>
            <Text style={s.emptySub}>Tap + to add your first reminder</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ReminderCard item={item} onToggle={() => toggle(item.id)} onDelete={() => remove(item.id)} />
        )}
      />

      {/* ── FAB (alternative to header button) ── */}
      <TouchableOpacity style={s.fab} onPress={() => setShowModal(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Modal ── */}
      <AddModal visible={showModal} onClose={() => setShowModal(false)} onAdd={addReminder} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 12,
  },
  heading:    { fontSize: 26, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  headingSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 13, backgroundColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },

  // Summary
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 },
  summaryNum:  { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  summaryLabel:{ fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  // Filter
  filterScroll: { flexGrow: 0, marginBottom: 8 },
  filterRow:    { paddingHorizontal: 16, gap: 7, alignItems: 'center' },
  filterChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },

  // Toggle
  toggleRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, marginBottom: 4 },
  toggleLabel:{ fontSize: 13, fontWeight: '600', color: '#64748b' },

  // List
  list: { paddingHorizontal: 16, paddingBottom: 100 },

  // Reminder card
  reminderCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
    gap: 10,
  },
  cardTop:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkBtn:      { padding: 2 },
  checkbox:      { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  cardBody:      { flex: 1 },
  cardTitle:     { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardTitleDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  cardNote:      { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  deleteBtn:     { padding: 4 },

  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, borderWidth: 1 },
  metaText: { fontSize: 10, fontWeight: '600' },

  // Empty state
  empty:      { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#cbd5e1', marginTop: 8 },
  emptySub:   { fontSize: 13, color: '#e2e8f0' },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 18, backgroundColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3b82f6', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },

  // ── Modal ──
  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '92%',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 }, elevation: 20,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', alignSelf: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 16 },

  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.8, marginBottom: 8, marginTop: 14 },
  fieldInput: {
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827', marginBottom: 2,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 2 },

  catChip:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  catChipText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },

  priChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', flex: 1, justifyContent: 'center' },
  priDot:      { width: 7, height: 7, borderRadius: 4 },
  priChipText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },

  dateChip:     { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  dateChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  dateInput:    { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 10, justifyContent: 'center' },
  dateInputField: { fontSize: 13, color: '#0f172a', fontWeight: '600', paddingVertical: 8 },

  timeRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  timeScroll: { gap: 6, paddingVertical: 2 },
  timeSep:    { fontSize: 20, fontWeight: '700', color: '#94a3b8' },
  minuteRow:  { flexDirection: 'row', gap: 6 },
  timeChip:   { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', minWidth: 38, alignItems: 'center' },
  timeChipText: { fontSize: 13, color: '#64748b', fontWeight: '500' },

  repeatChip:     { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  repeatChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },

  saveBtn:     { backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn:   { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  cancelText:  { color: '#94a3b8', fontWeight: '600', fontSize: 14 },
});