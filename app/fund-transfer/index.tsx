import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TransferMethod = {
  id: string;
  label: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  event: string;
  route: string;
};

const TRANSFER_METHODS: TransferMethod[] = [
  {
    id: '1',
    label: 'UPI Transfer',
    subtitle: 'Send via UPI ID / mobile number',
    icon: 'swap-horiz',
    event: 'TOUCH_TRANSFER_METHOD_UPI',
    route: '/fund-transfer/beneficiary?method=UPI',
  },
  {
    id: '2',
    label: 'NEFT',
    subtitle: 'National Electronic Funds Transfer',
    icon: 'account-balance',
    event: 'TOUCH_TRANSFER_METHOD_NEFT',
    route: '/fund-transfer/beneficiary?method=NEFT',
  },
  {
    id: '3',
    label: 'IMPS',
    subtitle: 'Immediate Payment Service (24×7)',
    icon: 'flash-on',
    event: 'TOUCH_TRANSFER_METHOD_IMPS',
    route: '/fund-transfer/beneficiary?method=IMPS',
  },
  {
    id: '4',
    label: 'RTGS',
    subtitle: 'Real-Time Gross Settlement (₹2L+)',
    icon: 'speed',
    event: 'TOUCH_TRANSFER_METHOD_RTGS',
    route: '/fund-transfer/beneficiary?method=RTGS',
  },
  {
    id: '5',
    label: 'Own Account Transfer',
    subtitle: 'Move funds between your accounts',
    icon: 'compare-arrows',
    event: 'TOUCH_TRANSFER_METHOD_SELF',
    route: '/fund-transfer/beneficiary?method=SELF',
  },
  {
    id: '6',
    label: 'Within Bank Transfer',
    subtitle: 'Transfer to another Baroda account',
    icon: 'business',
    event: 'TOUCH_TRANSFER_METHOD_WITHIN_BANK',
    route: '/fund-transfer/beneficiary?method=WITHIN_BANK',
  },
];

export default function FundTransferHubScreen() {
  const collector = useBehavioralCollector();

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_FUND_TRANSFER_HUB');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_FUND_TRANSFER_HUB');
      return () => {};
    }, [collector])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_FT_HUB_BACK');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_FT_HUB_BACK');
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fund Transfer</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Select transfer type</Text>

        {TRANSFER_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={styles.methodCard}
            onPress={() => router.push(method.route as any)}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, method.event);
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, method.event);
            }}
          >
            <View style={styles.methodIconWrap}>
              <MaterialIcons name={method.icon} size={26} color="#FF5722" />
            </View>
            <View style={styles.methodText}>
              <Text style={styles.methodLabel}>{method.label}</Text>
              <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#BDBDBD" />
          </TouchableOpacity>
        ))}

        {/* Info card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={18} color="#5C6BC0" />
          <Text style={styles.infoText}>
            All transfers are protected by two-factor authentication. Limits apply per transfer type.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#FF5722',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  headerSpacer: { width: 36 },

  content: { flex: 1, paddingHorizontal: 16 },

  sectionLabel: {
    fontSize: 13,
    color: '#9E9E9E',
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  methodIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  methodText: { flex: 1 },
  methodLabel: { fontSize: 15, fontWeight: '600', color: '#212121', marginBottom: 2 },
  methodSubtitle: { fontSize: 12, color: '#78909C' },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8EAF6',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 12, color: '#5C6BC0', lineHeight: 18 },
});
