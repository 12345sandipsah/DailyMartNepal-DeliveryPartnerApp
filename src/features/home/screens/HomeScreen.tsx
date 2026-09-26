import React, {useMemo, useState} from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';

import type {MainStackParamList} from '../../../app/navigation/MainNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Home'
>;

function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [isOnline, setIsOnline] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good morning';
    }

    if (hour < 17) {
      return 'Good afternoon';
    }

    return 'Good evening';
  }, []);

  const handleToggleAvailability = () => {
    setIsOnline(previous => !previous);
  };

  const handleCurrentDelivery = () => {
    // Delivery details navigation will be connected later.
  };

  const handleViewDeliveries = () => {
    navigation.navigate('Deliveries');
  };

  const handleViewEarnings = () => {
    // Earnings navigation will be connected later.
  };

  const handleViewHistory = () => {
    navigation.navigate('DeliveryHistory');
  };

  const handleViewNotifications = () => {
    navigation.navigate('Notifications');
  };

  const handleViewSupport = () => {
    navigation.navigate('Support');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.partnerName}>Delivery Partner</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.profileButton}
              onPress={handleViewProfile}
              accessibilityRole="button"
              accessibilityLabel="Open profile">
              <Text style={styles.profileButtonText}>S</Text>
            </Pressable>

            <Pressable
              style={styles.notificationButton}
              onPress={handleViewNotifications}
              accessibilityRole="button"
              accessibilityLabel="Open notifications">
              <View style={styles.bellContainer}>
                <View style={styles.bellBody} />
                <View style={styles.bellBottom} />
                <View style={styles.bellClapper} />
              </View>

              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.availabilityCard,
            isOnline
              ? styles.availabilityCardOnline
              : styles.availabilityCardOffline,
          ]}>
          <View style={styles.availabilityInfo}>
            <View
              style={[
                styles.statusDot,
                isOnline
                  ? styles.statusDotOnline
                  : styles.statusDotOffline,
              ]}
            />

            <View>
              <Text style={styles.availabilityLabel}>
                Current Status
              </Text>

              <Text
                style={[
                  styles.availabilityStatus,
                  isOnline
                    ? styles.availabilityStatusOnline
                    : styles.availabilityStatusOffline,
                ]}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.availabilityButton,
              isOnline
                ? styles.availabilityButtonOnline
                : styles.availabilityButtonOffline,
            ]}
            onPress={handleToggleAvailability}>
            <Text
              style={[
                styles.availabilityButtonText,
                isOnline
                  ? styles.availabilityButtonTextOnline
                  : styles.availabilityButtonTextOffline,
              ]}>
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Overview</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardMargin]}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>

          <View style={[styles.statCard, styles.statCardMargin]}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Current Delivery</Text>

          <Pressable onPress={handleViewDeliveries}>
            <Text style={styles.sectionAction}>View all</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.deliveryCard}
          onPress={handleCurrentDelivery}>
          <View style={styles.deliveryTopRow}>
            <View>
              <Text style={styles.deliveryLabel}>Order</Text>
              <Text style={styles.orderId}>#DM12345</Text>
            </View>

            <View style={styles.deliveryStatusBadge}>
              <Text style={styles.deliveryStatusText}>
                OUT FOR DELIVERY
              </Text>
            </View>
          </View>

          <View style={styles.deliveryDivider} />

          <View style={styles.deliveryDetails}>
            <View style={styles.deliveryDetailItem}>
              <Text style={styles.detailLabel}>Customer</Text>
              <Text style={styles.detailValue}>Customer</Text>
            </View>

            <View style={styles.deliveryDetailItem}>
              <Text style={styles.detailLabel}>Distance</Text>
              <Text style={styles.detailValue}>2.4 km</Text>
            </View>

            <View style={styles.deliveryDetailItem}>
              <Text style={styles.detailLabel}>ETA</Text>
              <Text style={styles.detailValue}>12 min</Text>
            </View>
          </View>

          <View style={styles.deliveryAction}>
            <Text style={styles.deliveryActionText}>
              Open Delivery
            </Text>

            <Text style={styles.deliveryActionArrow}>›</Text>
          </View>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Earnings</Text>

          <Pressable onPress={handleViewEarnings}>
            <Text style={styles.sectionAction}>Details</Text>
          </Pressable>
        </View>

        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Total earned today</Text>

          <Text style={styles.earningsAmount}>NPR 1,250</Text>

          <View style={styles.earningsBreakdown}>
            <View>
              <Text style={styles.breakdownLabel}>Base</Text>
              <Text style={styles.breakdownValue}>NPR 900</Text>
            </View>

            <View>
              <Text style={styles.breakdownLabel}>Distance</Text>
              <Text style={styles.breakdownValue}>NPR 250</Text>
            </View>

            <View>
              <Text style={styles.breakdownLabel}>Bonus</Text>
              <Text style={styles.breakdownValue}>NPR 100</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.quickActionsRow}>
          <Pressable
            style={[styles.quickAction, styles.quickActionMargin]}
            onPress={handleViewDeliveries}>
            <Text style={styles.quickActionNumber}>8</Text>

            <Text style={styles.quickActionLabel}>
              My Deliveries
            </Text>
          </Pressable>

          <Pressable
            style={styles.quickAction}
            onPress={handleViewEarnings}>
            <Text style={styles.quickActionNumber}>NPR</Text>

            <Text style={styles.quickActionLabel}>
              Earnings
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.historyQuickAction}
          onPress={handleViewHistory}
          accessibilityRole="button"
          accessibilityLabel="View delivery history">
          <View style={styles.historyQuickActionText}>
            <Text style={styles.quickActionLabel}>
              Delivery History
            </Text>

            <Text style={styles.historyQuickActionDescription}>
              Review your past deliveries
            </Text>
          </View>

          <Text style={styles.historyQuickActionArrow}>›</Text>
        </Pressable>

        <Pressable
          style={styles.supportQuickAction}
          onPress={handleViewSupport}
          accessibilityRole="button"
          accessibilityLabel="Open support and emergency">
          <View style={styles.supportQuickActionIcon}>
            <Text style={styles.supportQuickActionIconText}>
              ?
            </Text>
          </View>

          <View style={styles.supportQuickActionText}>
            <Text style={styles.supportQuickActionTitle}>
              Support & Emergency
            </Text>

            <Text style={styles.supportQuickActionDescription}>
              Get help or report an urgent problem
            </Text>
          </View>

          <Text style={styles.supportQuickActionArrow}>›</Text>
        </Pressable>

        <View style={styles.infoBanner}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>i</Text>
          </View>

          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>
              Delivery availability
            </Text>

            <Text style={styles.infoText}>
              Go online when you&apos;re ready to receive new delivery
              assignments.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF7',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  headerTextContainer: {
    flex: 1,
  },

  greeting: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },

  partnerName: {
    fontSize: 25,
    fontWeight: '700',
    color: '#111827',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginRight: 10,
  },

  profileButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2E7D32',
  },

  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4E9E4',
    position: 'relative',
  },

  bellContainer: {
    width: 22,
    height: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  bellBody: {
    width: 17,
    height: 18,
    borderWidth: 2,
    borderColor: '#2E7D32',
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderBottomWidth: 2,
  },

  bellBottom: {
    width: 21,
    height: 2,
    backgroundColor: '#2E7D32',
    borderRadius: 2,
    marginTop: -1,
  },

  bellClapper: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
    marginTop: 2,
  },

  notificationBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  notificationBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  availabilityCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },

  availabilityCardOffline: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E3E7E3',
  },

  availabilityCardOnline: {
    backgroundColor: '#EEF8EF',
    borderColor: '#C8E6C9',
  },

  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },

  statusDotOffline: {
    backgroundColor: '#9CA3AF',
  },

  statusDotOnline: {
    backgroundColor: '#2E7D32',
  },

  availabilityLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 3,
  },

  availabilityStatus: {
    fontSize: 16,
    fontWeight: '700',
  },

  availabilityStatusOffline: {
    color: '#4B5563',
  },

  availabilityStatusOnline: {
    color: '#2E7D32',
  },

  availabilityButton: {
    minWidth: 108,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  availabilityButtonOffline: {
    backgroundColor: '#2E7D32',
  },

  availabilityButtonOnline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },

  availabilityButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },

  availabilityButtonTextOffline: {
    color: '#FFFFFF',
  },

  availabilityButtonTextOnline: {
    color: '#2E7D32',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },

  statsRow: {
    flexDirection: 'row',
    marginBottom: 28,
  },

  statCard: {
    flex: 1,
    minHeight: 94,
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    justifyContent: 'center',
  },

  statCardMargin: {
    marginRight: 10,
  },

  statValue: {
    fontSize: 25,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },

  deliveryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  deliveryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 3,
  },

  orderId: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
  },

  deliveryStatusBadge: {
    backgroundColor: '#EEF8EF',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  deliveryStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2E7D32',
  },

  deliveryDivider: {
    height: 1,
    backgroundColor: '#EEF0EE',
    marginVertical: 16,
  },

  deliveryDetails: {
    flexDirection: 'row',
    marginBottom: 18,
  },

  deliveryDetailItem: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 11,
    color: '#8A918A',
    marginBottom: 5,
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  deliveryAction: {
    height: 46,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  deliveryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  deliveryActionArrow: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 22,
  },

  earningsCard: {
    backgroundColor: '#2E7D32',
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
  },

  earningsLabel: {
    fontSize: 13,
    color: '#DDEDDD',
  },

  earningsAmount: {
    marginTop: 5,
    fontSize: 31,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  earningsBreakdown: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#5A9860',
  },

  breakdownLabel: {
    fontSize: 11,
    color: '#DDEDDD',
    marginBottom: 4,
  },

  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  quickActionsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  quickAction: {
    flex: 1,
    minHeight: 95,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    borderRadius: 15,
    padding: 16,
    justifyContent: 'center',
  },

  quickActionMargin: {
    marginRight: 12,
  },

  quickActionNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 5,
  },

  quickActionLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },

  historyQuickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 72,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    borderRadius: 15,
    padding: 16,
  },

  historyQuickActionText: {
    flex: 1,
  },

  historyQuickActionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  historyQuickActionArrow: {
    fontSize: 26,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 12,
  },

  supportQuickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 78,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    borderRadius: 15,
    padding: 16,
  },

  supportQuickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  supportQuickActionIconText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#2E7D32',
  },

  supportQuickActionText: {
    flex: 1,
  },

  supportQuickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

  supportQuickActionDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    marginTop: 4,
  },

  supportQuickActionArrow: {
    fontSize: 26,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 12,
  },

  infoBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 15,
    backgroundColor: '#F0F7F0',
    borderWidth: 1,
    borderColor: '#D8EAD8',
  },

  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoIconText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  infoTextContainer: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },

  infoText: {
    fontSize: 12,
    color: '#667066',
    lineHeight: 18,
  },
});

export default HomeScreen;