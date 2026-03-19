import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TransportType = 'flight' | 'train' | 'bus';

type ResultItem = {
  id: string;
  name: string;       // airline / train name / bus operator
  number?: string;    // flight no / train no
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  classAvail: string;
  seatsLeft: number;
  stops?: number;     // flights
  rating?: number;    // buses
};

function generateResults(type: TransportType, from: string, to: string, travelClass: string): ResultItem[] {
  const seed = (from.length + to.length) % 3;
  if (type === 'flight') {
    return [
      { id: 'f1', name: 'IndiGo', number: '6E-291', departure: '06:05', arrival: '08:30', duration: '2h 25m', price: 4899 + seed * 500, classAvail: travelClass, seatsLeft: 12, stops: 0 },
      { id: 'f2', name: 'Air India', number: 'AI-131', departure: '09:15', arrival: '12:10', duration: '2h 55m', price: 5299 + seed * 300, classAvail: travelClass, seatsLeft: 7, stops: 1 },
      { id: 'f3', name: 'SpiceJet', number: 'SG-516', departure: '13:45', arrival: '16:05', duration: '2h 20m', price: 4599 + seed * 200, classAvail: travelClass, seatsLeft: 23, stops: 0 },
      { id: 'f4', name: 'Vistara', number: 'UK-882', departure: '19:00', arrival: '21:25', duration: '2h 25m', price: 6199 + seed * 400, classAvail: travelClass, seatsLeft: 4, stops: 0 },
    ];
  }
  if (type === 'train') {
    return [
      { id: 't1', name: 'Rajdhani Express', number: '12301', departure: '16:00', arrival: '08:20+1', duration: '16h 20m', price: 1895 + seed * 100, classAvail: travelClass, seatsLeft: 45 },
      { id: 't2', name: 'Shatabdi Express', number: '12001', departure: '06:15', arrival: '14:10', duration: '7h 55m', price: 1350 + seed * 50, classAvail: travelClass, seatsLeft: 0 },
      { id: 't3', name: 'Duronto Express', number: '12213', departure: '23:30', arrival: '14:05+1', duration: '14h 35m', price: 1650 + seed * 80, classAvail: travelClass, seatsLeft: 18 },
    ];
  }
  return [
    { id: 'b1', name: 'RedBus Travels', departure: '21:00', arrival: '06:30+1', duration: '9h 30m', price: 799 + seed * 50, classAvail: travelClass, seatsLeft: 14, rating: 4 },
    { id: 'b2', name: 'VRL Travels', departure: '22:00', arrival: '07:45+1', duration: '9h 45m', price: 899 + seed * 30, classAvail: travelClass, seatsLeft: 6, rating: 5 },
    { id: 'b3', name: 'Paulo Travels', departure: '20:00', arrival: '05:30+1', duration: '9h 30m', price: 749 + seed * 20, classAvail: travelClass, seatsLeft: 0, rating: 4 },
  ];
}

const COLOR: Record<TransportType, string> = { flight: '#1565C0', train: '#558B2F', bus: '#E65100' };
const ICON: Record<TransportType, keyof typeof MaterialIcons.glyphMap> = { flight: 'flight', train: 'train', bus: 'directions-bus' };

export default function TicketResultsScreen() {
  const collector = useBehavioralCollector();
  const params = useLocalSearchParams<{
    type: string; from: string; to: string; date: string;
    passengers: string; travelClass: string;
  }>();
  const t = (params.type ?? 'flight') as TransportType;
  const color = COLOR[t] ?? '#1565C0';
  const iconName = ICON[t] ?? 'flight';

  const results = useMemo(
    () => generateResults(t, params.from ?? '', params.to ?? '', params.travelClass ?? ''),
    [t, params.from, params.to, params.travelClass]
  );

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, `PAGE_ENTER_TICKET_RESULTS_${t.toUpperCase()}`);
      collector?.recordTouchEnd(0, 0, 0, `PAGE_ENTER_TICKET_RESULTS_${t.toUpperCase()}`);
      return () => {};
    }, [collector, t])
  );

  const renderItem = ({ item }: { item: ResultItem }) => {
    const soldOut = item.seatsLeft === 0;
    return (
      <TouchableOpacity
        style={[styles.resultCard, soldOut && styles.resultCardSoldOut]}
        disabled={soldOut}
        onPress={() =>
          router.push({
            pathname: '/ticket-booking/confirm',
            params: {
              type: t,
              from: params.from,
              to: params.to,
              date: params.date,
              passengers: params.passengers,
              travelClass: params.travelClass,
              resultId: item.id,
              name: item.name,
              number: item.number ?? '',
              departure: item.departure,
              arrival: item.arrival,
              duration: item.duration,
              price: String(item.price),
            },
          } as any)
        }
        onPressIn={(e) => {
          const { pageX, pageY, force } = e.nativeEvent;
          collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_TICKET_RESULT_SELECT_${item.id}`);
        }}
        onPressOut={(e) => {
          const { pageX, pageY, force } = e.nativeEvent;
          collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_TICKET_RESULT_SELECT_${item.id}`);
        }}
      >
        <View style={styles.resultTopRow}>
          <View style={[styles.carrierBadge, { backgroundColor: `${color}18` }]}>
            <MaterialIcons name={iconName} size={16} color={color} />
            <Text style={[styles.carrierName, { color }]}>{item.name}</Text>
            {item.number && <Text style={styles.carrierNumber}>{item.number}</Text>}
          </View>
          {item.seatsLeft > 0 ? (
            <View style={styles.seatsBadge}>
              <Text style={styles.seatsText}>{item.seatsLeft} seats left</Text>
            </View>
          ) : (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>Sold Out</Text>
            </View>
          )}
        </View>

        <View style={styles.timingRow}>
          <View style={styles.timingBlock}>
            <Text style={styles.timingTime}>{item.departure}</Text>
            <Text style={styles.timingCity}>{params.from}</Text>
          </View>
          <View style={styles.timingMiddle}>
            <Text style={styles.durationText}>{item.duration}</Text>
            <View style={styles.durationLine}>
              <View style={styles.durationDot} />
              <View style={styles.durationBar} />
              <View style={styles.durationDot} />
            </View>
            {t === 'flight' && (
              <Text style={styles.stopsText}>{item.stops === 0 ? 'Non-stop' : `${item.stops} stop`}</Text>
            )}
            {t === 'bus' && item.rating && (
              <View style={styles.ratingRow}>
                <MaterialIcons name="star" size={11} color="#FFA000" />
                <Text style={styles.ratingText}>{item.rating}.0</Text>
              </View>
            )}
          </View>
          <View style={[styles.timingBlock, styles.timingRight]}>
            <Text style={styles.timingTime}>{item.arrival}</Text>
            <Text style={styles.timingCity}>{params.to}</Text>
          </View>
        </View>

        <View style={styles.resultBottom}>
          <View>
            <Text style={styles.classLabel}>{item.classAvail}</Text>
            <Text style={styles.priceText}>
              ₹{(item.price * parseInt(params.passengers ?? '1', 10)).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.perPaxText}>for {params.passengers} pax</Text>
          </View>
          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: soldOut ? '#EEEEEE' : color }]}
            disabled={soldOut}
            onPress={() =>
              router.push({
                pathname: '/ticket-booking/confirm',
                params: {
                  type: t, from: params.from, to: params.to, date: params.date,
                  passengers: params.passengers, travelClass: params.travelClass,
                  resultId: item.id, name: item.name, number: item.number ?? '',
                  departure: item.departure, arrival: item.arrival, duration: item.duration,
                  price: String(item.price),
                },
              } as any)
            }
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TICKET_BOOK_NOW');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TICKET_BOOK_NOW');
            }}
          >
            <Text style={[styles.selectButtonText, soldOut && { color: '#9E9E9E' }]}>
              {soldOut ? 'Sold Out' : 'Book'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: color }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_TICKET_RESULTS_BACK`);
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_TICKET_RESULTS_BACK`);
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerRoute}>{params.from} → {params.to}</Text>
          <Text style={styles.headerMeta}>{params.date} · {params.passengers} pax · {params.travelClass}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={results}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="search-off" size={48} color="#BDBDBD" />
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        }
      />
    </View>
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
  headerInfo: { flex: 1 },
  headerRoute: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  headerMeta: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerSpacer: { width: 36 },

  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  resultCardSoldOut: { opacity: 0.6 },

  resultTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  carrierBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  carrierName: { fontSize: 13, fontWeight: '700' },
  carrierNumber: { fontSize: 11, color: '#9E9E9E' },
  seatsBadge: { backgroundColor: '#FFF8E1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  seatsText: { fontSize: 11, fontWeight: '700', color: '#F57F17' },
  soldOutBadge: { backgroundColor: '#FFEBEE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  soldOutText: { fontSize: 11, fontWeight: '700', color: '#C62828' },

  timingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  timingBlock: { flex: 1 },
  timingRight: { alignItems: 'flex-end' },
  timingTime: { fontSize: 22, fontWeight: '800', color: '#212121' },
  timingCity: { fontSize: 12, color: '#78909C' },
  timingMiddle: { flex: 1.5, alignItems: 'center', paddingHorizontal: 8 },
  durationText: { fontSize: 12, color: '#9E9E9E', marginBottom: 6 },
  durationLine: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  durationDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#BDBDBD' },
  durationBar: { flex: 1, height: 1, backgroundColor: '#BDBDBD' },
  stopsText: { fontSize: 11, color: '#78909C', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 2 },
  ratingText: { fontSize: 11, color: '#78909C' },

  resultBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 12 },
  classLabel: { fontSize: 11, color: '#9E9E9E', marginBottom: 2 },
  priceText: { fontSize: 22, fontWeight: '800', color: '#212121' },
  perPaxText: { fontSize: 11, color: '#9E9E9E' },
  selectButton: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  selectButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  emptyBox: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyText: { marginTop: 12, fontSize: 16, color: '#BDBDBD' },
});
