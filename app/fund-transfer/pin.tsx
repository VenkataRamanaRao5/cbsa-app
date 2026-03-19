import { useBehavioralCollector, useResetFundTransferCount } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TransferPinScreen() {
  const collector = useBehavioralCollector();
  const resetFundTransferPressCount = useResetFundTransferCount();
  const params = useLocalSearchParams<{
    method: string;
    beneficiaryName: string;
    beneficiaryId: string;
    beneficiaryBank: string;
    amount: string;
    remarks: string;
  }>();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const PIN_LENGTH = 6;

  // Shuffle keys on mount
  const shuffledKeys = useMemo(() => shuffleArray(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']), []);

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_TRANSFER_PIN');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_TRANSFER_PIN');
      return () => {};
    }, [collector])
  );

  const handleKeyPress = (key: string) => {
    if (pin.length >= PIN_LENGTH) return;
    collector?.recordKeystroke('KEYSTROKE_TRANSACTION_PIN');
    const next = pin + key;
    setPin(next);
    setError('');
    if (next.length === PIN_LENGTH) {
      // In a real app this would validate against the server.
      // Here we accept any 6-digit PIN and proceed to success.
      setTimeout(() => {
        resetFundTransferPressCount();
        router.replace({ pathname: '/fund-transfer/success', params } as any);
      }, 300);
    }
  };

  const handleDelete = () => {
    if (pin.length === 0) return;
    collector?.recordKeystroke('KEYSTROKE_TRANSACTION_PIN_DELETE');
    setPin((p) => p.slice(0, -1));
    setError('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PIN_BACK');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PIN_BACK');
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction PIN</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        {/* Lock icon */}
        <View style={styles.lockWrap}>
          <MaterialIcons name="lock" size={36} color="#FF5722" />
        </View>

        <Text style={styles.promptTitle}>Enter your 6-digit Transaction PIN</Text>
        <Text style={styles.promptSub}>
          Sending ₹{params.amount} to {params.beneficiaryName}
        </Text>

        {/* PIN dots */}
        <View style={styles.pinDots}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < pin.length ? styles.dotFilled : styles.dotEmpty]}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Keypad */}
        <View style={styles.keypad}>
          {[0, 1, 2].map((row) => (
            <View key={row} style={styles.keyRow}>
              {shuffledKeys.slice(row * 3, row * 3 + 3).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.key}
                  onPress={() => handleKeyPress(key)}
                  onPressIn={(e) => {
                    const { pageX, pageY, force } = e.nativeEvent;
                    collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TRANSFER_PIN_KEY');
                  }}
                  onPressOut={(e) => {
                    const { pageX, pageY, force } = e.nativeEvent;
                    collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TRANSFER_PIN_KEY');
                  }}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          {/* Last row: remaining digit + 0 + delete */}
          <View style={styles.keyRow}>
            <TouchableOpacity
              style={styles.key}
              onPress={() => handleKeyPress(shuffledKeys[9])}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TRANSFER_PIN_KEY');
              }}
              onPressOut={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TRANSFER_PIN_KEY');
              }}
            >
              <Text style={styles.keyText}>{shuffledKeys[9]}</Text>
            </TouchableOpacity>
            <View style={styles.keyEmpty} />
            <TouchableOpacity
              style={styles.key}
              onPress={handleDelete}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TRANSFER_PIN_DELETE');
              }}
              onPressOut={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TRANSFER_PIN_DELETE');
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

  body: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },

  lockWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  promptTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 6,
  },
  promptSub: {
    fontSize: 13,
    color: '#78909C',
    textAlign: 'center',
    marginBottom: 32,
  },

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
});
