import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

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
  | 'OUT FOR DELIVERY';

type RejectionReason =
  | 'Vehicle issue'
  | 'Already at delivery limit'
  | 'Emergency'
  | 'Too far'
  | 'Other';

function DeliveryDetailsScreen({
  route,
}: DeliveryDetailsScreenProps) {
  const navigation =
    useNavigation<DeliveryDetailsNavigationProp>();

  const { deliveryId } = route.params;

  const [status, setStatus] =
    useState<DeliveryStatus>('ASSIGNED');

  const [showRejectReasons, setShowRejectReasons] =
    useState(false);

  const handleAccept = () => {
    setStatus('ACCEPTED');
  };

  const handleReject = (reason: RejectionReason) => {
    setShowRejectReasons(false);

    Alert.alert(
      'Delivery Rejected',
      `Order ${deliveryId}\nReason: ${reason}`,
    );
  };

  const handleStartPickup = () => {
    navigation.navigate('WarehousePickup', {
      deliveryId,
    });
  };

  const handleCallCustomer = () => {
    // Customer calling will be connected later.
  };

  const getStatusStyle = () => {
    switch (status) {
      case 'ACCEPTED':
        return {
          backgroundColor: '#E8F5E9',
          color: '#2E7D32',
        };

      default:
        return {
          backgroundColor: '#FFF7E6',
          color: '#B26A00',
        };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.pageLabel}>
              Delivery Assignment
            </Text>

            <Text style={styles.orderId}>
              {deliveryId}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusStyle.backgroundColor,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: statusStyle.color,
                },
              ]}
            >
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>

          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                C
              </Text>
            </View>

            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>
                Customer
              </Text>

              <Text style={styles.customerArea}>
                Birgunj
              </Text>
            </View>

            <Pressable
              style={styles.callButton}
              onPress={handleCallCustomer}
            >
              <Text style={styles.callButtonText}>
                Call
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Delivery Location
          </Text>

          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>
                ●
              </Text>
            </View>

            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>
                Customer Address
              </Text>

              <Text style={styles.locationAddress}>
                Birgunj, Parsa, Nepal
              </Text>
            </View>
          </View>

          <View style={styles.locationDetails}>
            <View style={styles.locationMetric}>
              <Text style={styles.metricLabel}>
                Distance
              </Text>

              <Text style={styles.metricValue}>
                2.4 km
              </Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.locationMetric}>
              <Text style={styles.metricLabel}>
                Estimated time
              </Text>

              <Text style={styles.metricValue}>
                12 min
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Order Information
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Order ID
            </Text>

            <Text style={styles.infoValue}>
              {deliveryId}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Items
            </Text>

            <Text style={styles.infoValue}>
              7 items
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Payment method
            </Text>

            <Text style={styles.infoValue}>
              COD
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Amount to collect
            </Text>

            <Text style={styles.amountValue}>
              NPR 850
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Special Instructions
          </Text>

          <Text style={styles.instructions}>
            Please call the customer when you are near
            the delivery location.
          </Text>
        </View>

        {status === 'ASSIGNED' &&
          !showRejectReasons && (
            <View style={styles.actionContainer}>
              <Pressable
                style={styles.acceptButton}
                onPress={handleAccept}
              >
                <Text style={styles.acceptButtonText}>
                  Accept Delivery
                </Text>
              </Pressable>

              <Pressable
                style={styles.rejectButton}
                onPress={() =>
                  setShowRejectReasons(true)
                }
              >
                <Text style={styles.rejectButtonText}>
                  Reject Delivery
                </Text>
              </Pressable>
            </View>
          )}

        {showRejectReasons && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Why are you rejecting this delivery?
            </Text>

            <Text style={styles.reasonSubtitle}>
              Select one reason
            </Text>

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
                <Text style={styles.reasonText}>
                  {reason}
                </Text>

                <Text style={styles.reasonArrow}>
                  ›
                </Text>
              </Pressable>
            ))}

            <Pressable
              style={styles.cancelRejectButton}
              onPress={() =>
                setShowRejectReasons(false)
              }
            >
              <Text style={styles.cancelRejectText}>
                Cancel
              </Text>
            </Pressable>
          </View>
        )}

        {status === 'ACCEPTED' && (
          <View style={styles.acceptedContainer}>
            <View style={styles.acceptedIcon}>
              <Text style={styles.acceptedIconText}>
                ✓
              </Text>
            </View>

            <Text style={styles.acceptedTitle}>
              Delivery Accepted
            </Text>

            <Text style={styles.acceptedText}>
              Proceed to the assigned warehouse to
              collect the package.
            </Text>

            <Pressable
              style={styles.pickupButton}
              onPress={handleStartPickup}
            >
              <Text style={styles.pickupButtonText}>
                Proceed to Pickup
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF7',
  },

  content: {
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

  pageLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },

  orderId: {
    fontSize: 25,
    fontWeight: '700',
    color: '#111827',
  },

  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 15,
  },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  customerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  customerAvatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2E7D32',
  },

  customerInfo: {
    flex: 1,
  },

  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },

  customerArea: {
    marginTop: 4,
    fontSize: 12,
    color: '#7A827A',
  },

  callButton: {
    minWidth: 68,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  callButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  locationIconText: {
    fontSize: 15,
    color: '#2E7D32',
  },

  locationInfo: {
    flex: 1,
  },

  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  locationAddress: {
    marginTop: 4,
    fontSize: 12,
    color: '#7A827A',
    lineHeight: 18,
  },

  locationDetails: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEF0EE',
  },

  locationMetric: {
    flex: 1,
  },

  metricDivider: {
    width: 1,
    backgroundColor: '#E5E8E5',
  },

  metricLabel: {
    fontSize: 10,
    color: '#8A918A',
    marginBottom: 4,
  },

  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F0',
  },

  infoLabel: {
    fontSize: 12,
    color: '#7A827A',
  },

  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  amountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },

  instructions: {
    fontSize: 13,
    lineHeight: 20,
    color: '#596159',
  },

  actionContainer: {
    marginTop: 4,
  },

  acceptButton: {
    height: 52,
    borderRadius: 11,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  rejectButton: {
    height: 52,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7DDD7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rejectButtonText: {
    color: '#B42318',
    fontSize: 15,
    fontWeight: '700',
  },

  reasonSubtitle: {
    fontSize: 12,
    color: '#7A827A',
    marginBottom: 12,
  },

  reasonButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#E2E7E2',
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },

  reasonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  reasonArrow: {
    fontSize: 23,
    color: '#2E7D32',
  },

  cancelRejectButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  cancelRejectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  acceptedContainer: {
    alignItems: 'center',
    backgroundColor: '#EEF8EF',
    borderRadius: 17,
    padding: 22,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },

  acceptedIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  acceptedIconText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '700',
  },

  acceptedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  acceptedText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: '#667066',
    textAlign: 'center',
  },

  pickupButton: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  pickupButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default DeliveryDetailsScreen;