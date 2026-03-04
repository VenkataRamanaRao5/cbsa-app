import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { BehavioralProvider } from '@/services/BehavioralContext';
import { behavioralService } from '@/services/BehavioralService';
import { wsService } from '@/services/WebSocketService';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { AuthProvider, useAuth } from './AuthContext';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoggedIn, username } = useAuth();

  useEffect(() => {
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
  }, [isLoggedIn]);

  let content = (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {isLoggedIn ? (
          // User is logged in - show all tabs
          <Stack.Screen name="(tabs)" options={{
            headerShown: true,
            headerTitle: 'Bank',
          }} />
        ) : (
          // User is not logged in - show only login tab
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

  return (
    isLoggedIn ?
      <BehavioralProvider>
        {content}
      </BehavioralProvider> : content 
  );
}

export default function RootLayout() {

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
