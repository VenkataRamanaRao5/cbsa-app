import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
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

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Step = 'details' | 'pin' | 'success';
type TransportType = 'flight' | 'train' | 'bus';

const COLOR: Record<TransportType, string> = { flight: '#1565C0', train: '#558B2F', bus: '#E65100' };

export default function TicketConfirmScreen() {
  const collector = useBehavioralCollector();
  const params = useLocalSearchParams<{
    type: string; from: string; to: string; date: string;
    passengers: string; travelClass: string; name: string;
    number: string; departure: string; arrival: string;
    duration: string; price: string;
  }>();

  const t = (params.type ?? 'flight') as TransportType;
  const color = COLOR[t] ?? '#1565C0';
  const paxCount = parseInt(params.passengers ?? '1', 10);
  const pricePerPax = parseInt(params.price ?? '0', 10);
  const totalPrice = pricePerPax * paxCount;
  const convFee = Math.round(totalPrice * 0.018);
  const grandTotal = totalPrice + convFee;

  const [step, setStep] = useState<Step>('details');
  const [names, setNames] = useState<string[]>(Array.from({ length: paxCount }, () => ''));
  const [ages, setAges] = useState<string[]>(Array.from({ length: paxCount }, () => ''));
  const [pin, setPin] = useState('');

  const shuffledKeys = useMemo(() => shuffleArray(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']), []);
  const pnr = `PNR${Date.now().toString().slice(-8).toUpperCase()}`;
  const dateStr = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, `PAGE_ENTER_TICKET_CONFIRM_${t.toUpperCase()}`);
      collector?.recordTouchEnd(0, 0, 0, `PAGE_ENTER_TICKET_CONFIRM_${t.toUpperCase()}`);
      return () => {};
    }, [collector, t])
  );

  const canProceed = names.every((n) => n.trim()) && ages.every((a) => a.trim());

  const handlePinKey = (key: string) => {
    if (pin.length >= 6) return;
    collector?.recordKeystroke('KEYSTROKE_TICKET_PIN');
    const next = pin + key;
    setPin(next);
    if (next.length === 6) {
      setTimeout(() => setStep('success'), 400);
    }
  };

  const handlePinDelete = () => {
    if (pin.length === 0) return;
    collector?.recordKeystroke('KEYSTROKE_TICKET_PIN_DELETE');
    setPin((p) => p.slice(0, -1));
  };

  // ── Passenger Details ────────────────────────────────────────────────────
  if (step === 'details') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { backgroundColor: color }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TICKET_CONFIRM_BACK');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TICKET_CONFIRM_BACK');
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerRoute}>{params.from} → {params.to}</Text>
            <Text style={styles.headerMeta}>
              {params.name}{params.number ? ` · ${params.number}` : ''} · {params.date}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Journey summary */}
          <View style={styles.journeyCard}>
            <View style={styles.journeyRow}>
              <View style={styles.journeyTime}>
                <Text style={styles.journeyTimeText}>{params.departure}</Text>
                <Text style={styles.journeyCity}>{params.from}</Text>
              </View>
              <View style={styles.journeyMid}>
                <Text style={styles.journeyDuration}>{params.duration}</Text>
                <View style={styles.journeyLine}>
                  <View style={styles.journeyDot} />
                  <View style={styles.journeyBar} />
                  <View style={styles.journeyDot} />
                </View>
              </View>
              <View style={[styles.journeyTime, { alignItems: 'flex-end' }]}>
                <Text style={styles.journeyTimeText}>{params.arrival}</Text>
                <Text style={styles.journeyCity}>{params.to}</Text>
              </View>
            </View>
            <Text style={styles.journeyClass}>{params.travelClass}</Text>
          </View>

          {/* Passenger forms */}
          {Array.from({ length: paxCount }).map((_, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.fieldLabel}>Passenger {i + 1}</Text>
              <View style={styles.fieldRow}>
                <View style={styles.fieldFlex2}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="As per ID proof"
                    value={names[i]}
                    onChangeText={(v) => {
                      collector?.recordKeystroke('KEYSTROKE_TICKET_PAX_NAME');
                      const updated = [...names];
                      updated[i] = v;
                      setNames(updated);
                    }}
                  />
                </View>
                <View style={styles.fieldFlex1}>
                  <Text style={styles.inputLabel}>Age</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Age"
                    keyboardType="numeric"
                    value={ages[i]}
                    onChangeText={(v) => {
                      collector?.recordKeystroke('KEYSTROKE_TICKET_PAX_AGE');
                      const updated = [...ages];
                      updated[i] = v;
                      setAges(updated);
                    }}
                  />
                </View>
              </View>
            </View>
          ))}

          {/* Price breakdown */}
          <View style={styles.priceCard}>
            <Text style={styles.fieldLabel}>Fare Summary</Text>
            {[
              { label: `Base Fare × ${paxCount}`, value: `₹${totalPrice.toLocaleString('en-IN')}` },
              { label: 'Convenience Fee', value: `₹${convFee.toLocaleString('en-IN')}` },
              { label: 'Total Payable', value: `₹${grandTotal.toLocaleString('en-IN')}`, bold: true },
            ].map((row, idx, arr) => (
              <View key={row.label} style={[styles.priceRow, idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }]}>
                <Text style={styles.priceLabel}>{row.label}</Text>
                <Text style={[styles.priceValue, row.bold && { fontSize: 16, color: '#212121' }]}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: canProceed ? color : '#BDBDBD' }]}
            disabled={!canProceed}
            onPress={() => setStep('pin')}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TICKET_PROCEED_TO_PAY');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TICKET_PROCEED_TO_PAY');
            }}
          >
            <MaterialIcons name="lock" size={18} color="#FFFFFF" />
            <Text style={styles.payButtonText}>Pay ₹{grandTotal.toLocaleString('en-IN')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── PIN ──────────────────────────────────────────────────────────────────
  if (step === 'pin') {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: color }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => { setPin(''); setStep('details'); }}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TICKET_PIN_BACK');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TICKET_PIN_BACK');
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitleCenter}>Transaction PIN</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.pinBody}>
          <View style={[styles.lockWrap, { backgroundColor: `${color}18` }]}>
            <MaterialIcons name="lock" size={36} color={color} />
          </View>
          <Text style={styles.pinPrompt}>Enter your 6-digit Transaction PIN</Text>
          <Text style={styles.pinSub}>
            {params.from} → {params.to} · ₹{grandTotal.toLocaleString('en-IN')}
          </Text>
          <View style={styles.pinDots}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.dot, i < pin.length ? { ...styles.dotFilled, backgroundColor: color } : styles.dotEmpty]} />
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
                      collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TICKET_PIN_KEY');
                    }}
                    onPressOut={(e) => {
                      const { pageX, pageY, force } = e.nativeEvent;
                      collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TICKET_PIN_KEY');
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
                  collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TICKET_PIN_KEY');
                }}
                onPressOut={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TICKET_PIN_KEY');
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
                  collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TICKET_PIN_DELETE');
                }}
                onPressOut={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TICKET_PIN_DELETE');
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
      <ScrollView contentContainerStyle={styles.successBody} showsVerticalScrollIndicator={false}>
        <View style={[styles.checkCircle, { shadowColor: '#43A047' }]}>
          <MaterialIcons name="check" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <Text style={styles.successSub}>Your tickets have been booked</Text>

        <View style={styles.successCard}>
          {[
            { label: 'PNR', value: pnr },
            { label: 'Route', value: `${params.from} → ${params.to}` },
            { label: 'Date', value: params.date },
            { label: 'Departure', value: params.departure },
            { label: params.type === 'bus' ? 'Operator' : params.type === 'train' ? 'Train' : 'Flight', value: `${params.name}${params.number ? ` (${params.number})` : ''}` },
            { label: 'Class', value: params.travelClass },
            { label: 'Passengers', value: String(paxCount) },
            { label: 'Amount Paid', value: `₹${grandTotal.toLocaleString('en-IN')}` },
            { label: 'Booked On', value: dateStr },
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.successRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }]}>
              <Text style={styles.successRowLabel}>{row.label}</Text>
              <Text style={styles.successRowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.eTicketNote}>
          <MaterialIcons name="email" size={16} color="#1565C0" />
          <Text style={styles.eTicketText}>E-ticket sent to your registered email and SMS.</Text>
        </View>

        <View style={styles.successActions}>
          <TouchableOpacity
            style={[styles.newSearchButton, { borderColor: color }]}
            onPress={() => router.replace({ pathname: '/ticket-booking/search', params: { type: t } } as any)}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TICKET_SUCCESS_NEW_SEARCH');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TICKET_SUCCESS_NEW_SEARCH');
            }}
          >
            <Text style={[styles.newSearchButtonText, { color }]}>New Search</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.homeButton, { backgroundColor: color }]}
            onPress={() => router.replace('/(tabs)')}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TICKET_SUCCESS_HOME');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TICKET_SUCCESS_HOME');
            }}
          >
            <MaterialIcons name="home" size={18} color="#FFFFFF" />
            <Text style={styles.homeButtonText}>Home</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: { padding: 4 },
  headerInfo: { flex: 1 },
  headerRoute: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  headerMeta: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerTitleCenter: { flex: 1, fontSize: 18, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  headerSpacer: { width: 36 },

  content: { flex: 1, paddingHorizontal: 16 },

  journeyCard: {
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
  journeyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  journeyTime: { flex: 1 },
  journeyTimeText: { fontSize: 22, fontWeight: '800', color: '#212121' },
  journeyCity: { fontSize: 12, color: '#78909C' },
  journeyMid: { flex: 1.5, alignItems: 'center' },
  journeyDuration: { fontSize: 12, color: '#9E9E9E', marginBottom: 6 },
  journeyLine: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  journeyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#BDBDBD' },
  journeyBar: { flex: 1, height: 1, backgroundColor: '#BDBDBD' },
  journeyClass: { fontSize: 12, color: '#78909C', textAlign: 'center' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  fieldLabel: { fontSize: 12, color: '#9E9E9E', fontWeight: '600', marginBottom: 12 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldFlex2: { flex: 2 },
  fieldFlex1: { flex: 1 },
  inputLabel: { fontSize: 11, color: '#BDBDBD', fontWeight: '600', marginBottom: 4 },
  input: { borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingVertical: 6, fontSize: 14, color: '#212121' },

  priceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  priceLabel: { fontSize: 13, color: '#78909C' },
  priceValue: { fontSize: 13, fontWeight: '600', color: '#546E7A' },

  footer: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12 },
  payButton: {
    borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  payButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // PIN
  pinBody: { flex: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },
  lockWrap: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  pinPrompt: { fontSize: 17, fontWeight: '700', color: '#212121', textAlign: 'center', marginBottom: 6 },
  pinSub: { fontSize: 13, color: '#78909C', textAlign: 'center', marginBottom: 32 },
  pinDots: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  dotEmpty: { borderWidth: 2, borderColor: '#BDBDBD' },
  dotFilled: {},
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
  successBody: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  checkCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#43A047', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#212121', marginBottom: 6 },
  successSub: { fontSize: 13, color: '#78909C', marginBottom: 24 },
  successCard: {
    width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    marginBottom: 12,
  },
  successRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11 },
  successRowLabel: { fontSize: 13, color: '#9E9E9E' },
  successRowValue: { fontSize: 13, fontWeight: '600', color: '#212121', textAlign: 'right', maxWidth: '55%' },
  eTicketNote: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#E3F2FD', borderRadius: 10, padding: 12, width: '100%',
    gap: 8, marginBottom: 20,
  },
  eTicketText: { flex: 1, fontSize: 12, color: '#1565C0', lineHeight: 17 },
  successActions: { flexDirection: 'row', width: '100%', gap: 12 },
  newSearchButton: {
    flex: 1, borderWidth: 1.5, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  newSearchButtonText: { fontWeight: '700', fontSize: 14 },
  homeButton: {
    flex: 1, borderRadius: 14,
    paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  homeButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
