import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type TransportType = 'flight' | 'train' | 'bus';

const CONFIG: Record<TransportType, {
  label: string;
  color: string;
  fromLabel: string;
  toLabel: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  classes: string[];
}> = {
  flight: {
    label: 'Flight',
    color: '#1565C0',
    fromLabel: 'From (City / Airport)',
    toLabel: 'To (City / Airport)',
    icon: 'flight',
    classes: ['Economy', 'Business', 'First Class'],
  },
  train: {
    label: 'Train',
    color: '#558B2F',
    fromLabel: 'From Station',
    toLabel: 'To Station',
    icon: 'train',
    classes: ['Sleeper', '3A', '2A', '1A'],
  },
  bus: {
    label: 'Bus',
    color: '#E65100',
    fromLabel: 'From City',
    toLabel: 'To City',
    icon: 'directions-bus',
    classes: ['Sleeper', 'Semi-Sleeper', 'Seater'],
  },
};

const POPULAR_ROUTES: Record<TransportType, Array<[string, string]>> = {
  flight: [['Delhi', 'Mumbai'], ['Bangalore', 'Hyderabad'], ['Mumbai', 'Chennai']],
  train: [['Delhi', 'Mumbai'], ['Kolkata', 'Chennai'], ['Bangalore', 'Mysuru']],
  bus: [['Hyderabad', 'Bangalore'], ['Mumbai', 'Pune'], ['Delhi', 'Jaipur']],
};

export default function TicketSearchScreen() {
  const collector = useBehavioralCollector();
  const { type } = useLocalSearchParams<{ type: string }>();
  const t = (type ?? 'flight') as TransportType;
  const config = CONFIG[t] ?? CONFIG.flight;

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [passengers, setPassengers] = useState(1);
  const [travelClass, setTravelClass] = useState(config.classes[0]);

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, `PAGE_ENTER_TICKET_SEARCH_${t.toUpperCase()}`);
      collector?.recordTouchEnd(0, 0, 0, `PAGE_ENTER_TICKET_SEARCH_${t.toUpperCase()}`);
      return () => {};
    }, [collector, t])
  );

  const canSearch = from.trim() && to.trim() && date;

  const handleSwap = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
    collector?.recordTouchStart(0, 0, 0, 'TOUCH_TICKET_SWAP');
    collector?.recordTouchEnd(0, 0, 0, 'TOUCH_TICKET_SWAP');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: config.color }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_TICKET_${t.toUpperCase()}_SEARCH_BACK`);
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_TICKET_${t.toUpperCase()}_SEARCH_BACK`);
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>
            <MaterialIcons name={config.icon} size={18} color="#FFFFFF" /> {config.label} Search
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* From / To */}
        <View style={styles.routeCard}>
          <View style={styles.routeField}>
            <Text style={styles.routeFieldLabel}>{config.fromLabel}</Text>
            <TextInput
              style={styles.routeInput}
              placeholder="Enter origin"
              value={from}
              onChangeText={(v) => {
                collector?.recordKeystroke(`KEYSTROKE_TICKET_FROM_${t.toUpperCase()}`);
                setFrom(v);
              }}
            />
          </View>

          <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
            <MaterialIcons name="swap-vert" size={24} color={config.color} />
          </TouchableOpacity>

          <View style={styles.routeField}>
            <Text style={styles.routeFieldLabel}>{config.toLabel}</Text>
            <TextInput
              style={styles.routeInput}
              placeholder="Enter destination"
              value={to}
              onChangeText={(v) => {
                collector?.recordKeystroke(`KEYSTROKE_TICKET_TO_${t.toUpperCase()}`);
                setTo(v);
              }}
            />
          </View>
        </View>

        {/* Date */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Date of Journey</Text>
          <TextInput
            style={styles.textField}
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={(v) => {
              collector?.recordKeystroke('KEYSTROKE_TICKET_DATE');
              setDate(v);
            }}
          />
        </View>

        {/* Passengers */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Passengers</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => passengers > 1 && setPassengers(passengers - 1)}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TICKET_PAX_DEC');
              }}
              onPressOut={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TICKET_PAX_DEC');
              }}
            >
              <MaterialIcons name="remove" size={22} color={config.color} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{passengers}</Text>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => passengers < 9 && setPassengers(passengers + 1)}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TICKET_PAX_INC');
              }}
              onPressOut={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TICKET_PAX_INC');
              }}
            >
              <MaterialIcons name="add" size={22} color={config.color} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Class */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Travel Class</Text>
          <View style={styles.chipRow}>
            {config.classes.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, travelClass === c && { borderColor: config.color, backgroundColor: `${config.color}18` }]}
                onPress={() => setTravelClass(c)}
                onPressIn={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_TICKET_CLASS_${c.replace(/\s/g, '_').toUpperCase()}`);
                }}
                onPressOut={(e) => {
                  const { pageX, pageY, force } = e.nativeEvent;
                  collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_TICKET_CLASS_${c.replace(/\s/g, '_').toUpperCase()}`);
                }}
              >
                <Text style={[styles.chipText, travelClass === c && { color: config.color }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular routes */}
        <Text style={styles.popularLabel}>Popular Routes</Text>
        {POPULAR_ROUTES[t].map(([f, to2], i) => (
          <TouchableOpacity
            key={i}
            style={styles.popularRoute}
            onPress={() => { setFrom(f); setTo(to2); }}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TICKET_POPULAR_ROUTE');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TICKET_POPULAR_ROUTE');
            }}
          >
            <Text style={styles.popularRouteText}>{f}</Text>
            <MaterialIcons name="arrow-forward" size={14} color="#9E9E9E" />
            <Text style={styles.popularRouteText}>{to2}</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: canSearch ? config.color : '#BDBDBD' }]}
          disabled={!canSearch}
          onPress={() =>
            router.push({
              pathname: '/ticket-booking/results',
              params: { type: t, from, to, date, passengers: String(passengers), travelClass },
            } as any)
          }
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_TICKET_SEARCH_${t.toUpperCase()}`);
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_TICKET_SEARCH_${t.toUpperCase()}`);
          }}
        >
          <MaterialIcons name="search" size={20} color="#FFFFFF" />
          <Text style={styles.searchButtonText}>Search {config.label}s</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: { padding: 4 },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  headerSpacer: { width: 36 },

  content: { flex: 1, paddingHorizontal: 16 },

  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  routeField: { paddingVertical: 6 },
  routeFieldLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  routeInput: { fontSize: 18, fontWeight: '700', color: '#212121', borderBottomWidth: 1, borderBottomColor: '#EEEEEE', paddingBottom: 6 },
  swapButton: { alignSelf: 'flex-end', marginVertical: 6, padding: 4 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  fieldLabel: { fontSize: 12, color: '#9E9E9E', fontWeight: '600', marginBottom: 10 },
  textField: { borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingVertical: 6, fontSize: 16, color: '#212121' },

  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  counterBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, borderColor: '#BDBDBD', justifyContent: 'center', alignItems: 'center',
  },
  counterValue: { fontSize: 32, fontWeight: '700', color: '#212121', minWidth: 50, textAlign: 'center' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#9E9E9E' },

  popularLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 20,
    marginBottom: 10,
  },
  popularRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  popularRouteText: { fontSize: 13, fontWeight: '600', color: '#546E7A' },

  footer: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12 },
  searchButton: {
    borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  searchButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
