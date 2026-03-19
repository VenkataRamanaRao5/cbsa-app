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

const TENORS = ['7 days', '30 days', '90 days', '180 days', '1 year', '2 years', '3 years', '5 years'];
const ACCOUNTS = ['Savings A/C ••••2783', 'Savings A/C ••••4521'];
const SDP_MONTHS = ['6', '12', '24', '36', '48', '60'];

function calcMaturity(amount: number, tenorLabel: string, depositType: string): string {
  const rateMap: Record<string, number> = {
    '7 days': 0.04, '30 days': 0.0575, '90 days': 0.065,
    '180 days': 0.065, '1 year': 0.0725, '2 years': 0.075,
    '3 years': 0.075, '5 years': 0.0775,
  };
  const rate = rateMap[tenorLabel] ?? 0.07;
  const years = depositType === 'SDP' ? parseInt(tenorLabel, 10) / 12 : (
    tenorLabel.includes('day') ? parseInt(tenorLabel) / 365 : parseInt(tenorLabel)
  );
  const maturity = amount * Math.pow(1 + rate / 4, 4 * years);
  return maturity.toFixed(2);
}

export default function FdSdpDetailsScreen() {
  const collector = useBehavioralCollector();
  const { depositType } = useLocalSearchParams<{ depositType: string }>();
  const isSDP = depositType === 'SDP';

  const [amount, setAmount] = useState('');
  const [selectedTenor, setSelectedTenor] = useState(isSDP ? '12' : '1 year');
  const [selectedAccount, setSelectedAccount] = useState(ACCOUNTS[0]);
  const [nomineeName, setNomineeName] = useState('');

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, `PAGE_ENTER_FD_SDP_DETAILS_${depositType}`);
      collector?.recordTouchEnd(0, 0, 0, `PAGE_ENTER_FD_SDP_DETAILS_${depositType}`);
      return () => {};
    }, [collector, depositType])
  );

  const tenorOptions = isSDP ? SDP_MONTHS.map((m) => `${m} months`) : TENORS;
  const amtNum = parseFloat(amount) || 0;
  const maturityAmt = amtNum > 0 ? calcMaturity(amtNum, selectedTenor, depositType) : null;
  const minAmount = isSDP ? 1000 : 5000;

  const canProceed = amtNum >= minAmount && selectedTenor && selectedAccount;

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
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_FD_DETAILS_BACK');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_FD_DETAILS_BACK');
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{isSDP ? 'Systematic Deposit Plan' : 'Fixed Deposit'}</Text>
          <Text style={styles.headerSubtitle}>Fill deposit details</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Amount */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>
            {isSDP ? `Monthly Instalment (min ₹${minAmount.toLocaleString('en-IN')})` : `Deposit Amount (min ₹${minAmount.toLocaleString('en-IN')})`}
          </Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#BDBDBD"
              keyboardType="numeric"
              value={amount}
              onChangeText={(t) => {
                collector?.recordKeystroke(`KEYSTROKE_FD_${depositType}_AMOUNT`);
                setAmount(t);
              }}
            />
          </View>
          {maturityAmt && (
            <View style={styles.maturityBanner}>
              <MaterialIcons name="trending-up" size={16} color="#2E7D32" />
              <Text style={styles.maturityText}>
                Estimated maturity: <Text style={styles.maturityValue}>₹{parseFloat(maturityAmt).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Tenor */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{isSDP ? 'Duration' : 'Tenor'}</Text>
          <View style={styles.chipRow}>
            {tenorOptions.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, selectedTenor === t && styles.chipSelected]}
                onPress={() => setSelectedTenor(t)}
                onPressIn={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_FD_TENOR_${t.replace(/\s/g, '_').toUpperCase()}`);
                }}
                onPressOut={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_FD_TENOR_${t.replace(/\s/g, '_').toUpperCase()}`);
                }}
              >
                <Text style={[styles.chipText, selectedTenor === t && styles.chipTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Debit account */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Debit From</Text>
          {ACCOUNTS.map((acc) => (
            <TouchableOpacity
              key={acc}
              style={styles.accountRow}
              onPress={() => setSelectedAccount(acc)}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_FD_SELECT_ACCOUNT');
              }}
              onPressOut={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_FD_SELECT_ACCOUNT');
              }}
            >
              <View style={styles.radioOuter}>
                {selectedAccount === acc && <View style={styles.radioInner} />}
              </View>
              <View style={styles.accountIcon}>
                <MaterialIcons name="account-balance" size={16} color="#5C6BC0" />
              </View>
              <Text style={styles.accountText}>{acc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nominee */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Nominee Name (optional)</Text>
          <TextInput
            style={styles.textField}
            placeholder="Enter nominee's full name"
            value={nomineeName}
            onChangeText={(t) => {
              collector?.recordKeystroke('KEYSTROKE_FD_NOMINEE');
              setNomineeName(t);
            }}
          />
        </View>

        {/* Terms notice */}
        <View style={styles.noticeCard}>
          <MaterialIcons name="gavel" size={16} color="#FF5722" />
          <Text style={styles.noticeText}>
            Premature withdrawal is permitted with a 1% interest penalty. Auto-renewal is enabled by default.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.proceedButton, !canProceed && styles.proceedButtonDisabled]}
          disabled={!canProceed}
          onPress={() =>
            router.push({
              pathname: '/fd-sdp/review',
              params: {
                depositType,
                amount,
                tenor: selectedTenor,
                account: selectedAccount,
                nomineeName,
                maturityAmt: maturityAmt ?? '0',
              },
            } as any)
          }
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_FD_DETAILS_PROCEED');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_FD_DETAILS_PROCEED');
          }}
        >
          <Text style={styles.proceedButtonText}>Proceed to Review</Text>
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

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  fieldLabel: { fontSize: 12, color: '#9E9E9E', fontWeight: '600', marginBottom: 10 },

  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { fontSize: 28, fontWeight: '700', color: '#FF5722', marginRight: 4 },
  amountInput: { fontSize: 36, fontWeight: '700', color: '#212121', flex: 1 },

  maturityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  maturityText: { fontSize: 13, color: '#2E7D32' },
  maturityValue: { fontWeight: '700' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  chipSelected: { borderColor: '#FF5722', backgroundColor: '#FFF3E0' },
  chipText: { fontSize: 13, color: '#9E9E9E', fontWeight: '600' },
  chipTextSelected: { color: '#FF5722' },

  accountRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#FF5722',
    justifyContent: 'center', alignItems: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF5722' },
  accountIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#E8EAF6', justifyContent: 'center', alignItems: 'center',
  },
  accountText: { fontSize: 14, color: '#212121', fontWeight: '600' },

  textField: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
    fontSize: 14,
    color: '#212121',
  },

  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    gap: 10,
  },
  noticeText: { flex: 1, fontSize: 12, color: '#E64A19', lineHeight: 17 },

  footer: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12 },
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
