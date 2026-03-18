import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { BehavioralProvider } from '@/services/BehavioralContext';
import { behavioralService } from '@/services/BehavioralService';
import { TrustBlockingModal } from '@/components/TrustBlockingModal';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      behavioralService.start();
    } else {
      behavioralService.stop();
    }
  }, [isLoggedIn]);

  const screens = (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {isLoggedIn ? (
          <Stack.Screen name="(tabs)" options={{
            headerShown: true,
            headerTitle: 'Bank',
          }} />
        ) : (
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
            }}
          />
        )}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="transaction/[id]"
          options={{
            presentation: 'modal',
            headerTitle: 'Transaction details',
            headerShown: true,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );

  if (!isLoggedIn) {
    return screens;
  }

  // When logged in, wrap screens in BehavioralProvider so the WebSocket
  // connection and trust tracking are active. TrustBlockingModal sits inside
  // the provider so it can read trustState and clearBlock directly.
  return (
    <BehavioralProvider>
      {screens}
      <TrustBlockingModal />
    </BehavioralProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
