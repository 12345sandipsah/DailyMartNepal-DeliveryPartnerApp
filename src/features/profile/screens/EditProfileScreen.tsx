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

type EditProfileNavigationProp =
  NativeStackNavigationProp<
    MainStackParamList,
    'EditProfile'
  >;

const EditProfileScreen = () => {
  const navigation =
    useNavigation<EditProfileNavigationProp>();

  const {profile, updateProfile} = useProfile();

  const [fullName, setFullName] = useState(
    profile.fullName,
  );

  const [email, setEmail] = useState(
    profile.email,
  );

  const [dateOfBirth, setDateOfBirth] = useState(
    profile.dateOfBirth,
  );

  const [address, setAddress] = useState(
    profile.address,
  );

  const [emergencyContactName, setEmergencyContactName] =
    useState(profile.emergencyContactName);

  const [emergencyContactNumber, setEmergencyContactNumber] =
    useState(profile.emergencyContactNumber);

  const handleSaveChanges = () => {
    if (!fullName.trim()) {
      Alert.alert(
        'Invalid Information',
        'Please enter your full name.',
      );
      return;
    }

    if (!email.trim()) {
      Alert.alert(
        'Invalid Information',
        'Please enter your email address.',
      );
      return;
    }

    if (!address.trim()) {
      Alert.alert(
        'Invalid Information',
        'Please enter your address.',
      );
      return;
    }

    updateProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      dateOfBirth: dateOfBirth.trim(),
      address: address.trim(),
      emergencyContactName:
        emergencyContactName.trim(),
      emergencyContactNumber:
        emergencyContactNumber.trim(),
    });

    Alert.alert(
      'Profile Updated',
      'Your profile changes have been saved successfully.',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ],
    );
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

          <Text style={styles.headerTitle}>
            Edit Profile
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Personal Information
            </Text>

            <View style={styles.card}>
              <InputField
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
              />

              <FieldDivider />

              <InputField
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <FieldDivider />

              <InputField
                label="Date of Birth"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="Enter date of birth"
              />

              <FieldDivider />

              <InputField
                label="Address"
                value={address}
                onChangeText={setAddress}
                placeholder="Enter address"
                multiline
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Account Information
            </Text>

            <View style={styles.card}>
              <ReadOnlyField
                label="Mobile Number"
                value="+977 98XXXXXXXX"
              />

              <FieldDivider />

              <ReadOnlyField
                label="Partner ID"
                value="DP-10025"
              />

              <FieldDivider />

              <ReadOnlyField
                label="Verification Status"
                value="Verified"
              />
            </View>

            <Text style={styles.helperText}>
              Mobile number, Partner ID, and verification information
              cannot be changed from the app.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Emergency Contact
            </Text>

            <View style={styles.card}>
              <InputField
                label="Contact Name"
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                placeholder="Enter emergency contact name"
              />

              <FieldDivider />

              <InputField
                label="Contact Number"
                value={emergencyContactNumber}
                onChangeText={setEmergencyContactNumber}
                placeholder="Enter emergency contact number"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}>
              <Text style={styles.noticeIconText}>
                i
              </Text>
            </View>

            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>
                Verification may be required
              </Text>

              <Text style={styles.noticeText}>
                Some profile changes may require review or approval
                before they become active in the production system.
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.saveButton}
            onPress={handleSaveChanges}
            accessibilityRole="button"
            accessibilityLabel="Save profile changes">
            <Text style={styles.saveButtonText}>
              Save Changes
            </Text>
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
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences';
  multiline?: boolean;
};

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
}: InputFieldProps) => {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline && styles.multilineInput,
        ]}
      />
    </View>
  );
};

type ReadOnlyFieldProps = {
  label: string;
  value: string;
};

const ReadOnlyField = ({
  label,
  value,
}: ReadOnlyFieldProps) => {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.readOnlyLabelRow}>
        <Text style={styles.fieldLabel}>
          {label}
        </Text>

        <Text style={styles.readOnlyText}>
          Read only
        </Text>
      </View>

      <View style={styles.readOnlyBox}>
        <Text style={styles.readOnlyValue}>
          {value}
        </Text>
      </View>
    </View>
  );
};

const FieldDivider = () => {
  return <View style={styles.fieldDivider} />;
};

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