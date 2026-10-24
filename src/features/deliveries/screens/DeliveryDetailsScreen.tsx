import React, {useEffect, useRef, useState} from 'react';

import {
  Alert,
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import {
  faArrowRight,
  faChevronLeft,
  faChevronRight,
  faCircle,
  faClipboardList,
  faCommentDots,
  faExclamation,
  faLeaf,
  faLocationArrow,
  faLocationDot,
  faMapLocationDot,
  faMoneyBillWave,
  faPhone,
  faRoute,
  faTriangleExclamation,
  faXmark,
  faCircleQuestion,
} from '@fortawesome/free-solid-svg-icons';

import { useNavigation } from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import {acceptDelivery, getDelivery, OrderRecord, rejectDelivery} from '../../../shared/services/api';

type DeliveryDetailsScreenProps = NativeStackScreenProps<
  MainStackParamList,
  'DeliveryDetails'
>;

type DeliveryDetailsNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'DeliveryDetails'
>;

type DeliveryStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED UP'
  | 'OUT FOR DELIVERY'
  | 'REJECTED';

type RejectionReason =
  | 'Vehicle issue'
  | 'Already at delivery limit'
  | 'Emergency'
  | 'Too far'
  | 'Other';

function DeliveryDetailsScreen({ route }: DeliveryDetailsScreenProps) {
  const navigation = useNavigation<DeliveryDetailsNavigationProp>();

  const { deliveryId } = route.params;

  const normalizedDeliveryId =
    typeof deliveryId === 'string' ? deliveryId.trim() : '';

  const isValidDeliveryId = /^#?(?:DM-[A-Z0-9-]{5,}|[a-f0-9]{24})$/i.test(normalizedDeliveryId);

  const [status, setStatus] = useState<DeliveryStatus>('ASSIGNED');
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getDelivery(normalizedDeliveryId.replace(/^#/, ''))
      .then(record => {
        if (!active) return;
        setOrder(record);
        setStatus(record.orderStatus === 'out_for_delivery' ? 'OUT FOR DELIVERY' : record.deliveryAssignmentStatus === 'accepted' ? 'ACCEPTED' : 'ASSIGNED');
      })
      .catch(error => {
        if (active) Alert.alert('Delivery unavailable', error instanceof Error ? error.message : 'Unable to load this order.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [normalizedDeliveryId]);

  const destination = order?.deliveryLocation || {};
  const customerName = destination.name || order?.customer?.fullName || 'Customer';
  const customerPhone = destination.phone || order?.customer?.mobileNumber || '';
  const deliveryAddress = [destination.locality, destination.formattedAddress, destination.cityName]
    .filter(Boolean)
    .join(', ') || 'Address unavailable';
  const paymentMethod = String(order?.paymentMethod || '').toLowerCase();
  const paymentLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'esewa' ? 'eSewa' : paymentMethod === 'khalti' ? 'Khalti' : 'Payment details unavailable';
  const deliveryEta = order?.estimatedDeliveryAt
    ? `${Math.max(0, Math.ceil((new Date(order.estimatedDeliveryAt).getTime() - Date.now()) / 60000))} min`
    : `${order?.estimatedDeliveryTimeMinutes || 29} min`;

  const [showRejectReasons, setShowRejectReasons] = useState(false);

  // Ref blocks duplicate taps immediately, before React updates state.
  const actionInProgressRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = () => {
    if (actionInProgressRef.current || isProcessing) return;

    if (!isValidDeliveryId) {
      Alert.alert(
        'Invalid delivery',
        'This delivery reference is invalid. Please return to your deliveries and try again.',
      );
      return;
    }

    if (status !== 'ASSIGNED') {
      Alert.alert(
        'Action unavailable',
        'Only an assigned delivery can be accepted.',
      );
      return;
    }

    actionInProgressRef.current = true;
    setIsProcessing(true);

    Alert.alert(
      'Accept delivery?',
      `Do you want to accept order ${normalizedDeliveryId}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            actionInProgressRef.current = false;
            setIsProcessing(false);
          },
        },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              const response = await acceptDelivery(normalizedDeliveryId.replace(/^#/, ''));
              if (response.order) {
                setOrder(current => current ? {
                  ...current,
                  orderStatus: response.order.orderStatus,
                  deliveryAssignmentStatus: response.order.deliveryAssignmentStatus,
                } : response.order);
              }
              setStatus('ACCEPTED');
              Alert.alert('Delivery Accepted', 'Proceed to the warehouse assigned to your partner account and scan the order for pickup.');
            } catch (error) {
              Alert.alert('Could not accept delivery', error instanceof Error ? error.message : 'Please refresh and retry.');
            } finally {
              actionInProgressRef.current = false;
              setIsProcessing(false);
            }
          },
        },
      ],
      {
        onDismiss: () => {
          actionInProgressRef.current = false;
          setIsProcessing(false);
        },
      },
    );
  };

  const handleReject = (reason: RejectionReason) => {
    const validReasons: readonly RejectionReason[] = [
      'Vehicle issue',
      'Already at delivery limit',
      'Emergency',
      'Too far',
      'Other',
    ];

    if (actionInProgressRef.current || isProcessing) return;

    if (!isValidDeliveryId || !validReasons.includes(reason)) {
      Alert.alert(
        'Unable to reject delivery',
        'Check the delivery reference and select a valid rejection reason.',
      );
      return;
    }

    if (status !== 'ASSIGNED') {
      Alert.alert(
        'Action unavailable',
        'Only an assigned delivery can be rejected.',
      );
      setShowRejectReasons(false);
      return;
    }

    actionInProgressRef.current = true;
    setIsProcessing(true);
    setShowRejectReasons(false);

    Alert.alert(
      'Reject delivery?',
      `Reject order ${normalizedDeliveryId}?\nReason: ${reason}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            actionInProgressRef.current = false;
            setIsProcessing(false);
          },
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectDelivery(normalizedDeliveryId.replace(/^#/, ''), reason);
              setStatus('REJECTED');
              Alert.alert('Delivery Rejected', 'The order has returned to its warehouse dispatch queue.', [
                {text: 'OK', onPress: () => navigation.goBack()},
              ]);
            } catch (error) {
              Alert.alert('Could not reject delivery', error instanceof Error ? error.message : 'Please retry.');
            } finally {
              actionInProgressRef.current = false;
              setIsProcessing(false);
            }
          },
        },
      ],
      {
        onDismiss: () => {
          actionInProgressRef.current = false;
          setIsProcessing(false);
        },
      },
    );
  };

  const handlePickupOrder = () => {
    if (!isValidDeliveryId) {
      Alert.alert(
        'Invalid delivery',

        'This delivery reference is invalid. Please return to your deliveries and try again.',
      );

      return;
    }

    if (status !== 'ACCEPTED') {
      Alert.alert(
        'Accept delivery first',

        'You must accept this delivery before proceeding to warehouse pickup.',
      );

      return;
    }

    navigation.navigate('WarehousePickup', {
      deliveryId: normalizedDeliveryId,
    });
  };

  const handleCallCustomer = () => {
    const phone = customerPhone.replace(/[^\d+]/g, '');
    if (!phone) {
      Alert.alert('Phone number unavailable', 'The order does not contain a customer contact number.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('Unable to call', 'This device cannot open the phone application.'),
    );
  };

  const handleMessageCustomer = () => {
    const phone = customerPhone.replace(/[^\d+]/g, '');
    if (!phone) {
      Alert.alert('Phone number unavailable', 'The order does not contain a customer contact number.');
      return;
    }
    Linking.openURL(`sms:${phone}`).catch(() =>
      Alert.alert('Unable to message', 'This device cannot open the messaging application.'),
    );
  };

  const handleOpenMap = () => {
    navigation.navigate('Navigation', {deliveryId: order?.orderNumber || normalizedDeliveryId});
  };

  const getStatusStyle = () => {
    switch (status) {
      case 'ACCEPTED':
        return {
          backgroundColor: '#DDF7E5',

          color: '#138943',
        };

      case 'PICKED UP':
        return {
          backgroundColor: '#E7F1FF',

          color: '#2472C8',
        };

      case 'OUT FOR DELIVERY':
        return {
          backgroundColor: '#E7F1FF',

          color: '#2472C8',
        };

      default:
        return {
          backgroundColor: '#DDF7E5',

          color: '#138943',
        };
    }
  };

  const statusStyle = getStatusStyle();

  if (!isValidDeliveryId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.invalidDeliveryContainer}>
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            size={34}
            color="#D97706"
          />

          <Text style={styles.invalidDeliveryTitle}>
            Invalid delivery reference
          </Text>

          <Text style={styles.invalidDeliveryMessage}>
            We could not verify this delivery. Return to My Deliveries and
            select a valid order.
          </Text>

          <Pressable
            style={styles.invalidDeliveryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.invalidDeliveryButtonText}>
              Back to Deliveries
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.invalidDeliveryContainer}>
          <ActivityIndicator size="large" color="#078A45" />
          <Text style={styles.invalidDeliveryMessage}>Loading this delivery from DailyMart…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.invalidDeliveryContainer}>
          <FontAwesomeIcon icon={faTriangleExclamation} size={34} color="#D97706" />
          <Text style={styles.invalidDeliveryTitle}>Delivery unavailable</Text>
          <Text style={styles.invalidDeliveryMessage}>This order could not be loaded. Go back and refresh your deliveries.</Text>
          <Pressable style={styles.invalidDeliveryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.invalidDeliveryButtonText}>Back to Deliveries</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faChevronLeft} size={18} color="#22282A" />
          </Pressable>

          <Text style={styles.headerTitle}>Delivery Details</Text>

          <Pressable
            style={styles.helpButton}
            onPress={() =>
              Alert.alert(
                'Help',

                'Help support will be connected later.',
              )
            }
          >
            <FontAwesomeIcon
              icon={faCircleQuestion}
              size={15}
              color="#078A45"
            />

            <Text style={styles.helpText}>Help</Text>
          </Pressable>
        </View>

        <View style={styles.orderHeaderCard}>
          <View style={styles.orderHeaderTop}>
            <View style={styles.orderHeaderLeft}>
              <View style={styles.orderIdBadge}>
                <Text style={styles.orderIdText}>{normalizedDeliveryId}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,

                  {
                    backgroundColor: statusStyle.backgroundColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,

                    {
                      color: statusStyle.color,
                    },
                  ]}
                >
                  {status === 'OUT FOR DELIVERY'
                    ? 'On the way'
                    : status === 'PICKED UP'
                    ? 'Picked Up'
                    : status === 'ACCEPTED'
                    ? 'Accepted'
                    : 'Assigned'}
                </Text>
              </View>
            </View>

            <View style={styles.orderPlacedBlock}>
              <Text style={styles.orderPlacedLabel}>Order placed</Text>

              <Text style={styles.orderPlacedValue}>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Order date unavailable'}</Text>
            </View>
          </View>

          <View style={styles.deliveryNumberRow}>
            <Pressable
              style={styles.deliveryArrowButton}
              onPress={() =>
                Alert.alert(
                  'Navigation unavailable',

                  'Previous delivery navigation will be connected later.',
                )
              }
            >
              <FontAwesomeIcon icon={faChevronLeft} size={12} color="#727A78" />
            </Pressable>

              <Text style={styles.deliveryNumberText}>Single order delivery</Text>

            <Pressable
              style={styles.deliveryArrowButton}
              onPress={() =>
                Alert.alert(
                  'Navigation unavailable',

                  'Next delivery navigation will be connected later.',
                )
              }
            >
              <FontAwesomeIcon
                icon={faChevronRight}
                size={12}
                color="#727A78"
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.customerCard}>
          <View style={styles.customerTopRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>{customerName.charAt(0).toUpperCase()}</Text>

              <View style={styles.avatarStatusDot} />
            </View>

            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customerName}</Text>

              <Text style={styles.customerPhone}>{customerPhone || 'Phone unavailable'}</Text>
            </View>

            <View style={styles.contactButtons}>
              <Pressable
                style={styles.contactButton}
                onPress={handleCallCustomer}
              >
                <FontAwesomeIcon
                  icon={faPhone}
                  size={11}
                  color="#078C46"
                  style={{ marginRight: 5 }}
                />

                <Text style={styles.contactButtonText}>Call</Text>
              </Pressable>

              <Pressable
                style={styles.contactButton}
                onPress={handleMessageCustomer}
              >
                <FontAwesomeIcon
                  icon={faCommentDots}
                  size={11}
                  color="#078C46"
                  style={{ marginRight: 5 }}
                />

                <Text style={styles.contactButtonText}>Message</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.addressRow}>
            <View style={styles.addressPin}>
              <FontAwesomeIcon icon={faLocationDot} size={17} color="#6B7375" />
            </View>

            <View style={styles.addressInfo}>
              <Text style={styles.addressMain}>{destination.locality || destination.cityName || deliveryAddress}</Text>

              <Text style={styles.addressSecondary}>
                {[destination.ward ? `Ward No. ${destination.ward}` : '', destination.formattedAddress, destination.address]
                  .filter(Boolean)
                  .join(' · ') || 'Delivery address details unavailable'}
              </Text>
            </View>

            <Pressable style={styles.openMapButton} onPress={handleOpenMap}>
              <FontAwesomeIcon
                icon={faMapLocationDot}
                size={15}
                color="#1487E8"
              />

              <Text style={styles.openMapText}>Open in Map</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routeLeft}>
            <View style={styles.routeIconCircle}>
              <FontAwesomeIcon icon={faRoute} size={20} color="#0A974A" />
            </View>

            <View style={styles.routeTextBlock}>
              <Text style={styles.routeDistance}>ETA {deliveryEta}</Text>

              <Text style={styles.routeSubtitle}>
                From your current location
              </Text>
            </View>
          </View>

          <Pressable style={styles.navigateButton} onPress={handleOpenMap}>
            <FontAwesomeIcon
              icon={faLocationArrow}
              size={16}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />

            <Text style={styles.navigateText}>Navigate</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order Items ({order.items?.length || 0})</Text>
          </View>

          <View style={styles.productsRow}>
            {(order.items || []).map((item, index) => (
              <View key={`${item.name || item.productName || 'item'}-${index}`} style={styles.productCard}>
                <View style={styles.productImage}>
                  <FontAwesomeIcon icon={faLeaf} size={28} color="#27A64A" />
                </View>
                <Text style={styles.productName}>{item.name || item.productName || 'Vegetable'}</Text>
                <Text style={styles.productQuantity}>{item.quantity || 0} {item.unit || ''}</Text>
              </View>
            ))}
            {!order.items?.length && <Text style={styles.instructionText}>No item details were returned for this order.</Text>}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIconCircle}>
                <FontAwesomeIcon
                  icon={faMoneyBillWave}
                  size={18}
                  color="#F39A00"
                />
              </View>

              <View>
                <Text style={styles.paymentLabel}>Payment Method</Text>

                <Text style={styles.paymentValue}>{paymentLabel}</Text>
              </View>
            </View>

            <View style={styles.paymentDivider} />

            <View style={styles.paymentRight}>
              <Text style={styles.paymentLabel}>Order Amount</Text>

                <Text style={styles.orderAmount}>NPR {Number(order.total || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <View style={styles.instructionsIconBox}>
              <FontAwesomeIcon
                icon={faClipboardList}
                size={15}
                color="#167FDC"
              />
            </View>

            <Text style={styles.instructionsTitle}>Delivery Instructions</Text>
          </View>

          <View style={styles.instructionRow}>
            <FontAwesomeIcon
              icon={faCircle}
              size={5}
              color="#46505A"
              style={{ marginRight: 7, marginTop: 6 }}
            />

            <Text style={styles.instructionText}>Call before arriving.</Text>
          </View>

          <View style={styles.instructionRow}>
            <FontAwesomeIcon
              icon={faCircle}
              size={5}
              color="#46505A"
              style={{ marginRight: 7, marginTop: 6 }}
            />

            <Text style={styles.instructionText}>
              Leave at gate if not reachable.
            </Text>
          </View>

          <View style={styles.instructionRow}>
            <FontAwesomeIcon
              icon={faCircle}
              size={5}
              color="#46505A"
              style={{ marginRight: 7, marginTop: 6 }}
            />

            <Text style={styles.instructionText}>
              Handle with care (fresh vegetables).
            </Text>
          </View>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Delivery Timeline</Text>

          <View style={styles.timeline}>
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorColumn}>
                <View style={styles.timelineDotActive}>
                  <View style={styles.timelineDotInner} />
                </View>

                <View style={styles.timelineLine} />
              </View>

              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Order Assigned</Text>

                <Text style={styles.timelineTime}>{order.deliveryAssignedAt ? new Date(order.deliveryAssignedAt).toLocaleString() : 'Assignment time unavailable'}</Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorColumn}>
                <View
                  style={
                    status === 'ACCEPTED' ||
                    status === 'PICKED UP' ||
                    status === 'OUT FOR DELIVERY'
                      ? styles.timelineDotActive
                      : styles.timelineDotPending
                  }
                />

                <View style={styles.timelineLine} />
              </View>

              <View style={styles.timelineContent}>
                <Text
                  style={
                    status === 'ACCEPTED' ||
                    status === 'PICKED UP' ||
                    status === 'OUT FOR DELIVERY'
                      ? styles.timelineTitle
                      : styles.timelineTitlePending
                  }
                >
                  Warehouse Pickup
                </Text>

                <Text style={styles.timelineStatus}>
                  {status === 'ACCEPTED'
                    ? 'Ready for pickup'
                    : status === 'PICKED UP' || status === 'OUT FOR DELIVERY'
                    ? 'Picked up'
                    : 'Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorColumn}>
                <View
                  style={
                    status === 'OUT FOR DELIVERY'
                      ? styles.timelineDotActive
                      : styles.timelineDotPending
                  }
                />

                <View style={styles.timelineLine} />
              </View>

              <View style={styles.timelineContent}>
                <Text
                  style={
                    status === 'OUT FOR DELIVERY'
                      ? styles.timelineTitle
                      : styles.timelineTitlePending
                  }
                >
                  Out for Delivery
                </Text>

                <Text style={styles.timelineStatus}>
                  {status === 'OUT FOR DELIVERY' ? 'In progress' : 'Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorColumn}>
                <View style={styles.timelineDotPending} />
              </View>

              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitlePending}>Delivered</Text>

                <Text style={styles.timelineStatus}>Pending</Text>
              </View>
            </View>
          </View>
        </View>

        {showRejectReasons ? (
          <View style={styles.rejectCard}>
            <View style={styles.rejectHeader}>
              <View>
                <Text style={styles.rejectTitle}>
                  Why are you rejecting this delivery?
                </Text>

                <Text style={styles.rejectSubtitle}>Select one reason</Text>
              </View>

              <Pressable
                style={styles.closeRejectButton}
                onPress={() => setShowRejectReasons(false)}
              >
                <FontAwesomeIcon icon={faXmark} size={15} color="#596164" />
              </Pressable>
            </View>

            {(
              [
                'Vehicle issue',

                'Already at delivery limit',

                'Emergency',

                'Too far',

                'Other',
              ] as RejectionReason[]
            ).map(reason => (
              <Pressable
                key={reason}
                style={styles.reasonButton}
                onPress={() => handleReject(reason)}
              >
                <Text style={styles.reasonText}>{reason}</Text>

                <FontAwesomeIcon
                  icon={faChevronRight}
                  size={14}
                  color="#098D47"
                />
              </Pressable>
            ))}

            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowRejectReasons(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}

        {status === 'REJECTED' ? (
          <View style={styles.rejectedNotice}>
            <Text style={styles.rejectedNoticeText}>
              You rejected this offer. The order was returned to warehouse dispatch.
            </Text>
          </View>
        ) : null}

        {status === 'ASSIGNED' && !showRejectReasons ? (
          <>
            <Pressable
              style={styles.startDeliveryButton}
              onPress={handleAccept}
            >
              <Text style={styles.startDeliveryText}>Accept Order</Text>

              <FontAwesomeIcon
                icon={faArrowRight}
                size={18}
                color="#FFFFFF"
                style={{ marginLeft: 10 }}
              />
            </Pressable>

            <Pressable
              style={styles.reportIssueButton}
              onPress={() => setShowRejectReasons(true)}
            >
              <View style={styles.reportIconCircle}>
                <FontAwesomeIcon
                  icon={faExclamation}
                  size={12}
                  color="#078A46"
                />
              </View>

              <Text style={styles.reportIssueText}>Reject Delivery</Text>
            </Pressable>
          </>
        ) : null}

        {status === 'ACCEPTED' ? (
          <>
            <Pressable
              style={styles.startDeliveryButton}
              onPress={handlePickupOrder}
            >
              <Text style={styles.startDeliveryText}>
                Go to Warehouse / Pickup Order
              </Text>

              <FontAwesomeIcon
                icon={faArrowRight}
                size={18}
                color="#FFFFFF"
                style={{ marginLeft: 10 }}
              />
            </Pressable>

            <Pressable
              style={styles.reportIssueButton}
              onPress={() =>
                Alert.alert(
                  'Report an Issue',

                  'Delivery issue reporting will be connected next.',
                )
              }
            >
              <View style={styles.reportIconCircle}>
                <FontAwesomeIcon
                  icon={faExclamation}
                  size={12}
                  color="#078A46"
                />
              </View>

              <Text style={styles.reportIssueText}>Report an Issue</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: '#F7FAF8',
  },

  content: {
    paddingHorizontal: 16,

    paddingTop: 8,

    paddingBottom: 32,
  },

  header: {
    height: 51,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 7,
  },

  backButton: {
    width: 38,

    height: 38,

    alignItems: 'center',

    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,

    textAlign: 'center',

    fontSize: 20,

    fontWeight: '800',

    color: '#131819',
  },

  helpButton: {
    width: 54,

    height: 38,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  helpText: {
    fontSize: 13,

    fontWeight: '700',

    color: '#078A45',
  },

  orderHeaderCard: {
    backgroundColor: '#EAF8EE',

    borderRadius: 14,

    paddingHorizontal: 12,

    paddingVertical: 10,

    marginBottom: 10,
  },

  orderHeaderTop: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',
  },

  orderHeaderLeft: {
    flexDirection: 'row',

    alignItems: 'center',

    flexShrink: 1,
  },

  orderIdBadge: {
    height: 35,

    borderRadius: 8,

    backgroundColor: '#079347',

    paddingHorizontal: 11,

    alignItems: 'center',

    justifyContent: 'center',
  },

  orderIdText: {
    color: '#FFFFFF',

    fontSize: 16,

    fontWeight: '800',
  },

  statusBadge: {
    height: 31,

    borderRadius: 8,

    paddingHorizontal: 10,

    marginLeft: 8,

    alignItems: 'center',

    justifyContent: 'center',
  },

  statusBadgeText: {
    fontSize: 10,

    fontWeight: '700',
  },

  orderPlacedBlock: {
    alignItems: 'flex-end',

    marginLeft: 8,
  },

  orderPlacedLabel: {
    fontSize: 10,

    color: '#727B78',
  },

  orderPlacedValue: {
    marginTop: 2,

    fontSize: 10,

    color: '#6E7774',
  },

  deliveryNumberRow: {
    marginTop: 8,

    flexDirection: 'row',

    alignItems: 'center',
  },

  deliveryArrowButton: {
    width: 26,

    height: 26,

    alignItems: 'center',

    justifyContent: 'center',
  },

  deliveryNumberText: {
    flex: 1,

    fontSize: 11.5,

    color: '#5F6966',

    textAlign: 'center',
  },

  customerCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 15,

    borderWidth: 1,

    borderColor: '#E4EAE6',

    padding: 12,

    marginBottom: 10,
  },

  customerTopRow: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  customerAvatar: {
    width: 49,

    height: 49,

    borderRadius: 25,

    backgroundColor: '#F1E6D8',

    alignItems: 'center',

    justifyContent: 'center',

    position: 'relative',

    marginRight: 9,
  },

  customerAvatarText: {
    fontSize: 19,

    fontWeight: '800',

    color: '#5E4A39',
  },

  avatarStatusDot: {
    position: 'absolute',

    right: 0,

    bottom: 0,

    width: 12,

    height: 12,

    borderRadius: 6,

    backgroundColor: '#1BB251',

    borderWidth: 2,

    borderColor: '#FFFFFF',
  },

  customerInfo: {
    flex: 1,

    minWidth: 0,
  },

  customerName: {
    fontSize: 17,

    fontWeight: '800',

    color: '#1F2729',
  },

  customerPhone: {
    marginTop: 3,

    fontSize: 12,

    color: '#777F82',
  },

  contactButtons: {
    flexDirection: 'row',

    gap: 6,
  },

  contactButton: {
    height: 36,

    minWidth: 67,

    paddingHorizontal: 8,

    borderRadius: 9,

    borderWidth: 1.2,

    borderColor: '#05924A',

    backgroundColor: '#FFFFFF',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  contactButtonText: {
    fontSize: 11,

    fontWeight: '700',

    color: '#078C46',
  },

  addressRow: {
    marginTop: 12,

    flexDirection: 'row',

    alignItems: 'center',
  },

  addressPin: {
    width: 27,

    height: 27,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 7,
  },

  addressInfo: {
    flex: 1,

    minWidth: 0,
  },

  addressMain: {
    fontSize: 12.5,

    fontWeight: '600',

    color: '#465053',
  },

  addressSecondary: {
    marginTop: 3,

    fontSize: 10.5,

    color: '#7E8588',
  },

  openMapButton: {
    marginLeft: 7,

    alignItems: 'center',

    justifyContent: 'center',
  },

  openMapText: {
    fontSize: 10,

    color: '#1487E8',

    fontWeight: '700',
  },

  routeCard: {
    backgroundColor: '#E5F8E9',

    borderRadius: 14,

    padding: 10,

    marginBottom: 10,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  routeLeft: {
    flex: 1,

    minWidth: 0,

    flexDirection: 'row',

    alignItems: 'center',
  },

  routeIconCircle: {
    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 9,
  },

  routeTextBlock: {
    flex: 1,

    minWidth: 0,
  },

  routeDistance: {
    fontSize: 15,

    fontWeight: '800',

    color: '#202929',
  },

  routeSubtitle: {
    marginTop: 2,

    fontSize: 10.5,

    color: '#66716C',
  },

  navigateButton: {
    width: 110,

    height: 42,

    borderRadius: 10,

    backgroundColor: '#059A49',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    marginLeft: 7,
  },

  navigateText: {
    fontSize: 13,

    fontWeight: '800',

    color: '#FFFFFF',
  },

  card: {
    backgroundColor: '#FFFFFF',

    borderRadius: 15,

    borderWidth: 1,

    borderColor: '#E4EAE6',

    padding: 12,

    marginBottom: 10,
  },

  sectionHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 9,
  },

  sectionTitle: {
    fontSize: 16,

    fontWeight: '800',

    color: '#1E2527',
  },

  viewAllText: {
    fontSize: 12,

    fontWeight: '700',

    color: '#078F46',
  },

  productsRow: {
    flexDirection: 'row',

    alignItems: 'stretch',

    gap: 5,
  },

  productCard: {
    flex: 1,

    minWidth: 0,

    alignItems: 'center',
  },

  productImage: {
    width: '100%',

    height: 63,

    borderRadius: 10,

    borderWidth: 1,

    borderColor: '#E6EAE8',

    backgroundColor: '#FCFCFC',

    alignItems: 'center',

    justifyContent: 'center',
  },

  productName: {
    marginTop: 5,

    fontSize: 10,

    fontWeight: '700',

    color: '#343C3F',
  },

  productQuantity: {
    marginTop: 2,

    fontSize: 9,

    color: '#777F82',
  },

  moreProductCard: {
    width: 57,

    height: 63,

    borderRadius: 10,

    backgroundColor: '#E6F8EA',

    alignItems: 'center',

    justifyContent: 'center',
  },

  moreProductNumber: {
    fontSize: 16,

    fontWeight: '800',

    color: '#078F46',
  },

  moreProductText: {
    marginTop: 1,

    fontSize: 9,

    color: '#138B4A',

    fontWeight: '600',
  },

  paymentRow: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  paymentLeft: {
    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    minWidth: 0,
  },

  paymentIconCircle: {
    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: '#FFF3DB',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 9,
  },

  paymentLabel: {
    fontSize: 10,

    color: '#777F82',
  },

  paymentValue: {
    marginTop: 2,

    fontSize: 14,

    fontWeight: '800',

    color: '#202729',
  },

  paymentDivider: {
    width: 1,

    height: 41,

    backgroundColor: '#E7EBE8',

    marginHorizontal: 12,
  },

  paymentRight: {
    minWidth: 104,
  },

  orderAmount: {
    marginTop: 2,

    fontSize: 15,

    fontWeight: '800',

    color: '#078D47',
  },

  instructionsCard: {
    backgroundColor: '#E8F4FF',

    borderRadius: 14,

    padding: 12,

    marginBottom: 10,
  },

  instructionsHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 7,
  },

  instructionsIconBox: {
    width: 29,

    height: 29,

    borderRadius: 8,

    backgroundColor: '#D7EBFF',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 8,
  },

  instructionsTitle: {
    fontSize: 14,

    fontWeight: '800',

    color: '#1C2C3E',
  },

  instructionRow: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    paddingLeft: 3,

    marginTop: 4,
  },

  instructionText: {
    flex: 1,

    fontSize: 12,

    lineHeight: 17,

    color: '#46535D',
  },

  timelineCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 15,

    borderWidth: 1,

    borderColor: '#E4EAE6',

    padding: 12,

    marginBottom: 12,
  },

  timeline: {
    marginTop: 9,
  },

  timelineRow: {
    minHeight: 43,

    flexDirection: 'row',
  },

  timelineIndicatorColumn: {
    width: 24,

    alignItems: 'center',
  },

  timelineDotActive: {
    width: 17,

    height: 17,

    borderRadius: 9,

    backgroundColor: '#0CA44D',

    alignItems: 'center',

    justifyContent: 'center',
  },

  timelineDotInner: {
    width: 7,

    height: 7,

    borderRadius: 4,

    backgroundColor: '#FFFFFF',
  },

  timelineDotPending: {
    width: 15,

    height: 15,

    borderRadius: 8,

    backgroundColor: '#C9CED0',
  },

  timelineLine: {
    flex: 1,

    width: 2,

    backgroundColor: '#D9DEDF',

    marginTop: 2,
  },

  timelineContent: {
    flex: 1,

    marginLeft: 8,

    paddingBottom: 8,

    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent: 'space-between',
  },

  timelineTitle: {
    fontSize: 12.5,

    fontWeight: '700',

    color: '#242B2D',
  },

  timelineTitlePending: {
    fontSize: 12.5,

    fontWeight: '500',

    color: '#555E61',
  },

  timelineTime: {
    fontSize: 10.5,

    color: '#757E81',
  },

  timelineStatus: {
    fontSize: 10.5,

    color: '#8A9295',
  },

  rejectCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 15,

    borderWidth: 1,

    borderColor: '#E3E7E4',

    padding: 12,

    marginBottom: 10,
  },

  rejectHeader: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'flex-start',

    marginBottom: 9,
  },

  rejectTitle: {
    fontSize: 14,

    fontWeight: '800',

    color: '#24292B',
  },

  rejectSubtitle: {
    marginTop: 3,

    fontSize: 11,

    color: '#7B8285',
  },

  closeRejectButton: {
    width: 30,

    height: 30,

    borderRadius: 15,

    backgroundColor: '#F3F5F4',

    alignItems: 'center',

    justifyContent: 'center',
  },

  reasonButton: {
    minHeight: 46,

    borderRadius: 10,

    borderWidth: 1,

    borderColor: '#E0E6E2',

    paddingHorizontal: 12,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 7,
  },

  reasonText: {
    fontSize: 12,

    fontWeight: '600',

    color: '#394144',
  },

  cancelButton: {
    height: 40,

    alignItems: 'center',

    justifyContent: 'center',
  },

  cancelButtonText: {
    fontSize: 12,

    fontWeight: '700',

    color: '#727A7D',
  },

  startDeliveryButton: {
    minHeight: 52,

    paddingHorizontal: 12,

    borderRadius: 11,

    backgroundColor: '#039A48',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  startDeliveryText: {
    fontSize: 15,

    fontWeight: '800',

    color: '#FFFFFF',

    flexShrink: 1,

    textAlign: 'center',
  },

  reportIssueButton: {
    height: 50,

    borderRadius: 11,

    borderWidth: 1.4,

    borderColor: '#078A46',

    backgroundColor: '#FFFFFF',

    marginTop: 9,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  reportIconCircle: {
    width: 22,

    height: 22,

    borderRadius: 11,

    backgroundColor: '#E4F6EA',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 7,
  },

  reportIssueText: {
    fontSize: 14,

    fontWeight: '800',

    color: '#078A46',
  },

  disabledAction: {
    opacity: 0.55,
  },
  rejectedNotice: {
    backgroundColor: '#FDE8E7',
    borderColor: '#F4B4B0',
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  rejectedNoticeText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  invalidDeliveryContainer: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 28,

    backgroundColor: '#F7FAF8',
  },

  invalidDeliveryTitle: {
    marginTop: 16,

    fontSize: 19,

    fontWeight: '800',

    color: '#1F2729',

    textAlign: 'center',
  },

  invalidDeliveryMessage: {
    marginTop: 8,

    fontSize: 13,

    lineHeight: 20,

    color: '#68716E',

    textAlign: 'center',
  },

  invalidDeliveryButton: {
    marginTop: 20,

    minHeight: 46,

    paddingHorizontal: 20,

    borderRadius: 10,

    backgroundColor: '#039A48',

    alignItems: 'center',

    justifyContent: 'center',
  },

  invalidDeliveryButtonText: {
    color: '#FFFFFF',

    fontSize: 13,

    fontWeight: '800',
  },
});

export default DeliveryDetailsScreen;
