import React, {useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faBell,
  faUser,
  faWallet,
  faBox,
  faStar,
  faLocationDot,
  faArrowRight,
  faHeadset,
  faTriangleExclamation,
  faHouse,
  faChevronRight,
  faTruck,
  faCircleInfo,
  faClock,
  faRoute,
} from '@fortawesome/free-solid-svg-icons';
import type {MainStackParamList} from '../../../app/navigation/MainNavigator';
import {getDeliveries, getPartner, OrderRecord, setAvailability} from '../../../shared/services/api';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Home'
>;

const COLORS = {
  green: '#0BA457',
  darkGreen: '#07553E',
  lightGreen: '#EAF8ED',
  text: '#111827',
  muted: '#70777A',
  border: '#E9EDE9',
  white: '#FFFFFF',
  blue: '#1779E5',
  orange: '#F28A00',
  purple: '#6840D8',
  red: '#F04444',
};

function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [isOnline, setIsOnline] = useState(false);
  const [partnerOrders, setPartnerOrders] = useState<OrderRecord[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      Promise.all([getPartner(), getDeliveries()])
        .then(([partner, orders]) => {
          if (!active) return;
          setIsOnline(partner.availabilityStatus !== 'offline');
          setPartnerOrders(orders);
        })
        .catch(error => {
          if (active) Alert.alert('DailyMart data unavailable', error instanceof Error ? error.message : 'Retry.');
        });
      return () => { active = false; };
    }, []),
  );

  const currentDelivery =
    partnerOrders.find(order => order.orderStatus === 'out_for_delivery') ||
    partnerOrders[0] ||
    null;
  const todayEarnings = '—';
  const deliveriesToday = partnerOrders.length;
  const rating = '—';
  const handleViewDeliveries = () => {
    navigation.navigate('Deliveries');
  };

  const handleViewDeliveryHistory = () => {
    navigation.navigate('DeliveryHistory');
  };

  const handleViewEarnings = () => {
    navigation.navigate('Earnings');
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

  const handleToggleAvailability = async () => {
    const nextStatus = !isOnline;
    try {
      const partner = await setAvailability(nextStatus);
      setIsOnline(partner.availabilityStatus !== "offline");
    } catch (error) {
      Alert.alert("Availability not changed", error instanceof Error ? error.message : "Please retry.");
    }
  };

  const handleCurrentDelivery = () => {
    if (currentDelivery) {
      navigation.navigate('DeliveryDetails', {deliveryId: currentDelivery.orderNumber});
    } else {
      navigation.navigate('Deliveries');
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandSection}>
              <View style={styles.brandRow}>
                <View style={styles.logoTextContainer}>
                  <Text style={styles.logoText}>
                    <Text style={styles.logoDaily}>Daily</Text>
                    <Text style={styles.logoMart}>Mart</Text>
                  </Text>
                </View>
              </View>
              <Text style={styles.partnerText}>Delivery Partner</Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                style={styles.notificationButton}
                onPress={handleViewNotifications}
                accessibilityRole="button"
                accessibilityLabel="Open notifications">
                <FontAwesomeIcon
                  icon={faBell}
                  size={22}
                  color={COLORS.darkGreen}
                />
                <View style={styles.notificationDot} />
              </Pressable>

              <Pressable
                style={styles.profileButton}
                onPress={handleViewProfile}
                accessibilityRole="button"
                accessibilityLabel="Open profile">
                <FontAwesomeIcon
                  icon={faUser}
                  size={21}
                  color={COLORS.darkGreen}
                />
                <View style={styles.profileOnlineDot} />
              </Pressable>
            </View>
          </View>

          {/* Online status */}
          <View
            style={[
              styles.onlineCard,
              isOnline ? styles.onlineCardActive : styles.onlineCardInactive,
            ]}>
            <View style={styles.onlineLeftSection}>
              <View
                style={[
                  styles.statusOuterCircle,
                  !isOnline && styles.statusOuterCircleOffline,
                ]}>
                <View
                  style={[
                    styles.statusInnerCircle,
                    isOnline
                      ? styles.statusInnerOnline
                      : styles.statusInnerOffline,
                  ]}
                />
              </View>

              <View style={styles.onlineTextContainer}>
                <Text style={styles.onlineTitle}>
                  {isOnline ? 'You are Online' : 'You are Offline'}
                </Text>
                <Text style={styles.onlineSubtitle}>
                  {isOnline
                    ? 'Ready to receive deliveries'
                    : 'You are not receiving deliveries'}
                </Text>
              </View>
            </View>

            <Pressable
              style={[
                styles.toggle,
                isOnline ? styles.toggleActive : styles.toggleInactive,
              ]}
              onPress={handleToggleAvailability}
              accessibilityRole="switch"
              accessibilityState={{checked: isOnline}}
              accessibilityLabel="Toggle delivery availability">
              <View
                style={[
                  styles.toggleKnob,
                  isOnline
                    ? styles.toggleKnobActive
                    : styles.toggleKnobInactive,
                ]}
              />
            </Pressable>
          </View>

          {/* Today's statistics */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <View
                style={[styles.statIconCircle, styles.earningsIconCircle]}>
                <FontAwesomeIcon
                  icon={faWallet}
                  size={19}
                  color={COLORS.green}
                />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>NPR {todayEarnings}</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View
                style={[styles.statIconCircle, styles.deliveryIconCircle]}>
                <FontAwesomeIcon
                  icon={faBox}
                  size={19}
                  color={COLORS.green}
                />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{deliveriesToday}</Text>
                <Text style={styles.statLabel}>Active Orders</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconCircle, styles.ratingIconCircle]}>
                <FontAwesomeIcon
                  icon={faStar}
                  size={19}
                  color="#F59A13"
                />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{rating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>

          {/* Current delivery */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Delivery</Text>
            <FontAwesomeIcon
              icon={faChevronRight}
              size={16}
              color={COLORS.green}
            />
          </View>

          <View style={styles.currentDeliveryCard}>
            <View style={styles.currentDeliveryHeader}>
              <Text style={styles.currentDeliveryTitle}>Current Delivery</Text>
              <View style={styles.onTheWayBadge}>
                <Text style={styles.onTheWayText}>{currentDelivery?.orderStatus === 'out_for_delivery' ? 'ON THE WAY' : currentDelivery ? 'ASSIGNED' : 'WAITING'}</Text>
              </View>
            </View>

            <View style={styles.currentDeliveryContent}>
              <View style={styles.deliveryInformation}>
                <Text style={styles.orderNumber}>{currentDelivery ? '#' + currentDelivery.orderNumber : 'No active order'}</Text>

                <View style={styles.customerLocationRow}>
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    size={23}
                    color={COLORS.red}
                    style={styles.locationIcon}
                  />

                  <View style={styles.customerLocationText}>
                    <Text style={styles.customerName}>{currentDelivery?.deliveryLocation?.name || currentDelivery?.customer?.fullName || 'Customer'}</Text>
                    <Text style={styles.customerAddress}>
                      {currentDelivery?.deliveryLocation?.locality || currentDelivery?.deliveryLocation?.formattedAddress || currentDelivery?.deliveryLocation?.cityName || 'Delivery address unavailable'}
                    </Text>

                    <View style={styles.etaRow}>
                      <FontAwesomeIcon
                        icon={faRoute}
                        size={12}
                        color={COLORS.muted}
                      />
                      <Text style={styles.deliveryEta}> — km</Text>

                      <FontAwesomeIcon
                        icon={faClock}
                        size={12}
                        color={COLORS.muted}
                        style={styles.etaClock}
                      />
                      <Text style={styles.deliveryEta}>{currentDelivery?.estimatedDeliveryAt ? Math.max(0, Math.ceil((new Date(currentDelivery.estimatedDeliveryAt).getTime() - Date.now()) / 60000)) + ' min' : '29 min'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Illustrative map preview, not live navigation */}
              <View
                style={styles.mapPreview}
                accessibilityLabel="Illustrative route preview. Open the active delivery for live location.">
                <View style={styles.mapRoadOne} />
                <View style={styles.mapRoadTwo} />
                <View style={styles.mapRoadThree} />
                <View style={styles.mapRoadFour} />
                <View style={styles.mapWaterOne} />
                <View style={styles.mapWaterTwo} />

                <View style={styles.mapStartPin}>
                  <FontAwesomeIcon
                    icon={faTruck}
                    size={11}
                    color={COLORS.white}
                  />
                </View>

                <View style={styles.mapRouteLine} />

                <View style={styles.mapDestinationPin}>
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    size={13}
                    color={COLORS.white}
                  />
                </View>
              </View>
            </View>

            <Pressable
              style={styles.continueDeliveryButton}
              onPress={handleCurrentDelivery}
              accessibilityRole="button"
              accessibilityLabel="Continue current delivery">
              <Text style={styles.continueDeliveryText}>
                Continue Delivery
              </Text>
              <FontAwesomeIcon
                icon={faArrowRight}
                size={16}
                color={COLORS.white}
              />
            </Pressable>
          </View>

          {/* Quick actions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Pressable
              onPress={handleViewDeliveries}
              accessibilityRole="button"
              accessibilityLabel="See all deliveries">
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>

          <View style={styles.quickActionsGrid}>
            <Pressable
              style={[styles.quickActionCard, styles.quickActionGreen]}
              onPress={handleViewDeliveries}
              accessibilityRole="button"
              accessibilityLabel="My deliveries">
              <View
                style={[styles.quickActionIcon, styles.quickActionIconGreen]}>
                <FontAwesomeIcon
                  icon={faBox}
                  size={25}
                  color={COLORS.green}
                />
              </View>
              <Text style={styles.quickActionTitle}>My Deliveries</Text>
              <Text style={styles.quickActionSubtitle}>View all orders</Text>
            </Pressable>

            <Pressable
              style={[styles.quickActionCard, styles.quickActionOrange]}
              onPress={handleViewSupport}
              accessibilityRole="button"
              accessibilityLabel="Contact support">
              <View
                style={[styles.quickActionIcon, styles.quickActionIconOrange]}>
                <FontAwesomeIcon
                  icon={faHeadset}
                  size={25}
                  color={COLORS.orange}
                />
              </View>
              <Text style={styles.quickActionTitle}>Contact Support</Text>
              <Text style={styles.quickActionSubtitle}>Get Help</Text>
            </Pressable>

            <Pressable
              style={[styles.quickActionCard, styles.quickActionPurple]}
              onPress={handleViewSupport}
              accessibilityRole="button"
              accessibilityLabel="Report delivery issue">
              <View
                style={[styles.quickActionIcon, styles.quickActionIconPurple]}>
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  size={25}
                  color={COLORS.purple}
                />
              </View>
              <Text style={styles.quickActionTitle}>Report Issue</Text>
              <Text
                style={[styles.quickActionSubtitle, styles.purpleSubtitle]}>
                Delivery Problem
              </Text>
            </Pressable>

            <Pressable
              style={[styles.quickActionCard, styles.quickActionGreen]}
              onPress={handleViewDeliveryHistory}
              accessibilityRole="button"
              accessibilityLabel="View delivery history">
              <View
                style={[styles.quickActionIcon, styles.quickActionIconGreen]}>
                <FontAwesomeIcon
                  icon={faClock}
                  size={25}
                  color={COLORS.green}
                />
              </View>
              <Text style={styles.quickActionTitle}>Delivery History</Text>
              <Text style={styles.quickActionSubtitle}>
                View completed orders
              </Text>
            </Pressable>
          </View>

          {/* Recent notifications */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            <Pressable
              onPress={handleViewNotifications}
              accessibilityRole="button"
              accessibilityLabel="See all notifications">
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>

          <View style={styles.notificationsCard}>
            <Pressable
              style={styles.notificationRow}
              onPress={handleViewNotifications}
              accessibilityRole="button"
              accessibilityLabel="Open new delivery assigned notification">
              <View
                style={[
                  styles.notificationIcon,
                  styles.notificationIconGreen,
                ]}>
                <FontAwesomeIcon
                  icon={faBox}
                  size={19}
                  color={COLORS.green}
                />
              </View>

              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>
                  New delivery assigned
                </Text>
                <Text style={styles.notificationDescription}>
                  #DM-12346 • 1.8 km from your location
                </Text>
              </View>

              <View style={styles.notificationMeta}>
                <Text style={styles.notificationTime}>10 min ago</Text>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  size={13}
                  color="#9AA0A3"
                />
              </View>
            </Pressable>

            <View style={styles.notificationDivider} />

            <Pressable
              style={styles.notificationRow}
              onPress={handleViewNotifications}
              accessibilityRole="button"
              accessibilityLabel="Open warehouse pickup notification">
              <View
                style={[
                  styles.notificationIcon,
                  styles.notificationIconOrange,
                ]}>
                <FontAwesomeIcon
                  icon={faTruck}
                  size={19}
                  color={COLORS.orange}
                />
              </View>

              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>
                  Warehouse ready for pickup
                </Text>
                <Text style={styles.notificationDescription}>
                  2 orders are ready at DailyMart Warehouse
                </Text>
              </View>

              <View style={styles.notificationMeta}>
                <Text style={styles.notificationTime}>25 min ago</Text>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  size={13}
                  color="#9AA0A3"
                />
              </View>
            </Pressable>

            <View style={styles.notificationDivider} />

            <Pressable
              style={styles.notificationRow}
              onPress={handleViewNotifications}
              accessibilityRole="button"
              accessibilityLabel="Open announcement notification">
              <View
                style={[
                  styles.notificationIcon,
                  styles.notificationIconBlue,
                ]}>
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  size={19}
                  color={COLORS.blue}
                />
              </View>

              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>
                  Important Announcement
                </Text>
                <Text style={styles.notificationDescription}>
                  New delivery zone updated for Kathmandu
                </Text>
              </View>

              <View style={styles.notificationMeta}>
                <Text style={styles.notificationTime}>1 hour ago</Text>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  size={13}
                  color="#9AA0A3"
                />
              </View>
            </Pressable>
          </View>
        </ScrollView>

        {/* Bottom navigation */}
        <View style={styles.bottomNavigation}>
          <Pressable
            style={styles.bottomNavItem}
            accessibilityRole="button"
            accessibilityState={{selected: true}}
            accessibilityLabel="Home">
            <FontAwesomeIcon
              icon={faHouse}
              size={21}
              color={COLORS.green}
            />
            <Text
              style={[
                styles.bottomNavLabel,
                styles.bottomNavLabelActive,
              ]}>
              Home
            </Text>
          </Pressable>

          <Pressable
            style={styles.bottomNavItem}
            onPress={handleViewDeliveries}
            accessibilityRole="button"
            accessibilityLabel="Deliveries">
            <FontAwesomeIcon
              icon={faBox}
              size={21}
              color="#737A7D"
            />
            <Text style={styles.bottomNavLabel}>Deliveries</Text>
          </Pressable>

          <Pressable
            style={styles.bottomNavItem}
            onPress={handleViewEarnings}
            accessibilityRole="button"
            accessibilityLabel="Earnings">
            <FontAwesomeIcon
              icon={faWallet}
              size={21}
              color="#737A7D"
            />
            <Text style={styles.bottomNavLabel}>Earnings</Text>
          </Pressable>

          <Pressable
            style={styles.bottomNavItem}
            onPress={handleViewNotifications}
            accessibilityRole="button"
            accessibilityLabel="Notifications">
            <View style={styles.bottomBellIcon}>
              <FontAwesomeIcon
                icon={faBell}
                size={21}
                color="#737A7D"
              />
              <View style={styles.bottomNotificationDot} />
            </View>
            <Text style={styles.bottomNavLabel}>Notifications</Text>
          </Pressable>

          <Pressable
            style={styles.bottomNavItem}
            onPress={handleViewProfile}
            accessibilityRole="button"
            accessibilityLabel="Profile">
            <FontAwesomeIcon
              icon={faUser}
              size={21}
              color="#737A7D"
            />
            <Text style={styles.bottomNavLabel}>Profile</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  brandSection: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTextContainer: {
    alignItems: 'flex-start',
  },
  logoText: {
    fontSize: 28,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -1,
  },
  logoDaily: {
    color: COLORS.darkGreen,
  },
  logoMart: {
    color: '#20B94E',
  },
  partnerText: {
    marginTop: 3,
    marginLeft: 4,
    fontSize: 15,
    color: '#39725D',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  notificationButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 10,
  },
  notificationDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.red,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#E4F0E8',
  },
  profileOnlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#21B34B',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  onlineCard: {
    minHeight: 108,
    borderRadius: 18,
    paddingHorizontal: 17,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
  },
  onlineCardActive: {
    backgroundColor: '#ECF9EE',
    borderColor: '#D9F0DC',
  },
  onlineCardInactive: {
    backgroundColor: '#F7F7F7',
    borderColor: '#E5E5E5',
  },
  onlineLeftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusOuterCircle: {
    width: 53,
    height: 53,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D2F3D8',
    marginRight: 12,
  },
  statusOuterCircleOffline: {
    backgroundColor: '#E5E7EB',
  },
  statusInnerCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  statusInnerOnline: {
    backgroundColor: '#0CB64F',
  },
  statusInnerOffline: {
    backgroundColor: '#9CA3AF',
  },
  onlineTextContainer: {
    flex: 1,
  },
  onlineTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    color: '#124A3B',
  },
  onlineSubtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    color: '#6D7477',
    fontWeight: '500',
  },
  toggle: {
    width: 62,
    height: 38,
    borderRadius: 20,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.green,
    alignItems: 'flex-end',
  },
  toggleInactive: {
    backgroundColor: '#B8BFC0',
    alignItems: 'flex-start',
  },
  toggleKnob: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    elevation: 2,
  },
  toggleKnobActive: {
    marginRight: 0,
  },
  toggleKnobInactive: {
    marginLeft: 0,
  },
  statsCard: {
    minHeight: 94,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EEF0EE',
    shadowColor: '#65706A',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 22,
  },
  statItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  earningsIconCircle: {
    backgroundColor: '#DDF3E2',
  },
  deliveryIconCircle: {
    backgroundColor: '#DDF3E2',
  },
  ratingIconCircle: {
    backgroundColor: '#FFF1D9',
  },
  statTextContainer: {
    alignItems: 'center',
    flexShrink: 1,
  },
  statValue: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 58,
    backgroundColor: '#E9ECEA',
    marginHorizontal: 3,
  },
  sectionHeader: {
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  sectionTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A9B4B',
  },
  currentDeliveryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#66716B',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 22,
  },
  currentDeliveryHeader: {
    minHeight: 57,
    paddingHorizontal: 15,
    backgroundColor: '#E5F6E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentDeliveryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#124A3B',
  },
  onTheWayBadge: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#079B4A',
  },
  onTheWayText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },
  currentDeliveryContent: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryInformation: {
    flex: 1,
    paddingRight: 8,
  },
  orderNumber: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 17,
  },
  customerLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  customerLocationText: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    color: COLORS.text,
  },
  customerAddress: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
    color: '#6C7377',
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  deliveryEta: {
    fontSize: 11,
    lineHeight: 17,
    color: '#6C7377',
    fontWeight: '500',
  },
  etaClock: {
    marginLeft: 9,
  },
  mapPreview: {
    width: 105,
    height: 112,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EAF1EA',
  },
  mapRoadOne: {
    position: 'absolute',
    width: 150,
    height: 8,
    left: -15,
    top: 26,
    backgroundColor: '#D1DBD2',
    transform: [{rotate: '18deg'}],
  },
  mapRoadTwo: {
    position: 'absolute',
    width: 150,
    height: 7,
    left: -10,
    top: 64,
    backgroundColor: '#D6DFD7',
    transform: [{rotate: '-28deg'}],
  },
  mapRoadThree: {
    position: 'absolute',
    width: 150,
    height: 6,
    left: -25,
    top: 85,
    backgroundColor: '#D1DBD2',
    transform: [{rotate: '38deg'}],
  },
  mapRoadFour: {
    position: 'absolute',
    width: 150,
    height: 5,
    left: 10,
    top: 9,
    backgroundColor: '#D6DFD7',
    transform: [{rotate: '-35deg'}],
  },
  mapWaterOne: {
    position: 'absolute',
    width: 30,
    height: 16,
    left: 12,
    top: 9,
    borderRadius: 12,
    backgroundColor: '#C7E9ED',
  },
  mapWaterTwo: {
    position: 'absolute',
    width: 24,
    height: 14,
    right: 8,
    bottom: 10,
    borderRadius: 10,
    backgroundColor: '#C9E9EC',
  },
  mapStartPin: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    left: 20,
    top: 43,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  mapRouteLine: {
    position: 'absolute',
    width: 55,
    height: 5,
    left: 36,
    top: 65,
    backgroundColor: COLORS.blue,
    transform: [{rotate: '24deg'}],
    borderRadius: 3,
  },
  mapDestinationPin: {
    position: 'absolute',
    width: 27,
    height: 27,
    borderRadius: 15,
    backgroundColor: COLORS.red,
    right: 7,
    bottom: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  continueDeliveryButton: {
    minHeight: 49,
    marginHorizontal: 15,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: COLORS.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  continueDeliveryText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  quickActionCard: {
    width: '48.3%',
    minHeight: 150,
    borderRadius: 17,
    paddingHorizontal: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionGreen: {
    backgroundColor: '#EFF9F0',
  },
  quickActionOrange: {
    backgroundColor: '#FFF5E8',
  },
  quickActionPurple: {
    backgroundColor: '#F4F0FC',
  },
  quickActionIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionIconGreen: {
    backgroundColor: '#D9F5DF',
  },
  quickActionIconOrange: {
    backgroundColor: '#FFE8C7',
  },
  quickActionIconPurple: {
    backgroundColor: '#E7DDF9',
  },
  quickActionTitle: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  quickActionSubtitle: {
    marginTop: 3,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    color: '#6D7477',
  },
  purpleSubtitle: {
    color: COLORS.purple,
  },
  notificationsCard: {
    borderRadius: 17,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  notificationRow: {
    minHeight: 82,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  notificationIconGreen: {
    backgroundColor: '#DDF4E1',
  },
  notificationIconOrange: {
    backgroundColor: '#FFF0D9',
  },
  notificationIconBlue: {
    backgroundColor: '#DFEEFF',
  },
  notificationContent: {
    flex: 1,
    paddingRight: 5,
  },
  notificationTitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    color: COLORS.text,
  },
  notificationDescription: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 17,
    color: '#6E7578',
  },
  notificationMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 54,
    gap: 7,
  },
  notificationTime: {
    fontSize: 10,
    lineHeight: 15,
    color: '#777E81',
    textAlign: 'right',
  },
  notificationDivider: {
    height: 1,
    backgroundColor: '#EEF0EE',
    marginHorizontal: 12,
  },
  bottomNavigation: {
    minHeight: 76,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E7EAE8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 3,
    paddingTop: 5,
  },
  bottomNavItem: {
    flex: 1,
    minHeight: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavLabel: {
    marginTop: 5,
    fontSize: 10,
    lineHeight: 14,
    color: '#737A7D',
    fontWeight: '500',
  },
  bottomNavLabelActive: {
    color: '#078F45',
    fontWeight: '800',
  },
  bottomBellIcon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNotificationDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.red,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
});

export default HomeScreen;
