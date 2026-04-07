import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

type TestState = 'idle' | 'testing' | 'done' | 'error';

interface SpeedResult {
  download: string;
  latency: string;
  rating: 'Poor' | 'Fair' | 'Good' | 'Great' | 'Excellent';
  ratingColor: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRating(mbps: number): Pick<SpeedResult, 'rating' | 'ratingColor'> {
  if (mbps < 1)  return { rating: 'Poor',      ratingColor: '#ef4444' };
  if (mbps < 5)  return { rating: 'Fair',      ratingColor: '#f97316' };
  if (mbps < 20) return { rating: 'Good',      ratingColor: '#eab308' };
  if (mbps < 50) return { rating: 'Great',     ratingColor: '#22c55e' };
  return           { rating: 'Excellent',   ratingColor: '#3b82f6' };
}

// ─── Animated Ring ────────────────────────────────────────────────────────────

function PulseRing({ active, color }: { active: boolean; color: string }) {
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.6)).current;
  const opacity2 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!active) {
      scale1.setValue(1); scale2.setValue(1);
      opacity1.setValue(0.6); opacity2.setValue(0.4);
      return;
    }
    const pulse1 = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale1, { toValue: 1.5, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale1, { toValue: 1,   duration: 1000, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity1, { toValue: 0, duration: 1000, useNativeDriver: true }),
          Animated.timing(opacity1, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        ]),
      ])
    );
    const pulse2 = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale2, { toValue: 1.8, duration: 1200, delay: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale2, { toValue: 1,   duration: 1200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity2, { toValue: 0, duration: 1200, delay: 300, useNativeDriver: true }),
          Animated.timing(opacity2, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
        ]),
      ])
    );
    pulse1.start(); pulse2.start();
    return () => { pulse1.stop(); pulse2.stop(); };
  }, [active]);

  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseRing, { borderColor: color, transform: [{ scale: scale2 }], opacity: opacity2 }]} />
      <Animated.View style={[styles.pulseRing, { borderColor: color, transform: [{ scale: scale1 }], opacity: opacity1 }]} />
    </View>
  );
}

// ─── Stat Box ─────────────────────────────────────────────────────────────────

function StatBox({ icon, label, value, unit, color }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string; unit: string; color: string;
}) {
  return (
    <View style={[styles.statBox, { borderColor: color + '33', backgroundColor: color + '0a' }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '18', borderColor: color + '33' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SpeedTest() {
  const [state,    setState]    = useState<TestState>('idle');
  const [result,   setResult]   = useState<SpeedResult | null>(null);
  const [phase,    setPhase]    = useState('');
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const btnScale     = useRef(new Animated.Value(1)).current;

  const animProgress = (to: number, duration: number) => {
    Animated.timing(progressAnim, {
      toValue: to, duration, easing: Easing.out(Easing.ease), useNativeDriver: false,
    }).start();
  };

  const testSpeed = async () => {
    setState('testing');
    setResult(null);
    setProgress(0);
    progressAnim.setValue(0);

    // Press animation
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.93, duration: 100, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      // Phase 1 – latency
      setPhase('Measuring latency...');
      animProgress(0.25, 600);
      const pingStart = Date.now();
      await fetch('https://jsonplaceholder.typicode.com/posts/1', { cache: 'no-store' });
      const latencyMs = Date.now() - pingStart;

      // Phase 2 – download
      setPhase('Testing download speed...');
      animProgress(0.7, 1200);
      const dlStart = Date.now();
      await fetch('https://jsonplaceholder.typicode.com/posts', { cache: 'no-store' });
      const dlDuration = (Date.now() - dlStart) / 1000;
      const sizeBytes  = 75000; // approx payload
      const mbps = (sizeBytes / dlDuration) / (1024 * 1024);

      // Phase 3 – done
      setPhase('Finishing up...');
      animProgress(1, 400);
      await new Promise(r => setTimeout(r, 500));

      const { rating, ratingColor } = getRating(mbps);
      setResult({
        download: mbps.toFixed(2),
        latency:  `${latencyMs}`,
        rating,
        ratingColor,
      });
      setState('done');
    } catch {
      setState('error');
      setPhase('');
    }
  };

  const reset = () => {
    setState('idle');
    setResult(null);
    setPhase('');
    progressAnim.setValue(0);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Center button color by state
  const btnColor   = state === 'error' ? '#ef4444' : state === 'done' ? (result?.ratingColor ?? '#3b82f6') : '#3b82f6';
  const btnLabel   = state === 'idle' ? 'START' : state === 'testing' ? 'TESTING' : state === 'done' ? 'RETEST' : 'RETRY';
  const btnIcon: React.ComponentProps<typeof Ionicons>['name'] =
    state === 'idle'    ? 'wifi-outline'      :
    state === 'testing' ? 'hourglass-outline' :
    state === 'done'    ? 'refresh-outline'   : 'refresh-outline';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Internet</Text>
          <Text style={styles.headingBlue}>Speed Test</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="wifi-outline" size={13} color="#3b82f6" />
          <Text style={styles.headerBadgeText}>Network</Text>
        </View>
      </View>

      {/* ── Main circle area ── */}
      <View style={styles.centerArea}>
        {/* Pulse rings */}
        <PulseRing active={state === 'testing'} color={btnColor} />

        {/* Main button circle */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            onPress={state === 'testing' ? undefined : state === 'idle' ? testSpeed : reset}
            activeOpacity={state === 'testing' ? 1 : 0.85}
            style={[styles.mainCircle, { borderColor: btnColor + '55', backgroundColor: btnColor + '12' }]}
          >
            <View style={[styles.innerCircle, { backgroundColor: btnColor }]}>
              <Ionicons name={btnIcon} size={32} color="#fff" />
              <Text style={styles.circleLabel}>{btnLabel}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Phase / rating label ── */}
      <View style={styles.phaseArea}>
        {state === 'testing' && (
          <Text style={styles.phaseText}>{phase}</Text>
        )}
        {state === 'done' && result && (
          <View style={[styles.ratingBadge, { backgroundColor: result.ratingColor + '18', borderColor: result.ratingColor + '44' }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={result.ratingColor} />
            <Text style={[styles.ratingText, { color: result.ratingColor }]}>{result.rating} connection</Text>
          </View>
        )}
        {state === 'error' && (
          <View style={[styles.ratingBadge, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
            <Text style={[styles.ratingText, { color: '#ef4444' }]}>Connection error — tap to retry</Text>
          </View>
        )}
        {state === 'idle' && (
          <Text style={styles.idleHint}>Tap the button above to begin</Text>
        )}
      </View>

      {/* ── Progress bar ── */}
      {state === 'testing' && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: btnColor }]} />
          </View>
        </View>
      )}

      {/* ── Result stats ── */}
      {state === 'done' && result && (
        <View style={styles.statsRow}>
          <StatBox
            icon="arrow-down-outline"
            label="Download"
            value={result.download}
            unit="Mbps"
            color="#3b82f6"
          />
          <StatBox
            icon="timer-outline"
            label="Latency"
            value={result.latency}
            unit="ms"
            color="#8b5cf6"
          />
        </View>
      )}

      {/* ── Info cards ── */}
      <View style={styles.infoRow}>
        {[
          { icon: 'cloud-download-outline' as const, label: 'Streaming HD', need: '5+ Mbps',  color: '#22c55e' },
          { icon: 'videocam-outline'        as const, label: 'Video calls',  need: '2+ Mbps',  color: '#f97316' },
          { icon: 'game-controller-outline' as const, label: 'Gaming',       need: '25+ Mbps', color: '#8b5cf6' },
        ].map(item => (
          <View key={item.label} style={[styles.infoCard, { borderColor: item.color + '30' }]}>
            <Ionicons name={item.icon} size={18} color={item.color} />
            <Text style={styles.infoCardLabel}>{item.label}</Text>
            <Text style={[styles.infoCardNeed, { color: item.color }]}>{item.need}</Text>
          </View>
        ))}
      </View>

      {/* ── Disclaimer ── */}
      <Text style={styles.disclaimer}>
        Results are approximate and may vary based on network conditions.
      </Text>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CIRCLE = 180;

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#f8fafc' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 8,
  },
  heading:     { fontSize: 26, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, lineHeight: 30 },
  headingBlue: { fontSize: 26, fontWeight: '800', color: '#3b82f6', letterSpacing: -0.5, lineHeight: 30 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  headerBadgeText: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },

  // Center circle
  centerArea: {
    alignItems: 'center', justifyContent: 'center',
    marginVertical: 24, height: CIRCLE + 80,
  },
  pulseWrap: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
    width: CIRCLE + 80, height: CIRCLE + 80,
  },
  pulseRing: {
    position: 'absolute',
    width: CIRCLE + 40, height: CIRCLE + 40,
    borderRadius: (CIRCLE + 40) / 2,
    borderWidth: 2,
  },
  mainCircle: {
    width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  innerCircle: {
    width: CIRCLE - 20, height: CIRCLE - 20, borderRadius: (CIRCLE - 20) / 2,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    shadowColor: '#3b82f6', shadowOpacity: 0.35, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  circleLabel: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },

  // Phase area
  phaseArea: { alignItems: 'center', minHeight: 36, marginBottom: 12 },
  phaseText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  idleHint:  { fontSize: 13, color: '#cbd5e1', fontWeight: '400' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  ratingText:  { fontSize: 14, fontWeight: '700' },

  // Progress
  progressWrap:  { paddingHorizontal: 40, marginBottom: 24 },
  progressTrack: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, borderRadius: 3 },

  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  statBox: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 16,
    alignItems: 'center', gap: 4,
  },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue:    { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  statUnit:     { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginTop: -4 },
  statLabel:    { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  // Info cards
  infoRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  infoCard: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1,
    padding: 12, alignItems: 'center', gap: 5,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  infoCardLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600', textAlign: 'center' },
  infoCardNeed:  { fontSize: 12, fontWeight: '800' },

  // Disclaimer
  disclaimer: { textAlign: 'center', fontSize: 11, color: '#cbd5e1', paddingHorizontal: 24 },
});