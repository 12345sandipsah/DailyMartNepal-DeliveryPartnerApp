import React, { useState } from 'react';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type FailedDeliveryRouteParams = {
  deliveryId: string;
};

type FailedDeliveryRoute = {
  key: string;
  name: 'FailedDelivery';
  params: FailedDeliveryRouteParams;
};

type FailureReason =
  | 'CUSTOMER_UNAVAILABLE'
  | 'WRONG_ADDRESS'
  | 'CUSTOMER_REFUSED'
  | 'RESCHEDULE_REQUESTED'
  | 'UNABLE_TO_LOCATE'
  | 'CUSTOMER_UNREACHABLE'
  | 'PACKAGE_DAMAGED_OR_MISSING'
  | 'VEHICLE_BREAKDOWN'
  | 'EMERGENCY'
  | 'PAYMENT_ISSUE'
  | 'OTHER';

type FailedDeliveryNavigationProp =
  NativeStackNavigationProp<MainStackParamList>;

type FailureReasonOption = {
  value: FailureReason;
  title: string;
  description: string;
};

const FAILURE_REASONS: FailureReasonOption[] = [
  {
    value: 'CUSTOMER_UNAVAILABLE',
    title: 'Customer unavailable',
    description:
      'Customer is not available at the delivery location.',
  },
  {
    value: 'WRONG_ADDRESS',
    title: 'Wrong address',
    description:
      'The provided delivery address is incorrect or invalid.',
  },
  {
    value: 'CUSTOMER_REFUSED',
    title: 'Customer refused',
    description:
      'The customer refused to receive the order.',
  },
  {
    value: 'RESCHEDULE_REQUESTED',
    title: 'Customer requested reschedule',
    description:
      'The customer requested that delivery be attempted later.',
  },
  {
    value: 'UNABLE_TO_LOCATE',
    title: 'Unable to locate customer',
    description:
      'The customer or delivery point could not be located.',
  },
  {
    value: 'CUSTOMER_UNREACHABLE',
    title: 'Customer unreachable',
    description:
      'The customer could not be contacted by phone.',
  },
  {
    value: 'PACKAGE_DAMAGED_OR_MISSING',
    title: 'Damaged or missing package',
    description:
      'The package is damaged, incomplete, or unavailable.',
  },
  {
    value: 'VEHICLE_BREAKDOWN',
    title: 'Vehicle breakdown',
    description:
      'The delivery vehicle cannot continue the delivery.',
  },
  {
    value: 'EMERGENCY',
    title: 'Emergency',
    description:
      'An emergency prevents the delivery from continuing.',
  },
  {
    value: 'PAYMENT_ISSUE',
    title: 'Payment issue',
    description:
      'A payment or collection issue prevents completion.',
  },
  {
    value: 'OTHER',
    title: 'Other',
    description:
      'Another delivery issue that is not listed above.',
  },
];

function FailedDeliveryScreen() {
  const navigation =
    useNavigation<FailedDeliveryNavigationProp>();

  const route =
    useRoute() as FailedDeliveryRoute;

  const { deliveryId } = route.params;

  const [selectedReason, setSelectedReason] =
    useState<FailureReason | null>(null);

  const [notes, setNotes] = useState('');

  const [isSubmitted, setIsSubmitted] =
    useState(false);

  const selectedReasonDetails =
    FAILURE_REASONS.find(
      reason => reason.value === selectedReason,
    );

  const isReschedule =
    selectedReason === 'RESCHEDULE_REQUESTED';

  const isOther =
    selectedReason === 'OTHER';

  const isSubmitDisabled =
    selectedReason === null ||
    (isOther && notes.trim().length === 0) ||
    (isReschedule && notes.trim().length === 0);

  const handleSelectReason = (
    reason: FailureReason,
  ) => {
    setSelectedReason(reason);
  };

  const handleSubmit = () => {
    if (selectedReason === null) {
      Alert.alert(
        'Reason Required',
        'Please select a delivery failure reason before continuing.',
      );

      return;
    }

    if (
      (isOther || isReschedule) &&
      notes.trim().length === 0
    ) {
      Alert.alert(
        isReschedule
          ? 'Reschedule Details Required'
          : 'Additional Details Required',
        isReschedule
          ? 'Please enter the customer-requested reschedule details.'
          : 'Please provide additional details for this issue.',
      );

      return;
    }

    const actionTitle = isReschedule
      ? 'Submit Reschedule Request'
      : 'Report Failed Delivery';

    const actionMessage = isReschedule
      ? 'Are you sure you want to submit this delivery reschedule request?'
      : 'Are you sure you want to report this delivery as failed?';

    Alert.alert(
      actionTitle,
      actionMessage,
      [
        {
          text: 'CANCEL',
          style: 'cancel',
        },
        {
          text: 'CONFIRM',
          onPress: () => {
            /*
             * Temporary frontend behavior.
             *
             * Backend will later validate:
             * - authenticated delivery partner
             * - partner assignment
             * - order ownership
             * - current delivery state
             * - failure reason
             * - reschedule rules
             * - authorization
             * - activity/audit logging
             */

            setIsSubmitted(true);
          },
        },
      ],
    );
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleReturnToHome = () => {
    navigation.navigate('Home');
  };

  if (isSubmitted) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={[
          'top',
          'left',
          'right',
        ]}
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* Header */}

          <View style={styles.header}>
            <View
              style={
                styles.headerTextContainer
              }
            >
              <Text
                style={
                  styles.pageLabel
                }
              >
                Delivery Update
              </Text>

              <Text
                style={
                  styles.orderId
                }
              >
                {deliveryId}
              </Text>
            </View>

            <View
              style={[
                styles.headerBadge,
                isReschedule
                  ? styles.headerBadgeReschedule
                  : styles.headerBadgeFailed,
              ]}
            >
              <Text
                style={[
                  styles.headerBadgeText,
                  isReschedule
                    ? styles.headerBadgeTextReschedule
                    : styles.headerBadgeTextFailed,
                ]}
              >
                {isReschedule
                  ? 'RESCHEDULED'
                  : 'FAILED'}
              </Text>
            </View>
          </View>

          {/* Result */}

          <View
            style={[
              styles.resultCard,
              isReschedule
                ? styles.resultCardReschedule
                : styles.resultCardFailed,
            ]}
          >
            <View
              style={[
                styles.resultIcon,
                isReschedule
                  ? styles.resultIconReschedule
                  : styles.resultIconFailed,
              ]}
            >
              <Text
                style={
                  styles.resultIconText
                }
              >
                {isReschedule
                  ? '↻'
                  : '×'}
              </Text>
            </View>

            <Text
              style={
                styles.resultTitle
              }
            >
              {isReschedule
                ? 'Reschedule Request Recorded'
                : 'Delivery Marked as Failed'}
            </Text>

            <Text
              style={
                styles.resultDescription
              }
            >
              {isReschedule
                ? 'The customer reschedule request has been recorded in the current frontend flow.'
                : 'The delivery issue has been recorded in the current frontend flow.'}
            </Text>

            <View
              style={
                styles.resultStatus
              }
            >
              <View
                style={[
                  styles.resultStatusDot,
                  isReschedule
                    ? styles.resultStatusDotReschedule
                    : styles.resultStatusDotFailed,
                ]}
              />

              <Text
                style={[
                  styles.resultStatusText,
                  isReschedule
                    ? styles.resultStatusTextReschedule
                    : styles.resultStatusTextFailed,
                ]}
              >
                {isReschedule
                  ? 'RESCHEDULE REQUEST'
                  : 'DELIVERY FAILED'}
              </Text>
            </View>
          </View>

          {/* Recorded Information */}

          <View style={styles.card}>
            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={
                  styles.stepNumber
                }
              >
                <Text
                  style={
                    styles.stepNumberText
                  }
                >
                  ✓
                </Text>
              </View>

              <View
                style={
                  styles.sectionHeaderText
                }
              >
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  Recorded Information
                </Text>

                <Text
                  style={
                    styles.cardSubtitle
                  }
                >
                  Summary of the issue reported for this
                  delivery.
                </Text>
              </View>
            </View>

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.infoLabel
                }
              >
                Order ID
              </Text>

              <Text
                style={
                  styles.infoValue
                }
              >
                {deliveryId}
              </Text>
            </View>

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.infoLabel
                }
              >
                Reason
              </Text>

              <Text
                style={
                  styles.infoValue
                }
              >
                {selectedReasonDetails?.title ??
                  'Not specified'}
              </Text>
            </View>

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={
                  styles.infoLabel
                }
              >
                Outcome
              </Text>

              <Text
                style={[
                  styles.infoValue,
                  isReschedule
                    ? styles.rescheduleValue
                    : styles.failedValue,
                ]}
              >
                {isReschedule
                  ? 'Reschedule requested'
                  : 'Delivery failed'}
              </Text>
            </View>

            {notes.trim().length > 0 && (
              <View
                style={
                  styles.infoRowLast
                }
              >
                <Text
                  style={
                    styles.infoLabel
                  }
                >
                  Details
                </Text>

                <Text
                  style={
                    styles.infoValueLong
                  }
                >
                  {notes.trim()}
                </Text>
              </View>
            )}
          </View>

          {/* Backend Notice */}

          <View
            style={
              styles.backendNotice
            }
          >
            <Text
              style={
                styles.backendNoticeTitle
              }
            >
              Backend integration comes next
            </Text>

            <Text
              style={
                styles.backendNoticeText
              }
            >
              The current screen simulates the frontend
              result. Later, the backend will securely
              validate and record the delivery failure or
              reschedule request.
            </Text>
          </View>

          {/* Actions */}

          <Pressable
            style={
              styles.primaryButton
            }
            onPress={
              handleReturnToHome
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              BACK TO HOME
            </Text>
          </Pressable>

          <Pressable
            style={
              styles.secondaryButton
            }
            onPress={
              handleBack
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              BACK TO DELIVERY
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        'top',
        'left',
        'right',
      ]}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* Header */}

        <View style={styles.header}>
          <View
            style={
              styles.headerTextContainer
            }
          >
            <Text
              style={
                styles.pageLabel
              }
            >
              Delivery Issue
            </Text>

            <Text
              style={
                styles.orderId
              }
            >
              {deliveryId}
            </Text>
          </View>

          <View
            style={
              styles.headerBadge
            }
          >
            <Text
              style={
                styles.headerBadgeText
              }
            >
              ACTION REQUIRED
            </Text>
          </View>
        </View>

        {/* Progress */}

        <View
          style={
            styles.progressCard
          }
        >
          <View
            style={
              styles.progressHeader
            }
          >
            <Text
              style={
                styles.progressTitle
              }
            >
              Delivery issue reporting
            </Text>

            <Text
              style={
                styles.progressCount
              }
            >
              {selectedReason
                ? '1 / 1'
                : '0 / 1'}
            </Text>
          </View>

          <View
            style={
              styles.progressTrack
            }
          >
            <View
              style={[
                styles.progressFill,
                selectedReason &&
                  styles.progressFillComplete,
              ]}
            />
          </View>

          <Text
            style={
              styles.progressDescription
            }
          >
            Select the reason that best describes why this
            delivery cannot currently be completed.
          </Text>
        </View>

        {/* Reason Selection */}

        <View style={styles.card}>
          <View
            style={
              styles.sectionHeader
            }
          >
            <View
              style={
                styles.stepNumber
              }
            >
              <Text
                style={
                  styles.stepNumberText
                }
              >
                1
              </Text>
            </View>

            <View
              style={
                styles.sectionHeaderText
              }
            >
              <Text
                style={
                  styles.cardTitle
                }
              >
                Select Issue
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }
              >
                Choose one controlled reason for the delivery
                outcome.
              </Text>
            </View>
          </View>

          <View>
            {FAILURE_REASONS.map(
              reason => {
                const isSelected =
                  selectedReason ===
                  reason.value;

                return (
                  <Pressable
                    key={reason.value}
                    style={[
                      styles.reasonOption,
                      isSelected &&
                        styles.reasonOptionSelected,
                    ]}
                    onPress={() =>
                      handleSelectReason(
                        reason.value,
                      )
                    }
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected &&
                          styles.radioOuterSelected,
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={
                            styles.radioInner
                          }
                        />
                      )}
                    </View>

                    <View
                      style={
                        styles.reasonContent
                      }
                    >
                      <Text
                        style={[
                          styles.reasonTitle,
                          isSelected &&
                            styles.reasonTitleSelected,
                        ]}
                      >
                        {reason.title}
                      </Text>

                      <Text
                        style={
                          styles.reasonDescription
                        }
                      >
                        {reason.description}
                      </Text>
                    </View>
                  </Pressable>
                );
              },
            )}
          </View>
        </View>

        {/* Additional Details */}

        {selectedReason !== null && (
          <View style={styles.card}>
            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={
                  styles.stepNumber
                }
              >
                <Text
                  style={
                    styles.stepNumberText
                  }
                >
                  2
                </Text>
              </View>

              <View
                style={
                  styles.sectionHeaderText
                }
              >
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  {isReschedule
                  ? 'Reschedule Details'
                  : 'Additional Details'}
                </Text>

                <Text
                  style={
                    styles.cardSubtitle
                  }
                >
                  {isReschedule
                    ? 'Enter any timing or customer information that will help with the reschedule request.'
                    : isOther
                      ? 'Please describe the issue so it can be reviewed.'
                      : 'Add any useful information about what happened.'}
                </Text>
              </View>
            </View>

            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholder={
                isReschedule
                  ? 'Example: Customer requested delivery tomorrow evening.'
                  : 'Enter additional details...'
              }
              placeholderTextColor="#A3AAA3"
              style={
                styles.notesInput
              }
              maxLength={500}
            />

            <Text
              style={
                styles.characterCount
              }
            >
              {notes.length}/500
            </Text>
          </View>
        )}

        {/* Selected Summary */}

        {selectedReason !== null && (
          <View
            style={
              styles.summaryCard
            }
          >
            <View
              style={
                styles.summaryIcon
              }
            >
              <Text
                style={
                  styles.summaryIconText
                }
              >
                !
              </Text>
            </View>

            <View
              style={
                styles.summaryContent
              }
            >
              <Text
                style={
                  styles.summaryTitle
                }
              >
                Selected Outcome
              </Text>

              <Text
                style={
                  styles.summaryReason
                }
              >
                {selectedReasonDetails?.title}
              </Text>

              <Text
                style={
                  styles.summaryDescription
                }
              >
                {isReschedule
                  ? 'This will submit a reschedule request instead of a final delivery failure.'
                  : 'This will report the current delivery attempt as failed.'}
              </Text>
            </View>
          </View>
        )}

        {/* Submit */}

        <Pressable
          style={[
            styles.primaryButton,
            isSubmitDisabled &&
              styles.primaryButtonDisabled,
          ]}
          onPress={
            handleSubmit
          }
          disabled={
            isSubmitDisabled
          }
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            {isReschedule
              ? 'SUBMIT RESCHEDULE REQUEST'
              : 'REPORT FAILED DELIVERY'}
          </Text>
        </Pressable>

        {/* Back */}

        <Pressable
          style={
            styles.secondaryButton
          }
          onPress={
            handleBack
          }
        >
          <Text
            style={
              styles.secondaryButtonText
            }
          >
            BACK TO ACTIVE DELIVERY
          </Text>
        </Pressable>
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

  headerBadgeFailed: {
    backgroundColor: '#FDECEC',
  },

  headerBadgeReschedule: {
    backgroundColor: '#FFF8E1',
  },

  headerBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#B26A00',
  },

  headerBadgeTextFailed: {
    color: '#C62828',
  },

  headerBadgeTextReschedule: {
    color: '#A66A00',
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
    width: '0%',
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 4,
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

  reasonOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 13,
    marginBottom: 9,
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E9E4',
  },

  reasonOptionSelected: {
    backgroundColor: '#EEF8EF',
    borderColor: '#81C784',
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#B7C0B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    marginTop: 1,
  },

  radioOuterSelected: {
    borderColor: '#2E7D32',
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
  },

  reasonContent: {
    flex: 1,
  },

  reasonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },

  reasonTitleSelected: {
    color: '#2E7D32',
  },

  reasonDescription: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    color: '#7A827A',
  },

  notesInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#C9D0C9',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 12,
    lineHeight: 18,
    color: '#1F2937',
  },

  characterCount: {
    marginTop: 6,
    textAlign: 'right',
    fontSize: 9,
    color: '#929992',
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E8',
    borderRadius: 14,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1D99A',
  },

  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#B87800',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  summaryIconText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#786331',
  },

  summaryReason: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '700',
    color: '#4B3A00',
  },

  summaryDescription: {
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

  primaryButtonDisabled: {
    backgroundColor: '#B7C0B7',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.35,
    textAlign: 'center',
    paddingHorizontal: 10,
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

  /*
   * --------------------------------------------------
   * Submitted result
   * --------------------------------------------------
   */

  resultCard: {
    alignItems: 'center',
    borderRadius: 17,
    padding: 24,
    marginBottom: 15,
    borderWidth: 1,
  },

  resultCardFailed: {
    backgroundColor: '#FFF0F0',
    borderColor: '#F1B7B7',
  },

  resultCardReschedule: {
    backgroundColor: '#FFF9E8',
    borderColor: '#F0D28C',
  },

  resultIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  resultIconFailed: {
    backgroundColor: '#C62828',
  },

  resultIconReschedule: {
    backgroundColor: '#B87800',
  },

  resultIconText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },

  resultTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },

  resultDescription: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 17,
    color: '#667066',
    textAlign: 'center',
  },

  resultStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
  },

  resultStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  resultStatusDotFailed: {
    backgroundColor: '#C62828',
  },

  resultStatusDotReschedule: {
    backgroundColor: '#B87800',
  },

  resultStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  resultStatusTextFailed: {
    color: '#C62828',
  },

  resultStatusTextReschedule: {
    color: '#A66A00',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F0',
  },

  infoRowLast: {
    paddingTop: 11,
  },

  infoLabel: {
    flex: 0.9,
    fontSize: 12,
    color: '#7A827A',
    paddingRight: 12,
  },

  infoValue: {
    flex: 1.1,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'right',
  },

  infoValueLong: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'left',
  },

  failedValue: {
    color: '#C62828',
  },

  rescheduleValue: {
    color: '#A66A00',
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

export default FailedDeliveryScreen;