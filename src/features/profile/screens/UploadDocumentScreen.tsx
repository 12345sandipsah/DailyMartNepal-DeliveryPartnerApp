
import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';

import type {MainStackParamList} from '../../../app/navigation/MainNavigator';
import {useDocuments} from '../context/DocumentsContext';

type NavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'UploadDocument'
>;

type UploadRouteProp = RouteProp<MainStackParamList, 'UploadDocument'>;

const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

const DOCUMENTS = {
  DL: 'Driving License',
  CID: 'Citizenship / ID',
  VR: 'Vehicle Registration',
  INS: 'Vehicle Insurance',
} as const;

const UploadDocumentScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<UploadRouteProp>();
  const {saveUploadedDocument, getUploadedDocument} = useDocuments();

  // The document ID comes from the screen the user selected.
  const documentId = route.params?.documentId;
  const documentTitle =
    documentId && documentId in DOCUMENTS
      ? DOCUMENTS[documentId as keyof typeof DOCUMENTS]
      : undefined;

  const existingDocument = documentId
    ? getUploadedDocument(documentId)
    : undefined;

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!documentId || !documentTitle) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorTitle}>Document Not Selected</Text>
          <Text style={styles.description}>
            Please return to My Documents and select a document to upload.
          </Text>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleChooseFile = async () => {
    try {
      const results = await pick({
        allowMultiSelection: false,
        type: [types.images, types.pdf],
      });

      const file = results[0];
      if (!file) {
        return;
      }

      const name = file.name?.trim();
      const uri = file.uri?.trim();

      if (!name || !uri) {
        Alert.alert(
          'Invalid File',
          'The selected file has no valid filename or cannot be accessed.',
        );
        return;
      }

      if (
        typeof file.size === 'number' &&
        file.size > MAX_DOCUMENT_SIZE_BYTES
      ) {
        Alert.alert(
          'File Too Large',
          'Choose an image or PDF that is 10 MB or smaller.',
        );
        return;
      }

      const mimeType = file.type?.toLowerCase();
      const hasAllowedExtension =
        /\.(pdf|png|jpe?g|webp|heic|heif)$/i.test(name);
      const hasAllowedMimeType =
        mimeType === 'application/pdf' ||
        Boolean(mimeType?.startsWith('image/'));

      if (!hasAllowedExtension && !hasAllowedMimeType) {
        Alert.alert(
          'Unsupported File',
          'Please select an image or PDF document.',
        );
        return;
      }

      setFileName(name);
      setFileUri(uri);
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return;
      }

      Alert.alert(
        'Unable to Select File',
        'Something went wrong. Please try again.',
      );
    }
  };

  const handleSubmit = () => {
    if (isSubmitting) {
      return;
    }

    if (!fileName?.trim() || !fileUri?.trim()) {
      Alert.alert(
        'No File Selected',
        `Please choose the ${documentTitle} file before submitting.`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      saveUploadedDocument(documentId, fileName, fileUri);

      Alert.alert(
        'Document Submitted',
        `${documentTitle} has been saved and is pending verification.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch {
      Alert.alert(
        'Submission Failed',
        'The document could not be saved. Please try again.',
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

          <Text style={styles.headerTitle}>Upload Document</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <Text style={styles.introIconText}>↑</Text>
            </View>

            <View style={styles.introContent}>
              <Text style={styles.introTitle}>{documentTitle}</Text>
              <Text style={styles.introText}>
                Upload a clear copy of your {documentTitle.toLowerCase()} for
                verification. The selected document cannot be changed here.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{documentTitle}</Text>

            {existingDocument && !fileName ? (
              <View style={styles.existingCard}>
                <Text style={styles.existingTitle}>Currently Uploaded</Text>
                <Text style={styles.existingName}>
                  {existingDocument.fileName}
                </Text>
                <Text style={styles.pendingText}>
                  Status: {existingDocument.status}
                </Text>
                <Text style={styles.description}>
                  Choosing a new file will replace this document after you
                  submit it.
                </Text>
              </View>
            ) : null}

            {!fileName ? (
              <Pressable
                style={styles.uploadBox}
                onPress={handleChooseFile}
                accessibilityRole="button"
                accessibilityLabel={`Choose ${documentTitle} file`}>
                <View style={styles.uploadIcon}>
                  <Text style={styles.uploadIconText}>↑</Text>
                </View>

                <Text style={styles.uploadTitle}>
                  {existingDocument ? 'Choose Replacement File' : 'Choose File'}
                </Text>
                <Text style={styles.description}>
                  Select a clear photo or PDF, up to 10 MB.
                </Text>

                <View style={styles.chooseButton}>
                  <Text style={styles.chooseButtonText}>Browse Files</Text>
                </View>
              </Pressable>
            ) : (
              <View style={styles.selectedFileCard}>
                <View style={styles.selectedFileIcon}>
                  <Text style={styles.selectedFileIconText}>✓</Text>
                </View>

                <View style={styles.selectedFileContent}>
                  <Text style={styles.selectedFileTitle}>File Selected</Text>
                  <Text style={styles.selectedFileName} numberOfLines={2}>
                    {fileName}
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    setFileName(null);
                    setFileUri(null);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Remove selected file">
                  <Text style={styles.removeFileText}>Remove</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Document Requirements</Text>
            {[
              'The document must be clearly visible.',
              'All important details must be readable.',
              'Do not upload a damaged or incomplete document.',
              'The document must belong to the delivery partner.',
            ].map(requirement => (
              <View key={requirement} style={styles.requirementRow}>
                <Text style={styles.requirementBullet}>✓</Text>
                <Text style={styles.requirementText}>{requirement}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={[
              styles.submitButton,
              (!fileName || !fileUri || isSubmitting) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!fileName || !fileUri || isSubmitting}
            accessibilityRole="button">
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                Submit {documentTitle}
              </Text>
            )}
          </Pressable>

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
    paddingHorizontal: 16,
  },
  header: {
    minHeight: 64,
    marginHorizontal: -16,
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
  uploadBox: {
    padding: 22,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8EAD8',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  uploadIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconText: {
    fontSize: 27,
    fontWeight: '700',
    color: '#2E7D32',
  },
  uploadTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  description: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    color: '#6B7280',
  },
  chooseButton: {
    marginTop: 15,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
  },
  chooseButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  existingCard: {
    marginBottom: 12,
    padding: 15,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },
  existingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  existingName: {
    marginTop: 6,
    fontSize: 12,
    color: '#4B5563',
  },
  pendingText: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: '700',
    color: '#A16207',
  },
  selectedFileCard: {
    padding: 15,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8EAD8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedFileIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  selectedFileIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  selectedFileContent: {
    flex: 1,
  },
  selectedFileTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  selectedFileName: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16,
    color: '#6B7280',
  },
  removeFileText: {
    marginLeft: 10,
    fontSize: 11,
    fontWeight: '700',
    color: '#D32F2F',
  },
  requirementsCard: {
    marginTop: 22,
    padding: 16,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },
  requirementsTitle: {
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
  },
  requirementBullet: {
    marginRight: 9,
    color: '#2E7D32',
    fontWeight: '700',
  },
  requirementText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: '#6B7280',
  },
  submitButton: {
    minHeight: 50,
    marginTop: 22,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A5BCA6',
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    marginTop: 18,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  errorTitle: {
    marginTop: 40,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1F2937',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default UploadDocumentScreen;
