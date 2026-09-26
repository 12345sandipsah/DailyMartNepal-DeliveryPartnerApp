import React from 'react';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import HomeScreen from '../../features/home/screens/HomeScreen';

import DeliveriesScreen from '../../features/deliveries/screens/DeliveriesScreen';

import DeliveryHistoryScreen from '../../features/deliveries/screens/DeliveryHistoryScreen';

import DeliveryDetailsScreen from '../../features/deliveries/screens/DeliveryDetailsScreen';

import WarehousePickupScreen from '../../features/deliveries/screens/WarehousePickupScreen';

import ActiveDeliveryScreen from '../../features/deliveries/screens/ActiveDeliveryScreen';

import NavigationScreen from '../../features/navigation/screens/NavigationScreen';

import DeliveryVerificationScreen from '../../features/deliveries/screens/DeliveryVerificationScreen';

import CODCollectionScreen from '../../features/deliveries/screens/CODCollectionScreen';

import DeliveryCompletionScreen from '../../features/deliveries/screens/DeliveryCompletionScreen';

import FailedDeliveryScreen from '../../features/deliveries/screens/FailedDeliveryScreen';

import NotificationsScreen from '../../features/notifications/screens/NotificationsScreen';

import NotificationDetailsScreen from '../../features/notifications/screens/NotificationDetailsScreen';

import SupportScreen from '../../features/support/screens/SupportScreen';

import CreateSupportTicketScreen from '../../features/support/screens/CreateSupportTicketScreen';

import SupportTicketsScreen from '../../features/support/screens/SupportTicketsScreen';

import SupportTicketDetailsScreen from '../../features/support/screens/SupportTicketDetailsScreen';

import EmergencyScreen from '../../features/support/screens/EmergencyScreen';

import ProfileScreen from '../../features/profile/screens/ProfileScreen';

import EditProfileScreen from '../../features/profile/screens/EditProfileScreen';

import DocumentsScreen from '../../features/profile/screens/DocumentsScreen';

import DocumentDetailsScreen from '../../features/profile/screens/DocumentDetailsScreen';

import UploadDocumentScreen from '../../features/profile/screens/UploadDocumentScreen';

import {
  SupportTicketProvider,
} from '../../features/support/context/SupportTicketContext';

import {
  ProfileProvider,
} from '../../features/profile/context/ProfileContext';

import {
  DocumentsProvider,
} from '../../features/profile/context/DocumentsContext';

export type MainStackParamList = {
  Home: undefined;

  Profile: undefined;

  EditProfile: undefined;

  Documents: undefined;

  DocumentDetails: {
    documentId: string;
  };

  UploadDocument: {
    documentId: string;
  };

  Deliveries: undefined;

  DeliveryHistory: undefined;

  Notifications: undefined;

  NotificationDetails: {
    title: string;
    message: string;
    time: string;
    type:
      | 'DELIVERY'
      | 'PICKUP'
      | 'PAYMENT'
      | 'SYSTEM';
    deliveryId?: string;
    read: boolean;
  };

  Support: undefined;

  CreateSupportTicket: undefined;

  SupportTickets: undefined;

  SupportTicketDetails: {
    ticketId: string;
  };

  Emergency: undefined;

  DeliveryDetails: {
    deliveryId: string;
  };

  WarehousePickup: {
    deliveryId: string;
  };

  ActiveDelivery: {
    deliveryId: string;
  };

  Navigation: {
    deliveryId: string;
  };

  DeliveryVerification: {
    deliveryId: string;
  };

  CODCollection: {
    deliveryId: string;
  };

  DeliveryCompletion: {
    deliveryId: string;
  };

  FailedDelivery: {
    deliveryId: string;
  };
};

const Stack =
  createNativeStackNavigator<MainStackParamList>();

const MainNavigator = () => {
  return (
    <ProfileProvider>
      <DocumentsProvider>
        <SupportTicketProvider>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
            }}>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
            />

            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
            />

            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
            />

            <Stack.Screen
              name="Documents"
              component={DocumentsScreen}
            />

            <Stack.Screen
              name="DocumentDetails"
              component={DocumentDetailsScreen}
            />

            <Stack.Screen
              name="UploadDocument"
              component={UploadDocumentScreen}
            />

            <Stack.Screen
              name="Deliveries"
              component={DeliveriesScreen}
            />

            <Stack.Screen
              name="DeliveryHistory"
              component={DeliveryHistoryScreen}
            />

            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
            />

            <Stack.Screen
              name="NotificationDetails"
              component={NotificationDetailsScreen}
            />

            <Stack.Screen
              name="Support"
              component={SupportScreen}
            />

            <Stack.Screen
              name="CreateSupportTicket"
              component={CreateSupportTicketScreen}
            />

            <Stack.Screen
              name="SupportTickets"
              component={SupportTicketsScreen}
            />

            <Stack.Screen
              name="SupportTicketDetails"
              component={SupportTicketDetailsScreen}
            />

            <Stack.Screen
              name="Emergency"
              component={EmergencyScreen}
            />

            <Stack.Screen
              name="DeliveryDetails"
              component={DeliveryDetailsScreen}
            />

            <Stack.Screen
              name="WarehousePickup"
              component={WarehousePickupScreen}
            />

            <Stack.Screen
              name="ActiveDelivery"
              component={ActiveDeliveryScreen}
            />

            <Stack.Screen
              name="Navigation"
              component={NavigationScreen}
            />

            <Stack.Screen
              name="DeliveryVerification"
              component={DeliveryVerificationScreen}
            />

            <Stack.Screen
              name="CODCollection"
              component={CODCollectionScreen}
            />

            <Stack.Screen
              name="DeliveryCompletion"
              component={DeliveryCompletionScreen}
            />

            <Stack.Screen
              name="FailedDelivery"
              component={FailedDeliveryScreen}
            />
          </Stack.Navigator>
        </SupportTicketProvider>
      </DocumentsProvider>
    </ProfileProvider>
  );
};

export default MainNavigator;