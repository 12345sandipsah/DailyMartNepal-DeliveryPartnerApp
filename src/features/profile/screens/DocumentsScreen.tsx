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

type DocumentsNavigationProp =
  NativeStackNavigationProp<
    MainStackParamList,
    'Documents'
  >;

const DOCUMENTS = [
  {
    id: 'DL',
    title: 'Driving License',
    number: 'DL-NEP-204581',
    status: 'VERIFIED',
    statusType: 'verified',
    expiry: 'Valid until 18 Dec 2028',
    description:
      'Your driving license has been verified and is currently valid.',
  },
  {
    id: 'CID',
    title: 'Citizenship / ID',
    number: 'ID-NEP-884521',
    status: 'VERIFIED',
    statusType: 'verified',
    expiry: 'No expiry',
    description:
      'Your identity document has been verified by DailyMart Nepal.',
  },
  {
    id: 'VR',
    title: 'Vehicle Registration',
    number: 'BA 12 PA 3456',
    status: 'VERIFIED',
    statusType: 'verified',
    expiry: 'Valid until 14 Aug 2028',
    description:
      'Your vehicle registration information has been verified.',
  },
  {
    id: 'INS',
    title: 'Vehicle Insurance',
    number: 'INS-NEP-458921',
    status: 'VALID',
    statusType: 'valid',
    expiry: 'Valid until 18 Dec 2026',
    description:
      'Your vehicle insurance is currently valid.',
  },
];

const DocumentsScreen = () => {
  const navigation =
    useNavigation<DocumentsNavigationProp>();

  const handleDocumentPress = (documentId: string) => {
    navigation.navigate('DocumentDetails', {
      documentId,
    });
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
            My Documents
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <Text style={styles.introIconText}>✓</Text>
            </View>

            <View style={styles.introContent}>
              <Text style={styles.introTitle}>
                Document Verification
              </Text>

              <Text style={styles.introText}>
                Keep your delivery partner documents valid and up to
                date. Verified documents may be required for delivery
                operations.
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.summaryCardMargin]}>
              <Text style={styles.summaryValue}>
                4
              </Text>

              <Text style={styles.summaryLabel}>
                Total Documents
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                4
              </Text>

              <Text style={styles.summaryLabel}>
                Verified
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Your Documents
            </Text>

            <Text style={styles.sectionCount}>
              {DOCUMENTS.length} documents
            </Text>
          </View>

          {DOCUMENTS.map(document => (
            <Pressable
              key={document.id}
              style={styles.documentCard}
              onPress={() =>
                handleDocumentPress(document.id)
              }
              accessibilityRole="button"
              accessibilityLabel={`Open ${document.title}`}>
              <View style={styles.documentIcon}>
                <Text style={styles.documentIconText}>
                  ▤
                </Text>
              </View>

              <View style={styles.documentContent}>
                <View style={styles.documentTitleRow}>
                  <Text style={styles.documentTitle}>
                    {document.title}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      document.statusType === 'verified' &&
                        styles.statusBadgeVerified,
                      document.statusType === 'valid' &&
                        styles.statusBadgeValid,
                    ]}>
                    <Text
                      style={[
                        styles.statusBadgeText,
                        document.statusType === 'verified' &&
                          styles.statusBadgeTextVerified,
                        document.statusType === 'valid' &&
                          styles.statusBadgeTextValid,
                      ]}>
                      {document.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.documentNumber}>
                  {document.number}
                </Text>

                <Text style={styles.documentExpiry}>
                  {document.expiry}
                </Text>

                <View style={styles.documentFooter}>
                  <Text style={styles.documentDescription}>
                    {document.description}
                  </Text>

                  <Text style={styles.documentArrow}>
                    ›
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}

          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}>
              <Text style={styles.noticeIconText}>
                i
              </Text>
            </View>

            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>
                Document changes
              </Text>

              <Text style={styles.noticeText}>
                Official documents may require verification or admin
                approval before they become active in the production
                system.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
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

  introCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0F7F0',
    borderWidth: 1,
    borderColor: '#D8EAD8',
    flexDirection: 'row',
  },

  introIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  introIconText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  introContent: {
    flex: 1,
  },

  introTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

  introText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: '#667066',
  },

  summaryRow: {
    flexDirection: 'row',
    marginTop: 18,
  },

  summaryCard: {
    flex: 1,
    minHeight: 82,
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    justifyContent: 'center',
  },

  summaryCardMargin: {
    marginRight: 10,
  },

  summaryValue: {
    fontSize: 23,
    fontWeight: '700',
    color: '#2E7D32',
  },

  summaryLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#6B7280',
  },

  sectionHeader: {
    marginTop: 24,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },

  sectionCount: {
    fontSize: 11,
    color: '#6B7280',
  },

  documentCard: {
    padding: 15,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    flexDirection: 'row',
  },

  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  documentIconText: {
    fontSize: 21,
    color: '#1976D2',
  },

  documentContent: {
    flex: 1,
  },

  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  documentTitle: {
    flex: 1,
    paddingRight: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
  },

  statusBadgeVerified: {
    backgroundColor: '#E8F5E9',
  },

  statusBadgeValid: {
    backgroundColor: '#EEF8EF',
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },

  statusBadgeTextVerified: {
    color: '#2E7D32',
  },

  statusBadgeTextValid: {
    color: '#2E7D32',
  },

  documentNumber: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },

  documentExpiry: {
    marginTop: 4,
    fontSize: 10,
    color: '#6B7280',
  },

  documentFooter: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  documentDescription: {
    flex: 1,
    paddingRight: 8,
    fontSize: 10,
    lineHeight: 16,
    color: '#8A918A',
  },

  documentArrow: {
    fontSize: 23,
    color: '#2E7D32',
  },

  noticeCard: {
    marginTop: 10,
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
    fontSize: 11,
    lineHeight: 17,
    color: '#6B7280',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default DocumentsScreen;