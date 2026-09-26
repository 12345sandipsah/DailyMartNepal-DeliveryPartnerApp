import React from 'react';

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import type {MainStackParamList} from '../../../app/navigation/MainNavigator';

import {useProfile} from '../context/ProfileContext';

type ProfileNavigationProp =
  NativeStackNavigationProp<MainStackParamList, 'Profile'>;

const ProfileScreen = () => {
  const navigation =
    useNavigation<ProfileNavigationProp>();

  const {profile} = useProfile();

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleViewDocuments = () => {
    navigation.navigate('Documents');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>

          <Pressable
            style={styles.editButton}
            onPress={handleEditProfile}
            accessibilityRole="button"
            accessibilityLabel="Edit profile">
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Profile Header */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(profile.fullName)}
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile.fullName}
              </Text>

              <Text style={styles.partnerId}>
                Partner ID: DP-10025
              </Text>

              <View style={styles.activeStatusRow}>
                <View style={styles.activeDot} />

                <Text style={styles.activeStatusText}>
                  Delivery Partner
                </Text>
              </View>
            </View>
          </View>

          {/* Verification Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Verification Status
            </Text>

            <View style={styles.verificationCard}>
              <View style={styles.verificationIcon}>
                <Text style={styles.verificationIconText}>✓</Text>
              </View>

              <View style={styles.verificationContent}>
                <Text style={styles.verificationTitle}>
                  Profile Verified
                </Text>

                <Text style={styles.verificationDescription}>
                  Your delivery partner profile has been verified.
                </Text>
              </View>

              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>
                  VERIFIED
                </Text>
              </View>
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Personal Information
            </Text>

            <View style={styles.infoCard}>
              <InfoRow
                label="Full Name"
                value={profile.fullName}
              />

              <InfoDivider />

              <InfoRow
                label="Mobile Number"
                value="+977 98XXXXXXXX"
              />

              <InfoDivider />

              <InfoRow
                label="Email Address"
                value={profile.email}
              />

              <InfoDivider />

              <InfoRow
                label="Date of Birth"
                value={profile.dateOfBirth}
              />

              <InfoDivider />

              <InfoRow
                label="Address"
                value={profile.address}
                multiline
              />
            </View>
          </View>

          {/* Vehicle Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Vehicle Information
            </Text>

            <View style={styles.infoCard}>
              <InfoRow
                label="Vehicle Type"
                value="Motorcycle"
              />

              <InfoDivider />

              <InfoRow
                label="Vehicle Number"
                value="BA 12 PA 3456"
              />

              <InfoDivider />

              <InfoRow
                label="Vehicle Model"
                value="Honda Shine"
              />

              <InfoDivider />

              <InfoRow
                label="Vehicle Color"
                value="Black"
              />
            </View>
          </View>

          {/* Documents */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Documents
              </Text>

              <Pressable
                onPress={handleViewDocuments}
                accessibilityRole="button"
                accessibilityLabel="View all documents">
                <Text style={styles.sectionAction}>
                  View All
                </Text>
              </Pressable>
            </View>

            <View style={styles.documentCard}>
              <DocumentRow
                title="Driving License"
                subtitle="License: DL-NEP-204581"
                status="Verified"
              />

              <DocumentDivider />

              <DocumentRow
                title="Citizenship / ID"
                subtitle="Document verified"
                status="Verified"
              />

              <DocumentDivider />

              <DocumentRow
                title="Vehicle Registration"
                subtitle="Registration verified"
                status="Verified"
              />

              <DocumentDivider />

              <DocumentRow
                title="Insurance"
                subtitle="Valid until 18 Dec 2026"
                status="Valid"
              />
            </View>
          </View>

          {/* Account Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Account Information
            </Text>

            <View style={styles.infoCard}>
              <InfoRow
                label="Partner Since"
                value="December 2026"
              />

              <InfoDivider />

              <InfoRow
                label="Account Status"
                value="Active"
              />

              <InfoDivider />

              <InfoRow
                label="Assigned City"
                value="Kathmandu"
              />
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const getInitials = (name: string) => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return 'DP';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
};

type InfoRowProps = {
  label: string;
  value: string;
  multiline?: boolean;
};

const InfoRow = ({
  label,
  value,
  multiline = false,
}: InfoRowProps) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text
        style={[
          styles.infoValue,
          multiline && styles.infoValueMultiline,
        ]}>
        {value}
      </Text>
    </View>
  );
};

const InfoDivider = () => {
  return <View style={styles.infoDivider} />;
};

type DocumentRowProps = {
  title: string;
  subtitle: string;
  status: string;
};

const DocumentRow = ({
  title,
  subtitle,
  status,
}: DocumentRowProps) => {
  return (
    <Pressable
      style={styles.documentRow}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}>
      <View style={styles.documentIcon}>
        <Text style={styles.documentIconText}>▤</Text>
      </View>

      <View style={styles.documentContent}>
        <Text style={styles.documentTitle}>
          {title}
        </Text>

        <Text style={styles.documentSubtitle}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.documentRight}>
        <View style={styles.documentStatusBadge}>
          <Text style={styles.documentStatusText}>
            {status}
          </Text>
        </View>

        <Text style={styles.documentArrow}>›</Text>
      </View>
    </Pressable>
  );
};

const DocumentDivider = () => {
  return <View style={styles.documentDivider} />;
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
    justifyContent: 'space-between',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },

  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
  },

  editButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 30,
  },

  profileCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2E7D32',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },

  partnerId: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },

  activeStatusRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
    marginRight: 6,
  },

  activeStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },

  section: {
    marginTop: 22,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  sectionTitle: {
    marginBottom: 10,
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },

  sectionAction: {
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },

  verificationCard: {
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#F0F7F0',
    borderWidth: 1,
    borderColor: '#D8EAD8',
    flexDirection: 'row',
    alignItems: 'center',
  },

  verificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  verificationIconText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  verificationContent: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 8,
  },

  verificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

  verificationDescription: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 17,
    color: '#667066',
  },

  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },

  verifiedBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#2E7D32',
  },

  infoCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    paddingHorizontal: 15,
  },

  infoRow: {
    minHeight: 58,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  infoLabel: {
    flex: 0.9,
    fontSize: 12,
    color: '#6B7280',
  },

  infoValue: {
    flex: 1.2,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    color: '#1F2937',
  },

  infoValueMultiline: {
    lineHeight: 18,
  },

  infoDivider: {
    height: 1,
    backgroundColor: '#EEF0EE',
  },

  documentCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    paddingHorizontal: 14,
  },

  documentRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
  },

  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  documentIconText: {
    fontSize: 20,
    color: '#1976D2',
  },

  documentContent: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 8,
  },

  documentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },

  documentSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: '#6B7280',
  },

  documentRight: {
    alignItems: 'flex-end',
  },

  documentStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#E8F5E9',
  },

  documentStatusText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#2E7D32',
  },

  documentArrow: {
    marginTop: 3,
    fontSize: 20,
    color: '#9CA3AF',
  },

  documentDivider: {
    height: 1,
    backgroundColor: '#EEF0EE',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default ProfileScreen;