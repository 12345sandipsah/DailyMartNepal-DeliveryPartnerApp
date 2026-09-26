import React from 'react';

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import type {
  RouteProp,
} from '@react-navigation/native';

import type {
  MainStackParamList,
} from '../../../app/navigation/MainNavigator';

type NotificationDetailsParams = {
  NotificationDetails: {
    title: string;
    message: string;
    time: string;
    type: 'DELIVERY' | 'PICKUP' | 'PAYMENT' | 'SYSTEM';
    deliveryId?: string;
    read: boolean;
  };
};

type NotificationDetailsRouteProp = RouteProp<
  NotificationDetailsParams,
  'NotificationDetails'
>;

type NotificationDetailsNavigationProp =
  NativeStackNavigationProp<MainStackParamList>;

const getTypeLabel = (
  type: NotificationDetailsParams['NotificationDetails']['type'],
): string => {
  switch (type) {
    case 'DELIVERY':
      return 'DELIVERY';

    case 'PICKUP':
      return 'PICKUP';

    case 'PAYMENT':
      return 'PAYMENT';

    case 'SYSTEM':
      return 'SYSTEM';

    default:
      return 'NOTIFICATION';
  }
};

const getTypeIcon = (
  type: NotificationDetailsParams['NotificationDetails']['type'],
): string => {
  switch (type) {
    case 'DELIVERY':
      return 'D';

    case 'PICKUP':
      return 'P';

    case 'PAYMENT':
      return '₹';

    case 'SYSTEM':
      return 'S';

    default:
      return 'N';
  }
};

const getTypeColor = (
  type: NotificationDetailsParams['NotificationDetails']['type'],
): string => {
  switch (type) {
    case 'DELIVERY':
      return '#2E7D32';

    case 'PICKUP':
      return '#1976D2';

    case 'PAYMENT':
      return '#F59E0B';

    case 'SYSTEM':
      return '#7B1FA2';

    default:
      return '#2E7D32';
  }
};

const NotificationDetailsScreen = () => {
  const navigation =
    useNavigation<NotificationDetailsNavigationProp>();

  const route =
    useRoute<NotificationDetailsRouteProp>();

  const {
    title,
    message,
    time,
    type,
    deliveryId,
    read,
  } = route.params;

  const typeColor = getTypeColor(type);

  const handleRelatedAction = () => {
    if (!deliveryId) {
      return;
    }

    switch (type) {
      case 'DELIVERY':
        navigation.navigate('DeliveryDetails', {
          deliveryId,
        });
        break;

      case 'PICKUP':
        navigation.navigate('WarehousePickup', {
          deliveryId,
        });
        break;

      case 'PAYMENT':
        navigation.navigate('CODCollection', {
          deliveryId,
        });
        break;

      case 'SYSTEM':
        break;

      default:
        break;
    }
  };

  const showRelatedAction =
    deliveryId !== undefined &&
    (type === 'DELIVERY' ||
      type === 'PICKUP' ||
      type === 'PAYMENT');

  const getActionLabel = (): string => {
    switch (type) {
      case 'DELIVERY':
        return 'Open Delivery';

      case 'PICKUP':
        return 'Open Pickup';

      case 'PAYMENT':
        return 'Open COD Collection';

      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            Notification Details
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.iconSection}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor:
                    type === 'DELIVERY'
                      ? '#E8F5E9'
                      : type === 'PICKUP'
                      ? '#E3F2FD'
                      : type === 'PAYMENT'
                      ? '#FFF8E1'
                      : '#F3E5F5',
                },
              ]}>
              <Text
                style={[
                  styles.notificationIcon,
                  {
                    color: typeColor,
                  },
                ]}>
                {getTypeIcon(type)}
              </Text>
            </View>

            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor:
                    type === 'DELIVERY'
                      ? '#E8F5E9'
                      : type === 'PICKUP'
                      ? '#E3F2FD'
                      : type === 'PAYMENT'
                      ? '#FFF8E1'
                      : '#F3E5F5',
                },
              ]}>
              <Text
                style={[
                  styles.typeBadgeText,
                  {
                    color: typeColor,
                  },
                ]}>
                {getTypeLabel(type)}
              </Text>
            </View>
          </View>

          <View style={styles.mainCard}>
            <Text style={styles.title}>{title}</Text>

            <Text style={styles.time}>{time}</Text>

            <View style={styles.divider} />

            <Text style={styles.message}>{message}</Text>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>
                Notification Status
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  read
                    ? styles.statusBadgeRead
                    : styles.statusBadgeUnread,
                ]}>
                <Text
                  style={[
                    styles.statusText,
                    read
                      ? styles.statusTextRead
                      : styles.statusTextUnread,
                  ]}>
                  {read ? 'READ' : 'UNREAD'}
                </Text>
              </View>
            </View>
          </View>

          {deliveryId && (
            <View style={styles.orderCard}>
              <Text style={styles.sectionTitle}>
                Related Delivery
              </Text>

              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>
                  Order ID
                </Text>

                <Text style={styles.orderValue}>
                  #{deliveryId}
                </Text>
              </View>
            </View>
          )}

          {showRelatedAction && (
            <Pressable
              style={styles.actionButton}
              onPress={handleRelatedAction}
              accessibilityRole="button"
              accessibilityLabel={getActionLabel()}>
              <Text style={styles.actionButtonText}>
                {getActionLabel()}
              </Text>

              <Text style={styles.actionButtonArrow}>
                ›
              </Text>
            </Pressable>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              Notification Information
            </Text>

            <Text style={styles.infoText}>
              This notification is part of your DailyMart Nepal
              delivery operations. Important delivery, pickup,
              payment, and system updates will appear here.
            </Text>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },

  container: {
    flex: 1,
  },

  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAE5',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    fontSize: 32,
    lineHeight: 32,
    color: '#1F2937',
    fontWeight: '400',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  headerSpacer: {
    width: 42,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 30,
  },

  iconSection: {
    alignItems: 'center',
    marginBottom: 18,
  },

  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationIcon: {
    fontSize: 28,
    fontWeight: '800',
  },

  typeBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },

  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EAE5',
    padding: 20,
  },

  title: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '700',
    color: '#1F2937',
  },

  time: {
    marginTop: 7,
    fontSize: 12,
    color: '#9CA3AF',
  },

  divider: {
    height: 1,
    backgroundColor: '#EEF0EE',
    marginVertical: 18,
  },

  message: {
    fontSize: 15,
    lineHeight: 23,
    color: '#4B5563',
  },

  statusRow: {
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF0EE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  statusBadgeRead: {
    backgroundColor: '#E8F5E9',
  },

  statusBadgeUnread: {
    backgroundColor: '#FFF3E0',
  },

  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  statusTextRead: {
    color: '#2E7D32',
  },

  statusTextUnread: {
    color: '#EF6C00',
  },

  orderCard: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EAE5',
    padding: 18,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 14,
  },

  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  orderLabel: {
    fontSize: 13,
    color: '#6B7280',
  },

  orderValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },

  actionButton: {
    marginTop: 14,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  actionButtonArrow: {
    marginLeft: 8,
    fontSize: 22,
    lineHeight: 22,
    color: '#FFFFFF',
  },

  infoCard: {
    marginTop: 14,
    backgroundColor: '#F0F7F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8EAD8',
    padding: 16,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },

  infoText: {
    fontSize: 12,
    lineHeight: 19,
    color: '#667066',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default NotificationDetailsScreen;