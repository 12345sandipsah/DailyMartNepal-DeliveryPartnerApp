
import React, {useEffect, useState} from 'react';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation} from '@react-navigation/native';

import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import type {MainStackParamList} from '../../../app/navigation/MainNavigator';

type SettingsNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Home'
>;

type SettingsPreferences = {
  deliveryNotifications: boolean;
  paymentNotifications: boolean;
  soundNotifications: boolean;
  autoAcceptDeliveries: boolean;
  locationUpdates: boolean;
};

const SETTINGS_STORAGE_KEY = '@dailymart_delivery_settings';

const DEFAULT_PREFERENCES: SettingsPreferences = {
  deliveryNotifications: true,
  paymentNotifications: true,
  soundNotifications: true,
  autoAcceptDeliveries: false,
  locationUpdates: true,
};

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsNavigationProp>();

  const [preferences, setPreferences] =
    useState<SettingsPreferences>(DEFAULT_PREFERENCES);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [storageError, setStorageError] = useState(false);

  // Load saved settings before enabling edits or saving anything.
  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(
          SETTINGS_STORAGE_KEY,
        );

        if (!isMounted) {
          return;
        }

        if (storedValue) {
          try {
            const parsed: unknown = JSON.parse(storedValue);

            if (
              parsed !== null &&
              typeof parsed === 'object' &&
              !Array.isArray(parsed)
            ) {
              const saved = parsed as Partial<SettingsPreferences>;

              setPreferences({
                deliveryNotifications:
                  typeof saved.deliveryNotifications === 'boolean'
                    ? saved.deliveryNotifications
                    : DEFAULT_PREFERENCES.deliveryNotifications,

                paymentNotifications:
                  typeof saved.paymentNotifications === 'boolean'
                    ? saved.paymentNotifications
                    : DEFAULT_PREFERENCES.paymentNotifications,

                soundNotifications:
                  typeof saved.soundNotifications === 'boolean'
                    ? saved.soundNotifications
                    : DEFAULT_PREFERENCES.soundNotifications,

                autoAcceptDeliveries:
                  typeof saved.autoAcceptDeliveries === 'boolean'
                    ? saved.autoAcceptDeliveries
                    : DEFAULT_PREFERENCES.autoAcceptDeliveries,

                locationUpdates:
                  typeof saved.locationUpdates === 'boolean'
                    ? saved.locationUpdates
                    : DEFAULT_PREFERENCES.locationUpdates,
              });
            }
          } catch {
            // Ignore malformed saved data and use safe defaults.
            setPreferences(DEFAULT_PREFERENCES);
          }
        }
      } catch {
        if (isMounted) {
          setStorageError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    };

    void loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist preferences only after the initial load has completed.
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let isMounted = true;

    const savePreferences = async () => {
      setIsSaving(true);

      try {
        await AsyncStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify(preferences),
        );

        if (isMounted) {
          setStorageError(false);
        }
      } catch {
        if (isMounted) {
          setStorageError(true);
        }
      } finally {
        if (isMounted) {
          setIsSaving(false);
        }
      }
    };

    void savePreferences();

    return () => {
      isMounted = false;
    };
  }, [preferences, isLoaded]);

  const updatePreference = <K extends keyof SettingsPreferences>(
    key: K,
    value: SettingsPreferences[K],
  ) => {
    setPreferences(current => ({
      ...current,
      [key]: value,
    }));
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDeliveryPreferences = () => {
    Alert.alert(
      'Delivery Preferences',
      'Your assignment preference is saved on this device. Delivery assignments still require explicit acceptance. Automatic assignment behavior will be controlled by the backend when it is connected.',
    );
  };

  const handleLocationSettings = () => {
    Alert.alert(
      'Location & Navigation',
      'This switch saves your location-update preference locally. It does not grant or revoke Android location permission, start GPS tracking, or change Mapbox navigation behavior.',
    );
  };

  const handleAppInformation = () => {
    Alert.alert(
      'DailyMart Nepal Delivery Partner',
      'Version 1.0.0\n\nFrontend demo version.',
    );
  };

  const handleSecurity = () => {
    navigation.navigate('Security');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Settings</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {!isLoaded ? (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                Loading your saved settings…
              </Text>
            </View>
          ) : null}

          {storageError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                Settings storage is unavailable. Changes may not persist
                after you leave this screen.
              </Text>
            </View>
          ) : null}

          {isLoaded && !storageError && isSaving ? (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                Saving preferences…
              </Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Availability</Text>

          <View style={styles.card}>
            <Pressable
              style={styles.settingRow}
              onPress={() => navigation.navigate('Home')}
              accessibilityRole="button"
              accessibilityLabel="Open Home to manage delivery availability">
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>●</Text>
              </View>

              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>
                  Delivery Availability
                </Text>

                <Text style={styles.settingDescription}>
                  Manage your online availability from the Home screen.
                </Text>
              </View>

              <Text style={styles.linkText}>Home</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.card}>
            <SettingSwitchRow
              title="Delivery Notifications"
              description="Save your preference for new delivery and assignment alerts."
              value={preferences.deliveryNotifications}
              disabled={!isLoaded}
              onValueChange={value =>
                updatePreference('deliveryNotifications', value)
              }
            />

            <Divider />

            <SettingSwitchRow
              title="Payment Notifications"
              description="Save your preference for earnings and payment alerts."
              value={preferences.paymentNotifications}
              disabled={!isLoaded}
              onValueChange={value =>
                updatePreference('paymentNotifications', value)
              }
            />

            <Divider />

            <SettingSwitchRow
              title="Sound Notifications"
              description="Save your preference for notification sounds."
              value={preferences.soundNotifications}
              disabled={!isLoaded}
              onValueChange={value =>
                updatePreference('soundNotifications', value)
              }
            />

            <Divider />

            <Pressable
              style={styles.navigationRow}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityRole="button"
              accessibilityLabel="Open notification center">
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>
                  Notification Center
                </Text>

                <Text style={styles.settingDescription}>
                  View and manage your recent notifications.
                </Text>
              </View>

              <Text style={styles.rowArrow}>›</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Delivery Preferences</Text>

          <View style={styles.card}>
            <SettingSwitchRow
              title="Auto-Accept Preference"
              description="Saved locally for now. Every delivery assignment still requires explicit acceptance."
              value={preferences.autoAcceptDeliveries}
              disabled={!isLoaded}
              onValueChange={value =>
                updatePreference('autoAcceptDeliveries', value)
              }
            />

            <Divider />

            <Pressable
              style={styles.navigationRow}
              onPress={handleDeliveryPreferences}
              accessibilityRole="button"
              accessibilityLabel="View delivery preference information">
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>
                  Delivery Preferences
                </Text>

                <Text style={styles.settingDescription}>
                  Learn how assignment preferences work in the current demo.
                </Text>
              </View>

              <Text style={styles.rowArrow}>›</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>App Security</Text>

          <View style={styles.card}>
            <Pressable
              style={styles.navigationRow}
              onPress={handleSecurity}
              accessibilityRole="button"
              accessibilityLabel="Open security settings">
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>🔒</Text>
              </View>

              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Security</Text>

                <Text style={styles.settingDescription}>
                  Manage available app security and account options.
                </Text>
              </View>

              <Text style={styles.rowArrow}>›</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Location & Navigation</Text>

          <View style={styles.card}>
            <SettingSwitchRow
              title="Location Updates Preference"
              description="Save your preference for location updates. Android permissions and GPS tracking are managed separately."
              value={preferences.locationUpdates}
              disabled={!isLoaded}
              onValueChange={value =>
                updatePreference('locationUpdates', value)
              }
            />

            <Divider />

            <Pressable
              style={styles.navigationRow}
              onPress={handleLocationSettings}
              accessibilityRole="button"
              accessibilityLabel="View location and navigation information">
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>
                  Navigation Settings
                </Text>

                <Text style={styles.settingDescription}>
                  Understand the location preference and Mapbox behavior.
                </Text>
              </View>

              <Text style={styles.rowArrow}>›</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Documents</Text>

          <View style={styles.card}>
            <Pressable
              style={styles.navigationRow}
              onPress={() => navigation.navigate('Documents')}
              accessibilityRole="button"
              accessibilityLabel="Open documents">
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>▤</Text>
              </View>

              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>My Documents</Text>

                <Text style={styles.settingDescription}>
                  View and update your delivery partner documents.
                </Text>
              </View>

              <Text style={styles.rowArrow}>›</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Support</Text>

          <View style={styles.card}>
            <Pressable
              style={styles.navigationRow}
              onPress={() => navigation.navigate('Support')}
              accessibilityRole="button"
              accessibilityLabel="Open support">
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>?</Text>
              </View>

              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Support & Help</Text>

                <Text style={styles.settingDescription}>
                  Get help, create a support ticket, or report a problem.
                </Text>
              </View>

              <Text style={styles.rowArrow}>›</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.card}>
            <Pressable
              style={styles.navigationRow}
              onPress={handleAppInformation}
              accessibilityRole="button"
              accessibilityLabel="View app information">
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>App Information</Text>

                <Text style={styles.settingDescription}>
                  DailyMart Nepal Delivery Partner
                </Text>
              </View>

              <Text style={styles.rowArrow}>›</Text>
            </Pressable>

            <Divider />

            <View style={styles.versionRow}>
              <Text style={styles.versionLabel}>App Version</Text>
              <Text style={styles.versionValue}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.bottomInfo}>
            <Text style={styles.bottomInfoText}>
              Preferences are stored locally on this device. They are not
              synchronized with a backend and do not control push
              notifications, Android permissions, GPS tracking, or
              delivery assignment behavior yet.
            </Text>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

type SettingSwitchRowProps = {
  title: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
};

const SettingSwitchRow = ({
  title,
  description,
  value,
  disabled = false,
  onValueChange,
}: SettingSwitchRowProps) => {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>

        <Text style={styles.settingDescription}>{description}</Text>
      </View>

      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        accessibilityRole="switch"
        accessibilityLabel={title}
        trackColor={{
          false: '#D1D5DB',
          true: '#A5D6A7',
        }}
        thumbColor={value ? '#2E7D32' : '#F4F4F5'}
      />
    </View>
  );
};

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },

  container: {
    flex: 1,
  },

  header: {
    minHeight: 64,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAE5',
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    fontSize: 32,
    lineHeight: 32,
    color: '#1F2937',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  headerSpacer: {
    width: 42,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 30,
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },

  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    overflow: 'hidden',
  },

  settingRow: {
    minHeight: 78,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  navigationRow: {
    minHeight: 78,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingIconText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E7D32',
  },

  settingContent: {
    flex: 1,
    paddingRight: 10,
  },

  settingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },

  settingDescription: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    color: '#6B7280',
  },

  linkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },

  rowArrow: {
    fontSize: 26,
    lineHeight: 26,
    color: '#2E7D32',
  },

  divider: {
    height: 1,
    backgroundColor: '#EEF0EE',
    marginHorizontal: 15,
  },

  versionRow: {
    minHeight: 55,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  versionLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  versionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },

  infoBanner: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
  },

  infoBannerText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#2E7D32',
  },

  errorBanner: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F5C2C2',
  },

  errorBannerText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#B42318',
  },

  bottomInfo: {
    marginTop: 22,
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#F0F7F0',
    borderWidth: 1,
    borderColor: '#D8EAD8',
  },

  bottomInfoText: {
    fontSize: 10,
    lineHeight: 16,
    color: '#667066',
    textAlign: 'center',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default SettingsScreen;
