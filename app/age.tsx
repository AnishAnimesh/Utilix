import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getZodiac(month: number, day: number): { sign: string; icon: string } {
  const signs = [
    { sign: 'Capricorn',  icon: '♑', from: [12, 22], to: [1,  19] },
    { sign: 'Aquarius',   icon: '♒', from: [1,  20], to: [2,  18] },
    { sign: 'Pisces',     icon: '♓', from: [2,  19], to: [3,  20] },
    { sign: 'Aries',      icon: '♈', from: [3,  21], to: [4,  19] },
    { sign: 'Taurus',     icon: '♉', from: [4,  20], to: [5,  20] },
    { sign: 'Gemini',     icon: '♊', from: [5,  21], to: [6,  20] },
    { sign: 'Cancer',     icon: '♋', from: [6,  21], to: [7,  22] },
    { sign: 'Leo',        icon: '♌', from: [7,  23], to: [8,  22] },
    { sign: 'Virgo',      icon: '♍', from: [8,  23], to: [9,  22] },
    { sign: 'Libra',      icon: '♎', from: [9,  23], to: [10, 22] },
    { sign: 'Scorpio',    icon: '♏', from: [10, 23], to: [11, 21] },
    { sign: 'Sagittarius',icon: '♐', from: [11, 22], to: [12, 21] },
  ];
  for (const s of signs) {
    const [fm, fd] = s.from;
    const [tm, td] = s.to;
    if ((month === fm && day >= fd) || (month === tm && day <= td)) {
      return { sign: s.sign, icon: s.icon };
    }
  }
  return { sign: 'Capricorn', icon: '♑' };
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: color + '33', backgroundColor: color + '0c' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={[styles.statSub, { color: color + 'bb' }]}>{sub}</Text> : null}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AgeCalculator() {
  const [day,   setDay]   = useState('');
  const [month, setMonth] = useState('');
  const [year,  setYear]  = useState('');
  const [result, setResult] = useState<null | {
    years: number; months: number; days: number;
    totalDays: number; totalMonths: number; totalWeeks: number;
    nextBdayDays: number; nextBdayDate: string;
    zodiac: { sign: string; icon: string };
    dayOfWeek: string;
    isToday: boolean;
  }>(null);
  const [error, setError] = useState('');

  const calculate = () => {
    setError('');
    const d = parseInt(day), m = parseInt(month), y = parseInt(year);
    if (!day || !month || !year || isNaN(d) || isNaN(m) || isNaN(y)) {
      setError('Please fill in all fields'); return;
    }
    if (m < 1 || m > 12) { setError('Month must be 1–12'); return; }
    if (d < 1 || d > 31) { setError('Day must be 1–31'); return; }
    if (y < 1900 || y > new Date().getFullYear()) { setError('Enter a valid year'); return; }

    const birth = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (birth > today) { setError('Date of birth cannot be in the future'); return; }

    // Age
    let years  = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth()    - birth.getMonth();
    let days   = today.getDate()     - birth.getDate();

    if (days < 0) {
      months--;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) { years--; months += 12; }

    // Totals
    const diffMs     = today.getTime() - birth.getTime();
    const totalDays  = Math.floor(diffMs / 86400000);
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;

    // Next birthday
    let next = new Date(today.getFullYear(), m - 1, d);
    const isToday = next.getTime() === today.getTime();
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    const nextBdayDays = Math.ceil((next.getTime() - today.getTime()) / 86400000);
    const nextBdayDate = next.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    // Day of week born
    const dayOfWeek = birth.toLocaleDateString('en-IN', { weekday: 'long' });

    setResult({
      years, months, days,
      totalDays, totalWeeks, totalMonths,
      nextBdayDays, nextBdayDate,
      zodiac: getZodiac(m, d),
      dayOfWeek,
      isToday,
    });
  };

  const reset = () => {
    setDay(''); setMonth(''); setYear(''); setResult(null); setError('');
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
            <Text style={styles.heading}>Age</Text>
            <Text style={styles.headingAccent}>Calculator</Text>
          </View>
          {result && (
            <TouchableOpacity onPress={reset} style={styles.resetBtn} activeOpacity={0.75}>
              <Ionicons name="refresh-outline" size={16} color="#94a3b8" />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Input card ── */}
        <View style={styles.inputCard}>
          <Text style={styles.inputCardTitle}>DATE OF BIRTH</Text>

          <View style={styles.inputRow}>
            {/* Day */}
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>DD</Text>
              <TextInput
                style={styles.input}
                value={day}
                onChangeText={t => { if (/^\d{0,2}$/.test(t)) setDay(t); }}
                keyboardType="number-pad"
                placeholder="01"
                placeholderTextColor="#cbd5e1"
                maxLength={2}
                returnKeyType="next"
                textAlign="center"
              />
            </View>

            <Text style={styles.inputSep}>/</Text>

            {/* Month */}
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>MM</Text>
              <TextInput
                style={styles.input}
                value={month}
                onChangeText={t => { if (/^\d{0,2}$/.test(t)) setMonth(t); }}
                keyboardType="number-pad"
                placeholder="01"
                placeholderTextColor="#cbd5e1"
                maxLength={2}
                returnKeyType="next"
                textAlign="center"
              />
            </View>

            <Text style={styles.inputSep}>/</Text>

            {/* Year */}
            <View style={[styles.inputWrap, { flex: 1.6 }]}>
              <Text style={styles.inputLabel}>YYYY</Text>
              <TextInput
                style={styles.input}
                value={year}
                onChangeText={t => { if (/^\d{0,4}$/.test(t)) setYear(t); }}
                keyboardType="number-pad"
                placeholder="2000"
                placeholderTextColor="#cbd5e1"
                maxLength={4}
                returnKeyType="done"
                onSubmitEditing={calculate}
                textAlign="center"
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.calcBtn} onPress={calculate} activeOpacity={0.85}>
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={styles.calcBtnText}>Calculate Age</Text>
          </TouchableOpacity>
        </View>

        {/* ── Result ── */}
        {result && (
          <>
            {/* Birthday banner */}
            {result.isToday && (
              <View style={styles.birthdayBanner}>
                <Text style={styles.birthdayEmoji}>🎂</Text>
                <Text style={styles.birthdayText}>Happy Birthday!</Text>
              </View>
            )}

            {/* Main age card */}
            <View style={styles.ageCard}>
              <Text style={styles.ageCardLabel}>YOU ARE</Text>
              <View style={styles.ageRow}>
                <View style={styles.agePill}>
                  <Text style={styles.ageNum}>{result.years}</Text>
                  <Text style={styles.ageUnit}>yrs</Text>
                </View>
                <View style={styles.agePill}>
                  <Text style={styles.ageNum}>{result.months}</Text>
                  <Text style={styles.ageUnit}>mos</Text>
                </View>
                <View style={styles.agePill}>
                  <Text style={styles.ageNum}>{result.days}</Text>
                  <Text style={styles.ageUnit}>days</Text>
                </View>
              </View>
              <Text style={styles.ageSubText}>
                Born on a <Text style={{ color: '#3b82f6', fontWeight: '700' }}>{result.dayOfWeek}</Text>
              </Text>
            </View>

            {/* Stat grid */}
            <View style={styles.statGrid}>
              <StatCard label="Total Days"   value={result.totalDays.toLocaleString()}  color="#3b82f6" />
              <StatCard label="Total Weeks"  value={result.totalWeeks.toLocaleString()} color="#8b5cf6" />
              <StatCard label="Total Months" value={result.totalMonths}                  color="#f97316" />
              <StatCard
                label="Next Birthday"
                value={result.isToday ? 'Today!' : `${result.nextBdayDays}d`}
                sub={result.isToday ? '' : result.nextBdayDate}
                color="#ec4899"
              />
            </View>

            {/* Zodiac */}
            <View style={styles.zodiacCard}>
              <View style={styles.zodiacLeft}>
                <Text style={styles.zodiacIcon}>{result.zodiac.icon}</Text>
                <View>
                  <Text style={styles.zodiacTitle}>Zodiac Sign</Text>
                  <Text style={styles.zodiacSign}>{result.zodiac.sign}</Text>
                </View>
              </View>
              <View style={styles.zodiacRight}>
                <Ionicons name="sparkles-outline" size={18} color="#f59e0b" />
              </View>
            </View>

            {/* Month breakdown */}
            <View style={styles.monthCard}>
              <Text style={styles.monthCardTitle}>BIRTH MONTH</Text>
              <View style={styles.monthGrid}>
                {MONTHS.map((mn, i) => {
                  const active = i + 1 === parseInt(month);
                  return (
                    <View
                      key={mn}
                      style={[styles.monthChip, active && styles.monthChipActive]}
                    >
                      <Text style={[styles.monthChipText, active && styles.monthChipTextActive]}>
                        {mn}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { paddingHorizontal: 16, paddingBottom: 48 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 16,
  },
  heading: {
    fontSize: 30, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, lineHeight: 32,
  },
  headingAccent: {
    fontSize: 30, fontWeight: '800', color: '#3b82f6', letterSpacing: -0.5, lineHeight: 34,
  },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  resetText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },

  // Input card
  inputCard: {
    backgroundColor: '#ffffff', borderRadius: 20, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 14,
  },
  inputCardTitle: {
    fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.8,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  inputWrap: { flex: 1, gap: 6 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.5, textAlign: 'center' },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, paddingVertical: 12, fontSize: 20,
    fontWeight: '700', color: '#0f172a',
  },
  inputSep: { fontSize: 24, fontWeight: '300', color: '#cbd5e1', paddingBottom: 10 },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontSize: 12, color: '#ef4444', fontWeight: '500' },

  calcBtn: {
    backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  calcBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Birthday banner
  birthdayBanner: {
    backgroundColor: '#fef3c7', borderRadius: 14, borderWidth: 1, borderColor: '#fde68a',
    paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row',
    alignItems: 'center', gap: 10, marginBottom: 12,
  },
  birthdayEmoji: { fontSize: 24 },
  birthdayText:  { fontSize: 16, fontWeight: '700', color: '#92400e' },

  // Age card
  ageCard: {
    backgroundColor: '#ffffff', borderRadius: 20, padding: 20,
    marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 14,
    alignItems: 'center',
  },
  ageCardLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.8 },
  ageRow: { flexDirection: 'row', gap: 10 },
  agePill: {
    flex: 1, backgroundColor: '#eff6ff', borderRadius: 16, borderWidth: 1,
    borderColor: '#bfdbfe', paddingVertical: 16, alignItems: 'center', gap: 2,
  },
  ageNum:  { fontSize: 32, fontWeight: '800', color: '#1d4ed8', letterSpacing: -1 },
  ageUnit: { fontSize: 11, fontWeight: '600', color: '#60a5fa' },
  ageSubText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },

  // Stat grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: {
    width: '47.5%', flexGrow: 1, borderRadius: 14, borderWidth: 1,
    padding: 14, gap: 3,
  },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  statSub:   { fontSize: 10, fontWeight: '500', marginTop: 1 },

  // Zodiac
  zodiacCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  zodiacLeft:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  zodiacIcon:  { fontSize: 32 },
  zodiacTitle: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  zodiacSign:  { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  zodiacRight: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#fffbeb',
    borderWidth: 1, borderColor: '#fde68a', alignItems: 'center', justifyContent: 'center',
  },

  // Month grid
  monthCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 16, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  monthCardTitle: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.8 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
  },
  monthChipActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  monthChipText:   { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  monthChipTextActive: { color: '#2563eb' },
});