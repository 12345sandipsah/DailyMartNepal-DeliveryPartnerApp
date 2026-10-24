
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UploadedDocument = {
  fileName: string;
  uri: string;
  status: 'PENDING';
  uploadedAt: string;
};

type DocumentsContextValue = {
  uploadedDocuments: Record<string, UploadedDocument | undefined>;
  isDocumentsLoaded: boolean;
  saveUploadedDocument: (
    documentId: string,
    fileName: string,
    uri: string,
  ) => void;
  removeUploadedDocument: (documentId: string) => void;
  getUploadedDocument: (
    documentId: string,
  ) => UploadedDocument | undefined;
};

const STORAGE_KEY = '@dailymart_delivery_uploaded_documents';

const VALID_DOCUMENT_IDS = new Set(['DL', 'CID', 'VR', 'INS']);

const DocumentsContext = createContext<
  DocumentsContextValue | undefined
>(undefined);

const isValidUploadedDocument = (
  value: unknown,
): value is UploadedDocument => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const document = value as Partial<UploadedDocument>;

  return (
    typeof document.fileName === 'string' &&
    document.fileName.trim().length > 0 &&
    typeof document.uri === 'string' &&
    document.uri.trim().length > 0 &&
    document.status === 'PENDING' &&
    typeof document.uploadedAt === 'string' &&
    !Number.isNaN(Date.parse(document.uploadedAt))
  );
};

const sanitizeStoredDocuments = (
  value: unknown,
): Record<string, UploadedDocument | undefined> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const sanitized: Record<string, UploadedDocument | undefined> = {};

  Object.entries(value as Record<string, unknown>).forEach(
    ([documentId, document]) => {
      if (
        VALID_DOCUMENT_IDS.has(documentId) &&
        isValidUploadedDocument(document)
      ) {
        sanitized[documentId] = {
          fileName: document.fileName.trim(),
          uri: document.uri,
          status: 'PENDING',
          uploadedAt: document.uploadedAt,
        };
      }
    },
  );

  return sanitized;
};

export const DocumentsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [uploadedDocuments, setUploadedDocuments] = useState<
    Record<string, UploadedDocument | undefined>
  >({});
  const [isDocumentsLoaded, setIsDocumentsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDocuments = async () => {
      try {
        const storedDocuments = await AsyncStorage.getItem(STORAGE_KEY);

        if (storedDocuments) {
          const parsedDocuments: unknown = JSON.parse(storedDocuments);
          const sanitizedDocuments =
            sanitizeStoredDocuments(parsedDocuments);

          if (isMounted) {
            setUploadedDocuments(sanitizedDocuments);
          }
        }
      } catch (error) {
        console.warn(
          'Failed to load uploaded documents:',
          error,
        );
      } finally {
        if (isMounted) {
          setIsDocumentsLoaded(true);
        }
      }
    };

    void loadDocuments();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isDocumentsLoaded) {
      return;
    }

    const persistDocuments = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(uploadedDocuments),
        );
      } catch (error) {
        console.warn(
          'Failed to save uploaded documents:',
          error,
        );
      }
    };

    void persistDocuments();
  }, [uploadedDocuments, isDocumentsLoaded]);

  const saveUploadedDocument = useCallback(
    (documentId: string, fileName: string, uri: string) => {
      const normalizedFileName = fileName.trim();
      const normalizedUri = uri.trim();

      if (!VALID_DOCUMENT_IDS.has(documentId)) {
        console.warn(
          `Cannot save an unknown document type: ${documentId}`,
        );
        return;
      }

      if (!normalizedFileName || !normalizedUri) {
        console.warn(
          'Cannot save a document without a filename and file URI.',
        );
        return;
      }

      setUploadedDocuments(currentDocuments => ({
        ...currentDocuments,
        [documentId]: {
          fileName: normalizedFileName,
          uri: normalizedUri,
          status: 'PENDING',
          uploadedAt: new Date().toISOString(),
        },
      }));
    },
    [],
  );

  const removeUploadedDocument = useCallback(
    (documentId: string) => {
      if (!VALID_DOCUMENT_IDS.has(documentId)) {
        return;
      }

      setUploadedDocuments(currentDocuments => {
        if (!currentDocuments[documentId]) {
          return currentDocuments;
        }

        const updatedDocuments = {...currentDocuments};
        delete updatedDocuments[documentId];

        return updatedDocuments;
      });
    },
    [],
  );

  const getUploadedDocument = useCallback(
    (documentId: string) => uploadedDocuments[documentId],
    [uploadedDocuments],
  );

  const value = useMemo(
    () => ({
      uploadedDocuments,
      isDocumentsLoaded,
      saveUploadedDocument,
      removeUploadedDocument,
      getUploadedDocument,
    }),
    [
      uploadedDocuments,
      isDocumentsLoaded,
      saveUploadedDocument,
      removeUploadedDocument,
      getUploadedDocument,
    ],
  );

  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentsContext);

  if (!context) {
    throw new Error(
      'useDocuments must be used inside DocumentsProvider',
    );
  }

  return context;
};
