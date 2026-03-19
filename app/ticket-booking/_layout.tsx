import { Stack } from 'expo-router';

export default function TicketBookingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="search" />
      <Stack.Screen name="results" />
      <Stack.Screen name="confirm" />
    </Stack>
  );
}
