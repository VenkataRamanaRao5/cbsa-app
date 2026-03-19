import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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

type Step = 1 | 2 | 3 | 4;

const RECENT_CONTACTS = [
  { id: '1', name: 'Ramana Rao', upi: 'ramana@upi', initials: 'RR' },
  { id: '2', name: 'Suresh K', upi: '9876543210@okaxis', initials: 'SK' },
  { id: '3', name: 'Priya S', upi: 'priya.sharma@ybl', initials: 'PS' },
  { id: '4', name: 'Anil V', upi: 'anil@paytm', initials: 'AV' },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PayScreen() {
  const [step, setStep] = useState<Step>(1);
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [mpin, setMpin] = useState('');
  const [mpinError, setMpinError] = useState('');
  const collector = useBehavioralCollector();

  const refNumber = `BOB${Date.now().toString().slice(-10)}`;

  // Shuffled MPIN keypad (randomized once on mount for the session)
  const shuffledKeys = useMemo(() => shuffleArray(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']), []);

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_PAY');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_PAY');
      return () => {
        setStep(1);
        setUpiId('');
        setAmount('');
        setRemarks('');
        setMpin('');
      };
    }, [collector])
  );

  const handleMpinKey = (key: string) => {
    if (mpin.length >= 6) return;
    collector?.recordKeystroke('KEYSTROKE_UPI_MPIN');
    const next = mpin + key;
    setMpin(next);
    setMpinError('');
    if (next.length === 6) {
      // Accept any 6-digit MPIN and go to success
      setTimeout(() => setStep(4), 400);
    }
  };

  const handleMpinDelete = () => {
    if (mpin.length === 0) return;
    collector?.recordKeystroke('KEYSTROKE_UPI_MPIN_DELETE');
    setMpin((p) => p.slice(0, -1));
  };

  // ── Step 1: Enter UPI / Select Contact ───────────────────────────────────
  if (step === 1) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>UPI Quick Pay</Text>
          <TouchableOpacity
            onPress={() => router.push('/fund-transfer')}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PAY_MORE_OPTIONS');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PAY_MORE_OPTIONS');
            }}
          >
            <Text style={styles.headerLink}>More options</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* UPI ID Input */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>UPI ID / Mobile / Account</Text>
            <View style={styles.upiInputRow}>
              <TextInput
                style={styles.upiInput}
                placeholder="name@upi or 10-digit mobile"
                placeholderTextColor="#BDBDBD"
                value={upiId}
                autoCapitalize="none"
                onChangeText={(t) => {
                  collector?.recordKeystroke('KEYSTROKE_UPI_ID');
                  setUpiId(t);
                }}
              />
              {upiId.length > 4 && (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="check-circle" size={18} color="#43A047" />
                </View>
              )}
            </View>
          </View>

          {/* Recent contacts */}
          <Text style={styles.sectionLabel}>Recent</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentList}>
            {RECENT_CONTACTS.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.contactChip}
                onPress={() => setUpiId(c.upi)}
                onPressIn={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_PAY_RECENT_${c.id}`);
                }}
                onPressOut={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_PAY_RECENT_${c.id}`);
                }}
              >
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactInitials}>{c.initials}</Text>
                </View>
                <Text style={styles.contactName} numberOfLines={1}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Scan QR shortcut */}
          <TouchableOpacity
            style={styles.qrCard}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PAY_SCAN_QR');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PAY_SCAN_QR');
            }}
          >
            <MaterialIcons name="qr-code-scanner" size={24} color="#5C6BC0" />
            <Text style={styles.qrCardText}>Scan QR Code to Pay</Text>
            <MaterialIcons name="chevron-right" size={22} color="#BDBDBD" />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.proceedButton, !upiId && styles.proceedButtonDisabled]}
            disabled={!upiId}
            onPress={() => setStep(2)}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PAY_STEP1_NEXT');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PAY_STEP1_NEXT');
            }}
          >
            <Text style={styles.proceedButtonText}>Next</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Step 2: Enter Amount ─────────────────────────────────────────────────
  if (step === 2) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setStep(1)}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PAY_STEP2_BACK');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PAY_STEP2_BACK');
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { marginLeft: 12 }]}>Enter Amount</Text>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* To whom */}
          <View style={styles.recipientBanner}>
            <View style={styles.recipientAvatar}>
              <Text style={styles.recipientInitials}>
                {upiId.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.recipientUpi}>{upiId}</Text>
              <Text style={styles.recipientBank}>UPI</Text>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.amountCard}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#BDBDBD"
              keyboardType="numeric"
              value={amount}
              onChangeText={(t) => {
                collector?.recordKeystroke('KEYSTROKE_PAY_AMOUNT');
                setAmount(t);
              }}
            />
          </View>

          {/* Quick amounts */}
          <View style={styles.quickAmounts}>
            {['100', '500', '1000', '2000'].map((qa) => (
              <TouchableOpacity
                key={qa}
                style={styles.quickChip}
                onPress={() => setAmount(qa)}
                onPressIn={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_PAY_QUICK_${qa}`);
                }}
                onPressOut={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_PAY_QUICK_${qa}`);
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
              placeholder="Add a note"
              value={remarks}
              onChangeText={(t) => {
                collector?.recordKeystroke('KEYSTROKE_PAY_REMARKS');
                setRemarks(t);
              }}
            />
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.proceedButton, !amount && styles.proceedButtonDisabled]}
            disabled={!amount}
            onPress={() => setStep(3)}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PAY_STEP2_NEXT');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PAY_STEP2_NEXT');
            }}
          >
            <Text style={styles.proceedButtonText}>Pay ₹{amount || '0'}</Text>
            <MaterialIcons name="lock" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Step 3: MPIN ─────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => { setMpin(''); setStep(2); }}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PAY_MPIN_BACK');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PAY_MPIN_BACK');
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { marginLeft: 12 }]}>Enter UPI PIN</Text>
        </View>

        <View style={styles.pinBody}>
          <View style={styles.lockWrap}>
            <MaterialIcons name="lock" size={36} color="#FF5722" />
          </View>
          <Text style={styles.pinTitle}>Enter your 6-digit UPI PIN</Text>
          <Text style={styles.pinSub}>Paying ₹{amount} to {upiId}</Text>

          <View style={styles.pinDots}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i < mpin.length ? styles.dotFilled : styles.dotEmpty]}
              />
            ))}
          </View>
          {mpinError ? <Text style={styles.errorText}>{mpinError}</Text> : null}

          <View style={styles.keypad}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.keyRow}>
                {shuffledKeys.slice(row * 3, row * 3 + 3).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.key}
                    onPress={() => handleMpinKey(key)}
                    onPressIn={(e) => {
                      const { pageX, pageY, force } = e.nativeEvent;
                      collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PAY_MPIN_KEY');
                    }}
                    onPressOut={(e) => {
                      const { pageX, pageY, force } = e.nativeEvent;
                      collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PAY_MPIN_KEY');
                    }}
                  >
                    <Text style={styles.keyText}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <View style={styles.keyRow}>
              <TouchableOpacity
                style={styles.key}
                onPress={() => handleMpinKey(shuffledKeys[9])}
                onPressIn={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PAY_MPIN_KEY');
                }}
                onPressOut={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PAY_MPIN_KEY');
                }}
              >
                <Text style={styles.keyText}>{shuffledKeys[9]}</Text>
              </TouchableOpacity>
              <View style={styles.keyEmpty} />
              <TouchableOpacity
                style={styles.key}
                onPress={handleMpinDelete}
                onPressIn={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PAY_MPIN_DELETE');
                }}
                onPressOut={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PAY_MPIN_DELETE');
                }}
              >
                <MaterialIcons name="backspace" size={22} color="#546E7A" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ── Step 4: Success receipt ───────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.successBody}>
        <View style={styles.successCircle}>
          <MaterialIcons name="check" size={44} color="#FFFFFF" />
        </View>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSub}>₹{amount} sent to {upiId}</Text>

        <View style={styles.receiptCard}>
          <ReceiptRow label="Amount" value={`₹${amount}`} highlight />
          <ReceiptRow label="To" value={upiId} />
          <ReceiptRow label="Via" value="UPI" />
          {remarks ? <ReceiptRow label="Remarks" value={remarks} /> : null}
          <ReceiptRow label="Reference" value={refNumber} mono />
          <ReceiptRow label="Status" value="SUCCESS" green />
        </View>

        <View style={styles.successActions}>
          <TouchableOpacity
            style={styles.newPayButton}
            onPress={() => { setStep(1); setUpiId(''); setAmount(''); setRemarks(''); setMpin(''); }}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PAY_SUCCESS_NEW');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PAY_SUCCESS_NEW');
            }}
          >
            <Text style={styles.newPayButtonText}>New Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homePayButton}
            onPress={() => router.replace('/(tabs)')}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PAY_SUCCESS_HOME');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PAY_SUCCESS_HOME');
            }}
          >
            <MaterialIcons name="home" size={18} color="#FFFFFF" />
            <Text style={styles.homePayButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ReceiptRow({
  label, value, highlight, mono, green,
}: {
  label: string; value: string; highlight?: boolean; mono?: boolean; green?: boolean;
}) {
  return (
    <View style={receiptStyles.row}>
      <Text style={receiptStyles.label}>{label}</Text>
      <Text style={[
        receiptStyles.value,
        highlight && receiptStyles.valueHighlight,
        mono && receiptStyles.valueMono,
        green && receiptStyles.valueGreen,
      ]}>
        {value}
      </Text>
    </View>
  );
}

const receiptStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  label: { fontSize: 13, color: '#9E9E9E' },
  value: { fontSize: 13, fontWeight: '600', color: '#212121', maxWidth: '60%', textAlign: 'right' },
  valueHighlight: { fontSize: 18, color: '#FF5722' },
  valueMono: { fontSize: 11, color: '#5C6BC0' },
  valueGreen: { color: '#43A047', fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#212121', flex: 1 },
  headerLink: { fontSize: 13, color: '#FF5722', fontWeight: '600' },

  content: { flex: 1, paddingHorizontal: 16 },

  inputCard: {
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
  inputLabel: { fontSize: 12, color: '#9E9E9E', fontWeight: '600', marginBottom: 8 },
  upiInputRow: { flexDirection: 'row', alignItems: 'center' },
  upiInput: { flex: 1, fontSize: 15, color: '#212121', paddingVertical: 4 },
  verifiedBadge: { marginLeft: 8 },

  sectionLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },

  recentList: { marginBottom: 0 },
  contactChip: { alignItems: 'center', marginRight: 16, width: 60 },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactInitials: { fontSize: 14, fontWeight: '700', color: '#5C6BC0' },
  contactName: { fontSize: 11, color: '#546E7A', textAlign: 'center' },

  qrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  qrCardText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#212121' },

  recipientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  recipientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientInitials: { fontSize: 14, fontWeight: '700', color: '#5C6BC0' },
  recipientUpi: { fontSize: 14, fontWeight: '600', color: '#212121' },
  recipientBank: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },

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

  quickAmounts: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
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

  // PIN screen
  pinBody: { flex: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },
  lockWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pinTitle: { fontSize: 17, fontWeight: '700', color: '#212121', textAlign: 'center', marginBottom: 6 },
  pinSub: { fontSize: 13, color: '#78909C', textAlign: 'center', marginBottom: 32 },
  pinDots: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  dotEmpty: { borderWidth: 2, borderColor: '#BDBDBD' },
  dotFilled: { backgroundColor: '#FF5722' },
  errorText: { color: '#E53935', fontSize: 13, marginBottom: 12 },
  keypad: { width: '100%', maxWidth: 320, marginTop: 24 },
  keyRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  keyText: { fontSize: 24, fontWeight: '600', color: '#212121' },
  keyEmpty: { width: 72, height: 72 },

  // Success screen
  successBody: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  successCircle: {
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
  successSub: { fontSize: 13, color: '#78909C', marginBottom: 24 },
  receiptCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 24,
  },
  successActions: { flexDirection: 'row', width: '100%', gap: 12 },
  newPayButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#FF5722',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  newPayButtonText: { color: '#FF5722', fontWeight: '700', fontSize: 14 },
  homePayButton: {
    flex: 1,
    backgroundColor: '#FF5722',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  homePayButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
