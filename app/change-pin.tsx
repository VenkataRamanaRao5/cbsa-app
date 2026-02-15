import { useBehavioralCollector } from '@/services/BehavioralContext';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useState, useCallback } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ChangePinScreen() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const collector = useBehavioralCollector();

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_PIN_CHANGE');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_PIN_CHANGE');
      return () => {};
    }, [collector])
  );

  const currentValue = step === 1 ? oldPin : step === 2 ? newPin : confirmPin;

  const handleNext = () => {
    if (step === 1) {
      if (oldPin.length !== 4) return Alert.alert('Error', 'Please enter 4-digit PIN');
      collector?.recordTouchStart(0, 0, 0, 'TOUCH_VERIFY_OLD_PIN');
      setStep(2);
    } else if (step === 2) {
      if (newPin.length !== 4) return Alert.alert('Error', 'Please enter 4-digit PIN');
      if (newPin === oldPin) return Alert.alert('Error', 'New PIN must be different from old PIN');
      collector?.recordTouchStart(0, 0, 0, 'TOUCH_SET_NEW_PIN');
      setStep(3);
    } else {
      if (confirmPin.length !== 4) return Alert.alert('Error', 'Please enter 4-digit PIN');
      if (newPin !== confirmPin) return Alert.alert('Error', 'PINs do not match');
      
      collector?.recordTouchStart(0, 0, 0, 'TOUCH_CONFIRM_PIN_CHANGE');
      Alert.alert('Success', 'PIN changed successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    } else {
      router.back();
    }
  };

  const getStepDescription = () => {
    switch(step) {
      case 1: return 'Verify your identity by entering your current 4-digit PIN';
      case 2: return 'Create a new 4-digit PIN for your account';
      case 3: return 'Re-enter your new PIN to confirm';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_BACK_PIN_CHANGE');
          }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change PIN</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((num) => (
            <View
              key={num}
              style={[
                styles.progressDot,
                num <= step && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>Step {step} of 3</Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustration}>
            <Text style={styles.illustrationIcon}>
              {step === 1 ? '🔐' : step === 2 ? '🔑' : '✅'}
            </Text>
          </View>
        </View>

        {/* Title and Description */}
        <Text style={styles.title}>
          {step === 1 && 'Enter Current PIN'}
          {step === 2 && 'Enter New PIN'}
          {step === 3 && 'Confirm New PIN'}
        </Text>
        <Text style={styles.description}>{getStepDescription()}</Text>

        {/* PIN Input Dots */}
        <View style={styles.pinDotsContainer}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                index < currentValue.length && styles.pinDotFilled,
              ]}
            />
          ))}
        </View>

        {/* Hidden Text Input */}
        <TextInput
          style={styles.hiddenInput}
          keyboardType="numeric"
          secureTextEntry
          maxLength={4}
          autoFocus
          value={currentValue}
          onChangeText={(s) => {
            collector?.recordKeystroke(`TYPE_PIN_STEP_${step}`);
            step === 1 ? setOldPin(s) : step === 2 ? setNewPin(s) : setConfirmPin(s);
          }}
        />

        {/* Instructions */}
        <View style={styles.instructions}>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionIcon}>🔒</Text>
            <Text style={styles.instructionText}>Your PIN is secure and encrypted</Text>
          </View>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionIcon}>🔢</Text>
            <Text style={styles.instructionText}>Use a PIN that's easy to remember but hard to guess</Text>
          </View>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionIcon}>⚠️</Text>
            <Text style={styles.instructionText}>Never share your PIN with anyone</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.button,
            currentValue.length !== 4 && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={currentValue.length !== 4}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_PIN_STEP_${step}_NEXT`);
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_PIN_STEP_${step}_NEXT`);
          }}
        >
          <Text style={[
            styles.buttonText,
            currentValue.length !== 4 && styles.buttonTextDisabled,
          ]}>
            {step === 3 ? 'CONFIRM CHANGE' : 'CONTINUE'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EAF6',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: '#212121',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },

  // Content
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
  },
  progressDotActive: {
    backgroundColor: '#5C6BC0',
  },
  stepIndicator: {
    marginBottom: 24,
  },
  stepText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },

  // Illustration
  illustrationContainer: {
    marginBottom: 32,
  },
  illustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  illustrationIcon: {
    fontSize: 48,
  },

  // Text
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 20,
  },

  // PIN Dots
  pinDotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: '#5C6BC0',
    borderColor: '#5C6BC0',
  },

  // Hidden Input
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },

  // Instructions
  instructions: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionIcon: {
    fontSize: 20,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#546E7A',
    lineHeight: 18,
  },

  // Button
  button: {
    width: '100%',
    backgroundColor: '#5C6BC0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#5C6BC0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    color: '#BDBDBD',
  },
});
