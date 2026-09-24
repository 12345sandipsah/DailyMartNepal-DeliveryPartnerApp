import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../../features/auth/screens/LoginScreen';
import OtpScreen from '../../features/auth/screens/OtpScreen';

export type AuthStackParamList = {
  Login: undefined;
  Otp: {
    phone: string;
  };
};

type AuthNavigatorProps = {
  onAuthenticated?: () => void;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator({ onAuthenticated }: AuthNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />

      <Stack.Screen name="Otp">
        {props => (
          <OtpScreen
            {...props}
            onAuthenticated={onAuthenticated}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default AuthNavigator;