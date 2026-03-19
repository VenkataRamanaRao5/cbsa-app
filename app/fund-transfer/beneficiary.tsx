import { useBehavioralCollector } from '@/services/BehavioralContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Beneficiary = {
  id: string;
  name: string;
  identifier: string; // UPI ID, account number, etc.
  bank: string;
  initials: string;
};

const SAVED_BENEFICIARIES: Beneficiary[] = [
  { id: '1', name: 'Ramana Rao', identifier: 'ramana@upi', bank: 'State Bank of India', initials: 'RR' },
  { id: '2', name: 'Suresh Kumar', identifier: '9876543210@okaxis', bank: 'Axis Bank', initials: 'SK' },
  { id: '3', name: 'Priya Sharma', identifier: 'priya.sharma@ybl', bank: 'Yes Bank', initials: 'PS' },
  { id: '4', name: 'Anil Verma', identifier: '50100123456789', bank: 'HDFC Bank', initials: 'AV' },
  { id: '5', name: 'Deepika Nair', identifier: 'deepika@paytm', bank: 'Paytm Payments Bank', initials: 'DN' },
];

export default function BeneficiaryScreen() {
  const collector = useBehavioralCollector();
  const { method } = useLocalSearchParams<{ method: string }>();
  const [searchText, setSearchText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIdentifier, setNewIdentifier] = useState('');
  const lastY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      collector?.recordTouchStart(0, 0, 0, 'PAGE_ENTER_SELECT_BENEFICIARY');
      collector?.recordTouchEnd(0, 0, 0, 'PAGE_ENTER_SELECT_BENEFICIARY');
      return () => {};
    }, [collector])
  );

  const filtered = SAVED_BENEFICIARIES.filter(
    (b) =>
      b.name.toLowerCase().includes(searchText.toLowerCase()) ||
      b.identifier.toLowerCase().includes(searchText.toLowerCase())
  );

  const identifierLabel = method === 'UPI' ? 'UPI ID / Mobile' : 'Account Number / IFSC';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_BENEFICIARY_BACK');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_BENEFICIARY_BACK');
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Select Beneficiary</Text>
          <Text style={styles.headerSubtitle}>{method} Transfer</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color="#9E9E9E" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or ID"
          placeholderTextColor="#BDBDBD"
          value={searchText}
          onChangeText={(t) => {
            collector?.recordKeystroke('KEYSTROKE_BENEFICIARY_SEARCH');
            setSearchText(t);
          }}
        />
      </View>

      <ScrollView
        style={styles.content}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const dy = y - lastY.current;
          lastY.current = y;
          collector?.recordScroll(dy, 'SCROLL_BENEFICIARY_LIST');
        }}
      >
        {/* Add new beneficiary */}
        <TouchableOpacity
          style={styles.addNewCard}
          onPress={() => setShowAddForm(!showAddForm)}
          onPressIn={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_ADD_NEW_BENEFICIARY');
          }}
          onPressOut={(e) => {
            const { pageX, pageY, force } = e.nativeEvent;
            collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_ADD_NEW_BENEFICIARY');
          }}
        >
          <View style={styles.addNewIcon}>
            <MaterialIcons name="person-add" size={22} color="#FF5722" />
          </View>
          <Text style={styles.addNewText}>Add New Beneficiary</Text>
          <MaterialIcons
            name={showAddForm ? 'expand-less' : 'expand-more'}
            size={22}
            color="#FF5722"
          />
        </TouchableOpacity>

        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.addFormLabel}>Name</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Beneficiary full name"
              value={newName}
              onChangeText={(t) => {
                collector?.recordKeystroke('KEYSTROKE_BENEFICIARY_NAME');
                setNewName(t);
              }}
            />
            <Text style={styles.addFormLabel}>{identifierLabel}</Text>
            <TextInput
              style={styles.formInput}
              placeholder={method === 'UPI' ? 'e.g. name@upi' : 'Account number'}
              value={newIdentifier}
              onChangeText={(t) => {
                collector?.recordKeystroke('KEYSTROKE_BENEFICIARY_ACCOUNT');
                setNewIdentifier(t);
              }}
            />
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => {
                if (newName && newIdentifier) {
                  router.push({
                    pathname: '/fund-transfer/amount',
                    params: {
                      method,
                      beneficiaryName: newName,
                      beneficiaryId: newIdentifier,
                      beneficiaryBank: 'New Beneficiary',
                    },
                  } as any);
                }
              }}
              onPressIn={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchStart(pageX, pageY, force ?? 0, 'TOUCH_VERIFY_BENEFICIARY');
              }}
              onPressOut={(e) => {
                const { pageX, pageY, force } = e.nativeEvent;
                collector?.recordTouchEnd(pageX, pageY, force ?? 0, 'TOUCH_VERIFY_BENEFICIARY');
              }}
            >
              <Text style={styles.verifyButtonText}>Verify & Proceed</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Saved Beneficiaries */}
        <Text style={styles.sectionLabel}>Saved Beneficiaries</Text>
        {filtered.map((ben) => (
          <TouchableOpacity
            key={ben.id}
            style={styles.beneficiaryCard}
            onPress={() =>
              router.push({
                pathname: '/fund-transfer/amount',
                params: {
                  method,
                  beneficiaryName: ben.name,
                  beneficiaryId: ben.identifier,
                  beneficiaryBank: ben.bank,
                },
              } as any)
            }
            onPressIn={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchStart(pageX, pageY, force ?? 0, `TOUCH_BENEFICIARY_SELECT_${ben.id}`);
            }}
            onPressOut={(e) => {
              const { pageX, pageY, force } = e.nativeEvent;
              collector?.recordTouchEnd(pageX, pageY, force ?? 0, `TOUCH_BENEFICIARY_SELECT_${ben.id}`);
            }}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{ben.initials}</Text>
            </View>
            <View style={styles.beneficiaryInfo}>
              <Text style={styles.beneficiaryName}>{ben.name}</Text>
              <Text style={styles.beneficiaryId}>{ben.identifier}</Text>
              <Text style={styles.beneficiaryBank}>{ben.bank}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#BDBDBD" />
          </TouchableOpacity>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#FF5722',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: { padding: 4 },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerSpacer: { width: 36 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#212121' },

  content: { flex: 1, paddingHorizontal: 16, marginTop: 12 },

  addNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FFCCBC',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  addNewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addNewText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#FF5722' },

  addForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  addFormLabel: { fontSize: 12, color: '#9E9E9E', fontWeight: '600', marginBottom: 6, marginTop: 12 },
  formInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
    fontSize: 15,
    color: '#212121',
  },
  verifyButton: {
    backgroundColor: '#FF5722',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
  },
  verifyButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  sectionLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 8,
  },

  beneficiaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#5C6BC0' },
  beneficiaryInfo: { flex: 1 },
  beneficiaryName: { fontSize: 15, fontWeight: '600', color: '#212121' },
  beneficiaryId: { fontSize: 12, color: '#5C6BC0', marginTop: 2 },
  beneficiaryBank: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
});
