import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type ViewState = 'review' | 'pin' | 'success';

export default function FdSdpReviewScreen() {
  const collector = useBehavioralCollector();
  const params = useLocalSearchParams<{
    depositType: string;
    amount: string;
    tenor: string;
    account: string;
    nomineeName: string;
    maturityAmt: string;
  }>();

  const [viewState, setViewState] = useState<ViewState>('review');
  const [pin, setPin] = useState('');

  const shuffledKeys = useMemo(() => shuffleArray(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']), []);

  const refNumber = `FD${Date.now().toString().slice(-10)}`;
  const dateStr = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_FD_SDP_REVIEW');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_FD_SDP_REVIEW');
      return () => {};
    }, [collector])
  );

  const handlePinKey = (key: string) => {
    if (pin.length >= 6) return;
    collector?.recordKeystroke('KEYSTROKE_FD_PIN');
    const next = pin + key;
    setPin(next);
    if (next.length === 6) {
      setTimeout(() => setViewState('success'), 400);
    }
  };

  const handlePinDelete = () => {
    if (pin.length === 0) return;
    collector?.recordKeystroke('KEYSTROKE_FD_PIN_DELETE');
    setPin((p) => p.slice(0, -1));
  };

  // ── Review ────────────────────────────────────────────────────────────────
  if (viewState === 'review') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_FD_REVIEW_BACK');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_FD_REVIEW_BACK');
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review & Confirm</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.amountHero}>
            <Text style={styles.heroLabel}>{params.depositType === 'SDP' ? 'Monthly Instalment' : 'Deposit Amount'}</Text>
            <Text style={styles.heroAmount}>₹{parseFloat(params.amount).toLocaleString('en-IN')}</Text>
            {params.maturityAmt && params.maturityAmt !== '0' && (
              <Text style={styles.heroSub}>
                Est. maturity: ₹{parseFloat(params.maturityAmt).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
            )}
          </View>

          <View style={styles.detailCard}>
            {[
              { label: 'Deposit Type', value: params.depositType },
              { label: params.depositType === 'SDP' ? 'Duration' : 'Tenor', value: params.tenor },
              { label: 'Debit From', value: params.account },
              ...(params.nomineeName ? [{ label: 'Nominee', value: params.nomineeName }] : []),
            ].map((row, i, arr) => (
              <View key={row.label} style={[styles.detailRow, i < arr.length - 1 && styles.detailRowBorder]}>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.securityNote}>
            <MaterialIcons name="lock" size={16} color="#43A047" />
            <Text style={styles.securityText}>
              You will need to authorise with your 6-digit Transaction PIN on the next step.
            </Text>
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.back()}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_FD_REVIEW_EDIT');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_FD_REVIEW_EDIT');
            }}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => setViewState('pin')}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_FD_REVIEW_CONFIRM');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_FD_REVIEW_CONFIRM');
            }}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
            <MaterialIcons name="lock" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── PIN ──────────────────────────────────────────────────────────────────
  if (viewState === 'pin') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => { setPin(''); setViewState('review'); }}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_FD_PIN_BACK');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_FD_PIN_BACK');
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction PIN</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.pinBody}>
          <View style={styles.lockWrap}>
            <MaterialIcons name="lock" size={36} color="#FF5722" />
          </View>
          <Text style={styles.pinPrompt}>Enter your 6-digit Transaction PIN</Text>
          <Text style={styles.pinSub}>
            Creating {params.depositType} of ₹{parseFloat(params.amount).toLocaleString('en-IN')}
          </Text>
          <View style={styles.pinDots}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.dot, i < pin.length ? styles.dotFilled : styles.dotEmpty]} />
            ))}
          </View>
          <View style={styles.keypad}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.keyRow}>
                {shuffledKeys.slice(row * 3, row * 3 + 3).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.key}
                    onPress={() => handlePinKey(key)}
                    onPressIn={(e) => {
                      const { pageX, pageY, force } = e.nativeEvent;
                      collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_FD_PIN_KEY');
                    }}
                    onPressOut={(e) => {
                      const { pageX, pageY, force } = e.nativeEvent;
                      collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_FD_PIN_KEY');
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
                onPress={() => handlePinKey(shuffledKeys[9])}
                onPressIn={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_FD_PIN_KEY');
                }}
                onPressOut={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_FD_PIN_KEY');
                }}
              >
                <Text style={styles.keyText}>{shuffledKeys[9]}</Text>
              </TouchableOpacity>
              <View style={styles.keyEmpty} />
              <TouchableOpacity
                style={styles.key}
                onPress={handlePinDelete}
                onPressIn={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_FD_PIN_DELETE');
                }}
                onPressOut={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_FD_PIN_DELETE');
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

  // ── Success ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.successBody}>
        <View style={styles.checkCircle}>
          <MaterialIcons name="check" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.successTitle}>{params.depositType} Created!</Text>
        <Text style={styles.successSub}>Your deposit is active</Text>

        <View style={styles.successCard}>
          {[
            { label: 'Type', value: params.depositType },
            { label: params.depositType === 'SDP' ? 'Monthly Amount' : 'Amount', value: `₹${parseFloat(params.amount).toLocaleString('en-IN')}` },
            { label: params.depositType === 'SDP' ? 'Duration' : 'Tenor', value: params.tenor },
            { label: 'Date', value: dateStr },
            { label: 'Ref No.', value: refNumber },
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.successRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }]}>
              <Text style={styles.successRowLabel}>{row.label}</Text>
              <Text style={styles.successRowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.successActions}>
          <TouchableOpacity
            style={styles.newDepositButton}
            onPress={() => router.replace('/fd-sdp')}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_FD_SUCCESS_NEW');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_FD_SUCCESS_NEW');
            }}
          >
            <Text style={styles.newDepositButtonText}>New Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace('/(tabs)')}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_FD_SUCCESS_HOME');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_FD_SUCCESS_HOME');
            }}
          >
            <MaterialIcons name="home" size={18} color="#FFFFFF" />
            <Text style={styles.homeButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
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
  },
  heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  heroAmount: { fontSize: 40, fontWeight: '800', color: '#FFFFFF' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 },

  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  detailLabel: { fontSize: 13, color: '#9E9E9E' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#212121', textAlign: 'right', maxWidth: '55%' },

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

  footer: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12, gap: 12 },
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

  // PIN
  pinBody: { flex: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },
  lockWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  pinPrompt: { fontSize: 17, fontWeight: '700', color: '#212121', textAlign: 'center', marginBottom: 6 },
  pinSub: { fontSize: 13, color: '#78909C', textAlign: 'center', marginBottom: 32 },
  pinDots: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  dotEmpty: { borderWidth: 2, borderColor: '#BDBDBD' },
  dotFilled: { backgroundColor: '#FF5722' },
  keypad: { width: '100%', maxWidth: 320, marginTop: 24 },
  keyRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 },
  key: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  keyText: { fontSize: 24, fontWeight: '600', color: '#212121' },
  keyEmpty: { width: 72, height: 72 },

  // Success
  successBody: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  checkCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#43A047', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#43A047', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#212121', marginBottom: 6 },
  successSub: { fontSize: 13, color: '#78909C', marginBottom: 24 },
  successCard: {
    width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    marginBottom: 24,
  },
  successRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  successRowLabel: { fontSize: 13, color: '#9E9E9E' },
  successRowValue: { fontSize: 13, fontWeight: '600', color: '#212121' },
  successActions: { flexDirection: 'row', width: '100%', gap: 12 },
  newDepositButton: {
    flex: 1, borderWidth: 1.5, borderColor: '#FF5722', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  newDepositButtonText: { color: '#FF5722', fontWeight: '700', fontSize: 14 },
  homeButton: {
    flex: 1, backgroundColor: '#FF5722', borderRadius: 14,
    paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  homeButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
