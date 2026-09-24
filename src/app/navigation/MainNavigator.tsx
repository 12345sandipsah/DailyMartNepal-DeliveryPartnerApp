import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../../features/home/screens/HomeScreen';
import DeliveriesScreen from '../../features/deliveries/screens/DeliveriesScreen';
import DeliveryDetailsScreen from '../../features/deliveries/screens/DeliveryDetailsScreen';
import WarehousePickupScreen from '../../features/deliveries/screens/WarehousePickupScreen';
import ActiveDeliveryScreen from '../../features/deliveries/screens/ActiveDeliveryScreen';
import NavigationScreen from '../../features/navigation/screens/NavigationScreen';
import DeliveryVerificationScreen from '../../features/deliveries/screens/DeliveryVerificationScreen';
import CODCollectionScreen from '../../features/deliveries/screens/CODCollectionScreen';
import DeliveryCompletionScreen from '../../features/deliveries/screens/DeliveryCompletionScreen';
import FailedDeliveryScreen from '../../features/deliveries/screens/FailedDeliveryScreen';

export type MainStackParamList = {
  Home: undefined;
  Deliveries: undefined;
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
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
      />

      <Stack.Screen
        name="Deliveries"
        component={DeliveriesScreen}
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
  );
};

export default MainNavigator;