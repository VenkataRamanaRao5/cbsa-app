import { Stack } from 'expo-router';

export default function IpoLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="apply" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
