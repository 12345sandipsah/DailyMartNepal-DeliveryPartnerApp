import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, AppState, Pressable, StyleSheet, Text, View} from 'react-native';
import {NavigationContainer, useNavigationContainerRef} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import type {RemoteMessage} from '@react-native-firebase/messaging';
import notifee, {AuthorizationStatus, EventType} from 'react-native-notify-kit';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import type {MainStackParamList} from './MainNavigator';
import {
  getPartnerSessionExpiresAt,
  logoutPartner,
  restorePartnerSession,
  unregisterPartnerPushToken,
} from '../../shared/services/api';
import type {Partner} from '../../shared/services/api';
import {
  ensureEssentialNotificationChannel,
  getDeviceNotificationSettings,
  hasDeviceNotificationPermission,
  openDeviceNotificationSettings,
  requestPartnerNotificationPermission,
  showForegroundPush,
  syncPartnerPushToken,
} from '../../features/notifications/services/pushNotifications';

const NOTIFICATION_PERMISSION_PROMPT_KEY = 'dailymart.deliveryPartnerNotificationPermissionPrompted';

function RootNavigator() {
  const navigationRef = useNavigationContainerRef<MainStackParamList>();
  const pendingNotificationTarget = useRef<Record<string, string> | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState('');
  const [restoreAttempt, setRestoreAttempt] = useState(0);

  const openNotificationTarget = useCallback((data?: Record<string, string>) => {
    if (!navigationRef.isReady()) {
      pendingNotificationTarget.current = data || {};
      return;
    }
    if (data?.supportRequestId) {
      navigationRef.navigate('SupportTicketDetails', {ticketId: data.supportRequestId});
    } else if (data?.orderId) {
      navigationRef.navigate('DeliveryDetails', {deliveryId: data.orderId});
    } else {
      navigationRef.navigate('Notifications');
    }
  }, [navigationRef]);

  useEffect(() => {
    let mounted = true;
    setIsRestoring(true);
    setRestoreError('');
    restorePartnerSession()
      .then(restoredPartner => {
        if (mounted) {
          setPartner(restoredPartner);
          setIsAuthenticated(Boolean(restoredPartner));
        }
      })
      .catch(error => {
        if (mounted) {
          setRestoreError(error instanceof Error ? error.message : 'DailyMart could not be reached.');
        }
      })
      .finally(() => {
        if (mounted) setIsRestoring(false);
      });
    return () => {
      mounted = false;
    };
  }, [restoreAttempt]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let mounted = true;
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    const checkSessionExpiry = async () => {
      if (expiryTimer) clearTimeout(expiryTimer);
      try {
        const expiresAt = await getPartnerSessionExpiresAt();
        if (!mounted) return;
        if (!expiresAt || expiresAt <= Date.now()) {
          await logoutPartner();
          if (mounted) {
            setPartner(null);
            setIsAuthenticated(false);
          }
          return;
        }
        expiryTimer = setTimeout(() => { checkSessionExpiry(); }, expiresAt - Date.now());
      } catch {
        // The backend remains authoritative if local storage is temporarily unavailable.
      }
    };

    checkSessionExpiry();
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') checkSessionExpiry();
    });
    return () => {
      mounted = false;
      if (expiryTimer) clearTimeout(expiryTimer);
      appStateSubscription.remove();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let mounted = true;

    const requestPermission = async () => {
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_PROMPT_KEY, 'true');
      try {
        const enabled = await requestPartnerNotificationPermission();
        if (!mounted) return;
        if (!enabled) {
          Alert.alert(
            'Device notifications are off',
            'Allow notifications in your device settings to receive new delivery offers and other essential work alerts.',
            [
              {text: 'Later', style: 'cancel'},
              {text: 'Open settings', onPress: () => {
                openDeviceNotificationSettings().catch(error => console.warn('Could not open notification settings:', error));
              }},
            ],
          );
        }
      } catch (error) {
        console.warn('Delivery partner device notification setup failed:', error);
        if (mounted) {
          Alert.alert(
            'Notifications could not be enabled',
            'Check your connection and try again from Settings. Device notification services may also need to be configured for this app.',
          );
        }
      }
    };

    const syncIfAuthorized = async () => {
      try {
        const settings = await getDeviceNotificationSettings();
        if (!mounted) return;
        if (hasDeviceNotificationPermission(settings.authorizationStatus)) {
          await syncPartnerPushToken();
        } else {
          await unregisterPartnerPushToken();
        }
      } catch (error) {
        console.warn('Delivery partner push token sync failed:', error);
      }
    };

    const handleRemoteMessage = (message: RemoteMessage) => {
      const data = Object.fromEntries(
        Object.entries(message.data || {}).map(([key, value]) => [
          key,
          typeof value === 'string' ? value : JSON.stringify(value) || '',
        ]),
      );
      openNotificationTarget(data);
    };

    let unsubscribeMessage = () => {};
    let unsubscribeOpened = () => {};
    let unsubscribeTokenRefresh = () => {};
    try {
      const firebaseMessaging = getMessaging();
      unsubscribeMessage = onMessage(firebaseMessaging, message => {
        showForegroundPush(message).catch(error => {
          console.warn('Foreground delivery partner notification could not be displayed:', error);
        });
      });
      unsubscribeOpened = onNotificationOpenedApp(firebaseMessaging, handleRemoteMessage);
      unsubscribeTokenRefresh = onTokenRefresh(firebaseMessaging, token => {
        getDeviceNotificationSettings()
          .then(settings => {
            if (!mounted) return;
            return hasDeviceNotificationPermission(settings.authorizationStatus)
              ? syncPartnerPushToken(token)
              : unregisterPartnerPushToken();
          })
          .catch(error => {
            console.warn('Refreshed delivery partner push token could not be registered:', error);
          });
      });
      getInitialNotification(firebaseMessaging)
        .then(message => {
          if (mounted && message) handleRemoteMessage(message);
        })
        .catch(error => console.warn('Initial delivery partner notification could not be opened:', error));
    } catch (error) {
      console.warn('Firebase messaging is not configured for this build:', error);
    }
    let unsubscribeForegroundEvent = () => {};
    try {
      unsubscribeForegroundEvent = notifee.onForegroundEvent(({type, detail}) => {
        if (type === EventType.PRESS) {
          openNotificationTarget(detail.notification?.data as Record<string, string> | undefined);
        }
      });
    } catch (error) {
      console.warn('Device notification tap handling is unavailable:', error);
    }
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') syncIfAuthorized();
    });

    ensureEssentialNotificationChannel()
      .then(async () => {
        const settings = await getDeviceNotificationSettings();
        if (hasDeviceNotificationPermission(settings.authorizationStatus)) {
          await syncPartnerPushToken();
          return;
        }
        if (settings.authorizationStatus !== AuthorizationStatus.NOT_DETERMINED) return;
        const alreadyPrompted = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_PROMPT_KEY);
        if (mounted && !alreadyPrompted) {
          Alert.alert(
            'Allow essential delivery alerts',
            'We only send device notifications for new delivery offers and important account, payout, document, and support actions.',
            [
              {
                text: 'Not now',
                style: 'cancel',
                onPress: () => {
                  AsyncStorage.setItem(NOTIFICATION_PERMISSION_PROMPT_KEY, 'true').catch(error => {
                    console.warn('Could not save notification permission choice:', error);
                  });
                },
              },
              {text: 'Continue', onPress: () => {
                requestPermission().catch(error => console.warn('Notification permission prompt failed:', error));
              }},
            ],
            {cancelable: false},
          );
        }
      })
      .catch(error => console.warn('Delivery partner notification initialization failed:', error));

    return () => {
      mounted = false;
      unsubscribeMessage();
      unsubscribeOpened();
      unsubscribeTokenRefresh();
      unsubscribeForegroundEvent();
      appStateSubscription.remove();
    };
  }, [isAuthenticated, openNotificationTarget]);

  const handleAuthenticated = (authenticatedPartner: Partner) => {
    setPartner(authenticatedPartner);
    setIsAuthenticated(true);
  };
  const handleLogout = () => {
    setPartner(null);
    setIsAuthenticated(false);
  };

  if (isRestoring) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0BA457" />
      </View>
    );
  }

  if (restoreError) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorTitle}>Can’t verify your session</Text>
        <Text style={styles.errorMessage}>{restoreError}</Text>
        <Pressable style={styles.retryButton} onPress={() => setRestoreAttempt(value => value + 1)}>
          <Text style={styles.retryText}>Retry connection</Text>
        </Pressable>
        <Pressable
          style={styles.signInButton}
          onPress={async () => {
            await logoutPartner();
            setRestoreError('');
            setPartner(null);
            setIsAuthenticated(false);
          }}>
          <Text style={styles.signInText}>Sign in with another account</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const pendingTarget = pendingNotificationTarget.current;
        if (pendingTarget) {
          pendingNotificationTarget.current = null;
          openNotificationTarget(pendingTarget);
        }
      }}>
      {isAuthenticated ? (
        <MainNavigator onLogout={handleLogout} initialPartner={partner} />
      ) : (
        <AuthNavigator onAuthenticated={handleAuthenticated} />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F8F6'},
  errorTitle: {fontSize: 20, fontWeight: '700', color: '#1F2937'},
  errorMessage: {marginTop: 10, marginHorizontal: 28, color: '#596164', textAlign: 'center'},
  retryButton: {marginTop: 22, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 12, backgroundColor: '#0BA457'},
  retryText: {color: '#FFFFFF', fontWeight: '700'},
  signInButton: {marginTop: 12, padding: 12},
  signInText: {color: '#087744', fontWeight: '700'},
});

export default RootNavigator;
