import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getPartner,
  Partner,
  setAvailability,
  updatePartnerProfile,
} from '../../../shared/services/api';

export type ProfileData = {
  fullName: string;
  email: string;
  dateOfBirth: string;
  address: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  partnerId: string;
  partnerCode: string;
  phone: string;
  warehouseName: string;
  vehicleType: string;
  vehicleNumber: string;
  availabilityStatus: Partner['availabilityStatus'];
  isActive: boolean;
  createdAt: string;
};

type ProfileFormData = Pick<
  ProfileData,
  | 'fullName'
  | 'email'
  | 'dateOfBirth'
  | 'address'
  | 'emergencyContactName'
  | 'emergencyContactNumber'
>;

type ProfileContextValue = {
  profile: ProfileData;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: ProfileFormData) => Promise<void>;
  updateAvailability: (isOnline: boolean) => Promise<void>;
};

const EMPTY_PROFILE: ProfileData = {
  fullName: '',
  email: '',
  dateOfBirth: '',
  address: '',
  emergencyContactName: '',
  emergencyContactNumber: '',
  partnerId: '',
  partnerCode: '',
  phone: '',
  warehouseName: '',
  vehicleType: '',
  vehicleNumber: '',
  availabilityStatus: 'offline',
  isActive: false,
  createdAt: '',
};

const mapPartnerToProfile = (partner: Partner): ProfileData => ({
  ...EMPTY_PROFILE,
  fullName: partner.name || '',
  email: partner.email || '',
  dateOfBirth: partner.dateOfBirth || '',
  address: partner.address || '',
  emergencyContactName: partner.emergencyContactName || '',
  emergencyContactNumber: partner.emergencyContactNumber || '',
  partnerId: partner._id,
  partnerCode: partner.partnerCode || '',
  phone: partner.phone || '',
  warehouseName: partner.warehouse?.name || '',
  vehicleType: partner.vehicleType || '',
  vehicleNumber: partner.vehicleNumber || '',
  availabilityStatus: partner.availabilityStatus,
  isActive: partner.isActive,
  createdAt: partner.createdAt || '',
});

const ProfileContext =
  createContext<ProfileContextValue | undefined>(undefined);

export const ProfileProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const partner = await getPartner();
      setProfile(mapPartnerToProfile(partner));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile().catch(() => {
      // The screen can still show its unavailable/empty state and retry on focus.
    });
  }, [refreshProfile]);

  const updateProfile = useCallback(async (data: ProfileFormData) => {
    const partner = await updatePartnerProfile({
      name: data.fullName,
      email: data.email,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      emergencyContactName: data.emergencyContactName,
      emergencyContactNumber: data.emergencyContactNumber,
    });
    setProfile(mapPartnerToProfile(partner));
  }, []);

  const updateAvailability = useCallback(async (isOnline: boolean) => {
    const partner = await setAvailability(isOnline);
    setProfile(current => ({
      ...current,
      availabilityStatus: partner.availabilityStatus,
    }));
  }, []);

  const value = useMemo(
    () => ({profile, isLoading, refreshProfile, updateProfile, updateAvailability}),
    [profile, isLoading, refreshProfile, updateProfile, updateAvailability],
  );

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error(
      'useProfile must be used inside ProfileProvider',
    );
  }

  return context;
};
