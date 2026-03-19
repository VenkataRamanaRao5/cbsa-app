import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type IPO = {
  id: string;
  company: string;
  sector: string;
  openDate: string;
  closeDate: string;
  priceRange: string;
  lotSize: number;
  minBid: number;
  status: 'OPEN' | 'UPCOMING' | 'CLOSED';
  rating: number; // 1-5
};

const IPO_LIST: IPO[] = [
  {
    id: '1',
    company: 'Aero Dynamics Ltd.',
    sector: 'Aerospace & Defence',
    openDate: '22 Mar 2026',
    closeDate: '24 Mar 2026',
    priceRange: '₹420 – ₹445',
    lotSize: 33,
    minBid: 14685,
    status: 'OPEN',
    rating: 4,
  },
  {
    id: '2',
    company: 'GreenPower Solutions',
    sector: 'Renewable Energy',
    openDate: '25 Mar 2026',
    closeDate: '27 Mar 2026',
    priceRange: '₹210 – ₹220',
    lotSize: 68,
    minBid: 14960,
    status: 'UPCOMING',
    rating: 5,
  },
  {
    id: '3',
    company: 'FinServe Technologies',
    sector: 'Financial Services',
    openDate: '10 Mar 2026',
    closeDate: '12 Mar 2026',
    priceRange: '₹315 – ₹330',
    lotSize: 45,
    minBid: 14850,
    status: 'CLOSED',
    rating: 3,
  },
  {
    id: '4',
    company: 'NexGenPharma Inc.',
    sector: 'Pharmaceuticals',
    openDate: '28 Mar 2026',
    closeDate: '30 Mar 2026',
    priceRange: '₹185 – ₹195',
    lotSize: 77,
    minBid: 15015,
    status: 'UPCOMING',
    rating: 4,
  },
];

const STATUS_STYLES: Record<IPO['status'], { bg: string; text: string; label: string }> = {
  OPEN: { bg: '#E8F5E9', text: '#2E7D32', label: 'Bidding Open' },
  UPCOMING: { bg: '#E3F2FD', text: '#1565C0', label: 'Upcoming' },
  CLOSED: { bg: '#FAFAFA', text: '#9E9E9E', label: 'Closed' },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <MaterialIcons
          key={i}
          name={i < rating ? 'star' : 'star-border'}
          size={13}
          color={i < rating ? '#FFA000' : '#BDBDBD'}
        />
      ))}
    </View>
  );
}

export default function IpoIndexScreen() {
  const collector = useBehavioralCollector();

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_IPO_LIST');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_IPO_LIST');
      return () => {};
    }, [collector])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_IPO_LIST_BACK');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_IPO_LIST_BACK');
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply IPO</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Eligibility banner */}
        <View style={styles.eligBanner}>
          <MaterialIcons name="verified-user" size={22} color="#1565C0" />
          <Text style={styles.eligText}>
            Your Demat account is linked. You are eligible to apply for IPOs via ASBA.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Current & Upcoming IPOs</Text>

        {IPO_LIST.map((ipo) => {
          const s = STATUS_STYLES[ipo.status];
          const canApply = ipo.status === 'OPEN';
          return (
            <View key={ipo.id} style={styles.ipoCard}>
              {/* Top row */}
              <View style={styles.ipoTopRow}>
                <View style={styles.ipoIconWrap}>
                  <MaterialIcons name="business" size={20} color="#5C6BC0" />
                </View>
                <View style={styles.ipoCompanyInfo}>
                  <Text style={styles.ipoCompanyName}>{ipo.company}</Text>
                  <Text style={styles.ipoSector}>{ipo.sector}</Text>
                  <StarRating rating={ipo.rating} />
                </View>
                <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.ipoDetails}>
                {[
                  { label: 'Price Range', value: ipo.priceRange },
                  { label: 'Lot Size', value: `${ipo.lotSize} shares` },
                  { label: 'Min Bid', value: `₹${ipo.minBid.toLocaleString('en-IN')}` },
                  { label: 'Open', value: ipo.openDate },
                  { label: 'Close', value: ipo.closeDate },
                ].map((d) => (
                  <View key={d.label} style={styles.ipoDetailItem}>
                    <Text style={styles.ipoDetailLabel}>{d.label}</Text>
                    <Text style={styles.ipoDetailValue}>{d.value}</Text>
                  </View>
                ))}
              </View>

              {/* Apply button */}
              <TouchableOpacity
                style={[styles.applyButton, !canApply && styles.applyButtonDisabled]}
                disabled={!canApply}
                onPress={() =>
                  router.push({
                    pathname: '/ipo/apply',
                    params: {
                      id: ipo.id,
                      company: ipo.company,
                      priceRange: ipo.priceRange,
                      lotSize: String(ipo.lotSize),
                      minBid: String(ipo.minBid),
                      closeDate: ipo.closeDate,
                    },
                  } as any)
                }
                onPressIn={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_IPO_APPLY_${ipo.id}`);
                }}
                onPressOut={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_IPO_APPLY_${ipo.id}`);
                }}
              >
                <Text style={[styles.applyButtonText, !canApply && styles.applyButtonTextDisabled]}>
                  {canApply ? 'Apply Now' : ipo.status === 'UPCOMING' ? 'Notify Me' : 'Closed'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.disclaimerCard}>
          <MaterialIcons name="info-outline" size={16} color="#78909C" />
          <Text style={styles.disclaimerText}>
            IPO investments are subject to market risk. ASBA amount is blocked until allotment. Read the Red Herring Prospectus before applying.
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
    backgroundColor: '#5C6BC0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  headerSpacer: { width: 36 },

  content: { flex: 1, paddingHorizontal: 16 },

  eligBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    gap: 10,
  },
  eligText: { flex: 1, fontSize: 13, color: '#1565C0', lineHeight: 18 },

  sectionLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 20,
    marginBottom: 12,
  },

  ipoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  ipoTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  ipoIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#E8EAF6', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  ipoCompanyInfo: { flex: 1 },
  ipoCompanyName: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 2 },
  ipoSector: { fontSize: 12, color: '#78909C', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },

  ipoDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#F9F9FB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  ipoDetailItem: { width: '30%', minWidth: 80 },
  ipoDetailLabel: { fontSize: 10, color: '#BDBDBD', fontWeight: '600', marginBottom: 2 },
  ipoDetailValue: { fontSize: 12, color: '#212121', fontWeight: '700' },

  applyButton: {
    backgroundColor: '#5C6BC0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonDisabled: { backgroundColor: '#EEEEEE' },
  applyButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  applyButtonTextDisabled: { color: '#9E9E9E' },

  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    gap: 8,
  },
  disclaimerText: { flex: 1, fontSize: 11, color: '#9E9E9E', lineHeight: 16 },
});
