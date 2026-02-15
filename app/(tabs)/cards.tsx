import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

type CardTab = 'Debit cards' | 'Credit card' | 'Wearable';

type CardAction = {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const CARD_ACTIONS: CardAction[] = [
  { id: '1', label: 'Manage', icon: 'check-circle' },
  { id: '2', label: 'Set PIN', icon: 'lock' },
  { id: '3', label: 'Link card for QR payments', icon: 'qr-code' },
  { id: '4', label: 'Manage tokens', icon: 'token' },
  { id: '5', label: 'View wallet balance', icon: 'account-balance-wallet' },
  { id: '6', label: 'Load money', icon: 'add-card' },
];

export default function CardsScreen() {
  const [selectedTab, setSelectedTab] = useState<CardTab>('Debit cards');
  const collector = useBehavioralCollector();
  const lastY = useRef(0);

  const tabs: CardTab[] = ['Debit cards', 'Credit card', 'Wearable'];

  // Record page navigation event when cards tab comes into focus
  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_CARDS');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_CARDS');
      return () => {};
    }, [collector])
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
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileText}>CV</Text>
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContentContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_CARD_TAB_${tab.toUpperCase()}`);
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
          collector?.recordScroll(dy, 'SCROLL_CARDS');
        }}
      >
        {/* Card Display */}
        <View style={styles.cardContainer}>
          <View style={styles.debitCard}>
            <View style={styles.cardHeader}>
              <View style={styles.bankLogo}>
                <Text style={styles.bankLogoText}>B</Text>
                <Text style={styles.bankName}>Bank of Baroda</Text>
              </View>
              <Text style={styles.ncmc}>NCMC</Text>
            </View>
            
            <Text style={styles.cardNumber}>•••• XXXX XXXX 8235</Text>
            
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.validLabel}>VALID THRU</Text>
                <Text style={styles.validDate}>07/28</Text>
              </View>
              <View style={styles.cardBranding}>
                <MaterialIcons name="contactless" size={20} color="#FFF" />
                <Text style={styles.rupay}>RuPay</Text>
              </View>
            </View>
            
            <Text style={styles.cardType}>Physical</Text>
          </View>
          
          <Text style={styles.tapHint}>Tap to view card details</Text>
        </View>

        {/* Account Number */}
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Account number</Text>
          <Text style={styles.accountNumber}>•••••••4821</Text>
        </View>

        {/* Collapsible Sections */}
        <TouchableOpacity 
          style={styles.collapsibleRow}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_ACTIVE_CHANNELS');
          }}
        >
          <Text style={styles.collapsibleText}>Your current active channels</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.collapsibleRow}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_NCMC_BALANCE');
          }}
        >
          <Text style={styles.collapsibleText}>NCMC Wallet balance</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <View style={styles.lockBlockRow}>
            <TouchableOpacity 
              style={styles.lockButton}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_LOCK_CARD');
              }}
            >
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockText}>Lock</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity 
              style={styles.blockButton}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_BLOCK_CARD');
              }}
            >
              <Text style={styles.blockIcon}>🚫</Text>
              <Text style={styles.blockText}>Block</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card Actions List */}
        <View style={styles.actionsList}>
          {CARD_ACTIONS.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionRow, index !== CARD_ACTIONS.length - 1 && styles.actionRowBorder]}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_CARD_ACTION_${action.id}`);
              }}
            >
              <View style={styles.actionIcon}>
                <MaterialIcons name={action.icon} size={20} color="#5C6BC0" />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <MaterialIcons name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Apply Section */}
        <View style={styles.applySection}>
          <Text style={styles.applySectionText}>Apply for bob debit card</Text>
          <TouchableOpacity 
            style={styles.applyButton}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_APPLY_DEBIT_CARD');
            }}
          >
            <Text style={styles.applyButtonText}>Apply now</Text>
          </TouchableOpacity>
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
    marginRight: 24,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF5722',
  },
  tabText: {
    fontSize: 14,
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
  },

  // Card Container
  cardContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  debitCard: {
    width: width - 48,
    backgroundColor: '#9C1B3C',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  bankLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bankLogoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    borderRadius: 4,
  },
  bankName: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  ncmc: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardNumber: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  validLabel: {
    fontSize: 8,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  validDate: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardBranding: {
    alignItems: 'flex-end',
  },
  contactless: {
    fontSize: 18,
    marginBottom: 4,
  },
  rupay: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    fontStyle: 'italic',
  },
  cardType: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  tapHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#757575',
  },

  // Account Row
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  accountLabel: {
    fontSize: 14,
    color: '#212121',
  },
  accountNumber: {
    fontSize: 14,
    color: '#757575',
  },

  // Collapsible Rows
  collapsibleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  collapsibleText: {
    fontSize: 14,
    color: '#212121',
  },
  chevron: {
    fontSize: 20,
    color: '#BDBDBD',
  },

  // Quick Actions
  quickActions: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  lockBlockRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  lockButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  lockIcon: {
    fontSize: 18,
  },
  lockText: {
    fontSize: 14,
    color: '#212121',
  },
  divider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  blockButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  blockIcon: {
    fontSize: 18,
  },
  blockText: {
    fontSize: 14,
    color: '#212121',
  },

  // Actions List
  actionsList: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionIconText: {
    fontSize: 18,
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    color: '#212121',
  },
  actionChevron: {
    fontSize: 20,
    color: '#BDBDBD',
  },

  // Apply Section
  applySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  applySectionText: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#1A237E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
