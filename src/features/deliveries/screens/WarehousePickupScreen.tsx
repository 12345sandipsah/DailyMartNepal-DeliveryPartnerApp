import React, { useState } from 'react';
import {
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

type WarehousePickupScreenProps = NativeStackScreenProps<
  MainStackParamList,
  'WarehousePickup'
>;

type WarehousePickupNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'WarehousePickup'
>;

function WarehousePickupScreen({
  route,
}: WarehousePickupScreenProps) {
  const navigation =
    useNavigation<WarehousePickupNavigationProp>();

  const { deliveryId } = route.params;

  const [packageScanned, setPackageScanned] =
    useState(false);

  const [pickupConfirmed, setPickupConfirmed] =
    useState(false);

  const handleScanPackage = () => {
    // Temporary frontend-only scan simulation.
    // Real QR/barcode scanning and backend validation
    // will be connected later.
    setPackageScanned(true);
  };

  const handleConfirmPickup = () => {
    if (!packageScanned) {
      return;
    }

    setPickupConfirmed(true);

    // Temporary frontend-only pickup confirmation.
    // Real backend pickup confirmation will be connected later.
  };

  const handleContinueToDelivery = () => {
    navigation.navigate('ActiveDelivery', {
      deliveryId,
    });
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageLabel}>
            Warehouse Pickup
          </Text>

          <Text style={styles.title}>
            Collect Package
          </Text>

          <Text style={styles.subtitle}>
            Verify the assigned package before leaving
            the warehouse.
          </Text>
        </View>

        {/* Order */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderLabel}>
                Assigned Order
              </Text>

              <Text style={styles.orderId}>
                {deliveryId}
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                ACCEPTED
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.orderRow}>
            <Text style={styles.rowLabel}>
              Warehouse
            </Text>

            <Text style={styles.rowValue}>
              DailyMart Warehouse
            </Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.rowLabel}>
              Package count
            </Text>

            <Text style={styles.rowValue}>
              1 package
            </Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.rowLabel}>
              Payment
            </Text>

            <Text style={styles.rowValue}>
              COD
            </Text>
          </View>
        </View>

        {/* Package scan */}
        <View style={styles.scanCard}>
          <View
            style={[
              styles.scanIcon,
              packageScanned && styles.scanIconSuccess,
            ]}
          >
            <Text
              style={[
                styles.scanIconText,
                packageScanned &&
                  styles.scanIconTextSuccess,
              ]}
            >
              {packageScanned ? '✓' : 'QR'}
            </Text>
          </View>

          <Text style={styles.scanTitle}>
            {packageScanned
              ? 'Package Scanned'
              : 'Scan Package QR / Barcode'}
          </Text>

          <Text style={styles.scanDescription}>
            {packageScanned
              ? `Package for ${deliveryId} has been scanned.`
              : 'Scan the package label provided by the warehouse.'}
          </Text>

          {!packageScanned && (
            <Pressable
              style={styles.scanButton}
              onPress={handleScanPackage}
            >
              <Text style={styles.scanButtonText}>
                Scan Package
              </Text>
            </Pressable>
          )}
        </View>

        {/* Checklist */}
        <View style={styles.checklistCard}>
          <Text style={styles.cardTitle}>
            Pickup Checklist
          </Text>

          <View style={styles.checklistRow}>
            <View
              style={[
                styles.checkCircle,
                styles.checkCircleCompleted,
              ]}
            >
              <Text style={styles.checkText}>
                ✓
              </Text>
            </View>

            <Text style={styles.checkLabel}>
              Order assigned to this partner
            </Text>
          </View>

          <View style={styles.checklistRow}>
            <View
              style={[
                styles.checkCircle,
                packageScanned &&
                  styles.checkCircleCompleted,
              ]}
            >
              {packageScanned && (
                <Text style={styles.checkText}>
                  ✓
                </Text>
              )}
            </View>

            <Text style={styles.checkLabel}>
              Package QR / barcode scanned
            </Text>
          </View>

          <View style={styles.checklistRow}>
            <View
              style={[
                styles.checkCircle,
                pickupConfirmed &&
                  styles.checkCircleCompleted,
              ]}
            >
              {pickupConfirmed && (
                <Text style={styles.checkText}>
                  ✓
                </Text>
              )}
            </View>

            <Text style={styles.checkLabel}>
              Warehouse handover confirmed
            </Text>
          </View>
        </View>

        {/* Pickup confirmation */}
        {!pickupConfirmed ? (
          <Pressable
            style={[
              styles.confirmButton,
              !packageScanned &&
                styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmPickup}
            disabled={!packageScanned}
          >
            <Text style={styles.confirmButtonText}>
              Confirm Pickup
            </Text>
          </Pressable>
        ) : (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>
                ✓
              </Text>
            </View>

            <Text style={styles.successTitle}>
              Pickup Confirmed
            </Text>

            <Text style={styles.successText}>
              The package has been handed over to you.
              You are ready to start the delivery.
            </Text>

            <Pressable
              style={styles.deliveryButton}
              onPress={handleContinueToDelivery}
            >
              <Text style={styles.deliveryButtonText}>
                Start Delivery
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
    marginBottom: 22,
  },

  pageLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },

  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5EAE5',
    marginBottom: 15,
  },

  orderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  orderLabel: {
    fontSize: 11,
    color: '#8A918A',
    marginBottom: 4,
  },

  orderId: {
    fontSize: 21,
    fontWeight: '700',
    color: '#111827',
  },

  statusBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2E7D32',
  },

  divider: {
    height: 1,
    backgroundColor: '#EEF0EE',
    marginVertical: 15,
  },

  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },

  rowLabel: {
    fontSize: 12,
    color: '#7A827A',
  },

  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  scanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E5EAE5',
    alignItems: 'center',
    marginBottom: 15,
  },

  scanIcon: {
    width: 74,
    height: 74,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },

  scanIconSuccess: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },

  scanIconText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E7D32',
  },

  scanIconTextSuccess: {
    color: '#FFFFFF',
    fontSize: 30,
  },

  scanTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },

  scanDescription: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    color: '#7A827A',
    textAlign: 'center',
    maxWidth: 280,
  },

  scanButton: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5EAE5',
    marginBottom: 18,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },

  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D7D1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  checkCircleCompleted: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },

  checkText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  checkLabel: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
  },

  confirmButton: {
    height: 52,
    borderRadius: 11,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmButtonDisabled: {
    opacity: 0.45,
  },

  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  successContainer: {
    alignItems: 'center',
    backgroundColor: '#EEF8EF',
    borderRadius: 17,
    padding: 22,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },

  successIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  successIconText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '700',
  },

  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  successText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: '#667066',
    textAlign: 'center',
  },

  deliveryButton: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  deliveryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default WarehousePickupScreen;