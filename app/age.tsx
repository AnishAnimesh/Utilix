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
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── Zodiac using MaterialCommunityIcons ──────────────────────────────────────
// All icon names verified to exist in MaterialCommunityIcons

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function getZodiac(month: number, day: number): { sign: string; icon: MCIcon; color: string } {
  if ((month === 12 && day >= 22) || (month === 1  && day <= 19)) return { sign: 'Capricorn',   icon: 'star-crescent',      color: '#6366f1' };
  if ((month === 1  && day >= 20) || (month === 2  && day <= 18)) return { sign: 'Aquarius',    icon: 'water',              color: '#3b82f6' };
  if ((month === 2  && day >= 19) || (month === 3  && day <= 20)) return { sign: 'Pisces',      icon: 'fish',               color: '#06b6d4' };
  if ((month === 3  && day >= 21) || (month === 4  && day <= 19)) return { sign: 'Aries',       icon: 'fire',               color: '#ef4444' };
  if ((month === 4  && day >= 20) || (month === 5  && day <= 20)) return { sign: 'Taurus',      icon: 'leaf',               color: '#22c55e' };
  if ((month === 5  && day >= 21) || (month === 6  && day <= 20)) return { sign: 'Gemini',      icon: 'account-multiple',   color: '#f59e0b' };
  if ((month === 6  && day >= 21) || (month === 7  && day <= 22)) return { sign: 'Cancer',      icon: 'moon-waning-crescent', color: '#8b5cf6' };
  if ((month === 7  && day >= 23) || (month === 8  && day <= 22)) return { sign: 'Leo',         icon: 'shield-sun',         color: '#f97316' };
  if ((month === 8  && day >= 23) || (month === 9  && day <= 22)) return { sign: 'Virgo',       icon: 'flower',             color: '#10b981' };
  if ((month === 9  && day >= 23) || (month === 10 && day <= 22)) return { sign: 'Libra',       icon: 'scale-balance',      color: '#3b82f6' };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { sign: 'Scorpio',     icon: 'lightning-bolt',     color: '#dc2626' };
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { sign: 'Sagittarius', icon: 'bow-arrow',          color: '#7c3aed' };
  return { sign: 'Capricorn', icon: 'star-crescent', color: '#6366f1' };
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <View style={[s.statCard, { borderColor: color + '33', backgroundColor: color + '0c' }]}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub ? <Text style={[s.statSub, { color: color + 'bb' }]}>{sub}</Text> : null}
    </View>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgeResult {
  years: number; months: number; days: number;
  totalDays: number; totalWeeks: number; totalMonths: number;
  nextBdayDays: number; nextBdayDate: string;
  zodiac: { sign: string; icon: MCIcon; color: string };
  dayOfWeek: string; isToday: boolean;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AgeCalculator() {
  const [day,    setDay]    = useState('');
  const [month,  setMonth]  = useState('');
  const [year,   setYear]   = useState('');
  const [result, setResult] = useState<AgeResult | null>(null);
  const [error,  setError]  = useState('');

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
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (birth > today) { setError('Date cannot be in the future'); return; }

    let years  = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth()    - birth.getMonth();
    let days   = today.getDate()     - birth.getDate();
    if (days < 0)   { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }

    const diffMs      = today.getTime() - birth.getTime();
    const totalDays   = Math.floor(diffMs / 86400000);
    const totalWeeks  = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;

    let next = new Date(today.getFullYear(), m - 1, d);
    const isToday = next.getTime() === today.getTime();
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    const nextBdayDays = Math.ceil((next.getTime() - today.getTime()) / 86400000);
    const nextBdayDate = next.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const dayOfWeek    = birth.toLocaleDateString('en-IN', { weekday: 'long' });

    setResult({
      years, months, days, totalDays, totalWeeks, totalMonths,
      nextBdayDays, nextBdayDate, zodiac: getZodiac(m, d), dayOfWeek, isToday,
    });
  };

  const reset = () => { setDay(''); setMonth(''); setYear(''); setResult(null); setError(''); };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.heading}>Age</Text>
            <Text style={s.headingBlue}>Calculator</Text>
          </View>
          {result && (
            <TouchableOpacity onPress={reset} style={s.resetBtn} activeOpacity={0.75}>
              <Ionicons name="refresh-outline" size={15} color="#94a3b8" />
              <Text style={s.resetText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Input Card ── */}
        <View style={s.card}>
          <Text style={s.cardLabel}>DATE OF BIRTH</Text>
          <View style={s.inputRow}>
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>DD</Text>
              <TextInput
                style={s.input} value={day}
                onChangeText={t => { if (/^\d{0,2}$/.test(t)) setDay(t); }}
                keyboardType="number-pad" placeholder="01"
                placeholderTextColor="#cbd5e1" maxLength={2} textAlign="center"
              />
            </View>
            <Text style={s.sep}>/</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>MM</Text>
              <TextInput
                style={s.input} value={month}
                onChangeText={t => { if (/^\d{0,2}$/.test(t)) setMonth(t); }}
                keyboardType="number-pad" placeholder="01"
                placeholderTextColor="#cbd5e1" maxLength={2} textAlign="center"
              />
            </View>
            <Text style={s.sep}>/</Text>
            <View style={[s.inputWrap, { flex: 1.6 }]}>
              <Text style={s.inputLabel}>YYYY</Text>
              <TextInput
                style={s.input} value={year}
                onChangeText={t => { if (/^\d{0,4}$/.test(t)) setYear(t); }}
                keyboardType="number-pad" placeholder="2000"
                placeholderTextColor="#cbd5e1" maxLength={4}
                returnKeyType="done" onSubmitEditing={calculate} textAlign="center"
              />
            </View>
          </View>

          {error ? (
            <View style={s.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color="#ef4444" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={s.calcBtn} onPress={calculate} activeOpacity={0.85}>
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={s.calcBtnText}>Calculate Age</Text>
          </TouchableOpacity>
        </View>

        {result && (
          <>
            {/* Birthday banner */}
            {result.isToday && (
              <View style={s.bdayBanner}>
                <Ionicons name="gift-outline" size={22} color="#92400e" />
                <Text style={s.bdayText}>Happy Birthday!</Text>
              </View>
            )}

            {/* Age pills */}
            <View style={s.ageCard}>
              <Text style={s.cardLabel}>YOU ARE</Text>
              <View style={s.ageRow}>
                {[
                  { val: result.years,  unit: 'yrs'  },
                  { val: result.months, unit: 'mos'  },
                  { val: result.days,   unit: 'days' },
                ].map(item => (
                  <View key={item.unit} style={s.agePill}>
                    <Text style={s.ageNum}>{item.val}</Text>
                    <Text style={s.ageUnit}>{item.unit}</Text>
                  </View>
                ))}
              </View>
              <Text style={s.bornText}>
                Born on a{' '}
                <Text style={{ color: '#3b82f6', fontWeight: '700' }}>{result.dayOfWeek}</Text>
              </Text>
            </View>

            {/* Stat grid */}
            <View style={s.statGrid}>
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

            {/* Zodiac card */}
            <View style={s.zodiacCard}>
              <View style={s.zodiacLeft}>
                <View style={[s.zodiacIconBubble, { backgroundColor: result.zodiac.color + '18', borderColor: result.zodiac.color + '44' }]}>
                  <MaterialCommunityIcons
                    name={result.zodiac.icon}
                    size={26}
                    color={result.zodiac.color}
                  />
                </View>
                <View>
                  <Text style={s.zodiacLabel}>Zodiac Sign</Text>
                  <Text style={s.zodiacSign}>{result.zodiac.sign}</Text>
                </View>
              </View>
              <View style={s.sparkBadge}>
                <Ionicons name="sparkles-outline" size={17} color="#f59e0b" />
              </View>
            </View>

            {/* Month grid */}
            <View style={s.card}>
              <Text style={s.cardLabel}>BIRTH MONTH</Text>
              <View style={s.monthGrid}>
                {MONTHS.map((mn, i) => {
                  const active = i + 1 === parseInt(month);
                  return (
                    <View key={mn} style={[s.monthChip, active && s.monthChipActive]}>
                      <Text style={[s.monthChipText, active && s.monthChipTextActive]}>{mn}</Text>
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

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { paddingHorizontal: 16, paddingBottom: 48 },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 16 },
  heading:     { fontSize: 30, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, lineHeight: 32 },
  headingBlue: { fontSize: 30, fontWeight: '800', color: '#3b82f6', letterSpacing: -0.5, lineHeight: 34 },
  resetBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  resetText:   { fontSize: 13, fontWeight: '600', color: '#94a3b8' },

  card:      { backgroundColor: '#ffffff', borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 14 },
  cardLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.8 },

  inputRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  inputWrap:  { flex: 1, gap: 6 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.5, textAlign: 'center' },
  input:      { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 12, fontSize: 20, fontWeight: '700', color: '#0f172a' },
  sep:        { fontSize: 24, fontWeight: '300', color: '#cbd5e1', paddingBottom: 10 },

  errorRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontSize: 12, color: '#ef4444', fontWeight: '500' },

  calcBtn:     { backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  calcBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  bdayBanner: { backgroundColor: '#fef3c7', borderRadius: 14, borderWidth: 1, borderColor: '#fde68a', paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  bdayText:   { fontSize: 16, fontWeight: '700', color: '#92400e' },

  ageCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 14, alignItems: 'center' },
  ageRow:  { flexDirection: 'row', gap: 10 },
  agePill: { flex: 1, backgroundColor: '#eff6ff', borderRadius: 16, borderWidth: 1, borderColor: '#bfdbfe', paddingVertical: 16, alignItems: 'center', gap: 2 },
  ageNum:  { fontSize: 32, fontWeight: '800', color: '#1d4ed8', letterSpacing: -1 },
  ageUnit: { fontSize: 11, fontWeight: '600', color: '#60a5fa' },
  bornText:{ fontSize: 13, color: '#94a3b8', fontWeight: '500' },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: { width: '47.5%', flexGrow: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 3 },
  statValue:{ fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel:{ fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  statSub:  { fontSize: 10, fontWeight: '500', marginTop: 1 },

  zodiacCard:       { backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  zodiacLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  zodiacIconBubble: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  zodiacLabel:      { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  zodiacSign:       { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  sparkBadge:       { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', alignItems: 'center', justifyContent: 'center' },

  monthGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthChip:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  monthChipActive:     { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  monthChipText:       { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  monthChipTextActive: { color: '#2563eb' },
});