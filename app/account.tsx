import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useRef, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type MenuItem = {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  action?: () => void;
};

const MENU_ITEMS: MenuItem[] = [
  { id: '1', label: 'KYC/CKYC Details', icon: 'assignment' },
  { id: '2', label: 'Customer profile updation', icon: 'person' },
  { id: '3', label: 'Contact details', icon: 'phone' },
  { id: '4', label: 'Change login PIN', icon: 'lock', action: () => router.push('/change-pin') },
  { id: '5', label: 'Change transaction PIN', icon: 'vpn-key' },
  { id: '6', label: 'Switch to Classic', icon: 'swap-horiz' },
  { id: '7', label: 'Digital planner', icon: 'event' },
];

const BOTTOM_ACTIONS: MenuItem[] = [
  { id: '1', label: 'Alerts & notifications', icon: 'notifications' },
  { id: '2', label: 'App settings', icon: 'settings' },
  { id: '3', label: 'Need help', icon: 'help' },
];

export default function AccountScreen() {
  const collector = useBehavioralCollector();
  const lastY = useRef(0);

  useFocusEffect(
      useCallback(() => {
        collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_ACCOUNT');
        collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_ACCOUNT');
        return () => {};
      }, [collector])
    );

  return (
    <View style={styles.container}>
      {/* Orange Header */}
      <View style={styles.headerSection}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_BACK');
          }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.profileRow}>
          <View style={styles.profileInfo}>
            <Text style={styles.customerLabel}>Customer ID: XXXXXXXX</Text>
            <Text style={styles.lastLogin}>Last login: Feb 07, 2026 16:30:59</Text>
          </View>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>CV</Text>
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <MaterialIcons name="camera-alt" size={16} color="#FF5722" />
            </TouchableOpacity>
          </View>
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
          collector?.recordScroll(dy, 'SCROLL_PROFILE');
        }}
      >
        {/* Credit Score Card */}
        <View style={styles.creditScoreCard}>
          <View style={styles.creditScoreLeft}>
            <MaterialIcons name="bar-chart" size={24} color="#5C6BC0" />
            <Text style={styles.creditScoreLabel}>Credit score</Text>
          </View>
          <TouchableOpacity 
            style={styles.getScoreButton}
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_GET_CREDIT_SCORE');
            }}
          >
            <Text style={styles.getScoreText}>Get latest score</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, index !== MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              onPress={item.action}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_MENU_${item.id}`);
              }}
              onPressOut={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_MENU_${item.id}`);
              }}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <MaterialIcons name={item.icon} size={20} color="#5C6BC0" />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {BOTTOM_ACTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.bottomAction}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_BOTTOM_${item.id}`);
              }}
            >
              <View style={styles.bottomActionIcon}>
                <MaterialIcons name={item.icon} size={20} color="#5C6BC0" />
              </View>
              <Text style={styles.bottomActionLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_LOGOUT');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_LOGOUT');
          }}
        >
          <MaterialIcons name="logout" size={20} color="#FF5722" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

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
  
  // Header Section
  headerSection: {
    backgroundColor: '#FF5722',
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 16,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  customerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  lastLogin: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#5C6BC0',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5C6BC0',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#5C6BC0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 12,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -12,
  },

  // Credit Score Card
  creditScoreCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  creditScoreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creditScoreIcon: {
    fontSize: 24,
  },
  creditScoreLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  getScoreButton: {
    backgroundColor: '#1A237E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  getScoreText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Menu Card
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconText: {
    fontSize: 18,
  },
  menuLabel: {
    fontSize: 15,
    color: '#212121',
  },
  chevron: {
    fontSize: 24,
    color: '#BDBDBD',
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  bottomAction: {
    alignItems: 'center',
  },
  bottomActionIcon: {
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
  bottomActionIconText: {
    fontSize: 22,
  },
  bottomActionLabel: {
    fontSize: 11,
    color: '#546E7A',
    textAlign: 'center',
    maxWidth: 80,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53935',
  },
});

