import React from 'react';

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import type {
  RouteProp,
} from '@react-navigation/native';

import type {
  MainStackParamList,
} from '../../../app/navigation/MainNavigator';

import {
  useDocuments,
} from '../context/DocumentsContext';

type DocumentDetailsNavigationProp =
  NativeStackNavigationProp<
    MainStackParamList,
    'DocumentDetails'
  >;

type DocumentDetailsRouteProp =
  RouteProp<
    MainStackParamList,
    'DocumentDetails'
  >;

type DocumentDetails = {
  title: string;
  number: string;
  status: string;
  expiry: string;
  documentType: string;
  issuedBy: string;
  description: string;
};

const DOCUMENT_DATA: Record<string, DocumentDetails> = {
  DL: {
    title: 'Driving License',
    number: 'DL-NEP-204581',
    status: 'VERIFIED',
    expiry: '18 December 2028',
    documentType: 'Driving License',
    issuedBy: 'Government of Nepal',
    description:
      'Your driving license has been verified and is currently valid for delivery operations.',
  },

  CID: {
    title: 'Citizenship / ID',
    number: 'ID-NEP-884521',
    status: 'VERIFIED',
    expiry: 'No expiry',
    documentType: 'Citizenship / Identity Document',
    issuedBy: 'Government of Nepal',
    description:
      'Your identity document has been verified by DailyMart Nepal.',
  },

  VR: {
    title: 'Vehicle Registration',
    number: 'BA 12 PA 3456',
    status: 'VERIFIED',
    expiry: '14 August 2028',
    documentType: 'Vehicle Registration',
    issuedBy: 'Government of Nepal',
    description:
      'Your vehicle registration information has been verified.',
  },

  INS: {
    title: 'Vehicle Insurance',
    number: 'INS-NEP-458921',
    status: 'VALID',
    expiry: '18 December 2026',
    documentType: 'Vehicle Insurance',
    issuedBy: 'Nepal Insurance Provider',
    description:
      'Your vehicle insurance is currently valid.',
  },
};

const DocumentDetailsScreen = () => {
  const navigation =
    useNavigation<DocumentDetailsNavigationProp>();

  const route =
    useRoute<DocumentDetailsRouteProp>();

  const {
    getUploadedDocument,
  } = useDocuments();

  const {documentId} = route.params;

  const document = DOCUMENT_DATA[documentId];

  const uploadedDocument =
    getUploadedDocument(documentId);

  const displayedStatus =
    uploadedDocument?.status === 'PENDING'
      ? 'PENDING'
      : document?.status ?? '';

  const handleUploadDocument = () => {
    navigation.navigate('UploadDocument', {
      documentId,
    });
  };

  if (!document) {
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
              Document Details
            </Text>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.notFoundContainer}>
            <View style={styles.notFoundIcon}>
              <Text style={styles.notFoundIconText}>
                ?
              </Text>
            </View>

            <Text style={styles.notFoundTitle}>
              Document Not Found
            </Text>

            <Text style={styles.notFoundText}>
              The selected document could not be found.
            </Text>

            <Pressable
              style={styles.backToDocumentsButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back to documents">
              <Text
                style={styles.backToDocumentsButtonText}>
                Go Back
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
            Document Details
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.documentHeaderCard}>
            <View style={styles.documentIconLarge}>
              <Text style={styles.documentIconText}>
                ▤
              </Text>
            </View>

            <Text style={styles.documentTitle}>
              {document.title}
            </Text>

            <View
              style={[
                styles.statusBadge,
                uploadedDocument?.status === 'PENDING' &&
                  styles.statusBadgePending,
              ]}>
              <Text
                style={[
                  styles.statusBadgeText,
                  uploadedDocument?.status === 'PENDING' &&
                    styles.statusBadgePendingText,
                ]}>
                {displayedStatus}
              </Text>
            </View>

            <Text style={styles.documentNumber}>
              {document.number}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Document Information
            </Text>

            <View style={styles.infoCard}>
              <InfoRow
                label="Document Type"
                value={document.documentType}
              />

              <InfoDivider />

              <InfoRow
                label="Document Number"
                value={document.number}
              />

              <InfoDivider />

              <InfoRow
                label="Issued By"
                value={document.issuedBy}
              />

              <InfoDivider />

              <InfoRow
                label="Expiry"
                value={document.expiry}
              />

              <InfoDivider />

              <InfoRow
                label="Status"
                value={displayedStatus}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Verification
            </Text>

            <View style={styles.verificationCard}>
              <View
                style={[
                  styles.verificationIcon,
                  uploadedDocument?.status === 'PENDING' &&
                    styles.verificationIconPending,
                ]}>
                <Text
                  style={styles.verificationIconText}>
                  {uploadedDocument?.status === 'PENDING'
                    ? '!'
                    : '✓'}
                </Text>
              </View>

              <View style={styles.verificationContent}>
                <Text style={styles.verificationTitle}>
                  {uploadedDocument?.status === 'PENDING'
                    ? 'Pending Verification'
                    : 'Document Status'}
                </Text>

                <Text style={styles.verificationText}>
                  {uploadedDocument?.status === 'PENDING'
                    ? 'Your document file has been uploaded successfully and is waiting for verification.'
                    : document.description}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Document File
            </Text>

            {uploadedDocument ? (
              <View style={styles.uploadedFileCard}>
                <View style={styles.uploadedFileIcon}>
                  <Text
                    style={styles.uploadedFileIconText}>
                    ✓
                  </Text>
                </View>

                <View style={styles.uploadedFileContent}>
                  <Text style={styles.uploadedFileTitle}>
                    Document Uploaded
                  </Text>

                  <Text
                    style={styles.uploadedFileName}
                    numberOfLines={2}>
                    {uploadedDocument.fileName}
                  </Text>

                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>
                      Pending Verification
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.previewCard}>
                <View style={styles.previewIcon}>
                  <Text style={styles.previewIconText}>
                    ▤
                  </Text>
                </View>

                <Text style={styles.previewTitle}>
                  No Document Uploaded
                </Text>

                <Text style={styles.previewText}>
                  The actual document file has not been
                  uploaded yet. Upload a clear copy to
                  submit this document for verification.
                </Text>
              </View>
            )}

            <Pressable
              style={styles.uploadButton}
              onPress={handleUploadDocument}
              accessibilityRole="button"
              accessibilityLabel={
                uploadedDocument
                  ? `Replace ${document.title}`
                  : `Upload ${document.title}`
              }>
              <Text style={styles.uploadButtonText}>
                {uploadedDocument
                  ? 'Replace Document'
                  : 'Upload / Replace Document'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}>
              <Text style={styles.noticeIconText}>
                i
              </Text>
            </View>

            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>
                Document updates
              </Text>

              <Text style={styles.noticeText}>
                Official document replacement or renewal
                may require verification by the DailyMart
                Nepal administration.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

type InfoRowProps = {
  label: string;
  value: string;
};

const InfoRow = ({
  label,
  value,
}: InfoRowProps) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
};

const InfoDivider = () => {
  return <View style={styles.infoDivider} />;
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

  documentHeaderCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    alignItems: 'center',
  },

  documentIconLarge: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  documentIconText: {
    fontSize: 30,
    color: '#1976D2',
  },

  documentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },

  statusBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: '#E8F5E9',
  },

  statusBadgePending: {
    backgroundColor: '#FFF3CD',
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2E7D32',
  },

  statusBadgePendingText: {
    color: '#A16207',
  },

  documentNumber: {
    marginTop: 9,
    fontSize: 12,
    color: '#6B7280',
  },

  section: {
    marginTop: 22,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },

  infoCard: {
    paddingHorizontal: 15,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
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
    color: '#1F2937',
    textAlign: 'right',
  },

  infoDivider: {
    height: 1,
    backgroundColor: '#EEF0EE',
  },

  verificationCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0F7F0',
    borderWidth: 1,
    borderColor: '#D8EAD8',
    flexDirection: 'row',
    alignItems: 'center',
  },

  verificationIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  verificationIconPending: {
    backgroundColor: '#F59E0B',
  },

  verificationIconText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  verificationContent: {
    flex: 1,
  },

  verificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

  verificationText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: '#667066',
  },

  previewCard: {
    minHeight: 180,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  previewIconText: {
    fontSize: 26,
    color: '#1976D2',
  },

  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

  previewText: {
    marginTop: 6,
    maxWidth: 290,
    fontSize: 11,
    lineHeight: 17,
    color: '#6B7280',
    textAlign: 'center',
  },

  uploadedFileCard: {
    minHeight: 120,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    flexDirection: 'row',
    alignItems: 'center',
  },

  uploadedFileIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  uploadedFileIconText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2E7D32',
  },

  uploadedFileContent: {
    flex: 1,
  },

  uploadedFileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

  uploadedFileName: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16,
    color: '#6B7280',
  },

  pendingBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#FFF3CD',
  },

  pendingBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A16207',
  },

  uploadButton: {
    minHeight: 50,
    marginTop: 12,
    borderRadius: 11,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  uploadButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
    fontSize: 11,
    lineHeight: 17,
    color: '#6B7280',
  },

  notFoundContainer: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notFoundIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  notFoundIconText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#D32F2F',
  },

  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  notFoundText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    textAlign: 'center',
  },

  backToDocumentsButton: {
    minHeight: 46,
    minWidth: 130,
    marginTop: 18,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backToDocumentsButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default DocumentDetailsScreen;