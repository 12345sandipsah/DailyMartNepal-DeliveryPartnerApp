import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

const TOKEN_KEY = 'dailymart.deliveryPartnerToken';
const configuredBaseUrl = (
  globalThis as typeof globalThis & {__DAILYMART_API_BASE_URL__?: string}
).__DAILYMART_API_BASE_URL__;
// Android emulator reaches the host machine at 10.0.2.2; iOS simulator uses localhost.
// For a physical phone, set this to the computer's reachable LAN URL, e.g. http://192.168.1.20:5000.
const developmentHostOverride = '';
const API_BASE_URL = (
  configuredBaseUrl?.trim() ||
  developmentHostOverride ||
  (Platform.OS === 'android'
    ? 'http://10.0.2.2:5000'
    : 'http://localhost:5000')
).replace(/\/+$/, '');

async function fetchBackend(url: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch {
    throw new Error(
      `Cannot reach DailyMart backend at ${API_BASE_URL}. Confirm the server is running and that this device can reach that host.`,
    );
  }
}

export type Partner = {
  _id: string;
  name: string;
  phone: string;
  partnerCode?: string;
  warehouse?: { _id: string; name: string; warehouseCode?: string; city?: string };
  availabilityStatus: 'offline' | 'online' | 'busy';
  isActive: boolean;
  vehicleType?: string;
  vehicleNumber?: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  createdAt?: string;
  currentLocation?: {latitude?: number | null; longitude?: number | null; updatedAt?: string | null};
};

export type OrderRecord = {
  _id: string;
  orderNumber: string;
  orderStatus: string;
  deliveryAssignmentStatus?: string;
  customer?: {_id?: string; fullName?: string; mobileNumber?: string};
  deliveryLocation?: {
    name?: string;
    address?: string;
    locality?: string;
    formattedAddress?: string;
    ward?: string | number;
    city?: string;
    cityName?: string;
    phone?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  items?: Array<{ name?: string; productName?: string; quantity?: number; unit?: string; unitPrice?: number; subtotal?: number }>;
  total?: number;
  deliveryCharge?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  fulfillmentWarehouse?: { name?: string; warehouseCode?: string };
  estimatedDeliveryAt?: string;
  estimatedDeliveryTimeMinutes?: number;
  deliveryAssignedAt?: string;
  deliveredAt?: string;
  deliveryVerification?: {isVerified?: boolean; verifiedAt?: string};
  createdAt?: string;
  updatedAt?: string;
  statusHistory?: Array<{status?: string; note?: string; changedAt?: string}>;
};
type ApiResult<T> = { success: boolean } & T;

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const response = await fetchBackend(`${API_BASE_URL}/api/delivery-partner${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      ...options.headers,
    },
  });
  let body: any;
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  if (!response.ok || !body.success) {
    throw new Error(
      body.message ||
        `DailyMart API request failed (${response.status}). Check that the backend is running at ${API_BASE_URL}.`,
    );
  }
  return body as ApiResult<T>;
}

export async function loginPartner(phone: string, password: string) {
  const response = await fetchBackend(`${API_BASE_URL}/api/delivery-partner/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Accept: 'application/json'},
    body: JSON.stringify({phone, password}),
  });
  let body: any;
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  if (!response.ok || !body.success || !body.token) {
    throw new Error(
      body.message ||
        `Login request failed (${response.status}). Check the backend connection and your credentials.`,
    );
  }
  await AsyncStorage.setItem(TOKEN_KEY, body.token);
  return body.partner as Partner;
}

export async function restorePartnerSession() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const result = await request<{partner: Partner}>('/me');
    return result.partner;
  } catch {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

export async function logoutPartner() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export type PartnerNotification = {
  _id: string;
  type?: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  data?: {orderId?: string; orderNumber?: string};
};

export const getPartnerNotifications = async () =>
  (await request<{notifications: PartnerNotification[]}>('/notifications')).notifications;

export const markPartnerNotificationRead = async (id: string) =>
  request<{notification: PartnerNotification}>('/notifications/' + encodeURIComponent(id) + '/read', {method: 'PATCH', body: '{}'});
export const getPartner = async () =>
  (await request<{partner: Partner}>('/me')).partner;

export const updatePartnerProfile = async (profile: {
  name: string;
  email: string;
  dateOfBirth: string;
  address: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
}) =>
  (await request<{partner: Partner}>('/profile', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  })).partner;

export const getDeliveries = async () =>
  (await request<{deliveries: OrderRecord[]}>('/deliveries')).deliveries;

export const getDeliveryHistory = async () =>
  (await request<{deliveries: OrderRecord[]}>('/deliveries/history')).deliveries;

export const getDelivery = async (orderId: string) =>
  (await request<{delivery: OrderRecord}>(`/deliveries/${encodeURIComponent(orderId)}`)).delivery;

export const acceptDelivery = async (orderId: string) =>
  request<{order: OrderRecord}>(`/deliveries/${encodeURIComponent(orderId)}/accept`, {method: 'POST', body: '{}'});

export const rejectDelivery = async (orderId: string, reason: string) =>
  request<{order: OrderRecord}>(`/deliveries/${encodeURIComponent(orderId)}/reject`, {method: 'POST', body: JSON.stringify({reason})});

export const startDelivery = async (orderId: string) =>
  request<{order: OrderRecord}>(`/deliveries/${encodeURIComponent(orderId)}/pickup`, {method: 'POST', body: '{}'});

export const completeDelivery = async (orderId: string, otp: string) =>
  request<{order: OrderRecord}>('/deliveries/' + encodeURIComponent(orderId) + '/delivered', {method: 'POST', body: JSON.stringify({otp})});

export const collectCash = async (orderId: string, amount: number) =>
  request<{order: OrderRecord}>('/deliveries/' + encodeURIComponent(orderId) + '/cash-collected', {method: 'POST', body: JSON.stringify({amount})});

export const finishDelivery = async (orderId: string) =>
  request<{order: OrderRecord}>('/deliveries/' + encodeURIComponent(orderId) + '/complete', {method: 'POST', body: '{}'});
export const failDelivery = async (orderId: string, reason: string) =>
  request<{order: OrderRecord}>(`/deliveries/${encodeURIComponent(orderId)}/failed`, {method: 'POST', body: JSON.stringify({reason})});

export const setAvailability = async (isOnline: boolean) =>
  (await request<{partner: Partner}>('/availability', {method: 'PATCH', body: JSON.stringify({isOnline})})).partner;

export const updatePartnerLocation = async (latitude: number, longitude: number) =>
  request<{partner: Partner}>('/location', {method: 'PATCH', body: JSON.stringify({latitude, longitude})});
