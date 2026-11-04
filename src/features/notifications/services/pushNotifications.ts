import {Platform} from 'react-native';
import {
  getMessaging,
  getToken,
  isDeviceRegisteredForRemoteMessages,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';
import type {RemoteMessage} from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
} from 'react-native-notify-kit';

import {registerPartnerPushToken} from '../../../shared/services/api';

export const ESSENTIAL_NOTIFICATION_CHANNEL = 'delivery_partner_essential';

export async function ensureEssentialNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: ESSENTIAL_NOTIFICATION_CHANNEL,
    name: 'Essential delivery alerts',
    description: 'New delivery offers and important account or support actions.',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

export async function getDeviceNotificationSettings() {
  return notifee.getNotificationSettings();
}

export function hasDeviceNotificationPermission(
  authorizationStatus: AuthorizationStatus,
) {
  return authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    authorizationStatus === AuthorizationStatus.PROVISIONAL;
}

export async function syncPartnerPushToken(tokenOverride?: string) {
  const firebaseMessaging = getMessaging();
  if (Platform.OS === 'ios' && !isDeviceRegisteredForRemoteMessages(firebaseMessaging)) {
    await registerDeviceForRemoteMessages(firebaseMessaging);
  }
  const token = tokenOverride || await getToken(firebaseMessaging);
  if (!token) throw new Error('The notification service did not return a device token.');
  await registerPartnerPushToken(token, Platform.OS === 'ios' ? 'ios' : 'android');
}

export async function requestPartnerNotificationPermission() {
  await ensureEssentialNotificationChannel();
  const settings = await notifee.requestPermission({
    alert: true,
    badge: true,
    sound: true,
  });
  const enabled = hasDeviceNotificationPermission(settings.authorizationStatus);
  if (enabled) await syncPartnerPushToken();
  return enabled;
}

export async function openDeviceNotificationSettings() {
  await notifee.openNotificationSettings();
}

export async function showForegroundPush(remoteMessage: RemoteMessage) {
  const title = remoteMessage.notification?.title?.trim();
  const body = remoteMessage.notification?.body?.trim();
  if (!title || !body) return;
  const data = Object.fromEntries(
    Object.entries(remoteMessage.data || {}).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value) || '',
    ]),
  );

  await notifee.displayNotification({
    id: data.notificationId || remoteMessage.messageId,
    title,
    body,
    data,
    android: {
      channelId: ESSENTIAL_NOTIFICATION_CHANNEL,
      importance: AndroidImportance.HIGH,
      pressAction: {id: 'default'},
    },
    ios: {sound: 'default'},
  });
}
