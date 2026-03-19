import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TransferSuccessScreen() {
  const collector = useBehavioralCollector();
  const params = useLocalSearchParams<{
    method: string;
    beneficiaryName: string;
    beneficiaryId: string;
    amount: string;
  }>();

  // Generate a fake reference number once
  const refNumber = `BOB${Date.now().toString().slice(-10)}`;
  const dateStr = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_TRANSFER_SUCCESS');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_TRANSFER_SUCCESS');
      return () => {};
    }, [collector])
  );

  return (
    <View style={styles.container}>
      {/* Success hero */}
      <View style={styles.heroSection}>
        <View style={styles.checkCircle}>
          <MaterialIcons name="check" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.successTitle}>Transfer Successful!</Text>
        <Text style={styles.successSubtitle}>Your money is on its way</Text>
      </View>

      {/* Receipt card */}
      <View style={styles.receiptCard}>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Amount Sent</Text>
          <Text style={styles.receiptAmount}>₹{params.amount}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>To</Text>
          <Text style={styles.receiptValue}>{params.beneficiaryName}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Via</Text>
          <Text style={styles.receiptValue}>{params.method}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Date & Time</Text>
          <Text style={styles.receiptValue}>{dateStr}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Reference No.</Text>
          <Text style={[styles.receiptValue, styles.refNumber]}>{refNumber}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Status</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>SUCCESS</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.shareButton}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TRANSFER_SHARE_RECEIPT');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TRANSFER_SHARE_RECEIPT');
          }}
        >
          <MaterialIcons name="share" size={18} color="#FF5722" />
          <Text style={styles.shareButtonText}>Share Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newTransferButton}
          onPress={() => router.replace('/fund-transfer')}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TRANSFER_SUCCESS_NEW');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TRANSFER_SUCCESS_NEW');
          }}
        >
          <Text style={styles.newTransferButtonText}>New Transfer</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => router.replace('/(tabs)')}
        onPressIn={(e) => {
          const { pageX, pageY, force } = e.nativeEvent;
          collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TRANSFER_SUCCESS_HOME');
        }}
        onPressOut={(e) => {
          const { pageX, pageY, force } = e.nativeEvent;
          collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TRANSFER_SUCCESS_HOME');
        }}
      >
        <MaterialIcons name="home" size={18} color="#FFFFFF" />
        <Text style={styles.homeButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  heroSection: { alignItems: 'center', marginBottom: 32 },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#43A047',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#43A047',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#212121', marginBottom: 6 },
  successSubtitle: { fontSize: 14, color: '#78909C' },

  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  receiptLabel: { fontSize: 13, color: '#9E9E9E' },
  receiptAmount: { fontSize: 22, fontWeight: '800', color: '#43A047' },
  receiptValue: { fontSize: 14, fontWeight: '600', color: '#212121', maxWidth: '55%', textAlign: 'right' },
  refNumber: { fontSize: 12, color: '#5C6BC0', fontFamily: 'monospace' },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginVertical: 4 },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '700', color: '#43A047' },

  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#FF5722',
    borderRadius: 14,
    paddingVertical: 14,
  },
  shareButtonText: { fontSize: 14, fontWeight: '600', color: '#FF5722' },
  newTransferButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#1A237E',
    alignItems: 'center',
  },
  newTransferButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF5722',
    borderRadius: 14,
    paddingVertical: 16,
  },
  homeButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
