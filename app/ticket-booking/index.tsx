import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TransportMode = {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  bgColor: string;
  event: string;
  type: string;
};

const TRANSPORT_MODES: TransportMode[] = [
  { id: '1', label: 'Flight', icon: 'flight', color: '#1565C0', bgColor: '#E3F2FD', event: 'TOUCH_TICKET_FLIGHT', type: 'flight' },
  { id: '2', label: 'Train', icon: 'train', color: '#558B2F', bgColor: '#F1F8E9', event: 'TOUCH_TICKET_TRAIN', type: 'train' },
  { id: '3', label: 'Bus', icon: 'directions-bus', color: '#E65100', bgColor: '#FFF3E0', event: 'TOUCH_TICKET_BUS', type: 'bus' },
];

export default function TicketBookingIndexScreen() {
  const collector = useBehavioralCollector();
  const params = useLocalSearchParams<{ type?: string }>();

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_TICKET_HUB');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_TICKET_HUB');
      // If navigated with a type param, auto-forward to search
      if (params.type) {
        router.replace({ pathname: '/ticket-booking/search', params: { type: params.type } } as any);
      }
      return () => {};
    }, [collector, params.type])
  );

  if (params.type) return null; // will redirect

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TICKET_HUB_BACK');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TICKET_HUB_BACK');
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket Booking</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitle}>Where would you like to go?</Text>
        <View style={styles.modeGrid}>
          {TRANSPORT_MODES.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={styles.modeCard}
              onPress={() =>
                router.push({ pathname: '/ticket-booking/search', params: { type: m.type } } as any)
              }
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, m.event);
              }}
              onPressOut={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchEnd(pageX, pageY, force ?? 0, m.event);
              }}
            >
              <View style={[styles.modeIconWrap, { backgroundColor: m.bgColor }]}>
                <MaterialIcons name={m.icon} size={40} color={m.color} />
              </View>
              <Text style={[styles.modeLabel, { color: m.color }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.offerCard}>
          <MaterialIcons name="local-offer" size={18} color="#C62828" />
          <Text style={styles.offerText}>
            Use code <Text style={styles.offerCode}>BOB200</Text> to save ₹200 on your next booking!
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#263238',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  headerSpacer: { width: 36 },

  body: { flex: 1, paddingHorizontal: 24, paddingTop: 40, alignItems: 'center' },

  subtitle: { fontSize: 20, fontWeight: '700', color: '#212121', marginBottom: 32 },

  modeGrid: { flexDirection: 'row', gap: 20, marginBottom: 36 },

  modeCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
  },
  modeIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  modeLabel: { fontSize: 15, fontWeight: '700' },

  offerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    width: '100%',
  },
  offerText: { flex: 1, fontSize: 13, color: '#B71C1C', lineHeight: 18 },
  offerCode: { fontWeight: '800', letterSpacing: 0.5 },
});
