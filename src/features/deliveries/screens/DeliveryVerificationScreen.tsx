import React, { useEffect, useState } from 'react';

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

import {
  useBarcodeScannerOutput,
} from 'react-native-vision-camera-barcode-scanner';

import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type DeliveryVerificationScreenProps =
  NativeStackScreenProps<
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

  const { deliveryId } = route.params;

  const {
    hasPermission,
    canRequestPermission,
    requestPermission,
  } = useCameraPermission();

  const device = useCameraDevice('back');

  const [packageVerified, setPackageVerified] =
    useState(false);

  const [isScannerVisible, setIsScannerVisible] =
    useState(false);

  const [isScanning, setIsScanning] =
    useState(false);

  const [cameraReady, setCameraReady] =
    useState(false);

  const [scannedCode, setScannedCode] =
    useState<string | null>(null);

  const [cameraError, setCameraError] =
    useState<string | null>(null);

  const [otp, setOtp] = useState('');

  const [otpVerified, setOtpVerified] =
    useState(false);

  /*
   * --------------------------------------------------
   * Camera lifecycle
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * Open scanner
   * --------------------------------------------------
   */

  const handleOpenScanner = async () => {
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
        const granted =
          await requestPermission();

        if (!granted) {
          setCameraError(
            'Camera permission was not granted.',
          );

          setIsScannerVisible(true);

          return;
        }
      } catch {
        setCameraError(
          'We could not request camera permission.',
        );

        setIsScannerVisible(true);

        return;
      }
    }

    setIsScannerVisible(true);
  };

  /*
   * --------------------------------------------------
   * Close scanner
   * --------------------------------------------------
   */

  const handleCloseScanner = () => {
    setIsScanning(false);
    setCameraReady(false);
    setIsScannerVisible(false);
    setCameraError(null);
  };

  /*
   * --------------------------------------------------
   * Barcode detected
   * --------------------------------------------------
   */

  const handleBarcodeScanned = (
    barcodes: Array<{
      rawValue?: string;
      displayValue?: string;
      format: string;
    }>,
  ) => {
    if (
      !isScanning ||
      barcodes.length === 0
    ) {
      return;
    }

    const firstBarcode = barcodes[0];

    const value =
      firstBarcode.rawValue ??
      firstBarcode.displayValue ??
      '';

    if (!value) {
      return;
    }

    setIsScanning(false);
    setCameraReady(false);
    setScannedCode(value);
    setPackageVerified(true);
    setIsScannerVisible(false);

    /*
     * Temporary frontend behavior.
     *
     * The backend will later validate:
     * - partner
     * - order
     * - package
     * - delivery state
     */

    Alert.alert(
      'Package Code Detected',
      `Scanned value:\n${value}`,
    );
  };

  /*
   * --------------------------------------------------
   * Barcode scanner error
   * --------------------------------------------------
   */

  const handleScannerError = (
    error: Error,
  ) => {
    setIsScanning(false);

    setCameraError(
      error.message ||
        'The barcode scanner could not be started.',
    );
  };

  /*
   * --------------------------------------------------
   * Camera error
   * --------------------------------------------------
   */

  const handleCameraError = (
    error: Error,
  ) => {
    setIsScanning(false);

    setCameraError(
      error.message ||
        'The camera could not be started.',
    );
  };

  /*
   * --------------------------------------------------
   * Camera started
   * --------------------------------------------------
   */

  const handleCameraStarted = () => {
    if (isScannerVisible) {
      setIsScanning(true);
      setCameraError(null);
    }
  };

  /*
   * --------------------------------------------------
   * Retry camera
   * --------------------------------------------------
   */

  const handleRetryCamera = () => {
    setCameraError(null);
    setIsScanning(false);
    setCameraReady(false);

    setIsScannerVisible(false);

    setTimeout(() => {
      setIsScannerVisible(true);
    }, 200);
  };

  /*
   * --------------------------------------------------
   * Retry package scan
   * --------------------------------------------------
   */

  const handleRetryScan = () => {
    setScannedCode(null);
    setPackageVerified(false);
    setCameraError(null);
    setCameraReady(false);
    setIsScanning(false);
    setOtp('');
    setOtpVerified(false);
  };

  /*
   * --------------------------------------------------
   * OTP
   * --------------------------------------------------
   */

  const handleOtpChange = (
    value: string,
  ) => {
    const numericValue =
      value.replace(/\D/g, '');

    setOtp(
      numericValue.slice(0, 6),
    );

    if (otpVerified) {
      setOtpVerified(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      Alert.alert(
        'Invalid OTP',
        'Please enter the 6-digit customer OTP.',
      );

      return;
    }

    /*
     * Temporary frontend simulation.
     *
     * Backend validation will become
     * authoritative later.
     */

    setOtpVerified(true);
  };

  /*
   * --------------------------------------------------
   * Back to active delivery
   * --------------------------------------------------
   */

  const handleBackToDelivery = () => {
    navigation.goBack();
  };

  /*
   * --------------------------------------------------
   * Proceed to COD collection
   * --------------------------------------------------
   */

  const handleProceedToCODCollection = () => {
    if (!allVerified) {
      return;
    }

    navigation.navigate('CODCollection', {
      deliveryId,
    });
  };

  const allVerified =
    packageVerified &&
    otpVerified;

  /*
   * --------------------------------------------------
   * Barcode Scanner Camera Output
   * --------------------------------------------------
   */

  const barcodeScannerOutput =
    useBarcodeScannerOutput({
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

      onBarcodeScanned:
        handleBarcodeScanned,

      onError: handleScannerError,
    });

  /*
   * --------------------------------------------------
   * Scanner state
   * --------------------------------------------------
   */

  const scannerActive =
    isScannerVisible &&
    isFocused &&
    hasPermission &&
    cameraReady &&
    device !== undefined;

  /*
   * --------------------------------------------------
   * Full-screen scanner
   * --------------------------------------------------
   */

  if (isScannerVisible) {
    return (
      <SafeAreaView
        style={styles.cameraScreen}
        edges={['top', 'bottom']}
      >
        <View style={styles.cameraHeader}>
          <View>
            <Text
              style={
                styles.cameraHeaderLabel
              }
            >
              PACKAGE SCANNER
            </Text>

            <Text
              style={
                styles.cameraHeaderOrder
              }
            >
              {deliveryId}
            </Text>
          </View>

          <Pressable
            style={
              styles.cameraCloseButton
            }
            onPress={handleCloseScanner}
          >
            <Text
              style={
                styles.cameraCloseButtonText
              }
            >
              ×
            </Text>
          </Pressable>
        </View>

        {!hasPermission ? (
          <View style={styles.cameraMessage}>
            <Text
              style={
                styles.cameraMessageIcon
              }
            >
              📷
            </Text>

            <Text
              style={
                styles.cameraMessageTitle
              }
            >
              Camera Permission Required
            </Text>

            <Text
              style={
                styles.cameraMessageDescription
              }
            >
              Camera access is required to scan the
              package QR code or barcode.
            </Text>

            {canRequestPermission ? (
              <Pressable
                style={
                  styles.primaryButton
                }
                onPress={
                  handleOpenScanner
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  ALLOW CAMERA
                </Text>
              </Pressable>
            ) : (
              <Text
                style={
                  styles.permissionSettingsText
                }
              >
                Camera permission is blocked. Please
                enable camera access from the device
                settings.
              </Text>
            )}

            <Pressable
              style={
                styles.secondaryButton
              }
              onPress={
                handleCloseScanner
              }
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                CANCEL
              </Text>
            </Pressable>
          </View>
        ) : device === undefined ? (
          <View style={styles.cameraMessage}>
            <Text
              style={
                styles.cameraMessageIcon
              }
            >
              📷
            </Text>

            <Text
              style={
                styles.cameraMessageTitle
              }
            >
              Camera Not Available
            </Text>

            <Text
              style={
                styles.cameraMessageDescription
              }
            >
              The rear camera device is not currently
              available on this device.
            </Text>

            <Pressable
              style={
                styles.secondaryButton
              }
              onPress={
                handleCloseScanner
              }
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                CLOSE
              </Text>
            </Pressable>
          </View>
        ) : cameraError !== null ? (
          <View style={styles.cameraMessage}>
            <View
              style={styles.errorIcon}
            >
              <Text
                style={styles.errorIconText}
              >
                !
              </Text>
            </View>

            <Text
              style={
                styles.cameraMessageTitle
              }
            >
              Camera Error
            </Text>

            <Text
              style={
                styles.cameraMessageDescription
              }
            >
              {cameraError}
            </Text>

            <Pressable
              style={
                styles.primaryButton
              }
              onPress={
                handleRetryCamera
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                TRY AGAIN
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.secondaryButton
              }
              onPress={
                handleCloseScanner
              }
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                CLOSE
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={
              styles.cameraPreviewArea
            }
          >
            <Camera
              key={device.id}
              style={
                styles.fullScreenCamera
              }
              device={device}
              isActive={scannerActive}
              implementationMode="compatible"
              resizeMode="cover"
              outputs={[
                barcodeScannerOutput,
              ]}
              onStarted={
                handleCameraStarted
              }
              onError={
                handleCameraError
              }
            />

            <View
              pointerEvents="none"
              style={
                styles.cameraOverlay
              }
            >
              <View
                style={
                  styles.scanFrame
                }
              >
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

              <Text
                style={
                  styles.scannerInstruction
                }
              >
                {cameraReady
                  ? 'Position the package QR code or barcode inside the frame'
                  : 'Starting camera...'}
              </Text>
            </View>

            <Pressable
              style={
                styles.cameraBottomButton
              }
              onPress={
                handleCloseScanner
              }
            >
              <Text
                style={
                  styles.cameraBottomButtonText
                }
              >
                CLOSE SCANNER
              </Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    );
  }

  /*
   * --------------------------------------------------
   * Normal Verification Screen
   * --------------------------------------------------
   */

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
              Delivery Verification
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
              VERIFICATION
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
              Delivery verification
            </Text>

            <Text
              style={
                styles.progressCount
              }
            >
              {allVerified
                ? '2 / 2'
                : packageVerified
                  ? '1 / 2'
                  : '0 / 2'}
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
                packageVerified &&
                  styles.progressFillHalf,
                allVerified &&
                  styles.progressFillComplete,
              ]}
            />
          </View>

          <Text
            style={
              styles.progressDescription
            }
          >
            {allVerified
              ? 'Package and customer verification are complete.'
              : packageVerified
                ? 'Package verified. Now confirm the delivery with the customer OTP.'
                : 'Verify the package first, then customer verification will become available.'}
          </Text>
        </View>

        {/* Package Verification */}

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
                Package Verification
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }
              >
                Scan the parcel QR code or barcode before
                handing the order to the customer.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.verificationBox,
              packageVerified &&
                styles.verificationBoxSuccess,
            ]}
          >
            <View
              style={[
                styles.qrIcon,
                packageVerified &&
                  styles.qrIconSuccess,
              ]}
            >
              <Text
                style={[
                  styles.qrIconText,
                  packageVerified &&
                    styles.qrIconTextSuccess,
                ]}
              >
                {packageVerified
                  ? '✓'
                  : '▦'}
              </Text>
            </View>

            <Text
              style={
                styles.verificationTitle
              }
            >
              {packageVerified
                ? 'Package Code Detected'
                : 'Package QR / Barcode'}
            </Text>

            <Text
              style={
                styles.verificationDescription
              }
            >
              {packageVerified
                ? 'The package code has been captured successfully. Continue with customer verification below.'
                : 'Scan the package identifier to confirm that this parcel belongs to this delivery.'}
            </Text>

            {!packageVerified ? (
              <Pressable
                style={
                  styles.primaryButton
                }
                onPress={
                  handleOpenScanner
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  SCAN PACKAGE
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={
                  styles.secondaryButton
                }
                onPress={
                  handleRetryScan
                }
              >
                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  SCAN AGAIN
                </Text>
              </Pressable>
            )}
          </View>

          {scannedCode !== null && (
            <View
              style={
                styles.scannedCodeBox
              }
            >
              <Text
                style={
                  styles.scannedCodeLabel
                }
              >
                SCANNED CODE
              </Text>

              <Text
                style={
                  styles.scannedCodeValue
                }
                numberOfLines={2}
              >
                {scannedCode}
              </Text>
            </View>
          )}

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
              Package count
            </Text>

            <Text
              style={
                styles.infoValue
              }
            >
              1 package
            </Text>
          </View>

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
              Verification status
            </Text>

            <Text
              style={[
                styles.infoValue,
                packageVerified &&
                  styles.successValue,
              ]}
            >
              {packageVerified
                ? 'Package verified'
                : 'Waiting for scan'}
            </Text>
          </View>
        </View>

        {/* Customer Verification */}

        {packageVerified && (
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
                  Customer Verification
                </Text>

                <Text
                  style={
                    styles.cardSubtitle
                  }
                >
                  Ask the customer for the 6-digit OTP
                  shown on their app.
                </Text>
              </View>
            </View>

            <View>
              <View
                style={[
                  styles.otpInputContainer,
                  otpVerified &&
                    styles.otpInputContainerSuccess,
                ]}
              >
                <TextInput
                  value={otp}
                  onChangeText={
                    handleOtpChange
                  }
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="Enter OTP"
                  placeholderTextColor="#A3AAA3"
                  style={
                    styles.otpInput
                  }
                  textAlign="center"
                  editable={
                    !otpVerified
                  }
                />
              </View>

              <Text
                style={
                  styles.otpHint
                }
              >
                Enter the 6-digit OTP provided by the
                customer.
              </Text>

              {!otpVerified ? (
                <Pressable
                  style={[
                    styles.primaryButton,
                    otp.length !== 6 &&
                      styles.primaryButtonDisabled,
                  ]}
                  onPress={
                    handleVerifyOtp
                  }
                  disabled={
                    otp.length !== 6
                  }
                >
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    VERIFY OTP
                  </Text>
                </Pressable>
              ) : (
                <View
                  style={
                    styles.successBanner
                  }
                >
                  <View
                    style={
                      styles.successIcon
                    }
                  >
                    <Text
                      style={
                        styles.successIconText
                      }
                    >
                      ✓
                    </Text>
                  </View>

                  <View
                    style={
                      styles.successContent
                    }
                  >
                    <Text
                      style={
                        styles.successTitle
                      }
                    >
                      Customer OTP Verified
                    </Text>

                    <Text
                      style={
                        styles.successText
                      }
                    >
                      Customer verification has been
                      completed successfully.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Final verification state */}

        {allVerified && (
          <View
            style={
              styles.finalCard
            }
          >
            <View
              style={
                styles.finalIcon
              }
            >
              <Text
                style={
                  styles.finalIconText
              }
              >
                ✓
              </Text>
            </View>

            <Text
              style={
                styles.finalTitle
              }
            >
              Delivery Verification Complete
            </Text>

            <Text
              style={
                styles.finalDescription
              }
            >
              The package and customer have both been
              verified successfully.
            </Text>

            <Text
              style={
                styles.finalNote
              }
            >
              You can now proceed to COD collection before
              final delivery completion.
            </Text>
          </View>
        )}

        {/* Continue to COD collection */}

        {allVerified && (
          <Pressable
            style={
              styles.primaryButton
            }
            onPress={
              handleProceedToCODCollection
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              CONTINUE TO COD COLLECTION
            </Text>
          </Pressable>
        )}

        {/* Back action */}

        <Pressable
          style={
            styles.backButton
          }
          onPress={
            handleBackToDelivery
          }
        >
          <Text
            style={
              styles.backButtonText
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
    backgroundColor: '#E8F5E9',
  },

  headerBadgeText: {
    fontSize: 8,
    fontWeight: '700',
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
    width: '0%',
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 4,
  },

  progressFillHalf: {
    width: '50%',
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

  verificationBox: {
    alignItems: 'center',
    backgroundColor: '#F7FAF7',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5EAE5',
    borderStyle: 'dashed',
    marginBottom: 16,
  },

  verificationBoxSuccess: {
    backgroundColor: '#EEF8EF',
    borderColor: '#C8E6C9',
    borderStyle: 'solid',
  },

  qrIcon: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  qrIconSuccess: {
    backgroundColor: '#2E7D32',
  },

  qrIconText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2E7D32',
  },

  qrIconTextSuccess: {
    color: '#FFFFFF',
  },

  verificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },

  verificationDescription: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    color: '#7A827A',
    textAlign: 'center',
  },

  cameraScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },

  cameraHeader: {
    height: 72,
    paddingHorizontal: 18,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cameraHeaderLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#A7ADA7',
  },

  cameraHeaderOrder: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  cameraCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#252825',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cameraCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 27,
    fontWeight: '400',
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
    ...StyleSheet.absoluteFill,
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
    borderColor: '#FFFFFF',
  },

  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },

  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },

  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },

  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },

  scannerInstruction: {
    marginTop: 25,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#FFFFFF',
    fontSize: 11,
    textAlign: 'center',
  },

  cameraBottomButton: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 20,
    height: 50,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cameraBottomButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2E7D32',
  },

  cameraMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#101210',
  },

  cameraMessageIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  cameraMessageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  cameraMessageDescription: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#C5CBC5',
    textAlign: 'center',
  },

  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 11,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 17,
  },

  primaryButtonDisabled: {
    backgroundColor: '#B7C0B7',
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

  permissionSettingsText: {
    marginTop: 14,
    fontSize: 10,
    lineHeight: 16,
    color: '#F0C36E',
    textAlign: 'center',
  },

  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5A2020',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  errorIconText: {
    color: '#FF8A80',
    fontSize: 26,
    fontWeight: '800',
  },

  scannedCodeBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F1F7F1',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginBottom: 16,
  },

  scannedCodeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6C756C',
    marginBottom: 4,
  },

  scannedCodeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F0',
  },

  infoRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 11,
  },

  infoLabel: {
    fontSize: 12,
    color: '#7A827A',
  },

  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },

  successValue: {
    color: '#2E7D32',
  },

  otpInputContainer: {
    height: 58,
    borderWidth: 1,
    borderColor: '#C9D0C9',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },

  otpInputContainerSuccess: {
    borderColor: '#81C784',
    backgroundColor: '#F2FBF3',
  },

  otpInput: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    color: '#1F2937',
  },

  otpHint: {
    marginTop: 9,
    fontSize: 10,
    lineHeight: 16,
    color: '#8A918A',
  },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 14,
    marginTop: 17,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },

  successIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  successIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  successContent: {
    flex: 1,
  },

  successTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },

  successText: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 16,
    color: '#667066',
  },

  finalCard: {
    alignItems: 'center',
    backgroundColor: '#EEF8EF',
    borderRadius: 17,
    padding: 22,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#B8DDBA',
  },

  finalIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  finalIconText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },

  finalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },

  finalDescription: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    color: '#667066',
    textAlign: 'center',
  },

  finalNote: {
    marginTop: 10,
    fontSize: 10,
    lineHeight: 16,
    color: '#7A827A',
    textAlign: 'center',
  },

  backButton: {
    height: 50,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C9D0C9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5F675F',
  },
});

export default DeliveryVerificationScreen;