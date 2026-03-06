import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { behavioralService } from '@/services/BehavioralService';
import { configService } from '@/services/ConfigService';
import { wsService } from '@/services/WebSocketService';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth, EnrollmentStatus } from './AuthContext';

interface PINKeypadKey {
  value: string;
  label: string;
}

/**
 * Returns 'http' for raw IP addresses and localhost, 'https' for hostnames.
 * Mirrors the logic in ConfigService so the UI preview matches the actual
 * protocol used by the service.
 *
 * Anything that structurally looks like an IPv4 address (four dot-separated
 * numeric groups) is treated as an IP — the octet range is intentionally not
 * re-validated here because ConfigService.setConfig() already rejects invalid
 * addresses before they can be saved.
 */
function getProtocolForHost(host: string): 'http' | 'https' {
  if (host === 'localhost' || host === '127.0.0.1') return 'http';
  // Treat anything that structurally looks like an IPv4 address as an IP
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return 'http';
  return 'https';
}

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [keypadSequence, setKeypadSequence] = useState<PINKeypadKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showIPConfig, setShowIPConfig] = useState(false);
  const [backendIP, setBackendIP] = useState('behaviorbackend.azurewebsites.net');
  const [backendPort, setBackendPort] = useState('443');
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    generateRandomizedKeypad();
    loadSavedConfig();
  }, []);

  // Load previously saved config
  const loadSavedConfig = async () => {
    try {
      const config = await configService.getConfig();
      setBackendIP(config.backendIP);
      setBackendPort(config.backendPort.toString());
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  // Generate randomized keypad (0-9 in random order)
  const generateRandomizedKeypad = () => {
    const digits = Array.from({ length: 10 }, (_, i) => ({
      value: i.toString(),
      label: i.toString(),
    }));

    for (let i = digits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digits[i], digits[j]] = [digits[j], digits[i]];
    }

    setKeypadSequence(digits);
  };

  // Handle PIN key press
  const handlePinKeyPress = (digit: string, event: any) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);

      const collector = behavioralService.getCollector();
      if (collector && event?.nativeEvent) {
        const { pageX, pageY, force } = event.nativeEvent;
        collector.recordTouchStart(pageX, pageY, force ?? 0);
        collector.recordKeystroke();
      }
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    behavioralService.getCollector()?.recordKeystroke();
  };

  // Handle clear
  const handleClear = () => {
    setPin('');
    behavioralService.getCollector()?.recordKeystroke();
  };

  // Save and test backend configuration
  const handleSaveConfig = async () => {
    try {
      if (!backendIP.trim()) {
        Alert.alert('Error', 'Please enter a backend IP address');
        return;
      }

      const port = parseInt(backendPort, 10);
      if (isNaN(port)) {
        Alert.alert('Error', 'Port must be a valid number');
        return;
      }

      setTestingConnection(true);

      // Save config
      await configService.setConfig({
        backendIP: backendIP.trim(),
        backendPort: port,
      });

      // Update WebSocket service URL
      await wsService.updateURL();

      // Test connection — propagates network-level errors (e.g. cleartext
      // policy, connection refused) so we can show the real reason.
      let isConnected = false;
      try {
        isConnected = await configService.testConnection();
      } catch (testError) {
        setTestingConnection(false);
        const reason = testError instanceof Error ? testError.message : String(testError);
        // Only suggest Wi-Fi issues when the user is targeting a local IP address
        const isLocalIP = getProtocolForHost(backendIP.trim()) === 'http';
        const hint = isLocalIP
          ? '\n\nIf you are connecting to a local IP, make sure both devices are on the same Wi-Fi network.'
          : '';
        Alert.alert(
          'Connection Failed',
          `Configuration saved, but the backend could not be reached.\n\nReason: ${reason}${hint}`,
          [{ text: 'OK', onPress: () => setShowIPConfig(false) }]
        );
        return;
      }

      setTestingConnection(false);

      if (isConnected) {
        Alert.alert('Success', 'Backend connection verified!');
        setShowIPConfig(false);
      } else {
        Alert.alert(
          'Warning',
          'Configuration saved, but the backend returned an unexpected response.\nMake sure your backend is running at the specified address.',
          [{ text: 'OK', onPress: () => setShowIPConfig(false) }]
        );
      }
    } catch (error) {
      setTestingConnection(false);
      Alert.alert('Error', `Failed to save configuration: ${error}`);
    }
  };

  const handleProceed = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }

    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    setIsLoading(true);

    try {
      // Call backend /login with username (PIN is not validated server-side)
      const loginResp = await configService.loginUser(username.trim());

      const status = loginResp.status as EnrollmentStatus;
      const secsRemaining = loginResp.seconds_remaining ?? null;

      // Set user ID on WebSocket service so events are tagged
      wsService.setUserId(username.trim());

      login(username.trim(), status, secsRemaining);

      if (status === 'enrolling') {
        const remaining = secsRemaining != null ? `${Math.ceil(secsRemaining)}s remaining` : '';
        Alert.alert(
          'Enrollment Mode',
          `Welcome ${username.trim()}!\nYou are in enrollment mode. ${remaining}\nUse the app normally to build your behavioral profile.`,
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        Alert.alert('Welcome Back', `Hello, ${username.trim()}!`, [
          { text: 'OK', onPress: () => router.replace('/(tabs)') },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', `Login failed: ${error}`);
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const getKeypadRow = (start: number) => keypadSequence.slice(start, start + 3);

  // Derive correct protocol for the endpoint preview:
  // IPs (including 192.168.x.x) and localhost → http, hostnames → https.
  // Port is omitted only when using https with its default port (443).
  const displayProto = getProtocolForHost(backendIP);
  const displayEndpoint = `${displayProto}://${backendIP}${
    displayProto === 'https' && backendPort === '443' ? '' : `:${backendPort}`
  }`;

  // IP Configuration UI
  if (showIPConfig) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.mainContent}>
          <View style={styles.headerContainer}>
            <ThemedText style={styles.title}>Backend Configuration</ThemedText>
          </View>

          <View style={styles.configCard}>
            <Text style={styles.configLabel}>Backend Host / IP Address</Text>
            <TextInput
              style={styles.configInput}
              placeholder="behaviorbackend.azurewebsites.net"
              value={backendIP}
              onChangeText={setBackendIP}
              editable={!testingConnection}
              placeholderTextColor="#999"
              autoCapitalize="none"
            />

            <Text style={styles.configLabel}>Port</Text>
            <TextInput
              style={styles.configInput}
              placeholder="443"
              value={backendPort}
              onChangeText={setBackendPort}
              keyboardType="numeric"
              editable={!testingConnection}
              placeholderTextColor="#999"
            />

            <View style={styles.configInfo}>
              <Text style={styles.configInfoText}>
                Endpoint:{'\n'}
                <Text style={styles.configInfoBold}>
                  {displayEndpoint}
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.configButton,
                testingConnection && styles.configButtonDisabled,
              ]}
              onPress={handleSaveConfig}
              disabled={testingConnection}
            >
              <Text style={styles.configButtonText}>
                {testingConnection ? 'Testing...' : 'Save & Test'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.configButtonSecondary}
              onPress={() => setShowIPConfig(false)}
              disabled={testingConnection}
            >
              <Text style={styles.configButtonSecondaryText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ThemedView style={styles.container}>
        <View style={styles.mainContent}>
          <View style={styles.headerContainer}>
            <ThemedText style={styles.title}>Sign In</ThemedText>
          </View>

          {/* Username input */}
          <View style={styles.usernameContainer}>
            <Text style={styles.usernameLabel}>Username</Text>
            <TextInput
              style={styles.usernameInput}
              placeholder="Enter username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.pinDisplayContainer}>
            <Text style={styles.pinLabel}>PIN</Text>
            <View style={styles.pinDisplay}>
              {Array.from({ length: 4 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    {
                      backgroundColor:
                        index < pin.length ? '#2D3436' : 'transparent',
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.keypadContainer}>
            {[0, 3, 6].map(start => (
              <View key={start} style={styles.keypadRow}>
                {getKeypadRow(start).map((key, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.keypadButton,
                      { opacity: isLoading || pin.length >= 4 ? 0.5 : 1 },
                    ]}
                    onPress={(event) => handlePinKeyPress(key.value, event)}
                    disabled={isLoading || pin.length >= 4}
                  >
                    <Text style={styles.keypadButtonText}>{key.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            <View style={styles.keypadRow}>
              <TouchableOpacity
                style={[
                  styles.keypadButton,
                  { opacity: isLoading || pin.length === 0 ? 0.5 : 1 },
                ]}
                onPress={handleBackspace}
                disabled={isLoading || pin.length === 0}
              >
                <Text style={styles.keypadButtonText}>←</Text>
              </TouchableOpacity>

              {keypadSequence.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.keypadButton,
                    { opacity: isLoading || pin.length >= 4 ? 0.5 : 1 },
                  ]}
                  onPress={(event) =>
                    handlePinKeyPress(keypadSequence[9].value, event)
                  }
                  disabled={isLoading || pin.length >= 4}
                >
                  <Text style={styles.keypadButtonText}>
                    {keypadSequence[9].label}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.keypadButton, { opacity: isLoading ? 0.5 : 1 }]}
                onPress={handleClear}
                disabled={isLoading}
              >
                <Text style={styles.clearButtonText}>CLEAR</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.configAccessButton}
              onPress={() => setShowIPConfig(true)}
            >
              <Text style={styles.configAccessButtonText}>⚙️ Backend Config</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.proceedButton,
                { opacity: isLoading || pin.length !== 4 || !username.trim() ? 0.5 : 1 },
              ]}
              onPress={handleProceed}
              disabled={isLoading || pin.length !== 4 || !username.trim()}
            >
              <Text style={styles.proceedButtonText}>
                {isLoading ? 'Connecting...' : 'PROCEED'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E8EC',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    color: '#5B5B63',
    letterSpacing: 0.3,
  },
  usernameContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 16,
  },
  usernameLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5B5B63',
    marginBottom: 6,
  },
  usernameInput: {
    borderWidth: 1,
    borderColor: '#BFBFBF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    color: '#2D3436',
  },
  pinDisplayContainer: {
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#D5D5D8',
    borderRadius: 35,
    paddingVertical: 20,
    paddingHorizontal: 50,
  },
  pinLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5B5B63',
    marginBottom: 10,
    letterSpacing: 1,
  },
  pinDisplay: {
    flexDirection: 'row',
    gap: 25,
  },
  pinDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: '#5B5B63',
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 320,
  },
  keypadRow: {
    flexDirection: 'row',
    marginBottom: 0,
    gap: 0,
  },
  keypadButton: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D5D5D8',
    borderWidth: 0.5,
    borderColor: '#BFBFBF',
  },
  keypadButtonText: {
    fontSize: 32,
    fontWeight: '400',
    color: '#2D3436',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5B5B63',
    letterSpacing: 0.5,
  },
  proceedButton: {
    marginTop: 10,
    width: '100%',
    maxWidth: 320,
    paddingVertical: 14,
    backgroundColor: '#2D3436',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  buttonsContainer: {
    flexDirection: 'column',
    width: '100%',
    maxWidth: 320,
    gap: 12,
    marginTop: 16,
  },
  configAccessButton: {
    paddingVertical: 12,
    backgroundColor: '#8E8E93',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  configAccessButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  configCard: {
    backgroundColor: '#D5D5D8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  configLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5B5B63',
    marginBottom: 8,
    marginTop: 12,
  },
  configInput: {
    borderWidth: 1,
    borderColor: '#BFBFBF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#2D3436',
  },
  configInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BFBFBF',
  },
  configInfoText: {
    fontSize: 12,
    color: '#5B5B63',
    marginBottom: 4,
  },
  configInfoBold: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3436',
  },
  configButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#2D3436',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  configButtonDisabled: {
    backgroundColor: '#BFBFBF',
    opacity: 0.6,
  },
  configButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  configButtonSecondary: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFBFBF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  configButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B5B63',
    letterSpacing: 0.5,
  },
});
