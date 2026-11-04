import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeModules, Platform} from 'react-native';
import {API_ORIGIN} from '../config/apiOrigin';

const TOKEN_KEY = 'dailymart.deliveryPartnerToken';
const TOKEN_EXPIRY_KEY = 'dailymart.deliveryPartnerTokenExpiresAt';
const PUSH_TOKEN_KEY = 'dailymart.deliveryPartnerPushToken';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const configuredBaseUrl = (
  globalThis as typeof globalThis & {__DAILYMART_API_BASE_URL__?: string}
).__DAILYMART_API_BASE_URL__;
function getDevelopmentApiOrigin() {
  if (Platform.OS !== 'android') return 'http://localhost:5000';

  // React Native's bundle URL tells us which host the device can reach. This
  // handles both emulator networking (10.0.2.2) and a physical phone using
  // Metro over Wi-Fi or an adb reverse tunnel (localhost).
  try {
    const scriptURL = NativeModules.SourceCode?.getConstants?.().scriptURL;
    if (typeof scriptURL === 'string') {
      const host = new URL(scriptURL).hostname;
      if (host) return `http://${host}:5000`;
    }
  } catch {
    // Fall back to the standard Android emulator host when Metro URL is absent.
  }

  return 'http://10.0.2.2:5000';
}

const API_BASE_URL = (
  configuredBaseUrl?.trim() ||
  (__DEV__ ? getDevelopmentApiOrigin() : API_ORIGIN.trim())
).replace(/\/+$/, '');

async function fetchBackend(url: string, options: RequestInit): Promise<Response> {
  if (!API_BASE_URL) {
    throw new Error(
      'DailyMart API URL is not configured. Set DAILYMART_API_BASE_URL to the HTTPS backend URL before building the app.',
    );
  }

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
  profileImage?: {url?: string; publicId?: string} | null;
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

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

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
    throw new ApiRequestError(
      body.message || `DailyMart API request failed (${response.status}).`,
      response.status,
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
    throw new ApiRequestError(
      body.message || `Login request failed (${response.status}).`,
      response.status,
    );
  }
  const serverExpiry = typeof body.expiresAt === 'number'
    ? body.expiresAt
    : Date.parse(String(body.expiresAt || ''));
  const expiresAt = Number.isFinite(serverExpiry) && serverExpiry > Date.now()
    ? serverExpiry
    : Date.now() + SESSION_DURATION_MS;
  await AsyncStorage.multiSet([
    [TOKEN_KEY, body.token],
    [TOKEN_EXPIRY_KEY, String(expiresAt)],
  ]);
  return body.partner as Partner;
}

export async function restorePartnerSession() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const expiresAt = Number(await AsyncStorage.getItem(TOKEN_EXPIRY_KEY));
  // Tokens created before local expiry tracking was added require a fresh sign-in.
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    await logoutPartner();
    return null;
  }
  try {
    const result = await request<{partner: Partner}>('/me');
    return result.partner;
  } catch (error) {
    if (error instanceof ApiRequestError && [401, 403].includes(error.status)) {
      await logoutPartner();
      return null;
    }
    throw error;
  }
}

export async function logoutPartner() {
  try {
    await unregisterPartnerPushToken();
  } catch {
    // Always clear the local account session even if the device is offline.
  }
  await AsyncStorage.multiRemove([TOKEN_KEY, TOKEN_EXPIRY_KEY]);
}

export async function registerPartnerPushToken(token: string, platform: 'android' | 'ios') {
  const previousToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (previousToken && previousToken !== token) {
    try {
      await request('/push-tokens', {
        method: 'DELETE',
        body: JSON.stringify({token: previousToken}),
      });
    } catch {
      // Register the current token even if the old token cannot be removed.
    }
  }
  await request('/push-tokens', {
    method: 'POST',
    body: JSON.stringify({token, platform}),
  });
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
}

export async function unregisterPartnerPushToken() {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (!token) return;
  try {
    await request('/push-tokens', {
      method: 'DELETE',
      body: JSON.stringify({token}),
    });
  } finally {
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  }
}

export async function getPartnerSessionExpiresAt() {
  const expiresAt = Number(await AsyncStorage.getItem(TOKEN_EXPIRY_KEY));
  return Number.isFinite(expiresAt) ? expiresAt : null;
}

export type PartnerNotification = {
  _id: string;
  type?: string;
  source?: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  data?: {orderId?: string; orderNumber?: string; supportRequestId?: string; reference?: string};
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

export const uploadPartnerProfileImage = async (
  file: {uri: string; name: string; type: string},
) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const formData = new FormData();
  formData.append('profileImage', file as any);
  const response = await fetchBackend(`${API_BASE_URL}/api/delivery-partner/profile/image`, {
    method: 'POST',
    headers: {Accept: 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})},
    body: formData,
  });
  let body: any;
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  if (!response.ok || !body.success || !body.partner) {
    throw new ApiRequestError(
      body.message || `Profile photo upload failed (${response.status}).`,
      response.status,
    );
  }
  return body.partner as Partner;
};

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

export type PartnerSupportTicket = {
  id: string;
  reference: string;
  subject: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Waiting for Customer' | 'Resolved' | 'Closed';
  description: string;
  order?: {id: string | null; reference: string; status?: string} | null;
  emergencyLocation?: {latitude: number; longitude: number; capturedAt?: string} | null;
  resolution: string;
  messages: Array<{id: string; authorType: string; authorName: string; body: string; createdAt: string}>;
  createdAt: string;
  updatedAt: string;
};

const supportRequest = async <T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const response = await fetchBackend(`${API_BASE_URL}/api/support/delivery-partner${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      ...options.headers,
    },
  });
  let body: any;
  try { body = await response.json(); } catch { body = {}; }
  if (!response.ok || !body.success) {
    throw new Error(body.message || `Support request failed (${response.status}).`);
  }
  return body as ApiResult<T>;
};

export const getPartnerSupportTickets = async () =>
  (await supportRequest<{supportRequests: PartnerSupportTicket[]}>('', {method: 'GET'})).supportRequests;

export const getPartnerSupportTicket = async (ticketId: string) =>
  (await supportRequest<{supportRequest: PartnerSupportTicket}>(`/${encodeURIComponent(ticketId)}`, {method: 'GET'})).supportRequest;

export const createPartnerSupportTicket = async (input: {
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  subject: string;
  description: string;
  orderReference?: string;
  isEmergency?: boolean;
}) =>
  (await supportRequest<{supportRequest: PartnerSupportTicket}>('', {
    method: 'POST',
    body: JSON.stringify(input),
  })).supportRequest;

export const replyToPartnerSupportTicket = async (ticketId: string, body: string) =>
  (await supportRequest<{supportRequest: PartnerSupportTicket}>(`/${encodeURIComponent(ticketId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({body}),
  })).supportRequest;

export const setAvailability = async (isOnline: boolean) =>
  (await request<{partner: Partner}>('/availability', {method: 'PATCH', body: JSON.stringify({isOnline})})).partner;

export const updatePartnerLocation = async (latitude: number, longitude: number) =>
  request<{partner: Partner}>('/location', {method: 'PATCH', body: JSON.stringify({latitude, longitude})});

export type PartnerEarningTransaction = {
  id: string;
  reference: string;
  amount: number;
  date: string;
  transferReference: string;
  notes: string;
};

export type PartnerEarnings = {
  period: 'today' | 'week' | 'month' | 'all';
  paidOutAllTime: number;
  allTimePayoutCount: number;
  paidOutInPeriod: number;
  periodPayoutCount: number;
  payoutRateConfigured: boolean;
  walletBalance: number | null;
  transactions: PartnerEarningTransaction[];
};

export const getPartnerEarnings = async (period: PartnerEarnings['period'] = 'month') =>
  request<PartnerEarnings>(`/earnings?period=${encodeURIComponent(period)}`);

export type PartnerPayoutAccount = {
  accountHolderName: string;
  bankName: string;
  branchName: string;
  branchCode: string;
  accountType: 'Savings' | 'Current';
  accountNumber: string;
  accountNumberLast4: string;
  verificationStatus: 'unverified' | 'verified' | 'review_required' | 'rejected' | 'service_unavailable' | 'admin_approved' | 'admin_rejected';
  verificationProvider: string;
  verificationResponseCode: string;
  verificationMatchPercentage: number | null;
  verificationMessage: string;
  verificationCheckedAt: string | null;
  verificationReviewNote?: string;
  isComplete: boolean;
};

export type PartnerBank = {id: string; shortCode: string; name: string};
export type PartnerBankBranch = {id: string; name: string};

export const getPartnerBanks = async () =>
  (await request<{banks: PartnerBank[]}>('/bank-directory/banks')).banks;

export const getPartnerBankBranches = async (bankCode: string) =>
  (await request<{branches: PartnerBankBranch[]}>(`/bank-directory/banks/${encodeURIComponent(bankCode)}/branches`)).branches;

export const getPartnerPayoutAccount = async () =>
  (await request<{payoutAccount: PartnerPayoutAccount}>('/payout-account')).payoutAccount;

export const updatePartnerPayoutAccount = async (account: Pick<PartnerPayoutAccount, 'accountHolderName' | 'bankName' | 'branchName' | 'branchCode' | 'accountType' | 'accountNumber'>) =>
  (await request<{payoutAccount: PartnerPayoutAccount}>('/payout-account', {
    method: 'PUT',
    body: JSON.stringify(account),
  })).payoutAccount;

export type PartnerPayslip = {
  period: string;
  runStatus: 'approved' | 'partially_paid' | 'paid';
  paymentStatus: 'pending' | 'paid' | 'failed';
  invoiceNumber: string;
  paymentPurpose: string;
  countryName: string;
  cityName: string;
  warehouseName: string;
  bankAccount: Pick<PartnerPayoutAccount, 'accountHolderName' | 'bankName' | 'branchName' | 'branchCode' | 'accountType' | 'accountNumberLast4'>;
  basicPay: number;
  allowance: number;
  scheduledWorkDays: number;
  daysPresent: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  attendanceDeduction: number;
  attendanceNote: string;
  incentive: number;
  incentiveReason: string;
  overtimeHours: number;
  maxDailyOvertimeHoursRecorded: number;
  maxWeeklyOvertimeHoursRecorded: number;
  overtimePay: number;
  festivalExpense: number;
  ssfBasePay: number;
  grossPay: number;
  employeeSsf: number;
  incomeTax: number;
  taxableAnnualIncome: number;
  projectedAnnualTax: number;
  otherDeductions: number;
  deductionCategory: string;
  deductionReason: string;
  employerSsf: number;
  netPay: number;
  transferReference: string;
  paymentFailureReason?: string;
  paidAt: string | null;
};

export const getPartnerPayrollHistory = async () =>
  (await request<{payslips: PartnerPayslip[]}>('/payroll')).payslips;

export type PartnerPreferences = {
  deliveryNotifications: boolean;
  paymentNotifications: boolean;
};

export const getPartnerPreferences = async () =>
  (await request<{preferences: PartnerPreferences}>('/preferences')).preferences;

export const updatePartnerPreferences = async (preferences: Partial<PartnerPreferences>) =>
  (await request<{preferences: PartnerPreferences}>('/preferences', {
    method: 'PATCH',
    body: JSON.stringify(preferences),
  })).preferences;

export type PartnerLoginActivity = {
  _id: string;
  device: string;
  network: string;
  signedInAt: string;
};

export const getPartnerLoginActivity = async () =>
  (await request<{activities: PartnerLoginActivity[]}>('/security/activity')).activities;

export const changePartnerPassword = async (currentPassword: string, newPassword: string) =>
  request<never>('/security/password', {
    method: 'PATCH',
    body: JSON.stringify({currentPassword, newPassword}),
  });

export const revokePartnerSessions = async () =>
  request<never>('/security/logout-all', {method: 'POST', body: '{}'});

export type PartnerDocumentType = 'DL' | 'CID' | 'VR' | 'INS';
export type PartnerDocumentStatus = 'pending' | 'verified' | 'rejected';
export type PartnerDocument = {
  _id: string;
  documentType: PartnerDocumentType;
  fileName: string;
  mimeType: string;
  size: number;
  status: PartnerDocumentStatus;
  reviewNote: string;
  reviewedAt?: string | null;
  updatedAt: string;
};

export const getPartnerDocuments = async () =>
  (await request<{documents: PartnerDocument[]}>('/documents')).documents;

export const uploadPartnerDocument = async (
  documentType: PartnerDocumentType,
  file: {uri: string; name: string; type: string},
) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const formData = new FormData();
  formData.append('file', file as any);
  const response = await fetchBackend(
    `${API_BASE_URL}/api/delivery-partner/documents/${encodeURIComponent(documentType)}`,
    {
      method: 'POST',
      headers: {Accept: 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})},
      body: formData,
    },
  );
  let body: any;
  try { body = await response.json(); } catch { body = {}; }
  if (!response.ok || !body.success || !body.document) {
    throw new Error(body.message || `Document upload failed (${response.status}).`);
  }
  return body.document as PartnerDocument;
};
