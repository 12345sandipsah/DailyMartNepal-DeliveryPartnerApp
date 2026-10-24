
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {MainStackParamList} from '../../../app/navigation/MainNavigator';
import {
  collectCash,
  getDelivery,
  type OrderRecord,
} from '../../../shared/services/api';

type CODCollectionScreenProps = NativeStackScreenProps<
  MainStackParamList,
  'CODCollection'
>;

type PaymentMethod = 'COD' | 'ESEWA' | 'KHALTI';
type PaymentStatus = 'PENDING' | 'PAID' | 'COLLECTED';

type PaymentConfig = {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
};

function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'ESEWA':
      return 'eSewa';
    case 'KHALTI':
      return 'Khalti';
    case 'COD':
    default:
      return 'Cash on Delivery';
  }
}

function CODCollectionScreen({
  route,
  navigation,
}: CODCollectionScreenProps) {
  const {deliveryId} = route.params;

  const [delivery, setDelivery] = useState<OrderRecord | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    method: 'COD',
    status: 'PENDING',
    amount: 0,
  });

  useEffect(() => {
    let active = true;
    setIsLoadingOrder(true);
    getDelivery(deliveryId.replace(/^#/, ''))
      .then(order => {
        if (!active) return;
        setDelivery(order);
        const method: PaymentMethod = order.paymentMethod === 'esewa'
          ? 'ESEWA'
          : order.paymentMethod === 'khalti'
            ? 'KHALTI'
            : 'COD';
        const isPaid = String(order.paymentStatus).toLowerCase() === 'paid';
        const status: PaymentStatus = isPaid
          ? method === 'COD' ? 'COLLECTED' : 'PAID'
          : 'PENDING';
        const amount = Number(order.total || 0);
        setPaymentConfig({method, status, amount});
        setPaymentStatus(status);
        setCollectedAmount(String(amount));
      })
      .catch(error => {
        if (active) {
          Alert.alert(
            'Payment details unavailable',
            error instanceof Error ? error.message : 'Unable to load the order amount.',
          );
        }
      })
      .finally(() => {
        if (active) setIsLoadingOrder(false);
      });
    return () => { active = false; };
  }, [deliveryId]);

  const isCOD = paymentConfig.method === 'COD';
  const isOnlinePayment =
    paymentConfig.method === 'ESEWA' ||
    paymentConfig.method === 'KHALTI';

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    paymentConfig.status,
  );
  const [collectedAmount, setCollectedAmount] = useState(
    String(paymentConfig.amount),
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);

  // Synchronous guards prevent rapid duplicate actions before React rerenders.
  const processingRef = useRef(false);


  const numericCollectedAmount = useMemo(() => {
    if (collectedAmount.trim() === '') {
      return 0;
    }

    const parsedAmount = Number(collectedAmount);
    return Number.isFinite(parsedAmount) ? parsedAmount : 0;
  }, [collectedAmount]);

  const amountMatches =
    collectedAmount.trim() !== '' &&
    numericCollectedAmount === paymentConfig.amount;

  const remainingAmount = Math.max(
    paymentConfig.amount - numericCollectedAmount,
    0,
  );

  const changeAmount = Math.max(
    numericCollectedAmount - paymentConfig.amount,
    0,
  );

  const isPaymentComplete =
    paymentStatus === 'PAID' || paymentStatus === 'COLLECTED';

  const paymentMethodLabel = getPaymentMethodLabel(paymentConfig.method);

  const paymentStatusLabel =
    paymentStatus === 'PAID'
      ? isOnlinePayment
        ? 'Paid Online'
        : 'Paid'
      : paymentStatus === 'COLLECTED'
        ? 'Collected'
        : 'Pending';

  const amountError =
    !amountTouched
      ? ''
      : collectedAmount.trim() === ''
        ? 'Please enter the amount received.'
        : numericCollectedAmount <= 0
          ? 'The collected amount must be greater than zero.'
          : !amountMatches
            ? 'The amount must match the exact order amount.'
            : '';

  const handleAmountChange = (value: string) => {
    // Accept digits only; do not allow negative values or decimals.
    const numericValue = value.replace(/\D/g, '').slice(0, 7);

    setCollectedAmount(numericValue);
    setAmountTouched(true);
  };

  const handleConfirmCash = () => {
    if (isLoadingOrder || !delivery) {
      Alert.alert('Order unavailable', 'Load the assigned order details before collecting payment.');
      return;
    }
    if (processingRef.current || isProcessing) {
      return;
    }

    setAmountTouched(true);

    if (!isCOD) {
      Alert.alert(
        'Cash Collection Not Allowed',
        'This order uses online payment. Do not collect cash from the customer.',
      );
      return;
    }

    if (paymentStatus !== 'PENDING') {
      Alert.alert(
        'Payment Already Processed',
        'This payment is no longer pending.',
      );
      return;
    }

    if (collectedAmount.trim() === '' || numericCollectedAmount <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Enter a collected amount greater than zero.',
      );
      return;
    }

    if (!amountMatches) {
      Alert.alert(
        'Amount Mismatch',
        `The exact amount to collect is NPR ${paymentConfig.amount}. Please correct the amount before continuing.`,
      );
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmCashCollection = async () => {
    if (processingRef.current || isProcessing || !delivery || !showConfirmModal || !isCOD || !amountMatches || paymentStatus !== 'PENDING') return;
    processingRef.current = true;
    setIsProcessing(true);
    try {
      await collectCash(deliveryId.replace(/^#/, ''), numericCollectedAmount);
      setPaymentStatus('COLLECTED');
      setShowConfirmModal(false);
      Alert.alert('Cash collection recorded', 'DailyMart recorded the exact COD amount against this order.');
    } catch (error) {
      Alert.alert('Cash collection failed', error instanceof Error ? error.message : 'Please retry.');
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  };
  const handleVerifyOnlinePayment = () => {
    if (isProcessing || isLoadingOrder) return;
    setIsProcessing(true);
    getDelivery(deliveryId.replace(/^#/, ''))
      .then(order => {
        setDelivery(order);
        const isPaid = String(order.paymentStatus).toLowerCase() === 'paid';
        const status: PaymentStatus = isPaid
          ? order.paymentMethod === 'cod' ? 'COLLECTED' : 'PAID'
          : 'PENDING';
        setPaymentStatus(status);
        setPaymentConfig(current => ({...current, status, amount: Number(order.total || 0)}));
        Alert.alert(
          'Payment status refreshed',
          status === 'PAID'
            ? 'DailyMart has recorded this online payment as paid. Do not collect cash.'
            : 'DailyMart still shows this payment as pending. Do not collect cash; contact warehouse support if the customer says they paid.',
        );
      })
      .catch(error => {
        Alert.alert('Could not refresh payment', error instanceof Error ? error.message : 'Please try again.');
      })
      .finally(() => setIsProcessing(false));
  };
  const handleContinue = () => {
    if (!isPaymentComplete) {
      Alert.alert(
        'Payment Incomplete',
        'Complete the required payment step before continuing.',
      );
      return;
    }

    if (isCOD && paymentStatus !== 'COLLECTED') {
      Alert.alert(
        'Collection Required',
        'Confirm cash collection before continuing.',
      );
      return;
    }

    navigation.navigate('DeliveryCompletion', {deliveryId});
  };

  const handlePaymentIssue = () => {
    navigation.navigate('FailedDelivery', {deliveryId});
  };

  const handleCloseConfirmModal = () => {
    if (processingRef.current || isProcessing) {
      return;
    }

    setShowConfirmModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <Text style={styles.backArrow}>‹</Text>
            </Pressable>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Payment Collection</Text>
              <Text style={styles.headerSubtitle}>{deliveryId}</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressStep, styles.progressStepDone]}
              />
              <View
                style={[
                  styles.progressStep,
                  isPaymentComplete
                    ? styles.progressStepDone
                    : styles.progressStepActive,
                ]}
              />
              <View
                style={[
                  styles.progressStep,
                  isPaymentComplete
                    ? styles.progressStepDone
                    : styles.progressStepPending,
                ]}
              />
            </View>

            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelDone}>Verified</Text>
              <Text
                style={[
                  styles.progressLabel,
                  !isPaymentComplete && styles.progressLabelActive,
                ]}>
                Payment
              </Text>
              <Text
                style={[
                  styles.progressLabel,
                  isPaymentComplete && styles.progressLabelDone,
                ]}>
                Complete
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.customerHeader}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerAvatarText}>
                  {(delivery?.deliveryLocation?.name || delivery?.customer?.fullName || 'C').charAt(0).toUpperCase()}
                </Text>
                <View style={styles.customerOnlineDot} />
              </View>

              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>
                  {delivery?.deliveryLocation?.name || delivery?.customer?.fullName || 'Customer'}
                </Text>
                <Text style={styles.customerAddress}>
                  {delivery?.deliveryLocation?.formattedAddress ||
                    delivery?.deliveryLocation?.address ||
                    [delivery?.deliveryLocation?.locality, delivery?.deliveryLocation?.cityName || delivery?.deliveryLocation?.city]
                      .filter(Boolean)
                      .join(', ') || 'Delivery address unavailable'}
                </Text>
                <Text style={styles.customerOrder}>
                  Order {deliveryId}
                </Text>
              </View>

              <View
                style={[
                  styles.paymentStatusBadge,
                  isPaymentComplete && styles.paymentStatusBadgePaid,
                ]}>
                <Text
                  style={[
                    styles.paymentStatusBadgeText,
                    isPaymentComplete &&
                      styles.paymentStatusBadgeTextPaid,
                  ]}>
                  {paymentStatusLabel}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>

            <View style={styles.paymentSummaryBox}>
              <View style={styles.summaryIconCircle}>
                <Text style={styles.summaryIcon}>₹</Text>
              </View>

              <View style={styles.summaryInfo}>
                <Text style={styles.summaryLabel}>Payment Method</Text>
                <Text style={styles.summaryValue}>
                  {paymentMethodLabel}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryInfoRight}>
                <Text style={styles.summaryLabel}>Order Amount</Text>
                <Text style={styles.summaryAmount}>
                  NPR {paymentConfig.amount}
                </Text>
              </View>
            </View>

            {isLoadingOrder && (
              <Text style={styles.sectionSubtitle}>Loading payment details from DailyMart…</Text>
            )}
            {!isLoadingOrder && !delivery && (
              <Text style={styles.validationError}>Order details are unavailable. Go back and reopen this assigned delivery.</Text>
            )}

            {isOnlinePayment && (
              <View style={styles.onlinePaymentNotice}>
                <View style={styles.onlineNoticeIcon}>
                  <Text style={styles.onlineNoticeIconText}>!</Text>
                </View>

                <View style={styles.onlineNoticeContent}>
                  <Text style={styles.onlineNoticeTitle}>
                    Online payment order
                  </Text>
                  <Text style={styles.onlineNoticeText}>
                    Do not collect cash. This status is the payment state recorded by DailyMart.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {isCOD && paymentStatus === 'PENDING' && (
            <>
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>
                      Amount to Collect
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      Enter the amount received from the customer.
                    </Text>
                  </View>

                  <View style={styles.codAmountBadge}>
                    <Text style={styles.codAmountBadgeText}>COD</Text>
                  </View>
                </View>

                <View style={styles.expectedAmountBox}>
                  <Text style={styles.expectedAmountLabel}>
                    EXPECTED AMOUNT
                  </Text>
                  <Text style={styles.expectedAmount}>
                    NPR {paymentConfig.amount}
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Collected Amount</Text>

                <View
                  style={[
                    styles.amountInputContainer,
                    amountError !== '' && styles.amountInputInvalid,
                    amountMatches && styles.amountInputValid,
                  ]}>
                  <Text style={styles.currencyText}>NPR</Text>
                  <TextInput
                    value={collectedAmount}
                    onChangeText={handleAmountChange}
                    onBlur={() => setAmountTouched(true)}
                    keyboardType="number-pad"
                    placeholder="Enter collected amount"
                    placeholderTextColor="#9BA39E"
                    style={styles.amountInput}
                    editable={!isProcessing}
                    maxLength={7}
                    accessibilityLabel="Collected amount in Nepalese rupees"
                  />
                </View>

                {amountError !== '' && (
                  <Text style={styles.validationError}>
                    {amountError}
                  </Text>
                )}

                {remainingAmount > 0 && (
                  <View style={styles.remainingBox}>
                    <Text style={styles.remainingLabel}>
                      Remaining Amount
                    </Text>
                    <Text style={styles.remainingValue}>
                      NPR {remainingAmount}
                    </Text>
                  </View>
                )}

                {changeAmount > 0 && (
                  <View style={styles.changeBox}>
                    <Text style={styles.changeLabel}>
                      Change to Customer
                    </Text>
                    <Text style={styles.changeValue}>
                      NPR {changeAmount}
                    </Text>
                  </View>
                )}

                {amountMatches && (
                  <View style={styles.amountSuccessBox}>
                    <View style={styles.successCircle}>
                      <Text style={styles.successCircleText}>✓</Text>
                    </View>
                    <View style={styles.amountSuccessContent}>
                      <Text style={styles.amountSuccessTitle}>
                        Exact Amount
                      </Text>
                      <Text style={styles.amountSuccessText}>
                        NPR {paymentConfig.amount} matches the order amount.
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Collection Method</Text>

                <View style={styles.cashMethodCard}>
                  <View style={styles.cashIcon}>
                    <Text style={styles.cashIconText}>NPR</Text>
                  </View>

                  <View style={styles.cashMethodContent}>
                    <Text style={styles.cashMethodTitle}>
                      Cash on Delivery
                    </Text>
                    <Text style={styles.cashMethodText}>
                      Collect cash directly from the customer.
                    </Text>
                  </View>

                  <View style={styles.selectedCheck}>
                    <Text style={styles.selectedCheckText}>✓</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {isOnlinePayment && paymentStatus === 'PAID' && (
            <View style={styles.paidOnlineCard}>
              <View style={styles.paidHeroCircle}>
                <Text style={styles.paidHeroCheck}>✓</Text>
              </View>

              <Text style={styles.paidOnlineTitle}>
                Payment recorded as paid
              </Text>
              <Text style={styles.paidOnlineSubtitle}>
                DailyMart has recorded this order as paid online. Do not collect cash.
              </Text>

              <View style={styles.paidDetailsCard}>
                <View style={styles.paidDetailRow}>
                  <Text style={styles.paidDetailLabel}>Payment Method</Text>
                  <Text style={styles.paidDetailValue}>
                    {paymentMethodLabel}
                  </Text>
                </View>

                <View style={styles.paidDetailRow}>
                  <Text style={styles.paidDetailLabel}>Amount</Text>
                  <Text style={styles.paidAmount}>
                    NPR {paymentConfig.amount}
                  </Text>
                </View>

                <View style={styles.paidDetailRowLast}>
                  <Text style={styles.paidDetailLabel}>
                    Cash Collection Required
                  </Text>
                  <Text style={styles.noCollectionText}>No</Text>
                </View>
              </View>
            </View>
          )}

          {isOnlinePayment && paymentStatus === 'PENDING' && (
            <View style={styles.onlinePendingCard}>
              <View style={styles.onlinePendingHeader}>
                <View style={styles.onlinePendingIcon}>
                  <Text style={styles.onlinePendingIconText}>
                    {paymentConfig.method === 'ESEWA' ? 'eS' : 'K'}
                  </Text>
                </View>

                <View style={styles.onlinePendingHeaderText}>
                  <Text style={styles.onlinePendingTitle}>
                    {paymentMethodLabel} Payment Pending
                  </Text>
                  <Text style={styles.onlinePendingSubtitle}>
                    Wait for DailyMart to record the payment as paid before continuing.
                  </Text>
                </View>
              </View>

              <View style={styles.gatewayVerificationBox}>
                <Text style={styles.gatewayIcon}>▦</Text>
                <Text style={styles.gatewayTitle}>
                  Payment status
                </Text>
                <Text style={styles.gatewayText}>
                  Refresh the order from DailyMart to check whether its payment status has changed.
                </Text>
              </View>

              <Pressable
                style={[
                  styles.primaryButton,
                  isProcessing && styles.primaryButtonDisabled,
                ]}
                onPress={handleVerifyOnlinePayment}
                disabled={isProcessing}>
                <Text style={styles.primaryButtonText}>
                  {isProcessing
                    ? 'REFRESHING...'
                    : 'REFRESH PAYMENT STATUS'}
                </Text>
                {!isProcessing && (
                  <Text style={styles.primaryButtonArrow}>→</Text>
                )}
              </Pressable>
            </View>
          )}

          <View
            style={[
              styles.statusCard,
              isPaymentComplete && styles.statusCardSuccess,
            ]}>
            <View
              style={[
                styles.statusIcon,
                isPaymentComplete && styles.statusIconSuccess,
              ]}>
              <Text
                style={[
                  styles.statusIconText,
                  isPaymentComplete && styles.statusIconTextSuccess,
                ]}>
                {isPaymentComplete ? '✓' : '₹'}
              </Text>
            </View>

            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                {paymentStatus === 'PAID'
                  ? isOnlinePayment ? 'Paid Online' : 'Paid'
                  : paymentStatus === 'COLLECTED'
                    ? 'Cash collection recorded'
                    : 'Payment Pending'}
              </Text>

              <Text style={styles.statusDescription}>
                {paymentStatus === 'PAID'
                ? `DailyMart has recorded NPR ${paymentConfig.amount} as paid.`
                  : paymentStatus === 'COLLECTED'
                    ? `NPR ${paymentConfig.amount} was recorded as collected.`
                    : isOnlinePayment
                      ? `Do not collect cash. The ${paymentMethodLabel} payment needs backend verification.`
                      : `Collect exactly NPR ${paymentConfig.amount} before continuing.`}
              </Text>
            </View>
          </View>

          {isPaymentComplete ? (
            <Pressable
              style={styles.primaryButton}
              onPress={handleContinue}>
              <Text style={styles.primaryButtonText}>
                CONTINUE TO DELIVERY COMPLETION
              </Text>
              <Text style={styles.primaryButtonArrow}>→</Text>
            </Pressable>
          ) : isCOD ? (
            <Pressable
              style={[
                styles.primaryButton,
                (!amountMatches || isProcessing) &&
                  styles.primaryButtonDisabled,
              ]}
              onPress={handleConfirmCash}
              disabled={!amountMatches || isProcessing || isLoadingOrder || !delivery}>
              <Text style={styles.primaryButtonText}>
                {isProcessing
                  ? 'PROCESSING...'
                  : 'CONFIRM CASH COLLECTION'}
              </Text>
              {!isProcessing && (
                <Text style={styles.primaryButtonArrow}>→</Text>
              )}
            </Pressable>
          ) : null}

          {paymentStatus === 'PENDING' && (
            <Pressable
              style={styles.secondaryButton}
              onPress={handlePaymentIssue}
              disabled={isProcessing}>
              <Text style={styles.secondaryButtonText}>
                PAYMENT ISSUE
              </Text>
            </Pressable>
          )}

          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <Text style={styles.securityIconText}>!</Text>
            </View>

            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>Payment Security</Text>
              <Text style={styles.securityText}>
                The rider cannot change an order's payment method. Online
                payment status must be verified by the backend. Cash
                collection applies only to COD orders. The payment data
                shown on this screen comes from the assigned order in DailyMart.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseConfirmModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmIcon}>
              <Text style={styles.confirmIconText}>NPR</Text>
            </View>

            <Text style={styles.confirmTitle}>
              Confirm Cash Collection
            </Text>

            <Text style={styles.confirmDescription}>
              Confirm that you received the exact payment amount from
              the customer. DailyMart will record this collection against the order.
            </Text>

            <View style={styles.confirmAmountBox}>
              <Text style={styles.confirmAmountLabel}>
                CASH TO MARK AS RECEIVED
              </Text>
              <Text style={styles.confirmAmount}>
                NPR {paymentConfig.amount}
              </Text>
              <Text style={styles.confirmMethod}>
                Cash on Delivery
              </Text>
            </View>

            <Pressable
              style={[
                styles.confirmButton,
                isProcessing && styles.primaryButtonDisabled,
              ]}
              onPress={handleConfirmCashCollection}
              disabled={isProcessing}>
              <Text style={styles.confirmButtonText}>
                {isProcessing ? 'PROCESSING...' : 'CONFIRM COLLECTION'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={handleCloseConfirmModal}
              disabled={isProcessing}>
              <Text style={styles.cancelButtonText}>CANCEL</Text>
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
    backgroundColor: '#F7FAF8',
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 7,
    paddingBottom: 32,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 35,
    lineHeight: 33,
    color: '#202729',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#151C1E',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 9.5,
    color: '#7A8385',
  },
  headerSpacer: {
    width: 40,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5EBE7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  progressStepDone: {
    backgroundColor: '#0A9A49',
  },
  progressStepActive: {
    backgroundColor: '#7BC995',
  },
  progressStepPending: {
    backgroundColor: '#DFE5E0',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  progressLabel: {
    width: '33.33%',
    textAlign: 'center',
    fontSize: 8.5,
    color: '#7C8580',
  },
  progressLabelActive: {
    color: '#078D46',
    fontWeight: '800',
  },
  progressLabelDone: {
    color: '#078D46',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5EBE7',
    padding: 13,
    marginBottom: 10,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#F0E4D4',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 9,
  },
  customerAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#5E4A38',
  },
  customerOnlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#1CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#202729',
  },
  customerAddress: {
    marginTop: 3,
    fontSize: 10,
    color: '#70797D',
  },
  customerOrder: {
    marginTop: 2,
    fontSize: 9,
    color: '#899093',
  },
  paymentStatusBadge: {
    minHeight: 29,
    paddingHorizontal: 9,
    borderRadius: 7,
    backgroundColor: '#FFF5DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentStatusBadgePaid: {
    backgroundColor: '#DFF6E5',
  },
  paymentStatusBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#956500',
  },
  paymentStatusBadgeTextPaid: {
    color: '#078E46',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#202729',
  },
  sectionSubtitle: {
    marginTop: 3,
    maxWidth: 300,
    fontSize: 9.5,
    lineHeight: 14,
    color: '#7A8386',
  },
  paymentSummaryBox: {
    minHeight: 72,
    marginTop: 10,
    borderRadius: 11,
    backgroundColor: '#F6FAF7',
    borderWidth: 1,
    borderColor: '#E0E8E2',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E4F6E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  summaryIcon: {
    fontSize: 19,
    fontWeight: '900',
    color: '#078E46',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryInfoRight: {
    minWidth: 105,
  },
  summaryLabel: {
    fontSize: 8.5,
    color: '#79827E',
  },
  summaryValue: {
    marginTop: 2,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#273032',
  },
  summaryAmount: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '900',
    color: '#078E46',
  },
  summaryDivider: {
    width: 1,
    height: 42,
    backgroundColor: '#E1E7E3',
    marginHorizontal: 10,
  },
  onlinePaymentNotice: {
    marginTop: 9,
    minHeight: 54,
    borderRadius: 10,
    backgroundColor: '#EAF8EE',
    borderWidth: 1,
    borderColor: '#C9E7D1',
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineNoticeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0A9A49',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  onlineNoticeIconText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  onlineNoticeContent: {
    flex: 1,
  },
  onlineNoticeTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#245331',
  },
  onlineNoticeText: {
    marginTop: 2,
    fontSize: 8.8,
    lineHeight: 13,
    color: '#67746B',
  },
  codAmountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: '#E4F6E9',
  },
  codAmountBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#078E46',
  },
  expectedAmountBox: {
    marginTop: 12,
    padding: 13,
    borderRadius: 11,
    backgroundColor: '#F0F9F2',
    borderWidth: 1,
    borderColor: '#D3EBDD',
    alignItems: 'center',
  },
  expectedAmountLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#79847D',
  },
  expectedAmount: {
    marginTop: 4,
    fontSize: 25,
    fontWeight: '900',
    color: '#078E46',
  },
  inputLabel: {
    marginTop: 13,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: '800',
    color: '#35403A',
  },
  amountInputContainer: {
    minHeight: 51,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5CE',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  amountInputInvalid: {
    borderColor: '#D94B4B',
  },
  amountInputValid: {
    borderColor: '#79C98A',
  },
  currencyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#078E46',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#273032',
  },
  validationError: {
    marginTop: 5,
    fontSize: 9.5,
    lineHeight: 14,
    color: '#C83D3D',
  },
  remainingBox: {
    marginTop: 9,
    padding: 10,
    borderRadius: 9,
    backgroundColor: '#FFF5DE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remainingLabel: {
    fontSize: 10,
    color: '#85611B',
  },
  remainingValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#85611B',
  },
  changeBox: {
    marginTop: 9,
    padding: 10,
    borderRadius: 9,
    backgroundColor: '#EAF8EE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeLabel: {
    fontSize: 10,
    color: '#28623A',
  },
  changeValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#078E46',
  },
  amountSuccessBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#EAF8EE',
    borderWidth: 1,
    borderColor: '#C9E7D1',
    flexDirection: 'row',
    alignItems: 'center',
  },
  successCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0A9A49',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  successCircleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  amountSuccessContent: {
    flex: 1,
  },
  amountSuccessTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#245331',
  },
  amountSuccessText: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 13,
    color: '#67746B',
  },
  cashMethodCard: {
    minHeight: 67,
    marginTop: 10,
    borderRadius: 11,
    backgroundColor: '#F6FAF7',
    borderWidth: 1,
    borderColor: '#E0E8E2',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cashIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: '#E4F6E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  cashIconText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#078E46',
  },
  cashMethodContent: {
    flex: 1,
  },
  cashMethodTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#273032',
  },
  cashMethodText: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 13,
    color: '#75807A',
  },
  selectedCheck: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#0A9A49',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  paidOnlineCard: {
    alignItems: 'center',
    backgroundColor: '#EAF8ED',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#C6E7CE',
    padding: 15,
    marginBottom: 10,
  },
  paidHeroCircle: {
    width: 61,
    height: 61,
    borderRadius: 31,
    backgroundColor: '#0A9A49',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidHeroCheck: {
    fontSize: 31,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  paidOnlineTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: '#1C3825',
    textAlign: 'center',
  },
  paidOnlineSubtitle: {
    marginTop: 5,
    fontSize: 10,
    lineHeight: 15,
    color: '#65716A',
    textAlign: 'center',
  },
  paidDetailsCard: {
    width: '100%',
    marginTop: 12,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E8E2',
    paddingHorizontal: 10,
  },
  paidDetailRow: {
    minHeight: 39,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1EE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paidDetailRowLast: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paidDetailLabel: {
    fontSize: 9.5,
    color: '#7A8580',
    flexShrink: 1,
  },
  paidDetailValue: {
    marginLeft: 8,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#394144',
  },
  paidAmount: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '900',
    color: '#078E46',
  },
  paidTransaction: {
    maxWidth: '55%',
    marginLeft: 8,
    fontSize: 9,
    fontWeight: '700',
    color: '#394144',
  },
  noCollectionText: {
    marginLeft: 8,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#078E46',
  },
  onlinePendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5EBE7',
    padding: 13,
    marginBottom: 10,
  },
  onlinePendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlinePendingIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#E5F6EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  onlinePendingIconText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#078E46',
  },
  onlinePendingHeaderText: {
    flex: 1,
  },
  onlinePendingTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#273032',
  },
  onlinePendingSubtitle: {
    marginTop: 3,
    fontSize: 9.5,
    lineHeight: 14,
    color: '#75807A',
  },
  gatewayVerificationBox: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: '#F6FAF7',
    borderWidth: 1,
    borderColor: '#E0E8E2',
    padding: 11,
    alignItems: 'center',
  },
  gatewayIcon: {
    fontSize: 22,
    color: '#078E46',
  },
  gatewayTitle: {
    marginTop: 4,
    fontSize: 11.5,
    fontWeight: '800',
    color: '#273032',
  },
  gatewayText: {
    marginTop: 4,
    fontSize: 9.5,
    lineHeight: 14,
    color: '#75807A',
    textAlign: 'center',
  },
  notesInput: {
    minHeight: 95,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#CBD5CE',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontSize: 11,
    lineHeight: 17,
    color: '#273032',
  },
  notesCounter: {
    marginTop: 4,
    fontSize: 9,
    color: '#8A938E',
    textAlign: 'right',
  },
  statusCard: {
    minHeight: 78,
    borderRadius: 13,
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#F0E1B9',
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusCardSuccess: {
    backgroundColor: '#EAF8EE',
    borderColor: '#C9E7D1',
  },
  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5E6BD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  statusIconSuccess: {
    backgroundColor: '#0A9A49',
  },
  statusIconText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#946A13',
  },
  statusIconTextSuccess: {
    color: '#FFFFFF',
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#273032',
  },
  statusDescription: {
    marginTop: 3,
    fontSize: 9.5,
    lineHeight: 14,
    color: '#707B74',
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 11,
    backgroundColor: '#079A49',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
    paddingHorizontal: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: '#AAB5AD',
  },
  primaryButtonText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    flexShrink: 1,
  },
  primaryButtonArrow: {
    marginLeft: 8,
    fontSize: 21,
    color: '#FFFFFF',
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D0D8D2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  secondaryButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#626B66',
  },
  securityCard: {
    minHeight: 72,
    borderRadius: 13,
    backgroundColor: '#F1F5F7',
    borderWidth: 1,
    borderColor: '#DFE7EB',
    padding: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  securityIcon: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: '#DDE6EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  securityIconText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#5B6D79',
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#43545E',
  },
  securityText: {
    marginTop: 3,
    fontSize: 8.5,
    lineHeight: 14,
    color: '#73818A',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  confirmModal: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    padding: 19,
  },
  confirmIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EAF8EE',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 11,
  },
  confirmIconText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#078E46',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#182022',
    textAlign: 'center',
  },
  confirmDescription: {
    marginTop: 6,
    fontSize: 10.5,
    lineHeight: 16,
    color: '#737D80',
    textAlign: 'center',
  },
  confirmAmountBox: {
    marginTop: 13,
    borderRadius: 11,
    backgroundColor: '#F0F9F2',
    borderWidth: 1,
    borderColor: '#D3EBDD',
    padding: 12,
    alignItems: 'center',
  },
  confirmAmountLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#79847D',
  },
  confirmAmount: {
    marginTop: 3,
    fontSize: 26,
    fontWeight: '900',
    color: '#078E46',
  },
  confirmMethod: {
    marginTop: 3,
    fontSize: 9.5,
    color: '#6D7872',
  },
  confirmButton: {
    minHeight: 50,
    borderRadius: 11,
    backgroundColor: '#079A49',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  confirmButtonText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelButton: {
    minHeight: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D0D8D2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#626B66',
  },
});

export default CODCollectionScreen;
