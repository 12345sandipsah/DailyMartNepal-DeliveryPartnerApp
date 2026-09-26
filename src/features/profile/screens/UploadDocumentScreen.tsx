import React, {useState} from 'react';

import {
  Alert,
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

import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';

import type {
  MainStackParamList,
} from '../../../app/navigation/MainNavigator';

import {
  useDocuments,
} from '../context/DocumentsContext';

type UploadDocumentNavigationProp =
  NativeStackNavigationProp<
    MainStackParamList,
    'UploadDocument'
  >;

type UploadDocumentRouteProp =
  RouteProp<
    MainStackParamList,
    'UploadDocument'
  >;

type DocumentType = {
  id: string;
  title: string;
};

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'DL',
    title: 'Driving License',
  },
  {
    id: 'CID',
    title: 'Citizenship / ID',
  },
  {
    id: 'VR',
    title: 'Vehicle Registration',
  },
  {
    id: 'INS',
    title: 'Vehicle Insurance',
  },
];

const UploadDocumentScreen = () => {
  const navigation =
    useNavigation<UploadDocumentNavigationProp>();

  const route =
    useRoute<UploadDocumentRouteProp>();

  const {
    saveUploadedDocument,
  } = useDocuments();

  const initialDocumentId =
    route.params.documentId;

  const [selectedDocument, setSelectedDocument] =
    useState(initialDocumentId);

  const [selectedFileName, setSelectedFileName] =
    useState<string | null>(null);

  const [selectedFileUri, setSelectedFileUri] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const selectedDocumentDetails =
    DOCUMENT_TYPES.find(
      document => document.id === selectedDocument,
    );

  const handleSelectDocument = (
    documentId: string,
  ) => {
    setSelectedDocument(documentId);
    setSelectedFileName(null);
    setSelectedFileUri(null);
  };

  const handleChooseDocument = async () => {
    try {
      const results = await pick({
        allowMultiSelection: false,
        type: [
          types.images,
          types.pdf,
        ],
      });

      const selectedFile = results[0];

      if (!selectedFile) {
        return;
      }

      setSelectedFileName(
        selectedFile.name ?? 'Selected document',
      );

      setSelectedFileUri(selectedFile.uri);
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return;
      }

      Alert.alert(
        'Unable to Select Document',
        'Something went wrong while selecting the document. Please try again.',
        [
          {
            text: 'OK',
          },
        ],
      );
    }
  };

  const handleRemoveDocument = () => {
    setSelectedFileName(null);
    setSelectedFileUri(null);
  };

  const handleSubmit = () => {
    if (!selectedFileName || !selectedFileUri) {
      Alert.alert(
        'No Document Selected',
        'Please select a document before submitting it for verification.',
        [
          {
            text: 'OK',
          },
        ],
      );

      return;
    }

    setIsSubmitting(true);

    try {
      saveUploadedDocument(
        selectedDocument,
        selectedFileName,
        selectedFileUri,
      );

      Alert.alert(
        'Document Submitted',
        `${selectedDocumentDetails?.title ?? 'Document'} has been saved successfully and is now pending verification.`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Submission Failed',
        'The document could not be saved. Please try again.',
        [
          {
            text: 'OK',
          },
        ],
      );
    } finally {
      setIsSubmitting(false);
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

          <Text style={styles.headerTitle}>
            Upload Document
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <Text style={styles.introIconText}>
                ↑
              </Text>
            </View>

            <View style={styles.introContent}>
              <Text style={styles.introTitle}>
                Submit{' '}
                {selectedDocumentDetails?.title ??
                  'Document'}
              </Text>

              <Text style={styles.introText}>
                Select the document type and upload a clear
                copy for verification.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Document Type
            </Text>

            {DOCUMENT_TYPES.map(document => {
              const isSelected =
                selectedDocument === document.id;

              return (
                <Pressable
                  key={document.id}
                  style={[
                    styles.documentTypeCard,
                    isSelected &&
                      styles.documentTypeCardSelected,
                  ]}
                  onPress={() =>
                    handleSelectDocument(
                      document.id,
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${document.title}`}>
                  <View
                    style={[
                      styles.radio,
                      isSelected &&
                        styles.radioSelected,
                    ]}>
                    {isSelected && (
                      <View
                        style={styles.radioInner}
                      />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.documentTypeText,
                      isSelected &&
                        styles.documentTypeTextSelected,
                    ]}>
                    {document.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Document File
            </Text>

            {!selectedFileName ? (
              <Pressable
                style={styles.uploadBox}
                onPress={handleChooseDocument}
                accessibilityRole="button"
                accessibilityLabel="Choose document file">
                <View style={styles.uploadIcon}>
                  <Text style={styles.uploadIconText}>
                    ↑
                  </Text>
                </View>

                <Text style={styles.uploadTitle}>
                  Choose Document
                </Text>

                <Text
                  style={styles.uploadDescription}>
                  Select a clear photo or PDF document.
                </Text>

                <View style={styles.chooseButton}>
                  <Text
                    style={styles.chooseButtonText}>
                    Choose File
                  </Text>
                </View>
              </Pressable>
            ) : (
              <View
                style={styles.selectedFileCard}>
                <View
                  style={styles.selectedFileIcon}>
                  <Text
                    style={styles.selectedFileIconText}>
                    ✓
                  </Text>
                </View>

                <View
                  style={styles.selectedFileContent}>
                  <Text
                    style={styles.selectedFileTitle}>
                    Document Selected
                  </Text>

                  <Text
                    style={styles.selectedFileName}
                    numberOfLines={2}>
                    {selectedFileName}
                  </Text>
                </View>

                <Pressable
                  onPress={handleRemoveDocument}
                  accessibilityRole="button"
                  accessibilityLabel="Remove selected document">
                  <Text
                    style={styles.removeFileText}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.requirementsCard}>
            <Text
              style={styles.requirementsTitle}>
              Document Requirements
            </Text>

            <RequirementRow text="Document must be clearly visible." />

            <RequirementRow text="All important details must be readable." />

            <RequirementRow text="Do not upload a damaged or incomplete document." />

            <RequirementRow text="The document must belong to the delivery partner." />
          </View>

          <Pressable
            style={[
              styles.submitButton,
              (!selectedFileName ||
                !selectedFileUri ||
                isSubmitting) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={
              !selectedFileName ||
              !selectedFileUri ||
              isSubmitting
            }
            accessibilityRole="button"
            accessibilityLabel="Submit document for verification">
            <Text style={styles.submitButtonText}>
              {isSubmitting
                ? 'Submitting...'
                : 'Submit for Verification'}
            </Text>
          </Pressable>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

type RequirementRowProps = {
  text: string;
};

const RequirementRow = ({
  text,
}: RequirementRowProps) => {
  return (
    <View style={styles.requirementRow}>
      <Text style={styles.requirementBullet}>
        ✓
      </Text>

      <Text style={styles.requirementText}>
        {text}
      </Text>
    </View>
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

  section: {
    marginTop: 22,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },

  documentTypeCard: {
    minHeight: 58,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  documentTypeCardSelected: {
    backgroundColor: '#F0F7F0',
    borderColor: '#2E7D32',
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#B5BDB5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  radioSelected: {
    borderColor: '#2E7D32',
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
  },

  documentTypeText: {
    fontSize: 13,
    color: '#4B5563',
  },

  documentTypeTextSelected: {
    fontWeight: '700',
    color: '#2E7D32',
  },

  uploadBox: {
    minHeight: 210,
    padding: 22,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7DED7',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  uploadIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  uploadIconText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#2E7D32',
  },

  uploadTitle: {
    marginTop: 13,
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },

  uploadDescription: {
    marginTop: 5,
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },

  chooseButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: '#2E7D32',
  },

  chooseButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  selectedFileCard: {
    minHeight: 80,
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectedFileIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedFileIconText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E7D32',
  },

  selectedFileContent: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 8,
  },

  selectedFileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },

  selectedFileName: {
    marginTop: 4,
    fontSize: 10,
    color: '#6B7280',
  },

  removeFileText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D32F2F',
  },

  requirementsCard: {
    marginTop: 22,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },

  requirementsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 11,
  },

  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  requirementBullet: {
    width: 19,
    fontSize: 12,
    fontWeight: '800',
    color: '#2E7D32',
  },

  requirementText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: '#6B7280',
  },

  submitButton: {
    minHeight: 50,
    marginTop: 22,
    borderRadius: 11,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonDisabled: {
    backgroundColor: '#A8B5A8',
  },

  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default UploadDocumentScreen;