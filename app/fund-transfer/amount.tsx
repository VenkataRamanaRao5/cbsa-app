import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const QUICK_AMOUNTS = ['500', '1000', '2000', '5000', '10000'];

export default function TransferAmountScreen() {
  const collector = useBehavioralCollector();
  const params = useLocalSearchParams<{
    method: string;
    beneficiaryName: string;
    beneficiaryId: string;
    beneficiaryBank: string;
  }>();
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_TRANSFER_AMOUNT');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_TRANSFER_AMOUNT');
      return () => {};
    }, [collector])
  );

  const handleProceed = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    router.push({
      pathname: '/fund-transfer/review',
      params: { ...params, amount, remarks },
    } as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_AMOUNT_BACK');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_AMOUNT_BACK');
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Enter Amount</Text>
          <Text style={styles.headerSubtitle}>{params.method} Transfer</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Beneficiary summary */}
        <View style={styles.beneficiarySummary}>
          <View style={styles.bAvatar}>
            <Text style={styles.bAvatarText}>
              {(params.beneficiaryName ?? '?').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.bInfo}>
            <Text style={styles.bName}>{params.beneficiaryName}</Text>
            <Text style={styles.bId}>{params.beneficiaryId}</Text>
            <Text style={styles.bBank}>{params.beneficiaryBank}</Text>
          </View>
        </View>

        {/* From account */}
        <View style={styles.fromAccount}>
          <MaterialIcons name="account-balance" size={18} color="#5C6BC0" />
          <Text style={styles.fromLabel}>
            From: <Text style={styles.fromValue}>Savings A/C •••• 2783</Text>
          </Text>
          <Text style={styles.fromBalance}>Bal: ₹69,420</Text>
        </View>

        {/* Amount input */}
        <View style={styles.amountCard}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor="#BDBDBD"
            keyboardType="numeric"
            value={amount}
            onChangeText={(t) => {
              collector?.recordKeystroke('KEYSTROKE_TRANSFER_AMOUNT');
              setAmount(t);
            }}
          />
        </View>

        {/* Quick-select amounts */}
        <View style={styles.quickAmounts}>
          {QUICK_AMOUNTS.map((qa) => (
            <TouchableOpacity
              key={qa}
              style={styles.quickChip}
              onPress={() => setAmount(qa)}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_QUICK_AMOUNT_${qa}`);
              }}
              onPressOut={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_QUICK_AMOUNT_${qa}`);
              }}
            >
              <Text style={styles.quickChipText}>₹{qa}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Remarks */}
        <View style={styles.remarksWrap}>
          <Text style={styles.remarksLabel}>Remarks (optional)</Text>
          <TextInput
            style={styles.remarksInput}
            placeholder="e.g. Rent, Bill payment"
            value={remarks}
            onChangeText={(t) => {
              collector?.recordKeystroke('KEYSTROKE_TRANSFER_REMARKS');
              setRemarks(t);
            }}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Proceed button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.proceedButton, !amount && styles.proceedButtonDisabled]}
          disabled={!amount}
          onPress={handleProceed}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_AMOUNT_PROCEED');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_AMOUNT_PROCEED');
          }}
        >
          <Text style={styles.proceedButtonText}>Proceed</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerSpacer: { width: 36 },

  content: { flex: 1, paddingHorizontal: 16 },

  beneficiarySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  bAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bAvatarText: { fontSize: 14, fontWeight: '700', color: '#5C6BC0' },
  bInfo: { flex: 1 },
  bName: { fontSize: 15, fontWeight: '600', color: '#212121' },
  bId: { fontSize: 12, color: '#5C6BC0', marginTop: 2 },
  bBank: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },

  fromAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EAF6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    gap: 8,
  },
  fromLabel: { flex: 1, fontSize: 13, color: '#546E7A' },
  fromValue: { fontWeight: '600', color: '#1A237E' },
  fromBalance: { fontSize: 13, fontWeight: '600', color: '#FF5722' },

  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 24,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  currencySymbol: { fontSize: 32, fontWeight: '700', color: '#FF5722', marginRight: 4 },
  amountInput: {
    fontSize: 40,
    fontWeight: '700',
    color: '#212121',
    minWidth: 120,
    textAlign: 'center',
  },

  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FF5722',
    backgroundColor: '#FFF3E0',
  },
  quickChipText: { fontSize: 13, color: '#FF5722', fontWeight: '600' },

  remarksWrap: { marginTop: 20 },
  remarksLabel: { fontSize: 13, color: '#9E9E9E', fontWeight: '600', marginBottom: 8 },
  remarksInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#212121',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  footer: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: '#F5F7FA',
  },
  proceedButton: {
    backgroundColor: '#FF5722',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  proceedButtonDisabled: { backgroundColor: '#BDBDBD' },
  proceedButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
