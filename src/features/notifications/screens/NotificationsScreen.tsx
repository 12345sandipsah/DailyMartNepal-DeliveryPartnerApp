import React, {useMemo, useState} from 'react';

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import type {MainStackParamList} from '../../../app/navigation/MainNavigator';

type NotificationType =
  | 'DELIVERY'
  | 'PICKUP'
  | 'PAYMENT'
  | 'SYSTEM';

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  deliveryId?: string;
};

type FilterType = 'ALL' | 'UNREAD';

type NotificationsNavigationProp =
  NativeStackNavigationProp<MainStackParamList>;

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'DELIVERY',
    title: 'New Delivery Assigned',
    message:
      'Order #DM12351 has been assigned to you. Please review the delivery details.',
    time: '2 min ago',
    read: false,
    deliveryId: 'DM12351',
  },
  {
    id: '2',
    type: 'PICKUP',
    title: 'Pickup Reminder',
    message:
      'Please collect Order #DM12350 from the warehouse before starting the delivery.',
    time: '15 min ago',
    read: false,
    deliveryId: 'DM12350',
  },
  {
    id: '3',
    type: 'PAYMENT',
    title: 'COD Collection',
    message:
      'Collect NPR 850 from the customer for Order #DM12345.',
    time: '32 min ago',
    read: false,
    deliveryId: 'DM12345',
  },
  {
    id: '4',
    type: 'DELIVERY',
    title: 'Delivery Update',
    message:
      'Order #DM12346 has been accepted successfully. Proceed to the warehouse for pickup.',
    time: '1 hour ago',
    read: true,
    deliveryId: 'DM12346',
  },
  {
    id: '5',
    type: 'SYSTEM',
    title: 'Availability Reminder',
    message:
      'You are currently offline. Go online when you are ready to receive delivery assignments.',
    time: '2 hours ago',
    read: true,
  },
  {
    id: '6',
    type: 'DELIVERY',
    title: 'Delivery Completed',
    message:
      'Order #DM12349 was successfully delivered. Your delivery record has been updated.',
    time: 'Yesterday',
    read: true,
    deliveryId: 'DM12349',
  },
  {
    id: '7',
    type: 'SYSTEM',
    title: 'Welcome to DailyMart Nepal',
    message:
      'Keep your availability updated and check your notifications regularly for delivery updates.',
    time: 'Yesterday',
    read: true,
  },
];

const getNotificationLabel = (
  type: NotificationType,
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
      return 'UPDATE';
  }
};

const getNotificationIcon = (
  type: NotificationType,
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

const getNotificationIconBackground = (
  type: NotificationType,
): string => {
  switch (type) {
    case 'DELIVERY':
      return '#E8F5E9';

    case 'PICKUP':
      return '#E3F2FD';

    case 'PAYMENT':
      return '#FFF8E1';

    case 'SYSTEM':
      return '#F3E5F5';

    default:
      return '#F3F4F6';
  }
};

const NotificationsScreen = () => {
  const navigation =
    useNavigation<NotificationsNavigationProp>();

  const [notifications, setNotifications] =
    useState<NotificationItem[]>(
      INITIAL_NOTIFICATIONS,
    );

  const [activeFilter, setActiveFilter] =
    useState<FilterType>('ALL');

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        notification => !notification.read,
      ).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'UNREAD') {
      return notifications.filter(
        notification => !notification.read,
      );
    }

    return notifications;
  }, [activeFilter, notifications]);

  const handleNotificationPress = (
    notification: NotificationItem,
  ) => {
    setNotifications(currentNotifications =>
      currentNotifications.map(currentNotification =>
        currentNotification.id === notification.id
          ? {
              ...currentNotification,
              read: true,
            }
          : currentNotification,
      ),
    );

    navigation.navigate('NotificationDetails', {
      title: notification.title,
      message: notification.message,
      time: notification.time,
      type: notification.type,
      deliveryId: notification.deliveryId,
      read: true,
    });
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) {
      return;
    }

    setNotifications(currentNotifications =>
      currentNotifications.map(notification => ({
        ...notification,
        read: true,
      })),
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Notifications
            </Text>

            <Text style={styles.headerSubtitle}>
              Stay updated with your deliveries
            </Text>
          </View>

          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.filterRow}>
          <Pressable
            style={[
              styles.filterButton,
              activeFilter === 'ALL' &&
                styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter('ALL')}
            accessibilityRole="button"
            accessibilityLabel="Show all notifications">
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === 'ALL' &&
                  styles.filterButtonTextActive,
              ]}>
              All
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterButton,
              activeFilter === 'UNREAD' &&
                styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter('UNREAD')}
            accessibilityRole="button"
            accessibilityLabel="Show unread notifications">
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === 'UNREAD' &&
                  styles.filterButtonTextActive,
              ]}>
              Unread
            </Text>

            {unreadCount > 0 && (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountBadgeText}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </Pressable>

          {unreadCount > 0 && (
            <Pressable
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read">
              <Text style={styles.markAllButtonText}>
                Mark all as read
              </Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>✓</Text>
              </View>

              <Text style={styles.emptyTitle}>
                {activeFilter === 'UNREAD'
                  ? 'No unread notifications'
                  : 'No notifications yet'}
              </Text>

              <Text style={styles.emptyDescription}>
                {activeFilter === 'UNREAD'
                  ? 'You are all caught up. New notifications will appear here.'
                  : 'Delivery updates, payment alerts, and important messages will appear here.'}
              </Text>
            </View>
          ) : (
            filteredNotifications.map(notification => (
              <Pressable
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read &&
                    styles.notificationCardUnread,
                ]}
                onPress={() =>
                  handleNotificationPress(notification)
                }
                accessibilityRole="button"
                accessibilityLabel={`${notification.title} notification`}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor:
                        getNotificationIconBackground(
                          notification.type,
                        ),
                    },
                  ]}>
                  <Text style={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </Text>
                </View>

                <View style={styles.notificationContent}>
                  <View style={styles.notificationTopRow}>
                    <View style={styles.titleContainer}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          !notification.read &&
                            styles.notificationTitleUnread,
                        ]}>
                        {notification.title}
                      </Text>

                      <Text style={styles.notificationType}>
                        {getNotificationLabel(
                          notification.type,
                        )}
                      </Text>
                    </View>

                    {!notification.read && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>

                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>

                  <View style={styles.notificationBottomRow}>
                    <Text style={styles.notificationTime}>
                      {notification.time}
                    </Text>

                    {notification.deliveryId && (
                      <Text style={styles.deliveryReference}>
                        #{notification.deliveryId}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            ))
          )}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAE5',
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },

  headerSubtitle: {
    marginTop: 5,
    fontSize: 13,
    color: '#6B7280',
  },

  unreadBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  unreadBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },

  filterButton: {
    minHeight: 40,
    paddingHorizontal: 17,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDE3DD',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },

  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6B61',
  },

  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  filterCountBadge: {
    minWidth: 20,
    height: 20,
    marginLeft: 7,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },

  markAllButton: {
    marginLeft: 'auto',
    paddingVertical: 8,
    paddingLeft: 10,
  },

  markAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
  },

  notificationCardUnread: {
    borderColor: '#C8E6C9',
    backgroundColor: '#FBFFFB',
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  notificationIcon: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2E7D32',
  },

  notificationContent: {
    flex: 1,
  },

  notificationTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  titleContainer: {
    flex: 1,
    paddingRight: 8,
  },

  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 20,
  },

  notificationTitleUnread: {
    fontWeight: '700',
    color: '#1F2937',
  },

  notificationType: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#2E7D32',
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
    marginTop: 5,
  },

  notificationMessage: {
    marginTop: 9,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },

  notificationBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  notificationTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  deliveryReference: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 100,
  },

  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    marginBottom: 18,
  },

  emptyIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2E7D32',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },

  emptyDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },

  bottomSpacing: {
    height: 30,
  },
});

export default NotificationsScreen;