import React, { useMemo, useState } from 'react';

import {
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

import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type {
  MainStackParamList,
} from '../../../app/navigation/MainNavigator';

type CODCollectionScreenProps =
  NativeStackScreenProps<
    MainStackParamList,
    'CODCollection'
  >;

type PaymentMethod =
  | 'CASH'
  | 'ESEWA'
  | 'KHALTI';

type PaymentStatus =
  | 'PENDING'
  | 'COLLECTED';

const EXPECTED_AMOUNT = 850;

function CODCollectionScreen({
  route,
  navigation,
}: CODCollectionScreenProps) {
  const { deliveryId } = route.params;

  const [
    collectedAmount,
    setCollectedAmount,
  ] = useState(
    String(EXPECTED_AMOUNT),
  );

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState<PaymentMethod>('CASH');

  const [
    paymentStatus,
    setPaymentStatus,
  ] = useState<PaymentStatus>('PENDING');

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [
    notes,
    setNotes,
  ] = useState('');

  const [
    showConfirmModal,
    setShowConfirmModal,
  ] = useState(false);

  const numericCollectedAmount =
    useMemo(() => {
      const parsedAmount =
        Number(collectedAmount);

      if (!Number.isFinite(parsedAmount)) {
        return 0;
      }

      return parsedAmount;
    }, [collectedAmount]);

  const amountMatches =
    numericCollectedAmount ===
    EXPECTED_AMOUNT;

  const remainingAmount =
    Math.max(
      EXPECTED_AMOUNT -
        numericCollectedAmount,
      0,
    );

  const changeAmount =
    Math.max(
      numericCollectedAmount -
        EXPECTED_AMOUNT,
      0,
    );

  const handleAmountChange = (
    value: string,
  ) => {
    const numericValue =
      value.replace(/\D/g, '');

    setCollectedAmount(
      numericValue,
    );

    if (
      paymentStatus ===
      'COLLECTED'
    ) {
      setPaymentStatus('PENDING');
    }
  };

  const handlePaymentMethodChange = (
    method: PaymentMethod,
  ) => {
    if (paymentStatus === 'COLLECTED') {
      return;
    }

    setPaymentMethod(method);
    setPaymentStatus('PENDING');
  };

  const handleCollectPayment = () => {
    if (isProcessing) {
      return;
    }

    if (
      !collectedAmount.trim()
    ) {
      return;
    }

    if (
      !Number.isFinite(
        numericCollectedAmount,
      ) ||
      numericCollectedAmount <= 0
    ) {
      return;
    }

    if (!amountMatches) {
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmCollection = () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    /*
     * Temporary frontend simulation.
     *
     * Later:
     * - CASH will be recorded as cash collection.
     * - ESEWA will be verified using the backend payment gateway API.
     * - KHALTI will be verified using the backend payment gateway API.
     */
    setTimeout(() => {
      setPaymentStatus('COLLECTED');
      setIsProcessing(false);
      setShowConfirmModal(false);
    }, 400);
  };

  const handleCancelCollection = () => {
    if (isProcessing) {
      return;
    }

    setShowConfirmModal(false);
  };

  const handleContinue = () => {
    if (
      paymentStatus !==
      'COLLECTED'
    ) {
      return;
    }

    navigation.navigate(
      'DeliveryCompletion',
      {
        deliveryId,
      },
    );
  };

  const handlePaymentIssue = () => {
    navigation.navigate(
      'FailedDelivery',
      {
        deliveryId,
      },
    );
  };

  const getPaymentMethodName = () => {
    switch (paymentMethod) {
      case 'ESEWA':
        return 'eSewa';

      case 'KHALTI':
        return 'Khalti';

      case 'CASH':
      default:
        return 'Cash';
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}

          <View
            style={styles.header}
          >
            <View
              style={styles.headerIcon}
            >
              <Text
                style={
                  styles.headerIconText
                }
              >
                NPR
              </Text>
            </View>

            <View
              style={
                styles.headerTextContainer
              }
            >
              <Text
                style={styles.title}
              >
                Collect Payment
              </Text>

              <Text
                style={styles.subtitle}
              >
                Collect the payment from the
                customer before completing the
                delivery.
              </Text>
            </View>
          </View>

          {/* Order Payment */}

          <View style={styles.card}>
            <View
              style={
                styles.cardHeader
              }
            >
              <Text
                style={styles.cardTitle}
              >
                ORDER PAYMENT
              </Text>

              <View
                style={styles.codBadge}
              >
                <Text
                  style={
                    styles.codBadgeText
                  }
                >
                  COD
                </Text>
              </View>
            </View>

            <View
              style={styles.divider}
            />

            <View
              style={styles.infoRow}
            >
              <Text
                style={styles.infoLabel}
              >
                Delivery ID
              </Text>

              <Text
                style={styles.infoValue}
                numberOfLines={1}
              >
                {deliveryId}
              </Text>
            </View>

            <View
              style={styles.infoRow}
            >
              <Text
                style={styles.infoLabel}
              >
                Payment Status
              </Text>

              <Text
                style={[
                  styles.infoValue,
                  paymentStatus ===
                    'COLLECTED'
                    ? styles.collectedText
                    : styles.pendingText,
                ]}
              >
                {paymentStatus ===
                'COLLECTED'
                  ? 'Collected'
                  : 'Pending'}
              </Text>
            </View>
          </View>

          {/* Amount */}

          <View style={styles.card}>
            <Text
              style={styles.cardTitle}
            >
              AMOUNT TO COLLECT
            </Text>

            <View
              style={
                styles.expectedAmountBox
              }
            >
              <Text
                style={
                  styles.expectedAmountLabel
                }
              >
                Expected amount
              </Text>

              <Text
                style={
                  styles.expectedAmount
                }
              >
                NPR {EXPECTED_AMOUNT}
              </Text>
            </View>

            <View
              style={
                styles.amountInputContainer
              }
            >
              <Text
                style={
                  styles.currencyText
                }
              >
                NPR
              </Text>

              <TextInput
                value={collectedAmount}
                onChangeText={
                  handleAmountChange
                }
                keyboardType="number-pad"
                placeholder="Enter amount"
                placeholderTextColor="#9CA3AF"
                style={
                  styles.amountInput
                }
                editable={
                  paymentStatus !==
                  'COLLECTED'
                }
              />
            </View>

            {remainingAmount > 0 && (
              <View
                style={
                  styles.remainingBox
                }
              >
                <Text
                  style={
                    styles.remainingLabel
                  }
                >
                  Remaining
                </Text>

                <Text
                  style={
                    styles.remainingValue
                  }
                >
                  NPR {remainingAmount}
                </Text>
              </View>
            )}

            {changeAmount > 0 && (
              <View
                style={
                  styles.changeBox
                }
              >
                <Text
                  style={
                    styles.changeLabel
                  }
                >
                  Change to customer
                </Text>

                <Text
                  style={
                    styles.changeValue
                  }
                >
                  NPR {changeAmount}
                </Text>
              </View>
            )}

            {amountMatches && (
              <View
                style={
                  styles.amountSuccessBox
                }
              >
                <View
                  style={
                    styles.successCircle
                  }
                >
                  <Text
                    style={
                      styles.successCircleText
                    }
                  >
                    ✓
                  </Text>
                </View>

                <View
                  style={
                    styles.amountSuccessContent
                  }
                >
                  <Text
                    style={
                      styles.amountSuccessTitle
                    }
                  >
                    Full amount entered
                  </Text>

                  <Text
                    style={
                      styles.amountSuccessText
                    }
                  >
                    NPR {EXPECTED_AMOUNT} matches
                    the expected payment amount.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Payment Method */}

          <View style={styles.card}>
            <Text
              style={styles.cardTitle}
            >
              PAYMENT METHOD
            </Text>

            {/* Cash */}

            <Pressable
              style={[
                styles.paymentMethodCard,
                paymentMethod ===
                  'CASH' &&
                  styles.paymentMethodSelected,
              ]}
              onPress={() =>
                handlePaymentMethodChange(
                  'CASH',
                )
              }
              disabled={
                paymentStatus ===
                'COLLECTED'
              }
            >
              <View
                style={
                  styles.cashIcon
                }
              >
                <Text
                  style={
                    styles.cashIconText
                  }
                >
                  NPR
                </Text>
              </View>

              <View
                style={
                  styles.paymentMethodContent
                }
              >
                <Text
                  style={
                    styles.paymentMethodTitle
                  }
                >
                  Cash on Delivery
                </Text>

                <Text
                  style={
                    styles.paymentMethodSubtitle
                  }
                >
                  Collect the cash amount directly
                  from the customer.
                </Text>
              </View>

              {paymentMethod ===
                'CASH' && (
                <View
                  style={
                    styles.selectedCheck
                  }
                >
                  <Text
                    style={
                      styles.selectedCheckText
                    }
                  >
                    ✓
                  </Text>
                </View>
              )}
            </Pressable>

            {/* eSewa */}

            <Pressable
              style={[
                styles.paymentMethodCard,
                paymentMethod ===
                  'ESEWA' &&
                  styles.paymentMethodSelected,
              ]}
              onPress={() =>
                handlePaymentMethodChange(
                  'ESEWA',
                )
              }
              disabled={
                paymentStatus ===
                'COLLECTED'
              }
            >
              <View
                style={
                  styles.esewaIcon
                }
              >
                <Text
                  style={
                    styles.esewaIconText
                  }
                >
                  eS
                </Text>
              </View>

              <View
                style={
                  styles.paymentMethodContent
                }
              >
                <Text
                  style={
                    styles.paymentMethodTitle
                  }
                >
                  eSewa
                </Text>

                <Text
                  style={
                    styles.paymentMethodSubtitle
                  }
                >
                  Customer pays using the eSewa
                  digital wallet.
                </Text>
              </View>

              {paymentMethod ===
                'ESEWA' && (
                <View
                  style={
                    styles.selectedCheck
                  }
                >
                  <Text
                    style={
                      styles.selectedCheckText
                    }
                  >
                    ✓
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Khalti */}

            <Pressable
              style={[
                styles.paymentMethodCard,
                paymentMethod ===
                  'KHALTI' &&
                  styles.paymentMethodSelected,
              ]}
              onPress={() =>
                handlePaymentMethodChange(
                  'KHALTI',
                )
              }
              disabled={
                paymentStatus ===
                'COLLECTED'
              }
            >
              <View
                style={
                  styles.khaltiIcon
                }
              >
                <Text
                  style={
                    styles.khaltiIconText
                  }
                >
                  K
                </Text>
              </View>

              <View
                style={
                  styles.paymentMethodContent
                }
              >
                <Text
                  style={
                    styles.paymentMethodTitle
                  }
                >
                  Khalti
                </Text>

                <Text
                  style={
                    styles.paymentMethodSubtitle
                  }
                >
                  Customer pays using the Khalti
                  digital wallet.
                </Text>
              </View>

              {paymentMethod ===
                'KHALTI' && (
                <View
                  style={
                    styles.selectedCheck
                  }
                >
                  <Text
                    style={
                      styles.selectedCheckText
                    }
                  >
                    ✓
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Notes */}

          <View style={styles.card}>
            <Text
              style={styles.cardTitle}
            >
              COLLECTION NOTES
            </Text>

            <Text
              style={styles.fieldHint}
            >
              Optional note about the payment.
            </Text>

            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholder="Example: Customer paid exact amount"
              placeholderTextColor="#9CA3AF"
              textAlignVertical="top"
              style={styles.notesInput}
              editable={
                paymentStatus !==
                'COLLECTED'
              }
            />
          </View>

          {/* Payment Status */}

          <View
            style={[
              styles.statusCard,
              paymentStatus ===
                'COLLECTED' &&
                styles.statusCardSuccess,
            ]}
          >
            <View
              style={[
                styles.statusIcon,
                paymentStatus ===
                  'COLLECTED' &&
                  styles.statusIconSuccess,
              ]}
            >
              <Text
                style={
                  styles.statusIconText
                }
              >
                {paymentStatus ===
                'COLLECTED'
                  ? '✓'
                  : '₹'}
              </Text>
            </View>

            <View
              style={
                styles.statusContent
              }
            >
              <Text
                style={
                  styles.statusTitle
                }
              >
                {paymentStatus ===
                'COLLECTED'
                  ? 'Payment collected'
                  : 'Payment pending'}
              </Text>

              <Text
                style={
                  styles.statusDescription
                }
              >
                {paymentStatus ===
                'COLLECTED'
                  ? `NPR ${EXPECTED_AMOUNT} has been recorded through ${getPaymentMethodName()}.`
                  : `Confirm the payment after receiving the customer payment through ${getPaymentMethodName()}.`}
              </Text>
            </View>
          </View>

          {/* Main Action */}

          {paymentStatus ===
          'COLLECTED' ? (
            <Pressable
              style={
                styles.primaryButton
              }
              onPress={
                handleContinue
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                CONTINUE TO DELIVERY COMPLETION
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.primaryButton,
                isProcessing &&
                  styles.primaryButtonProcessing,
              ]}
              onPress={
                handleCollectPayment
              }
              disabled={isProcessing}
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {isProcessing
                  ? 'PROCESSING...'
                  : 'CONFIRM PAYMENT COLLECTION'}
              </Text>
            </Pressable>
          )}

          {/* Payment Issue */}

          {paymentStatus !==
            'COLLECTED' && (
            <Pressable
              style={
                styles.secondaryAction
              }
              onPress={
                handlePaymentIssue
              }
            >
              <Text
                style={
                  styles.secondaryActionText
                }
              >
                PAYMENT ISSUE
              </Text>
            </Pressable>
          )}

          {/* Security */}

          <View
            style={
              styles.securityCard
            }
          >
            <Text
              style={
                styles.securityTitle
              }
            >
              PAYMENT SECURITY
            </Text>

            <Text
              style={
                styles.securityText
              }
            >
              Verify the payment carefully before
              confirming collection. In the production
              version, cash, eSewa and Khalti payments
              will be validated and recorded by the
              backend.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Payment Confirmation Modal */}

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={
          handleCancelCollection
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.confirmModal
            }
          >
            <View
              style={
                styles.confirmIcon
              }
            >
              <Text
                style={
                  styles.confirmIconText
                }
              >
                NPR
              </Text>
            </View>

            <Text
              style={
                styles.confirmTitle
              }
            >
              Confirm Payment Collection
            </Text>

            <Text
              style={
                styles.confirmDescription
              }
            >
              Please confirm that you have received
              the complete payment from the customer.
            </Text>

            <View
              style={
                styles.confirmAmountBox
              }
            >
              <Text
                style={
                  styles.confirmAmountLabel
                }
              >
                Amount collected
              </Text>

              <Text
                style={
                  styles.confirmAmount
                }
              >
                NPR {EXPECTED_AMOUNT}
              </Text>

              <Text
                style={
                  styles.confirmMethod
                }
              >
                Payment method: {getPaymentMethodName()}
              </Text>
            </View>

            <Pressable
              style={
                styles.confirmButton
              }
              onPress={
                handleConfirmCollection
              }
              disabled={isProcessing}
            >
              <Text
                style={
                  styles.confirmButtonText
                }
              >
                {isProcessing
                  ? 'PROCESSING...'
                  : 'CONFIRM COLLECTION'}
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.cancelButton
              }
              onPress={
                handleCancelCollection
              }
              disabled={isProcessing}
            >
              <Text
                style={
                  styles.cancelButtonText
                }
              >
                CANCEL
              </Text>
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
    backgroundColor: '#F7F8FA',
  },

  flex: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E8F7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerIconText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E8E4A',
  },

  headerTextContainer: {
    flex: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    marginTop: 3,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#374151',
  },

  codBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFF7E6',
  },

  codBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B7791F',
  },

  divider: {
    height: 1,
    backgroundColor: '#EEF0F2',
    marginVertical: 14,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
  },

  infoValue: {
    flex: 1,
    marginLeft: 18,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },

  pendingText: {
    color: '#D97706',
  },

  collectedText: {
    color: '#1E8E4A',
  },

  expectedAmountBox: {
    alignItems: 'center',
    padding: 16,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAF9',
  },

  expectedAmountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },

  expectedAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#111827',
  },

  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#D9DEE3',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },

  currencyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E8E4A',
    marginRight: 10,
  },

  amountInput: {
    flex: 1,
    minHeight: 52,
    fontSize: 21,
    fontWeight: '800',
    color: '#111827',
  },

  remainingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFF7E6',
  },

  remainingLabel: {
    fontSize: 12,
    color: '#8A5A00',
  },

  remainingValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B7791F',
  },

  changeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EEF6FF',
  },

  changeLabel: {
    fontSize: 12,
    color: '#245A91',
  },

  changeValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#245A91',
  },

  amountSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EAF8EF',
  },

  successCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1E8E4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  successCircleText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  amountSuccessContent: {
    flex: 1,
  },

  amountSuccessTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },

  amountSuccessText: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    color: '#3F6F50',
  },

  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 14,
    borderRadius: 13,
    borderWidth: 1.3,
    borderColor: '#E0E4E8',
    backgroundColor: '#FFFFFF',
  },

  paymentMethodSelected: {
    borderWidth: 1.5,
    borderColor: '#1E8E4A',
    backgroundColor: '#F2FBF5',
  },

  paymentMethodContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },

  paymentMethodSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: '#64746A',
    marginTop: 3,
  },

  cashIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E0F2E5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cashIconText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1E8E4A',
  },

  esewaIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DFF5E7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  esewaIconText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#36B54A',
  },

  khaltiIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFE8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  khaltiIconText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#5D2CA8',
  },

  selectedCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1E8E4A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedCheckText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  fieldHint: {
    fontSize: 11,
    color: '#7A818A',
    marginTop: 5,
    marginBottom: 10,
  },

  notesInput: {
    minHeight: 95,
    borderWidth: 1,
    borderColor: '#D9DEE3',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#FFF9EC',
    borderWidth: 1,
    borderColor: '#F4E2AE',
    marginBottom: 14,
  },

  statusCardSuccess: {
    backgroundColor: '#EAF8EF',
    borderColor: '#B9E4C7',
  },

  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7DFA8',
    marginRight: 12,
  },

  statusIconSuccess: {
    backgroundColor: '#1E8E4A',
  },

  statusIconText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#7A5200',
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  statusDescription: {
    fontSize: 11,
    lineHeight: 17,
    color: '#68717B',
    marginTop: 3,
  },

  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: '#1E8E4A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  primaryButtonProcessing: {
    opacity: 0.65,
  },

  primaryButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.35,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  secondaryAction: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8DEE3',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  secondaryActionText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    color: '#B42318',
  },

  securityCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F0F4F8',
    borderWidth: 1,
    borderColor: '#E0E6EB',
  },

  securityTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    color: '#4B5563',
    marginBottom: 5,
  },

  securityText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#6B7280',
  },

  /* Confirmation Modal */

  modalBackdrop: {
    flex: 1,
    backgroundColor:
      'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  confirmModal: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 22,
  },

  confirmIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E8F7ED',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },

  confirmIconText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E8E4A',
  },

  confirmTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },

  confirmDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },

  confirmAmountBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#F5FAF6',
    borderWidth: 1,
    borderColor: '#D7EBDC',
    alignItems: 'center',
  },

  confirmAmountLabel: {
    fontSize: 11,
    color: '#6B7280',
  },

  confirmAmount: {
    fontSize: 27,
    fontWeight: '900',
    color: '#1E8E4A',
    marginTop: 4,
  },

  confirmMethod: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 5,
  },

  confirmButton: {
    minHeight: 52,
    borderRadius: 13,
    backgroundColor: '#1E8E4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  confirmButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
    color: '#FFFFFF',
  },

  cancelButton: {
    minHeight: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#D8DEE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  cancelButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#59616B',
  },
});

export default CODCollectionScreen;