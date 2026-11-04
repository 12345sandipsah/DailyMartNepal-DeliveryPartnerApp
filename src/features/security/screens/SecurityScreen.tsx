import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {MainStackParamList} from '../../../app/navigation/MainNavigator';
import {
  changePartnerPassword,
  getPartnerLoginActivity,
  logoutPartner,
  revokePartnerSessions,
} from '../../../shared/services/api';
import type {PartnerLoginActivity} from '../../../shared/services/api';

type SecurityNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Security'>;
type SecurityScreenProps = {onLogout: () => void};

const SecurityScreen = ({onLogout}: SecurityScreenProps) => {
  const navigation = useNavigation<SecurityNavigationProp>();
  const [activities, setActivities] = useState<PartnerLoginActivity[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [isRefreshingActivity, setIsRefreshingActivity] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  const loadActivity = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingActivity(true);
    setActivityError('');
    try {
      setActivities(await getPartnerLoginActivity());
    } catch (error) {
      setActivityError(error instanceof Error ? error.message : 'Unable to load account activity.');
    } finally {
      if (showLoading) setIsLoadingActivity(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadActivity();
    }, [loadActivity]),
  );

  const refreshActivity = useCallback(async () => {
    setIsRefreshingActivity(true);
    try {
      await loadActivity(false);
    } finally {
      setIsRefreshingActivity(false);
    }
  }, [loadActivity]);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Password required', 'Enter your current password.');
      return;
    }
    if (!newPassword) {
      Alert.alert('Password required', 'Enter a new password.');
      return;
    }
    if (newPassword.length < 10 || newPassword.length > 128) {
      Alert.alert('Password length', 'Use a new password between 10 and 128 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Check the new password and confirmation.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePartnerPassword(currentPassword, newPassword);
      await logoutPartner();
      Alert.alert('Password changed', 'Sign in again using your new password.', [
        {text: 'Sign in', onPress: onLogout},
      ]);
    } catch (error) {
      Alert.alert('Unable to change password', error instanceof Error ? error.message : 'Try again shortly.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutAll = () => {
    Alert.alert(
      'Sign out all devices?',
      'This signs out every active delivery partner session, including this device.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Sign out all',
          style: 'destructive',
          onPress: async () => {
            setIsRevokingSessions(true);
            try {
              await revokePartnerSessions();
              await logoutPartner();
              onLogout();
            } catch (error) {
              Alert.alert('Unable to sign out devices', error instanceof Error ? error.message : 'Try again shortly.');
            } finally {
              setIsRevokingSessions(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Security</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshingActivity}
              onRefresh={refreshActivity}
              tintColor="#168447"
              colors={["#168447"]}
            />
          }>
          <View style={styles.statusCard}>
            <Text style={styles.statusIcon}>✓</Text>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Account security</Text>
              <Text style={styles.description}>Manage your password, active sessions, and recent sign-ins.</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Change password</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Current password</Text>
            <TextInput value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} maxLength={128} textContentType="password" style={styles.input} placeholder="Enter current password" />
            <Text style={styles.fieldLabel}>New password</Text>
            <TextInput value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} maxLength={128} textContentType="newPassword" style={styles.input} placeholder="10 to 128 characters" />
            <Text style={styles.fieldLabel}>Confirm new password</Text>
            <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} maxLength={128} textContentType="newPassword" style={styles.input} placeholder="Re-enter new password" />
            <Pressable style={[styles.primaryButton, isChangingPassword && styles.disabledButton]} disabled={isChangingPassword} onPress={handleChangePassword} accessibilityRole="button">
              {isChangingPassword ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Change password</Text>}
            </Pressable>
            <Text style={styles.helperText}>Changing your password ends existing sessions. You will need to sign in again.</Text>
          </View>

          <Text style={styles.sectionTitle}>Recent sign-ins</Text>
          <View style={styles.card}>
            {isLoadingActivity ? (
              <View style={styles.loadingRow}><ActivityIndicator color="#168447" /><Text style={styles.description}>Loading sign-in activity…</Text></View>
            ) : activityError ? (
              <View style={styles.emptyState}>
                <Text style={styles.errorText}>{activityError}</Text>
                <Pressable onPress={() => { loadActivity(); }} accessibilityRole="button"><Text style={styles.linkText}>Retry</Text></Pressable>
              </View>
            ) : activities.length === 0 ? (
              <Text style={styles.emptyText}>No sign-in activity recorded yet.</Text>
            ) : activities.map((activity, index) => (
              <View key={activity._id} style={[styles.activityRow, index > 0 && styles.activityDivider]}>
                <View style={styles.activityDot} />
                <View style={styles.flex}>
                  <Text style={styles.activityDevice} numberOfLines={2}>{activity.device || 'Unknown device'}</Text>
                  <Text style={styles.activityMeta}>{activity.network || 'Network unavailable'}</Text>
                  <Text style={styles.activityMeta}>{new Date(activity.signedInAt).toLocaleString()}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Active sessions</Text>
          <Pressable style={[styles.dangerButton, isRevokingSessions && styles.disabledButton]} disabled={isRevokingSessions} onPress={handleLogoutAll} accessibilityRole="button">
            {isRevokingSessions ? <ActivityIndicator color="#B42318" /> : <Text style={styles.dangerButtonText}>Sign out all devices</Text>}
          </Pressable>
          <Text style={styles.helperText}>Use this if your phone is lost or you suspect someone else has access to your account.</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#F7F9F7'},
  container: {flex: 1},
  header: {minHeight: 64, paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5EAE5', flexDirection: 'row', alignItems: 'center'},
  backButton: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center'},
  backArrow: {fontSize: 32, lineHeight: 32, color: '#1F2937'},
  headerTitle: {flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#1F2937'},
  headerSpacer: {width: 42},
  scrollContent: {paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32},
  statusCard: {padding: 16, borderRadius: 16, backgroundColor: '#F0F7F0', borderWidth: 1, borderColor: '#D8EAD8', flexDirection: 'row', alignItems: 'center'},
  statusIcon: {width: 44, height: 44, lineHeight: 44, textAlign: 'center', borderRadius: 14, overflow: 'hidden', backgroundColor: '#2E7D32', color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginRight: 12},
  flex: {flex: 1},
  cardTitle: {fontSize: 14, fontWeight: '700', color: '#1F2937'},
  description: {marginTop: 4, fontSize: 11, lineHeight: 17, color: '#667066'},
  sectionTitle: {marginTop: 22, marginBottom: 10, fontSize: 16, fontWeight: '700', color: '#1F2937'},
  card: {padding: 15, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EAE5'},
  fieldLabel: {marginTop: 10, marginBottom: 6, fontSize: 12, fontWeight: '600', color: '#374151'},
  input: {minHeight: 48, borderWidth: 1, borderColor: '#D9E0D9', borderRadius: 10, paddingHorizontal: 12, color: '#1F2937', backgroundColor: '#FFFFFF'},
  primaryButton: {minHeight: 48, marginTop: 16, borderRadius: 11, backgroundColor: '#168447', alignItems: 'center', justifyContent: 'center'},
  primaryButtonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '700'},
  disabledButton: {opacity: 0.6},
  helperText: {marginTop: 10, fontSize: 10, lineHeight: 15, color: '#6B7280'},
  loadingRow: {minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12},
  emptyState: {gap: 10, paddingVertical: 12},
  emptyText: {paddingVertical: 14, color: '#6B7280', fontSize: 12},
  errorText: {color: '#B42318', fontSize: 12},
  linkText: {color: '#168447', fontSize: 12, fontWeight: '700'},
  activityRow: {paddingVertical: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 11},
  activityDivider: {borderTopWidth: 1, borderTopColor: '#EDF0ED'},
  activityDot: {width: 9, height: 9, borderRadius: 5, marginTop: 4, backgroundColor: '#168447'},
  activityDevice: {fontSize: 12, fontWeight: '600', color: '#1F2937'},
  activityMeta: {marginTop: 4, fontSize: 10, color: '#6B7280'},
  dangerButton: {minHeight: 48, borderWidth: 1, borderColor: '#F0B4AE', borderRadius: 11, backgroundColor: '#FFF7F6', alignItems: 'center', justifyContent: 'center'},
  dangerButtonText: {color: '#B42318', fontSize: 13, fontWeight: '700'},
});

export default SecurityScreen;
