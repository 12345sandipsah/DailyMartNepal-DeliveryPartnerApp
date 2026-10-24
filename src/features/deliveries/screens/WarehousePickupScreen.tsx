import React, {useCallback, useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faBolt,
  faBox,
  faBoxesStacked,
  faCheck,
  faChevronRight,
  faCircle,
  faCircleCheck,
  faInfo,
  faKeyboard,
  faLocationArrow,
  faLocationDot,
  faQrcode,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {useBarcodeScannerOutput} from 'react-native-vision-camera-barcode-scanner';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type {MainStackParamList} from '../../../app/navigation/MainNavigator';
import {startDelivery} from '../../../shared/services/api';

type Props = NativeStackScreenProps<MainStackParamList, 'WarehousePickup'>;
type Navigation = NativeStackNavigationProp<
  MainStackParamList,
  'WarehousePickup'
>;

type PickupStage = 'LIST' | 'SCAN' | 'VERIFIED' | 'COMPLETED';

type PickupOrder = {
  id: string;
  status: 'PENDING' | 'SCANNED';
};

const normalizeCode = (value: string): string =>
  value.trim().replace(/^#/, '').toUpperCase();

function WarehousePickupScreen({route}: Props) {
  const navigation = useNavigation<Navigation>();
  const isFocused = useIsFocused();
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();

  const {deliveryId} = route.params;

  const validDeliveryId =
    typeof deliveryId === 'string' && deliveryId.trim().length > 0;

  const orderId = validDeliveryId ? deliveryId.trim().replace(/^#/, '') : '';

  const [stage, setStage] = useState<PickupStage>('LIST');

  const [order, setOrder] = useState<PickupOrder>({
    id: orderId,
    status: 'PENDING',
  });

  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isStartingDelivery, setIsStartingDelivery] = useState(false);

  // Prevent repeated camera frames from confirming the same order twice.
  const scanHandledRef = useRef(false);

  const isVerified = order.status === 'SCANNED';

  const scannerActive =
    isFocused &&
    stage === 'SCAN' &&
    hasPermission &&
    device !== undefined &&
    order.status === 'PENDING';

  const handleBack = useCallback(() => {
    if (stage === 'SCAN') {
      scanHandledRef.current = false;
      setScannerError(null);
      setStage('LIST');
      return;
    }

    if (stage === 'VERIFIED') {
      setStage('LIST');
      return;
    }

    navigation.goBack();
  }, [navigation, stage]);

  const handleStartScan = useCallback(async () => {
    if (!validDeliveryId) {
      Alert.alert(
        'Delivery ID unavailable',
        'Return to delivery details and reopen warehouse pickup.',
      );
      return;
    }

    if (order.status === 'SCANNED') {
      Alert.alert(
        'Already verified',
        'This order has already been scanned successfully.',
      );
      return;
    }

    scanHandledRef.current = false;
    setScannerError(null);

    if (!hasPermission) {
      try {
        const granted = await requestPermission();

        if (!granted) {
          Alert.alert(
            'Camera permission required',
            'Allow camera access in your device settings to scan the order.',
          );
          return;
        }
      } catch {
        Alert.alert(
          'Camera permission error',
          'Unable to request camera permission. Please check your device settings.',
        );
        return;
      }
    }

    setStage('SCAN');
  }, [hasPermission, order.status, requestPermission, validDeliveryId]);

  const handleBarcodeScanned = useCallback(
    (barcodes: any[]) => {
      if (
        scanHandledRef.current ||
        stage !== 'SCAN' ||
        order.status === 'SCANNED' ||
        !Array.isArray(barcodes) ||
        barcodes.length === 0
      ) {
        return;
      }

      const scannedValue = String(
        barcodes.find((barcode: any) => barcode?.value)?.value ?? '',
      ).trim();

      if (!scannedValue) {
        return;
      }

      if (normalizeCode(scannedValue) !== normalizeCode(orderId)) {
        setScannerError('This code does not match the assigned delivery.');
        return;
      }

      // Lock before updating state to prevent duplicate scan callbacks.
      scanHandledRef.current = true;
      setScannerError(null);

      setOrder(previous => ({
        ...previous,
        status: 'SCANNED',
      }));

      setStage('VERIFIED');
    },
    [order.status, orderId, stage],
  );

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
    onError: (error: any) => {
      setScannerError(
        error?.message ?? 'The scanner encountered an error. Please try again.',
      );
    },
  });

  const handleManualEntry = useCallback(() => {
    Alert.alert(
      'Manual Entry',
      'Manual order-ID entry is not enabled yet. Please scan the assigned order using the camera.',
    );
  }, []);

  const handleConfirmPickup = useCallback(() => {
    if (order.status !== 'SCANNED') {
      Alert.alert(
        'Pickup not verified',
        'Scan the assigned order successfully before confirming pickup.',
      );
      return;
    }

    setStage('COMPLETED');
  }, [order.status]);

  const handleContinueToDelivery = useCallback(async () => {
    if (!validDeliveryId || order.status !== 'SCANNED' || isStartingDelivery) {
      Alert.alert('Pickup not verified', 'Scan the assigned order before continuing.');
      return;
    }
    setIsStartingDelivery(true);
    try {
      await startDelivery(orderId);
      navigation.navigate('ActiveDelivery', {deliveryId: orderId});
    } catch (error) {
      Alert.alert('Could not start delivery', error instanceof Error ? error.message : 'Please refresh and retry.');
    } finally {
      setIsStartingDelivery(false);
    }
  }, [isStartingDelivery, navigation, order.status, orderId, validDeliveryId]);
  if (!validDeliveryId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContent}>
          <FontAwesomeIcon
            icon={faCircleCheck}
            size={42}
            color="#D97706"
          />

          <Text style={styles.centerTitle}>Delivery ID unavailable</Text>

          <Text style={styles.centerMessage}>
            Open warehouse pickup from a valid delivery so the handover can be
            associated with the correct order.
          </Text>

          <Pressable style={styles.primaryButton} onPress={handleBack}>
            <FontAwesomeIcon icon={faArrowLeft} size={15} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // STAGE 1: ASSIGNED ORDER
  if (stage === 'LIST') {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable style={styles.headerBack} onPress={handleBack}>
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={18}
                color="#20282A"
              />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Warehouse Pickup</Text>
              <Text style={styles.headerSubtitle}>
                Verify the assigned order before delivery
              </Text>
            </View>

            <View style={styles.headerIcon}>
              <FontAwesomeIcon
                icon={faWarehouse}
                size={20}
                color="#078F46"
              />
            </View>
          </View>

          <View style={styles.warehouseCard}>
            <View style={styles.warehouseIcon}>
              <FontAwesomeIcon
                icon={faWarehouse}
                size={23}
                color="#078F46"
              />
            </View>

            <View style={styles.warehouseInfo}>
              <Text style={styles.warehouseTitle}>DailyMart Warehouse</Text>

              <View style={styles.inlineRow}>
                <FontAwesomeIcon
                  icon={faLocationDot}
                  size={12}
                  color="#6B7771"
                />
                <Text style={styles.mutedText}>Kathmandu, Nepal</Text>
              </View>
            </View>

            <Pressable
              style={styles.navigateButton}
              onPress={() =>
                Alert.alert(
                  'Navigate to Warehouse',
                  'Warehouse navigation is not connected to Mapbox yet.',
                )
              }>
              <FontAwesomeIcon
                icon={faLocationArrow}
                size={13}
                color="#FFFFFF"
              />
              <Text style={styles.navigateButtonText}>Navigate</Text>
            </Pressable>
          </View>

          <View style={styles.instructionBanner}>
            <FontAwesomeIcon icon={faInfo} size={16} color="#1975D2" />

            <View style={styles.instructionText}>
              <Text style={styles.instructionTitle}>Verify assigned order</Text>
              <Text style={styles.mutedText}>
                Scan the order code once. Individual products do not need
                separate scans.
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Assigned Order</Text>
              <Text style={styles.mutedText}>
                {isVerified ? 'Order verified' : 'Waiting for verification'}
              </Text>
            </View>

            <View
              style={[
                styles.statusPill,
                isVerified && styles.statusPillVerified,
              ]}>
              <FontAwesomeIcon
                icon={isVerified ? faCheck : faCircle}
                size={9}
                color={isVerified ? '#078F46' : '#D97706'}
              />

              <Text
                style={[
                  styles.statusText,
                  isVerified && styles.statusTextVerified,
                ]}>
                {isVerified ? 'VERIFIED' : 'PENDING'}
              </Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.mutedText}>Pickup progress</Text>
              <Text style={styles.progressValue}>
                {isVerified ? '100%' : '0%'}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {width: isVerified ? '100%' : '0%'},
                ]}
              />
            </View>

            <Text style={styles.mutedText}>
              {isVerified
                ? 'The assigned order has been verified.'
                : 'Scan the assigned order to verify warehouse pickup.'}
            </Text>
          </View>

          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.orderIcon}>
                <FontAwesomeIcon
                  icon={faBox}
                  size={21}
                  color="#078F46"
                />
              </View>

              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>{orderId}</Text>
                <Text style={styles.mutedText}>
                  Current assigned delivery
                </Text>
              </View>

              <View
                style={[
                  styles.statusPill,
                  isVerified && styles.statusPillVerified,
                ]}>
                <Text
                  style={[
                    styles.statusText,
                    isVerified && styles.statusTextVerified,
                  ]}>
                  {isVerified ? 'SCANNED' : 'PENDING'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.orderDetails}>
              <FontAwesomeIcon
                icon={faBoxesStacked}
                size={14}
                color="#6B7771"
              />
              <Text style={styles.mutedText}>One scan per order</Text>
            </View>

            <Pressable
              style={[
                styles.scanButton,
                isVerified && styles.scanButtonVerified,
              ]}
              onPress={handleStartScan}
              disabled={isVerified}>
              <FontAwesomeIcon
                icon={isVerified ? faCheck : faQrcode}
                size={16}
                color="#FFFFFF"
              />

              <Text style={styles.scanButtonText}>
                {isVerified ? 'Order Verified' : 'Scan Order'}
              </Text>

              {!isVerified && (
                <FontAwesomeIcon
                  icon={faChevronRight}
                  size={13}
                  color="#FFFFFF"
                />
              )}
            </Pressable>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Pickup Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.mutedText}>Assigned orders</Text>
              <Text style={styles.summaryValue}>1</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.mutedText}>Verified orders</Text>
              <Text style={styles.summaryValueGreen}>
                {isVerified ? '1 / 1' : '0 / 1'}
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.primaryButton,
              !isVerified && styles.disabledButton,
            ]}
            onPress={handleConfirmPickup}
            disabled={!isVerified}>
            <Text style={styles.primaryButtonText}>
              Confirm Pickup & Continue
            </Text>

            <FontAwesomeIcon
              icon={faArrowRight}
              size={17}
              color="#FFFFFF"
            />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // STAGE 2: REAL CAMERA SCANNER
  if (stage === 'SCAN') {
    return (
      <SafeAreaView
        style={styles.scannerSafeArea}
        edges={['top', 'left', 'right']}>
        <View style={styles.scannerScreen}>
          <View style={styles.scannerHeader}>
            <Pressable style={styles.scannerBack} onPress={handleBack}>
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={18}
                color="#FFFFFF"
              />
            </Pressable>

            <View style={styles.scannerHeaderText}>
              <Text style={styles.scannerTitle}>Scan Assigned Order</Text>
              <Text style={styles.scannerOrderId}>{orderId}</Text>
            </View>

            <View style={styles.flashButton}>
              <FontAwesomeIcon icon={faBolt} size={20} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.cameraArea}>
            {hasPermission && device ? (
              <Camera
                key={device.id}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={scannerActive}
                implementationMode="compatible"
                resizeMode="cover"
                outputs={[barcodeScannerOutput]}
                onError={(error: any) => {
                  setScannerError(
                    error?.message ?? 'Camera error. Please try again.',
                  );
                }}
              />
            ) : (
              <View style={styles.cameraMessage}>
                <Text style={styles.cameraMessageTitle}>
                  {!device
                    ? 'Rear camera unavailable'
                    : 'Camera permission required'}
                </Text>

                <Text style={styles.cameraMessageText}>
                  {!device
                    ? 'This device does not currently provide a rear camera.'
                    : 'Allow camera access to scan the assigned order.'}
                </Text>

                {!hasPermission && (
                  <Pressable
                    style={styles.cameraPermissionButton}
                    onPress={async () => {
                      try {
                        const granted = await requestPermission();

                        if (granted) {
                          setScannerError(null);
                        }
                      } catch {
                        setScannerError(
                          'Unable to request camera permission.',
                        );
                      }
                    }}>
                    <Text style={styles.primaryButtonText}>Allow Camera</Text>
                  </Pressable>
                )}
              </View>
            )}

            {scannerError ? (
              <View pointerEvents="none" style={styles.scannerError}>
                <Text style={styles.scannerErrorText}>{scannerError}</Text>
              </View>
            ) : null}

            {/* Visual guide only. The actual scan comes from the camera. */}
            <View pointerEvents="none" style={styles.scanFrame}>
              <View style={[styles.scanCorner, styles.topLeft]} />
              <View style={[styles.scanCorner, styles.topRight]} />
              <View style={[styles.scanCorner, styles.bottomLeft]} />
              <View style={[styles.scanCorner, styles.bottomRight]} />
              <View style={styles.scanLine} />
            </View>

            <View pointerEvents="none" style={styles.scanHelp}>
              <FontAwesomeIcon icon={faQrcode} size={17} color="#FFFFFF" />
              <Text style={styles.scanHelpText}>
                Align the assigned order code inside the frame
              </Text>
            </View>
          </View>

          <View style={styles.scannerBottom}>
            <View style={styles.manualEntryCard}>
              <View style={styles.manualEntryIcon}>
                <FontAwesomeIcon
                  icon={faKeyboard}
                  size={19}
                  color="#078F46"
                />
              </View>

              <View style={styles.manualEntryInfo}>
                <Text style={styles.manualEntryTitle}>Manual Entry</Text>
                <Text style={styles.mutedText}>
                  Enter order ID manually
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={handleManualEntry}>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  size={15}
                  color="#66736D"
                />
              </Pressable>
            </View>

            <Text style={styles.scannerHint}>
              A successful scan verifies the order only once.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // STAGE 3: VERIFIED
  if (stage === 'VERIFIED') {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.resultContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.resultHeader}>
            <Pressable style={styles.headerBack} onPress={handleBack}>
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={18}
                color="#20282A"
              />
            </Pressable>

            <Text style={styles.resultHeaderTitle}>Order Verified</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.resultHero}>
            <View style={styles.successCircle}>
              <FontAwesomeIcon icon={faCheck} size={29} color="#FFFFFF" />
            </View>

            <Text style={styles.resultTitle}>Order Verified!</Text>

            <Text style={styles.resultSubtitle}>
              The assigned order was scanned successfully.
            </Text>
          </View>

          <View style={styles.resultCard}>
            <View style={styles.resultCardRow}>
              <Text style={styles.orderId}>{orderId}</Text>

              <View style={styles.statusPillVerified}>
                <Text style={styles.statusTextVerified}>VERIFIED</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.orderDetails}>
              <FontAwesomeIcon
                icon={faCircleCheck}
                size={16}
                color="#078F46"
              />
              <Text style={styles.resultCardText}>
                One successful scan recorded for this order.
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={handleConfirmPickup}>
            <Text style={styles.primaryButtonText}>Complete Pickup</Text>
            <FontAwesomeIcon
              icon={faArrowRight}
              size={17}
              color="#FFFFFF"
            />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // STAGE 4: PICKUP COMPLETED
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.resultContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.resultHeader}>
          <Pressable style={styles.headerBack} onPress={handleBack}>
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={18}
              color="#20282A"
            />
          </Pressable>

          <Text style={styles.resultHeaderTitle}>Pickup Completed</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.resultHero}>
          <View style={styles.successCircle}>
            <FontAwesomeIcon icon={faCheck} size={29} color="#FFFFFF" />
          </View>

          <Text style={styles.resultTitle}>Warehouse Pickup Completed!</Text>

          <Text style={styles.resultSubtitle}>
            The assigned order has been verified and pickup is confirmed.
          </Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.summaryTitle}>Pickup Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.mutedText}>Order ID</Text>
            <Text style={styles.summaryValue}>{orderId}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.mutedText}>Scan status</Text>
            <Text style={styles.summaryValueGreen}>Verified</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.mutedText}>Pickup status</Text>
            <Text style={styles.summaryValueGreen}>Completed</Text>
          </View>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={handleContinueToDelivery}>
          <Text style={styles.primaryButtonText}>{isStartingDelivery ? 'Starting...' : 'Continue to Delivery'}</Text>
          <FontAwesomeIcon
            icon={faArrowRight}
            size={17}
            color="#FFFFFF"
          />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8F6',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerBack: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E7ECE8',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#20282A',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: '#6B7771',
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E5F6EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehouseCard: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5ECE7',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  warehouseIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#E5F6EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehouseInfo: {
    flex: 1,
    marginLeft: 10,
  },
  warehouseTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#20282A',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  mutedText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#6B7771',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: '#079A49',
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 13,
    backgroundColor: '#EDF6FF',
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionText: {
    flex: 1,
  },
  instructionTitle: {
    color: '#245B8E',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#20282A',
    fontSize: 16,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFF4DF',
  },
  statusPillVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E5F6EA',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B7791F',
  },
  statusTextVerified: {
    fontSize: 9,
    fontWeight: '800',
    color: '#078F46',
  },
  progressCard: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5ECE7',
    borderRadius: 14,
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#078F46',
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#E8EEE9',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 9,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#079A49',
    borderRadius: 10,
  },
  orderCard: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5ECE7',
    marginBottom: 14,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#E5F6EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
    marginLeft: 10,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#20282A',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF1EF',
    marginVertical: 13,
  },
  orderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanButton: {
    minHeight: 49,
    borderRadius: 10,
    backgroundColor: '#079A49',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 14,
  },
  scanButtonVerified: {
    backgroundColor: '#07833E',
  },
  scanButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryCard: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5ECE7',
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#20282A',
    marginBottom: 8,
  },
  summaryRow: {
    minHeight: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#20282A',
  },
  summaryValueGreen: {
    fontSize: 12,
    fontWeight: '800',
    color: '#078F46',
  },
  primaryButton: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: '#079A49',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  disabledButton: {
    backgroundColor: '#A8CBB4',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  scannerSafeArea: {
    flex: 1,
    backgroundColor: '#151A1B',
  },
  scannerScreen: {
    flex: 1,
    backgroundColor: '#151A1B',
  },
  scannerHeader: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 10,
  },
  scannerBack: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerHeaderText: {
    flex: 1,
  },
  scannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scannerOrderId: {
    fontSize: 11,
    color: '#D0D8D3',
    marginTop: 4,
  },
  flashButton: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraArea: {
    flex: 1,
    minHeight: 300,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#303637',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraMessage: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  cameraMessageTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  cameraMessageText: {
    marginTop: 8,
    color: '#E4E9E6',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  cameraPermissionButton: {
    minHeight: 44,
    marginTop: 14,
    paddingHorizontal: 18,
    borderRadius: 9,
    backgroundColor: '#079A49',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerError: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 5,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#7F1D1D',
  },
  scannerErrorText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
  },
  scanCorner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#FFFFFF',
    borderWidth: 4,
    borderRadius: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#28D66C',
  },
  scanHelp: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanHelpText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  scannerBottom: {
    padding: 16,
    backgroundColor: '#F6F8F6',
  },
  manualEntryCard: {
    minHeight: 66,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5ECE7',
    gap: 10,
  },
  manualEntryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E5F6EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualEntryInfo: {
    flex: 1,
  },
  manualEntryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#20282A',
    marginBottom: 3,
  },
  scannerHint: {
    fontSize: 11,
    color: '#6B7771',
    textAlign: 'center',
    marginTop: 10,
  },
  resultContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 30,
  },
  resultHeader: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#20282A',
  },
  headerSpacer: {
    width: 42,
  },
  resultHero: {
    alignItems: 'center',
    paddingVertical: 35,
  },
  successCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#079A49',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  resultTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#20282A',
    textAlign: 'center',
  },
  resultSubtitle: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7771',
    textAlign: 'center',
  },
  resultCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5ECE7',
    marginBottom: 18,
  },
  resultCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  resultCardText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#4D5953',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  centerTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '800',
    color: '#18201E',
    textAlign: 'center',
  },
  centerMessage: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: '#66736D',
    textAlign: 'center',
  },
});

export default WarehousePickupScreen;
