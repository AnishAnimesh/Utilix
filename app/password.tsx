import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Clipboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedPassword {
  id: string;
  title: string;
  password: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHAR_SETS = {
  lower:   'abcdefghijklmnopqrstuvwxyz',
  upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits:  '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Fortress'];
const STRENGTH_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generatePassword(
  length: number,
  useLower: boolean,
  useUpper: boolean,
  useDigits: boolean,
  useSymbols: boolean,
): string {
  let pool = '';
  if (useLower)   pool += CHAR_SETS.lower;
  if (useUpper)   pool += CHAR_SETS.upper;
  if (useDigits)  pool += CHAR_SETS.digits;
  if (useSymbols) pool += CHAR_SETS.symbols;
  if (!pool) pool = CHAR_SETS.lower;

  let result = '';
  for (let i = 0; i < length; i++) {
    result += pool.charAt(Math.floor(Math.random() * pool.length));
  }
  return result;
}

function getStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 14) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return Math.min(score, 5);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Toggle Chip ──────────────────────────────────────────────────────────────

function ToggleChip({
  label, active, onPress, color,
}: { label: string; active: boolean; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.chip,
        active && { backgroundColor: color + '18', borderColor: color },
      ]}
    >
      {active && <Ionicons name="checkmark" size={11} color={color} style={{ marginRight: 3 }} />}
      <Text style={[styles.chipText, active && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Password Card ────────────────────────────────────────────────────────────

function PasswordCard({
  item, onDelete, onCopy,
}: { item: SavedPassword; onDelete: (id: string) => void; onCopy: (pw: string) => void }) {
  const [revealed, setRevealed] = useState(false);
  const strength = getStrength(item.password);
  const color = STRENGTH_COLORS[strength];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardDot, { backgroundColor: color }]} />
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardPassword} numberOfLines={1}>
          {revealed ? item.password : '•'.repeat(Math.min(item.password.length, 20))}
        </Text>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => setRevealed(r => !r)} style={styles.iconBtn}>
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onCopy(item.password)} style={styles.iconBtn}>
            <Ionicons name="copy-outline" size={18} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={18} color="#ef444488" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Strength bar */}
      <View style={styles.strengthBar}>
        {[1,2,3,4,5].map(i => (
          <View
            key={i}
            style={[
              styles.strengthSegment,
              { backgroundColor: i <= strength ? color : '#e2e8f0' },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PasswordGenerator() {
  const [password, setPassword]     = useState('');
  const [length, setLength]         = useState(16);
  const [useLower, setUseLower]     = useState(true);
  const [useUpper, setUseUpper]     = useState(true);
  const [useDigits, setUseDigits]   = useState(true);
  const [useSymbols, setUseSymbols] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [titleInput, setTitleInput]     = useState('');

  const [vault, setVault] = useState<SavedPassword[]>([]);
  const [tab, setTab] = useState<'gen' | 'vault'>('gen');

  const strength = getStrength(password);
  const strengthColor = STRENGTH_COLORS[strength];
  const strengthLabel = STRENGTH_LABELS[strength];

  const handleGenerate = () => {
    const pw = generatePassword(length, useLower, useUpper, useDigits, useSymbols);
    setPassword(pw);
  };

  const handleCopy = (pw: string) => {
    Clipboard.setString(pw);
    Alert.alert('Copied', 'Password copied to clipboard.');
  };

  const handleSave = () => {
    if (!password) {
      Alert.alert('No password', 'Generate a password first.');
      return;
    }
    setTitleInput('');
    setModalVisible(true);
  };

  const confirmSave = () => {
    const title = titleInput.trim() || 'Untitled';
    const entry: SavedPassword = {
      id: Date.now().toString(),
      title,
      password,
      createdAt: new Date().toISOString(),
    };
    setVault(v => [entry, ...v]);
    setModalVisible(false);
    setTab('vault');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this saved password?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setVault(v => v.filter(p => p.id !== id)) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PassGen</Text>
          <Text style={styles.headerSub}>Secure password manager</Text>
        </View>
        <View style={styles.vaultBadge}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#3b82f6" />
          <Text style={styles.vaultBadgeText}>{vault.length} saved</Text>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'gen' && styles.tabBtnActive]}
          onPress={() => setTab('gen')}
          activeOpacity={0.75}
        >
          <Ionicons name="key-outline" size={14} color={tab === 'gen' ? '#3b82f6' : '#94a3b8'} />
          <Text style={[styles.tabBtnText, tab === 'gen' && { color: '#3b82f6' }]}>Generator</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'vault' && styles.tabBtnActive]}
          onPress={() => setTab('vault')}
          activeOpacity={0.75}
        >
          <Ionicons name="lock-closed-outline" size={14} color={tab === 'vault' ? '#3b82f6' : '#94a3b8'} />
          <Text style={[styles.tabBtnText, tab === 'vault' && { color: '#3b82f6' }]}>Vault</Text>
          {vault.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{vault.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {tab === 'gen' ? (
          <>
            {/* ── Password Display ── */}
            <View style={styles.displayCard}>
              <Text style={styles.displayLabel}>GENERATED PASSWORD</Text>
              <View style={styles.displayRow}>
                <Text
                  style={[styles.displayPassword, { color: password ? '#0f172a' : '#94a3b8' }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {password || 'Tap Generate ↓'}
                </Text>
                {password ? (
                  <TouchableOpacity onPress={() => handleCopy(password)} style={styles.copyBtn}>
                    <Ionicons name="copy-outline" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {password ? (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBarFull}>
                    {[1,2,3,4,5].map(i => (
                      <View
                        key={i}
                        style={[
                          styles.strengthSegmentLg,
                          { backgroundColor: i <= strength ? strengthColor : '#e2e8f0' },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
                </View>
              ) : null}
            </View>

            {/* ── Options ── */}
            <View style={styles.optCard}>
              <Text style={styles.optTitle}>OPTIONS</Text>

              <View style={styles.lengthRow}>
                <Text style={styles.optLabel}>Length</Text>
                <View style={styles.lengthControls}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setLength(l => Math.max(6, l - 1))}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={16} color="#64748b" />
                  </TouchableOpacity>
                  <Text style={styles.lengthVal}>{length}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setLength(l => Math.min(64, l + 1))}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.presetRow}>
                {[8, 12, 16, 24, 32].map(n => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setLength(n)}
                    style={[styles.presetBtn, length === n && { backgroundColor: '#eff6ff', borderColor: '#3b82f6' }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetText, length === n && { color: '#3b82f6' }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.optLabel, { marginTop: 14, marginBottom: 8 }]}>Characters</Text>
              <View style={styles.chipRow}>
                <ToggleChip label="a–z" active={useLower}   onPress={() => setUseLower(v => !v)}   color="#22c55e" />
                <ToggleChip label="A–Z" active={useUpper}   onPress={() => setUseUpper(v => !v)}   color="#3b82f6" />
                <ToggleChip label="0–9" active={useDigits}  onPress={() => setUseDigits(v => !v)}  color="#f97316" />
                <ToggleChip label="!@#" active={useSymbols} onPress={() => setUseSymbols(v => !v)} color="#a855f7" />
              </View>
            </View>

            {/* ── Action Buttons ── */}
            <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} activeOpacity={0.85}>
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={styles.generateBtnText}>Generate Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, !password && { opacity: 0.4 }]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={!password}
            >
              <Ionicons name="bookmark-outline" size={18} color="#3b82f6" />
              <Text style={styles.saveBtnText}>Save to Vault</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {vault.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="lock-open-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>Vault is empty</Text>
                <Text style={styles.emptySub}>Generate and save passwords{'\n'}to see them here.</Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => setTab('gen')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyBtnText}>Go to Generator</Text>
                </TouchableOpacity>
              </View>
            ) : (
              vault.map(item => (
                <PasswordCard
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onCopy={handleCopy}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* ── Save Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Save Password</Text>
            <Text style={styles.modalSub}>Give this password a name</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Gmail, Netflix, Bank…"
              placeholderTextColor="#94a3b8"
              value={titleInput}
              onChangeText={setTitleInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={confirmSave}
              selectionColor="#3b82f6"
            />

            <View style={styles.modalPreview}>
              <Text style={styles.modalPreviewPw} numberOfLines={1}>{password}</Text>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={confirmSave}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  vaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  vaultBadgeText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  badge: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  // Display card
  displayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  displayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  displayPassword: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
  },
  copyBtn: {
    padding: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  strengthBarFull: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegmentLg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 52,
    textAlign: 'right',
  },

  // Options card
  optCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  optTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.8,
    marginBottom: 14,
  },
  optLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  lengthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  lengthControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lengthVal: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  presetText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },

  // Action buttons
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 10,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 4,
  },
  saveBtnText: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '700',
  },

  // Password card (vault)
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardPassword: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    letterSpacing: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 2,
  },
  iconBtn: {
    padding: 7,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 10,
  },
  strengthSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 13,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000044',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 18,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 12,
  },
  modalPreview: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
  },
  modalPreviewPw: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  modalSave: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});