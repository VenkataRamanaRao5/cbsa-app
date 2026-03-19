import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TxType = 'CR' | 'DR';
type FilterType = 'All' | 'Credit' | 'Debit';

type Transaction = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  type: TxType;
  date: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  refNo: string;
};

const ALL_TRANSACTIONS: Transaction[] = [
  { id: '1', title: 'UPI Transfer', subtitle: 'To: Ramana Rao', amount: 5000, type: 'DR', date: 'Today, 10:23 AM', icon: 'swap-horiz', refNo: 'BOB1234567890' },
  { id: '2', title: 'Salary Credit', subtitle: 'From: EMPLOYER CORP', amount: 85000, type: 'CR', date: 'Mar 18, 09:00 AM', icon: 'account-balance', refNo: 'BOB0987654321' },
  { id: '3', title: 'Mobile Recharge', subtitle: 'Jio Prepaid ₹299', amount: 299, type: 'DR', date: 'Mar 17, 06:45 PM', icon: 'smartphone', refNo: 'BOB1122334455' },
  { id: '4', title: 'IMPS Received', subtitle: 'From: Suresh Kumar', amount: 2000, type: 'CR', date: 'Mar 16, 03:30 PM', icon: 'flash-on', refNo: 'BOB2233445566' },
  { id: '5', title: 'Electricity Bill', subtitle: 'BESCOM Q1 2026', amount: 1450, type: 'DR', date: 'Mar 15, 11:00 AM', icon: 'lightbulb', refNo: 'BOB3344556677' },
  { id: '6', title: 'FD Interest', subtitle: 'Fixed Deposit #4821', amount: 3200, type: 'CR', date: 'Mar 14, 08:00 AM', icon: 'savings', refNo: 'BOB4455667788' },
  { id: '7', title: 'NEFT Transfer', subtitle: 'To: HDFC Loan A/C', amount: 12000, type: 'DR', date: 'Mar 13, 02:15 PM', icon: 'account-balance', refNo: 'BOB5566778899' },
  { id: '8', title: 'Google Pay', subtitle: 'From: Priya Sharma', amount: 500, type: 'CR', date: 'Mar 12, 07:30 PM', icon: 'smartphone', refNo: 'BOB6677889900' },
  { id: '9', title: 'Amazon Pay', subtitle: 'Online shopping', amount: 1299, type: 'DR', date: 'Mar 11, 04:00 PM', icon: 'shopping-cart', refNo: 'BOB7788990011' },
  { id: '10', title: 'ATM Withdrawal', subtitle: 'SBI ATM, MG Road', amount: 3000, type: 'DR', date: 'Mar 10, 12:00 PM', icon: 'local-atm', refNo: 'BOB8899001122' },
  { id: '11', title: 'Rent Credit', subtitle: 'From: Deepika Nair', amount: 15000, type: 'CR', date: 'Mar 09, 09:00 AM', icon: 'home', refNo: 'BOB9900112233' },
  { id: '12', title: 'Bus Booking', subtitle: 'RedBus – BLR to HYD', amount: 750, type: 'DR', date: 'Mar 08, 10:30 AM', icon: 'directions-bus', refNo: 'BOB0011223344' },
];

const FILTERS: FilterType[] = ['All', 'Credit', 'Debit'];

export default function PassbookScreen() {
  const collector = useBehavioralCollector();
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const lastY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_PASSBOOK');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_PASSBOOK');
      return () => {};
    }, [collector])
  );

  const filtered = ALL_TRANSACTIONS.filter((t) => {
    if (activeFilter === 'Credit') return t.type === 'CR';
    if (activeFilter === 'Debit') return t.type === 'DR';
    return true;
  });

  const totalCredit = ALL_TRANSACTIONS.filter((t) => t.type === 'CR').reduce((s, t) => s + t.amount, 0);
  const totalDebit = ALL_TRANSACTIONS.filter((t) => t.type === 'DR').reduce((s, t) => s + t.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PASSBOOK_BACK');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PASSBOOK_BACK');
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Passbook</Text>
        <TouchableOpacity
          style={styles.downloadButton}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PASSBOOK_DOWNLOAD');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PASSBOOK_DOWNLOAD');
          }}
        >
          <MaterialIcons name="download" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Summary strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Credits</Text>
          <Text style={[styles.summaryValue, styles.creditColor]}>+₹{totalCredit.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Debits</Text>
          <Text style={[styles.summaryValue, styles.debitColor]}>-₹{totalDebit.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_PASSBOOK_FILTER_${f.toUpperCase()}`);
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_PASSBOOK_FILTER_${f.toUpperCase()}`);
            }}
          >
            <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.list}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const dy = y - lastY.current;
          lastY.current = y;
          collector?.recordScroll(dy, 'SCROLL_PASSBOOK');
        }}
      >
        {filtered.map((tx) => (
          <TouchableOpacity
            key={tx.id}
            style={styles.txRow}
            onPress={() => router.push(`/transaction/${tx.id}` as any)}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_PASSBOOK_TX_${tx.id}`);
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_PASSBOOK_TX_${tx.id}`);
            }}
          >
            <View style={[styles.txIcon, tx.type === 'CR' ? styles.txIconCredit : styles.txIconDebit]}>
              <MaterialIcons
                name={tx.icon}
                size={20}
                color={tx.type === 'CR' ? '#43A047' : '#E53935'}
              />
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txTitle}>{tx.title}</Text>
              <Text style={styles.txSubtitle}>{tx.subtitle}</Text>
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>
            <View style={styles.txRight}>
              <Text style={[styles.txAmount, tx.type === 'CR' ? styles.creditColor : styles.debitColor]}>
                {tx.type === 'CR' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.txRef}>{tx.refNo.slice(0, 10)}…</Text>
            </View>
          </TouchableOpacity>
        ))}
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
    gap: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  downloadButton: { padding: 6 },

  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#9E9E9E', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  summaryDivider: { width: 1, backgroundColor: '#E0E0E0', marginHorizontal: 16 },
  creditColor: { color: '#43A047' },
  debitColor: { color: '#E53935' },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  filterChipActive: { borderColor: '#FF5722', backgroundColor: '#FFF3E0' },
  filterChipText: { fontSize: 13, color: '#9E9E9E', fontWeight: '600' },
  filterChipTextActive: { color: '#FF5722' },

  list: { flex: 1, paddingHorizontal: 16, marginTop: 8 },

  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txIconCredit: { backgroundColor: '#E8F5E9' },
  txIconDebit: { backgroundColor: '#FFEBEE' },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: '600', color: '#212121' },
  txSubtitle: { fontSize: 12, color: '#78909C', marginTop: 2 },
  txDate: { fontSize: 11, color: '#BDBDBD', marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '700' },
  txRef: { fontSize: 10, color: '#BDBDBD', marginTop: 2 },
});
