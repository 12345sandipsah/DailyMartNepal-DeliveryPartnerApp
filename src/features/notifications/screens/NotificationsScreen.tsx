import React, {useCallback, useMemo, useState} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faBox,
  faBullhorn,
  faBell,
  faCheck,
  faChevronRight,
  faCircleInfo,
  faCreditCard,
  faGift,
  faHouse,
  faMapLocationDot,
  faMoneyBillWave,
  faTruck,
  faWarehouse,
  faHeadset,
  faUser,
} from '@fortawesome/free-solid-svg-icons';

import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {useFocusEffect, useNavigation} from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import {getPartnerNotifications, markPartnerNotificationRead} from '../../../shared/services/api';

type NotificationType = 'DELIVERY' | 'PICKUP' | 'PAYMENT' | 'SYSTEM';

type NotificationCategory = 'SUPPORT';

type NotificationGroup = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK';

type NotificationItem = {
  id: string;

  type: NotificationType;

  category?: NotificationCategory;

  title: string;

  message: string;

  time: string;

  read: boolean;

  deliveryId?: string;

  group: NotificationGroup;
};

type FilterType = 'ALL' | 'ORDERS' | 'PAYMENTS' | 'ANNOUNCEMENTS' | 'SUPPORT';

type NotificationsNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Notifications'
>;

type BottomNavItemProps = {
  label: 'Home' | 'Deliveries' | 'Earnings' | 'Notifications' | 'Profile';

  active: boolean;

  notification?: boolean;

  onPress: () => void;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

const mapPartnerNotification = (record: {
  _id: string;
  type?: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  data?: {orderNumber?: string; orderId?: string};
}): NotificationItem => {
  const createdAt = new Date(record.createdAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const day = new Date(createdAt);
  day.setHours(0, 0, 0, 0);
  const group: NotificationGroup =
    day.getTime() === today.getTime()
      ? 'TODAY'
      : day.getTime() === yesterday.getTime()
        ? 'YESTERDAY'
        : 'THIS_WEEK';
  const rawType = String(record.type || '').toLowerCase();
  const title = String(record.title || 'DailyMart update');
  const type: NotificationType =
    rawType.includes('payment')
      ? 'PAYMENT'
      : title.toLowerCase().includes('pickup')
        ? 'PICKUP'
        : rawType.includes('delivery') || rawType.includes('order')
          ? 'DELIVERY'
          : 'SYSTEM';
  return {
    id: record._id,
    type,
    title,
    message: String(record.message || ''),
    time: createdAt.toLocaleString(),
    read: Boolean(record.isRead),
    deliveryId: record.data?.orderNumber || record.data?.orderId,
    group,
  };
};
const matchesFilter = (
  notification: NotificationItem,

  filter: FilterType,
) => {
  switch (filter) {
    case 'ORDERS':
      return notification.type === 'DELIVERY' || notification.type === 'PICKUP';

    case 'PAYMENTS':
      return notification.type === 'PAYMENT';

    case 'ANNOUNCEMENTS':
      return (
        notification.type === 'SYSTEM' &&
        notification.category !== 'SUPPORT' &&
        (notification.title

          .toLowerCase()

          .includes('announcement') ||
          notification.title

            .toLowerCase()

            .includes('zone') ||
          notification.title

            .toLowerCase()

            .includes('bonus'))
      );

    case 'SUPPORT':
      return notification.category === 'SUPPORT';

    case 'ALL':

    default:
      return true;
  }
};

const getUnreadCount = (notifications: NotificationItem[]) => {
  return notifications.filter(notification => !notification.read).length;
};

const HeaderBell = () => (
  <View style={styles.headerBellButton}>
    <FontAwesomeIcon icon={faBell} size={22} color="#0B604C" />
    <View style={styles.headerNotificationDot} />
  </View>
);

const ProfileAvatar = ({ onPress }: { onPress: () => void }) => {
  return (
    <Pressable
      style={styles.profileButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open profile"
    >
      <Text style={styles.profileText}>SS</Text>

      <View style={styles.onlineDot} />
    </Pressable>
  );
};

const NotificationIcon = ({
  notification,
}: {
  notification: NotificationItem;
}) => {
  let icon = faCircleInfo;
  let color = '#1877D4';
  let circleStyle = styles.iconCircleBlue;
  const title = notification.title.toLowerCase();

  if (notification.category === 'SUPPORT') {
    icon = faHeadset;
    color = '#F04444';
    circleStyle = styles.iconCircleRed;
  } else if (notification.type === 'DELIVERY') {
    icon = title.includes('completed') ? faCheck : faBox;
    color = '#159447';
    circleStyle = styles.iconCircleGreen;
  } else if (notification.type === 'PICKUP') {
    icon = faWarehouse;
    color = '#F28B10';
    circleStyle = styles.iconCircleOrange;
  } else if (notification.type === 'PAYMENT') {
    icon = faMoneyBillWave;
    color = '#1877D4';
    circleStyle = styles.iconCircleBlue;
  } else if (title.includes('bonus')) {
    icon = faGift;
    color = '#7C3AED';
    circleStyle = styles.iconCirclePurple;
  } else if (title.includes('zone')) {
    icon = faMapLocationDot;
    color = '#F28B10';
    circleStyle = styles.iconCircleOrange;
  }

  return (
    <View style={[styles.iconCircle, circleStyle]}>
      <FontAwesomeIcon icon={icon} size={21} color={color} />
    </View>
  );
};

const NotificationCard = ({
  notification,

  onPress,
}: {
  notification: NotificationItem;

  onPress: () => void;
}) => {
  let cardStyle = styles.notificationCard;

  if (notification.type === 'DELIVERY' && !notification.read) {
    cardStyle = styles.notificationCardGreen;
  }

  if (notification.type === 'PICKUP' && !notification.read) {
    cardStyle = styles.notificationCardOrange;
  }

  if (notification.type === 'PAYMENT' && !notification.read) {
    cardStyle = styles.notificationCardBlue;
  }

  return (
    <Pressable
      style={cardStyle}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title} notification`}
    >
      <NotificationIcon notification={notification} />

      <View style={styles.cardContent}>
        <Text
          style={[
            styles.notificationTitle,

            !notification.read && styles.notificationTitleUnread,
          ]}
          numberOfLines={2}
        >
          {notification.title}
        </Text>

        <Text style={styles.notificationMessage} numberOfLines={3}>
          {notification.message}
        </Text>
      </View>

      <View style={styles.cardRight}>
        <Text style={styles.notificationTime} numberOfLines={2}>
          {notification.time}
        </Text>

        {!notification.read && <View style={styles.unreadDot} />}

        <FontAwesomeIcon icon={faChevronRight} size={13} color="#9BA2A6" />
      </View>
    </Pressable>
  );
};

const NotificationSection = ({
  title,

  notifications,

  onNotificationPress,
}: {
  title: string;

  notifications: NotificationItem[];

  onNotificationPress: (notification: NotificationItem) => void;
}) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onPress={() => onNotificationPress(notification)}
        />
      ))}
    </View>
  );
};

const FilterPill = ({
  label,
  icon,
  active,
  count,
  onPress,
}: {
  label: string;
  icon?: typeof faBox;
  active: boolean;
  count?: number;
  onPress: () => void;
}) => (
  <Pressable
    style={[styles.filterPill, active && styles.filterPillActive]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`Filter ${label}`}
  >
    {icon && (
      <FontAwesomeIcon
        icon={icon}
        size={12}
        color={active ? '#FFFFFF' : '#168648'}
        style={{ marginRight: 5 }}
      />
    )}
    <Text style={[styles.filterText, active && styles.filterTextActive]}>
      {label}
    </Text>
    {count !== undefined && (
      <View style={styles.filterBadge}>
        <Text style={styles.filterBadgeText}>{count}</Text>
      </View>
    )}
  </Pressable>
);

const BottomNavIcon = ({
  label,
  active,
}: {
  label: 'Home' | 'Deliveries' | 'Earnings' | 'Notifications' | 'Profile';
  active: boolean;
}) => {
  const icon =
    label === 'Home'
      ? faHouse
      : label === 'Deliveries'
      ? faTruck
      : label === 'Earnings'
      ? faCreditCard
      : label === 'Notifications'
      ? faBell
      : faUser;
  return (
    <View style={styles.navIconBox}>
      <FontAwesomeIcon
        icon={icon}
        size={21}
        color={active ? '#079447' : '#697277'}
      />
    </View>
  );
};

const BottomNavItem = ({
  label,

  active,

  notification,

  onPress,
}: BottomNavItemProps) => {
  return (
    <Pressable
      style={styles.bottomNavItem}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        selected: active,
      }}
    >
      <View style={styles.bottomIconWrapper}>
        <BottomNavIcon label={label} active={active} />

        {notification && <View style={styles.bottomNotificationDot} />}
      </View>

      <Text
        style={[styles.bottomNavLabel, active && styles.bottomNavLabelActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const NotificationsScreen = () => {
  const navigation = useNavigation<NotificationsNavigationProp>();

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getPartnerNotifications()
        .then(records => {
          if (active) setNotifications(records.map(mapPartnerNotification));
        })
        .catch(error => {
          if (active) Alert.alert('Notifications unavailable', error instanceof Error ? error.message : 'Please retry.');
        });
      return () => { active = false; };
    }, []),
  );

  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const unreadCount = useMemo(
    () => getUnreadCount(notifications),

    [notifications],
  );

  const filteredNotifications = useMemo(
    () =>
      notifications.filter(notification =>
        matchesFilter(
          notification,

          activeFilter,
        ),
      ),

    [notifications, activeFilter],
  );

  const todayNotifications = filteredNotifications.filter(
    notification => notification.group === 'TODAY',
  );

  const yesterdayNotifications = filteredNotifications.filter(
    notification => notification.group === 'YESTERDAY',
  );

  const thisWeekNotifications = filteredNotifications.filter(
    notification => notification.group === 'THIS_WEEK',
  );

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  const handleGoDeliveries = () => {
    navigation.navigate('Deliveries');
  };

  const handleGoEarnings = () => {
    navigation.navigate('Earnings');
  };

  const handleGoProfile = () => {
    navigation.navigate('Profile');
  };

  const handleNotificationPress = (notification: NotificationItem) => {
    if (!notification.read) {
      markPartnerNotificationRead(notification.id).catch(error =>
        Alert.alert('Could not update notification', error instanceof Error ? error.message : 'Please retry.'),
      );
    }
    setNotifications(current =>
      current.map(item => item.id === notification.id ? {...item, read: true} : item),
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
    if (unreadCount === 0) return;
    const unread = notifications.filter(notification => !notification.read);
    setNotifications(current => current.map(notification => ({...notification, read: true})));
    Promise.all(unread.map(notification => markPartnerNotificationRead(notification.id))).catch(error =>
      Alert.alert('Some notifications could not be updated', error instanceof Error ? error.message : 'Please retry.'),
    );
  };
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <View style={styles.brandRow}>
                <View style={styles.leafIcon}>
                  <Text style={styles.leafIconText}>◢</Text>
                </View>

                <View>
                  <Text style={styles.brandText}>
                    Daily
                    <Text style={styles.brandGreen}>Mart</Text>
                  </Text>

                  <Text style={styles.nepalText}>Nepal</Text>

                  <Text style={styles.partnerText}>Delivery Partner</Text>
                </View>
              </View>
            </View>

            <View style={styles.headerActions}>
              <HeaderBell />

              <ProfileAvatar onPress={handleGoProfile} />
            </View>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>Notifications</Text>

            <Pressable
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
            >
              <Text style={styles.markAllCheck}>✓</Text>

              <Text
                style={[
                  styles.markAllText,

                  unreadCount === 0 && styles.markAllTextDisabled,
                ]}
              >
                Mark All Read
              </Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <FilterPill
              label="All"
              active={activeFilter === 'ALL'}
              count={unreadCount > 0 ? unreadCount : undefined}
              onPress={() => setActiveFilter('ALL')}
            />

            <FilterPill
              label="Orders"
              icon={faBox}
              active={activeFilter === 'ORDERS'}
              onPress={() => setActiveFilter('ORDERS')}
            />

            <FilterPill
              label="Payments"
              icon={faCreditCard}
              active={activeFilter === 'PAYMENTS'}
              onPress={() => setActiveFilter('PAYMENTS')}
            />

            <FilterPill
              label="Announcements"
              icon={faBullhorn}
              active={activeFilter === 'ANNOUNCEMENTS'}
              onPress={() => setActiveFilter('ANNOUNCEMENTS')}
            />

            <FilterPill
              label="Support"
              icon={faHeadset}
              active={activeFilter === 'SUPPORT'}
              onPress={() => setActiveFilter('SUPPORT')}
            />
          </ScrollView>

          <View style={styles.notificationArea}>
            <NotificationSection
              title="Today"
              notifications={todayNotifications}
              onNotificationPress={handleNotificationPress}
            />

            <NotificationSection
              title="Yesterday"
              notifications={yesterdayNotifications}
              onNotificationPress={handleNotificationPress}
            />

            <NotificationSection
              title="This Week"
              notifications={thisWeekNotifications}
              onNotificationPress={handleNotificationPress}
            />

            {filteredNotifications.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Text style={styles.emptyIcon}>✓</Text>
                </View>

                <Text style={styles.emptyTitle}>No notifications</Text>

                <Text style={styles.emptyDescription}>
                  There are no notifications in this category right now.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bottomScrollSpace} />
        </ScrollView>

        <View style={styles.bottomNavigation}>
          <BottomNavItem label="Home" active={false} onPress={handleGoHome} />

          <BottomNavItem
            label="Deliveries"
            active={false}
            onPress={handleGoDeliveries}
          />

          <BottomNavItem
            label="Earnings"
            active={false}
            onPress={handleGoEarnings}
          />

          <BottomNavItem
            label="Notifications"
            active={true}
            notification
            onPress={() => {}}
          />

          <BottomNavItem
            label="Profile"
            active={false}
            onPress={handleGoProfile}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,

    backgroundColor: '#FFFFFF',
  },

  mainScroll: {
    flex: 1,
  },

  mainScrollContent: {
    paddingBottom: 12,
  },

  header: {
    minHeight: 82,

    paddingHorizontal: 16,

    paddingTop: 4,

    paddingBottom: 5,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  brandContainer: {
    flex: 1,
  },

  brandRow: {
    flexDirection: 'row',

    alignItems: 'flex-start',
  },

  leafIcon: {
    width: 36,

    height: 36,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 3,
  },

  leafIconText: {
    fontSize: 28,

    fontWeight: '800',

    color: '#18A84D',

    transform: [
      {
        rotate: '-17deg',
      },
    ],
  },

  brandText: {
    fontSize: 26,

    lineHeight: 28,

    fontWeight: '800',

    color: '#07553E',
  },

  brandGreen: {
    color: '#20B94E',
  },

  nepalText: {
    alignSelf: 'flex-end',

    marginTop: -2,

    marginRight: 3,

    fontSize: 14,

    lineHeight: 15,

    fontWeight: '700',

    color: '#07553E',
  },

  partnerText: {
    marginTop: 3,

    marginLeft: 4,

    fontSize: 13,

    lineHeight: 17,

    fontWeight: '600',

    color: '#39725D',
  },

  headerActions: {
    flexDirection: 'row',

    alignItems: 'center',

    marginLeft: 8,
  },

  headerBellButton: {
    width: 40,

    height: 40,

    alignItems: 'center',

    justifyContent: 'center',

    position: 'relative',

    marginRight: 9,
  },

  headerBellBody: {
    width: 19,

    height: 20,

    borderWidth: 2,

    borderColor: '#0B604C',

    borderTopLeftRadius: 10,

    borderTopRightRadius: 10,

    borderBottomLeftRadius: 4,

    borderBottomRightRadius: 4,
  },

  headerBellBottom: {
    width: 24,

    height: 2,

    borderRadius: 2,

    backgroundColor: '#0B604C',

    marginTop: -1,
  },

  headerBellClapper: {
    width: 6,

    height: 5,

    borderRadius: 3,

    backgroundColor: '#0B604C',

    marginTop: 2,
  },

  headerNotificationDot: {
    position: 'absolute',

    top: 0,

    right: 0,

    width: 12,

    height: 12,

    borderRadius: 6,

    backgroundColor: '#F04444',

    borderWidth: 2,

    borderColor: '#FFFFFF',
  },

  profileButton: {
    width: 46,

    height: 46,

    borderRadius: 23,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#DDEDE3',

    position: 'relative',
  },

  profileText: {
    fontSize: 14,

    fontWeight: '800',

    color: '#07553E',
  },

  onlineDot: {
    position: 'absolute',

    right: -1,

    bottom: 0,

    width: 12,

    height: 12,

    borderRadius: 6,

    backgroundColor: '#21B34B',

    borderWidth: 2,

    borderColor: '#FFFFFF',
  },

  titleRow: {
    minHeight: 55,

    paddingHorizontal: 16,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  pageTitle: {
    fontSize: 30,

    lineHeight: 35,

    fontWeight: '800',

    color: '#111827',
  },

  markAllButton: {
    height: 38,

    paddingHorizontal: 13,

    borderRadius: 19,

    backgroundColor: '#EAF8EE',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  markAllCheck: {
    fontSize: 17,

    lineHeight: 18,

    fontWeight: '800',

    color: '#0E8F45',

    marginRight: 6,
  },

  markAllText: {
    fontSize: 11,

    lineHeight: 14,

    fontWeight: '700',

    color: '#17221B',
  },

  markAllTextDisabled: {
    color: '#9AA19C',
  },

  filterRow: {
    paddingHorizontal: 16,

    paddingTop: 7,

    paddingBottom: 9,
  },

  filterPill: {
    height: 34,

    paddingHorizontal: 11,

    borderRadius: 17,

    backgroundColor: '#F2F4F5',

    marginRight: 7,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  filterPillActive: {
    backgroundColor: '#079741',
  },

  filterIcon: {
    marginRight: 5,

    fontSize: 13,

    lineHeight: 15,

    fontWeight: '800',

    color: '#168648',
  },

  filterIconActive: {
    color: '#FFFFFF',
  },

  filterText: {
    fontSize: 10,

    lineHeight: 13,

    fontWeight: '700',

    color: '#555E59',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  filterBadge: {
    minWidth: 18,

    height: 18,

    marginLeft: 6,

    paddingHorizontal: 4,

    borderRadius: 9,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#F04444',
  },

  filterBadgeText: {
    fontSize: 9,

    lineHeight: 11,

    fontWeight: '800',

    color: '#FFFFFF',
  },

  notificationArea: {
    paddingHorizontal: 16,

    paddingTop: 0,
  },

  section: {
    marginBottom: 5,
  },

  sectionTitle: {
    marginTop: 6,

    marginBottom: 8,

    fontSize: 21,

    lineHeight: 25,

    fontWeight: '800',

    color: '#111827',
  },

  notificationCard: {
    minHeight: 84,

    marginBottom: 9,

    paddingHorizontal: 12,

    paddingVertical: 9,

    borderRadius: 15,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E9ECEA',

    flexDirection: 'row',

    alignItems: 'center',
  },

  notificationCardGreen: {
    minHeight: 84,

    marginBottom: 9,

    paddingHorizontal: 12,

    paddingVertical: 9,

    borderRadius: 15,

    backgroundColor: '#F1FAF2',

    borderWidth: 1,

    borderColor: '#E5F0E6',

    flexDirection: 'row',

    alignItems: 'center',
  },

  notificationCardOrange: {
    minHeight: 84,

    marginBottom: 9,

    paddingHorizontal: 12,

    paddingVertical: 9,

    borderRadius: 15,

    backgroundColor: '#FFF8EC',

    borderWidth: 1,

    borderColor: '#FFF0D7',

    flexDirection: 'row',

    alignItems: 'center',
  },

  notificationCardBlue: {
    minHeight: 84,

    marginBottom: 9,

    paddingHorizontal: 12,

    paddingVertical: 9,

    borderRadius: 15,

    backgroundColor: '#F2F7FD',

    borderWidth: 1,

    borderColor: '#E5EFFA',

    flexDirection: 'row',

    alignItems: 'center',
  },

  iconCircle: {
    width: 45,

    height: 45,

    borderRadius: 23,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 10,
  },

  iconCircleGreen: {
    backgroundColor: '#DDF4E2',
  },

  iconCircleOrange: {
    backgroundColor: '#FFF0D6',
  },

  iconCircleBlue: {
    backgroundColor: '#DDEEFF',
  },

  iconCirclePurple: {
    backgroundColor: '#EEE5FF',
  },

  iconCircleRed: {
    backgroundColor: '#FFE3E3',
  },

  packageIcon: {
    width: 24,

    height: 24,

    position: 'relative',
  },

  packageTop: {
    position: 'absolute',

    top: 1,

    left: 4,

    width: 17,

    height: 8,

    borderWidth: 2,

    borderColor: '#159447',

    transform: [
      {
        rotate: '30deg',
      },
    ],
  },

  packageLeft: {
    position: 'absolute',

    left: 1,

    top: 8,

    width: 11,

    height: 14,

    borderWidth: 2,

    borderColor: '#159447',

    transform: [
      {
        skewY: '-25deg',
      },
    ],
  },

  packageRight: {
    position: 'absolute',

    right: 1,

    top: 8,

    width: 11,

    height: 14,

    borderWidth: 2,

    borderColor: '#159447',

    transform: [
      {
        skewY: '25deg',
      },
    ],
  },

  bellSmall: {
    width: 24,

    height: 26,

    alignItems: 'center',

    justifyContent: 'flex-end',
  },

  bellTop: {
    width: 18,

    height: 18,

    borderWidth: 2,

    borderColor: '#F28B10',

    borderTopLeftRadius: 10,

    borderTopRightRadius: 10,

    borderBottomLeftRadius: 4,

    borderBottomRightRadius: 4,
  },

  bellBottom: {
    width: 23,

    height: 2,

    backgroundColor: '#F28B10',

    borderRadius: 2,

    marginTop: -1,
  },

  bellClapperSmall: {
    width: 5,

    height: 5,

    borderRadius: 3,

    backgroundColor: '#F28B10',

    marginTop: 2,
  },

  walletSmall: {
    width: 27,

    height: 24,

    position: 'relative',
  },

  walletBodySmall: {
    position: 'absolute',

    left: 2,

    bottom: 2,

    width: 23,

    height: 17,

    borderWidth: 2,

    borderColor: '#1877D4',

    borderRadius: 4,
  },

  walletPocketSmall: {
    position: 'absolute',

    right: 0,

    bottom: 6,

    width: 9,

    height: 8,

    borderWidth: 2,

    borderColor: '#1877D4',

    borderRadius: 3,
  },

  walletDotSmall: {
    position: 'absolute',

    right: 4,

    bottom: 9,

    width: 4,

    height: 4,

    borderRadius: 2,

    backgroundColor: '#1877D4',
  },

  exclamationIcon: {
    fontSize: 27,

    lineHeight: 29,

    fontWeight: '800',

    color: '#F04444',
  },

  checkIcon: {
    fontSize: 27,

    lineHeight: 29,

    fontWeight: '800',

    color: '#16A04A',
  },

  infoIcon: {
    fontSize: 24,

    lineHeight: 27,

    fontWeight: '800',

    color: '#1877D4',
  },

  giftIcon: {
    fontSize: 19,
  },

  locationPinSmall: {
    width: 23,

    height: 23,

    borderRadius: 13,

    backgroundColor: '#F28B10',

    transform: [
      {
        rotate: '45deg',
      },
    ],

    alignItems: 'center',

    justifyContent: 'center',
  },

  locationPinCenter: {
    width: 7,

    height: 7,

    borderRadius: 4,

    backgroundColor: '#FFFFFF',
  },

  cardContent: {
    flex: 1,

    paddingRight: 5,
  },

  notificationTitle: {
    fontSize: 13,

    lineHeight: 18,

    fontWeight: '600',

    color: '#22272B',
  },

  notificationTitleUnread: {
    fontWeight: '800',

    color: '#111827',
  },

  notificationMessage: {
    marginTop: 3,

    fontSize: 10,

    lineHeight: 15,

    color: '#6F777C',
  },

  cardRight: {
    width: 70,

    minHeight: 62,

    alignItems: 'flex-end',

    justifyContent: 'center',
  },

  notificationTime: {
    maxWidth: 68,

    fontSize: 9,

    lineHeight: 13,

    color: '#70787D',

    textAlign: 'right',
  },

  unreadDot: {
    width: 7,

    height: 7,

    marginTop: 4,

    marginBottom: 1,

    borderRadius: 4,

    backgroundColor: '#16A04A',
  },

  chevron: {
    marginTop: 0,

    fontSize: 24,

    lineHeight: 24,

    fontWeight: '300',

    color: '#9BA2A6',
  },

  emptyState: {
    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 30,

    paddingTop: 80,
  },

  emptyIconCircle: {
    width: 68,

    height: 68,

    borderRadius: 34,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#E6F6E9',

    marginBottom: 14,
  },

  emptyIcon: {
    fontSize: 29,

    fontWeight: '800',

    color: '#2E8B57',
  },

  emptyTitle: {
    fontSize: 18,

    fontWeight: '800',

    color: '#1F2937',

    textAlign: 'center',
  },

  emptyDescription: {
    marginTop: 7,

    fontSize: 12,

    lineHeight: 18,

    color: '#737B80',

    textAlign: 'center',
  },

  bottomNavigation: {
    height: 73,

    paddingHorizontal: 4,

    paddingTop: 4,

    paddingBottom: 4,

    backgroundColor: '#FFFFFF',

    borderTopWidth: 1,

    borderTopColor: '#E7EAE8',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-around',
  },

  bottomNavItem: {
    flex: 1,

    height: 64,

    alignItems: 'center',

    justifyContent: 'center',
  },

  bottomIconWrapper: {
    width: 29,

    height: 28,

    alignItems: 'center',

    justifyContent: 'center',

    position: 'relative',
  },

  bottomNavLabel: {
    marginTop: 4,

    fontSize: 9,

    lineHeight: 12,

    color: '#697277',

    fontWeight: '600',
  },

  bottomNavLabelActive: {
    color: '#079447',

    fontWeight: '800',
  },

  bottomNotificationDot: {
    position: 'absolute',

    top: -1,

    right: 1,

    width: 9,

    height: 9,

    borderRadius: 5,

    backgroundColor: '#F04444',

    borderWidth: 1.5,

    borderColor: '#FFFFFF',
  },

  navIconBox: {
    width: 24,

    height: 24,

    alignItems: 'center',

    justifyContent: 'flex-end',
  },

  homeIconRoof: {
    position: 'absolute',

    top: 2,

    width: 17,

    height: 17,

    borderTopWidth: 2,

    borderLeftWidth: 2,

    transform: [
      {
        rotate: '45deg',
      },
    ],
  },

  homeIconBody: {
    width: 19,

    height: 16,

    borderWidth: 2,

    borderTopWidth: 0,

    alignItems: 'center',

    justifyContent: 'flex-end',
  },

  homeIconDoor: {
    width: 5,

    height: 8,

    borderTopLeftRadius: 2,

    borderTopRightRadius: 2,
  },

  boxIcon: {
    width: 21,

    height: 21,

    borderWidth: 2,

    borderRadius: 2,

    position: 'relative',
  },

  boxIconLine: {
    position: 'absolute',

    top: 7,

    left: 2,

    right: 2,

    height: 2,
  },

  walletIcon: {
    width: 23,

    height: 17,

    borderWidth: 2,

    borderRadius: 4,

    position: 'relative',
  },

  walletPocket: {
    position: 'absolute',

    right: -2,

    top: 4,

    width: 9,

    height: 7,

    borderWidth: 2,

    borderRadius: 3,
  },

  walletDot: {
    position: 'absolute',

    right: 2,

    top: 6,

    width: 3,

    height: 3,

    borderRadius: 2,
  },

  navBell: {
    width: 23,

    height: 25,

    alignItems: 'center',

    justifyContent: 'flex-end',
  },

  navBellBody: {
    width: 18,

    height: 17,

    borderWidth: 2,

    borderTopLeftRadius: 10,

    borderTopRightRadius: 10,

    borderBottomLeftRadius: 4,

    borderBottomRightRadius: 4,
  },

  navBellBottom: {
    width: 22,

    height: 2,

    borderRadius: 2,

    marginTop: -1,
  },

  navBellClapper: {
    width: 5,

    height: 4,

    borderRadius: 2,

    marginTop: 2,
  },

  profileNavIcon: {
    width: 24,

    height: 25,

    alignItems: 'center',

    justifyContent: 'flex-end',
  },

  profileHead: {
    width: 9,

    height: 9,

    borderRadius: 5,

    borderWidth: 2,
  },

  profileShoulders: {
    width: 20,

    height: 11,

    marginTop: 3,

    borderWidth: 2,

    borderTopLeftRadius: 10,

    borderTopRightRadius: 10,

    borderBottomWidth: 0,
  },

  bottomScrollSpace: {
    height: 10,
  },
});

export default NotificationsScreen;
