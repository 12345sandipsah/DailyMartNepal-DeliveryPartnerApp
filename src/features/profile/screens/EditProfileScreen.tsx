
import React, {useState} from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import type {MainStackParamList} from '../../../app/navigation/MainNavigator';
import {useProfile} from '../context/ProfileContext';

type EditProfileNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'EditProfile'
>;

const normalizeNepalPhone = (value: string) =>
  value.replace(/[\s()-]/g, '').replace(/^(?:\+977|977)/, '');

const isValidDateOfBirth = (value: string) => {
  // Accepted format: DD/MM/YYYY
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return false;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date <= today
  );
};

const EditProfileScreen = () => {
  const navigation = useNavigation<EditProfileNavigationProp>();
  const {profile, updateProfile} = useProfile();

  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth);
  const [address, setAddress] = useState(profile.address);
  const [emergencyContactName, setEmergencyContactName] = useState(
    profile.emergencyContactName,
  );
  const [emergencyContactNumber, setEmergencyContactNumber] = useState(
    profile.emergencyContactNumber,
  );
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setFullName(profile.fullName);
    setEmail(profile.email);
    setDateOfBirth(profile.dateOfBirth);
    setAddress(profile.address);
    setEmergencyContactName(profile.emergencyContactName);
    setEmergencyContactNumber(profile.emergencyContactNumber);
  }, [
    profile.fullName,
    profile.email,
    profile.dateOfBirth,
    profile.address,
    profile.emergencyContactName,
    profile.emergencyContactNumber,
  ]);

  const handleSaveChanges = async () => {
    if (isSaving) return;
    const trimmedFullName = fullName.trim().replace(/\s+/g, ' ');
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedDateOfBirth = dateOfBirth.trim();
    const trimmedAddress = address.trim();
    const trimmedEmergencyContactName = emergencyContactName
      .trim()
      .replace(/\s+/g, ' ');
    const trimmedEmergencyContactNumber = emergencyContactNumber.trim();

    if (!trimmedFullName) {
      Alert.alert('Invalid Information', 'Please enter your full name.');
      return;
    }

    if (
      trimmedFullName.length < 2 ||
      !/\p{L}/u.test(trimmedFullName) ||
      /[\d]/.test(trimmedFullName)
    ) {
      Alert.alert(
        'Invalid Information',
        'Enter a valid name using letters and spaces. Do not include numbers.',
      );
      return;
    }

    if (!trimmedEmail) {
      Alert.alert('Invalid Information', 'Please enter your email address.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (
      !emailPattern.test(trimmedEmail) ||
      trimmedEmail.length > 254
    ) {
      Alert.alert(
        'Invalid Information',
        'Please enter a valid email address.',
      );
      return;
    }

    if (!trimmedDateOfBirth) {
      Alert.alert('Invalid Information', 'Please enter your date of birth.');
      return;
    }

    if (!isValidDateOfBirth(trimmedDateOfBirth)) {
      Alert.alert(
        'Invalid Date of Birth',
        'Enter a valid date in DD/MM/YYYY format. The date cannot be in the future.',
      );
      return;
    }

    if (!trimmedAddress) {
      Alert.alert('Invalid Information', 'Please enter your address.');
      return;
    }

    if (trimmedAddress.length < 5 || trimmedAddress.length > 250) {
      Alert.alert(
        'Invalid Address',
        'Your address must contain between 5 and 250 characters.',
      );
      return;
    }

    if (
      trimmedEmergencyContactName &&
      (trimmedEmergencyContactName.length < 2 ||
        !/\p{L}/u.test(trimmedEmergencyContactName) ||
        /[\d]/.test(trimmedEmergencyContactName))
    ) {
      Alert.alert(
        'Invalid Emergency Contact',
        'Please enter a valid contact name without numbers.',
      );
      return;
    }

    if (trimmedEmergencyContactNumber) {
      const localNumber = normalizeNepalPhone(
        trimmedEmergencyContactNumber,
      );

      if (!/^9\d{9}$/.test(localNumber)) {
        Alert.alert(
          'Invalid Emergency Contact',
          'Enter a valid Nepal mobile number with 10 digits, optionally prefixed with +977.',
        );
        return;
      }

      if (!trimmedEmergencyContactName) {
        Alert.alert(
          'Invalid Emergency Contact',
          'Please enter the emergency contact name as well.',
        );
        return;
      }
    }

    if (trimmedEmergencyContactName && !trimmedEmergencyContactNumber) {
      Alert.alert(
        'Invalid Emergency Contact',
        'Please enter the emergency contact number as well.',
      );
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        fullName: trimmedFullName,
        email: trimmedEmail,
        dateOfBirth: trimmedDateOfBirth,
        address: trimmedAddress,
        emergencyContactName: trimmedEmergencyContactName,
        emergencyContactNumber: trimmedEmergencyContactNumber,
      });

      Alert.alert(
        'Profile Updated',
        'Your profile changes have been saved to DailyMart.',
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    } catch (error) {
      Alert.alert(
        'Profile not updated',
        error instanceof Error ? error.message : 'Please check your connection and retry.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Edit Profile</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.card}>
              <InputField
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                maxLength={100}
              />

              <FieldDivider />

              <InputField
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={254}
              />

              <FieldDivider />

              <InputField
                label="Date of Birth"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="DD/MM/YYYY"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />

              <Text style={styles.fieldHint}>
                Use DD/MM/YYYY format.
              </Text>

              <FieldDivider />

              <InputField
                label="Address"
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your full address"
                multiline
                maxLength={250}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>

            <View style={styles.card}>
              <ReadOnlyField
                label="Mobile Number"
                value={profile.phone || 'Unavailable'}
              />

              <FieldDivider />

              <ReadOnlyField
                label="Partner ID"
                value={profile.partnerCode || profile.partnerId || 'Unavailable'}
              />

              <FieldDivider />

              <ReadOnlyField
                label="Account Status"
                value={profile.isActive ? 'Active' : 'Inactive'}
              />
            </View>

            <Text style={styles.helperText}>
              Mobile number, Partner ID, and account status cannot
              be changed from this screen.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>

            <View style={styles.card}>
              <InputField
                label="Contact Name"
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                placeholder="Enter emergency contact name"
                maxLength={100}
              />

              <FieldDivider />

              <InputField
                label="Contact Number"
                value={emergencyContactNumber}
                onChangeText={setEmergencyContactNumber}
                placeholder="Enter Nepal mobile number"
                keyboardType="phone-pad"
                maxLength={16}
              />
            </View>

            <Text style={styles.helperText}>
              Both emergency contact fields must be filled in together, or
              both can be left empty.
            </Text>
          </View>

          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}>
              <Text style={styles.noticeIconText}>i</Text>
            </View>

            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>
                Verification may be required
              </Text>

              <Text style={styles.noticeText}>
                Some profile changes may require review or approval before
                they become active in the production system.
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.saveButton}
            onPress={handleSaveChanges}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Save profile changes">
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving…' : 'Save Changes'}</Text>
          </Pressable>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numbers-and-punctuation';
  autoCapitalize?: 'none' | 'sentences';
  autoCorrect?: boolean;
  multiline?: boolean;
  maxLength?: number;
};

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect,
  multiline = false,
  maxLength,
}: InputFieldProps) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>

    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      maxLength={maxLength}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[styles.input, multiline && styles.multilineInput]}
      accessibilityLabel={label}
    />
  </View>
);

type ReadOnlyFieldProps = {
  label: string;
  value: string;
};

const ReadOnlyField = ({label, value}: ReadOnlyFieldProps) => (
  <View style={styles.fieldContainer}>
    <View style={styles.readOnlyLabelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.readOnlyText}>READ ONLY</Text>
    </View>

    <View style={styles.readOnlyBox}>
      <Text style={styles.readOnlyValue}>{value}</Text>
    </View>
  </View>
);

const FieldDivider = () => <View style={styles.fieldDivider} />;

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
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  card: {
    paddingHorizontal: 15,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },
  fieldContainer: {
    paddingVertical: 13,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 7,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDE3DD',
    backgroundColor: '#FAFCFA',
    fontSize: 13,
    color: '#1F2937',
  },
  multilineInput: {
    minHeight: 88,
    paddingTop: 12,
  },
  fieldHint: {
    marginTop: -5,
    marginBottom: 10,
    fontSize: 10,
    color: '#8A918A',
  },
  fieldDivider: {
    height: 1,
    backgroundColor: '#EEF0EE',
  },
  readOnlyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  readOnlyText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  readOnlyBox: {
    minHeight: 46,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5EAE5',
    backgroundColor: '#F3F5F3',
    justifyContent: 'center',
  },
  readOnlyValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  helperText: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 17,
    color: '#8A918A',
  },
  noticeCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#F0F7F0',
    borderWidth: 1,
    borderColor: '#D8EAD8',
    marginBottom: 22,
  },
  noticeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  noticeIconText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#667066',
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 11,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default EditProfileScreen;
