import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type DetailRow = { label: string; value: string; highlight?: boolean };

export default function TransferReviewScreen() {
  const collector = useBehavioralCollector();
  const params = useLocalSearchParams<{
    method: string;
    beneficiaryName: string;
    beneficiaryId: string;
    beneficiaryBank: string;
    amount: string;
    remarks: string;
  }>();

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_TRANSFER_REVIEW');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_TRANSFER_REVIEW');
      return () => {};
    }, [collector])
  );

  const rows: DetailRow[] = [
    { label: 'Transfer Type', value: params.method ?? '' },
    { label: 'To', value: params.beneficiaryName ?? '' },
    { label: 'Identifier', value: params.beneficiaryId ?? '' },
    { label: 'Bank', value: params.beneficiaryBank ?? '' },
    { label: 'From Account', value: 'Savings •••• 2783' },
    { label: 'Amount', value: `₹${params.amount}`, highlight: true },
    ...(params.remarks ? [{ label: 'Remarks', value: params.remarks }] : []),
  ];

  const charges = params.method === 'NEFT' || params.method === 'RTGS' ? '₹2.00' : 'Free';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_REVIEW_BACK');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_REVIEW_BACK');
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Transfer</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount hero */}
        <View style={styles.amountHero}>
          <Text style={styles.amountLabel}>You are sending</Text>
          <Text style={styles.amountValue}>₹{params.amount}</Text>
          <Text style={styles.chargeText}>Service charge: {charges}</Text>
        </View>

        {/* Details card */}
        <View style={styles.detailsCard}>
          {rows.map((row, i) => (
            <View
              key={row.label}
              style={[styles.detailRow, i !== rows.length - 1 && styles.detailRowBorder]}
            >
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={[styles.detailValue, row.highlight && styles.detailValueHighlight]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Security notice */}
        <View style={styles.securityNote}>
          <MaterialIcons name="lock" size={16} color="#43A047" />
          <Text style={styles.securityText}>
            This transfer is secured and verified by bobWorld. Never share your PIN with anyone.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Confirm button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.back()}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_REVIEW_EDIT');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_REVIEW_EDIT');
          }}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => router.push({ pathname: '/fund-transfer/pin', params } as any)}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_REVIEW_CONFIRM');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_REVIEW_CONFIRM');
          }}
        >
          <Text style={styles.confirmButtonText}>Confirm & Pay</Text>
          <MaterialIcons name="lock" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
    gap: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  headerSpacer: { width: 36 },

  content: { flex: 1, paddingHorizontal: 16 },

  amountHero: {
    backgroundColor: '#1A237E',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 28,
    marginTop: 20,
    marginBottom: 16,
  },
  amountLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  amountValue: { fontSize: 40, fontWeight: '800', color: '#FFFFFF' },
  chargeText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 8 },

  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  detailLabel: { fontSize: 13, color: '#9E9E9E' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#212121', maxWidth: '60%', textAlign: 'right' },
  detailValueHighlight: { fontSize: 16, color: '#FF5722' },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  securityText: { flex: 1, fontSize: 12, color: '#2E7D32', lineHeight: 17 },

  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 12,
    gap: 12,
    backgroundColor: '#F5F7FA',
  },
  editButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#FF5722',
    alignItems: 'center',
  },
  editButtonText: { color: '#FF5722', fontSize: 15, fontWeight: '700' },
  confirmButton: {
    flex: 2,
    backgroundColor: '#FF5722',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
