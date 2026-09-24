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

import {
  useNavigation,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type DeliveryCompletionScreenProps =
  NativeStackScreenProps<
    MainStackParamList,
    'DeliveryCompletion'
  >;

type DeliveryCompletionNavigationProp =
  NativeStackNavigationProp<MainStackParamList>;

function DeliveryCompletionScreen({
  route,
}: DeliveryCompletionScreenProps) {
  const navigation =
    useNavigation<DeliveryCompletionNavigationProp>();

  const { deliveryId } = route.params;

  const [isCompleted, setIsCompleted] = useState(false);

  const handleCompleteDelivery = () => {
    Alert.alert(
      'Complete Delivery',
      'Are you sure the order has been successfully handed over to the customer?',
      [
        {
          text: 'CANCEL',
          style: 'cancel',
        },
        {
          text: 'CONFIRM',
          onPress: () => {
            /*
             * Frontend simulation for now.
             *
             * Backend completion API will be connected later.
             * The backend will become authoritative for:
             * - delivery completion
             * - partner authorization
             * - order state
             * - GPS
             * - verification details
             * - deliveredAt
             */
            setIsCompleted(true);
          },
        },
      ],
    );
  };

  const handleBackToHome = () => {
    navigation.navigate('Home');
  };

  const handleBackToVerification = () => {
    navigation.goBack();
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
          <View style={styles.headerTextContainer}>
            <Text style={styles.pageLabel}>
              Delivery Completion
            </Text>

            <Text style={styles.orderId}>
              {deliveryId}
            </Text>
          </View>

          <View
            style={[
              styles.headerBadge,
              isCompleted && styles.headerBadgeCompleted,
            ]}
          >
            <Text
              style={[
                styles.headerBadgeText,
                isCompleted &&
                  styles.headerBadgeTextCompleted,
              ]}
            >
              {isCompleted ? 'COMPLETED' : 'FINAL STEP'}
            </Text>
          </View>
        </View>

        {/* Completion Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              Delivery process
            </Text>

            <Text style={styles.progressCount}>
              {isCompleted ? '4 / 4' : '3 / 4'}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                isCompleted
                  ? styles.progressFillComplete
                  : styles.progressFillBeforeComplete,
              ]}
            />
          </View>

          <Text style={styles.progressDescription}>
            {isCompleted
              ? 'The delivery has been marked as completed successfully.'
              : 'Package and customer verification are complete. Confirm the final handover.'}
          </Text>
        </View>

        {!isCompleted ? (
          <>
            {/* Verification Summary */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>
                    ✓
                  </Text>
                </View>

                <View style={styles.sectionHeaderText}>
                  <Text style={styles.cardTitle}>
                    Verification Completed
                  </Text>

                  <Text style={styles.cardSubtitle}>
                    Both required verification steps have been
                    completed before final delivery confirmation.
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Package QR / Barcode
                </Text>

                <Text
                  style={[
                    styles.summaryValue,
                    styles.successValue,
                  ]}
                >
                  VERIFIED
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Customer OTP
                </Text>

                <Text
                  style={[
                    styles.summaryValue,
                    styles.successValue,
                  ]}
                >
                  VERIFIED
                </Text>
              </View>

              <View style={styles.summaryRowLast}>
                <Text style={styles.summaryLabel}>
                  Verification status
                </Text>

                <Text
                  style={[
                    styles.summaryValue,
                    styles.successValue,
                  ]}
                >
                  READY TO COMPLETE
                </Text>
              </View>
            </View>

            {/* Delivery Summary */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>
                    4
                  </Text>
                </View>

                <View style={styles.sectionHeaderText}>
                  <Text style={styles.cardTitle}>
                    Delivery Summary
                  </Text>

                  <Text style={styles.cardSubtitle}>
                    Review the final delivery information before
                    confirming handover.
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Order ID
                </Text>

                <Text
                  style={styles.summaryValue}
                  numberOfLines={1}
                >
                  {deliveryId}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Package count
                </Text>

                <Text style={styles.summaryValue}>
                  1 package
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Verification method
                </Text>

                <Text style={styles.summaryValue}>
                  QR + OTP
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Handover status
                </Text>

                <Text
                  style={[
                    styles.summaryValue,
                    styles.pendingValue,
                  ]}
                >
                  Awaiting confirmation
                </Text>
              </View>

              <View style={styles.summaryRowLast}>
                <Text style={styles.summaryLabel}>
                  Delivery status
                </Text>

                <Text
                  style={[
                    styles.summaryValue,
                    styles.pendingValue,
                  ]}
                >
                  Ready to complete
                </Text>
              </View>
            </View>

            {/* Important Notice */}
            <View style={styles.noticeCard}>
              <View style={styles.noticeIcon}>
                <Text style={styles.noticeIconText}>
                  !
                </Text>
              </View>

              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle}>
                  Before completing
                </Text>

                <Text style={styles.noticeText}>
                  Confirm that the parcel has been handed over
                  to the correct customer and there are no
                  remaining delivery issues.
                </Text>
              </View>
            </View>

            {/* Complete Button */}
            <Pressable
              style={styles.primaryButton}
              onPress={handleCompleteDelivery}
            >
              <Text style={styles.primaryButtonText}>
                MARK DELIVERY COMPLETE
              </Text>
            </Pressable>

            {/* Back */}
            <Pressable
              style={styles.secondaryButton}
              onPress={handleBackToVerification}
            >
              <Text style={styles.secondaryButtonText}>
                BACK TO VERIFICATION
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Completed State */}
            <View style={styles.completedCard}>
              <View style={styles.completedIcon}>
                <Text style={styles.completedIconText}>
                  ✓
                </Text>
              </View>

              <Text style={styles.completedTitle}>
                Delivery Completed
              </Text>

              <Text style={styles.completedDescription}>
                The delivery has been successfully completed
                and the order handover is confirmed.
              </Text>

              <View style={styles.completedStatus}>
                <View style={styles.completedStatusDot} />

                <Text style={styles.completedStatusText}>
                  DELIVERED
                </Text>
              </View>
            </View>

            {/* Completion Details */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>
                    ✓
                  </Text>
                </View>

                <View style={styles.sectionHeaderText}>
                  <Text style={styles.cardTitle}>
                    Completion Details
                  </Text>

                  <Text style={styles.cardSubtitle}>
                    The frontend completion state has been
                    recorded for this delivery.
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Order ID
                </Text>

                <Text style={styles.summaryValue}>
                  {deliveryId}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Package verification
                </Text>

                <Text
                  style={[
                    styles.summaryValue,
                    styles.successValue,
                  ]}
                >
                  VERIFIED
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Customer verification
                </Text>

                <Text
                  style={[
                    styles.summaryValue,
                    styles.successValue,
                  ]}
                >
                  VERIFIED
                </Text>
              </View>

              <View style={styles.summaryRowLast}>
                <Text style={styles.summaryLabel}>
                  Final status
                </Text>

                <Text
                  style={[
                    styles.summaryValue,
                    styles.successValue,
                  ]}
                >
                  DELIVERED
                </Text>
              </View>
            </View>

            {/* Backend Note */}
            <View style={styles.backendNotice}>
              <Text style={styles.backendNoticeTitle}>
                Backend integration comes next
              </Text>

              <Text style={styles.backendNoticeText}>
                The current screen simulates successful
                completion on the frontend. Later, the backend
                will securely validate and record the final
                delivery state.
              </Text>
            </View>

            {/* Home Button */}
            <Pressable
              style={styles.primaryButton}
              onPress={handleBackToHome}
            >
              <Text style={styles.primaryButtonText}>
                BACK TO HOME
              </Text>
            </Pressable>
          </>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
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

  headerBadge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: '#FFF3E0',
  },

  headerBadgeCompleted: {
    backgroundColor: '#E8F5E9',
  },

  headerBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#B26A00',
  },

  headerBadgeTextCompleted: {
    color: '#2E7D32',
  },

  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

  progressCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },

  progressTrack: {
    height: 7,
    backgroundColor: '#E8ECE8',
    borderRadius: 4,
    marginTop: 13,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 4,
  },

  progressFillBeforeComplete: {
    width: '75%',
  },

  progressFillComplete: {
    width: '100%',
  },

  progressDescription: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 17,
    color: '#7A827A',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  sectionHeaderText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },

  cardSubtitle: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    color: '#7A827A',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F0',
  },

  summaryRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 11,
  },

  summaryLabel: {
    flex: 1,
    fontSize: 12,
    color: '#7A827A',
    paddingRight: 12,
  },

  summaryValue: {
    maxWidth: '55%',
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'right',
  },

  successValue: {
    color: '#2E7D32',
  },

  pendingValue: {
    color: '#A66A00',
  },

  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E8',
    borderRadius: 14,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1D99A',
  },

  noticeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#B87800',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  noticeIconText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  noticeContent: {
    flex: 1,
  },

  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B4300',
  },

  noticeText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    color: '#786331',
  },

  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 11,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  secondaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C9D0C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 11,
  },

  secondaryButtonText: {
    color: '#5F675F',
    fontSize: 13,
    fontWeight: '800',
  },

  completedCard: {
    alignItems: 'center',
    backgroundColor: '#EEF8EF',
    borderRadius: 17,
    padding: 24,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#B8DDBA',
  },

  completedIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  completedIconText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },

  completedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },

  completedDescription: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 17,
    color: '#667066',
    textAlign: 'center',
  },

  completedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },

  completedStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
    marginRight: 7,
  },

  completedStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#2E7D32',
  },

  backendNotice: {
    backgroundColor: '#F3F5F3',
    borderRadius: 13,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E1E5E1',
  },

  backendNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 5,
  },

  backendNoticeText: {
    fontSize: 10,
    lineHeight: 16,
    color: '#7A827A',
  },
});

export default DeliveryCompletionScreen;