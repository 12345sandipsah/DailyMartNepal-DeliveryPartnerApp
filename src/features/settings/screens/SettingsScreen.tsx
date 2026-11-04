
import React, {useCallback, useEffect, useState} from 'react';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';
import {AuthorizationStatus} from 'react-native-notify-kit';

import {useNavigation} from '@react-navigation/native';

import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import type {MainStackParamList} from '../../../app/navigation/MainNavigator';
import {
  getPartnerPreferences,
  updatePartnerPreferences,
} from '../../../shared/services/api';
import type {PartnerPreferences} from '../../../shared/services/api';
import {
  getDeviceNotificationSettings,
  hasDeviceNotificationPermission,
  openDeviceNotificationSettings,
  requestPartnerNotificationPermission,
  syncPartnerPushToken,
} from '../../notifications/services/pushNotifications';

type SettingsNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Home'
>;

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const [preferences, setPreferences] = useState<PartnerPreferences | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnablingDeviceNotifications, setIsEnablingDeviceNotifications] = useState(false);
  const [preferenceError, setPreferenceError] = useState('');
  const loadPreferences = useCallback(async () => {
    setIsLoaded(false);
    setPreferenceError('');
    try {
      setPreferences(await getPartnerPreferences());
    } catch (error) {
      setPreferenceError(error instanceof Error ? error.message : 'Unable to load your account preferences.');
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreference = async (key: keyof PartnerPreferences, value: boolean) => {
    if (!preferences || isSaving) return;
    const previous = preferences;
    setPreferences({...previous, [key]: value});
    setIsSaving(true);
    setPreferenceError('');
    try {
      setPreferences(await updatePartnerPreferences({[key]: value}));
    } catch (error) {
      setPreferences(previous);
      const message = error instanceof Error ? error.message : 'Your preference could not be saved.';
      setPreferenceError(message);
      Alert.alert('Could not save preference', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSecurity = () => {
    navigation.navigate('Security');
  };

  const handleDeviceNotifications = async () => {
    if (isEnablingDeviceNotifications) return;
    setIsEnablingDeviceNotifications(true);
    try {
      const settings = await getDeviceNotificationSettings();
      if (hasDeviceNotificationPermission(settings.authorizationStatus)) {
        await syncPartnerPushToken();
        Alert.alert('Device alerts are enabled', 'Essential delivery alerts can appear on this device.');
        return;
      }
      if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
        Alert.alert(
          'Allow device notifications',
          'Notifications are turned off for DailyMart in your device settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open settings', onPress: () => {
              openDeviceNotificationSettings().catch(error => Alert.alert('Could not open settings', error.message));
            }},
          ],
        );
        return;
      }
      const enabled = await requestPartnerNotificationPermission();
      if (enabled) {
        Alert.alert('Device alerts are enabled', 'Essential delivery alerts can appear on this device.');
      } else {
        Alert.alert(
          'Notifications are still off',
          'Allow notifications in your device settings to receive essential delivery alerts.',
          [
            {text: 'Later', style: 'cancel'},
            {text: 'Open settings', onPress: () => {
              openDeviceNotificationSettings().catch(error => Alert.alert('Could not open settings', error.message));
            }},
          ],
        );
      }
    } catch (error) {
      Alert.alert(
        'Could not enable device alerts',
        error instanceof Error ? error.message : 'Check your connection and try again.',
      );
    } finally {
      setIsEnablingDeviceNotifications(false);
    }
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

          {preferenceError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                {preferenceError}
              </Text>
              {!preferences ? (
                <Pressable onPress={() => { loadPreferences(); }} accessibilityRole="button">
                  <Text style={styles.linkText}>Retry</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {isLoaded && isSaving ? (
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
            <Pressable
              style={styles.settingRow}
              onPress={handleDeviceNotifications}
              accessibilityRole="button"
              accessibilityLabel="Enable or manage device notifications">
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>♢</Text>
              </View>

              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Device Alerts</Text>
                <Text style={styles.settingDescription}>
                  {isEnablingDeviceNotifications
                    ? 'Checking notification permission…'
                    : 'Allow essential alerts to appear outside the app.'}
                </Text>
              </View>

              <Text style={styles.linkText}>Manage</Text>
            </Pressable>

            <Divider />

            <SettingSwitchRow
              title="Delivery Notifications"
              description="Save your preference for new delivery and assignment alerts."
              value={preferences?.deliveryNotifications ?? true}
              disabled={!preferences || !isLoaded || isSaving}
              onValueChange={value =>
                updatePreference('deliveryNotifications', value)
              }
            />

            <Divider />

            <SettingSwitchRow
              title="Payment Notifications"
              description="Save your preference for earnings and payment alerts."
              value={preferences?.paymentNotifications ?? true}
              disabled={!preferences || !isLoaded || isSaving}
              onValueChange={value =>
                updatePreference('paymentNotifications', value)
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
              onPress={() => Alert.alert('DailyMart Nepal Delivery Partner', 'Delivery operations and support for DailyMart Nepal.')}
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
              Notification preferences are saved to your DailyMart account.
              Critical delivery and payment alerts remain visible so you do
              not miss time-sensitive operational updates.
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
