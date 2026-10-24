import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import {
  faLocationCrosshairs,
  faLocationDot,
  faRoute,
  faCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import Mapbox from '@rnmapbox/maps';

import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

import {getDelivery, OrderRecord} from '../../../shared/services/api';

type ActiveDeliveryScreenProps = NativeStackScreenProps<
  MainStackParamList,
  'ActiveDelivery'
>;

type ActiveDeliveryNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'ActiveDelivery'
>;

type ContactIssueType =
  | 'CUSTOMER_UNREACHABLE'
  | 'WRONG_ADDRESS'
  | 'CUSTOMER_REQUESTED_NEW_LOCATION';

const CONTACT_ISSUE_LABELS: Record<ContactIssueType, string> = {
  CUSTOMER_UNREACHABLE: 'Customer unreachable',

  WRONG_ADDRESS: 'Wrong address',

  CUSTOMER_REQUESTED_NEW_LOCATION: 'Customer requested new location',
};

function ActiveDeliveryScreen({
  route,

  navigation,
}: ActiveDeliveryScreenProps) {
  const typedNavigation = navigation as ActiveDeliveryNavigationProp;

  const deliveryId = String(route.params?.deliveryId ?? '').trim();

  const hasValidDeliveryId = deliveryId.length > 0;
  const [deliveryOrder, setDeliveryOrder] = useState<OrderRecord | null>(null);
  const [isOrderLoading, setIsOrderLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsOrderLoading(true);
    getDelivery(deliveryId.replace(/^#/, ''))
      .then(order => {
        if (active) setDeliveryOrder(order);
      })
      .catch(error => {
        if (active) {
          Alert.alert(
            'Delivery unavailable',
            error instanceof Error ? error.message : 'Unable to load this order.',
          );
        }
      })
      .finally(() => {
        if (active) setIsOrderLoading(false);
      });
    return () => {
      active = false;
    };
  }, [deliveryId]);

  const customerName = deliveryOrder?.deliveryLocation?.name || deliveryOrder?.customer?.fullName || 'Customer';
  const customerPhone = deliveryOrder?.deliveryLocation?.phone || deliveryOrder?.customer?.mobileNumber || '';
  const orderTotal = Number(deliveryOrder?.total || 0);
  const isCodOrder = String(deliveryOrder?.paymentMethod || '').toLowerCase() === 'cod';
  const customerLatitude = deliveryOrder?.deliveryLocation?.latitude;
  const customerLongitude = deliveryOrder?.deliveryLocation?.longitude;
  const customerCoordinate =
    typeof customerLatitude === 'number' &&
    Number.isFinite(customerLatitude) &&
    typeof customerLongitude === 'number' &&
    Number.isFinite(customerLongitude)
      ? [customerLongitude, customerLatitude] as [number, number]
      : null;

  const cameraRef = useRef<React.ComponentRef<typeof Mapbox.Camera> | null>(
    null,
  );

  const navigationActionRef = useRef(false);
  const deliveryStarted =
    hasValidDeliveryId && deliveryOrder?.orderStatus === 'out_for_delivery';

  useEffect(() => {
    navigationActionRef.current = false;
  }, [deliveryId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      navigationActionRef.current = false;
    });

    return unsubscribe;
  }, [navigation]);

  const [showInstructions, setShowInstructions] = useState(true);

  const [contactIssue, setContactIssue] = useState<ContactIssueType | null>(
    null,
  );

  const [isContactIssueModalVisible, setIsContactIssueModalVisible] =
    useState(false);

  const [mapReady, setMapReady] = useState(false);

  const [routeError, setRouteError] = useState<string | null>(null);

  const handleStartDelivery = () => {
    if (deliveryStarted) {
      return;
    }

    if (!hasValidDeliveryId) {
      Alert.alert(
        'Delivery unavailable',
        'A valid delivery ID is required before starting this delivery.',
      );
      return;
    }
    if (deliveryOrder?.deliveryAssignmentStatus !== 'accepted') {
      typedNavigation.navigate('DeliveryDetails', {deliveryId});
      return;
    }
    typedNavigation.navigate('WarehousePickup', {deliveryId});
  };

  const handleNavigation = () => {
    if (navigationActionRef.current) {
      return;
    }

    if (!hasValidDeliveryId) {
      Alert.alert(
        'Delivery unavailable',
        'A valid delivery ID is required to open navigation.',
      );
      return;
    }

    navigationActionRef.current = true;
    typedNavigation.navigate('Navigation', {
      deliveryId,
    });
  };

  const handleCallCustomer = async () => {
    const phoneNumber = customerPhone.replace(/[^\d+]/g, '');
    if (!phoneNumber) {
      Alert.alert(
        'Customer Phone Unavailable',

        'The customer phone number will be available after the delivery data is loaded from the backend.',
      );

      return;
    }

    try {
      const phoneUrl = `tel:${phoneNumber}`;

      const canOpen = await Linking.canOpenURL(phoneUrl);

      if (!canOpen) {
        Alert.alert(
          'Unable to Call',

          'Your device cannot make a phone call.',
        );

        return;
      }

      await Linking.openURL(phoneUrl);
    } catch {
      Alert.alert(
        'Call Error',

        'We could not open the phone application.',
      );
    }
  };

  const handleMessageCustomer = async () => {
    const phoneNumber = customerPhone.replace(/[^\d+]/g, '');
    if (!phoneNumber) {
      Alert.alert(
        'Customer Phone Unavailable',

        'The customer phone number will be available after the delivery data is loaded from the backend.',
      );

      return;
    }

    try {
      const smsUrl = `sms:${phoneNumber}`;

      const canOpen = await Linking.canOpenURL(smsUrl);

      if (!canOpen) {
        Alert.alert(
          'Unable to Message',

          'Your device cannot open the messaging application.',
        );

        return;
      }

      await Linking.openURL(smsUrl);
    } catch {
      Alert.alert(
        'Message Error',

        'We could not open the messaging application.',
      );
    }
  };

  const handleOpenContactIssueModal = () => {
    setIsContactIssueModalVisible(true);
  };

  const handleCloseContactIssueModal = () => {
    setIsContactIssueModalVisible(false);
  };

  const handleSelectContactIssue = (issue: ContactIssueType) => {
    setContactIssue(issue);

    setIsContactIssueModalVisible(false);
  };

  const handleClearContactIssue = () => {
    setContactIssue(null);
  };

  const handleProceedToVerification = () => {
    if (navigationActionRef.current) {
      return;
    }

    if (!deliveryStarted || !hasValidDeliveryId) {
      Alert.alert(
        'Verification unavailable',
        'Start a valid delivery before proceeding to verification.',
      );
      return;
    }

    navigationActionRef.current = true;
    typedNavigation.navigate('DeliveryVerification', {
      deliveryId,
    });
  };

  const handleReportDeliveryIssue = () => {
    if (navigationActionRef.current) {
      return;
    }

    if (!deliveryStarted || !hasValidDeliveryId) {
      Alert.alert(
        'Delivery not started',
        'Start a valid delivery before reporting a delivery failure.',
      );
      return;
    }

    navigationActionRef.current = true;
    typedNavigation.navigate('FailedDelivery', {
      deliveryId,
    });
  };

  useEffect(() => {
    setRouteError(
      customerCoordinate
        ? 'Open live navigation to calculate a route from your current GPS location.'
        : 'This order has no saved map coordinates. Use the delivery address and contact warehouse support if needed.',
    );
  }, [customerLatitude, customerLongitude]);

  const fitMapToDelivery = useCallback(() => {
    if (typeof customerLatitude !== 'number' || typeof customerLongitude !== 'number') return;
    cameraRef.current?.setCamera({
      centerCoordinate: [customerLongitude, customerLatitude],
      zoomLevel: 14,
      animationDuration: 700,
    });
  }, [customerLatitude, customerLongitude]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }

    const timer = setTimeout(() => {
      fitMapToDelivery();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [mapReady, fitMapToDelivery]);

  const displayedDistance = '—';
  const displayedEta = deliveryOrder?.estimatedDeliveryAt
    ? `${Math.max(0, Math.ceil((new Date(deliveryOrder.estimatedDeliveryAt).getTime() - Date.now()) / 60000))} min`
    : `${deliveryOrder?.estimatedDeliveryTimeMinutes || 29} min`;

  if (isOrderLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24}}>
          <ActivityIndicator size="large" color="#078D46" />
          <Text style={{marginTop: 12, color: '#596164'}}>Loading delivery…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!deliveryOrder) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24}}>
          <Text style={{fontSize: 18, fontWeight: '700', color: '#22282A'}}>Delivery unavailable</Text>
          <Text style={{marginTop: 8, color: '#596164', textAlign: 'center'}}>Refresh your deliveries and reopen this order.</Text>
          <Pressable style={{marginTop: 18, padding: 12}} onPress={() => navigation.goBack()}>
            <Text style={{color: '#078D46', fontWeight: '700'}}>Go Back</Text>
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
          <View>
            <Text style={styles.pageLabel}>Active Delivery</Text>

            <Text style={styles.orderId}>{deliveryId}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,

              deliveryStarted
                ? styles.statusBadgeActive
                : styles.statusBadgeReady,
            ]}
          >
            <Text style={styles.statusText}>
              {deliveryStarted
                ? 'OUT FOR DELIVERY'
                : deliveryOrder.deliveryAssignmentStatus === 'accepted'
                  ? 'PICKUP REQUIRED'
                  : 'ASSIGNED'}
            </Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          <Mapbox.MapView
            style={styles.map}
            styleURL={Mapbox.StyleURL.Street}
            projection="mercator"
            onDidFinishLoadingMap={() => setMapReady(true)}
          >
            <Mapbox.Camera
              ref={cameraRef}
              defaultSettings={{
                ...(customerCoordinate ? {centerCoordinate: customerCoordinate} : {}),
                zoomLevel: customerCoordinate ? 13.5 : 2,
              }}
            />

            {customerCoordinate && (
              <Mapbox.PointAnnotation id="active-delivery-customer" coordinate={customerCoordinate} title="Customer Location">
                <View style={styles.customerMarker}>
                  <FontAwesomeIcon icon={faLocationDot} size={14} color="#167DE4" />
                </View>
              </Mapbox.PointAnnotation>
            )}
          </Mapbox.MapView>

          <Pressable style={styles.recenterButton} onPress={fitMapToDelivery}>
            <FontAwesomeIcon
              icon={faLocationCrosshairs}
              size={19}
              color="#167DE4"
            />
          </Pressable>

          {routeError !== null && (
            <View style={styles.mapErrorBadge}>
              <Text style={styles.mapErrorText}>{routeError}</Text>

              <Pressable onPress={handleNavigation}>
                <Text style={styles.mapRetryText}>Open Navigation</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.mapSummary}>
            <View style={styles.mapSummaryLeft}>
              <View style={styles.mapLocationIcon}>
                <FontAwesomeIcon
                  icon={faLocationDot}
                  size={14}
                  color="#167DE4"
                />
              </View>

              <View>
                <Text style={styles.mapDistance}>
                  {displayedDistance} • {displayedEta}
                </Text>

                <Text style={styles.mapDistanceSubtitle}>
                  Customer destination from this order
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.mapNavigateButton}
              onPress={handleNavigation}
            >
              <FontAwesomeIcon icon={faRoute} size={14} color="#FFFFFF" />

              <Text style={styles.mapNavigateText}>Navigate</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>

          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>{customerName.charAt(0).toUpperCase()}</Text>

              <View style={styles.avatarStatusDot} />
            </View>

            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customerName}</Text>

              <Text style={styles.customerPhone}>{customerPhone || 'Phone unavailable'}</Text>
            </View>
          </View>

          <View style={styles.contactActions}>
            <Pressable
              style={styles.primaryContactButton}
              onPress={handleCallCustomer}
            >
              <Text style={styles.primaryContactButtonText}>Call Customer</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryContactButton}
              onPress={handleMessageCustomer}
            >
              <Text style={styles.secondaryContactButtonText}>Message</Text>
            </Pressable>
          </View>

          <View style={styles.contactIssueSection}>
            <View style={styles.contactIssueHeader}>
              <View style={styles.contactIssueInfo}>
                <Text style={styles.contactIssueTitle}>
                  Customer Contact Issue
                </Text>

                <Text style={styles.contactIssueDescription}>
                  Record a problem only when customer communication cannot
                  proceed normally.
                </Text>
              </View>

              <Pressable
                style={styles.contactIssueButton}
                onPress={handleOpenContactIssueModal}
              >
                <Text style={styles.contactIssueButtonText}>Record</Text>
              </Pressable>
            </View>

            {contactIssue !== null && (
              <View style={styles.contactIssueSelected}>
                <View style={styles.contactIssueSelectedIcon}>
                  <Text style={styles.contactIssueSelectedIconText}>!</Text>
                </View>

                <View style={styles.contactIssueSelectedInfo}>
                  <Text style={styles.contactIssueSelectedLabel}>
                    Current issue
                  </Text>

                  <Text style={styles.contactIssueSelectedValue}>
                    {CONTACT_ISSUE_LABELS[contactIssue]}
                  </Text>
                </View>

                <Pressable
                  style={styles.clearIssueButton}
                  onPress={handleClearContactIssue}
                >
                  <Text style={styles.clearIssueButtonText}>Clear</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Location</Text>

          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>●</Text>
            </View>

            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>{deliveryOrder.deliveryLocation?.locality || deliveryOrder.deliveryLocation?.cityName || 'Customer location'}</Text>

              <Text style={styles.locationAddress}>
                {[deliveryOrder.deliveryLocation?.formattedAddress, deliveryOrder.deliveryLocation?.cityName]
                  .filter(Boolean).join(', ') || 'Address unavailable'}
              </Text>

              <Text style={styles.locationWard}>
                {deliveryOrder.deliveryLocation?.ward ? `Ward No. ${deliveryOrder.deliveryLocation.ward}` : 'Ward unavailable'}
              </Text>
            </View>
          </View>

          <View style={styles.locationMetrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Distance</Text>

              <Text style={styles.metricValue}>{displayedDistance}</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Estimated arrival</Text>

              <Text style={styles.metricValue}>{displayedEta}</Text>
            </View>
          </View>

          <Pressable style={styles.navigationButton} onPress={handleNavigation}>
            <Text style={styles.navigationButtonText}>Open Navigation</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID</Text>

            <Text style={styles.infoValue}>{deliveryId}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Items</Text>

            <Text style={styles.infoValue}>{deliveryOrder.items?.length || 0} items</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment</Text>

            <Text style={styles.infoValue}>{isCodOrder ? 'Cash on Delivery' : String(deliveryOrder.paymentMethod || 'Online').toUpperCase()}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Amount to collect</Text>

            <Text style={styles.totalAmount}>{isCodOrder ? `NPR ${orderTotal.toLocaleString('en-IN')}` : 'Already paid online'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.instructionsHeader}>
            <Text style={styles.cardTitle}>Delivery Instructions</Text>

            <Pressable
              style={styles.instructionsToggle}
              onPress={() => setShowInstructions(current => !current)}
            >
              <Text style={styles.instructionsToggleText}>
                {showInstructions ? 'Hide' : 'View'}
              </Text>
            </Pressable>
          </View>

          {showInstructions && (
            <View style={styles.instructionsBox}>
              <Text style={styles.instructions}>
                Follow the saved order address. Call the customer before arriving if you need help finding the delivery point.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusIndicatorDot,

                deliveryStarted && styles.statusIndicatorDotActive,
              ]}
            />
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusCardTitle}>
              {deliveryStarted
                ? 'Delivery in progress'
                : 'Ready to start delivery'}
            </Text>

            <Text style={styles.statusCardText}>
              {deliveryStarted
                ? 'Navigate to the customer location and complete the delivery verification.'
                : 'Start delivery when you leave the warehouse with the package.'}
            </Text>
          </View>
        </View>

        {deliveryStarted && (
          <View style={styles.verificationCard}>
            <View style={styles.verificationHeader}>
              <View style={styles.verificationIcon}>
                <FontAwesomeIcon icon={faCheck} size={14} color="#078D46" />
              </View>

              <View style={styles.verificationContent}>
                <Text style={styles.verificationTitle}>
                  Ready for Delivery Verification
                </Text>

                <Text style={styles.verificationDescription}>
                  Continue to package QR/barcode scanning and customer OTP
                  verification after arriving.
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.verificationButton}
              onPress={handleProceedToVerification}
            >
              <Text style={styles.verificationButtonText}>
                CONTINUE TO VERIFICATION
              </Text>
            </Pressable>
          </View>
        )}

        {deliveryStarted && (
          <View style={styles.deliveryIssueCard}>
            <View style={styles.deliveryIssueHeader}>
              <View style={styles.deliveryIssueIcon}>
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  size={14}
                  color="#9A6700"
                />
              </View>

              <View style={styles.deliveryIssueContent}>
                <Text style={styles.deliveryIssueTitle}>
                  Unable to complete delivery?
                </Text>

                <Text style={styles.deliveryIssueDescription}>
                  Report a genuine delivery problem using the controlled failure
                  flow.
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.deliveryIssueButton}
              onPress={handleReportDeliveryIssue}
            >
              <Text style={styles.deliveryIssueButtonText}>
                REPORT DELIVERY ISSUE
              </Text>
            </Pressable>
          </View>
        )}

        {!deliveryStarted ? (
          <Pressable
            style={styles.startButton}
            onPress={handleStartDelivery}
            disabled={deliveryStarted}
            accessibilityRole="button"
            accessibilityState={{ disabled: deliveryStarted }}
          >
            <Text style={styles.startButtonText}>
              {deliveryOrder.deliveryAssignmentStatus === 'accepted'
                ? 'CONTINUE TO WAREHOUSE PICKUP'
                : 'VIEW DELIVERY DETAILS'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.startedBanner}>
            <View style={styles.startedIcon}>
              <FontAwesomeIcon icon={faCheck} size={14} color="#FFFFFF" />
            </View>

            <View style={styles.startedContent}>
              <Text style={styles.startedTitle}>Delivery Started</Text>

              <Text style={styles.startedText}>
                You are now out for delivery.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isContactIssueModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseContactIssueModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.issueModal}>
            <View style={styles.issueModalHeader}>
              <View style={styles.issueModalHeaderContent}>
                <Text style={styles.issueModalTitle}>
                  Customer Contact Issue
                </Text>

                <Text style={styles.issueModalSubtitle}>
                  Select a reason only when it actually applies.
                </Text>
              </View>

              <Pressable
                style={styles.modalCloseButton}
                onPress={handleCloseContactIssueModal}
              >
                <Text style={styles.modalCloseButtonText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.issueOptions}>
              <Pressable
                style={styles.issueOption}
                onPress={() => handleSelectContactIssue('CUSTOMER_UNREACHABLE')}
              >
                <View style={styles.issueOptionIcon}>
                  <Text style={styles.issueOptionIconText}>!</Text>
                </View>

                <View style={styles.issueOptionContent}>
                  <Text style={styles.issueOptionTitle}>
                    Customer unreachable
                  </Text>

                  <Text style={styles.issueOptionDescription}>
                    Customer cannot be reached by phone or at the delivery
                    location.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.issueOption}
                onPress={() => handleSelectContactIssue('WRONG_ADDRESS')}
              >
                <View style={styles.issueOptionIcon}>
                  <Text style={styles.issueOptionIconText}>!</Text>
                </View>

                <View style={styles.issueOptionContent}>
                  <Text style={styles.issueOptionTitle}>Wrong address</Text>

                  <Text style={styles.issueOptionDescription}>
                    The provided delivery address does not match the customer's
                    location.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.issueOption}
                onPress={() =>
                  handleSelectContactIssue('CUSTOMER_REQUESTED_NEW_LOCATION')
                }
              >
                <View style={styles.issueOptionIcon}>
                  <Text style={styles.issueOptionIconText}>↗</Text>
                </View>

                <View style={styles.issueOptionContent}>
                  <Text style={styles.issueOptionTitle}>
                    Customer requested new location
                  </Text>

                  <Text style={styles.issueOptionDescription}>
                    Customer asks for delivery at a different location.
                  </Text>
                </View>
              </Pressable>
            </View>

            <Pressable
              style={styles.modalCancelButton}
              onPress={handleCloseContactIssueModal}
            >
              <Text style={styles.modalCancelButtonText}>CLOSE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: '#F7FAF7',
  },

  content: {
    paddingHorizontal: 16,

    paddingTop: 8,

    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent: 'space-between',

    marginBottom: 12,
  },

  pageLabel: {
    fontSize: 12,

    color: '#6B7280',

    marginBottom: 3,
  },

  orderId: {
    fontSize: 24,

    fontWeight: '800',

    color: '#111827',
  },

  statusBadge: {
    borderRadius: 8,

    paddingHorizontal: 9,

    paddingVertical: 7,
  },

  statusBadgeReady: {
    backgroundColor: '#FFF7E6',
  },

  statusBadgeActive: {
    backgroundColor: '#E8F5E9',
  },

  statusText: {
    fontSize: 8,

    fontWeight: '800',

    color: '#2E7D32',
  },

  mapCard: {
    height: 275,

    borderRadius: 16,

    overflow: 'hidden',

    backgroundColor: '#E7EFE5',

    borderWidth: 1,

    borderColor: '#DDE6DE',

    marginBottom: 12,
  },

  map: {
    flex: 1,
  },

  partnerMarker: {
    width: 36,

    height: 36,

    borderRadius: 18,

    backgroundColor: '#1388E8',

    borderWidth: 3,

    borderColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',
  },

  partnerMarkerInner: {
    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: '#FFFFFF',
  },

  customerMarker: {
    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor: '#E44747',

    borderWidth: 3,

    borderColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',
  },

  customerMarkerText: {
    fontSize: 21,

    color: '#FFFFFF',
  },

  mapLoadingBadge: {
    position: 'absolute',

    top: 10,

    left: 10,

    height: 32,

    borderRadius: 16,

    paddingHorizontal: 10,

    backgroundColor: 'rgba(255,255,255,0.95)',

    flexDirection: 'row',

    alignItems: 'center',
  },

  mapLoadingText: {
    marginLeft: 6,

    fontSize: 9.5,

    fontWeight: '700',

    color: '#596260',
  },

  recenterButton: {
    position: 'absolute',

    right: 11,

    top: 11,

    width: 43,

    height: 43,

    borderRadius: 22,

    backgroundColor: 'rgba(255,255,255,0.95)',

    alignItems: 'center',

    justifyContent: 'center',

    shadowColor: '#000000',

    shadowOpacity: 0.15,

    shadowRadius: 6,

    shadowOffset: {
      width: 0,

      height: 2,
    },

    elevation: 3,
  },

  recenterIcon: {
    fontSize: 21,

    color: '#303A3D',
  },

  mapErrorBadge: {
    position: 'absolute',

    left: 10,

    right: 10,

    top: 10,

    minHeight: 36,

    borderRadius: 9,

    paddingHorizontal: 10,

    backgroundColor: 'rgba(255,248,230,0.96)',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  mapErrorText: {
    fontSize: 9.5,

    color: '#7B5C00',

    fontWeight: '600',
  },

  mapRetryText: {
    fontSize: 9.5,

    fontWeight: '800',

    color: '#078D46',
  },

  mapSummary: {
    position: 'absolute',

    left: 8,

    right: 8,

    bottom: 8,

    minHeight: 58,

    borderRadius: 12,

    backgroundColor: 'rgba(232,248,237,0.97)',

    paddingHorizontal: 9,

    paddingVertical: 8,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  mapSummaryLeft: {
    flex: 1,

    minWidth: 0,

    flexDirection: 'row',

    alignItems: 'center',
  },

  mapLocationIcon: {
    width: 35,

    height: 35,

    borderRadius: 18,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 7,
  },

  mapLocationIconText: {
    fontSize: 19,

    color: '#078F47',
  },

  mapDistance: {
    fontSize: 13,

    fontWeight: '800',

    color: '#202827',
  },

  mapDistanceSubtitle: {
    marginTop: 2,

    fontSize: 9.5,

    color: '#68736E',
  },

  mapNavigateButton: {
    height: 40,

    width: 98,

    borderRadius: 9,

    backgroundColor: '#079A49',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    marginLeft: 7,
  },

  mapNavigateIcon: {
    fontSize: 15,

    color: '#FFFFFF',

    marginRight: 5,

    transform: [
      {
        rotate: '-35deg',
      },
    ],
  },

  mapNavigateText: {
    fontSize: 11.5,

    fontWeight: '800',

    color: '#FFFFFF',
  },

  card: {
    backgroundColor: '#FFFFFF',

    borderRadius: 16,

    padding: 14,

    marginBottom: 11,

    borderWidth: 1,

    borderColor: '#E5EAE5',
  },

  cardTitle: {
    fontSize: 15,

    fontWeight: '800',

    color: '#1F2937',

    marginBottom: 12,
  },

  customerRow: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  customerAvatar: {
    width: 48,

    height: 48,

    borderRadius: 24,

    backgroundColor: '#F0E4D4',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 10,

    position: 'relative',
  },

  customerAvatarText: {
    fontSize: 19,

    fontWeight: '800',

    color: '#604A38',
  },

  avatarStatusDot: {
    position: 'absolute',

    right: 0,

    bottom: 0,

    width: 12,

    height: 12,

    borderRadius: 6,

    backgroundColor: '#1BAF50',

    borderWidth: 2,

    borderColor: '#FFFFFF',
  },

  customerInfo: {
    flex: 1,
  },

  customerName: {
    fontSize: 15,

    fontWeight: '700',

    color: '#1F2937',
  },

  customerPhone: {
    marginTop: 3,

    fontSize: 11.5,

    color: '#7A827A',
  },

  contactActions: {
    flexDirection: 'row',

    marginTop: 12,

    gap: 8,
  },

  primaryContactButton: {
    flex: 1,

    height: 42,

    borderRadius: 9,

    backgroundColor: '#079748',

    alignItems: 'center',

    justifyContent: 'center',
  },

  primaryContactButtonText: {
    color: '#FFFFFF',

    fontSize: 12,

    fontWeight: '800',
  },

  secondaryContactButton: {
    flex: 1,

    height: 42,

    borderRadius: 9,

    backgroundColor: '#E8F5E9',

    borderWidth: 1,

    borderColor: '#C8E6C9',

    alignItems: 'center',

    justifyContent: 'center',
  },

  secondaryContactButtonText: {
    color: '#2E7D32',

    fontSize: 12,

    fontWeight: '800',
  },

  contactIssueSection: {
    marginTop: 14,

    paddingTop: 13,

    borderTopWidth: 1,

    borderTopColor: '#EEF2EE',
  },

  contactIssueHeader: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  contactIssueInfo: {
    flex: 1,

    paddingRight: 10,
  },

  contactIssueTitle: {
    fontSize: 12.5,

    fontWeight: '700',

    color: '#374151',
  },

  contactIssueDescription: {
    marginTop: 3,

    fontSize: 9.5,

    lineHeight: 14,

    color: '#7A827A',
  },

  contactIssueButton: {
    height: 36,

    borderRadius: 9,

    backgroundColor: '#FFF7E6',

    borderWidth: 1,

    borderColor: '#E8C879',

    paddingHorizontal: 12,

    alignItems: 'center',

    justifyContent: 'center',
  },

  contactIssueButtonText: {
    fontSize: 10.5,

    fontWeight: '700',

    color: '#9A6700',
  },

  contactIssueSelected: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 10,

    padding: 10,

    borderRadius: 9,

    backgroundColor: '#FFF7E6',

    borderWidth: 1,

    borderColor: '#F0DFAF',
  },

  contactIssueSelectedIcon: {
    width: 30,

    height: 30,

    borderRadius: 15,

    backgroundColor: '#F4D98C',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 8,
  },

  contactIssueSelectedIconText: {
    fontSize: 14,

    fontWeight: '800',

    color: '#8A5A00',
  },

  contactIssueSelectedInfo: {
    flex: 1,
  },

  contactIssueSelectedLabel: {
    fontSize: 8.5,

    color: '#9A7A3A',

    marginBottom: 2,
  },

  contactIssueSelectedValue: {
    fontSize: 11,

    fontWeight: '700',

    color: '#6B4D00',
  },

  clearIssueButton: {
    paddingHorizontal: 8,

    paddingVertical: 5,
  },

  clearIssueButtonText: {
    fontSize: 10,

    fontWeight: '700',

    color: '#9A6700',
  },

  locationRow: {
    flexDirection: 'row',

    alignItems: 'flex-start',
  },

  locationIcon: {
    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor: '#E8F5E9',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 10,
  },

  locationIconText: {
    fontSize: 15,

    color: '#2E7D32',
  },

  locationInfo: {
    flex: 1,
  },

  locationTitle: {
    fontSize: 13,

    fontWeight: '700',

    color: '#1F2937',
  },

  locationAddress: {
    marginTop: 3,

    fontSize: 11.5,

    color: '#6F7875',
  },

  locationWard: {
    marginTop: 2,

    fontSize: 10,

    color: '#8A918E',
  },

  locationMetrics: {
    flexDirection: 'row',

    marginTop: 13,

    paddingTop: 12,

    borderTopWidth: 1,

    borderTopColor: '#EEF0EE',
  },

  metric: {
    flex: 1,
  },

  metricDivider: {
    width: 1,

    backgroundColor: '#E5E8E5',
  },

  metricLabel: {
    fontSize: 9.5,

    color: '#8A918A',

    marginBottom: 3,
  },

  metricValue: {
    fontSize: 13.5,

    fontWeight: '700',

    color: '#1F2937',
  },

  navigationButton: {
    height: 46,

    borderRadius: 9,

    backgroundColor: '#F0F7F0',

    borderWidth: 1,

    borderColor: '#C8E6C9',

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: 13,
  },

  navigationButtonText: {
    fontSize: 13,

    fontWeight: '700',

    color: '#2E7D32',
  },

  infoRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    paddingVertical: 10,

    borderBottomWidth: 1,

    borderBottomColor: '#F0F2F0',
  },

  infoLabel: {
    fontSize: 11,

    color: '#7A827A',
  },

  infoValue: {
    fontSize: 12,

    fontWeight: '600',

    color: '#374151',
  },

  totalRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    paddingTop: 13,
  },

  totalLabel: {
    fontSize: 12,

    fontWeight: '600',

    color: '#374151',
  },

  totalAmount: {
    fontSize: 18,

    fontWeight: '800',

    color: '#2E7D32',
  },

  instructionsHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  instructionsToggle: {
    paddingHorizontal: 9,

    paddingVertical: 5,

    borderRadius: 7,

    backgroundColor: '#E8F5E9',

    marginBottom: 12,
  },

  instructionsToggleText: {
    fontSize: 9.5,

    fontWeight: '700',

    color: '#2E7D32',
  },

  instructionsBox: {
    backgroundColor: '#F7FAF7',

    borderRadius: 9,

    padding: 11,

    borderWidth: 1,

    borderColor: '#E5EAE5',
  },

  instructions: {
    fontSize: 11.5,

    lineHeight: 20,

    color: '#596159',
  },

  statusCard: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    backgroundColor: '#EEF8EF',

    borderRadius: 16,

    padding: 14,

    borderWidth: 1,

    borderColor: '#C8E6C9',

    marginBottom: 11,
  },

  statusIndicator: {
    paddingTop: 3,

    marginRight: 10,
  },

  statusIndicatorDot: {
    width: 11,

    height: 11,

    borderRadius: 6,

    backgroundColor: '#B26A00',
  },

  statusIndicatorDotActive: {
    backgroundColor: '#2E7D32',
  },

  statusContent: {
    flex: 1,
  },

  statusCardTitle: {
    fontSize: 13,

    fontWeight: '700',

    color: '#1F2937',
  },

  statusCardText: {
    marginTop: 3,

    fontSize: 10,

    lineHeight: 15,

    color: '#667066',
  },

  verificationCard: {
    backgroundColor: '#EEF8EF',

    borderRadius: 16,

    padding: 14,

    borderWidth: 1,

    borderColor: '#C8E6C9',

    marginBottom: 11,
  },

  verificationHeader: {
    flexDirection: 'row',

    alignItems: 'flex-start',
  },

  verificationIcon: {
    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: '#2E7D32',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 9,
  },

  verificationIconText: {
    color: '#FFFFFF',

    fontSize: 18,

    fontWeight: '800',
  },

  verificationContent: {
    flex: 1,
  },

  verificationTitle: {
    fontSize: 12.5,

    fontWeight: '700',

    color: '#1F5130',
  },

  verificationDescription: {
    marginTop: 3,

    fontSize: 9.5,

    lineHeight: 15,

    color: '#597060',
  },

  verificationButton: {
    height: 47,

    borderRadius: 9,

    backgroundColor: '#2E7D32',

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: 11,
  },

  verificationButtonText: {
    fontSize: 11,

    fontWeight: '800',

    letterSpacing: 0.25,

    color: '#FFFFFF',
  },

  deliveryIssueCard: {
    backgroundColor: '#FFF8E8',

    borderRadius: 16,

    padding: 14,

    borderWidth: 1,

    borderColor: '#F1D99A',

    marginBottom: 11,
  },

  deliveryIssueHeader: {
    flexDirection: 'row',

    alignItems: 'flex-start',
  },

  deliveryIssueIcon: {
    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: '#B87800',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 9,
  },

  deliveryIssueIconText: {
    color: '#FFFFFF',

    fontSize: 18,

    fontWeight: '800',
  },

  deliveryIssueContent: {
    flex: 1,
  },

  deliveryIssueTitle: {
    fontSize: 12.5,

    fontWeight: '700',

    color: '#4B3A00',
  },

  deliveryIssueDescription: {
    marginTop: 3,

    fontSize: 9.5,

    lineHeight: 15,

    color: '#786331',
  },

  deliveryIssueButton: {
    height: 46,

    borderRadius: 9,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#D9B55D',

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: 11,
  },

  deliveryIssueButtonText: {
    fontSize: 11,

    fontWeight: '800',

    color: '#8A5A00',
  },

  startButton: {
    height: 52,

    borderRadius: 11,

    backgroundColor: '#2E7D32',

    alignItems: 'center',

    justifyContent: 'center',
  },

  startButtonText: {
    color: '#FFFFFF',

    fontSize: 14,

    fontWeight: '800',

    letterSpacing: 0.4,
  },

  startedBanner: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#E8F5E9',

    borderRadius: 11,

    padding: 14,

    borderWidth: 1,

    borderColor: '#C8E6C9',
  },

  startedIcon: {
    width: 39,

    height: 39,

    borderRadius: 20,

    backgroundColor: '#2E7D32',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 10,
  },

  startedIconText: {
    color: '#FFFFFF',

    fontSize: 18,

    fontWeight: '800',
  },

  startedContent: {
    flex: 1,
  },

  startedTitle: {
    fontSize: 13,

    fontWeight: '700',

    color: '#1F2937',
  },

  startedText: {
    marginTop: 2,

    fontSize: 10,

    color: '#667066',
  },

  modalBackdrop: {
    flex: 1,

    backgroundColor: 'rgba(0,0,0,0.45)',

    justifyContent: 'flex-end',
  },

  issueModal: {
    backgroundColor: '#FFFFFF',

    borderTopLeftRadius: 24,

    borderTopRightRadius: 24,

    paddingHorizontal: 18,

    paddingTop: 19,

    paddingBottom: 25,
  },

  issueModalHeader: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent: 'space-between',

    marginBottom: 17,
  },

  issueModalHeaderContent: {
    flex: 1,

    paddingRight: 10,
  },

  issueModalTitle: {
    fontSize: 18,

    fontWeight: '700',

    color: '#111827',
  },

  issueModalSubtitle: {
    marginTop: 4,

    fontSize: 11,

    lineHeight: 17,

    color: '#7A827A',
  },

  modalCloseButton: {
    width: 35,

    height: 35,

    borderRadius: 18,

    backgroundColor: '#F1F3F1',

    alignItems: 'center',

    justifyContent: 'center',
  },

  modalCloseButtonText: {
    fontSize: 23,

    color: '#4B5563',
  },

  issueOptions: {
    gap: 9,
  },

  issueOption: {
    flexDirection: 'row',

    alignItems: 'center',

    padding: 12,

    borderRadius: 12,

    backgroundColor: '#F9FBF9',

    borderWidth: 1,

    borderColor: '#E5EAE5',
  },

  issueOptionIcon: {
    width: 37,

    height: 37,

    borderRadius: 19,

    backgroundColor: '#FFF7E6',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 10,
  },

  issueOptionIconText: {
    fontSize: 15,

    fontWeight: '800',

    color: '#9A6700',
  },

  issueOptionContent: {
    flex: 1,
  },

  issueOptionTitle: {
    fontSize: 12.5,

    fontWeight: '700',

    color: '#1F2937',
  },

  issueOptionDescription: {
    marginTop: 3,

    fontSize: 9.5,

    lineHeight: 15,

    color: '#7A827A',
  },

  modalCancelButton: {
    height: 49,

    borderRadius: 10,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#C9D0C9',

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: 15,
  },

  modalCancelButtonText: {
    fontSize: 12,

    fontWeight: '800',

    color: '#5F675F',
  },
});

export default ActiveDeliveryScreen;
