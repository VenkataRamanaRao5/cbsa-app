import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

type ServiceItem = {
  id: string;
  name: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const QUICK_ACTIONS: ServiceItem[] = [
  { id: '1', name: 'Debit card block', icon: 'block' },
  { id: '2', name: 'Stop cheque', icon: 'cancel' },
  { id: '3', name: 'Transaction history', icon: 'receipt-long' },
  { id: '4', name: 'Generate MMID', icon: 'badge' },
];

const EXPLORE_SERVICES: ServiceItem[] = [
  { id: '1', name: 'My account', icon: 'person' },
  { id: '2', name: 'My favorites', icon: 'favorite' },
  { id: '3', name: 'Passbook', icon: 'book' },
  { id: '4', name: 'Request services', icon: 'edit-note' },
  { id: '5', name: 'Fund transfer', icon: 'swap-horiz' },
  { id: '6', name: 'Recharge & bill Pay', icon: 'lightbulb' },
  { id: '7', name: 'Cash on mobile', icon: 'smartphone' },
  { id: '8', name: 'Baroda FASTag', icon: 'directions-car' },
  { id: '9', name: 'Fixed/Systematic Deposit Plan', icon: 'account-balance' },
  { id: '10', name: 'Investment', icon: 'trending-up' },
  { id: '11', name: 'Digital loan', icon: 'description' },
  { id: '12', name: 'Shop', icon: 'shopping-cart' },
  { id: '13', name: 'Invite & earn', icon: 'card-giftcard' },
  { id: '14', name: 'Currency converter', icon: 'currency-exchange' },
];

const APPLY_FOR: ServiceItem[] = [
  { id: '1', name: 'Mudra loan', icon: 'account-balance' },
  { id: '2', name: 'MSME loan', icon: 'business' },
  { id: '3', name: 'Home loan', icon: 'home' },
  { id: '4', name: 'Car loan', icon: 'directions-car' },
  { id: '5', name: 'Digital BKCC loan', icon: 'smartphone' },
  { id: '6', name: 'Locker', icon: 'lock' },
  { id: '7', name: 'Life insurance', icon: 'shield' },
  { id: '8', name: 'Motor insurance', icon: 'directions-car' },
  { id: '9', name: 'Health insurance', icon: 'favorite' },
  { id: '10', name: 'Travel insurance', icon: 'flight' },
  { id: '11', name: 'Property insurance', icon: 'apartment' },
  { id: '12', name: 'bob credit card', icon: 'credit-card' },
  { id: '13', name: 'Agriculture loan', icon: 'grass' },
  { id: '14', name: 'KVP account', icon: 'article' },
  { id: '15', name: 'SCSS account', icon: 'elderly' },
  { id: '16', name: 'TDS/TCS certificate', icon: 'description' },
];

export default function MoreScreen() {
  const collector = useBehavioralCollector();
  const lastY = useRef(0);

  // Record page navigation event when explore tab comes into focus
  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_MORE');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_MORE');
      return () => {};
    }, [collector])
  );

  const ServiceCard = ({ item, section }: { item: ServiceItem; section: string }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => {
        if (item.name === 'My account') {
          router.push('/account');
        } else if (item.name === 'Transaction history') {
          router.push('/transaction/1');
        }
      }}
      onPressIn={(e) => {
        const { pageX, pageY, force } = e.nativeEvent;
        collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_${section}_${item.id}`);
      }}
      onPressOut={(e) => {
        const { pageX, pageY, force } = e.nativeEvent;
        collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_${section}_${item.id}`);
      }}
    >
      <View style={styles.serviceIconContainer}>
        <MaterialIcons name={item.icon} size={24} color="#5C6BC0" />
      </View>
      <Text style={styles.serviceName} numberOfLines={2}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>B</Text>
          <Text style={styles.logoSubtext}>bob World</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="search" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/account')}
          >
            <Text style={styles.profileText}>CV</Text>
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const dy = y - lastY.current;
          lastY.current = y;
          collector?.recordScroll(dy, 'SCROLL_MORE_TAB');
        }}
      >
        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.servicesGrid}>
            {QUICK_ACTIONS.map((item) => (
              <ServiceCard key={item.id} item={item} section="QUICK" />
            ))}
          </View>
        </View>

        {/* Explore Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <View style={styles.servicesGrid}>
            {EXPLORE_SERVICES.map((item) => (
              <ServiceCard key={item.id} item={item} section="EXPLORE" />
            ))}
          </View>
        </View>

        {/* Apply For Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply for</Text>
          <View style={styles.servicesGrid}>
            {APPLY_FOR.map((item) => (
              <ServiceCard key={item.id} item={item} section="APPLY" />
            ))}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    backgroundColor: '#FF5722',
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
    borderRadius: 4,
    color: '#FFFFFF',
  },
  logoSubtext: {
    fontSize: 12,
    color: '#FF5722',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  iconText: {
    fontSize: 20,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#5C6BC0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C6BC0',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5722',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Content
  content: {
    flex: 1,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceCard: {
    width: (width - 32) / 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceIcon: {
    fontSize: 22,
  },
  serviceName: {
    fontSize: 11,
    color: '#546E7A',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 2,
  },
});

