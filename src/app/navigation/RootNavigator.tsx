import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import {restorePartnerSession} from '../../shared/services/api';

function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let mounted = true;
    restorePartnerSession()
      .then(partner => {
        if (mounted) setIsAuthenticated(Boolean(partner));
      })
      .finally(() => {
        if (mounted) setIsRestoring(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleAuthenticated = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);

  if (isRestoring) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0BA457" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainNavigator onLogout={handleLogout} />
      ) : (
        <AuthNavigator onAuthenticated={handleAuthenticated} />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F8F6'},
});

export default RootNavigator;