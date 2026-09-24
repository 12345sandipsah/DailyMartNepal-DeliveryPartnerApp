import React, { useState } from 'react';
import {
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
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

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

// Temporary customer phone number.
// This will come from the backend later.
const CUSTOMER_PHONE = '+977 98XXXXXXXX';

function ActiveDeliveryScreen({
  route,
  navigation,
}: ActiveDeliveryScreenProps) {
  const typedNavigation =
    navigation as ActiveDeliveryNavigationProp;

  const { deliveryId } = route.params;

  const [deliveryStarted, setDeliveryStarted] = useState(false);

  const [showInstructions, setShowInstructions] =
    useState(true);

  const [contactIssue, setContactIssue] =
    useState<ContactIssueType | null>(null);

  const [
    isContactIssueModalVisible,
    setIsContactIssueModalVisible,
  ] = useState(false);

  const handleStartDelivery = () => {
    setDeliveryStarted(true);

    // Real delivery-state update will be connected
    // to the backend later.
  };

  const handleNavigation = () => {
    typedNavigation.navigate('Navigation', {
      deliveryId,
    });
  };

  const handleCallCustomer = async () => {
    const phoneNumber =
      CUSTOMER_PHONE.replace(/\D/g, '');

    if (
      !phoneNumber ||
      CUSTOMER_PHONE.includes('X')
    ) {
      Alert.alert(
        'Customer Phone Unavailable',
        'The customer phone number will be available after the delivery data is loaded from the backend.',
      );

      return;
    }

    try {
      const phoneUrl = `tel:${phoneNumber}`;

      const canOpen =
        await Linking.canOpenURL(phoneUrl);

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
    const phoneNumber =
      CUSTOMER_PHONE.replace(/\D/g, '');

    if (
      !phoneNumber ||
      CUSTOMER_PHONE.includes('X')
    ) {
      Alert.alert(
        'Customer Phone Unavailable',
        'The customer phone number will be available after the delivery data is loaded from the backend.',
      );

      return;
    }

    try {
      const smsUrl = `sms:${phoneNumber}`;

      const canOpen =
        await Linking.canOpenURL(smsUrl);

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

  const handleSelectContactIssue = (
    issue: ContactIssueType,
  ) => {
    setContactIssue(issue);
    setIsContactIssueModalVisible(false);

    // This will later become a backend API event.
  };

  const handleClearContactIssue = () => {
    setContactIssue(null);
  };

  // Normal successful delivery path.
  // This opens QR/barcode + customer OTP verification.
  const handleProceedToVerification = () => {
    typedNavigation.navigate('DeliveryVerification', {
      deliveryId,
    });
  };

  // Separate failure path.
  const handleReportDeliveryIssue = () => {
    typedNavigation.navigate('FailedDelivery', {
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
          <View>
            <Text style={styles.pageLabel}>
              Active Delivery
            </Text>

            <Text style={styles.orderId}>
              {deliveryId}
            </Text>
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
                : 'PICKED UP'}
            </Text>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Customer
          </Text>

          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text
                style={
                  styles.customerAvatarText
                }
              >
                C
              </Text>
            </View>

            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>
                Customer
              </Text>

              <Text style={styles.customerPhone}>
                {CUSTOMER_PHONE}
              </Text>
            </View>
          </View>

          {/* Customer contact actions */}
          <View style={styles.contactActions}>
            <Pressable
              style={
                styles.primaryContactButton
              }
              onPress={handleCallCustomer}
            >
              <Text
                style={
                  styles.primaryContactButtonText
                }
              >
                Call Customer
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.secondaryContactButton
              }
              onPress={
                handleMessageCustomer
              }
            >
              <Text
                style={
                  styles.secondaryContactButtonText
                }
              >
                Message
              </Text>
            </Pressable>
          </View>

          {/* Optional customer contact issue */}
          <View
            style={
              styles.contactIssueSection
            }
          >
            <View
              style={
                styles.contactIssueHeader
              }
            >
              <View
                style={
                  styles.contactIssueInfo
                }
              >
                <Text
                  style={
                    styles.contactIssueTitle
                  }
                >
                  Customer Contact Issue
                </Text>

                <Text
                  style={
                    styles.contactIssueDescription
                  }
                >
                  Record a problem only when
                  customer communication cannot
                  proceed normally.
                </Text>
              </View>

              <Pressable
                style={
                  styles.contactIssueButton
                }
                onPress={
                  handleOpenContactIssueModal
                }
              >
                <Text
                  style={
                    styles.contactIssueButtonText
                  }
                >
                  Record
                </Text>
              </Pressable>
            </View>

            {contactIssue !== null && (
              <View
                style={
                  styles.contactIssueSelected
                }
              >
                <View
                  style={
                    styles.contactIssueSelectedIcon
                  }
                >
                  <Text
                    style={
                      styles.contactIssueSelectedIconText
                    }
                  >
                    !
                  </Text>
                </View>

                <View
                  style={
                    styles.contactIssueSelectedInfo
                  }
                >
                  <Text
                    style={
                      styles.contactIssueSelectedLabel
                    }
                  >
                    Current issue
                  </Text>

                  <Text
                    style={
                      styles.contactIssueSelectedValue
                    }
                  >
                    {
                      CONTACT_ISSUE_LABELS[
                        contactIssue
                      ]
                    }
                  </Text>
                </View>

                <Pressable
                  style={
                    styles.clearIssueButton
                  }
                  onPress={
                    handleClearContactIssue
                  }
                >
                  <Text
                    style={
                      styles.clearIssueButtonText
                    }
                  >
                    Clear
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Delivery location */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Delivery Location
          </Text>

          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Text
                style={
                  styles.locationIconText
                }
              >
                ●
              </Text>
            </View>

            <View style={styles.locationInfo}>
              <Text
                style={styles.locationTitle}
              >
                Customer Address
              </Text>

              <Text
                style={
                  styles.locationAddress
                }
              >
                Birgunj, Parsa, Nepal
              </Text>
            </View>
          </View>

          <View
            style={styles.locationMetrics}
          >
            <View style={styles.metric}>
              <Text
                style={styles.metricLabel}
              >
                Distance
              </Text>

              <Text
                style={styles.metricValue}
              >
                2.4 km
              </Text>
            </View>

            <View
              style={styles.metricDivider}
            />

            <View style={styles.metric}>
              <Text
                style={styles.metricLabel}
              >
                Estimated arrival
              </Text>

              <Text
                style={styles.metricValue}
              >
                12 min
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.navigationButton}
            onPress={handleNavigation}
          >
            <Text
              style={
                styles.navigationButtonText
              }
            >
              Open Navigation
            </Text>
          </Pressable>
        </View>

        {/* Order summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Order Summary
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
              Payment
            </Text>

            <Text style={styles.infoValue}>
              COD
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Amount to collect
            </Text>

            <Text style={styles.totalAmount}>
              NPR 850
            </Text>
          </View>
        </View>

        {/* Delivery instructions */}
        <View style={styles.card}>
          <View
            style={
              styles.instructionsHeader
            }
          >
            <Text style={styles.cardTitle}>
              Delivery Instructions
            </Text>

            <Pressable
              style={
                styles.instructionsToggle
              }
              onPress={() =>
                setShowInstructions(
                  current => !current,
                )
              }
            >
              <Text
                style={
                  styles.instructionsToggleText
                }
              >
                {showInstructions
                  ? 'Hide'
                  : 'View'}
              </Text>
            </Pressable>
          </View>

          {showInstructions && (
            <View
              style={
                styles.instructionsBox
              }
            >
              <Text
                style={styles.instructions}
              >
                Please call the customer when
                you are near the delivery location
                and follow the customer instructions.
              </Text>
            </View>
          )}
        </View>

        {/* Current status */}
        <View style={styles.statusCard}>
          <View
            style={styles.statusIndicator}
          >
            <View
              style={[
                styles.statusIndicatorDot,
                deliveryStarted &&
                  styles.statusIndicatorDotActive,
              ]}
            />
          </View>

          <View
            style={styles.statusContent}
          >
            <Text
              style={styles.statusCardTitle}
            >
              {deliveryStarted
                ? 'Delivery in progress'
                : 'Ready to start delivery'}
            </Text>

            <Text
              style={styles.statusCardText}
            >
              {deliveryStarted
                ? 'Navigate to the customer location and complete the delivery verification.'
                : 'Start delivery when you leave the warehouse with the package.'}
            </Text>
          </View>
        </View>

        {/* Delivery verification */}
        {deliveryStarted && (
          <View
            style={styles.verificationCard}
          >
            <View
              style={styles.verificationHeader}
            >
              <View
                style={styles.verificationIcon}
              >
                <Text
                  style={
                    styles.verificationIconText
                  }
                >
                  ✓
                </Text>
              </View>

              <View
                style={
                  styles.verificationContent
                }
              >
                <Text
                  style={styles.verificationTitle}
                >
                  Ready for Delivery Verification
                </Text>

                <Text
                  style={
                    styles.verificationDescription
                  }
                >
                  Continue to package
                  QR/barcode scanning and
                  customer OTP verification.
                </Text>
              </View>
            </View>

            <Pressable
              style={
                styles.verificationButton
              }
              onPress={
                handleProceedToVerification
              }
            >
              <Text
                style={
                  styles.verificationButtonText
                }
              >
                CONTINUE TO VERIFICATION
              </Text>
            </Pressable>
          </View>
        )}

        {/* Optional failure path */}
        {deliveryStarted && (
          <View
            style={
              styles.deliveryIssueCard
            }
          >
            <View
              style={
                styles.deliveryIssueHeader
              }
            >
              <View
                style={
                  styles.deliveryIssueIcon
                }
              >
                <Text
                  style={
                    styles.deliveryIssueIconText
                  }
                >
                  !
                </Text>
              </View>

              <View
                style={
                  styles.deliveryIssueContent
                }
              >
                <Text
                  style={
                    styles.deliveryIssueTitle
                  }
                >
                  Unable to complete delivery?
                </Text>

                <Text
                  style={
                    styles.deliveryIssueDescription
                  }
                >
                  Report a delivery problem or
                  submit a customer reschedule
                  request using the controlled
                  reasons.
                </Text>
              </View>
            </View>

            <Pressable
              style={
                styles.deliveryIssueButton
              }
              onPress={
                handleReportDeliveryIssue
              }
            >
              <Text
                style={
                  styles.deliveryIssueButtonText
                }
              >
                REPORT DELIVERY ISSUE
              </Text>
            </Pressable>
          </View>
        )}

        {/* Primary action */}
        {!deliveryStarted ? (
          <Pressable
            style={styles.startButton}
            onPress={handleStartDelivery}
          >
            <Text
              style={styles.startButtonText}
            >
              START DELIVERY
            </Text>
          </Pressable>
        ) : (
          <View
            style={styles.startedBanner}
          >
            <View style={styles.startedIcon}>
              <Text
                style={styles.startedIconText}
              >
                ✓
              </Text>
            </View>

            <View
              style={styles.startedContent}
            >
              <Text
                style={styles.startedTitle}
              >
                Delivery Started
              </Text>

              <Text
                style={styles.startedText}
              >
                You are now out for delivery.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Customer Contact Issue Modal */}
      <Modal
        visible={
          isContactIssueModalVisible
        }
        transparent
        animationType="slide"
        onRequestClose={
          handleCloseContactIssueModal
        }
      >
        <View
          style={styles.modalBackdrop}
        >
          <View style={styles.issueModal}>
            <View
              style={styles.issueModalHeader}
            >
              <View
                style={
                  styles.issueModalHeaderContent
                }
              >
                <Text
                  style={styles.issueModalTitle}
                >
                  Customer Contact Issue
                </Text>

                <Text
                  style={
                    styles.issueModalSubtitle
                  }
                >
                  Select a reason only when it
                  actually applies.
                </Text>
              </View>

              <Pressable
                style={
                  styles.modalCloseButton
                }
                onPress={
                  handleCloseContactIssueModal
                }
                accessibilityLabel="Close customer contact issue"
              >
                <Text
                  style={
                    styles.modalCloseButtonText
                  }
                >
                  ×
                </Text>
              </Pressable>
            </View>

            <View
              style={styles.issueOptions}
            >
              <Pressable
                style={styles.issueOption}
                onPress={() =>
                  handleSelectContactIssue(
                    'CUSTOMER_UNREACHABLE',
                  )
                }
              >
                <View
                  style={
                    styles.issueOptionIcon
                  }
                >
                  <Text
                    style={
                      styles.issueOptionIconText
                    }
                  >
                    !
                  </Text>
                </View>

                <View
                  style={
                    styles.issueOptionContent
                  }
                >
                  <Text
                    style={
                      styles.issueOptionTitle
                    }
                  >
                    Customer unreachable
                  </Text>

                  <Text
                    style={
                      styles.issueOptionDescription
                    }
                  >
                    Customer cannot be reached by
                    phone or at the delivery location.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.issueOption}
                onPress={() =>
                  handleSelectContactIssue(
                    'WRONG_ADDRESS',
                  )
                }
              >
                <View
                  style={
                    styles.issueOptionIcon
                  }
                >
                  <Text
                    style={
                      styles.issueOptionIconText
                    }
                  >
                    !
                  </Text>
                </View>

                <View
                  style={
                    styles.issueOptionContent
                  }
                >
                  <Text
                    style={
                      styles.issueOptionTitle
                    }
                  >
                    Wrong address
                  </Text>

                  <Text
                    style={
                      styles.issueOptionDescription
                    }
                  >
                    The provided delivery address
                    does not match the customer's
                    location.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.issueOption}
                onPress={() =>
                  handleSelectContactIssue(
                    'CUSTOMER_REQUESTED_NEW_LOCATION',
                  )
                }
              >
                <View
                  style={
                    styles.issueOptionIcon
                  }
                >
                  <Text
                    style={
                      styles.issueOptionIconText
                    }
                  >
                    ↗
                  </Text>
                </View>

                <View
                  style={
                    styles.issueOptionContent
                  }
                >
                  <Text
                    style={
                      styles.issueOptionTitle
                    }
                  >
                    Customer requested new
                    location
                  </Text>

                  <Text
                    style={
                      styles.issueOptionDescription
                    }
                  >
                    Customer asks for delivery at a
                    different location.
                  </Text>
                </View>
              </Pressable>
            </View>

            <Pressable
              style={
                styles.modalCancelButton
              }
              onPress={
                handleCloseContactIssueModal
              }
            >
              <Text
                style={
                  styles.modalCancelButtonText
                }
              >
                CLOSE
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
    fontWeight: '700',
    color: '#2E7D32',
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

  customerPhone: {
    marginTop: 4,
    fontSize: 12,
    color: '#7A827A',
  },

  contactActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },

  primaryContactButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryContactButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  secondaryContactButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryContactButtonText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '700',
  },

  contactIssueSection: {
    marginTop: 17,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF2EE',
  },

  contactIssueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  contactIssueInfo: {
    flex: 1,
    paddingRight: 12,
  },

  contactIssueTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },

  contactIssueDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: '#7A827A',
  },

  contactIssueButton: {
    height: 38,
    borderRadius: 9,
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#E8C879',
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  contactIssueButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A6700',
  },

  contactIssueSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 11,
    borderRadius: 10,
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#F0DFAF',
  },

  contactIssueSelectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4D98C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  contactIssueSelectedIconText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8A5A00',
  },

  contactIssueSelectedInfo: {
    flex: 1,
  },

  contactIssueSelectedLabel: {
    fontSize: 9,
    color: '#9A7A3A',
    marginBottom: 2,
  },

  contactIssueSelectedValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B4D00',
  },

  clearIssueButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  clearIssueButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A6700',
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
    lineHeight: 18,
    color: '#7A827A',
  },

  locationMetrics: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 15,
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
    fontSize: 10,
    color: '#8A918A',
    marginBottom: 4,
  },

  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  navigationButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F0F7F0',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 17,
  },

  navigationButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
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

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
  },

  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  totalAmount: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2E7D32',
  },

  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  instructionsToggle: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: '#E8F5E9',
    marginBottom: 15,
  },

  instructionsToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },

  instructionsBox: {
    backgroundColor: '#F7FAF7',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },

  instructions: {
    fontSize: 13,
    lineHeight: 20,
    color: '#596159',
  },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF8EF',
    borderRadius: 17,
    padding: 17,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginBottom: 18,
  },

  statusIndicator: {
    marginRight: 12,
    paddingTop: 4,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },

  statusCardText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#667066',
  },

  verificationCard: {
    backgroundColor: '#EEF8EF',
    borderRadius: 17,
    padding: 17,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },

  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  verificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  verificationIconText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },

  verificationContent: {
    flex: 1,
  },

  verificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F5130',
  },

  verificationDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: '#597060',
  },

  verificationButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  verificationButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.35,
    color: '#FFFFFF',
  },

  deliveryIssueCard: {
    backgroundColor: '#FFF8E8',
    borderRadius: 17,
    padding: 17,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#F1D99A',
  },

  deliveryIssueHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  deliveryIssueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#B87800',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  deliveryIssueIconText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },

  deliveryIssueContent: {
    flex: 1,
  },

  deliveryIssueTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B3A00',
  },

  deliveryIssueDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: '#786331',
  },

  deliveryIssueButton: {
    height: 47,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9B55D',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  deliveryIssueButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.35,
    color: '#8A5A00',
  },

  startButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  startedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },

  startedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  startedIconText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },

  startedContent: {
    flex: 1,
  },

  startedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 3,
  },

  startedText: {
    fontSize: 12,
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 26,
  },

  issueModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  issueModalHeaderContent: {
    flex: 1,
    paddingRight: 12,
  },

  issueModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  issueModalSubtitle: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: '#7A827A',
  },

  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F3F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCloseButtonText: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '400',
    color: '#4B5563',
  },

  issueOptions: {
    gap: 10,
  },

  issueOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#F9FBF9',
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },

  issueOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF7E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },

  issueOptionDescription: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    color: '#7A827A',
  },

  modalCancelButton: {
    height: 50,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C9D0C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  modalCancelButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5F675F',
  },
});

export default ActiveDeliveryScreen;