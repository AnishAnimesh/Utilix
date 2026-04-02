import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ── iPhone 17 Pro Max (430 × 932 pt) — Scientific only ───────────────
// SafeArea top ≈ 59, bottom ≈ 34
// TopBar: 52 | Display: 140 | Pad: 932-59-34-52-140 = 647
// 9 rows, gap 7 → row height: (647 - 8×7) / 9 ≈ 65
const ROW_H    = 65;
const ROW_GAP  = 7;
const SCI_FONT = 16;
const DISP_FONT = 58;
const PREV_FONT = 15;

// ─── Math helpers ─────────────────────────────────────────────────────

function safeEval(expr: string): string {
  try {
    let e = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, `(${Math.PI})`)
      .replace(/e(?!\^)/g, `(${Math.E})`)
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/√\(/g, 'Math.sqrt(')
      .replace(/\^/g, '**')
      .replace(/(\d+)!/g, (_, n) => factorial(parseInt(n)).toString());

    const result = new Function('return ' + e)();
    if (!isFinite(result)) return 'Error';
    return parseFloat(result.toPrecision(12)).toString();
  } catch {
    return 'Error';
  }
}

function factorial(n: number): number {
  if (n < 0 || n > 20) return NaN;
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}

function formatDisplay(val: string): string {
  if (!val || val === 'Error') return val || '0';
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  if (val.includes('e')) return val;
  const parts = val.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// ─── Button types & palette ───────────────────────────────────────────

type BtnType = 'number' | 'operator' | 'action' | 'equals' | 'function';

const PALETTE: Record<BtnType, { bg: string; text: string; border: string }> = {
  number:   { bg: '#ffffff', text: '#111827', border: '#e2e8f0' },
  operator: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  action:   { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' },
  equals:   { bg: '#2563eb', text: '#ffffff', border: '#2563eb' },
  function: { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
};

// ─── Button Component ─────────────────────────────────────────────────

interface BtnProps {
  label: string;
  onPress: () => void;
  type?: BtnType;
  wide?: boolean;
  fSize?: number;
}

function CalcBtn({ label, onPress, type = 'number', wide = false, fSize = SCI_FONT }: BtnProps) {
  const { bg, text, border } = PALETTE[type];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor: border },
        wide && { flex: 2 },
        type === 'equals' && {
          shadowColor: '#2563eb',
          shadowOpacity: 0.45,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        },
      ]}
    >
      <Text style={[styles.btnText, { color: text, fontSize: fSize }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────

export default function Calculator() {
  const [input, setInput]     = useState('');
  const [result, setResult]   = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHist, setShowHist] = useState(false);
  const [isDeg, setIsDeg]     = useState(true);

  const display = input || '0';

  const append = (val: string) => {
    if (result && !isNaN(parseFloat(result)) && /^[0-9.(π]/.test(val)) {
      setInput(val); setResult('');
    } else {
      setInput(prev => prev === 'Error' ? val : prev + val);
    }
  };

  const backspace = () => setInput(p => p.length > 1 ? p.slice(0, -1) : '');
  const clear     = () => { setInput(''); setResult(''); };
  const clearAll  = () => { setInput(''); setResult(''); setHistory([]); };

  const calculate = () => {
    if (!input || input === 'Error') return;
    let expr = input;
    if (isDeg) {
      expr = expr
        .replace(/Math\.sin\(([^)]+)\)/g, (_, a) => `Math.sin((${a})*Math.PI/180)`)
        .replace(/Math\.cos\(([^)]+)\)/g, (_, a) => `Math.cos((${a})*Math.PI/180)`)
        .replace(/Math\.tan\(([^)]+)\)/g, (_, a) => `Math.tan((${a})*Math.PI/180)`);
    }
    const res = safeEval(expr);
    setHistory(h => [`${input} = ${res}`, ...h.slice(0, 19)]);
    setResult(res);
    setInput(res);
  };

  const applyFn = (fn: string) => {
    if (fn === 'x²') { append('^2'); return; }
    if (fn === 'xʸ') { append('^'); return; }
    if (fn === '1/x') { setInput(p => `1/(${p || '0'})`); return; }
    if (fn === '|x|') { setInput(p => `Math.abs(${p || '0'})`); return; }
    if (fn === 'n!') { append('!'); return; }
    append(`${fn}(`);
  };

  // ── All 9 rows ──────────────────────────────────────────────────────
  const rows = [
    // Row 1 – scientific tools
    [
      { l: isDeg ? 'DEG' : 'RAD', t: 'action'   as BtnType, fn: () => setIsDeg(d => !d) },
      { l: 'x²',   t: 'function' as BtnType, fn: () => applyFn('x²') },
      { l: 'xʸ',   t: 'function' as BtnType, fn: () => applyFn('xʸ') },
      { l: '1/x',  t: 'function' as BtnType, fn: () => applyFn('1/x') },
    ],
    // Row 2 – trig
    [
      { l: 'sin', t: 'function' as BtnType, fn: () => applyFn('sin') },
      { l: 'cos', t: 'function' as BtnType, fn: () => applyFn('cos') },
      { l: 'tan', t: 'function' as BtnType, fn: () => applyFn('tan') },
      { l: 'n!',  t: 'function' as BtnType, fn: () => applyFn('n!') },
    ],
    // Row 3 – log / root
    [
      { l: 'log', t: 'function' as BtnType, fn: () => applyFn('log') },
      { l: 'ln',  t: 'function' as BtnType, fn: () => applyFn('ln') },
      { l: '√',   t: 'function' as BtnType, fn: () => applyFn('√') },
      { l: '|x|', t: 'function' as BtnType, fn: () => applyFn('|x|') },
    ],
    // Row 4 – constants & brackets
    [
      { l: 'π',  t: 'function' as BtnType, fn: () => append('π') },
      { l: 'e',  t: 'function' as BtnType, fn: () => append('e') },
      { l: '(',  t: 'action'   as BtnType, fn: () => append('(') },
      { l: ')',  t: 'action'   as BtnType, fn: () => append(')') },
    ],
    // Row 5 – AC / +/- / % / ÷
    [
      { l: 'AC',  t: 'action'   as BtnType, fn: () => clear() },
      { l: '+/-', t: 'action'   as BtnType, fn: () => setInput(p => p.startsWith('-') ? p.slice(1) : '-' + p) },
      { l: '%',   t: 'action'   as BtnType, fn: () => setInput(p => (parseFloat(p) / 100).toString()) },
      { l: '÷',   t: 'operator' as BtnType, fn: () => append('÷') },
    ],
    // Row 6
    [
      { l: '7', t: 'number' as BtnType, fn: () => append('7') },
      { l: '8', t: 'number' as BtnType, fn: () => append('8') },
      { l: '9', t: 'number' as BtnType, fn: () => append('9') },
      { l: '×', t: 'operator' as BtnType, fn: () => append('×') },
    ],
    // Row 7
    [
      { l: '4', t: 'number' as BtnType, fn: () => append('4') },
      { l: '5', t: 'number' as BtnType, fn: () => append('5') },
      { l: '6', t: 'number' as BtnType, fn: () => append('6') },
      { l: '-', t: 'operator' as BtnType, fn: () => append('-') },
    ],
    // Row 8
    [
      { l: '1', t: 'number' as BtnType, fn: () => append('1') },
      { l: '2', t: 'number' as BtnType, fn: () => append('2') },
      { l: '3', t: 'number' as BtnType, fn: () => append('3') },
      { l: '+', t: 'operator' as BtnType, fn: () => append('+') },
    ],
    // Row 9 – wide 0
    [
      { l: '0', t: 'number' as BtnType,   fn: () => append('0'), wide: true },
      { l: '.', t: 'number' as BtnType,   fn: () => append('.') },
      { l: '=', t: 'equals' as BtnType,   fn: () => calculate() },
    ],
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* ── History panel ── */}
      {showHist && (
        <View style={styles.histPanel}>
          <View style={styles.histHeader}>
            <Text style={styles.histTitle}>History</Text>
            <TouchableOpacity onPress={() => { clearAll(); setShowHist(false); }}>
              <Text style={styles.histClear}>Clear all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {history.length === 0
              ? <Text style={styles.histEmpty}>No history yet</Text>
              : history.map((h, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => { setInput(h.split(' = ')[1]); setShowHist(false); }}
                    style={styles.histItem}
                  >
                    <Text style={styles.histExpr}>{h.split(' = ')[0]}</Text>
                    <Text style={styles.histResult}>= {h.split(' = ')[1]}</Text>
                  </TouchableOpacity>
                ))}
          </ScrollView>
        </View>
      )}

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setShowHist(h => !h)} style={styles.topBtn}>
          <Ionicons name="time-outline" size={19} color={showHist ? '#2563eb' : '#9ca3af'} />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.topTitle}>Scientific</Text>
          <View style={[styles.degBadge, isDeg ? styles.degBadgeOn : styles.degBadgeOff]}>
            <Text style={[styles.degText, isDeg ? styles.degTextOn : styles.degTextOff]}>
              {isDeg ? 'DEG' : 'RAD'}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={backspace} style={styles.topBtn}>
          <Ionicons name="backspace-outline" size={19} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* ── Display ── */}
      <View style={styles.display}>
        {result !== '' && input !== result && (
          <Text style={styles.prevExpr} numberOfLines={1}>
            {input}
          </Text>
        )}
        <Text
          style={[styles.displayText, display.length > 14 && { fontSize: 34 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {display === 'Error' ? 'Error' : formatDisplay(display)}
        </Text>
      </View>

      {/* ── Pad ── */}
      <View style={styles.pad}>
        {rows.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map(btn => (
              <CalcBtn
                key={btn.l}
                label={btn.l}
                onPress={btn.fn}
                type={btn.t}
                wide={(btn as any).wide}
                fSize={i < 4 ? SCI_FONT : SCI_FONT + 2}
              />
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // History
  histPanel: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 108 : 88,
    left: 14, right: 14,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    zIndex: 100,
    maxHeight: 280,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  histHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  histTitle:  { fontSize: 14, fontWeight: '700', color: '#111827' },
  histClear:  { fontSize: 12, fontWeight: '600', color: '#f87171' },
  histEmpty:  { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingVertical: 20 },
  histItem:   { paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#1e2538' },
  histExpr:   { fontSize: 12, color: '#94a3b8' },
  histResult: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 2 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 14 : 6,
    paddingBottom: 6,
    height: 52,
  },
  topBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center',
  },
  titleWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  topTitle: {
    fontSize: 16, fontWeight: '700', color: '#374151', letterSpacing: 0.3,
  },
  degBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1,
  },
  degBadgeOn:  { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  degBadgeOff: { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' },
  degText:     { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  degTextOn:   { color: '#2563eb' },
  degTextOff:  { color: '#9ca3af' },

  // Display
  display: {
    height: 140,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 12,
  },
  prevExpr: {
    fontSize: PREV_FONT,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '400',
  },
  displayText: {
    fontSize: DISP_FONT,
    fontWeight: '200',
    color: '#111827',
    letterSpacing: -2,
  },

  // Pad
  pad: {
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 14,
    paddingTop: 4,
    gap: ROW_GAP,
  },
  row: {
    height: ROW_H,
    flexDirection: 'row',
    gap: ROW_GAP,
  },
  btn: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnText: {
    fontWeight: '500',
  },
});