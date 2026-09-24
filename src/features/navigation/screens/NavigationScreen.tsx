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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Mapbox, {
  requestAndroidLocationPermissions,
  type Location,
} from '@rnmapbox/maps';

import { MAPBOX_ACCESS_TOKEN } from '../../../config/mapboxConfig';

type NavigationStackParamList = {
  Navigation: {
    deliveryId: string;
  };
};

type NavigationScreenProps = NativeStackScreenProps<
  NavigationStackParamList,
  'Navigation'
>;

type DeliveryStop = {
  id: string;
  orderId: string;
  customerName: string;
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

const INITIAL_DELIVERY_STOPS: DeliveryStop[] = [
  {
    id: 'stop-1',
    orderId: 'DM12345',
    customerName: 'Customer A',
    address: 'Birgunj, Parsa',
    coordinate: [84.8785, 27.0125],
    paymentMethod: 'COD',
    amount: 850,
  },
  {
    id: 'stop-2',
    orderId: 'DM12346',
    customerName: 'Customer B',
    address: 'Adarshnagar, Birgunj',
    coordinate: [84.8718, 27.0008],
    paymentMethod: 'ONLINE',
    amount: 0,
  },
  {
    id: 'stop-3',
    orderId: 'DM12347',
    customerName: 'Customer C',
    address: 'Maisthan, Birgunj',
    coordinate: [84.8862, 27.0078],
    paymentMethod: 'COD',
    amount: 1_200,
  },
  {
    id: 'stop-4',
    orderId: 'DM12348',
    customerName: 'Customer D',
    address: 'Ghantaghar, Birgunj',
    coordinate: [84.8755, 27.0148],
    paymentMethod: 'ONLINE',
    amount: 0,
  },
];

// Temporary only.
// The real partner location comes from Mapbox GPS after tracking starts.
const INITIAL_PARTNER_COORDINATE: [number, number] = [
  84.8665,
  27.0055,
];

const MAX_ROUTE_COORDINATES = 25;
const ROUTE_REROUTE_DISTANCE_KM = 0.1;
const ROUTE_REQUEST_INTERVAL_MS = 30_000;

const DELIVERY_ROUTE_LINE_STYLE = {
  lineColor: '#2E7D32',
  lineWidth: 5,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
};

function calculateDistanceKm(
  start: [number, number],
  end: [number, number],
) {
  const toRadians = (value: number) =>
    (value * Math.PI) / 180;

  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(
    end[1] - start[1],
  );

  const longitudeDifference = toRadians(
    end[0] - start[0],
  );

  const a =
    Math.sin(latitudeDifference / 2) *
      Math.sin(latitudeDifference / 2) +
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

function NavigationScreen({
  route,
}: NavigationScreenProps) {
  const { deliveryId } = route.params;

  const cameraRef =
    useRef<React.ComponentRef<typeof Mapbox.Camera>>(null);

  const routeAbortControllerRef =
    useRef<AbortController | null>(null);

  // Origin used by the most recent route request.
  const lastRequestedRouteOriginRef =
    useRef<[number, number] | null>(null);

  // Stop order used by the most recent route request.
  const lastRequestedStopOrderRef =
    useRef('');

  // Origin from the most recent successful route.
  const lastSuccessfulRouteOriginRef =
    useRef<[number, number] | null>(null);

  const lastRouteRequestTimeRef =
    useRef(0);

  const [isTracking, setIsTracking] =
    useState(false);

  const [hasLiveLocation, setHasLiveLocation] =
    useState(false);

  const [partnerCoordinate, setPartnerCoordinate] =
    useState<[number, number]>(
      INITIAL_PARTNER_COORDINATE,
    );

  const [locationAccuracy, setLocationAccuracy] =
    useState<number | null>(null);

  const [deliveryStops, setDeliveryStops] =
    useState<DeliveryStop[]>(
      INITIAL_DELIVERY_STOPS,
    );

  // No fallback route line.
  // A route appears only after Mapbox returns a real road route.
  const [routeShape, setRouteShape] =
    useState<RouteShape | null>(null);

  // These values represent ONLY the Mapbox road route.
  const [routeDistanceKm, setRouteDistanceKm] =
    useState<number | null>(null);

  const [routeDurationMinutes, setRouteDurationMinutes] =
    useState<number | null>(null);

  const [isRouteLoading, setIsRouteLoading] =
    useState(false);

  const [routeError, setRouteError] =
    useState<string | null>(null);

  const routeCoordinates = useMemo(() => {
    return [
      partnerCoordinate,
      ...deliveryStops.map(stop => stop.coordinate),
    ];
  }, [partnerCoordinate, deliveryStops]);

  const stopOrderKey = useMemo(() => {
    return deliveryStops
      .map(stop => stop.id)
      .join('|');
  }, [deliveryStops]);

  const fitMapToAllStops = useCallback(() => {
    if (routeCoordinates.length < 2) {
      return;
    }

    const longitudes = routeCoordinates.map(
      coordinate => coordinate[0],
    );

    const latitudes = routeCoordinates.map(
      coordinate => coordinate[1],
    );

    const minLongitude = Math.min(
      ...longitudes,
    );

    const maxLongitude = Math.max(
      ...longitudes,
    );

    const minLatitude = Math.min(
      ...latitudes,
    );

    const maxLatitude = Math.max(
      ...latitudes,
    );

    cameraRef.current?.fitBounds(
      [maxLongitude, maxLatitude],
      [minLongitude, minLatitude],
      [50, 50, 50, 50],
      800,
    );
  }, [routeCoordinates]);

  const moveStop = (
    currentIndex: number,
    direction: 'up' | 'down',
  ) => {
    const targetIndex =
      direction === 'up'
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= deliveryStops.length
    ) {
      return;
    }

    setDeliveryStops(currentStops => {
      const updatedStops = [...currentStops];

      const currentStop =
        updatedStops[currentIndex];

      updatedStops[currentIndex] =
        updatedStops[targetIndex];

      updatedStops[targetIndex] = currentStop;

      return updatedStops;
    });
  };

  const fetchRoadRoute = useCallback(
    async (
      coordinates: [number, number][],
      currentStopOrderKey: string,
    ) => {
      if (
        coordinates.length < 2 ||
        coordinates.length >
          MAX_ROUTE_COORDINATES
      ) {
        setRouteError(
          `A maximum of ${
            MAX_ROUTE_COORDINATES - 1
          } delivery stops can be included in one route.`,
        );

        return;
      }

      const coordinateString = coordinates
        .map(
          ([longitude, latitude]) =>
            `${longitude},${latitude}`,
        )
        .join(';');

      const requestUrl =
        `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/` +
        `${coordinateString}` +
        `?alternatives=false` +
        `&overview=full` +
        `&geometries=geojson` +
        `&steps=false` +
        `&access_token=${encodeURIComponent(
          MAPBOX_ACCESS_TOKEN,
        )}`;

      routeAbortControllerRef.current?.abort();

      const controller =
        new AbortController();

      routeAbortControllerRef.current =
        controller;

      // Record every request origin/order.
      lastRequestedRouteOriginRef.current =
        coordinates[0];

      lastRequestedStopOrderRef.current =
        currentStopOrderKey;

      lastRouteRequestTimeRef.current =
        Date.now();

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

        const data =
          (await response.json()) as DirectionsResponse;

        if (!response.ok) {
          throw new Error(
            data.message ||
              `Route request failed (${response.status}).`,
          );
        }

        if (
          data.code !== 'Ok' ||
          !data.routes ||
          data.routes.length === 0
        ) {
          throw new Error(
            data.message ||
              'Mapbox could not find a road route for these locations.',
          );
        }

        const routeResult =
          data.routes[0];

        const routeCoordinatesFromApi =
          routeResult.geometry.coordinates
            .filter(
              coordinate =>
                coordinate.length >= 2 &&
                Number.isFinite(
                  coordinate[0],
                ) &&
                Number.isFinite(
                  coordinate[1],
                ),
            )
            .map(
              coordinate =>
                [
                  coordinate[0],
                  coordinate[1],
                ] as [number, number],
            );

        if (
          routeCoordinatesFromApi.length < 2
        ) {
          throw new Error(
            'Mapbox returned an invalid road route geometry.',
          );
        }

        // This is the actual road geometry returned by Mapbox.
        setRouteShape({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates:
              routeCoordinatesFromApi,
          },
        });

        // Mapbox returns route distance in meters.
        setRouteDistanceKm(
          routeResult.distance / 1000,
        );

        // Mapbox returns duration in seconds.
        setRouteDurationMinutes(
          Math.max(
            1,
            Math.round(
              routeResult.duration / 60,
            ),
          ),
        );

        lastSuccessfulRouteOriginRef.current =
          coordinates[0];

        setRouteError(null);
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === 'AbortError'
        ) {
          return;
        }

        // Never display straight-line distance as road distance.
        setRouteShape(null);
        setRouteDistanceKm(null);
        setRouteDurationMinutes(null);

        setRouteError(
          error instanceof Error
            ? error.message
            : 'Unable to calculate the road route.',
        );
      } finally {
        if (
          routeAbortControllerRef.current ===
          controller
        ) {
          routeAbortControllerRef.current =
            null;

          setIsRouteLoading(false);
        }
      }
    },
    [],
  );

  // IMPORTANT:
  // A route is NOT requested until real GPS has been received.
  useEffect(() => {
    if (!hasLiveLocation) {
      return;
    }

    const lastRequestedOrigin =
      lastRequestedRouteOriginRef.current;

    const noRouteRequestYet =
      lastRequestedOrigin === null;

    const orderChanged =
      lastRequestedStopOrderRef.current !==
      stopOrderKey;

    const partnerMovedEnough =
      lastRequestedOrigin !== null &&
      calculateDistanceKm(
        lastRequestedOrigin,
        partnerCoordinate,
      ) >= ROUTE_REROUTE_DISTANCE_KM;

    const enoughTimePassed =
      Date.now() -
        lastRouteRequestTimeRef.current >=
      ROUTE_REQUEST_INTERVAL_MS;

    const shouldFetchRoute =
      noRouteRequestYet ||
      orderChanged ||
      (partnerMovedEnough &&
        enoughTimePassed);

    if (!shouldFetchRoute) {
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchRoadRoute(
        [
          partnerCoordinate,
          ...deliveryStops.map(
            stop => stop.coordinate,
          ),
        ],
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
      fitMapToAllStops();
    }, 700);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    hasLiveLocation,
    deliveryStops,
    fitMapToAllStops,
  ]);

  useEffect(() => {
    return () => {
      routeAbortControllerRef.current?.abort();
    };
  }, []);

  const handleLocationUpdate = (
    location: Location,
  ) => {
    const longitude =
      location.coords.longitude;

    const latitude =
      location.coords.latitude;

    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude)
    ) {
      return;
    }

    setPartnerCoordinate([
      longitude,
      latitude,
    ]);

    if (
      typeof location.coords.accuracy ===
        'number' &&
      Number.isFinite(
        location.coords.accuracy,
      )
    ) {
      setLocationAccuracy(
        location.coords.accuracy,
      );
    }

    // This triggers the route effect.
    // The FIRST road route is therefore based
    // on the real phone GPS location.
    setHasLiveLocation(true);
  };

  const handleStartTracking = async () => {
    try {
      const hasPermission =
        await requestAndroidLocationPermissions();

      if (!hasPermission) {
        setIsTracking(false);
        setHasLiveLocation(false);

        Alert.alert(
          'Location Permission Required',
          'DailyMart needs your location to calculate the real road route from your current position.',
        );

        return;
      }

      // Clear old route information.
      setRouteShape(null);
      setRouteDistanceKm(null);
      setRouteDurationMinutes(null);
      setRouteError(null);

      lastRequestedRouteOriginRef.current =
        null;

      lastRequestedStopOrderRef.current =
        '';

      lastSuccessfulRouteOriginRef.current =
        null;

      lastRouteRequestTimeRef.current =
        0;

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

    lastRequestedRouteOriginRef.current =
      null;

    lastRequestedStopOrderRef.current =
      '';

    lastSuccessfulRouteOriginRef.current =
      null;
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
      [
        partnerCoordinate,
        ...deliveryStops.map(
          stop => stop.coordinate,
        ),
      ],
      stopOrderKey,
    );
  };

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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageLabel}>
              Navigation
            </Text>

            <Text style={styles.title}>
              {deliveryId}
            </Text>

            <Text style={styles.subtitle}>
              {deliveryStops.length}{' '}
              accepted deliveries
            </Text>
          </View>

          <View
            style={[
              styles.trackingBadge,
              isTracking
                ? styles.trackingBadgeActive
                : styles.trackingBadgeInactive,
            ]}
          >
            <View
              style={[
                styles.trackingDot,
                isTracking
                  ? styles.trackingDotActive
                  : styles.trackingDotInactive,
              ]}
            />

            <Text
              style={[
                styles.trackingText,
                isTracking
                  ? styles.trackingTextActive
                  : styles.trackingTextInactive,
              ]}
            >
              {isTracking
                ? hasLiveLocation
                  ? 'LIVE'
                  : 'LOCATING'
                : 'NOT TRACKING'}
            </Text>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapCard}>
          <Mapbox.MapView
            style={styles.map}
            styleURL={Mapbox.StyleURL.Street}
            projection="mercator"
          >
            <Mapbox.Camera
              ref={cameraRef}
              defaultSettings={{
                centerCoordinate:
                  INITIAL_PARTNER_COORDINATE,
                zoomLevel: 13,
              }}
            />

            {/* Real GPS */}
            {isTracking && (
              <Mapbox.UserLocation
                visible
                minDisplacement={5}
                animated
                androidRenderMode="gps"
                showsUserHeadingIndicator
                onUpdate={
                  handleLocationUpdate
                }
              />
            )}

            {/* Temporary / current partner marker */}
            {(!isTracking ||
              !hasLiveLocation) && (
              <Mapbox.PointAnnotation
                id="partner-location"
                coordinate={
                  partnerCoordinate
                }
                title="Delivery Partner"
              >
                <View
                  style={
                    styles.partnerMarker
                  }
                >
                  <Text
                    style={
                      styles.partnerMarkerText
                    }
                  >
                    P
                  </Text>
                </View>
              </Mapbox.PointAnnotation>
            )}

            {/* Real road route only */}
            {routeShape !== null && (
              <Mapbox.ShapeSource
                id="delivery-route"
                shape={routeShape}
              >
                <Mapbox.LineLayer
                  id="delivery-route-line"
                  style={
                    DELIVERY_ROUTE_LINE_STYLE
                  }
                />
              </Mapbox.ShapeSource>
            )}

            {/* Customer destinations */}
            {deliveryStops.map(
              (stop, index) => (
                <Mapbox.PointAnnotation
                  key={stop.id}
                  id={stop.id}
                  coordinate={
                    stop.coordinate
                  }
                  title={`${index + 1}. ${stop.orderId}`}
                >
                  <View
                    style={
                      styles.destinationMarker
                    }
                  >
                    <Text
                      style={
                        styles.destinationMarkerText
                      }
                    >
                      {index + 1}
                    </Text>
                  </View>
                </Mapbox.PointAnnotation>
              ),
            )}

            {/* Map overlay */}
            <View style={styles.mapOverlay}>
              <View
                style={
                  styles.mapOverlayHeader
                }
              >
                <Text
                  style={
                    styles.mapOverlayTitle
                  }
                >
                  Delivery Route
                </Text>

                {isRouteLoading && (
                  <ActivityIndicator
                    size="small"
                    color="#2E7D32"
                  />
                )}
              </View>

              <Text
                style={
                  styles.mapOverlayText
                }
              >
                P = partner • Numbers =
                delivery order
              </Text>
            </View>
          </Mapbox.MapView>
        </View>

        {/* Route information */}
        <View style={styles.routeCard}>
          <Text style={styles.cardTitle}>
            Route Information
          </Text>

          <View style={styles.routeMetrics}>
            <View style={styles.routeMetric}>
              <Text style={styles.metricValue}>
                {deliveryStops.length}
              </Text>

              <Text style={styles.metricLabel}>
                Deliveries
              </Text>
            </View>

            <View
              style={styles.metricDivider}
            />

            <View style={styles.routeMetric}>
              <Text style={styles.metricValue}>
                {routeDistanceKm !== null
                  ? `${routeDistanceKm.toFixed(1)} km`
                  : '—'}
              </Text>

              <Text style={styles.metricLabel}>
                Road distance
              </Text>
            </View>

            <View
              style={styles.metricDivider}
            />

            <View style={styles.routeMetric}>
              <Text style={styles.metricValue}>
                {routeDurationMinutes !== null
                  ? `~${routeDurationMinutes} min`
                  : '—'}
              </Text>

              <Text style={styles.metricLabel}>
                Road ETA
              </Text>
            </View>
          </View>

          {!hasLiveLocation &&
            !isRouteLoading && (
              <Text
                style={
                  styles.routeDisclaimer
                }
              >
                Waiting for your real GPS location
                before calculating road distance.
              </Text>
            )}

          {isRouteLoading && (
            <Text
              style={
                styles.routeDisclaimer
              }
            >
              Calculating the actual road route
              from your current location...
            </Text>
          )}

          {routeError !== null && (
            <View
              style={
                styles.routeErrorBox
              }
            >
              <Text
                style={
                  styles.routeErrorTitle
                }
              >
                Road route unavailable
              </Text>

              <Text
                style={
                  styles.routeErrorText
                }
              >
                {routeError}
              </Text>

              <Pressable
                style={
                  styles.retryRouteButton
                }
                onPress={
                  handleRetryRoute
                }
              >
                <Text
                  style={
                    styles.retryRouteButtonText
                  }
                >
                  RETRY ROAD ROUTE
                </Text>
              </Pressable>
            </View>
          )}

          {routeDistanceKm !== null &&
            routeError === null && (
              <Text
                style={
                  styles.routeDisclaimer
                }
              >
                Distance and ETA are from the
                current Mapbox driving route.
              </Text>
            )}
        </View>

        {/* Delivery stops */}
        <View style={styles.stopsCard}>
          <View style={styles.stopsHeader}>
            <Text style={styles.cardTitle}>
              Delivery Stops
            </Text>

            <Text
              style={
                styles.stopsHeaderText
              }
            >
              Decide the order you want to
              visit them.
            </Text>
          </View>

          {deliveryStops.map(
            (stop, index) => (
              <View
                key={stop.id}
                style={styles.stopCard}
              >
                <View
                  style={
                    styles.stopNumber
                  }
                >
                  <Text
                    style={
                      styles.stopNumberText
                    }
                  >
                    {index + 1}
                  </Text>
                </View>

                <View
                  style={
                    styles.stopInfo
                  }
                >
                  <View
                    style={
                      styles.stopTopRow
                    }
                  >
                    <Text
                      style={
                        styles.stopOrderId
                      }
                    >
                      {stop.orderId}
                    </Text>

                    <View
                      style={[
                        styles.paymentBadge,
                        stop.paymentMethod ===
                          'COD'
                          ? styles.codBadge
                          : styles.onlineBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.paymentBadgeText,
                          stop.paymentMethod ===
                            'COD'
                            ? styles.codText
                            : styles.onlineText,
                        ]}
                      >
                        {
                          stop.paymentMethod
                        }
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.customerName
                    }
                  >
                    {stop.customerName}
                  </Text>

                  <Text
                    style={
                      styles.stopAddress
                    }
                  >
                    {stop.address}
                  </Text>

                  {stop.paymentMethod ===
                    'COD' && (
                    <Text
                      style={
                        styles.codAmount
                      }
                    >
                      Collect NPR{' '}
                      {stop.amount.toLocaleString()}
                    </Text>
                  )}

                  <Text
                    style={
                      styles.stopCoordinateText
                    }
                  >
                    {stop.coordinate[1].toFixed(
                      4,
                    )}
                    ,{' '}
                    {stop.coordinate[0].toFixed(
                      4,
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.reorderButtons
                  }
                >
                  <Pressable
                    style={[
                      styles.reorderButton,
                      index === 0 &&
                        styles.reorderButtonDisabled,
                    ]}
                    disabled={index === 0}
                    onPress={() =>
                      moveStop(
                        index,
                        'up',
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.reorderButtonText,
                        index === 0 &&
                          styles.reorderButtonTextDisabled,
                      ]}
                    >
                      ↑
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.reorderButton,
                      index ===
                        deliveryStops.length -
                          1 &&
                        styles.reorderButtonDisabled,
                    ]}
                    disabled={
                      index ===
                      deliveryStops.length -
                        1
                    }
                    onPress={() =>
                      moveStop(
                        index,
                        'down',
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.reorderButtonText,
                        index ===
                          deliveryStops.length -
                            1 &&
                          styles.reorderButtonTextDisabled,
                      ]}
                    >
                      ↓
                    </Text>
                  </Pressable>
                </View>
              </View>
            ),
          )}
        </View>

        {/* Location status */}
        <View
          style={
            styles.locationStatusCard
          }
        >
          <View
            style={[
              styles.locationStatusIcon,
              hasLiveLocation
                ? styles.locationStatusIconActive
                : styles.locationStatusIconInactive,
            ]}
          >
            <Text
              style={
                styles.locationStatusIconText
              }
            >
              {hasLiveLocation
                ? '✓'
                : '!'}
            </Text>
          </View>

          <View
            style={
              styles.locationStatusInfo
            }
          >
            <Text
              style={
                styles.locationStatusTitle
              }
            >
              {hasLiveLocation
                ? 'Live GPS location active'
                : isTracking
                  ? 'Finding your location...'
                  : 'Location tracking not started'}
            </Text>

            <Text
              style={
                styles.locationStatusText
              }
            >
              {hasLiveLocation
                ? locationAccuracy !==
                  null
                  ? `GPS accuracy is approximately ±${Math.round(
                      locationAccuracy,
                    )} m.`
                  : 'Your current GPS position is being received.'
                : isTracking
                  ? 'Waiting for the phone to provide the current GPS position.'
                  : 'Start tracking when you are ready to navigate to your delivery stops.'}
            </Text>
          </View>
        </View>

        {/* Map control */}
        <Pressable
          style={
            styles.fitRouteButton
          }
          onPress={
            fitMapToAllStops
          }
        >
          <Text
            style={
              styles.fitRouteButtonText
            }
          >
            FIT ALL STOPS
          </Text>
        </Pressable>

        {/* Tracking */}
        {!isTracking ? (
          <Pressable
            style={
              styles.trackingButton
            }
            onPress={
              handleStartTracking
            }
          >
            <Text
              style={
                styles.trackingButtonText
              }
            >
              START LOCATION TRACKING
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={
              styles.stopTrackingButton
            }
            onPress={
              handleStopTracking
            }
          >
            <Text
              style={
                styles.stopTrackingButtonText
              }
            >
              STOP LOCATION TRACKING
            </Text>
          </Pressable>
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
    marginBottom: 18,
  },

  pageLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },

  title: {
    fontSize: 25,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },

  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  trackingBadgeActive: {
    backgroundColor: '#E8F5E9',
  },

  trackingBadgeInactive: {
    backgroundColor: '#F1F3F1',
  },

  trackingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  trackingDotActive: {
    backgroundColor: '#2E7D32',
  },

  trackingDotInactive: {
    backgroundColor: '#9CA3AF',
  },

  trackingText: {
    fontSize: 8,
    fontWeight: '700',
  },

  trackingTextActive: {
    color: '#2E7D32',
  },

  trackingTextInactive: {
    color: '#6B7280',
  },

  mapCard: {
    height: 330,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#DCE5DC',
  },

  map: {
    flex: 1,
  },

  partnerMarker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2E7D32',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  partnerMarkerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  destinationMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  destinationMarkerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
  },

  mapOverlay: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor:
      'rgba(255,255,255,0.94)',
  },

  mapOverlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  mapOverlayTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },

  mapOverlayText: {
    marginTop: 3,
    fontSize: 11,
    color: '#6B7280',
  },

  routeCard: {
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
    marginBottom: 17,
  },

  routeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  routeMetric: {
    flex: 1,
    alignItems: 'center',
  },

  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    textAlign: 'center',
  },

  metricLabel: {
    marginTop: 4,
    fontSize: 10,
    color: '#7A827A',
    textAlign: 'center',
  },

  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E8E5',
  },

  routeDisclaimer: {
    marginTop: 14,
    fontSize: 10,
    lineHeight: 15,
    color: '#8A918A',
    textAlign: 'center',
  },

  routeErrorBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFF7E6',
  },

  routeErrorTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A6700',
  },

  routeErrorText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    color: '#7A5A00',
  },

  retryRouteButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2E7D32',
  },

  retryRouteButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  stopsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },

  stopsHeader: {
    marginBottom: 4,
  },

  stopsHeaderText: {
    marginTop: -8,
    marginBottom: 16,
    fontSize: 11,
    color: '#7A827A',
  },

  stopCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEF2EE',
  },

  stopNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  stopNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },

  stopInfo: {
    flex: 1,
    paddingRight: 8,
  },

  stopTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  stopOrderId: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
  },

  customerName: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  stopAddress: {
    marginTop: 3,
    fontSize: 11,
    color: '#7A827A',
  },

  codAmount: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#9A6700',
  },

  stopCoordinateText: {
    marginTop: 4,
    fontSize: 9,
    color: '#A0A7A0',
  },

  paymentBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  codBadge: {
    backgroundColor: '#FFF7E6',
  },

  onlineBadge: {
    backgroundColor: '#E8F5E9',
  },

  paymentBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },

  codText: {
    color: '#9A6700',
  },

  onlineText: {
    color: '#2E7D32',
  },

  reorderButtons: {
    justifyContent: 'center',
    gap: 6,
  },

  reorderButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F4F7F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE5DC',
  },

  reorderButtonDisabled: {
    opacity: 0.35,
  },

  reorderButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2E7D32',
  },

  reorderButtonTextDisabled: {
    color: '#7A827A',
  },

  locationStatusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },

  locationStatusIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  locationStatusIconActive: {
    backgroundColor: '#E8F5E9',
  },

  locationStatusIconInactive: {
    backgroundColor: '#FFF7E6',
  },

  locationStatusIconText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E7D32',
  },

  locationStatusInfo: {
    flex: 1,
  },

  locationStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },

  locationStatusText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#667066',
  },

  fitRouteButton: {
    height: 52,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  fitRouteButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },

  trackingButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  trackingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  stopTrackingButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B42318',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stopTrackingButtonText: {
    color: '#B42318',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default NavigationScreen;