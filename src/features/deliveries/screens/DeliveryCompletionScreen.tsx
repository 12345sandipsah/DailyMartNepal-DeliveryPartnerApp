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

import {
  useNavigation,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type {MainStackParamList} from '../../../app/navigation/MainNavigator';
import {finishDelivery} from '../../../shared/services/api';

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

  const {deliveryId} = route.params;

  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);

  const handleCompleteDelivery = () => {
    Alert.alert(
      'Complete Delivery',
      'Confirm that the order has been handed over to the customer.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            if (isCompleting) return;
            setIsCompleting(true);
            try {
              const result = await finishDelivery(deliveryId.replace(/^#/, ''));
              setCompletedAt(
                result.order.deliveredAt ? new Date(result.order.deliveredAt) : new Date(),
              );
              setIsCompleted(true);
            } catch (error) {
              Alert.alert('Delivery not completed', error instanceof Error ? error.message : 'Verify payment and customer OTP, then retry.');
            } finally {
              setIsCompleting(false);
            }
          },
        },
      ],
    );
  };

  const handleBackToHome = () => {
    navigation.navigate('Home');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              Delivery Completion
            </Text>

            <Text style={styles.headerOrder}>
              {deliveryId}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isCompleted && styles.statusBadgeCompleted,
            ]}>
            <Text
              style={[
                styles.statusBadgeText,
                isCompleted && styles.statusBadgeTextCompleted,
              ]}>
              {isCompleted ? 'COMPLETED' : 'FINAL STEP'}
            </Text>
          </View>
        </View>

        {!isCompleted ? (
          <>
            {/* Main completion card */}
            <View style={styles.completionCard}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkText}>✓</Text>
              </View>

              <Text style={styles.completionTitle}>
                Ready to Complete
              </Text>

              <Text style={styles.completionDescription}>
                Customer OTP is verified and payment is recorded. DailyMart will confirm delivery when you mark it complete.
              </Text>
            </View>

            {/* Delivery details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Delivery Details
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Order ID
                </Text>

                <Text
                  style={styles.detailValue}
                  numberOfLines={1}>
                  {deliveryId}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Package label check
                </Text>

                <Text style={styles.detailValue}>
                  Optional app check
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Customer Verification
                </Text>

                <Text style={styles.successValue}>
                  VERIFIED BY DAILYMART
                </Text>
              </View>

              <View style={styles.detailRowLast}>
                <Text style={styles.detailLabel}>
                  Payment
                </Text>

                <Text style={styles.successValue}>
                  CONFIRMED
                </Text>
              </View>
            </View>

            {/* Confirmation note */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>
                Before completing
              </Text>

              <Text style={styles.infoText}>
                Make sure the parcel has been handed over to the
                correct customer and there are no remaining issues.
              </Text>
            </View>

            {/* Complete */}
            <Pressable
              style={[styles.primaryButton, isCompleting && {opacity: 0.6}]}
              onPress={handleCompleteDelivery}
              disabled={isCompleting}>
              <Text style={styles.primaryButtonText}>
                {isCompleting ? 'SAVING DELIVERY…' : 'MARK DELIVERY COMPLETE'}
              </Text>
            </Pressable>

            {/* Back */}
            <Pressable
              style={styles.secondaryButton}
              onPress={handleBack}>
              <Text style={styles.secondaryButtonText}>
                BACK
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Success */}
            <View style={styles.successCard}>
              <View style={styles.successCircle}>
                <Text style={styles.successCheck}>
                  ✓
                </Text>
              </View>

              <Text style={styles.successTitle}>
                Delivery Completed
              </Text>

              <Text style={styles.successDescription}>
                The order has been successfully handed over to
                the customer.
              </Text>

              <View style={styles.deliveredBadge}>
                <View style={styles.deliveredDot} />

                <Text style={styles.deliveredText}>
                  DELIVERED
                </Text>
              </View>
            </View>

            {/* Completion details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Completion Details
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Order ID
                </Text>

                <Text
                  style={styles.detailValue}
                  numberOfLines={1}>
                  {deliveryId}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Payment
                </Text>

                <Text style={styles.successValue}>
                  CONFIRMED
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Delivery Status
                </Text>

                <Text style={styles.successValue}>
                  DELIVERED
                </Text>
              </View>

              <View style={styles.detailRowLast}>
                <Text style={styles.detailLabel}>
                  Delivered At
                </Text>

                <Text style={styles.detailValue}>
                  {completedAt
                    ? formatTime(completedAt)
                    : '--'}
                </Text>
              </View>
            </View>

            {/* Backend note */}
            <View style={styles.backendCard}>
              <Text style={styles.backendTitle}>
                Delivery Recorded
              </Text>

              <Text style={styles.backendText}>
                DailyMart confirmed and saved this delivery as delivered.
              </Text>
            </View>

            {/* Home */}
            <Pressable
              style={styles.primaryButton}
              onPress={handleBackToHome}>
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

  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },

  headerOrder: {
    marginTop: 4,
    fontSize: 13,
    color: '#737B73',
    fontWeight: '500',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
  },

  statusBadgeCompleted: {
    backgroundColor: '#E8F5E9',
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A66A00',
    letterSpacing: 0.4,
  },

  statusBadgeTextCompleted: {
    color: '#2E7D32',
  },

  completionCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8E2',
  },

  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    marginBottom: 14,
  },

  checkText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2E7D32',
  },

  completionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },

  completionDescription: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 17,
    color: '#6D756D',
    textAlign: 'center',
  },

  successCard: {
    alignItems: 'center',
    backgroundColor: '#EEF8EF',
    borderRadius: 18,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#B8DDBA',
  },

  successCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  successCheck: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  successTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },

  successDescription: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 17,
    color: '#667066',
    textAlign: 'center',
  },

  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },

  deliveredDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
    marginRight: 7,
  },

  deliveredText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8E2',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F0',
  },

  detailRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 13,
  },

  detailLabel: {
    flex: 1,
    paddingRight: 12,
    fontSize: 12,
    color: '#7A827A',
  },

  detailValue: {
    maxWidth: '55%',
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'right',
  },

  successValue: {
    maxWidth: '55%',
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
    textAlign: 'right',
  },

  infoCard: {
    backgroundColor: '#FFF8E8',
    borderRadius: 14,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1D99A',
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B4300',
    marginBottom: 4,
  },

  infoText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#786331',
  },

  backendCard: {
    backgroundColor: '#F3F5F3',
    borderRadius: 14,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E5E1',
  },

  backendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 5,
  },

  backendText: {
    fontSize: 10,
    lineHeight: 16,
    color: '#7A827A',
  },

  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 11,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
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
});

export default DeliveryCompletionScreen;
