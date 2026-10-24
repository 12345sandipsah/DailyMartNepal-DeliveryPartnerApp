import React, {useCallback, useMemo, useState} from 'react';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faBagShopping,
  faBell,
  faCalendarDays,
  faChevronDown,
  faCircleCheck,
  faClock,
  faFilter,
  faLeaf,
  faLocationDot,
  faMagnifyingGlass,
  faMoneyBillWave,
  faPhone,
  faRoute,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';

import {useFocusEffect, useNavigation} from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import {getDeliveries, getDeliveryHistory, OrderRecord} from '../../../shared/services/api';

type DeliveryStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED UP'
  | 'OUT FOR DELIVERY'
  | 'DELIVERED'
  | 'FAILED';

type Delivery = {
  id: string;

  customer: string;

  area: string;

  ward: string;

  distance: string;

  distanceValue: number;

  eta: string;

  amount: string;

  payment: 'COD - Cash' | 'eSewa' | 'Khalti';

  status: DeliveryStatus;

  items: number;

  products: string[];
};

const VALID_DELIVERY_STATUSES: readonly DeliveryStatus[] = [
  'ASSIGNED',
  'ACCEPTED',
  'PICKED UP',
  'OUT FOR DELIVERY',
  'DELIVERED',
  'FAILED',
];

const VALID_PAYMENT_METHODS: readonly Delivery['payment'][] = [
  'COD - Cash',
  'eSewa',
  'Khalti',
];

/** Validate delivery data before rendering or navigating to its details. */
const isValidDelivery = (delivery: Delivery): boolean => {
  return (
    typeof delivery.id === 'string' &&
    /^#?DM-[A-Z0-9-]{5,}$/i.test(delivery.id) &&
    typeof delivery.customer === 'string' &&
    delivery.customer.trim().length > 0 &&
    typeof delivery.area === 'string' &&
    delivery.area.trim().length > 0 &&
    typeof delivery.ward === 'string' &&
    delivery.ward.trim().length > 0 &&
    typeof delivery.distance === 'string' &&
    /^\d+(?:\.\d+)?\s?km$/i.test(delivery.distance) &&
    Number.isFinite(delivery.distanceValue) &&
    delivery.distanceValue >= 0 &&
    typeof delivery.eta === 'string' &&
    /^\d+\smin$/i.test(delivery.eta) &&
    typeof delivery.amount === 'string' &&
    /^NPR\s[\d,]+(?:\.\d{1,2})?$/.test(delivery.amount) &&
    VALID_PAYMENT_METHODS.includes(delivery.payment) &&
    VALID_DELIVERY_STATUSES.includes(delivery.status) &&
    Number.isInteger(delivery.items) &&
    delivery.items > 0 &&
    Array.isArray(delivery.products) &&
    delivery.products.length > 0 &&
    delivery.products.length <= delivery.items &&
    delivery.products.every(
      product => typeof product === 'string' && product.trim().length > 0,
    )
  );
};

const mapOrderToDelivery = (order: OrderRecord): Delivery => {
  const rawStatus = String(order.orderStatus || "").toLowerCase();
  const status: DeliveryStatus =
    rawStatus === "delivered"
      ? "DELIVERED"
      : rawStatus === "out_for_delivery"
        ? "OUT FOR DELIVERY"
        : order.deliveryAssignmentStatus === "accepted"
          ? "ACCEPTED"
          : "ASSIGNED";
  const location = order.deliveryLocation || {};
  const productNames = (order.items || [])
    .map(item => item.name || item.productName || "Vegetable")
    .filter(Boolean);
  const remainingMinutes = order.estimatedDeliveryAt
    ? Math.max(0, Math.ceil((new Date(order.estimatedDeliveryAt).getTime() - Date.now()) / 60000))
    : 29;
  const paymentMethod = String(order.paymentMethod || "").toLowerCase();
  const payment = paymentMethod === "esewa"
    ? "eSewa"
    : paymentMethod === "khalti"
      ? "Khalti"
      : "COD - Cash";
  const address = location.locality || location.formattedAddress || location.cityName || "Customer address";
  return {
    id: order.orderNumber || order._id,
    customer: location.name || order.customer?.fullName || "Customer",
    area: [address, location.cityName].filter(Boolean).join(", "),
    ward: location.ward ? "Ward No. " + location.ward : "Ward not recorded",
    distance: "0 km",
    distanceValue: 0,
    eta: remainingMinutes + " min",
    amount: "NPR " + Number(order.total || 0).toLocaleString("en-IN"),
    payment,
    status,
    items: Math.max(1, productNames.length),
    products: productNames.length ? productNames : ["Order items"],
  };
};
type Filter = 'ASSIGNED' | 'ACTIVE' | 'COMPLETED';

type DeliveriesScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Deliveries'
>;

function DeliveriesScreen() {
  const navigation = useNavigation<DeliveriesScreenNavigationProp>();

  const [selectedFilter, setSelectedFilter] = useState<Filter>('ASSIGNED');
  const [sortNearest, setSortNearest] = useState(true);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getDeliveries(), getDeliveryHistory()])
        .then(([activeOrders, history]) => {
          if (active) setDeliveries([...activeOrders, ...history].map(mapOrderToDelivery));
        })
        .catch(error => {
          if (active) Alert.alert('Could not load deliveries', error instanceof Error ? error.message : 'Please retry.');
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const validatedDeliveries = useMemo(
    () => deliveries.filter(isValidDelivery),
    [deliveries],
  );
  const invalidDeliveryCount = deliveries.length - validatedDeliveries.length;

  const assignedDeliveries = validatedDeliveries.filter(delivery =>
    ['ASSIGNED', 'ACCEPTED'].includes(delivery.status),
  );

  const activeDeliveries = validatedDeliveries.filter(delivery =>
    ['PICKED UP', 'OUT FOR DELIVERY'].includes(delivery.status),
  );

  const completedDeliveries = validatedDeliveries.filter(
    delivery => delivery.status === 'DELIVERED',
  );

  const filteredDeliveries = useMemo(() => {
    let result: Delivery[];

    switch (selectedFilter) {
      case 'ACTIVE':
        result = activeDeliveries;

        break;

      case 'COMPLETED':
        result = completedDeliveries;

        break;

      default:
        result = assignedDeliveries;
    }

    if (sortNearest) {
      return [...result].sort((a, b) => a.distanceValue - b.distanceValue);
    }

    return result;
  }, [
    selectedFilter,

    sortNearest,

    assignedDeliveries,

    activeDeliveries,

    completedDeliveries,
  ]);

  const handleDeliveryPress = (delivery: Delivery) => {
    if (!isValidDelivery(delivery)) {
      Alert.alert(
        'Invalid delivery data',
        'This delivery contains incomplete or invalid information and cannot be opened.',
      );
      return;
    }

    navigation.navigate('DeliveryDetails', {
      deliveryId: delivery.id,
    });
  };

  const getPaymentStyle = (payment: Delivery['payment']) => {
    if (payment === 'eSewa') {
      return {
        backgroundColor: '#EAF3FF',

        icon: faWallet,

        iconColor: '#1877F2',
      };
    }

    if (payment === 'Khalti') {
      return {
        backgroundColor: '#F1EAFF',

        icon: faWallet,

        iconColor: '#7047D8',
      };
    }

    return {
      backgroundColor: '#FFF7E5',

      icon: faMoneyBillWave,

      iconColor: '#F39A00',
    };
  };

  const getTabCount = (filter: Filter) => {
    if (filter === 'ACTIVE') {
      return activeDeliveries.length;
    }

    if (filter === 'COMPLETED') {
      return completedDeliveries.length;
    }

    return assignedDeliveries.length;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}

        <View style={styles.brandHeader}>
          <View style={styles.brandBlock}>
            <View style={styles.logoRow}>
              <FontAwesomeIcon icon={faLeaf} size={26} color="#20B94B" />

              <Text style={styles.dailyText}>Daily</Text>

              <Text style={styles.martText}>Mart</Text>
            </View>

            <Text style={styles.partnerText}>Delivery Partner</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerIconButton}
              accessibilityLabel="Search"
            >
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                size={20}
                color="#073F36"
              />
            </Pressable>

            <Pressable
              style={styles.headerIconButton}
              accessibilityLabel="Notifications"
              onPress={() => navigation.navigate('Notifications')}
            >
              <FontAwesomeIcon icon={faBell} size={21} color="#075B48" />

              <View style={styles.notificationDot} />
            </Pressable>

            <Pressable
              style={styles.profileAvatar}
              accessibilityLabel="Profile"
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.profileInitial}>S</Text>

              <View style={styles.onlineDot} />
            </Pressable>
          </View>
        </View>

        {/* Page title */}

        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>My Deliveries</Text>
        </View>

        {/* Tabs */}

        <View style={styles.tabsOuter}>
          {(['ASSIGNED', 'ACTIVE', 'COMPLETED'] as Filter[]).map(filter => {
            const selected = selectedFilter === filter;

            const label =
              filter === 'ASSIGNED'
                ? `Assigned (${getTabCount(filter)})`
                : filter === 'ACTIVE'
                ? `Active (${getTabCount(filter)})`
                : 'Completed';

            return (
              <Pressable
                key={filter}
                style={[styles.tab, selected && styles.tabSelected]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[styles.tabText, selected && styles.tabTextSelected]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Date + Sort + Filter - SAME LINE */}

        <View style={styles.dateToolsRow}>
          {/* Date */}

          <View style={styles.dateBlock}>
            <View style={styles.calendarIcon}>
              <FontAwesomeIcon
                icon={faCalendarDays}
                size={23}
                color="#075B48"
              />
            </View>

            <View style={styles.dateTextBlock}>
              <Text style={styles.todayText}>Today</Text>

              <Text style={styles.dateText} numberOfLines={1}>
                {new Date().toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Sort + Filter */}

          <View style={styles.toolsRow}>
            <Pressable
              style={styles.sortButton}
              onPress={() => setSortNearest(previous => !previous)}
            >
              <Text style={styles.sortText} numberOfLines={1}>
                Sort: {sortNearest ? 'Nearest' : 'Assigned'}
              </Text>

              <FontAwesomeIcon icon={faChevronDown} size={12} color="#343B3D" />
            </Pressable>

            <Pressable
              style={styles.filterButton}
              accessibilityLabel="Filter deliveries"
            >
              <FontAwesomeIcon icon={faFilter} size={18} color="#374044" />
            </Pressable>
          </View>
        </View>

        {/* Client-side data validation feedback */}
        {invalidDeliveryCount > 0 ? (
          <View style={styles.validationWarning} accessibilityRole="alert">
            <Text style={styles.validationWarningText}>
              {invalidDeliveryCount} delivery record(s) contain invalid data and
              were hidden.
            </Text>
          </View>
        ) : null}

        {/* Delivery list */}

        {filteredDeliveries.length > 0 ? (
          filteredDeliveries.map((delivery, index) => {
            const paymentStyle = getPaymentStyle(delivery.payment);

            const extraProducts = delivery.items - delivery.products.length;

            return (
              <Pressable
                key={delivery.id}
                style={styles.deliveryCard}
                onPress={() => handleDeliveryPress(delivery)}
              >
                <View style={styles.cardAccent} />

                {/* Top section */}

                <View style={styles.cardTopRow}>
                  <View style={styles.orderIdentity}>
                    <View style={styles.sequenceCircle}>
                      <Text style={styles.sequenceText}>{index + 1}</Text>
                    </View>

                    <View style={styles.orderDetails}>
                      <View style={styles.orderRow}>
                        <Text style={styles.orderId}>{delivery.id}</Text>

                        <View style={styles.assignedBadge}>
                          <Text style={styles.assignedBadgeText}>
                            {delivery.status === 'OUT FOR DELIVERY'
                              ? 'On the way'
                              : delivery.status === 'DELIVERED'
                              ? 'Completed'
                              : 'Assigned'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.customerNameRow}>
                        <Text style={styles.customerName}>
                          {delivery.customer}
                        </Text>

                        <FontAwesomeIcon
                          icon={faPhone}
                          size={12}
                          color="#13A94F"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.mapShortcut}>
                    <FontAwesomeIcon icon={faRoute} size={23} color="#14984D" />
                  </View>
                </View>

                {/* Location + distance */}

                <View style={styles.locationMetricsRow}>
                  <View style={styles.locationBlock}>
                    <FontAwesomeIcon
                      icon={faLocationDot}
                      size={16}
                      color="#6C7477"
                    />

                    <View style={styles.locationTextBlock}>
                      <Text style={styles.areaText} numberOfLines={1}>
                        {delivery.area}
                      </Text>

                      <Text style={styles.wardText}>{delivery.ward}</Text>
                    </View>
                  </View>

                  <View style={styles.metricBlock}>
                    <FontAwesomeIcon icon={faRoute} size={13} color="#0BA650" />

                    <Text style={styles.metricText}>{delivery.distance}</Text>
                  </View>

                  <View style={styles.metricBlock}>
                    <FontAwesomeIcon icon={faClock} size={16} color="#60696C" />

                    <Text style={styles.metricText}>{delivery.eta}</Text>
                  </View>
                </View>

                {/* Bottom information section */}

                <View style={styles.bottomSection}>
                  {/* Products */}

                  <View style={styles.itemsBox}>
                    <View style={styles.itemsHeader}>
                      <FontAwesomeIcon
                        icon={faBagShopping}
                        size={14}
                        color="#30383A"
                      />

                      <Text style={styles.itemsCount}>
                        {delivery.items} items
                      </Text>
                    </View>

                    <View style={styles.productRow}>
                      {delivery.products.map((product, productIndex) => (
                        <View
                          key={`${delivery.id}-${productIndex}`}
                          style={styles.productThumb}
                        >
                          <Text style={styles.productEmoji}>{product}</Text>
                        </View>
                      ))}

                      {extraProducts > 0 ? (
                        <View style={styles.moreProducts}>
                          <Text style={styles.moreProductsText}>
                            +{extraProducts}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Payment + View Details */}

                  <View style={styles.paymentActionRow}>
                    <View
                      style={[
                        styles.paymentBox,

                        {
                          backgroundColor: paymentStyle.backgroundColor,
                        },
                      ]}
                    >
                      <FontAwesomeIcon
                        icon={paymentStyle.icon}
                        size={17}
                        color={paymentStyle.iconColor}
                      />

                      <View style={styles.paymentTextBlock}>
                        <Text style={styles.paymentAmount}>
                          {delivery.amount}
                        </Text>

                        <Text style={styles.paymentMethod}>
                          {delivery.payment}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      style={styles.detailsButton}
                      onPress={() => handleDeliveryPress(delivery)}
                    >
                      <Text style={styles.detailsButtonText}>View Details</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <FontAwesomeIcon icon={faCircleCheck} size={27} color="#0AA64B" />

            <Text style={styles.emptyTitle}>No deliveries found</Text>

            <Text style={styles.emptyText}>
              There are no deliveries in this category right now.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: '#FFFFFF',
  },

  content: {
    paddingHorizontal: 20,

    paddingTop: 8,

    paddingBottom: 32,
  },

  /* Header */

  brandHeader: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'flex-start',

    marginBottom: 18,
  },

  brandBlock: {
    minHeight: 65,
  },

  logoRow: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  leaf: {
    fontSize: 31,

    color: '#20B94B',

    transform: [{ rotate: '-22deg' }],

    marginRight: 2,
  },

  dailyText: {
    fontSize: 29,

    lineHeight: 34,

    fontWeight: '800',

    color: '#075B48',

    letterSpacing: -1.2,
  },

  martText: {
    fontSize: 29,

    lineHeight: 34,

    fontWeight: '800',

    color: '#23B848',

    letterSpacing: -1.2,
  },

  partnerText: {
    marginTop: 5,

    fontSize: 16,

    fontWeight: '500',

    color: '#4D806C',
  },

  headerActions: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 9,

    paddingTop: 8,
  },

  headerIconButton: {
    width: 38,

    height: 38,

    alignItems: 'center',

    justifyContent: 'center',
  },

  searchIcon: {
    fontSize: 37,

    lineHeight: 36,

    color: '#073F36',

    transform: [{ rotate: '-18deg' }],
  },

  bellIcon: {
    width: 27,

    height: 31,

    alignItems: 'center',

    justifyContent: 'flex-end',
  },

  bellBody: {
    width: 22,

    height: 23,

    borderWidth: 2.2,

    borderColor: '#075B48',

    borderTopLeftRadius: 13,

    borderTopRightRadius: 13,

    borderBottomLeftRadius: 4,

    borderBottomRightRadius: 4,
  },

  bellClapper: {
    position: 'absolute',

    bottom: 1,

    width: 7,

    height: 4,

    borderRadius: 4,

    backgroundColor: '#075B48',
  },

  notificationDot: {
    position: 'absolute',

    top: 4,

    right: 2,

    width: 11,

    height: 11,

    borderRadius: 6,

    backgroundColor: '#F04444',

    borderWidth: 1,

    borderColor: '#FFFFFF',
  },

  profileAvatar: {
    width: 50,

    height: 50,

    borderRadius: 25,

    backgroundColor: '#DCEDE5',

    alignItems: 'center',

    justifyContent: 'center',
  },

  profileInitial: {
    fontSize: 22,

    fontWeight: '800',

    color: '#075B48',
  },

  onlineDot: {
    position: 'absolute',

    right: -1,

    bottom: 1,

    width: 12,

    height: 12,

    borderRadius: 6,

    backgroundColor: '#21B64B',

    borderWidth: 2,

    borderColor: '#FFFFFF',
  },

  /* Title */

  titleRow: {
    marginBottom: 12,
  },

  pageTitle: {
    fontSize: 29,

    fontWeight: '800',

    color: '#073F36',

    letterSpacing: -0.5,
  },

  /* Tabs */

  tabsOuter: {
    flexDirection: 'row',

    backgroundColor: '#F3F5F5',

    borderRadius: 14,

    borderWidth: 1,

    borderColor: '#E5E9E8',

    padding: 2,

    marginBottom: 22,
  },

  tab: {
    flex: 1,

    minHeight: 50,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 11,

    paddingHorizontal: 4,
  },

  tabSelected: {
    backgroundColor: '#08A94B',
  },

  tabText: {
    fontSize: 14,

    fontWeight: '500',

    color: '#70777A',
  },

  tabTextSelected: {
    color: '#FFFFFF',

    fontWeight: '700',
  },

  /* Date + Sort + Filter */

  dateToolsRow: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 14,
  },

  dateBlock: {
    flex: 1,

    minWidth: 0,

    flexDirection: 'row',

    alignItems: 'center',

    marginRight: 8,
  },

  calendarIcon: {
    width: 32,

    height: 36,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 6,
  },

  calendarText: {
    fontSize: 27,

    color: '#075B48',
  },

  dateTextBlock: {
    flex: 1,

    minWidth: 0,
  },

  todayText: {
    fontSize: 15,

    lineHeight: 18,

    fontWeight: '700',

    color: '#171B1C',
  },

  dateText: {
    marginTop: 2,

    fontSize: 10.5,

    lineHeight: 14,

    color: '#72787A',
  },

  toolsRow: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

    flexShrink: 0,
  },

  sortButton: {
    width: 128,

    height: 42,

    borderRadius: 11,

    borderWidth: 1,

    borderColor: '#E1E5E4',

    paddingHorizontal: 9,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  sortText: {
    flex: 1,

    fontSize: 11.5,

    color: '#454B4D',
  },

  chevronDown: {
    fontSize: 19,

    color: '#343B3D',

    marginLeft: 4,

    marginTop: -3,
  },

  filterButton: {
    width: 42,

    height: 42,

    borderRadius: 11,

    borderWidth: 1,

    borderColor: '#E1E5E4',

    alignItems: 'center',

    justifyContent: 'center',
  },

  filterIcon: {
    fontSize: 23,

    color: '#374044',

    transform: [{ rotate: '90deg' }],
  },

  /* Delivery card */

  deliveryCard: {
    position: 'relative',

    overflow: 'hidden',

    backgroundColor: '#FFFFFF',

    borderRadius: 17,

    borderWidth: 1,

    borderColor: '#E8ECEA',

    marginBottom: 14,

    padding: 15,

    shadowColor: '#153D2E',

    shadowOpacity: 0.07,

    shadowRadius: 10,

    shadowOffset: {
      width: 0,

      height: 4,
    },

    elevation: 2,
  },

  cardAccent: {
    position: 'absolute',

    left: 0,

    top: 0,

    bottom: 0,

    width: 7,

    backgroundColor: '#B7F1D1',
  },

  cardTopRow: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent: 'space-between',

    paddingLeft: 4,
  },

  orderIdentity: {
    flexDirection: 'row',

    flex: 1,
  },

  orderDetails: {
    flex: 1,

    minWidth: 0,
  },

  sequenceCircle: {
    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: '#0AA64B',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 10,
  },

  sequenceText: {
    color: '#FFFFFF',

    fontSize: 17,

    fontWeight: '800',
  },

  orderRow: {
    flexDirection: 'row',

    alignItems: 'center',

    flexWrap: 'wrap',
  },

  orderId: {
    fontSize: 18,

    fontWeight: '800',

    color: '#101516',

    marginRight: 9,
  },

  assignedBadge: {
    backgroundColor: '#DDF7E5',

    borderRadius: 8,

    paddingHorizontal: 9,

    paddingVertical: 5,
  },

  assignedBadgeText: {
    fontSize: 10,

    fontWeight: '700',

    color: '#169448',

    textTransform: 'capitalize',
  },

  customerNameRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 7,
  },

  customerName: {
    fontSize: 15,

    fontWeight: '700',

    color: '#1B2022',
  },

  phoneIcon: {
    marginLeft: 8,

    fontSize: 14,

    color: '#13A94F',
  },

  mapShortcut: {
    width: 47,

    height: 47,

    borderRadius: 12,

    backgroundColor: '#EAF8F0',

    alignItems: 'center',

    justifyContent: 'center',

    marginLeft: 8,
  },

  mapIcon: {
    fontSize: 28,

    color: '#14984D',
  },

  /* Location metrics */

  locationMetricsRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 15,

    paddingLeft: 7,

    paddingBottom: 14,
  },

  locationBlock: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    flex: 1,

    minWidth: 0,
  },

  locationTextBlock: {
    flex: 1,

    minWidth: 0,
  },

  locationPin: {
    fontSize: 19,

    color: '#6C7477',

    marginRight: 9,

    marginTop: 1,
  },

  areaText: {
    fontSize: 13,

    color: '#626A6D',

    fontWeight: '500',
  },

  wardText: {
    marginTop: 3,

    fontSize: 12,

    color: '#858B8E',
  },

  metricBlock: {
    flexDirection: 'row',

    alignItems: 'center',

    minWidth: 67,

    marginLeft: 8,
  },

  metricIcon: {
    fontSize: 16,

    color: '#0BA650',

    marginRight: 7,
  },

  clockIcon: {
    fontSize: 20,

    color: '#60696C',

    marginRight: 6,
  },

  metricText: {
    fontSize: 13,

    color: '#626A6D',
  },

  /* Bottom section */

  bottomSection: {
    width: '100%',

    marginTop: 2,
  },

  itemsBox: {
    width: '100%',

    backgroundColor: '#F7F8F8',

    borderRadius: 11,

    paddingHorizontal: 9,

    paddingVertical: 8,
  },

  itemsHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 7,
  },

  bagIcon: {
    fontSize: 16,

    color: '#30383A',

    marginRight: 5,
  },

  itemsCount: {
    fontSize: 11,

    fontWeight: '600',

    color: '#30383A',
  },

  productRow: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    flexWrap: 'wrap',

    gap: 6,
  },

  productThumb: {
    width: 34,

    height: 34,

    borderRadius: 8,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E0E5E2',

    alignItems: 'center',

    justifyContent: 'center',
  },

  productEmoji: {
    fontSize: 20,
  },

  moreProducts: {
    width: 34,

    height: 34,

    borderRadius: 8,

    backgroundColor: '#F4F5F5',

    borderWidth: 1,

    borderColor: '#D9DEDC',

    alignItems: 'center',

    justifyContent: 'center',
  },

  moreProductsText: {
    fontSize: 12,

    fontWeight: '700',

    color: '#586063',
  },

  paymentActionRow: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'stretch',

    marginTop: 8,

    gap: 8,
  },

  paymentBox: {
    flex: 1,

    minWidth: 0,

    height: 42,

    borderRadius: 10,

    paddingHorizontal: 8,

    flexDirection: 'row',

    alignItems: 'center',
  },

  paymentIcon: {
    fontSize: 18,

    fontWeight: '800',

    marginRight: 6,
  },

  paymentTextBlock: {
    flex: 1,

    minWidth: 0,
  },

  paymentAmount: {
    fontSize: 12,

    fontWeight: '800',

    color: '#252B2D',
  },

  paymentMethod: {
    marginTop: 1,

    fontSize: 10,

    color: '#252B2D',
  },

  detailsButton: {
    width: 105,

    height: 42,

    borderRadius: 10,

    backgroundColor: '#06A94B',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 8,
  },

  detailsButtonText: {
    fontSize: 12,

    fontWeight: '700',

    color: '#FFFFFF',
  },

  /* Empty state */

  validationWarning: {
    backgroundColor: '#FFF4E5',
    borderColor: '#F2C078',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },

  validationWarningText: {
    color: '#8A4B08',
    fontSize: 12,
    lineHeight: 17,
  },

  emptyState: {
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderRadius: 17,

    paddingHorizontal: 28,

    paddingVertical: 48,

    borderWidth: 1,

    borderColor: '#E8ECEA',
  },

  emptyIcon: {
    fontSize: 28,

    color: '#0AA64B',

    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,

    fontWeight: '700',

    color: '#1B2022',
  },

  emptyText: {
    marginTop: 7,

    fontSize: 13,

    lineHeight: 19,

    color: '#747B7D',

    textAlign: 'center',
  },
});

export default DeliveriesScreen;
