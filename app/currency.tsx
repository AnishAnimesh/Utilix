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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Currency Data ────────────────────────────────────────────────────────────

const CURRENCIES: Record<string, { name: string; symbol: string; color: string; rate: number }> = {
  USD: { name: 'US Dollar',          symbol: '$',   color: '#3b82f6', rate: 1 },
  INR: { name: 'Indian Rupee',       symbol: '₹',   color: '#f97316', rate: 83.5 },
  EUR: { name: 'Euro',               symbol: '€',   color: '#6366f1', rate: 0.92 },
  GBP: { name: 'British Pound',      symbol: '£',   color: '#8b5cf6', rate: 0.79 },
  JPY: { name: 'Japanese Yen',       symbol: '¥',   color: '#ef4444', rate: 149.5 },
  AED: { name: 'UAE Dirham',         symbol: 'AED', color: '#22c55e', rate: 3.67 },
  CAD: { name: 'Canadian Dollar',    symbol: 'C$',  color: '#dc2626', rate: 1.36 },
  AUD: { name: 'Australian Dollar',  symbol: 'A$',  color: '#0ea5e9', rate: 1.53 },
  CHF: { name: 'Swiss Franc',        symbol: 'Fr',  color: '#e11d48', rate: 0.90 },
  SGD: { name: 'Singapore Dollar',   symbol: 'S$',  color: '#d97706', rate: 1.34 },
  CNY: { name: 'Chinese Yuan',       symbol: 'CN¥', color: '#dc2626', rate: 7.24 },
  SAR: { name: 'Saudi Riyal',        symbol: 'SAR', color: '#16a34a', rate: 3.75 },
  MYR: { name: 'Malaysian Ringgit',  symbol: 'RM',  color: '#2563eb', rate: 4.72 },
  THB: { name: 'Thai Baht',          symbol: '฿',   color: '#7c3aed', rate: 35.1 },
  KRW: { name: 'South Korean Won',   symbol: '₩',   color: '#0f172a', rate: 1325 },
};

const CURRENCY_KEYS = Object.keys(CURRENCIES);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function convertAmount(amount: number, from: string, to: string): number {
  const inUSD = amount / CURRENCIES[from].rate;
  return inUSD * CURRENCIES[to].rate;
}

function formatAmount(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '—';
  if (n >= 1000000) return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  if (n < 0.01 && n > 0) return n.toFixed(6);
  return n.toFixed(2);
}

// ─── Dropdown Modal ───────────────────────────────────────────────────────────

function CurrencyDropdown({
  visible,
  selected,
  onSelect,
  onClose,
  exclude,
}: {
  visible: boolean;
  selected: string;
  onSelect: (code: string) => void;
  onClose: () => void;
  exclude: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = CURRENCY_KEYS.filter(code => {
    const c = CURRENCIES[code];
    const q = search.toLowerCase();
    return (
      code !== exclude &&
      (code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q))
    );
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>Select Currency</Text>

          {/* Search */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search currency..."
              placeholderTextColor="#cbd5e1"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={item => item}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: code }) => {
              const c = CURRENCIES[code];
              const isActive = code === selected;
              return (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(code);
                    setSearch('');
                    onClose();
                  }}
                  activeOpacity={0.7}
                  style={[styles.dropdownItem, isActive && styles.dropdownItemActive]}
                >
                  <View style={[styles.flagBadge, { backgroundColor: c.color + '18', borderColor: c.color + '44' }]}>
                <Text style={[styles.flagBadgeText, { color: c.color }]}>{code.slice(0,2)}</Text>
              </View>
                  <View style={styles.dropdownInfo}>
                    <Text style={[styles.dropdownCode, isActive && { color: '#3b82f6' }]}>{code}</Text>
                    <Text style={styles.dropdownName}>{c.name}</Text>
                  </View>
                  <Text style={[styles.dropdownSymbol, isActive && { color: '#3b82f6' }]}>{c.symbol}</Text>
                  {isActive && (
                    <Ionicons name="checkmark-circle" size={18} color="#3b82f6" style={{ marginLeft: 6 }} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Currency Selector Button ─────────────────────────────────────────────────

function CurrencySelector({
  code,
  onPress,
}: {
  code: string;
  onPress: () => void;
}) {
  const c = CURRENCIES[code];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.selectorBtn}>
      <View style={[styles.flagBadge, { backgroundColor: c.color + '18', borderColor: c.color + '44' }]}>
        <Text style={[styles.flagBadgeText, { color: c.color }]}>{code.slice(0,2)}</Text>
      </View>
      <View style={styles.selectorInfo}>
        <Text style={styles.selectorCode}>{code}</Text>
        <Text style={styles.selectorName} numberOfLines={1}>{c.name}</Text>
      </View>
      <Ionicons name="chevron-down" size={16} color="#94a3b8" />
    </TouchableOpacity>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CurrencyConverter() {
  const [amount, setAmount]           = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency]     = useState('INR');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker]     = useState(false);

  const numAmount = parseFloat(amount);
  const hasAmount = amount !== '' && !isNaN(numAmount) && numAmount > 0;
  const converted = hasAmount ? convertAmount(numAmount, fromCurrency, toCurrency) : null;

  const fromData  = CURRENCIES[fromCurrency];
  const toData    = CURRENCIES[toCurrency];
  const unitRate  = convertAmount(1, fromCurrency, toCurrency);

  const handleSwap = () => {
    const prevFrom = fromCurrency;
    const prevTo   = toCurrency;
    setFromCurrency(prevTo);
    setToCurrency(prevFrom);
    if (converted !== null) setAmount(formatAmount(converted));
  };

  const handleSetFrom = (code: string) => {
    setFromCurrency(code);
    if (code === toCurrency) {
      setToCurrency(CURRENCY_KEYS.find(k => k !== code) ?? 'INR');
    }
  };

  const handleSetTo = (code: string) => {
    setToCurrency(code);
    if (code === fromCurrency) {
      setFromCurrency(CURRENCY_KEYS.find(k => k !== code) ?? 'USD');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.heading}>Currency</Text>
            <Text style={styles.headingBlue}>Converter</Text>
          </View>
          <View style={styles.ratesBadge}>
            <Ionicons name="globe-outline" size={12} color="#3b82f6" />
            <Text style={styles.ratesBadgeText}>15 currencies</Text>
          </View>
        </View>

        {/* ── Converter Card ── */}
        <View style={styles.card}>

          {/* FROM block */}
          <View style={styles.block}>
            <Text style={styles.blockLabel}>FROM</Text>
            <CurrencySelector code={fromCurrency} onPress={() => setShowFromPicker(true)} />
            <View style={styles.amountRow}>
              <Text style={styles.amountSymbol}>{fromData.symbol}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#cbd5e1"
                value={amount}
                onChangeText={t => { if (/^\d*\.?\d*$/.test(t)) setAmount(t); }}
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={15}
              />
            </View>
          </View>

          {/* Divider + Swap */}
          <View style={styles.swapRow}>
            <View style={styles.dividerLine} />
            <TouchableOpacity onPress={handleSwap} style={styles.swapBtn} activeOpacity={0.75}>
              <Ionicons name="swap-vertical" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <View style={styles.dividerLine} />
          </View>

          {/* TO block */}
          <View style={styles.block}>
            <Text style={styles.blockLabel}>TO</Text>
            <CurrencySelector code={toCurrency} onPress={() => setShowToPicker(true)} />
            <View style={[
              styles.resultRow,
              hasAmount && { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
            ]}>
              <Text style={[styles.amountSymbol, hasAmount && { color: '#3b82f6' }]}>{toData.symbol}</Text>
              <Text
                style={[styles.resultText, !hasAmount && { color: '#cbd5e1' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {converted !== null ? formatAmount(converted) : '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Exchange Rate ── */}
        <View style={styles.rateCard}>
          <Ionicons name="trending-up-outline" size={15} color="#3b82f6" />
          <View style={styles.rateTexts}>
            <Text style={styles.rateMain}>
              1 {fromCurrency} = <Text style={{ color: '#3b82f6', fontWeight: '700' }}>{formatAmount(unitRate)} {toCurrency}</Text>
            </Text>
            <Text style={styles.rateSub}>
              1 {toCurrency} = {formatAmount(1 / unitRate)} {fromCurrency}
            </Text>
          </View>
        </View>

        {/* ── Quick Amounts ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK CONVERT</Text>
          <View style={styles.quickGrid}>
            {[1, 10, 100, 500, 1000, 5000].map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => setAmount(n.toString())}
                activeOpacity={0.75}
                style={[styles.quickBtn, amount === n.toString() && styles.quickBtnActive]}
              >
                <Text style={[styles.quickBtnText, amount === n.toString() && styles.quickBtnTextActive]}>
                  {fromData.symbol}{n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── All Rates ── */}
        <View style={styles.allRatesCard}>
          <Text style={styles.sectionLabel}>ALL RATES</Text>
          <Text style={styles.allRatesSub}>
            {hasAmount
              ? `${fromData.symbol}${numAmount} ${fromCurrency} →`
              : `1 ${fromCurrency} →`}
          </Text>
          {CURRENCY_KEYS.filter(k => k !== fromCurrency).map(code => {
            const c = CURRENCIES[code];
            const val = convertAmount(hasAmount ? numAmount : 1, fromCurrency, code);
            const isTarget = code === toCurrency;
            return (
              <TouchableOpacity
                key={code}
                onPress={() => handleSetTo(code)}
                activeOpacity={0.7}
                style={[styles.rateRow, isTarget && styles.rateRowActive]}
              >
                <View style={[styles.flagBadge, { backgroundColor: c.color + '18', borderColor: c.color + '44' }]}>
                  <Text style={[styles.flagBadgeText, { color: c.color }]}>{code.slice(0,2)}</Text>
                </View>
                <View style={styles.rateInfo}>
                  <Text style={[styles.rateCode, isTarget && { color: '#3b82f6' }]}>{code}</Text>
                  <Text style={styles.rateName}>{c.name}</Text>
                </View>
                <Text style={[styles.rateValue, isTarget && { color: '#3b82f6' }]}>
                  {c.symbol}{formatAmount(val)}
                </Text>
                {isTarget && <Ionicons name="checkmark-circle" size={16} color="#3b82f6" style={{ marginLeft: 6 }} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Dropdowns ── */}
      <CurrencyDropdown
        visible={showFromPicker}
        selected={fromCurrency}
        onSelect={handleSetFrom}
        onClose={() => setShowFromPicker(false)}
        exclude={toCurrency}
      />
      <CurrencyDropdown
        visible={showToPicker}
        selected={toCurrency}
        onSelect={handleSetTo}
        onClose={() => setShowToPicker(false)}
        exclude={fromCurrency}
      />
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
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 16,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  headingBlue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#3b82f6',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  ratesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratesBadgeText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
  },

  // Converter card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // FROM / TO block
  block: {
    gap: 10,
  },
  blockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.8,
  },

  // Selector button (dropdown trigger)
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  selectorInfo: {
    flex: 1,
  },
  selectorCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  selectorName: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },

  // Amount input row
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#3b82f666',
    paddingHorizontal: 14,
    minHeight: 60,
    gap: 6,
  },
  amountSymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3b82f6',
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
    paddingVertical: 0,
  },

  // Swap row
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  swapBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // Result row
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    minHeight: 60,
    gap: 6,
  },
  resultText: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },

  // Rate card
  rateCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  rateTexts: {
    flex: 1,
  },
  rateMain: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  rateSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 3,
  },

  // Section
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.8,
    marginBottom: 10,
  },

  // Quick amounts
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  quickBtnTextActive: {
    color: '#3b82f6',
  },

  // All rates
  allRatesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  allRatesSub: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 10,
    marginTop: -4,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 4,
    gap: 10,
  },
  rateRowActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },

  rateInfo: {
    flex: 1,
  },
  rateCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  rateName: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  rateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },

  // ── Dropdown Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },

  // Search box
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 0,
  },

  // Flag badge (replaces emoji flags)
  flagBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Dropdown items
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 4,
    gap: 12,
  },
  dropdownItemActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },

  dropdownInfo: {
    flex: 1,
  },
  dropdownCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  dropdownName: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  dropdownSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
});