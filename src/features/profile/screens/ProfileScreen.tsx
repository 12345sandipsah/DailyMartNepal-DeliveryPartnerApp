import React from 'react';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {useFocusEffect, useNavigation} from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

import { useProfile } from '../context/ProfileContext';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  
  faBell,
  faCamera,
  faCircleCheck,
  faChevronRight,
  faStar,
  faBox,
  faCalendarCheck,
  faUser,
  faCar,
  faFileLines,
  faBuildingColumns,
  faWallet,
  faGear,
  faHeadset,
  faCircleInfo,
  faRightFromBracket,
  faHouse,
  faTruck,
} from '@fortawesome/free-solid-svg-icons';

/* ======================================================*

*   TYPES*

*====================================================== */

type ProfileNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Profile'
>;

type MenuItemProps = {
  icon: IconDefinition;

  iconType: 'green' | 'blue' | 'orange' | 'purple' | 'gray' | 'red';

  title: string;

  subtitle: string;

  onPress: () => void;
};

type BottomNavItemProps = {
  label: 'Home' | 'Deliveries' | 'Earnings' | 'Notifications' | 'Profile';

  active: boolean;

  notification?: boolean;

  onPress: () => void;
};

/* ======================================================*

*   COMPONENT*

*====================================================== */

type ProfileScreenProps = {
  onLogout: () => void;
};

const ProfileScreen = ({ onLogout }: ProfileScreenProps) => {
  const navigation = useNavigation<ProfileNavigationProp>();

  const {profile, refreshProfile, updateAvailability} = useProfile();
  const isOnline = profile.availabilityStatus !== 'offline';

  useFocusEffect(
    React.useCallback(() => {
      refreshProfile().catch(error =>
        Alert.alert(
          'Profile unavailable',
          error instanceof Error ? error.message : 'Please retry.',
        ),
      );
    }, [refreshProfile]),
  );

  /* ==================================================*

*     NAVIGATION*

*  =================================================== */

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  const handleGoDeliveries = () => {
    navigation.navigate('Deliveries');
  };

  const handleGoEarnings = () => {
    navigation.navigate('Earnings');
  };

  const handleGoNotifications = () => {
    navigation.navigate('Notifications');
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleDocuments = () => {
    navigation.navigate('Documents');
  };

  const handleEarnings = () => {
    navigation.navigate('Earnings');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleSupport = () => {
    navigation.navigate('Support');
  };

  /* ==================================================*

*     FUTURE ROUTES*

*  =================================================== */

  const handleComingSoon = (title: string) => {
    Alert.alert(
      title,

      `${title} will be connected to the backend and its dedicated screen later.`,
    );
  };

  /* ==================================================*

*     LOGOUT*

*  =================================================== */

  const handleLogout = () => {
    Alert.alert(
      'Logout',

      'Are you sure you want to logout?',

      [
        {
          text: 'Cancel',

          style: 'cancel',
        },

        {
          text: 'Logout',

          style: 'destructive',

          onPress: onLogout,
        },
      ],
    );
  };

  const handleToggleAvailability = async () => {
    try {
      await updateAvailability(!isOnline);
    } catch (error) {
      Alert.alert(
        'Availability not changed',
        error instanceof Error ? error.message : 'Please retry.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* ==========================================*

*            MAIN SCROLL*

*        =========================================== */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ========================================*

*              HEADER*

*          ========================================= */}

          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <View style={styles.brandRow}>
               

                <View>
                  <Text style={styles.brandText}>
                    Daily
                    <Text style={styles.brandGreen}>Mart</Text>
                  </Text>

                  

                  <Text style={styles.partnerText}>Delivery Partner</Text>
                </View>
              </View>
            </View>

            <View style={styles.headerActions}>
              {/* Notification */}

              <Pressable
                style={styles.headerBellButton}
                onPress={handleGoNotifications}
                accessibilityRole="button"
                accessibilityLabel="Open notifications"
              >
                <FontAwesomeIcon icon={faBell} size={21} color="#0B604C" />
                <View style={styles.headerBellDot} />
              </Pressable>

              {/* Profile avatar */}

              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>
                  {getInitials(profile.fullName || 'Delivery Partner')}
                </Text>

                <View style={styles.headerOnlineDot} />
              </View>
            </View>
          </View>

          {/* ========================================*

*              PROFILE SUMMARY*

*          ========================================= */}

          <Pressable
            style={styles.profileCard}
            onPress={handleEditProfile}
            accessibilityRole="button"
            accessibilityLabel="Open profile details"
          >
            <View style={styles.profileAvatarLarge}>
              <Text style={styles.profileAvatarText}>
                {getInitials(profile.fullName || 'Delivery Partner')}
              </Text>

              <View style={styles.cameraBadge}>
                <FontAwesomeIcon icon={faCamera} size={15} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.profileMainInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile.fullName || 'Delivery partner'}
              </Text>

              <Text style={styles.partnerId}>Partner ID: {profile.partnerCode || profile.partnerId || '—'}</Text>

              <View style={styles.verifiedRow}>
                <View style={styles.verifiedCheck}>
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                    size={13}
                    color="#FFFFFF"
                  />
                </View>

                <Text style={styles.verifiedText}>{profile.isActive ? 'Active Partner' : 'Account status unavailable'}</Text>
              </View>
            </View>

            <FontAwesomeIcon icon={faChevronRight} size={16} color="#7B858C" />

            {/* Statistics */}

            <View style={styles.profileStats}>
              <ProfileStat
                icon={faStar}
                iconStyle="star"
                value="—"
                label="Rating"
              />

              <View style={styles.statDivider} />

              <ProfileStat
                icon={faBox}
                iconStyle="green"
                value="—"
                label="Total Deliveries"
              />

              <View style={styles.statDivider} />

              <ProfileStat
                icon={faCalendarCheck}
                iconStyle="green"
                value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
                label="Partner Since"
              />
            </View>
          </Pressable>

          {/* ========================================*

*              ONLINE STATUS*

*          ========================================= */}

          <View style={styles.onlineCard}>
            <View style={styles.onlineIndicatorOuter}>
              <View
                style={
                  isOnline ? styles.onlineIndicator : styles.offlineIndicator
                }
              />
            </View>

            <View style={styles.onlineInfo}>
              <Text
                style={[styles.onlineTitle, !isOnline && styles.offlineTitle]}
              >
                {isOnline ? 'You are Online' : 'You are Offline'}
              </Text>

              <Text style={styles.onlineSubtitle}>
                {isOnline
                  ? 'Ready to receive deliveries'
                  : 'Turn online to receive deliveries'}
              </Text>
            </View>

            <Pressable
              style={[styles.switchTrack, isOnline && styles.switchTrackActive]}
              onPress={handleToggleAvailability}
              accessibilityRole="switch"
              accessibilityState={{
                checked: isOnline,
              }}
              accessibilityLabel="Toggle availability"
            >
              <View
                style={[
                  styles.switchThumb,

                  isOnline && styles.switchThumbActive,
                ]}
              />
            </Pressable>
          </View>

          {/* ========================================*

*              ACCOUNT / PARTNER MENU*

*          ========================================= */}

          <View style={styles.menuCard}>
            <MenuItem
              icon={faUser}
              iconType="green"
              title="Personal Information"
              subtitle="Name, phone, email, address"
              onPress={handleEditProfile}
            />

            <MenuDivider />

            <MenuItem
              icon={faCar}
              iconType="blue"
              title="Vehicle Details"
              subtitle="Vehicle information and documents"
              onPress={() => handleComingSoon('Vehicle Details')}
            />

            <MenuDivider />

            <MenuItem
              icon={faFileLines}
              iconType="orange"
              title="Documents"
              subtitle="License, citizenship, vehicle papers"
              onPress={handleDocuments}
            />

            <MenuDivider />

            <MenuItem
              icon={faBuildingColumns}
              iconType="purple"
              title="Bank & Payment Details"
              subtitle="Bank account for earnings payout"
              onPress={() => handleComingSoon('Bank & Payment Details')}
            />

            <MenuDivider />

            <MenuItem
              icon={faWallet}
              iconType="green"
              title="Earnings & Wallet"
              subtitle="View earnings, transaction history"
              onPress={handleEarnings}
            />
          </View>

          {/* ========================================*

*              APP MENU*

*          ========================================= */}

          <View style={styles.menuCard}>
            <MenuItem
              icon={faGear}
              iconType="gray"
              title="App Settings"
              subtitle="Notifications, language, app preferences"
              onPress={handleSettings}
            />

            <MenuDivider />

            <MenuItem
              icon={faHeadset}
              iconType="blue"
              title="Help & Support"
              subtitle="Get help, contact support"
              onPress={handleSupport}
            />

            <MenuDivider />

            <MenuItem
              icon={faCircleInfo}
              iconType="red"
              title="About App"
              subtitle="Version, terms, privacy policy"
              onPress={() => handleComingSoon('About App')}
            />
          </View>

          {/* ========================================*

*              LOGOUT*

*          ========================================= */}

          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Logout"
          >
            <FontAwesomeIcon
              icon={faRightFromBracket}
              size={21}
              color="#E33144"
            />

            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* ==========================================*

*            BOTTOM NAVIGATION*

*        =========================================== */}

        <View style={styles.bottomNavigation}>
          <BottomNavItem label="Home" active={false} onPress={handleGoHome} />

          <BottomNavItem
            label="Deliveries"
            active={false}
            onPress={handleGoDeliveries}
          />

          <BottomNavItem
            label="Earnings"
            active={false}
            onPress={handleGoEarnings}
          />

          <BottomNavItem
            label="Notifications"
            active={false}
            notification
            onPress={handleGoNotifications}
          />

          <BottomNavItem label="Profile" active={true} onPress={() => {}} />
        </View>
      </View>
    </SafeAreaView>
  );
};

/* ======================================================*

*   INITIALS*

*====================================================== */

const getInitials = (name: string): string => {
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

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/* ======================================================*

*   PROFILE STAT*

*====================================================== */

type ProfileStatProps = {
  icon: IconDefinition;

  iconStyle: 'star' | 'green';

  value: string;

  label: string;
};

const ProfileStat = ({
  icon,

  iconStyle,

  value,

  label,
}: ProfileStatProps) => {
  return (
    <View style={styles.profileStat}>
      <FontAwesomeIcon
        icon={icon}
        size={21}
        color={iconStyle === 'star' ? '#F39A00' : '#149447'}
      />

      <View style={styles.statTextContainer}>
        <Text style={styles.statValue}>{value}</Text>

        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
};

/* ======================================================*

*   MENU ITEM*

*====================================================== */

const MenuItem = ({
  icon,

  iconType,

  title,

  subtitle,

  onPress,
}: MenuItemProps) => {
  return (
    <Pressable
      style={styles.menuItem}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View
        style={[
          styles.menuIconCircle,

          iconType === 'green' && styles.menuIconGreen,

          iconType === 'blue' && styles.menuIconBlue,

          iconType === 'orange' && styles.menuIconOrange,

          iconType === 'purple' && styles.menuIconPurple,

          iconType === 'gray' && styles.menuIconGray,

          iconType === 'red' && styles.menuIconRed,
        ]}
      >
        <FontAwesomeIcon
          icon={icon}
          size={19}
          color={
            iconType === 'green'
              ? '#149447'
              : iconType === 'blue'
              ? '#2279D8'
              : iconType === 'orange'
              ? '#EE8610'
              : iconType === 'purple'
              ? '#6A42D7'
              : iconType === 'gray'
              ? '#60727D'
              : '#E33144'
          }
        />
      </View>

      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>

        <Text style={styles.menuSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <FontAwesomeIcon icon={faChevronRight} size={14} color="#9BA4AA" />
    </Pressable>
  );
};

const MenuDivider = () => {
  return <View style={styles.menuDivider} />;
};

/* ======================================================*

*   BOTTOM NAVIGATION*

*====================================================== */

const BottomNavItem = ({
  label,

  active,

  notification,

  onPress,
}: BottomNavItemProps) => {
  return (
    <Pressable
      style={styles.bottomNavItem}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        selected: active,
      }}
    >
      <View style={styles.bottomIconWrapper}>
        <BottomNavIcon label={label} active={active} />

        {notification && <View style={styles.bottomNotificationDot} />}
      </View>

      <Text
        style={[styles.bottomNavLabel, active && styles.bottomNavLabelActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const BottomNavIcon = ({
  label,
  active,
}: {
  label: BottomNavItemProps['label'];
  active: boolean;
}) => {
  const color = active ? '#079447' : '#697277';
  const icons: Record<BottomNavItemProps['label'], IconDefinition> = {
    Home: faHouse,
    Deliveries: faTruck,
    Earnings: faWallet,
    Notifications: faBell,
    Profile: faUser,
  };

  return <FontAwesomeIcon icon={icons[label]} size={21} color={color} />;
};

/* ======================================================*

*   STYLES*

*====================================================== */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,

    backgroundColor: '#FFFFFF',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,

    paddingTop: 4,

    paddingBottom: 16,
  },

  /* Header */

  header: {
    minHeight: 86,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  brandContainer: {
    flex: 1,
  },

  brandRow: {
    flexDirection: 'row',

    alignItems: 'flex-start',
  },

  leafContainer: {
    width: 38,

    height: 38,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 2,
  },

  leafIcon: {
    fontSize: 29,

    fontWeight: '800',

    color: '#18A84D',

    transform: [{ rotate: '-18deg' }],
  },

  brandText: {
    fontSize: 27,

    lineHeight: 29,

    fontWeight: '800',

    color: '#07553E',
  },

  brandGreen: {
    color: '#20B94E',
  },

  nepalText: {
    alignSelf: 'flex-end',

    marginTop: -2,

    marginRight: 3,

    fontSize: 14,

    lineHeight: 16,

    fontWeight: '700',

    color: '#07553E',
  },

  partnerText: {
    marginTop: 3,

    marginLeft: 4,

    fontSize: 13,

    lineHeight: 17,

    fontWeight: '600',

    color: '#39725D',
  },

  headerActions: {
    flexDirection: 'row',

    alignItems: 'center',

    marginLeft: 8,
  },

  /* Header notification bell */

  headerBellButton: {
    width: 41,

    height: 41,

    alignItems: 'center',

    justifyContent: 'center',

    position: 'relative',

    marginRight: 9,
  },

  headerBellBody: {
    width: 19,

    height: 20,

    borderWidth: 2,

    borderColor: '#0B604C',

    borderTopLeftRadius: 10,

    borderTopRightRadius: 10,

    borderBottomLeftRadius: 4,

    borderBottomRightRadius: 4,
  },

  headerBellBottom: {
    width: 24,

    height: 2,

    borderRadius: 2,

    backgroundColor: '#0B604C',

    marginTop: -1,
  },

  headerBellClapper: {
    width: 6,

    height: 5,

    borderRadius: 3,

    backgroundColor: '#0B604C',

    marginTop: 2,
  },

  headerBellDot: {
    position: 'absolute',

    top: 0,

    right: 0,

    width: 12,

    height: 12,

    borderRadius: 6,

    backgroundColor: '#F04444',

    borderWidth: 2,

    borderColor: '#FFFFFF',
  },

  /* Header avatar */

  headerAvatar: {
    width: 48,

    height: 48,

    borderRadius: 24,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#DCEDE3',

    position: 'relative',
  },

  headerAvatarText: {
    fontSize: 14,

    fontWeight: '800',

    color: '#07553E',
  },

  headerOnlineDot: {
    position: 'absolute',

    right: -1,

    bottom: 0,

    width: 12,

    height: 12,

    borderRadius: 6,

    backgroundColor: '#21B34B',

    borderWidth: 2,

    borderColor: '#FFFFFF',
  },

  /* Profile summary card */

  profileCard: {
    minHeight: 254,

    borderRadius: 20,

    backgroundColor: '#EEF9F1',

    paddingHorizontal: 16,

    paddingTop: 16,

    paddingBottom: 14,

    borderWidth: 1,

    borderColor: '#E1F0E4',

    position: 'relative',
  },

  profileAvatarLarge: {
    position: 'absolute',

    left: 16,

    top: 16,

    width: 94,

    height: 94,

    borderRadius: 47,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#D6E6DC',

    borderWidth: 4,

    borderColor: '#EAF5ED',
  },

  profileAvatarText: {
    fontSize: 29,

    fontWeight: '800',

    color: '#07553E',
  },

  cameraBadge: {
    position: 'absolute',

    right: -3,

    bottom: 3,

    width: 34,

    height: 34,

    borderRadius: 17,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#263238',

    borderWidth: 2,

    borderColor: '#FFFFFF',
  },

  cameraText: {
    color: '#FFFFFF',

    fontSize: 22,

    lineHeight: 22,

    fontWeight: '400',
  },

  profileMainInfo: {
    marginLeft: 110,

    paddingRight: 28,

    minHeight: 96,

    justifyContent: 'center',
  },

  profileName: {
    fontSize: 20,

    lineHeight: 25,

    fontWeight: '800',

    color: '#111827',
  },

  partnerId: {
    marginTop: 4,

    fontSize: 13,

    color: '#75807A',
  },

  verifiedRow: {
    marginTop: 8,

    alignSelf: 'flex-start',

    paddingHorizontal: 8,

    paddingVertical: 5,

    borderRadius: 14,

    backgroundColor: '#DDF5E3',

    flexDirection: 'row',

    alignItems: 'center',
  },

  verifiedCheck: {
    width: 19,

    height: 19,

    borderRadius: 10,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#16A04A',

    marginRight: 5,
  },

  verifiedCheckText: {
    color: '#FFFFFF',

    fontSize: 12,

    fontWeight: '800',
  },

  verifiedText: {
    fontSize: 10,

    fontWeight: '800',

    color: '#188845',
  },

  profileChevronIcon: { position: 'absolute', right: 16, top: 34 },

  profileChevron: {
    position: 'absolute',

    right: 16,

    top: 34,

    fontSize: 31,

    lineHeight: 31,

    color: '#7B858C',

    fontWeight: '300',
  },

  profileStats: {
    position: 'absolute',

    left: 16,

    right: 16,

    bottom: 12,

    height: 74,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-around',
  },

  profileStat: {
    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  statIcon: {
    width: 31,

    fontSize: 25,

    textAlign: 'center',

    marginRight: 6,
  },

  statIconStar: {
    color: '#F39A00',
  },

  statIconGreen: {
    color: '#149447',
  },

  statTextContainer: {
    justifyContent: 'center',
  },

  statValue: {
    fontSize: 17,

    lineHeight: 21,

    fontWeight: '800',

    color: '#111827',
  },

  statLabel: {
    marginTop: 3,

    fontSize: 9,

    lineHeight: 13,

    color: '#6D7670',
  },

  statDivider: {
    width: 1,

    height: 46,

    backgroundColor: '#D8E7DC',
  },

  /* Online status */

  onlineCard: {
    minHeight: 92,

    marginTop: 14,

    borderRadius: 18,

    paddingHorizontal: 15,

    backgroundColor: '#EEF9F1',

    borderWidth: 1,

    borderColor: '#E1F0E4',

    flexDirection: 'row',

    alignItems: 'center',
  },

  onlineIndicatorOuter: {
    width: 58,

    height: 58,

    borderRadius: 29,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#D4F0DA',

    marginRight: 12,
  },

  onlineIndicator: {
    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: '#0BA94E',
  },

  offlineIndicator: {
    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: '#9AA29D',
  },

  onlineInfo: {
    flex: 1,
  },

  onlineTitle: {
    fontSize: 16,

    lineHeight: 21,

    fontWeight: '800',

    color: '#07553E',
  },

  offlineTitle: {
    color: '#4B5563',
  },

  onlineSubtitle: {
    marginTop: 3,

    fontSize: 12,

    lineHeight: 17,

    color: '#67736B',
  },

  switchTrack: {
    width: 76,

    height: 46,

    borderRadius: 23,

    backgroundColor: '#C8D0CB',

    paddingHorizontal: 4,

    justifyContent: 'center',
  },

  switchTrackActive: {
    backgroundColor: '#079741',
  },

  switchThumb: {
    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: '#FFFFFF',

    alignSelf: 'flex-start',
  },

  switchThumbActive: {
    alignSelf: 'flex-end',
  },

  /* Menu cards */

  menuCard: {
    marginTop: 14,

    borderRadius: 18,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E8ECE9',

    paddingHorizontal: 14,

    shadowColor: '#000000',

    shadowOpacity: 0.035,

    shadowRadius: 8,

    shadowOffset: {
      width: 0,

      height: 3,
    },

    elevation: 2,
  },

  menuItem: {
    minHeight: 72,

    flexDirection: 'row',

    alignItems: 'center',
  },

  menuIconCircle: {
    width: 46,

    height: 46,

    borderRadius: 23,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 12,
  },

  menuIconGreen: {
    backgroundColor: '#E0F4E5',
  },

  menuIconBlue: {
    backgroundColor: '#E2F0FF',
  },

  menuIconOrange: {
    backgroundColor: '#FFF0DE',
  },

  menuIconPurple: {
    backgroundColor: '#EEE6FF',
  },

  menuIconGray: {
    backgroundColor: '#E9EEF0',
  },

  menuIconRed: {
    backgroundColor: '#FFE2E4',
  },

  menuIconText: {
    fontSize: 20,

    fontWeight: '800',
  },

  menuTextGreen: {
    color: '#149447',
  },

  menuTextBlue: {
    color: '#2279D8',
  },

  menuTextOrange: {
    color: '#EE8610',
  },

  menuTextPurple: {
    color: '#6A42D7',
  },

  menuTextGray: {
    color: '#60727D',
  },

  menuTextRed: {
    color: '#E33144',
  },

  menuContent: {
    flex: 1,

    paddingRight: 8,
  },

  menuTitle: {
    fontSize: 13,

    lineHeight: 18,

    fontWeight: '800',

    color: '#1F2937',
  },

  menuSubtitle: {
    marginTop: 3,

    fontSize: 10,

    lineHeight: 15,

    color: '#76808A',
  },

  menuChevron: {
    width: 20,

    fontSize: 29,

    lineHeight: 30,

    fontWeight: '300',

    textAlign: 'right',

    color: '#9BA4AA',
  },

  menuDivider: {
    height: 1,

    backgroundColor: '#EEF1EF',
  },

  /* Logout */

  logoutButton: {
    height: 70,

    marginTop: 14,

    borderRadius: 17,

    backgroundColor: '#FFF0F1',

    borderWidth: 1,

    borderColor: '#FFE0E3',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  logoutIcon: {
    marginRight: 10,

    fontSize: 28,

    lineHeight: 29,

    color: '#E33144',

    fontWeight: '600',
  },

  logoutText: {
    fontSize: 16,

    fontWeight: '800',

    color: '#E33144',
  },

  bottomSpacing: {
    height: 10,
  },

  /* Bottom navigation */

  bottomNavigation: {
    height: 74,

    paddingHorizontal: 4,

    paddingTop: 4,

    paddingBottom: 4,

    backgroundColor: '#FFFFFF',

    borderTopWidth: 1,

    borderTopColor: '#E7EAE8',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-around',
  },

  bottomNavItem: {
    flex: 1,

    height: 64,

    alignItems: 'center',

    justifyContent: 'center',
  },

  bottomIconWrapper: {
    width: 29,

    height: 28,

    alignItems: 'center',

    justifyContent: 'center',

    position: 'relative',
  },

  bottomNavLabel: {
    marginTop: 4,

    fontSize: 9,

    lineHeight: 12,

    color: '#697277',

    fontWeight: '600',
  },

  bottomNavLabelActive: {
    color: '#079447',

    fontWeight: '800',
  },

  bottomNotificationDot: {
    position: 'absolute',

    top: -1,

    right: 1,

    width: 9,

    height: 9,

    borderRadius: 5,

    backgroundColor: '#F04444',

    borderWidth: 1.5,

    borderColor: '#FFFFFF',
  },

  /* Home bottom icon */

  navHome: {
    width: 25,

    height: 25,

    alignItems: 'center',

    justifyContent: 'flex-end',
  },

  navHomeRoof: {
    position: 'absolute',

    top: 2,

    width: 17,

    height: 17,

    borderTopWidth: 2,

    borderLeftWidth: 2,

    transform: [{ rotate: '45deg' }],
  },

  navHomeBody: {
    width: 19,

    height: 16,

    borderWidth: 2,

    borderTopWidth: 0,

    alignItems: 'center',

    justifyContent: 'flex-end',
  },

  navHomeDoor: {
    width: 5,

    height: 8,

    borderTopLeftRadius: 2,

    borderTopRightRadius: 2,
  },

  /* Deliveries bottom icon */

  navBox: {
    width: 21,

    height: 21,

    borderWidth: 2,

    borderRadius: 2,

    position: 'relative',
  },

  navBoxLine: {
    position: 'absolute',

    left: 2,

    right: 2,

    top: 7,

    height: 2,
  },

  /* Earnings bottom icon */

  navWallet: {
    width: 23,

    height: 17,

    borderWidth: 2,

    borderRadius: 4,

    position: 'relative',
  },

  navWalletPocket: {
    position: 'absolute',

    right: -2,

    top: 4,

    width: 9,

    height: 7,

    borderWidth: 2,

    borderRadius: 3,
  },

  navWalletDot: {
    position: 'absolute',

    right: 2,

    top: 6,

    width: 3,

    height: 3,

    borderRadius: 2,
  },

  /* Notifications bottom icon */

  navBell: {
    width: 23,

    height: 25,

    alignItems: 'center',

    justifyContent: 'flex-end',
  },

  navBellBody: {
    width: 18,

    height: 17,

    borderWidth: 2,

    borderTopLeftRadius: 10,

    borderTopRightRadius: 10,

    borderBottomLeftRadius: 4,

    borderBottomRightRadius: 4,
  },

  navBellBottom: {
    width: 22,

    height: 2,

    borderRadius: 2,

    marginTop: -1,
  },

  navBellClapper: {
    width: 5,

    height: 4,

    borderRadius: 2,

    marginTop: 2,
  },

  /* Profile bottom icon */

  navProfile: {
    width: 24,

    height: 25,

    alignItems: 'center',

    justifyContent: 'flex-end',
  },

  navProfileHead: {
    width: 9,

    height: 9,

    borderRadius: 5,

    borderWidth: 2,
  },

  navProfileBody: {
    width: 20,

    height: 11,

    marginTop: 3,

    borderWidth: 2,

    borderTopLeftRadius: 10,

    borderTopRightRadius: 10,

    borderBottomWidth: 0,
  },
});

export default ProfileScreen;
