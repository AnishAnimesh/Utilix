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

// ── iPhone 17 Pro Max (430 × 932 pt) fixed values ──────────────────
// SafeArea top ≈ 59, bottom ≈ 34
// TopBar: 52  |  Display: 120  |  Pad: 932-59-34-52-120 = 667
// 9 rows (sci) or 5 rows (std), gap 6
// Sci row height: (667 - 8*6) / 9 ≈ 69  →  use 62 to leave breathing room
// Std row height: (667 - 4*6) / 5 ≈ 128 →  use 80 (iOS-calculator style)
const STD_FONT  = 22;
const SCI_FONT  = 15;
const DISP_FONT = 56;
const PREV_FONT = 16;
const ROW_GAP   = 6;
// Fixed row heights so scientific fits perfectly on 17 Pro Max
const STD_ROW_H = 80;   // standard mode: 5 rows × 80 + 4×6 gap = 424 ✓
const SCI_ROW_H = 62;   // scientific mode: 9 rows × 62 + 8×6 gap = 606 ✓

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'standard' | 'scientific';

// ─── Math helpers ─────────────────────────────────────────────────────────────

function safeEval(expr: string): string {
  try {
    // Replace display symbols with JS equivalents
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

    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + e)();
    if (!isFinite(result)) return 'Error';
    // Format: avoid floating-point noise
    const rounded = parseFloat(result.toPrecision(12));
    return rounded.toString();
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
  // Add thousands separators only to integer part if it's a plain number
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  if (val.includes('e')) return val;
  const parts = val.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// ─── Button Component ─────────────────────────────────────────────────────────

interface BtnProps {
  label: string;
  onPress: () => void;
  type?: 'number' | 'operator' | 'action' | 'equals' | 'function';
  wide?: boolean;
  fSize?: number;
}

function CalcBtn({ label, onPress, type = 'number', wide = false, fSize }: BtnProps) {
  const bg = {
    number:   '#f9fafb',
    operator: '#eff6ff',
    action:   '#f3f4f6',
    equals:   '#1dbf73',
    function: '#faf5ff',
  }[type];

  const tc = {
    number:   '#111827',
    operator: '#3b82f6',
    action:   '#6b7280',
    equals:   '#ffffff',
    function: '#7c3aed',
  }[type];

  const border = {
    number:   '#e5e7eb',
    operator: '#bfdbfe',
    action:   '#e5e7eb',
    equals:   '#1dbf73',
    function: '#e9d5ff',
  }[type];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor: border },
        wide && { flex: 2, marginRight: 5 },
        type === 'equals' && {
          shadowColor: '#1dbf73',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
        },
      ]}
    >
      <Text style={[styles.btnText, { color: tc }, fSize ? { fontSize: fSize } : {}]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Calculator() {
  const [input, setInput]         = useState('');
  const [result, setResult]       = useState('');
  const [history, setHistory]     = useState<string[]>([]);
  const [mode, setMode]           = useState<Mode>('standard');
  const [showHistory, setShowHistory] = useState(false);
  const [isDeg, setIsDeg]         = useState(true);

  const display = input || '0';

  const append = (val: string) => {
    if (result && !isNaN(parseFloat(result)) && /^[0-9.(π]/.test(val)) {
      // Start fresh after a result, unless continuing with operator
      setInput(val);
      setResult('');
    } else {
      setInput(prev => {
        if (prev === 'Error') return val;
        return prev + val;
      });
    }
  };

  const backspace = () => setInput(p => (p.length > 1 ? p.slice(0, -1) : ''));
  const clear     = () => { setInput(''); setResult(''); };
  const clearAll  = () => { setInput(''); setResult(''); setHistory([]); };

  const calculate = () => {
    if (!input || input === 'Error') return;
    let expr = input;

    // Degree → radian conversion for trig
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
    if (fn === 'EE') { append('e+'); return; }
    // Functions that need open paren
    append(`${fn}(`);
  };

  // ── Standard buttons ──
  const stdRows = [
    [
      { l: 'AC',  t: 'action',   fn: () => clear() },
      { l: '+/-', t: 'action',   fn: () => setInput(p => p.startsWith('-') ? p.slice(1) : '-' + p) },
      { l: '%',   t: 'action',   fn: () => setInput(p => (parseFloat(p) / 100).toString()) },
      { l: '÷',   t: 'operator', fn: () => append('÷') },
    ],
    [
      { l: '7', t: 'number', fn: () => append('7') },
      { l: '8', t: 'number', fn: () => append('8') },
      { l: '9', t: 'number', fn: () => append('9') },
      { l: '×', t: 'operator', fn: () => append('×') },
    ],
    [
      { l: '4', t: 'number', fn: () => append('4') },
      { l: '5', t: 'number', fn: () => append('5') },
      { l: '6', t: 'number', fn: () => append('6') },
      { l: '-', t: 'operator', fn: () => append('-') },
    ],
    [
      { l: '1', t: 'number', fn: () => append('1') },
      { l: '2', t: 'number', fn: () => append('2') },
      { l: '3', t: 'number', fn: () => append('3') },
      { l: '+', t: 'operator', fn: () => append('+') },
    ],
    [
      { l: '0',  t: 'number',   fn: () => append('0'), wide: true },
      { l: '.',  t: 'number',   fn: () => append('.') },
      { l: '=',  t: 'equals',   fn: () => calculate() },
    ],
  ] as { l: string; t: string; fn: () => void; wide?: boolean }[][];

  // ── Scientific button rows ──
  const sciRows = [
    [
      { l: isDeg ? 'DEG' : 'RAD', t: 'action',   fn: () => setIsDeg(d => !d) },
      { l: 'x²',   t: 'function', fn: () => applyFn('x²') },
      { l: 'xʸ',   t: 'function', fn: () => applyFn('xʸ') },
      { l: '1/x',  t: 'function', fn: () => applyFn('1/x') },
    ],
    [
      { l: 'sin',  t: 'function', fn: () => applyFn('sin') },
      { l: 'cos',  t: 'function', fn: () => applyFn('cos') },
      { l: 'tan',  t: 'function', fn: () => applyFn('tan') },
      { l: 'n!',   t: 'function', fn: () => applyFn('n!') },
    ],
    [
      { l: 'log',  t: 'function', fn: () => applyFn('log') },
      { l: 'ln',   t: 'function', fn: () => applyFn('ln') },
      { l: '√',    t: 'function', fn: () => applyFn('√') },
      { l: '|x|',  t: 'function', fn: () => applyFn('|x|') },
    ],
    [
      { l: 'π',    t: 'function', fn: () => append('π') },
      { l: 'e',    t: 'function', fn: () => append('e') },
      { l: '(',    t: 'action',   fn: () => append('(') },
      { l: ')',    t: 'action',   fn: () => append(')') },
    ],
  ] as { l: string; t: string; fn: () => void }[][];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* ── History panel ── */}
      {showHistory && (
        <View style={styles.historyPanel}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>History</Text>
            <TouchableOpacity onPress={() => { clearAll(); setShowHistory(false); }}>
              <Text style={styles.historyClear}>Clear all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {history.length === 0
              ? <Text style={styles.historyEmpty}>No history yet</Text>
              : history.map((h, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => { setInput(h.split(' = ')[1]); setShowHistory(false); }}
                    style={styles.historyItem}
                  >
                    <Text style={styles.historyExpr}>{h.split(' = ')[0]}</Text>
                    <Text style={styles.historyResult}>= {h.split(' = ')[1]}</Text>
                  </TouchableOpacity>
                ))}
          </ScrollView>
        </View>
      )}

      {/* ── Top controls ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setShowHistory(h => !h)} style={styles.topBtn}>
          <Ionicons name="time-outline" size={20} color={showHistory ? '#3b82f6' : '#9ca3af'} />
        </TouchableOpacity>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            onPress={() => setMode('standard')}
            style={[styles.modeBtn, mode === 'standard' && styles.modeBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeBtnText, mode === 'standard' && styles.modeBtnTextActive]}>Standard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('scientific')}
            style={[styles.modeBtn, mode === 'scientific' && styles.modeBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeBtnText, mode === 'scientific' && styles.modeBtnTextActive]}>Scientific</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={backspace} style={styles.topBtn}>
          <Ionicons name="backspace-outline" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* ── Display ── */}
      <View style={styles.display}>
        {result ? (
          <Text style={styles.prevExpr} numberOfLines={1}>{input !== result ? input : ''}</Text>
        ) : null}
        <Text
          style={[styles.displayText, display.length > 12 && { fontSize: 32 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {display === 'Error' ? 'Error' : formatDisplay(display)}
        </Text>
      </View>

      <View style={styles.pad}>
        {/* Scientific rows */}
        {mode === 'scientific' && sciRows.map((row, i) => (
          <View key={i} style={[styles.row, { height: SCI_ROW_H }]}>
            {row.map(btn => (
              <CalcBtn
                key={btn.l}
                label={btn.l}
                onPress={btn.fn}
                type={btn.t as any}
                fSize={SCI_FONT}
              />
            ))}
          </View>
        ))}

        {/* Standard rows */}
        {stdRows.map((row, i) => (
          <View key={i} style={[styles.row, { height: mode === 'scientific' ? SCI_ROW_H : STD_ROW_H }]}>
            {row.map(btn => (
              <CalcBtn
                key={btn.l}
                label={btn.l}
                onPress={btn.fn}
                type={btn.t as any}
                wide={btn.wide}
                fSize={mode === 'scientific' ? SCI_FONT : STD_FONT}
              />
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // History
  historyPanel: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 16, right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    zIndex: 100,
    maxHeight: 260,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  historyHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  historyTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  historyClear: { fontSize: 12, fontWeight: '600', color: '#ef4444' },
  historyEmpty: { fontSize: 13, color: '#d1d5db', textAlign: 'center', paddingVertical: 20 },
  historyItem:  { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  historyExpr:  { fontSize: 12, color: '#9ca3af' },
  historyResult:{ fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 2 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 8,
  },
  topBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modeBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
  },
  modeBtnActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  modeBtnTextActive: { color: '#111827' },

  // Display
  display: {
    height: 120,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  prevExpr: {
    fontSize: PREV_FONT,
    color: '#9ca3af',
    marginBottom: 4,
    fontWeight: '400' as const,
  },
  displayText: {
    fontSize: DISP_FONT,
    fontWeight: '300',
    color: '#111827',
    letterSpacing: -2,
  },

  // Buttons
  pad: {
    paddingHorizontal: 8,
    paddingBottom: 10,
    paddingTop: 4,
    gap: ROW_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: ROW_GAP,
  },
  btn: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnText: {
    fontSize: 20,
    fontWeight: '500',
  },
});