
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import WelcomeScreen from '../../features/auth/screens/WelcomeScreen';
import LoginScreen from '../../features/auth/screens/LoginScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
};

type AuthNavigatorProps = {
  onAuthenticated?: () => void;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator({onAuthenticated}: AuthNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />

      <Stack.Screen name="Login">
        {props => (
          <LoginScreen
            {...props}
            onAuthenticated={onAuthenticated}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default AuthNavigator;
