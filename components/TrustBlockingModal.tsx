/**
 * TrustBlockingModal
 *
 * Full-screen blocking overlay that appears when the CBSA trust engine
 * classifies the current session as RISK (consecutive RISK decisions or
 * trust score < 0.20). The user cannot dismiss this modal or interact with
 * any underlying screen until they re-authenticate with their PIN.
 *
 * Re-authentication calls logout() which navigates back to the login screen,
 * resets all session state, and starts a fresh authentication session.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTrustState } from '@/services/BehavioralContext';
import { useAuth } from '@/app/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function trustBar(score: number | null): string {
  if (score === null) return '░░░░░░░░░░';
  const filled = Math.round(score * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function formatScore(score: number | null): string {
  return score !== null ? (score * 100).toFixed(0) + '%' : '--';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TrustBlockingModal() {
  const { trustState, clearBlock } = useTrustState();
  const { logout } = useAuth();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse the warning icon while modal is visible
  useEffect(() => {
    if (!trustState.isBlocked) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.00, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [trustState.isBlocked]);

  const handleReauthenticate = () => {
    clearBlock();   // reset consecutive counters
    logout();       // navigate to login screen; starts fresh session
  };

  const { trustScore, consecutiveRisk, anomalyIndicator, similarityScore } = trustState;

  return (
    <Modal
      visible={trustState.isBlocked}
      transparent
      animationType="fade"
      statusBarTranslucent
      // onRequestBack is intentionally omitted — Android back button must not dismiss
    >
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* Icon */}
          <Animated.Text style={[styles.icon, { transform: [{ scale: pulseAnim }] }]}>
            ⛔
          </Animated.Text>

          {/* Title */}
          <Text style={styles.title}>Session Suspended</Text>
          <Text style={styles.subtitle}>
            Continuous behavioral analysis has detected an anomaly in this session.
            Access has been suspended to protect your account.
          </Text>

          {/* Trust metrics */}
          <View style={styles.metricsBox}>
            <MetricRow label="Trust Score" value={formatScore(trustScore)} bar={trustBar(trustScore)} danger />
            <MetricRow label="Consecutive Risk" value={String(consecutiveRisk)} />
            <MetricRow label="Anomaly Signal" value={formatScore(anomalyIndicator)} />
            <MetricRow label="Profile Match"  value={formatScore(similarityScore)} />
          </View>

          {/* Re-auth button */}
          <TouchableOpacity style={styles.button} onPress={handleReauthenticate} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Re-Authenticate</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            You will be returned to the login screen. All session data has been cleared.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function MetricRow({
  label,
  value,
  bar,
  danger,
}: {
  label: string;
  value: string;
  bar?: string;
  danger?: boolean;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricRight}>
        {bar && <Text style={styles.metricBar}>{bar}</Text>}
        <Text style={[styles.metricValue, danger && styles.metricDanger]}>{value}</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#e74c3c',
    alignItems: 'center',
    shadowColor: '#e74c3c',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  icon: {
    fontSize: 52,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#e74c3c',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  metricsBox: {
    width: '100%',
    backgroundColor: '#0d0d1a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e3a',
  },
  metricLabel: {
    color: '#888',
    fontSize: 12,
    flex: 1,
  },
  metricRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricBar: {
    color: '#e74c3c',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  metricValue: {
    color: '#ddd',
    fontSize: 13,
    fontWeight: '600',
    minWidth: 38,
    textAlign: 'right',
  },
  metricDanger: {
    color: '#e74c3c',
  },
  button: {
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 14,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    lineHeight: 16,
  },
});
