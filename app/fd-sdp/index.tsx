import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type SchemeType = {
  id: string;
  label: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  badge?: string;
  event: string;
  depositType: string;
};

const SCHEME_TYPES: SchemeType[] = [
  {
    id: '1',
    label: 'Fixed Deposit (FD)',
    subtitle: 'Earn guaranteed returns on a lump-sum deposit for a fixed tenure',
    icon: 'lock',
    badge: 'Up to 7.75% p.a.',
    event: 'TOUCH_FD_SELECT',
    depositType: 'FD',
  },
  {
    id: '2',
    label: 'Systematic Deposit Plan (SDP)',
    subtitle: 'Invest a fixed amount monthly and earn FD-equivalent returns',
    icon: 'repeat',
    badge: 'Up to 7.65% p.a.',
    event: 'TOUCH_SDP_SELECT',
    depositType: 'SDP',
  },
];

const TENOR_HIGHLIGHTS = [
  { label: '7–45 days', rate: '4.00%' },
  { label: '46–179 days', rate: '5.75%' },
  { label: '180 days–1 yr', rate: '6.50%' },
  { label: '1–2 years', rate: '7.25%' },
  { label: '2–3 years', rate: '7.50%' },
  { label: '3–5 years', rate: '7.75%' },
];

export default function FdSdpIndexScreen() {
  const collector = useBehavioralCollector();

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_FD_SDP');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_FD_SDP');
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
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_FD_SDP_BACK');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_FD_SDP_BACK');
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fixed / Systematic Deposit</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Scheme selection */}
        <Text style={styles.sectionLabel}>Choose Deposit Type</Text>
        {SCHEME_TYPES.map((scheme) => (
          <TouchableOpacity
            key={scheme.id}
            style={styles.schemeCard}
            onPress={() =>
              router.push({
                pathname: '/fd-sdp/details',
                params: { depositType: scheme.depositType },
              } as any)
            }
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, scheme.event);
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, scheme.event);
            }}
          >
            <View style={styles.schemeIconWrap}>
              <MaterialIcons name={scheme.icon} size={28} color="#FF5722" />
            </View>
            <View style={styles.schemeText}>
              <View style={styles.schemeTitleRow}>
                <Text style={styles.schemeLabel}>{scheme.label}</Text>
                {scheme.badge && (
                  <View style={styles.schemeBadge}>
                    <Text style={styles.schemeBadgeText}>{scheme.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.schemeSubtitle}>{scheme.subtitle}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#BDBDBD" />
          </TouchableOpacity>
        ))}

        {/* Interest rate card */}
        <Text style={styles.sectionLabel}>Interest Rate Guide</Text>
        <View style={styles.rateCard}>
          <View style={styles.rateCardHeader}>
            <MaterialIcons name="percent" size={18} color="#5C6BC0" />
            <Text style={styles.rateCardTitle}>Regular FD Rates (% p.a.)</Text>
          </View>
          {TENOR_HIGHLIGHTS.map((t) => (
            <View key={t.label} style={styles.rateRow}>
              <Text style={styles.rateLabel}>{t.label}</Text>
              <Text style={styles.rateValue}>{t.rate}</Text>
            </View>
          ))}
          <Text style={styles.rateDisclaimer}>
            Senior citizens earn +0.50% extra. Rates subject to change.
          </Text>
        </View>

        {/* Tax savings callout */}
        <View style={styles.taxCard}>
          <MaterialIcons name="info-outline" size={18} color="#1565C0" />
          <Text style={styles.taxText}>
            5-year Tax Saver FD qualifies for ₹1.5L deduction under Section 80C of IT Act.
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
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 24,
    marginBottom: 12,
  },

  schemeCard: {
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
  schemeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  schemeText: { flex: 1 },
  schemeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  schemeLabel: { fontSize: 15, fontWeight: '700', color: '#212121' },
  schemeBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  schemeBadgeText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  schemeSubtitle: { fontSize: 12, color: '#78909C', lineHeight: 17 },

  rateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  rateCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  rateCardTitle: { fontSize: 14, fontWeight: '700', color: '#212121' },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  rateLabel: { fontSize: 13, color: '#546E7A' },
  rateValue: { fontSize: 13, fontWeight: '700', color: '#FF5722' },
  rateDisclaimer: { fontSize: 11, color: '#BDBDBD', marginTop: 8, lineHeight: 15 },

  taxCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    gap: 10,
  },
  taxText: { flex: 1, fontSize: 12, color: '#1565C0', lineHeight: 18 },
});
