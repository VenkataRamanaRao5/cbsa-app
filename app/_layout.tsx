import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { BehavioralProvider } from '@/services/BehavioralContext';
import { behavioralService } from '@/services/BehavioralService';
import { TrustBlockingModal } from '@/components/TrustBlockingModal';
import { wsService } from '@/services/WebSocketService';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { AuthProvider, useAuth } from './AuthContext';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoggedIn, username } = useAuth();
  const segments = useSegments();
  // segments is empty ([]) until the navigation container is ready and the
  // first state event has fired; using this as a readiness signal avoids
  // calling router.replace before assertIsReady() passes.
  const isNavigationReady = segments.length > 0;

  useEffect(() => {
    if (!isNavigationReady) return;

    if (isLoggedIn) {
      behavioralService.start();

      // Listen for server-pushed enrollment complete notifications
      wsService.onEnrollmentStatus((data) => {
        if (data.status === 'enrollment_complete') {
          Alert.alert(
            'Enrollment Complete! 🎉',
            data.message ||
              'Your behavioral profile data has been collected. An administrator can now run training to activate your profile.',
          );
        }
      });
    } else {
      behavioralService.stop();
      router.replace('/login');
    }
  }, [isLoggedIn, isNavigationReady]);

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
