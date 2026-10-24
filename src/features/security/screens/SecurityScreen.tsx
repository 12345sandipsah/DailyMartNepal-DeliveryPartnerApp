
import React, {useState} from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {MainStackParamList} from '../../../app/navigation/MainNavigator';

type SecurityNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Security'
>;

const SecurityScreen = () => {
  const navigation = useNavigation<SecurityNavigationProp>();

  const [appLock, setAppLock] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLoginActivity = () => {
    Alert.alert(
      'Login Activity',
      'Recent login activity will be displayed here after backend authentication is connected.',
      [{text: 'OK'}],
    );
  };

  const handleLogoutAllDevices = () => {
    Alert.alert(
      'Logout from All Devices',
      'This will sign out the delivery partner from all active devices.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Demo Action',
              'All-device logout will be connected to the backend later.',
            );
          },
        },
      ],
    );
  };

  const handleAppLockChange = (value: boolean) => {
    if (value) {
      Alert.alert(
        'App Lock',
        'PIN setup will be connected in the next security step.',
        [{text: 'OK'}],
      );
      return;
    }

    setAppLock(false);
  };

  const handleBiometricChange = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Biometric Login',
        'Fingerprint or face authentication will be connected to the device security system later.',
        [{text: 'OK'}],
      );
      return;
    }

    setBiometricLogin(false);
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

          <Text style={styles.headerTitle}>Security</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.securityStatusCard}>
            <View style={styles.securityStatusIcon}>
              <Text style={styles.securityStatusIconText}>✓</Text>
            </View>

            <View style={styles.securityStatusContent}>
              <Text style={styles.securityStatusTitle}>
                Account Security
              </Text>
              <Text style={styles.securityStatusDescription}>
                Your account security settings can be managed from this
                screen.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>App Security</Text>

          <View style={styles.card}>
            <SettingSwitchRow
              title="App Lock"
              description="Require a PIN before opening the delivery partner app."
              value={appLock}
              onValueChange={handleAppLockChange}
            />

            <Divider />

            <SettingSwitchRow
              title="Biometric Login"
              description="Use fingerprint or face authentication when available."
              value={biometricLogin}
              onValueChange={handleBiometricChange}
            />
          </View>

          <Text style={styles.sectionTitle}>Account Activity</Text>

          <View style={styles.card}>
            <Pressable
              style={styles.navigationRow}
              onPress={handleLoginActivity}
              accessibilityRole="button"
              accessibilityLabel="View login activity">
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>◷</Text>
              </View>

              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Login Activity</Text>
                <Text style={styles.settingDescription}>
                  Review recent account login activity and devices.
                </Text>
              </View>

              <Text style={styles.rowArrow}>›</Text>
            </Pressable>

            <Divider />

            <Pressable
              style={styles.navigationRow}
              onPress={handleLogoutAllDevices}
              accessibilityRole="button"
              accessibilityLabel="Logout from all devices">
              <View style={styles.settingIconDanger}>
                <Text style={styles.settingIconDangerText}>↪</Text>
              </View>

              <View style={styles.settingContent}>
                <Text style={styles.settingTitleDanger}>
                  Logout from All Devices
                </Text>
                <Text style={styles.settingDescription}>
                  Sign out from all devices currently using this account.
                </Text>
              </View>

              <Text style={styles.rowArrowDanger}>›</Text>
            </Pressable>
          </View>

          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}>
              <Text style={styles.noticeIconText}>i</Text>
            </View>

            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>Security Information</Text>
              <Text style={styles.noticeText}>
                Authentication sessions, login activity, PIN security and
                biometric authentication will be connected to the DailyMart
                Nepal backend during the authentication and security phase.
              </Text>
            </View>
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
  onValueChange: (value: boolean) => void;
};

const SettingSwitchRow = ({
  title,
  description,
  value,
  onValueChange,
}: SettingSwitchRowProps) => (
  <View style={styles.settingRow}>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>

    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{
        false: '#D1D5DB',
        true: '#A5D6A7',
      }}
      thumbColor={value ? '#2E7D32' : '#F4F4F5'}
    />
  </View>
);

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
  securityStatusCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0F7F0',
    borderWidth: 1,
    borderColor: '#D8EAD8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityStatusIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  securityStatusIconText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  securityStatusContent: {
    flex: 1,
  },
  securityStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  securityStatusDescription: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    color: '#667066',
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
  navigationRow: {
    minHeight: 78,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRow: {
    minHeight: 78,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIconText: {
    fontSize: 18,
    color: '#2E7D32',
  },
  settingIconDanger: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIconDangerText: {
    fontSize: 20,
    color: '#D32F2F',
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
  settingTitleDanger: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D32F2F',
  },
  settingDescription: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    color: '#6B7280',
  },
  rowArrow: {
    fontSize: 26,
    color: '#2E7D32',
  },
  rowArrowDanger: {
    fontSize: 26,
    color: '#D32F2F',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF0EE',
    marginHorizontal: 15,
  },
  noticeCard: {
    marginTop: 22,
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#FFF9ED',
    borderWidth: 1,
    borderColor: '#F4DFAC',
    flexDirection: 'row',
  },
  noticeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  noticeIconText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  noticeText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    color: '#6B7280',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default SecurityScreen;
