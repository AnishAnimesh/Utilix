import React, { useState, useCallback } from 'react';
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
} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = 'length' | 'weight' | 'temperature' | 'volume' | 'speed';

interface UnitDef {
  label: string;
  symbol: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

// ─── Unit Definitions ────────────────────────────────────────────────────────

const UNITS: Record<Category, Record<string, UnitDef>> = {
  length: {
    mm:    { label: 'Millimetre',  symbol: 'mm',  toBase: v => v * 0.001,        fromBase: v => v / 0.001 },
    cm:    { label: 'Centimetre',  symbol: 'cm',  toBase: v => v * 0.01,         fromBase: v => v / 0.01 },
    m:     { label: 'Metre',       symbol: 'm',   toBase: v => v,                fromBase: v => v },
    km:    { label: 'Kilometre',   symbol: 'km',  toBase: v => v * 1000,         fromBase: v => v / 1000 },
    in:    { label: 'Inch',        symbol: 'in',  toBase: v => v * 0.0254,       fromBase: v => v / 0.0254 },
    ft:    { label: 'Foot',        symbol: 'ft',  toBase: v => v * 0.3048,       fromBase: v => v / 0.3048 },
    yd:    { label: 'Yard',        symbol: 'yd',  toBase: v => v * 0.9144,       fromBase: v => v / 0.9144 },
    mi:    { label: 'Mile',        symbol: 'mi',  toBase: v => v * 1609.344,     fromBase: v => v / 1609.344 },
  },
  weight: {
    mg:    { label: 'Milligram',   symbol: 'mg',  toBase: v => v * 0.000001,     fromBase: v => v / 0.000001 },
    g:     { label: 'Gram',        symbol: 'g',   toBase: v => v * 0.001,        fromBase: v => v / 0.001 },
    kg:    { label: 'Kilogram',    symbol: 'kg',  toBase: v => v,                fromBase: v => v },
    t:     { label: 'Metric Ton',  symbol: 't',   toBase: v => v * 1000,         fromBase: v => v / 1000 },
    oz:    { label: 'Ounce',       symbol: 'oz',  toBase: v => v * 0.0283495,    fromBase: v => v / 0.0283495 },
    lb:    { label: 'Pound',       symbol: 'lb',  toBase: v => v * 0.453592,     fromBase: v => v / 0.453592 },
    st:    { label: 'Stone',       symbol: 'st',  toBase: v => v * 6.35029,      fromBase: v => v / 6.35029 },
  },
  temperature: {
    C:     { label: 'Celsius',     symbol: '°C',  toBase: v => v,                fromBase: v => v },
    F:     { label: 'Fahrenheit',  symbol: '°F',  toBase: v => (v - 32) * 5/9,  fromBase: v => v * 9/5 + 32 },
    K:     { label: 'Kelvin',      symbol: 'K',   toBase: v => v - 273.15,       fromBase: v => v + 273.15 },
    R:     { label: 'Rankine',     symbol: '°R',  toBase: v => (v - 491.67) * 5/9, fromBase: v => v * 9/5 + 491.67 },
  },
  volume: {
    ml:    { label: 'Millilitre',  symbol: 'mL',  toBase: v => v * 0.001,        fromBase: v => v / 0.001 },
    l:     { label: 'Litre',       symbol: 'L',   toBase: v => v,                fromBase: v => v },
    m3:    { label: 'Cubic Metre', symbol: 'm³',  toBase: v => v * 1000,         fromBase: v => v / 1000 },
    tsp:   { label: 'Teaspoon',    symbol: 'tsp', toBase: v => v * 0.00492892,   fromBase: v => v / 0.00492892 },
    tbsp:  { label: 'Tablespoon',  symbol: 'tbsp',toBase: v => v * 0.0147868,    fromBase: v => v / 0.0147868 },
    cup:   { label: 'Cup',         symbol: 'cup', toBase: v => v * 0.236588,     fromBase: v => v / 0.236588 },
    pt:    { label: 'Pint',        symbol: 'pt',  toBase: v => v * 0.473176,     fromBase: v => v / 0.473176 },
    gal:   { label: 'Gallon',      symbol: 'gal', toBase: v => v * 3.78541,      fromBase: v => v / 3.78541 },
  },
  speed: {
    mps:   { label: 'Metres/sec',  symbol: 'm/s', toBase: v => v,                fromBase: v => v },
    kph:   { label: 'Km/hour',     symbol: 'km/h',toBase: v => v / 3.6,          fromBase: v => v * 3.6 },
    mph:   { label: 'Miles/hour',  symbol: 'mph', toBase: v => v * 0.44704,      fromBase: v => v / 0.44704 },
    knot:  { label: 'Knot',        symbol: 'kn',  toBase: v => v * 0.514444,     fromBase: v => v / 0.514444 },
    fps:   { label: 'Feet/sec',    symbol: 'ft/s',toBase: v => v * 0.3048,       fromBase: v => v / 0.3048 },
  },
};

const CATEGORY_META: Record<Category, { icon: string; color: string }> = {
  length:      { icon: '📏', color: '#3b82f6' },
  weight:      { icon: '⚖️', color: '#22c55e' },
  temperature: { icon: '🌡️', color: '#f97316' },
  volume:      { icon: '🧪', color: '#a855f7' },
  speed:       { icon: '⚡', color: '#ec4899' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function convert(value: number, category: Category, from: string, to: string): number {
  if (from === to) return value;
  const defs = UNITS[category];
  const baseValue = defs[from].toBase(value);
  return defs[to].fromBase(baseValue);
}

function formatResult(n: number): string {
  if (!isFinite(n)) return 'Error';
  if (Math.abs(n) >= 1e9 || (Math.abs(n) < 1e-4 && n !== 0)) {
    return n.toExponential(6);
  }
  // Up to 8 significant figures, strip trailing zeros
  const str = parseFloat(n.toPrecision(8)).toString();
  return str;
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

interface UnitPickerProps {
  category: Category;
  selected: string;
  onSelect: (unit: string) => void;
}

function UnitPicker({ category, selected, onSelect }: UnitPickerProps) {
  const units = Object.keys(UNITS[category]);
  const color = CATEGORY_META[category].color;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
      <View style={styles.unitRow}>
        {units.map(u => {
          const active = selected === u;
          return (
            <TouchableOpacity
              key={u}
              onPress={() => onSelect(u)}
              style={[
                styles.unitChip,
                active && { backgroundColor: color, borderColor: color },
              ]}
              activeOpacity={0.75}
            >
              <Text style={[styles.unitChipSymbol, active && styles.unitChipSymbolActive]}>
                {UNITS[category][u].symbol}
              </Text>
              <Text style={[styles.unitChipLabel, active && styles.unitChipLabelActive]}>
                {UNITS[category][u].label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UnitConverter() {
  const [category, setCategory] = useState<Category>('length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('km');
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');

  const accentColor = CATEGORY_META[category].color;

  // Default units when switching category
  const defaultUnits: Record<Category, [string, string]> = {
    length:      ['m', 'km'],
    weight:      ['kg', 'lb'],
    temperature: ['C', 'F'],
    volume:      ['l', 'gal'],
    speed:       ['kph', 'mph'],
  };

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    const [f, t] = defaultUnits[cat];
    setFromUnit(f);
    setToUnit(t);
    setInputText('');
    setError('');
  };

  const handleInput = useCallback((text: string) => {
    setError('');
    // Allow negative, decimal
    if (text === '' || text === '-' || text === '.') {
      setInputText(text);
      return;
    }
    if (!/^-?\d*\.?\d*$/.test(text)) {
      setError('Please enter a valid number');
      return;
    }
    setInputText(text);
  }, []);

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    // Recalculate input as result
    if (inputText && resultValue !== null) {
      setInputText(formatResult(resultValue));
    }
  };

  const numInput = parseFloat(inputText);
  const hasInput = inputText !== '' && inputText !== '-' && inputText !== '.' && !isNaN(numInput);
  const resultValue = hasInput ? convert(numInput, category, fromUnit, toUnit) : null;
  const resultText = resultValue !== null ? formatResult(resultValue) : '';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Unit Converter</Text>
          <Text style={styles.headerSub}>Fast & precise conversions</Text>
        </View>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <View style={styles.tabRow}>
            {(Object.keys(CATEGORY_META) as Category[]).map(cat => {
              const meta = CATEGORY_META[cat];
              const active = cat === category;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => handleCategoryChange(cat)}
                  style={[
                    styles.tab,
                    active && { backgroundColor: meta.color + '22', borderColor: meta.color },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={styles.tabIcon}>{meta.icon}</Text>
                  <Text style={[styles.tabText, active && { color: meta.color }]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Converter Card */}
        <View style={styles.card}>
          {/* FROM Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FROM</Text>
            <UnitPicker category={category} selected={fromUnit} onSelect={u => {
              setFromUnit(u);
              if (u === toUnit) {
                // pick the next different unit
                const keys = Object.keys(UNITS[category]);
                const next = keys.find(k => k !== u) ?? u;
                setToUnit(next);
              }
            }} />
            <View style={[styles.inputWrap, { borderColor: accentColor + '66' }]}>
              <TextInput
                style={[styles.mainInput, { color: accentColor }]}
                placeholder="Enter value…"
                placeholderTextColor="#444"
                value={inputText}
                onChangeText={handleInput}
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={20}
              />
              <Text style={[styles.inputUnit, { color: accentColor + 'aa' }]}>
                {UNITS[category][fromUnit].symbol}
              </Text>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* Swap Button */}
          <TouchableOpacity onPress={handleSwap} style={[styles.swapBtn, { borderColor: accentColor + '55' }]} activeOpacity={0.7}>
            <Text style={[styles.swapIcon, { color: accentColor }]}>⇅</Text>
            <Text style={[styles.swapLabel, { color: accentColor + 'aa' }]}>swap</Text>
          </TouchableOpacity>

          {/* TO Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TO</Text>
            <UnitPicker category={category} selected={toUnit} onSelect={u => {
              setToUnit(u);
              if (u === fromUnit) {
                const keys = Object.keys(UNITS[category]);
                const next = keys.find(k => k !== u) ?? u;
                setFromUnit(next);
              }
            }} />
            <View style={[styles.resultWrap, { backgroundColor: accentColor + '11', borderColor: accentColor + '33' }]}>
              {resultText ? (
                <>
                  <Text style={[styles.resultValue, { color: accentColor }]}>{resultText}</Text>
                  <Text style={[styles.resultUnit, { color: accentColor + 'aa' }]}>
                    {UNITS[category][toUnit].symbol}
                  </Text>
                </>
              ) : (
                <Text style={styles.resultPlaceholder}>Result appears here</Text>
              )}
            </View>
          </View>
        </View>

        {/* Formula hint */}
        {hasInput && resultValue !== null && (
          <View style={styles.formulaCard}>
            <Text style={styles.formulaText}>
              {`${numInput} ${UNITS[category][fromUnit].symbol}  =  ${resultText} ${UNITS[category][toUnit].symbol}`}
            </Text>
          </View>
        )}

        {/* Quick Reference */}
        <View style={styles.quickRef}>
          <Text style={styles.quickRefTitle}>Quick Reference</Text>
          <View style={styles.quickRefGrid}>
            {Object.entries(UNITS[category])
              .slice(0, 6)
              .map(([key, def]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.quickRefItem, { borderColor: accentColor + '33' }]}
                  onPress={() => setFromUnit(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickRefSymbol, { color: accentColor }]}>{def.symbol}</Text>
                  <Text style={styles.quickRefLabel}>{def.label}</Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scroll: {
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },

  // Category tabs
  tabScroll: {
    paddingLeft: 20,
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 50,
    backgroundColor: '#161620',
    borderWidth: 1,
    borderColor: '#252530',
  },
  tabIcon: {
    fontSize: 15,
  },
  tabText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },

  // Converter card
  card: {
    marginHorizontal: 16,
    backgroundColor: '#12121a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    gap: 4,
  },

  // Section
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444',
    letterSpacing: 1.5,
  },

  // Unit chips
  unitScroll: {
    marginHorizontal: -4,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 4,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#1c1c28',
    borderWidth: 1,
    borderColor: '#252535',
    alignItems: 'center',
    minWidth: 56,
  },
  unitChipSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ccc',
  },
  unitChipSymbolActive: {
    color: '#fff',
  },
  unitChipLabel: {
    fontSize: 9,
    color: '#555',
    marginTop: 1,
  },
  unitChipLabelActive: {
    color: 'rgba(255,255,255,0.7)',
  },

  // Input
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0e0e18',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 60,
  },
  mainInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    paddingVertical: 8,
  },
  inputUnit: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    marginTop: -4,
  },

  // Swap
  swapBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 50,
    borderWidth: 1,
    marginVertical: 8,
  },
  swapIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  swapLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Result
  resultWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 60,
  },
  resultValue: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  resultUnit: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultPlaceholder: {
    color: '#333',
    fontSize: 15,
  },

  // Formula
  formulaCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#12121a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1e1e2e',
  },
  formulaText: {
    color: '#555',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Quick Reference
  quickRef: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  quickRefTitle: {
    color: '#444',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  quickRefGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickRefItem: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: '#12121a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickRefSymbol: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickRefLabel: {
    fontSize: 10,
    color: '#444',
    marginTop: 2,
    textAlign: 'center',
  },
});