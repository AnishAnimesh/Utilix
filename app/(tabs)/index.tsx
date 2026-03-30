import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 48) / 2; // 2 columns with 16px padding each side + 16px gap

// ─── Feature definitions ──────────────────────────────────────────────────────

const FEATURES = [
  {
    title: 'Calculator',
    subtitle: 'Scientific & standard',
    icon: 'calculator-outline' as const,
    route: '/calculator',
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    title: 'Unit Converter',
    subtitle: '6 categories',
    icon: 'swap-horizontal-outline' as const,
    route: '/unit',
    color: '#22c55e',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    title: 'Finance Tracker',
    subtitle: 'Track expenses',
    icon: 'wallet-outline' as const,
    route: '/finance',
    color: '#f97316',
    bg: '#fff7ed',
    border: '#fed7aa',
  },
  {
    title: 'Password Gen',
    subtitle: 'Secure vault',
    icon: 'shield-checkmark-outline' as const,
    route: '/password',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  {
    title: 'Currency',
    subtitle: '15 currencies',
    icon: 'cash-outline' as const,
    route: '/currency',
    color: '#06b6d4',
    bg: '#ecfeff',
    border: '#a5f3fc',
  },
  {
    title: 'Split Bill',
    subtitle: 'Splitwise style',
    icon: 'people-outline' as const,
    route: '/split',
    color: '#1dbf73',
    bg: '#f0fdf4',
    border: '#86efac',
  },
  {
    title: 'Reminder',
    subtitle: 'Never forget',
    icon: 'alarm-outline' as const,
    route: '/reminder',
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  {
    title: 'Age Calculator',
    subtitle: 'Date & time',
    icon: 'calendar-outline' as const,
    route: '/age',
    color: '#ec4899',
    bg: '#fdf2f8',
    border: '#fbcfe8',
  },
  {
    title: 'Internet Speed',
    subtitle: 'Network test',
    icon: 'speedometer-outline' as const,
    route: '/speed',
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
  },
];

// ─── Animated Card ────────────────────────────────────────────────────────────

function FeatureCard({
  item,
  index,
  animValue,
}: {
  item: (typeof FEATURES)[0];
  index: number;
  animValue: Animated.Value;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => router.push(item.route as any)}
        style={[
          styles.card,
          {
            backgroundColor: item.bg,
            borderColor: item.border,
          },
        ]}
      >
        {/* Icon bubble */}
        <View style={[styles.iconBubble, { backgroundColor: item.color + '20', borderColor: item.color + '40' }]}>
          <Ionicons name={item.icon} size={26} color={item.color} />
        </View>

        {/* Text */}
        <View style={styles.cardTextWrap}>
          <Text style={[styles.cardTitle, { color: '#0f172a' }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.cardSubtitle, { color: item.color }]} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>

        {/* Arrow */}
        <View style={[styles.arrowDot, { backgroundColor: item.color + '15' }]}>
          <Ionicons name="chevron-forward" size={12} color={item.color} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  // One animated value per card for staggered entry
  const animValues = useRef(FEATURES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = animValues.map((val, i) =>
      Animated.timing(val, {
        toValue: 1,
        duration: 400,
        delay: 80 + i * 60,   // stagger: each card 60ms after previous
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
  }, []);

  // Header fade-in
  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      delay: 0,
      useNativeDriver: true,
    }).start();
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: headerAnim,
                transform: [{
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-16, 0],
                  }),
                }],
              },
            ]}
          >
            <View>
              <Text style={styles.greeting}>Good day 👋</Text>
              <Text style={styles.appName}>Utilix</Text>
              <Text style={styles.date}>{today}</Text>
            </View>
            <View style={styles.headerBadge}>
              <Ionicons name="apps-outline" size={20} color="#3b82f6" />
              <Text style={styles.headerBadgeText}>{FEATURES.length} tools</Text>
            </View>
          </Animated.View>

          {/* ── Search-style decoration ── */}
          <Animated.View style={[styles.searchBar, { opacity: headerAnim }]}>
            <Ionicons name="search-outline" size={16} color="#94a3b8" />
            <Text style={styles.searchText}>Find a tool...</Text>
          </Animated.View>

          {/* ── Grid ── */}
          <View style={styles.grid}>
            {FEATURES.map((item, i) => (
              <FeatureCard
                key={item.route}
                item={item}
                index={i}
                animValue={animValues[i]}
              />
            ))}
          </View>

          {/* ── Footer note ── */}
          <Animated.Text style={[styles.footer, { opacity: headerAnim }]}>
            Tap any tool to get started
          </Animated.Text>
        </ScrollView>
      </SafeAreaView>
    </>
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
    paddingTop: Platform.OS === 'android' ? 20 : 8,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 2,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -1,
    lineHeight: 36,
  },
  date: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 3,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  headerBadgeText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },

  // Decorative search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  searchText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '400',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Card
  cardWrap: {
    width: CARD_W,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: 'relative',
  },
  iconBubble: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  arrowDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#e2e8f0',
    marginTop: 24,
    fontWeight: '500',
  },
});