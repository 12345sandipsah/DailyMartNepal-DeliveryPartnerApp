import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {
  getPartnerDocuments,
  uploadPartnerDocument,
} from '../../../shared/services/api';
import type {
  PartnerDocument,
  PartnerDocumentType,
} from '../../../shared/services/api';

export type UploadedDocument = Omit<PartnerDocument, 'status'> & {
  uploadedAt: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
};

type UploadFile = {uri: string; name: string; type: string};

type DocumentsContextValue = {
  uploadedDocuments: Record<string, UploadedDocument | undefined>;
  isDocumentsLoaded: boolean;
  documentsError: string;
  refreshDocuments: () => Promise<void>;
  saveUploadedDocument: (documentId: PartnerDocumentType, file: UploadFile) => Promise<void>;
  getUploadedDocument: (documentId: string) => UploadedDocument | undefined;
};

const DocumentsContext = createContext<DocumentsContextValue | undefined>(undefined);

const mapDocument = (document: PartnerDocument): UploadedDocument => ({
  ...document,
  uploadedAt: document.updatedAt,
  status: document.status.toUpperCase() as UploadedDocument['status'],
});

export const DocumentsProvider = ({children}: {children: React.ReactNode}) => {
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, UploadedDocument | undefined>>({});
  const [isDocumentsLoaded, setIsDocumentsLoaded] = useState(false);
  const [documentsError, setDocumentsError] = useState('');

  const refreshDocuments = useCallback(async () => {
    try {
      const documents = await getPartnerDocuments();
      setUploadedDocuments(Object.fromEntries(documents.map(document => [document.documentType, mapDocument(document)])));
      setDocumentsError('');
    } catch (error) {
      setDocumentsError(error instanceof Error ? error.message : 'Unable to load your documents.');
      throw error;
    } finally {
      setIsDocumentsLoaded(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    getPartnerDocuments()
      .then(documents => {
        if (mounted) {
          setUploadedDocuments(Object.fromEntries(documents.map(document => [document.documentType, mapDocument(document)])));
          setDocumentsError('');
        }
      })
      .catch(error => {
        if (mounted) setDocumentsError(error instanceof Error ? error.message : 'Unable to load your documents.');
      })
      .finally(() => {
        if (mounted) setIsDocumentsLoaded(true);
      });
    return () => { mounted = false; };
  }, []);

  const saveUploadedDocument = useCallback(async (documentId: PartnerDocumentType, file: UploadFile) => {
    const uploaded = await uploadPartnerDocument(documentId, file);
    setUploadedDocuments(current => ({...current, [documentId]: mapDocument(uploaded)}));
    setDocumentsError('');
  }, []);

  const getUploadedDocument = useCallback(
    (documentId: string) => uploadedDocuments[documentId],
    [uploadedDocuments],
  );

  const value = useMemo(() => ({
    uploadedDocuments,
    isDocumentsLoaded,
    documentsError,
    refreshDocuments,
    saveUploadedDocument,
    getUploadedDocument,
  }), [uploadedDocuments, isDocumentsLoaded, documentsError, refreshDocuments, saveUploadedDocument, getUploadedDocument]);

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>;
};

export const useDocuments = () => {
  const context = useContext(DocumentsContext);
  if (!context) throw new Error('useDocuments must be used inside DocumentsProvider.');
  return context;
};
