import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faArrowDown,
  faBullseye,
  faCommentDots,
  faLocationArrow,
  faLocationCrosshairs,
  faPhone,
  faRoute,
  faVolumeHigh,
  faVolumeXmark,
} from '@fortawesome/free-solid-svg-icons';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Mapbox, {
  requestAndroidLocationPermissions,
  type Location,
} from '@rnmapbox/maps';

import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

import { MAPBOX_ACCESS_TOKEN } from '../../../config/mapboxConfig';
import { getDelivery, updatePartnerLocation } from '../../../shared/services/api';

type NavigationScreenProps = NativeStackScreenProps<
  MainStackParamList,
  'Navigation'
>;

type DeliveryStop = {
  id: string;

  orderId: string;

  customerName: string;

  customerPhone: string;

  address: string;

  coordinate: [number, number];

  paymentMethod: 'COD' | 'ONLINE';

  amount: number;
};

type RouteShape = {
  type: 'Feature';

  properties: Record<string, never>;

  geometry: {
    type: 'LineString';

    coordinates: [number, number][];
  };
};

type DirectionsRoute = {
  distance: number;

  duration: number;

  geometry: {
    type: 'LineString';

    coordinates: number[][];
  };
};

type DirectionsResponse = {
  code: string;

  message?: string;

  routes?: DirectionsRoute[];
};



/**
  * Temporary starting coordinate only.
  * The actual route starts from real phone GPS
  * once tracking is enabled.

  */

const INITIAL_PARTNER_COORDINATE: [number, number] = [84.8665, 27.0055];

const MAX_ROUTE_COORDINATES = 25;

const ROUTE_REROUTE_DISTANCE_KM = 0.1;

const ROUTE_REQUEST_INTERVAL_MS = 30_000;

const DELIVERY_ROUTE_LINE_STYLE = {
  lineColor: '#167DE4',

  lineWidth: 6,

  lineCap: 'round' as const,

  lineJoin: 'round' as const,
};

function calculateDistanceKm(
  start: [number, number],

  end: [number, number],
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;

  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(end[1] - start[1]);

  const longitudeDifference = toRadians(end[0] - start[0]);

  const a =
    Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) +
    Math.cos(toRadians(start[1])) *
      Math.cos(toRadians(end[1])) *
      Math.sin(longitudeDifference / 2) *
      Math.sin(longitudeDifference / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),

      Math.sqrt(1 - a),
    );

  return earthRadiusKm * c;
}

function NavigationScreen({ route, navigation }: NavigationScreenProps) {
  const { deliveryId } = route.params;

  const cameraRef = useRef<React.ComponentRef<typeof Mapbox.Camera> | null>(
    null,
  );

  const routeAbortControllerRef = useRef<AbortController | null>(null);

  /**
  * Origin used by the most recent route request.

    */

  const lastRequestedRouteOriginRef = useRef<[number, number] | null>(null);

  /**
  * Delivery-stop order used by the most recent
  * route request.

    */

  const lastRequestedStopOrderRef = useRef('');

  /**
  * Origin from the most recent successful route.

    */

  const lastSuccessfulRouteOriginRef = useRef<[number, number] | null>(null);

  const lastRouteRequestTimeRef = useRef(0);

  const lastPartnerLocationPostRef = useRef(0);

  const [isTracking, setIsTracking] = useState(false);

  const [hasLiveLocation, setHasLiveLocation] = useState(false);

  const [partnerCoordinate, setPartnerCoordinate] = useState<[number, number]>(
    INITIAL_PARTNER_COORDINATE,
  );

  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);

  const [deliveryStops, setDeliveryStops] = useState<DeliveryStop[]>([]);

  /**
  * IMPORTANT:
  * No fallback route line.
  * A route appears only after Mapbox returns
  * a real road route.

    */

  const [routeShape, setRouteShape] = useState<RouteShape | null>(null);

  /**
  * These values are ONLY Mapbox road-route values.

    */

  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);

  const [routeDurationMinutes, setRouteDurationMinutes] = useState<
    number | null
  >(null);

  const [isRouteLoading, setIsRouteLoading] = useState(false);

  const [routeError, setRouteError] = useState<string | null>(null);

  const [isMuted, setIsMuted] = useState(false);

  const [showRouteOverview, setShowRouteOverview] = useState(false);

  const routeCoordinates = useMemo(() => {
    return [partnerCoordinate, ...deliveryStops.map(stop => stop.coordinate)];
  }, [partnerCoordinate, deliveryStops]);

  const stopOrderKey = useMemo(() => {
    return deliveryStops

      .map(stop => stop.id)

      .join('|');
  }, [deliveryStops]);

  const currentStop = deliveryStops[0] ?? null;

  useEffect(() => {
    let active = true;
    setDeliveryStops([]);
    getDelivery(deliveryId.replace(/^#/, ''))
      .then(order => {
        const location = order.deliveryLocation;
        const latitude = Number(location?.latitude);
        const longitude = Number(location?.longitude);
        if (!active) return;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          setRouteError('This order does not have valid delivery coordinates. Contact warehouse support.');
          return;
        }
        setDeliveryStops([{
          id: order._id,
          orderId: order.orderNumber,
          customerName: location?.name || order.customer?.fullName || 'Customer',
          customerPhone: location?.phone || order.customer?.mobileNumber || '',
          address: [location?.locality, location?.formattedAddress, location?.cityName].filter(Boolean).join(', '),
          coordinate: [longitude, latitude],
          paymentMethod: order.paymentMethod === 'cod' ? 'COD' : 'ONLINE',
          amount: order.paymentMethod === 'cod' ? Number(order.total || 0) : 0,
        }]);
      })
      .catch(error => {
        if (active) setRouteError(error instanceof Error ? error.message : 'Unable to load this delivery.');
      });
    return () => { active = false; };
  }, [deliveryId]);

  const fitMapToAllStops = useCallback(() => {
    if (routeCoordinates.length < 2) {
      return;
    }

    const longitudes = routeCoordinates.map(coordinate => coordinate[0]);

    const latitudes = routeCoordinates.map(coordinate => coordinate[1]);

    const minLongitude = Math.min(...longitudes);

    const maxLongitude = Math.max(...longitudes);

    const minLatitude = Math.min(...latitudes);

    const maxLatitude = Math.max(...latitudes);

    cameraRef.current?.fitBounds(
      [maxLongitude, maxLatitude],

      [minLongitude, minLatitude],

      [70, 60, 300, 60],

      800,
    );
  }, [routeCoordinates]);

  const fitToCurrentStop = useCallback(() => {
    if (!currentStop) {
      return;
    }

    cameraRef.current?.fitBounds(
      [
        Math.max(
          partnerCoordinate[0],

          currentStop.coordinate[0],
        ),

        Math.max(
          partnerCoordinate[1],

          currentStop.coordinate[1],
        ),
      ],

      [
        Math.min(
          partnerCoordinate[0],

          currentStop.coordinate[0],
        ),

        Math.min(
          partnerCoordinate[1],

          currentStop.coordinate[1],
        ),
      ],

      [80, 50, 290, 50],

      800,
    );
  }, [partnerCoordinate, currentStop]);

  const moveStop = (
    currentIndex: number,

    direction: 'up' | 'down',
  ) => {
    const targetIndex =
      direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= deliveryStops.length) {
      return;
    }

    setDeliveryStops(currentStops => {
      const updatedStops = [...currentStops];

      const currentStop = updatedStops[currentIndex];

      updatedStops[currentIndex] = updatedStops[targetIndex];

      updatedStops[targetIndex] = currentStop;

      return updatedStops;
    });
  };

  /**
  * MAPBOX DIRECTIONS API

    */

  const fetchRoadRoute = useCallback(
    async (
      coordinates: [number, number][],

      currentStopOrderKey: string,
    ) => {
      if (
        coordinates.length < 2 ||
        coordinates.length > MAX_ROUTE_COORDINATES
      ) {
        setRouteError(
          `A maximum of ${
            MAX_ROUTE_COORDINATES - 1
          } delivery stops can be included in one route.`,
        );

        return;
      }

      const coordinateString = coordinates

        .map(([longitude, latitude]) => `${longitude},${latitude}`)

        .join(';');

      const requestUrl =
        `https\://api.mapbox.com/directions/v5/mapbox/driving-traffic/` +
        `${coordinateString}` +
        `?alternatives=false` +
        `&overview=full` +
        `&geometries=geojson` +
        `&steps=false` +
        `&access_token=${encodeURIComponent(MAPBOX_ACCESS_TOKEN)}`;

      routeAbortControllerRef.current?.abort();

      const controller = new AbortController();

      routeAbortControllerRef.current = controller;

      lastRequestedRouteOriginRef.current = coordinates[0];

      lastRequestedStopOrderRef.current = currentStopOrderKey;

      lastRouteRequestTimeRef.current = Date.now();

      setIsRouteLoading(true);

      setRouteError(null);

      try {
        const response = await fetch(
          requestUrl,

          {
            method: 'GET',

            signal: controller.signal,
          },
        );

        const data = (await response.json()) as DirectionsResponse;

        if (!response.ok) {
          throw new Error(
            data.message || `Route request failed (${response.status}).`,
          );
        }

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
          throw new Error(
            data.message ||
              'Mapbox could not find a road route for these locations.',
          );
        }

        const routeResult = data.routes[0];

        const routeCoordinatesFromApi = routeResult.geometry.coordinates

          .filter(
            coordinate =>
              coordinate.length >= 2 &&
              Number.isFinite(coordinate[0]) &&
              Number.isFinite(coordinate[1]),
          )

          .map(
            coordinate => [coordinate[0], coordinate[1]] as [number, number],
          );

        if (routeCoordinatesFromApi.length < 2) {
          throw new Error('Mapbox returned an invalid road route geometry.');
        }

        setRouteShape({
          type: 'Feature',

          properties: {},

          geometry: {
            type: 'LineString',

            coordinates: routeCoordinatesFromApi,
          },
        });

        setRouteDistanceKm(routeResult.distance / 1000);

        setRouteDurationMinutes(
          Math.max(
            1,

            Math.round(routeResult.duration / 60),
          ),
        );

        lastSuccessfulRouteOriginRef.current = coordinates[0];

        setRouteError(null);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        /**
  * Never replace a failed road route
  * with straight-line distance.

          */

        setRouteShape(null);

        setRouteDistanceKm(null);

        setRouteDurationMinutes(null);

        setRouteError(
          error instanceof Error
            ? error.message
            : 'Unable to calculate the road route.',
        );
      } finally {
        if (routeAbortControllerRef.current === controller) {
          routeAbortControllerRef.current = null;

          setIsRouteLoading(false);
        }
      }
    },

    [],
  );

  /**
  * IMPORTANT:
  * A route is NOT requested until real GPS
  * has been received.

    */

  useEffect(() => {
    if (!hasLiveLocation) {
      return;
    }

    const lastRequestedOrigin = lastRequestedRouteOriginRef.current;

    const noRouteRequestYet = lastRequestedOrigin === null;

    const orderChanged = lastRequestedStopOrderRef.current !== stopOrderKey;

    const partnerMovedEnough =
      lastRequestedOrigin !== null &&
      calculateDistanceKm(
        lastRequestedOrigin,

        partnerCoordinate,
      ) >= ROUTE_REROUTE_DISTANCE_KM;

    const enoughTimePassed =
      Date.now() - lastRouteRequestTimeRef.current >= ROUTE_REQUEST_INTERVAL_MS;

    const shouldFetchRoute =
      noRouteRequestYet ||
      orderChanged ||
      (partnerMovedEnough && enoughTimePassed);

    if (!shouldFetchRoute) {
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchRoadRoute(
        [partnerCoordinate, ...deliveryStops.map(stop => stop.coordinate)],

        stopOrderKey,
      );
    }, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    hasLiveLocation,

    partnerCoordinate,

    deliveryStops,

    stopOrderKey,

    fetchRoadRoute,
  ]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (hasLiveLocation) {
        fitToCurrentStop();
      } else {
        fitMapToAllStops();
      }
    }, 700);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [hasLiveLocation, deliveryStops, fitMapToAllStops, fitToCurrentStop]);

  useEffect(() => {
    return () => {
      routeAbortControllerRef.current?.abort();
    };
  }, []);

  const handleLocationUpdate = (location: Location) => {
    const longitude = location.coords.longitude;

    const latitude = location.coords.latitude;

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return;
    }

    setPartnerCoordinate([longitude, latitude]);

    if (
      typeof location.coords.accuracy === 'number' &&
      Number.isFinite(location.coords.accuracy)
    ) {
      setLocationAccuracy(location.coords.accuracy);
    }

    /**
  * This triggers the route effect.
  * The FIRST road route therefore starts from
  * the actual phone GPS location.

      */

    setHasLiveLocation(true);

    const now = Date.now();
    if (now - lastPartnerLocationPostRef.current >= 15000) {
      lastPartnerLocationPostRef.current = now;
      updatePartnerLocation(latitude, longitude).catch(() => {
        lastPartnerLocationPostRef.current = 0;
      });
    }
  };

  const handleStartTracking = async () => {
    try {
      const hasPermission = await requestAndroidLocationPermissions();

      if (!hasPermission) {
        setIsTracking(false);

        setHasLiveLocation(false);

        Alert.alert(
          'Location Permission Required',

          'DailyMart needs your location to calculate the real road route from your current position.',
        );

        return;
      }

      /**
  * Clear previous route state before starting
  * a fresh navigation session.

        */

      setRouteShape(null);

      setRouteDistanceKm(null);

      setRouteDurationMinutes(null);

      setRouteError(null);

      lastRequestedRouteOriginRef.current = null;

      lastRequestedStopOrderRef.current = '';

      lastSuccessfulRouteOriginRef.current = null;

      lastRouteRequestTimeRef.current = 0;

      setHasLiveLocation(false);

      setIsTracking(true);

      setTimeout(() => {
        fitMapToAllStops();
      }, 500);
    } catch {
      setIsTracking(false);

      setHasLiveLocation(false);

      Alert.alert(
        'Location Error',

        'We could not request location permission. Please check your phone settings and try again.',
      );
    }
  };

  const handleStopTracking = () => {
    setIsTracking(false);

    setHasLiveLocation(false);

    routeAbortControllerRef.current?.abort();

    setRouteShape(null);

    setRouteDistanceKm(null);

    setRouteDurationMinutes(null);

    setRouteError(null);

    lastRequestedRouteOriginRef.current = null;

    lastRequestedStopOrderRef.current = '';

    lastSuccessfulRouteOriginRef.current = null;
  };

  const handleRetryRoute = () => {
    if (!hasLiveLocation) {
      Alert.alert(
        'Location Not Ready',

        'Wait until your current GPS location is available, then try again.',
      );

      return;
    }

    fetchRoadRoute(
      [partnerCoordinate, ...deliveryStops.map(stop => stop.coordinate)],

      stopOrderKey,
    );
  };

  const handleNavigateBack = () => {
    handleStopTracking();
    navigation.goBack();
  };

  const handleCallCustomer = () => {
    const phone = currentStop?.customerPhone.replace(/[^\d+]/g, '') || '';
    if (!phone) {
      Alert.alert('Customer phone unavailable', 'This order does not contain a customer phone number.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('Unable to call', 'This device cannot open the phone application.'),
    );
  };

  const handleMessageCustomer = () => {
    const phone = currentStop?.customerPhone.replace(/[^\d+]/g, '') || '';
    if (!phone) {
      Alert.alert('Customer phone unavailable', 'This order does not contain a customer phone number.');
      return;
    }
    Linking.openURL(`sms:${phone}`).catch(() =>
      Alert.alert('Unable to message', 'This device cannot open the messaging application.'),
    );
  };

  const displayDistance =
    routeDistanceKm !== null ? `${routeDistanceKm.toFixed(1)} km` : '—';

  const displayEta =
    routeDurationMinutes !== null ? `${routeDurationMinutes} min` : '—';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
        {/* ====================================================*

             HEADER*

         ===================================================== */}

        <View style={styles.header}>
          <Pressable
            style={styles.headerIconButton}
            onPress={handleNavigateBack}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={16} color="#1F2937" />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Navigation</Text>

            <Text style={styles.headerSubtitle}>{deliveryId}</Text>
          </View>

          <Pressable
            style={styles.headerHelpButton}
            onPress={() =>
              Alert.alert(
                'Help',

                'Navigation support will be connected later.',
              )
            }
          >
            <FontAwesomeIcon icon={faBullseye} size={14} color="#2563EB" />

            <Text style={styles.helpText}>Help</Text>
          </Pressable>
        </View>

        {/* ====================================================*

             TURN / ROUTE INSTRUCTION*

         ===================================================== */}

        <View style={styles.turnBanner}>
          <View style={styles.turnIconBox}>
            <FontAwesomeIcon icon={faArrowUp} size={18} color="#FFFFFF" />
          </View>

          <View style={styles.turnTextBlock}>
            <Text style={styles.turnTitle}>
              {isTracking ? 'Continue straight' : 'Start navigation'}
            </Text>

            <Text style={styles.turnSubtitle}>
              {isTracking
                ? 'towards customer location'
                : 'Route will be calculated from GPS'}
            </Text>
          </View>

          <Text style={styles.turnDistance}>
            {routeDistanceKm !== null
              ? `${Math.max(
                  100,

                  Math.round(routeDistanceKm * 1000),
                )} m`
              : '—'}
          </Text>
        </View>

        {/* ====================================================*

             MAP*

         ===================================================== */}

        <View style={styles.mapContainer}>
          <Mapbox.MapView
            style={styles.map}
            styleURL={Mapbox.StyleURL.Street}
            projection="mercator"
          >
            <Mapbox.Camera
              ref={cameraRef}
              defaultSettings={{
                centerCoordinate: INITIAL_PARTNER_COORDINATE,

                zoomLevel: 13,
              }}
            />

            {isTracking && (
              <Mapbox.UserLocation
                visible
                minDisplacement={5}
                animated
                androidRenderMode="gps"
                showsUserHeadingIndicator
                onUpdate={handleLocationUpdate}
              />
            )}

            {(!isTracking || !hasLiveLocation) && (
              <Mapbox.PointAnnotation
                id="partner-location"
                coordinate={partnerCoordinate}
                title="Delivery Partner"
              >
                <View style={styles.partnerMarker}>
                  <Text style={styles.partnerMarkerText}>▲</Text>
                </View>
              </Mapbox.PointAnnotation>
            )}

            {routeShape !== null && (
              <Mapbox.ShapeSource id="delivery-route" shape={routeShape}>
                <Mapbox.LineLayer
                  id="delivery-route-line"
                  style={DELIVERY_ROUTE_LINE_STYLE}
                />
              </Mapbox.ShapeSource>
            )}

            {deliveryStops.map((stop, index) => (
              <Mapbox.PointAnnotation
                key={stop.id}
                id={stop.id}
                coordinate={stop.coordinate}
                title={`${index + 1}. ${stop.orderId}`}
              >
                <View
                  style={[
                    styles.destinationMarker,

                    index === 0 && styles.destinationMarkerActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.destinationMarkerText,

                      index === 0 && styles.destinationMarkerTextActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
              </Mapbox.PointAnnotation>
            ))}
          </Mapbox.MapView>

          {/* Route loading */}

          {isRouteLoading && (
            <View style={styles.loadingBadge}>
              <ActivityIndicator size="small" color="#078D47" />

              <Text style={styles.loadingBadgeText}>Updating route...</Text>
            </View>
          )}

          {/* Map controls */}

          <View style={styles.mapControls}>
            <Pressable
              style={styles.mapControlButton}
              onPress={() => setIsMuted(previous => !previous)}
            >
              <Text style={styles.mapControlIcon}>
                <FontAwesomeIcon
                  icon={isMuted ? faVolumeXmark : faVolumeHigh}
                  size={17}
                  color="#1F2937"
                />
              </Text>
            </Pressable>

            <Pressable
              style={styles.mapControlButton}
              onPress={fitToCurrentStop}
            >
              <FontAwesomeIcon
                icon={faLocationCrosshairs}
                size={18}
                color="#1F2937"
              />
            </Pressable>

            <Pressable
              style={styles.mapControlButton}
              onPress={fitMapToAllStops}
            >
              <FontAwesomeIcon icon={faRoute} size={18} color="#1F2937" />
            </Pressable>
          </View>

          {/* GPS accuracy */}

          {hasLiveLocation && locationAccuracy !== null && (
            <View style={styles.accuracyBadge}>
              <View style={styles.accuracyDot} />

              <Text style={styles.accuracyText}>
                GPS ±{Math.round(locationAccuracy)} m
              </Text>
            </View>
          )}

          {/* Route failure */}

          {routeError !== null && (
            <View style={styles.routeErrorOverlay}>
              <Text style={styles.routeErrorOverlayTitle}>
                Route update unavailable
              </Text>

              <Text style={styles.routeErrorOverlayText}>{routeError}</Text>

              <Pressable style={styles.retryButton} onPress={handleRetryRoute}>
                <Text style={styles.retryButtonText}>RETRY</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ====================================================*

             BOTTOM NAVIGATION SHEET*

         ===================================================== */}

        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={styles.bottomSheetContent}
          >
            {/* ETA */}

            <View style={styles.etaRow}>
              <View>
                <Text style={styles.etaText}>{displayEta}</Text>

                <Text style={styles.arrivalText}>
                  {displayDistance}

                  {routeDurationMinutes !== null && ' • ETA from current route'}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,

                  isTracking ? styles.statusBadgeLive : styles.statusBadgeReady,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,

                    isTracking ? styles.statusDotLive : styles.statusDotReady,
                  ]}
                />

                <Text style={styles.statusBadgeText}>
                  {isTracking
                    ? hasLiveLocation
                      ? 'LIVE'
                      : 'LOCATING'
                    : 'READY'}
                </Text>
              </View>
            </View>

            {/* Customer */}

            {currentStop && (
              <View style={styles.customerCard}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {currentStop.customerName.charAt(0)}
                  </Text>
                </View>

                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>
                    {currentStop.customerName}
                  </Text>

                  <Text style={styles.customerAddress} numberOfLines={1}>
                    {currentStop.address}
                  </Text>

                  <Text style={styles.customerOrder}>
                    {currentStop.orderId}

                    {' • '}

                    {currentStop.paymentMethod === 'COD'
                      ? `COD NPR ${currentStop.amount.toLocaleString()}`
                      : 'Online payment'}
                  </Text>
                </View>

                <View style={styles.customerActions}>
                  <Pressable
                    style={styles.customerActionButton}
                    onPress={handleCallCustomer}
                  >
                    <FontAwesomeIcon icon={faPhone} size={16} color="#2563EB" />
                  </Pressable>

                  <Pressable
                    style={styles.customerActionButton}
                    onPress={handleMessageCustomer}
                  >
                    <FontAwesomeIcon
                      icon={faCommentDots}
                      size={16}
                      color="#2563EB"
                    />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Main navigation button */}

            {!isTracking ? (
              <Pressable
                style={styles.startNavigationButton}
                onPress={handleStartTracking}
              >
                <FontAwesomeIcon
                  icon={faLocationArrow}
                  size={16}
                  color="#FFFFFF"
                />

                <Text style={styles.navigationButtonText}>
                  Start Navigation
                </Text>

                <FontAwesomeIcon
                  icon={faArrowRight}
                  size={16}
                  color="#FFFFFF"
                />
              </Pressable>
            ) : (
              <Pressable
                style={styles.endNavigationButton}
                onPress={handleStopTracking}
              >
                <Text style={styles.endNavigationButtonText}>
                  End Navigation
                </Text>
              </Pressable>
            )}

            {/* Route overview */}

            <Pressable
              style={styles.routeOverviewHeader}
              onPress={() => setShowRouteOverview(previous => !previous)}
            >
              <View>
                <Text style={styles.routeOverviewTitle}>Route Overview</Text>

                <Text style={styles.routeOverviewSubtitle}>
                  {deliveryStops.length} delivery stops
                </Text>
              </View>

              <Text style={styles.routeOverviewArrow}>
                {showRouteOverview ? '⌃' : '⌄'}
              </Text>
            </Pressable>

            {showRouteOverview && (
              <View style={styles.routeOverviewPanel}>
                {deliveryStops.map((stop, index) => (
                  <View key={stop.id} style={styles.routeStopRow}>
                    <View style={styles.routeStopNumber}>
                      <Text style={styles.routeStopNumberText}>
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.routeStopInfo}>
                      <Text style={styles.routeStopOrder}>{stop.orderId}</Text>

                      <Text style={styles.routeStopCustomer}>
                        {stop.customerName}
                      </Text>

                      <Text style={styles.routeStopAddress}>
                        {stop.address}
                      </Text>
                    </View>

                    <View style={styles.reorderButtons}>
                      <Pressable
                        style={[
                          styles.reorderButton,

                          index === 0 && styles.reorderButtonDisabled,
                        ]}
                        disabled={index === 0}
                        onPress={() =>
                          moveStop(
                            index,

                            'up',
                          )
                        }
                      >
                        <FontAwesomeIcon
                          icon={faArrowUp}
                          size={12}
                          color="#374151"
                        />
                      </Pressable>

                      <Pressable
                        style={[
                          styles.reorderButton,

                          index === deliveryStops.length - 1 &&
                            styles.reorderButtonDisabled,
                        ]}
                        disabled={index === deliveryStops.length - 1}
                        onPress={() =>
                          moveStop(
                            index,

                            'down',
                          )
                        }
                      >
                        <FontAwesomeIcon
                          icon={faArrowDown}
                          size={12}
                          color="#374151"
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}

                <Pressable
                  style={styles.fitRouteButton}
                  onPress={fitMapToAllStops}
                >
                  <Text style={styles.fitRouteButtonText}>FIT ALL STOPS</Text>
                </Pressable>
              </View>
            )}

            {!hasLiveLocation && !isRouteLoading && (
              <Text style={styles.routeDisclaimer}>
                Start navigation to receive GPS location and calculate the real
                Mapbox road route.
              </Text>
            )}

            {routeDistanceKm !== null && routeError === null && (
              <Text style={styles.routeDisclaimer}>
                Distance and ETA are from the current Mapbox driving route.
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: '#FFFFFF',
  },

  screen: {
    flex: 1,

    backgroundColor: '#F5F8F6',
  },

  /* ======================================================*

      HEADER*

   ======================================================= */

  header: {
    height: 55,

    backgroundColor: '#FFFFFF',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 8,

    borderBottomWidth: 1,

    borderBottomColor: '#EAEFED',
  },

  headerIconButton: {
    width: 44,

    height: 44,

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
    fontSize: 18,

    fontWeight: '800',

    color: '#13191B',
  },

  headerSubtitle: {
    marginTop: 2,

    fontSize: 9.5,

    color: '#777F82',
  },

  headerHelpButton: {
    minWidth: 57,

    height: 40,

    paddingHorizontal: 4,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  helpIcon: {
    fontSize: 15,

    color: '#078C46',

    marginRight: 4,
  },

  helpText: {
    fontSize: 11.5,

    fontWeight: '800',

    color: '#078C46',
  },

  /* ======================================================*

      TURN BANNER*

   ======================================================= */

  turnBanner: {
    height: 65,

    backgroundColor: '#079A49',

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 12,
  },

  turnIconBox: {
    width: 41,

    height: 41,

    borderRadius: 21,

    backgroundColor: 'rgba(255,255,255,0.15)',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 9,
  },

  turnIcon: {
    fontSize: 25,

    fontWeight: '900',

    color: '#FFFFFF',
  },

  turnTextBlock: {
    flex: 1,
  },

  turnTitle: {
    fontSize: 13.5,

    fontWeight: '800',

    color: '#FFFFFF',
  },

  turnSubtitle: {
    marginTop: 2,

    fontSize: 9.5,

    color: '#DCF6E5',
  },

  turnDistance: {
    fontSize: 15,

    fontWeight: '800',

    color: '#FFFFFF',

    marginLeft: 8,
  },

  /* ======================================================*

      MAP*

   ======================================================= */

  mapContainer: {
    flex: 1,

    position: 'relative',

    backgroundColor: '#E5EDE4',

    minHeight: 300,
  },

  map: {
    flex: 1,
  },

  partnerMarker: {
    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: '#1687E8',

    borderWidth: 3,

    borderColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',
  },

  partnerMarkerText: {
    fontSize: 17,

    fontWeight: '900',

    color: '#FFFFFF',
  },

  destinationMarker: {
    width: 32,

    height: 32,

    borderRadius: 16,

    backgroundColor: '#FFFFFF',

    borderWidth: 3,

    borderColor: '#E54949',

    alignItems: 'center',

    justifyContent: 'center',
  },

  destinationMarkerActive: {
    backgroundColor: '#E54949',
  },

  destinationMarkerText: {
    fontSize: 10,

    fontWeight: '900',

    color: '#D63C3C',
  },

  destinationMarkerTextActive: {
    color: '#FFFFFF',
  },

  mapControls: {
    position: 'absolute',

    right: 12,

    top: 13,

    gap: 8,
  },

  mapControlButton: {
    width: 45,

    height: 45,

    borderRadius: 23,

    backgroundColor: 'rgba(255,255,255,0.96)',

    alignItems: 'center',

    justifyContent: 'center',

    shadowColor: '#000000',

    shadowOpacity: 0.12,

    shadowRadius: 7,

    shadowOffset: {
      width: 0,

      height: 2,
    },

    elevation: 3,
  },

  mapControlIcon: {
    fontSize: 19,

    color: '#343C3E',
  },

  loadingBadge: {
    position: 'absolute',

    left: 12,

    top: 13,

    height: 34,

    borderRadius: 17,

    paddingHorizontal: 10,

    backgroundColor: 'rgba(255,255,255,0.95)',

    flexDirection: 'row',

    alignItems: 'center',
  },

  loadingBadgeText: {
    marginLeft: 7,

    fontSize: 9.5,

    fontWeight: '700',

    color: '#586160',
  },

  accuracyBadge: {
    position: 'absolute',

    left: 12,

    bottom: 12,

    height: 30,

    borderRadius: 15,

    paddingHorizontal: 9,

    backgroundColor: 'rgba(255,255,255,0.95)',

    flexDirection: 'row',

    alignItems: 'center',
  },

  accuracyDot: {
    width: 7,

    height: 7,

    borderRadius: 4,

    backgroundColor: '#0A9B49',

    marginRight: 6,
  },

  accuracyText: {
    fontSize: 9.5,

    fontWeight: '700',

    color: '#596361',
  },

  routeErrorOverlay: {
    position: 'absolute',

    left: 12,

    right: 70,

    top: 13,

    borderRadius: 11,

    padding: 10,

    backgroundColor: 'rgba(255,248,230,0.97)',

    borderWidth: 1,

    borderColor: '#F0D99D',
  },

  routeErrorOverlayTitle: {
    fontSize: 10,

    fontWeight: '800',

    color: '#8E6200',
  },

  routeErrorOverlayText: {
    marginTop: 3,

    fontSize: 9,

    lineHeight: 13,

    color: '#765800',
  },

  retryButton: {
    alignSelf: 'flex-start',

    marginTop: 7,

    minHeight: 29,

    borderRadius: 7,

    paddingHorizontal: 9,

    backgroundColor: '#078E47',

    alignItems: 'center',

    justifyContent: 'center',
  },

  retryButtonText: {
    fontSize: 8.5,

    fontWeight: '800',

    color: '#FFFFFF',
  },

  /* ======================================================*

      BOTTOM SHEET*

   ======================================================= */

  bottomSheet: {
    position: 'absolute',

    left: 0,

    right: 0,

    bottom: 0,

    maxHeight: '46%',

    backgroundColor: '#FFFFFF',

    borderTopLeftRadius: 22,

    borderTopRightRadius: 22,

    shadowColor: '#000000',

    shadowOpacity: 0.14,

    shadowRadius: 12,

    shadowOffset: {
      width: 0,

      height: -3,
    },

    elevation: 8,

    paddingTop: 7,
  },

  bottomSheetHandle: {
    alignSelf: 'center',

    width: 37,

    height: 4,

    borderRadius: 2,

    backgroundColor: '#C7CDCA',

    marginBottom: 8,
  },

  bottomSheetContent: {
    paddingHorizontal: 13,

    paddingBottom: 15,
  },

  /* ======================================================*

      ETA*

   ======================================================= */

  etaRow: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 9,
  },

  etaText: {
    fontSize: 25,

    lineHeight: 28,

    fontWeight: '800',

    color: '#078F46',
  },

  arrivalText: {
    marginTop: 2,

    fontSize: 10,

    color: '#747D7F',
  },

  statusBadge: {
    height: 29,

    borderRadius: 15,

    paddingHorizontal: 9,

    flexDirection: 'row',

    alignItems: 'center',
  },

  statusBadgeLive: {
    backgroundColor: '#E6F7EB',
  },

  statusBadgeReady: {
    backgroundColor: '#F0F3F1',
  },

  statusDot: {
    width: 7,

    height: 7,

    borderRadius: 4,

    marginRight: 5,
  },

  statusDotLive: {
    backgroundColor: '#0A9B49',
  },

  statusDotReady: {
    backgroundColor: '#A4ABA8',
  },

  statusBadgeText: {
    fontSize: 8.5,

    fontWeight: '800',

    color: '#4A5A51',
  },

  /* ======================================================*

      CUSTOMER*

   ======================================================= */

  customerCard: {
    minHeight: 63,

    borderRadius: 12,

    backgroundColor: '#F4F8F5',

    borderWidth: 1,

    borderColor: '#E3EAE5',

    paddingHorizontal: 9,

    paddingVertical: 8,

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 8,
  },

  customerAvatar: {
    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor: '#F0E4D4',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 8,
  },

  customerAvatarText: {
    fontSize: 17,

    fontWeight: '800',

    color: '#604A38',
  },

  customerInfo: {
    flex: 1,

    minWidth: 0,
  },

  customerName: {
    fontSize: 12.5,

    fontWeight: '800',

    color: '#232A2C',
  },

  customerAddress: {
    marginTop: 2,

    fontSize: 9.5,

    color: '#697276',
  },

  customerOrder: {
    marginTop: 2,

    fontSize: 8.5,

    color: '#858D90',
  },

  customerActions: {
    flexDirection: 'row',

    gap: 5,

    marginLeft: 6,
  },

  customerActionButton: {
    width: 31,

    height: 31,

    borderRadius: 16,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#D7E2DB',

    alignItems: 'center',

    justifyContent: 'center',
  },

  customerActionIcon: {
    fontSize: 10,

    color: '#078D46',
  },

  /* ======================================================*

      NAVIGATION BUTTONS*

   ======================================================= */

  startNavigationButton: {
    height: 50,

    borderRadius: 11,

    backgroundColor: '#079A49',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  navigationButtonIcon: {
    fontSize: 17,

    color: '#FFFFFF',

    marginRight: 7,

    transform: [
      {
        rotate: '-35deg',
      },
    ],
  },

  navigationButtonText: {
    fontSize: 13.5,

    fontWeight: '800',

    color: '#FFFFFF',
  },

  navigationButtonArrow: {
    fontSize: 21,

    color: '#FFFFFF',

    marginLeft: 9,
  },

  endNavigationButton: {
    height: 50,

    borderRadius: 11,

    backgroundColor: '#FDE7E5',

    alignItems: 'center',

    justifyContent: 'center',
  },

  endNavigationButtonText: {
    fontSize: 13,

    fontWeight: '800',

    color: '#D62E27',
  },

  /* ======================================================*

      ROUTE OVERVIEW*

   ======================================================= */

  routeOverviewHeader: {
    minHeight: 48,

    marginTop: 8,

    borderRadius: 10,

    backgroundColor: '#F4F7F5',

    paddingHorizontal: 11,

    paddingVertical: 7,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  routeOverviewTitle: {
    fontSize: 11.5,

    fontWeight: '800',

    color: '#2B3335',
  },

  routeOverviewSubtitle: {
    marginTop: 2,

    fontSize: 8.5,

    color: '#788185',
  },

  routeOverviewArrow: {
    fontSize: 20,

    color: '#5E6769',
  },

  routeOverviewPanel: {
    marginTop: 7,

    borderRadius: 10,

    backgroundColor: '#F8FAF9',

    paddingHorizontal: 8,
  },

  routeStopRow: {
    minHeight: 56,

    borderBottomWidth: 1,

    borderBottomColor: '#E8ECE9',

    flexDirection: 'row',

    alignItems: 'center',
  },

  routeStopNumber: {
    width: 29,

    height: 29,

    borderRadius: 15,

    backgroundColor: '#E2F5E7',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 8,
  },

  routeStopNumberText: {
    fontSize: 10.5,

    fontWeight: '800',

    color: '#078E47',
  },

  routeStopInfo: {
    flex: 1,

    minWidth: 0,
  },

  routeStopOrder: {
    fontSize: 10.5,

    fontWeight: '800',

    color: '#293133',
  },

  routeStopCustomer: {
    marginTop: 1,

    fontSize: 9.5,

    fontWeight: '600',

    color: '#5D6669',
  },

  routeStopAddress: {
    marginTop: 1,

    fontSize: 8.5,

    color: '#7C8588',
  },

  reorderButtons: {
    flexDirection: 'row',

    gap: 4,

    marginLeft: 5,
  },

  reorderButton: {
    width: 29,

    height: 29,

    borderRadius: 7,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#D8E1DC',

    alignItems: 'center',

    justifyContent: 'center',
  },

  reorderButtonDisabled: {
    opacity: 0.35,
  },

  reorderButtonText: {
    fontSize: 15,

    fontWeight: '800',

    color: '#078D46',
  },

  fitRouteButton: {
    height: 39,

    borderRadius: 9,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#078D46',

    alignItems: 'center',

    justifyContent: 'center',

    marginVertical: 8,
  },

  fitRouteButtonText: {
    fontSize: 9.5,

    fontWeight: '800',

    color: '#078D46',
  },

  /* ======================================================*

      DISCLAIMER*

   ======================================================= */

  routeDisclaimer: {
    marginTop: 8,

    fontSize: 9,

    lineHeight: 13,

    color: '#8A9294',

    textAlign: 'center',
  },
});

export default NavigationScreen;
