import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type UploadedDocument = {
  fileName: string;
  uri: string;
  status: 'PENDING';
  uploadedAt: string;
};

type DocumentsContextValue = {
  uploadedDocuments: Record<
    string,
    UploadedDocument | undefined
  >;

  saveUploadedDocument: (
    documentId: string,
    fileName: string,
    uri: string,
  ) => void;

  removeUploadedDocument: (
    documentId: string,
  ) => void;

  getUploadedDocument: (
    documentId: string,
  ) => UploadedDocument | undefined;
};

const DocumentsContext =
  createContext<DocumentsContextValue | undefined>(
    undefined,
  );

export const DocumentsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [uploadedDocuments, setUploadedDocuments] =
    useState<
      Record<string, UploadedDocument | undefined>
    >({});

  const saveUploadedDocument = useCallback(
    (
      documentId: string,
      fileName: string,
      uri: string,
    ) => {
      setUploadedDocuments(currentDocuments => ({
        ...currentDocuments,
        [documentId]: {
          fileName,
          uri,
          status: 'PENDING',
          uploadedAt: new Date().toISOString(),
        },
      }));
    },
    [],
  );

  const removeUploadedDocument = useCallback(
    (documentId: string) => {
      setUploadedDocuments(currentDocuments => {
        const updatedDocuments = {
          ...currentDocuments,
        };

        delete updatedDocuments[documentId];

        return updatedDocuments;
      });
    },
    [],
  );

  const getUploadedDocument = useCallback(
    (documentId: string) => {
      return uploadedDocuments[documentId];
    },
    [uploadedDocuments],
  );

  const value = useMemo(
    () => ({
      uploadedDocuments,
      saveUploadedDocument,
      removeUploadedDocument,
      getUploadedDocument,
    }),
    [
      uploadedDocuments,
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