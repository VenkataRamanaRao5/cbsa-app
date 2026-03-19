import { Stack } from 'expo-router';

export default function FdSdpLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
