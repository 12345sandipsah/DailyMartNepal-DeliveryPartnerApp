import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faBell,
  faHouse,
  faTruck,
  faUser,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import type {NavigationProp} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {MainStackParamList} from '../../app/navigation/MainNavigator';

export type PartnerTabRoute =
  | 'Home'
  | 'Deliveries'
  | 'Earnings'
  | 'Notifications'
  | 'Profile';

const TABS: {label: PartnerTabRoute; icon: typeof faHouse}[] = [
  {label: 'Home', icon: faHouse},
  {label: 'Deliveries', icon: faTruck},
  {label: 'Earnings', icon: faWallet},
  {label: 'Notifications', icon: faBell},
  {label: 'Profile', icon: faUser},
];

const PartnerBottomNavigation = ({
  activeRoute,
  showNotificationDot = true,
}: {
  activeRoute: PartnerTabRoute;
  showNotificationDot?: boolean;
}) => {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();

  const navigateTo = (route: PartnerTabRoute) => {
    if (route === activeRoute) return;

    switch (route) {
      case 'Home':
        navigation.navigate('Home');
        break;
      case 'Deliveries':
        navigation.navigate('Deliveries');
        break;
      case 'Earnings':
        navigation.navigate('Earnings');
        break;
      case 'Notifications':
        navigation.navigate('Notifications');
        break;
      case 'Profile':
        navigation.navigate('Profile');
        break;
    }
  };

  return (
    <View style={[styles.container, {paddingBottom: insets.bottom}]}>
      {TABS.map(({label, icon}) => {
        const active = label === activeRoute;

        return (
          <Pressable
            key={label}
            style={styles.tab}
            onPress={() => navigateTo(label)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{selected: active}}>
            <View style={styles.iconWrapper}>
              <FontAwesomeIcon
                icon={icon}
                size={21}
                color={active ? '#079447' : '#697277'}
              />
              {label === 'Notifications' && showNotificationDot ? (
                <View style={styles.notificationDot} />
              ) : null}
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    paddingHorizontal: 4,
    paddingTop: 4,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7EAE8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 29,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    marginTop: 4,
    fontSize: 9,
    lineHeight: 12,
    color: '#697277',
    fontWeight: '600',
  },
  activeLabel: {
    color: '#079447',
    fontWeight: '800',
  },
  notificationDot: {
    position: 'absolute',
    top: -1,
    right: 1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#F04444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});

export default PartnerBottomNavigation;
