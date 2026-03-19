import { Stack } from 'expo-router';

export default function FundTransferLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="beneficiary" />
      <Stack.Screen name="amount" />
      <Stack.Screen name="review" />
      <Stack.Screen name="pin" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
