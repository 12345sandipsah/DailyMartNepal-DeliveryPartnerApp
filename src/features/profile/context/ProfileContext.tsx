import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';

type ProfileData = {
  fullName: string;
  email: string;
  dateOfBirth: string;
  address: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
};

type ProfileContextValue = {
  profile: ProfileData;
  updateProfile: (data: ProfileData) => void;
};

const INITIAL_PROFILE: ProfileData = {
  fullName: 'Sandip Sah',
  email: 'sandip@example.com',
  dateOfBirth: '15 January 2002',
  address: 'Kathmandu, Nepal',
  emergencyContactName: 'Ram Sah',
  emergencyContactNumber: '+977 98XXXXXXXX',
};

const ProfileContext =
  createContext<ProfileContextValue | undefined>(undefined);

export const ProfileProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [profile, setProfile] =
    useState<ProfileData>(INITIAL_PROFILE);

  const updateProfile = (data: ProfileData) => {
    setProfile(data);
  };

  const value = useMemo(
    () => ({
      profile,
      updateProfile,
    }),
    [profile],
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