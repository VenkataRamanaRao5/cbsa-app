import { useBehavioralCollector } from '@/services/BehavioralContext';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PayScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const collector = useBehavioralCollector();

  // Record page navigation event when pay tab comes into focus
  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_PAY');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_PAY');
      return () => {};
    }, [collector])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {step === 1 ? 'Pay Someone' : 'Confirm Transfer'}
      </Text>

      {step === 1 && (
        <>
          <TextInput
            placeholder="Recipient name or UPI"
            style={styles.input}
            value={recipient}
            onChangeText={(s) => {
              collector?.recordKeystroke("PAY_RECIPIENT")
              setRecipient(s)
            }}
          />
          <TextInput
            placeholder="Amount"
            keyboardType="numeric"
            style={styles.input}
            value={amount}
            onChangeText={(s) => {
              collector?.recordKeystroke("PAY_AMOUNT")
              setAmount(s)
            }}
          />
        </>
      )}

      {step === 2 && (
        <View style={styles.summary}>
          <Text>To: {recipient}</Text>
          <Text>Amount: ₹{amount}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => step === 1 ? setStep(2) : null}
        onPressIn={(e) => {
          const { pageX, pageY, force } = e.nativeEvent;
          collector?.recordTouchStart(pageX, pageY, force ?? 0, `PAY_BUTTON_${step}`);
        }}
        onPressOut={(e) => {
          const { pageX, pageY, force } = e.nativeEvent;
          collector?.recordTouchEnd(pageX, pageY, force ?? 0, `PAY_BUTTON_${step}`);
        }}
      >
        <Text style={styles.buttonText}>
          {step === 1 ? 'NEXT' : 'PAY'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F5F6FA' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  summary: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2D3436',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
