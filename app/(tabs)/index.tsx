import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../AuthContext';

const { width } = Dimensions.get('window');

type Service = {
  id: string;
  name: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  badge?: string;
};

const SERVICES: Service[] = [
  { id: '1', name: 'Fund transfer', icon: 'swap-horiz' },
  { id: '2', name: 'Fixed/Systematic Deposit Plan', icon: 'savings' },
  { id: '3', name: 'Periodic updation of KYC(Re-KYC)', icon: 'assignment' },
  { id: '4', name: 'Forex', icon: 'currency-exchange', badge: 'NEW' },
  { id: '5', name: 'Apply IPO', icon: 'trending-up' },
  { id: '6', name: 'Digital loan', icon: 'description' },
  { id: '7', name: 'Mutual funds', icon: 'pie-chart' },
  { id: '8', name: 'Brands2You', icon: 'thumb-up' },
  { id: '9', name: 'Healthcare Services', icon: 'favorite' },
  { id: '10', name: 'Xplore the Globe', icon: 'card-giftcard' },
  { id: '11', name: 'Credit score', icon: 'score', badge: 'Free' },
  { id: '12', name: 'Mobile recharge', icon: 'smartphone' },
  { id: '13', name: 'Flight booking', icon: 'flight' },
  { id: '14', name: 'Bus booking', icon: 'directions-bus' },
  { id: '15', name: 'Train booking', icon: 'train' },
  { id: '16', name: 'Send money abroad', icon: 'language' },
];

export default function DashboardScreen() {
  const { isLoggedIn } = useAuth();
  const [showBalance, setShowBalance] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Accounts');
  const [trendingExpanded, setTrendingExpanded] = useState(true);
  const collector = useBehavioralCollector();
  const lastY = useRef(0);

  const tabs = ['Accounts', 'Save', 'Invest', 'Borrow', 'Shop & pay'];

  // Record page navigation event when home tab comes into focus
  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_HOME');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_HOME');
      return () => {};
    }, [collector])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>B</Text>
          <Text style={styles.logoSubtext}>bob world</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_SEARCH');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_SEARCH');
            }}
          >
            <MaterialIcons name="search" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.profileButton}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_PROFILE');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_PROFILE');
            }}
          >
            <Text style={styles.profileText}>CV</Text>
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContentContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_TAB_${tab.toUpperCase()}`);
              }}
              onPressOut={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_TAB_${tab.toUpperCase()}`);
              }}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const dy = y - lastY.current;
          lastY.current = y;
          collector?.recordScroll(dy, 'SCROLL_DASHBOARD');
        }}
      >
        {/* Balance Card */}
        <TouchableOpacity
          style={styles.balanceCard}
          activeOpacity={0.9}
          onPress={() => router.push('/account')}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_BALANCE_CARD');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_BALANCE_CARD');
          }}
        >
          <Text style={styles.accountTitle}>Savings account - 2783</Text>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceAmount}>
                {showBalance ? '₹ 69,420' : '₹ X,XX,XXX'}
              </Text>
              <Text style={styles.balanceLabel}>Available balance</Text>
            </View>
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowBalance(!showBalance)}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_BALANCE_TOGGLE');
              }}
              onPressOut={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_BALANCE_TOGGLE');
              }}
            >
              <Text style={styles.eyeIcon}>👁️</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.pillButton}
            onPress={() => router.push('/account')}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_VIEW_ACCOUNTS');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_VIEW_ACCOUNTS');
            }}
          >
            <Text style={styles.pillButtonText}>View all accounts</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.pillButton}
            onPress={() => router.push('/explore')}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TRANSACTION_HISTORY');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TRANSACTION_HISTORY');
            }}
          >
            <Text style={styles.pillButtonText}>Transaction history</Text>
          </TouchableOpacity>
        </View>

        {/* What's Trending Section */}
        <View style={styles.trendingSection}>
          <TouchableOpacity 
            style={styles.trendingHeader}
            onPress={() => setTrendingExpanded(!trendingExpanded)}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_TRENDING_TOGGLE');
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_TRENDING_TOGGLE');
            }}
          >
            <Text style={styles.trendingTitle}>What's trending</Text>
            <View style={styles.trendingToggle}>
              <Text style={styles.toggleIcon}>{trendingExpanded ? '🔼' : '🔽'}</Text>
            </View>
          </TouchableOpacity>

          {trendingExpanded && (
            <View style={styles.servicesGrid}>
              {SERVICES.map((service) => (
                <ServiceCard 
                  key={service.id} 
                  service={service} 
                  collector={collector}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ServiceCard({ 
  service, 
  collector 
}: { 
  service: Service;
  collector: any;
}) {
  return (
    <TouchableOpacity 
      style={styles.serviceCard}
      onPressIn={(e) => {
        const { pageX, pageY, force } = e.nativeEvent;
        collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_SERVICE_${service.id}`);
      }}
      onPressOut={(e) => {
        const { pageX, pageY, force } = e.nativeEvent;
        collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_SERVICE_${service.id}`);
      }}
    >
      <View style={styles.serviceIconContainer}>
        <MaterialIcons name={service.icon} size={24} color="#5C6BC0" />
        {service.badge && (
          <View style={[
            styles.serviceBadge,
            service.badge === 'NEW' && styles.badgeNew,
            service.badge === 'Free' && styles.badgeFree
          ]}>
            <Text style={styles.badgeText}>{service.badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.serviceName}>{service.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EAF6',
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

  // Tabs
  tabWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 10,
  },
  tabContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 12,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF5722',
  },
  tabText: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#212121',
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Balance Card
  balanceCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FF7043',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  accountTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
  eyeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(92, 107, 192, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 20,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  pillButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#90A4AE',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  pillButtonText: {
    color: '#546E7A',
    fontSize: 13,
    fontWeight: '500',
  },

  // Trending Section
  trendingSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  trendingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  trendingToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#5C6BC0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: 16,
  },

  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  serviceCard: {
    width: (width - 52) / 4, // 4 columns with gaps
    alignItems: 'center',
    paddingVertical: 12,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceIcon: {
    fontSize: 28,
  },
  serviceBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeNew: {
    backgroundColor: '#FF5252',
  },
  badgeFree: {
    backgroundColor: '#4CAF50',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  serviceName: {
    fontSize: 11,
    color: '#546E7A',
    textAlign: 'center',
    lineHeight: 14,
  },
});
