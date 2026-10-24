import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {useBarcodeScannerOutput} from 'react-native-vision-camera-barcode-scanner';
import type {MainStackParamList} from '../../../app/navigation/MainNavigator';
import {
  completeDelivery,
  getDelivery,
  type OrderRecord,
} from '../../../shared/services/api';

type DeliveryVerificationScreenProps = NativeStackScreenProps<
  MainStackParamList,
  'DeliveryVerification'
>;

type DeliveryVerificationNavigationProp =
  NativeStackNavigationProp<MainStackParamList>;

function DeliveryVerificationScreen({
  route,
}: DeliveryVerificationScreenProps) {
  const navigation =
    useNavigation<DeliveryVerificationNavigationProp>();

  const isFocused = useIsFocused();
  const {deliveryId} = route.params;
  const [deliveryOrder, setDeliveryOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    let active = true;
    getDelivery(deliveryId.replace(/^#/, ''))
      .then(order => {
        if (active) {
          setDeliveryOrder(order);
          setOtpVerified(Boolean(order.deliveryVerification?.isVerified));
        }
      })
      .catch(error => {
        if (active) {
          Alert.alert(
            'Delivery unavailable',
            error instanceof Error ? error.message : 'Unable to load this delivery.',
          );
        }
      });
    return () => { active = false; };
  }, [deliveryId]);

  // DailyMart order number is the identifier printed on the warehouse package label.
  const expectedPackageId = deliveryOrder?.orderNumber?.trim().toUpperCase();
  const customerName = deliveryOrder?.deliveryLocation?.name || deliveryOrder?.customer?.fullName || 'Customer';
  const customerPhone = deliveryOrder?.deliveryLocation?.phone || deliveryOrder?.customer?.mobileNumber || '';

  const {
    hasPermission,
    canRequestPermission,
    requestPermission,
  } = useCameraPermission();

  const device = useCameraDevice('back');

  const [packageVerified, setPackageVerified] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);

  // Prevent the same barcode from being processed more than once.
  const scanHandledRef = useRef(false);

  useEffect(() => {
    if (!isScannerVisible) {
      setCameraReady(false);
      setCameraError(null);
      return;
    }

    setCameraReady(false);

    const timer = setTimeout(() => {
      setCameraReady(true);
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [isScannerVisible]);

  const handleOpenScanner = async () => {
    if (!expectedPackageId) {
      Alert.alert(
        'Order label unavailable',
        'Load this delivery from DailyMart before scanning its order number.',
      );
      return;
    }
    scanHandledRef.current = false;
    setScannedCode(null);
    setCameraError(null);
    setCameraReady(false);
    setIsScanning(false);

    if (!hasPermission) {
      if (!canRequestPermission) {
        setCameraError(
          'Camera permission is blocked. Please enable camera access from your device settings.',
        );
        setIsScannerVisible(true);
        return;
      }

      try {
        const granted = await requestPermission();

        if (!granted) {
          setCameraError('Camera permission was not granted.');
          setIsScannerVisible(true);
          return;
        }
      } catch {
        setCameraError('We could not request camera permission.');
        setIsScannerVisible(true);
        return;
      }
    }

    setIsScannerVisible(true);
  };

  const handleCloseScanner = () => {
    scanHandledRef.current = false;
    setIsScanning(false);
    setCameraReady(false);
    setIsScannerVisible(false);
    setCameraError(null);
  };

  const handleBarcodeScanned = (
    barcodes: Array<{
      rawValue?: string;
      displayValue?: string;
      format: string;
    }>,
  ) => {
    if (
      !isScanning ||
      scanHandledRef.current ||
      barcodes.length === 0
    ) {
      return;
    }

    const firstBarcode = barcodes[0];

    const value = (
      firstBarcode.rawValue?.trim() ||
      firstBarcode.displayValue?.trim() ||
      ''
    ).trim();

    if (!value) {
      scanHandledRef.current = true;
      setIsScanning(false);

      Alert.alert(
        'Unreadable Barcode',
        'No readable package ID was found. Please open the scanner and try again.',
      );
      return;
    }

    scanHandledRef.current = true;
    setIsScanning(false);
    setCameraReady(false);
    setIsScannerVisible(false);
    setScannedCode(value);

    // Never accept a scanned package if the expected ID is missing.
    if (!expectedPackageId) {
      setPackageVerified(false);

      Alert.alert(
        'Package ID Unavailable',
        'The expected package ID is not available for this delivery. Refresh the delivery details or contact the administrator.',
      );
      return;
    }

    // Compare the scanned value with the expected ID, ignoring letter case.
    if (value.toUpperCase() !== expectedPackageId) {
      setPackageVerified(false);

      Alert.alert(
        'Package Mismatch',
        'This package does not belong to the assigned delivery. Please check the label and scan the correct package.',
      );
      return;
    }

    setPackageVerified(true);

    Alert.alert(
      'Package Matched',
      'The scanned package ID matches the expected package ID.',
    );
  };

  const handleScannerError = (error: Error) => {
    setIsScanning(false);
    setCameraError(
      error.message || 'The barcode scanner could not be started.',
    );
  };

  const handleCameraError = (error: Error) => {
    setIsScanning(false);
    setCameraError(
      error.message || 'The camera could not be started.',
    );
  };

  const handleCameraStarted = () => {
    if (isScannerVisible) {
      setIsScanning(true);
      setCameraError(null);
    }
  };

  const handleRetryCamera = () => {
    scanHandledRef.current = false;
    setCameraError(null);
    setIsScanning(false);
    setCameraReady(false);
    setIsScannerVisible(false);

    setTimeout(() => {
      setIsScannerVisible(true);
    }, 200);
  };

  const handleRetryScan = () => {
    scanHandledRef.current = false;
    setScannedCode(null);
    setPackageVerified(false);
    setCameraError(null);
    setCameraReady(false);
    setIsScanning(false);
  };

  // Allow only numeric characters and a maximum of six digits.
  const handleOtpChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setOtp(numericValue.slice(0, 6));

    if (otpVerified) {
      setOtpVerified(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit customer OTP.');
      return;
    }
    if (isOtpSubmitting) return;
    setIsOtpSubmitting(true);
    try {
      await completeDelivery(deliveryId, otp);
      setOtpVerified(true);
      Alert.alert('Customer verified', 'The OTP was verified by DailyMart. Record any cash-on-delivery payment before completing the order.');
    } catch (error) {
      Alert.alert('OTP verification failed', error instanceof Error ? error.message : 'Please check the code and retry.');
    } finally {
      setIsOtpSubmitting(false);
    }
  };
  const allVerified = otpVerified;

  const handleCallCustomer = async () => {
    if (!customerPhone) {
      Alert.alert('Phone unavailable', 'This order does not include a customer phone number.');
      return;
    }
    try {
      await Linking.openURL(`tel:${customerPhone}`);
    } catch {
      Alert.alert('Unable to call', 'Your device could not open the phone app.');
    }
  };

  const handleBackToDelivery = () => {
    navigation.goBack();
  };

  const handleProceedToPayment = () => {
    if (!allVerified) {
      return;
    }

    // The backend OTP check above is the source of truth.
    navigation.navigate('CODCollection', {
      deliveryId,
    });
  };

  const barcodeScannerOutput = useBarcodeScannerOutput({
    barcodeFormats: [
      'qr-code',
      'code-128',
      'code-39',
      'code-93',
      'ean-13',
      'ean-8',
      'upc-a',
      'upc-e',
      'itf',
      'codabar',
    ],
    outputResolution: 'preview',
    onBarcodeScanned: handleBarcodeScanned,
    onError: handleScannerError,
  });

  const scannerActive =
    isScannerVisible &&
    isFocused &&
    hasPermission &&
    cameraReady &&
    device !== undefined;

  if (isScannerVisible) {
    return (
      <SafeAreaView
        style={styles.cameraScreen}
        edges={['top', 'bottom']}>
        <View style={styles.cameraHeader}>
          <View>
            <Text style={styles.cameraHeaderLabel}>
              PACKAGE SCANNER
            </Text>
            <Text style={styles.cameraHeaderOrder}>
              {deliveryId}
            </Text>
          </View>

          <Pressable
            style={styles.cameraCloseButton}
            onPress={handleCloseScanner}>
            <Text style={styles.cameraCloseButtonText}>
              ×
            </Text>
          </Pressable>
        </View>

        {!hasPermission ? (
          <View style={styles.cameraMessage}>
            <Text style={styles.cameraMessageIcon}>📷</Text>

            <Text style={styles.cameraMessageTitle}>
              Camera Permission Required
            </Text>

            <Text style={styles.cameraMessageDescription}>
              Camera access is required to scan the package QR code or
              barcode.
            </Text>

            {canRequestPermission ? (
              <Pressable
                style={styles.primaryButton}
                onPress={handleOpenScanner}>
                <Text style={styles.primaryButtonText}>
                  ALLOW CAMERA
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.permissionSettingsText}>
                Camera permission is blocked. Please enable camera
                access from device settings.
              </Text>
            )}

            <Pressable
              style={styles.secondaryButton}
              onPress={handleCloseScanner}>
              <Text style={styles.secondaryButtonText}>
                CANCEL
              </Text>
            </Pressable>
          </View>
        ) : device === undefined ? (
          <View style={styles.cameraMessage}>
            <Text style={styles.cameraMessageIcon}>📷</Text>

            <Text style={styles.cameraMessageTitle}>
              Camera Not Available
            </Text>

            <Text style={styles.cameraMessageDescription}>
              The rear camera is not currently available on this device.
            </Text>

            <Pressable
              style={styles.secondaryButton}
              onPress={handleCloseScanner}>
              <Text style={styles.secondaryButtonText}>
                CLOSE
              </Text>
            </Pressable>
          </View>
        ) : cameraError !== null ? (
          <View style={styles.cameraMessage}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>!</Text>
            </View>

            <Text style={styles.cameraMessageTitle}>
              Camera Error
            </Text>

            <Text style={styles.cameraMessageDescription}>
              {cameraError}
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={handleRetryCamera}>
              <Text style={styles.primaryButtonText}>
                TRY AGAIN
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={handleCloseScanner}>
              <Text style={styles.secondaryButtonText}>
                CLOSE
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cameraPreviewArea}>
            <Camera
              key={device.id}
              style={styles.fullScreenCamera}
              device={device}
              isActive={scannerActive}
              implementationMode="compatible"
              resizeMode="cover"
              outputs={[barcodeScannerOutput]}
              onStarted={handleCameraStarted}
              onError={handleCameraError}
            />

            <View
              pointerEvents="none"
              style={styles.cameraOverlay}>
              <View style={styles.scanFrame}>
                <View
                  style={[
                    styles.corner,
                    styles.cornerTopLeft,
                  ]}
                />
                <View
                  style={[
                    styles.corner,
                    styles.cornerTopRight,
                  ]}
                />
                <View
                  style={[
                    styles.corner,
                    styles.cornerBottomLeft,
                  ]}
                />
                <View
                  style={[
                    styles.corner,
                    styles.cornerBottomRight,
                  ]}
                />
              </View>

              <Text style={styles.scannerInstruction}>
                {cameraReady
                  ? 'Position the package QR code or barcode inside the frame'
                  : 'Starting camera...'}
              </Text>
            </View>

            <Pressable
              style={styles.cameraBottomButton}
              onPress={handleCloseScanner}>
              <Text style={styles.cameraBottomButtonText}>
                CLOSE SCANNER
              </Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerBackButton}
            onPress={handleBackToDelivery}>
            <Text style={styles.headerBackArrow}>‹</Text>
          </Pressable>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.pageTitle}>
              Delivery Verification
            </Text>
            <Text style={styles.headerOrderId}>
              {deliveryId}
            </Text>
          </View>

          <View style={styles.headerHelpBadge}>
            <Text style={styles.headerHelpText}>
              Verify
            </Text>
          </View>
        </View>

        <View style={styles.stepProgressCard}>
          <View style={styles.stepProgressLine}>
            <View
              style={[
                styles.progressStepCircle,
                styles.progressStepComplete,
              ]}>
              <Text style={styles.progressStepCheck}>
                ✓
              </Text>
            </View>

            <View
              style={[
                styles.progressConnector,
                allVerified &&
                  styles.progressConnectorComplete,
              ]}
            />

            <View
              style={[
                styles.progressStepCircle,
                allVerified
                  ? styles.progressStepComplete
                  : styles.progressStepActive,
              ]}>
              <Text
                style={
                  allVerified
                    ? styles.progressStepCheck
                    : styles.progressStepNumber
                }>
                {allVerified ? '✓' : '2'}
              </Text>
            </View>

            <View
              style={[
                styles.progressConnector,
                allVerified &&
                  styles.progressConnectorComplete,
              ]}
            />

            <View
              style={[
                styles.progressStepCircle,
                allVerified
                  ? styles.progressStepActive
                  : styles.progressStepPending,
              ]}>
              <Text
                style={[
                  styles.progressStepNumber,
                ]}>
                3
              </Text>
            </View>
          </View>

          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelActive}>
              Arrived
            </Text>
            <Text style={styles.progressLabel}>
              Verify
            </Text>
            <Text style={styles.progressLabel}>
              Complete
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Text style={styles.heroIcon}>▣</Text>
          </View>

          <Text style={styles.heroTitle}>
            Verify Delivery
          </Text>

          <Text style={styles.heroDescription}>
            Confirm the package and customer before handing over the
            order.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.deliverySummaryHeader}>
            <Text style={styles.deliverySummaryTitle}>
              Delivery {deliveryId}
            </Text>

            <View style={styles.assignedBadge}>
              <Text style={styles.assignedBadgeText}>
                At Customer
              </Text>
            </View>
          </View>

          <View style={styles.customerSummaryRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {customerName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.customerSummaryInfo}>
              <Text style={styles.customerSummaryName}>
                {customerName}
              </Text>
              <Text style={styles.customerSummaryPhone}>
                {customerPhone || 'Phone unavailable'}
              </Text>
            </View>

            <Pressable
              style={styles.callButton}
              onPress={handleCallCustomer}
              disabled={!customerPhone}>
              <Text style={styles.callButtonIcon}>●</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>

            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>
                Package Verification
              </Text>
              <Text style={styles.sectionDescription}>
                Optional: scan the warehouse label with order number {deliveryOrder?.orderNumber || '…'}. The app checks this label on device.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.verificationMethodBox,
              packageVerified &&
                styles.verificationMethodBoxSuccess,
            ]}>
            <View
              style={[
                styles.methodIconCircle,
                packageVerified &&
                  styles.methodIconCircleSuccess,
              ]}>
              <Text
                style={[
                  styles.methodIcon,
                  packageVerified && styles.methodIconSuccess,
                ]}>
                {packageVerified ? '✓' : '▦'}
              </Text>
            </View>

            <View style={styles.methodTextBlock}>
              <Text style={styles.methodTitle}>
                {packageVerified
                  ? 'Package label matched'
                  : 'Optional package label check'}
              </Text>

              <Text style={styles.methodDescription}>
                {packageVerified
                  ? 'The scanned code matches this order number.'
                  : 'If the package has an order-number barcode, you can scan it here. Customer OTP verification is required.'}
              </Text>
            </View>
          </View>

          {!packageVerified ? (
            <Pressable
              style={styles.primaryButton}
              onPress={handleOpenScanner}>
              <Text style={styles.primaryButtonText}>
                SCAN PACKAGE
              </Text>
              <Text style={styles.primaryButtonArrow}>→</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.secondaryActionButton}
              onPress={handleRetryScan}>
              <Text style={styles.secondaryActionText}>
                SCAN AGAIN
              </Text>
            </Pressable>
          )}

          {scannedCode !== null && (
            <View style={styles.scannedCodeBox}>
              <Text style={styles.scannedCodeLabel}>
                SCANNED CODE
              </Text>
              <Text
                style={styles.scannedCodeValue}
                numberOfLines={2}>
                {scannedCode}
              </Text>
            </View>
          )}
        </View>

        <>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>

              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>
                  Customer OTP Check
                </Text>
                <Text style={styles.sectionDescription}>
                  Enter the six-digit OTP provided by the customer. DailyMart will verify it for this delivery.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.otpContainer,
                otpVerified && styles.otpContainerSuccess,
              ]}>
              <TextInput
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#A2AAA4"
                style={styles.otpInput}
                textAlign="center"
                editable={!otpVerified}
              />
            </View>

            <Text style={styles.otpHint}>
              The OTP is checked against this order by the DailyMart backend.
            </Text>

            {!otpVerified ? (
              <Pressable
                style={[
                  styles.primaryButton,
                  otp.length !== 6 &&
                    styles.primaryButtonDisabled,
                  isOtpSubmitting && styles.primaryButtonDisabled,
                ]}
                onPress={handleVerifyOtp}
                disabled={otp.length !== 6 || isOtpSubmitting}>
                <Text style={styles.primaryButtonText}>
                  {isOtpSubmitting ? 'VERIFYING…' : 'VERIFY OTP'}
                </Text>
                <Text style={styles.primaryButtonArrow}>→</Text>
              </Pressable>
            ) : (
              <View style={styles.successBanner}>
                <View style={styles.successIcon}>
                  <Text style={styles.successIconText}>
                    ✓
                  </Text>
                </View>

                <View style={styles.successContent}>
                  <Text style={styles.successTitle}>
                    Customer OTP verified
                  </Text>
                  <Text style={styles.successText}>
                    DailyMart verified this OTP for the assigned order.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </>

        {allVerified && (
          <View style={styles.successCard}>
            <View style={styles.successHeroCircle}>
              <Text style={styles.successHeroCheck}>✓</Text>
            </View>

            <Text style={styles.successHeroTitle}>
              Customer verification complete
            </Text>

            <Text style={styles.successHeroDescription}>
              {packageVerified
                ? "The package label matched this order, and DailyMart verified the customer's OTP."
                : "DailyMart verified the customer's OTP for this order."}
            </Text>

            <View style={styles.successDetailsCard}>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>
                  Delivery
                </Text>
                <Text style={styles.successDetailValue}>
                  {deliveryId}
                </Text>
              </View>

              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>
                  Customer
                </Text>
                <Text style={styles.successDetailValue}>
                  {customerName}
                </Text>
              </View>

              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>
                  Customer OTP
                </Text>
                <Text style={styles.successDetailGreen}>
                  Verified by DailyMart
                </Text>
              </View>

              <View
                style={[
                  styles.successDetailRow,
                  styles.successDetailRowLast,
                ]}>
                <Text style={styles.successDetailLabel}>Package label</Text>
                <Text style={packageVerified ? styles.successDetailGreen : styles.successDetailMuted}>
                  {packageVerified ? 'Matched in app' : 'Not scanned'}
                </Text>
              </View>

            </View>
          </View>
        )}

        {allVerified && (
          <Pressable
            style={styles.continueButton}
            onPress={handleProceedToPayment}>
            <Text style={styles.continueButtonText}>
              CONTINUE TO PAYMENT
            </Text>
            <Text style={styles.continueButtonArrow}>→</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.backToDeliveryButton}
          onPress={handleBackToDelivery}>
          <Text style={styles.backToDeliveryText}>
            BACK TO ACTIVE DELIVERY
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#F7FAF8'},
  content: {paddingHorizontal: 16, paddingTop: 7, paddingBottom: 32},
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackArrow: {fontSize: 35, lineHeight: 32, color: '#202729'},
  headerTitleBlock: {flex: 1, alignItems: 'center'},
  pageTitle: {fontSize: 18, fontWeight: '800', color: '#141A1C'},
  headerOrderId: {marginTop: 2, fontSize: 9.5, color: '#7A8385'},
  headerHelpBadge: {
    minWidth: 52,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E9F8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerHelpText: {fontSize: 10, fontWeight: '800', color: '#078C46'},

  stepProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5EBE7',
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 11,
    marginBottom: 10,
  },
  stepProgressLine: {flexDirection: 'row', alignItems: 'center'},
  progressStepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepComplete: {backgroundColor: '#0A9A49'},
  progressStepActive: {backgroundColor: '#0A9A49'},
  progressStepPending: {backgroundColor: '#DCE2DE'},
  progressStepNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: '#626C67',
  },
  progressStepCheck: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  progressConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#DCE3DE',
    marginHorizontal: 6,
  },
  progressConnectorComplete: {backgroundColor: '#9EDAB2'},
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabelActive: {
    width: 65,
    textAlign: 'center',
    fontSize: 9.5,
    color: '#118E49',
    fontWeight: '700',
  },
  progressLabel: {
    width: 65,
    textAlign: 'center',
    fontSize: 9.5,
    color: '#626C67',
  },

  heroCard: {alignItems: 'center', paddingVertical: 10, marginBottom: 9},
  heroIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#E5F7EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {fontSize: 27, color: '#0A9749'},
  heroTitle: {
    marginTop: 9,
    fontSize: 20,
    fontWeight: '800',
    color: '#162022',
  },
  heroDescription: {
    marginTop: 4,
    maxWidth: 310,
    fontSize: 10.5,
    lineHeight: 16,
    textAlign: 'center',
    color: '#70797C',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EBE7',
    padding: 13,
    marginBottom: 10,
  },
  deliverySummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  deliverySummaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#202729',
  },
  assignedBadge: {
    minHeight: 25,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: '#DDF7E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#078E46',
  },
  customerSummaryRow: {flexDirection: 'row', alignItems: 'center'},
  customerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#F0E4D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  customerAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#604A38',
  },
  customerSummaryInfo: {flex: 1},
  customerSummaryName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#202729',
  },
  customerSummaryPhone: {
    marginTop: 2,
    fontSize: 10.5,
    color: '#7B8386',
  },
  callButton: {
    width: 39,
    height: 39,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0A9649',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonIcon: {fontSize: 13, color: '#0A9649'},

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepBadge: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: '#0A9A49',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeaderText: {flex: 1},
  sectionTitle: {fontSize: 14, fontWeight: '800', color: '#202729'},
  sectionDescription: {
    marginTop: 3,
    fontSize: 9.5,
    lineHeight: 15,
    color: '#747D7F',
  },

  verificationMethodBox: {
    minHeight: 72,
    borderRadius: 12,
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: '#E2E9E4',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationMethodBoxSuccess: {
    backgroundColor: '#EAF8ED',
    borderColor: '#C6E7CE',
  },
  methodIconCircle: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#E4F6EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  methodIconCircleSuccess: {backgroundColor: '#0B9B4A'},
  methodIcon: {fontSize: 23, color: '#078E46'},
  methodIconSuccess: {color: '#FFFFFF'},
  methodTextBlock: {flex: 1},
  methodTitle: {fontSize: 11.5, fontWeight: '800', color: '#202729'},
  methodDescription: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 14,
    color: '#737D7F',
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#079A49',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {backgroundColor: '#BBC2BD'},
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  primaryButtonArrow: {
    marginLeft: 8,
    fontSize: 19,
    color: '#FFFFFF',
  },
  secondaryActionButton: {
    minHeight: 45,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0A9649',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#078E46',
  },
  scannedCodeBox: {
    marginTop: 9,
    padding: 9,
    borderRadius: 9,
    backgroundColor: '#F0F8F1',
    borderWidth: 1,
    borderColor: '#C9E7CE',
  },
  scannedCodeLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6E7972',
    marginBottom: 3,
  },
  scannedCodeValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#293233',
  },

  otpContainer: {
    height: 58,
    borderWidth: 1,
    borderColor: '#CBD4CE',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  otpContainerSuccess: {
    borderColor: '#79C98A',
    backgroundColor: '#F0FAF2',
  },
  otpInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 5,
    color: '#1F2937',
  },
  otpHint: {
    marginTop: 7,
    fontSize: 9,
    lineHeight: 14,
    color: '#858E8A',
  },
  successBanner: {
    marginTop: 10,
    minHeight: 55,
    borderRadius: 10,
    backgroundColor: '#E7F7EB',
    borderWidth: 1,
    borderColor: '#C5E5CC',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 9,
  },
  successIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A9A49',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  successIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  successContent: {flex: 1},
  successTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1F5130',
  },
  successText: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 14,
    color: '#617165',
  },

  photoPlaceholder: {
    backgroundColor: '#F7FAF8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E9E5',
    padding: 13,
    alignItems: 'center',
  },
  photoPlaceholderIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E5F6EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIconText: {fontSize: 25, color: '#0A9749'},
  photoPlaceholderTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '800',
    color: '#202729',
  },
  photoPlaceholderDescription: {
    marginTop: 4,
    maxWidth: 285,
    fontSize: 9.5,
    lineHeight: 15,
    textAlign: 'center',
    color: '#75807A',
  },
  photoCapturedCard: {
    borderRadius: 12,
    backgroundColor: '#EAF8ED',
    borderWidth: 1,
    borderColor: '#C6E7CE',
    overflow: 'hidden',
  },
  photoPreview: {
    height: 135,
    backgroundColor: '#D9E7D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreviewBag: {fontSize: 47},
  photoPreviewText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    color: '#158342',
  },
  photoPreviewLocation: {
    marginTop: 2,
    fontSize: 9,
    color: '#647367',
  },
  photoCapturedInfo: {
    minHeight: 57,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoCapturedTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#285132',
  },
  photoCapturedSubtitle: {
    marginTop: 2,
    fontSize: 9,
    color: '#69766E',
  },
  retakeButton: {
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#7BC88D',
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#078D46',
  },

  successCard: {
    alignItems: 'center',
    backgroundColor: '#EAF8ED',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C6E7CE',
    padding: 16,
    marginBottom: 10,
  },
  successHeroCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#0AA14D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successHeroCheck: {
    fontSize: 39,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  successHeroTitle: {
    marginTop: 11,
    fontSize: 19,
    fontWeight: '800',
    color: '#172120',
  },
  successHeroDescription: {
    marginTop: 4,
    maxWidth: 290,
    fontSize: 10.5,
    lineHeight: 16,
    textAlign: 'center',
    color: '#65716A',
  },
  successDetailsCard: {
    width: '100%',
    marginTop: 13,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E8E2',
    paddingHorizontal: 10,
  },
  successDetailRow: {
    minHeight: 38,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1EE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successDetailRowLast: {borderBottomWidth: 0},
  successDetailLabel: {fontSize: 9.5, color: '#7A8580'},
  successDetailValue: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#394144',
  },
  successDetailGreen: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#078D46',
  },
  successDetailMuted: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#8A918D',
  },
  continueButton: {
    height: 51,
    borderRadius: 11,
    backgroundColor: '#079A49',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  continueButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  continueButtonArrow: {
    marginLeft: 9,
    fontSize: 21,
    color: '#FFFFFF',
  },
  backToDeliveryButton: {
    height: 47,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C9D2CB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToDeliveryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#626D67',
  },

  cameraScreen: {flex: 1, backgroundColor: '#000000'},
  cameraHeader: {
    height: 72,
    paddingHorizontal: 18,
    backgroundColor: '#101313',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cameraHeaderLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: '#9EA6A3',
  },
  cameraHeaderOrder: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cameraCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#252A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 27,
  },
  cameraPreviewArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  fullScreenCamera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderColor: '#72E9A0',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 5,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 5,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 5,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 5,
  },
  scannerInstruction: {
    marginTop: 24,
    maxWidth: 290,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.58)',
    color: '#FFFFFF',
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: 'center',
  },
  cameraBottomButton: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 20,
    height: 50,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBottomButtonText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2E7D32',
  },
  cameraMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#111515',
  },
  cameraMessageIcon: {fontSize: 39, marginBottom: 11},
  cameraMessageTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cameraMessageDescription: {
    marginTop: 8,
    maxWidth: 310,
    fontSize: 11,
    lineHeight: 17,
    color: '#C6CDCA',
    textAlign: 'center',
  },
  permissionSettingsText: {
    marginTop: 14,
    maxWidth: 310,
    fontSize: 10,
    lineHeight: 16,
    color: '#F2C46F',
    textAlign: 'center',
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5D2424',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorIconText: {
    color: '#FF958A',
    fontSize: 26,
    fontWeight: '900',
  },
  secondaryButton: {
    width: '100%',
    height: 49,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C8D0C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#5F6863',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default DeliveryVerificationScreen;
