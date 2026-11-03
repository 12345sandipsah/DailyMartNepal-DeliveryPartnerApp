import React, {useEffect, useState} from 'react';
import {ActivityIndicator, AppState, Pressable, StyleSheet, Text, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import {getPartnerSessionExpiresAt, logoutPartner, restorePartnerSession} from '../../shared/services/api';
import type {Partner} from '../../shared/services/api';

function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState('');
  const [restoreAttempt, setRestoreAttempt] = useState(0);

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
        expiryTimer = setTimeout(() => void checkSessionExpiry(), expiresAt - Date.now());
      } catch {
        // The backend remains authoritative if local storage is temporarily unavailable.
      }
    };

    void checkSessionExpiry();
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') void checkSessionExpiry();
    });
    return () => {
      mounted = false;
      if (expiryTimer) clearTimeout(expiryTimer);
      appStateSubscription.remove();
    };
  }, [isAuthenticated]);

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
    <NavigationContainer>
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
