import React from 'react';

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import {
  faArrowRight,
  faChevronDown,
  faGlobe,
  faHeart,
  faLeaf,
  faShieldHalved,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';

import type { AuthStackParamList } from '../../../app/navigation/AuthNavigator';

type WelcomeNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

type FeatureItemProps = {
  icon: typeof faLeaf;

  title: string;

  subtitle: string;
};

const WelcomeScreen = () => {
  const navigation = useNavigation<WelcomeNavigationProp>();

  const { height, width } = useWindowDimensions();

  const isSmallPhone = height < 720;

  const isCompactPhone = height < 850;

  const horizontalPadding = Math.max(16, Math.min(24, width * 0.052));

  const heroHeight = isSmallPhone
    ? 180
    : isCompactPhone
    ? 200
    : Math.min(225, width * 0.62);

  const dynamicStyles = StyleSheet.create({
    scrollContentDynamic: {
      paddingHorizontal: horizontalPadding,
      paddingBottom: isSmallPhone ? 8 : 12,
    },
    logoContainerDynamic: {
      marginTop: isSmallPhone ? 16 : isCompactPhone ? 20 : 26,
    },
    logoTextDynamic: {
      fontSize: isSmallPhone ? 29 : 35,
      lineHeight: isSmallPhone ? 31 : 37,
    },
    roleBadgeDynamic: {
      marginTop: isSmallPhone ? 11 : isCompactPhone ? 13 : 16,
    },
    roleBadgeTextDynamic: { fontSize: isSmallPhone ? 15 : 17 },
    mainTitleFirstDynamic: {
      marginTop: isSmallPhone ? 13 : isCompactPhone ? 15 : 18,
      fontSize: isSmallPhone ? 20 : 23,
      lineHeight: isSmallPhone ? 25 : 29,
    },
    mainTitleSecondDynamic: {
      fontSize: isSmallPhone ? 20 : 23,
      lineHeight: isSmallPhone ? 25 : 29,
    },
    heroAreaDynamic: {
      height: heroHeight,
      marginTop: isSmallPhone ? 9 : isCompactPhone ? 11 : 14,
    },
    riderImageDynamic: {
      transform: [
        { scale: isSmallPhone ? 1.18 : 1.22 },
        { translateY: isSmallPhone ? 14 : 16 },
      ],
    },
    featuresRowDynamic: {
      marginTop: isSmallPhone ? 11 : isCompactPhone ? 13 : 16,
    },
    paginationDynamic: {
      marginTop: isSmallPhone ? 9 : isCompactPhone ? 11 : 14,
    },
    loginButtonDynamic: {
      minHeight: isSmallPhone ? 48 : isCompactPhone ? 50 : 54,
      marginTop: isSmallPhone ? 11 : isCompactPhone ? 13 : 16,
    },
    loginButtonTextDynamic: { fontSize: isSmallPhone ? 14 : 16 },
    footerTextDynamic: {
      marginTop: isSmallPhone ? 9 : isCompactPhone ? 11 : 14,
      fontSize: isSmallPhone ? 12 : 13,
    },
    bottomSpacingDynamic: { height: isSmallPhone ? 3 : 6 },
  });

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            dynamicStyles.scrollContentDynamic,
          ]}
        >
          {/* Language selector */}

          <View style={styles.languageContainer}>
            <Pressable
              style={styles.languageButton}
              accessibilityRole="button"
              accessibilityLabel="Select language"
            >
              <FontAwesomeIcon icon={faGlobe} size={15} color="#087744" />

              <Text style={styles.languageText}>English</Text>

              <FontAwesomeIcon icon={faChevronDown} size={11} color="#087744" />
            </Pressable>
          </View>

          {/* DailyMart branding */}

          <View
            style={[styles.logoContainer, dynamicStyles.logoContainerDynamic]}
          >
            <View>
              <Text style={[styles.logoText, dynamicStyles.logoTextDynamic]}>
                <Text style={styles.logoDaily}>Daily</Text>

                <Text style={styles.logoMart}>Mart</Text>
              </Text>
            </View>
          </View>

          {/* Delivery Partner badge */}

          <View style={[styles.roleBadge, dynamicStyles.roleBadgeDynamic]}>
            <Text
              style={[styles.roleBadgeText, dynamicStyles.roleBadgeTextDynamic]}
            >
              Delivery Partner
            </Text>
          </View>

          {/* Welcome heading */}

          <Text style={[styles.mainTitle, dynamicStyles.mainTitleFirstDynamic]}>
            Delivering Freshness
          </Text>

          <Text
            style={[styles.mainTitle, dynamicStyles.mainTitleSecondDynamic]}
          >
            Across Nepal
          </Text>

          {/* Rider illustration and Nepal scenery */}

          <View style={[styles.heroArea, dynamicStyles.heroAreaDynamic]}>
            <View style={styles.skyGlow} />

            <View style={styles.mountainBack}>
              <View style={styles.mountainOne} />

              <View style={styles.mountainTwo} />

              <View style={styles.mountainThree} />
            </View>

            <View style={styles.cityLine}>
              <View style={styles.cityBuildingSmall} />

              <View style={styles.cityBuildingLarge} />

              <View style={styles.cityBuildingSmall} />

              <View style={styles.cityBuildingMedium} />
            </View>

            <Image
              source={require('../../../assets/rider.png')}
              resizeMode="contain"
              style={[styles.riderImage, dynamicStyles.riderImageDynamic]}
              accessibilityLabel="DailyMart delivery rider"
            />

            <View style={styles.road}>
              <View style={styles.roadLineOne} />

              <View style={styles.roadLineTwo} />

              <View style={styles.roadLineThree} />
            </View>
          </View>

          {/* Features */}

          <View style={[styles.featuresRow, dynamicStyles.featuresRowDynamic]}>
            <FeatureItem
              icon={faLeaf}
              title="Fresh Products"
              subtitle="to Customers"
            />

            <FeatureItem
              icon={faShieldHalved}
              title="Safe & Reliable"
              subtitle="Deliveries"
            />

            <FeatureItem
              icon={faUsers}
              title="Be a Part of"
              subtitle="a Better Nepal"
            />
          </View>

          {/* Pagination indicators */}

          <View style={[styles.pagination, dynamicStyles.paginationDynamic]}>
            <View style={[styles.paginationDot, styles.paginationDotActive]} />

            <View style={styles.paginationDot} />

            <View style={styles.paginationDot} />
          </View>

          {/* Login is the only action button */}

          <Pressable
            style={[styles.loginButton, dynamicStyles.loginButtonDynamic]}
            onPress={handleLogin}
            accessibilityRole="button"
            accessibilityLabel="Login to your account"
          >
            <Text
              style={[
                styles.loginButtonText,
                dynamicStyles.loginButtonTextDynamic,
              ]}
            >
              Login to Your Account
            </Text>

            <FontAwesomeIcon icon={faArrowRight} size={16} color="#14833F" />
          </Pressable>

          {/* Footer */}

          <Text style={[styles.footerText, dynamicStyles.footerTextDynamic]}>
            Together for a Healthier Nepal{' '}
            <FontAwesomeIcon icon={faHeart} size={12} color="#EF4444" />
          </Text>

          <View
            style={[styles.bottomSpacing, dynamicStyles.bottomSpacingDynamic]}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const FeatureItem = ({
  icon,

  title,

  subtitle,
}: FeatureItemProps) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <FontAwesomeIcon icon={icon} size={20} color="#0B7D42" />
    </View>

    <Text style={styles.featureTitle}>{title}</Text>

    <Text style={styles.featureSubtitle}>{subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,

    backgroundColor: '#FFFFFF',
  },

  scrollContent: {
    flexGrow: 1,

    paddingTop: 3,
  },

  languageContainer: {
    alignItems: 'flex-end',
  },

  languageButton: {
    minWidth: 112,

    height: 44,

    paddingHorizontal: 12,

    borderRadius: 23,

    borderWidth: 1.5,

    borderColor: '#C8E4D3',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 7,
  },

  languageText: {
    fontSize: 13,

    fontWeight: '600',

    color: '#1F2937',
  },

  logoContainer: {
    alignItems: 'center',

    flexDirection: 'row',

    justifyContent: 'center',
  },

  logoLeaf: {
    width: 42,

    height: 48,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 2,
  },

  logoText: {
    fontWeight: '800',

    letterSpacing: -1,
  },

  logoDaily: {
    color: '#07553E',
  },

  logoMart: {
    color: '#20B94E',
  },

  logoNepal: {
    textAlign: 'right',

    fontWeight: '600',

    color: '#07553E',
  },

  roleBadge: {
    alignSelf: 'center',

    paddingHorizontal: 22,

    paddingVertical: 8,

    borderRadius: 17,

    backgroundColor: '#DDF2E0',
  },

  roleBadgeText: {
    fontWeight: '800',

    color: '#14833F',
  },

  mainTitle: {
    textAlign: 'center',

    fontWeight: '800',

    color: '#123D34',
  },

  heroArea: {
    width: '100%',

    overflow: 'hidden',

    borderRadius: 22,

    backgroundColor: '#F2FBF3',

    position: 'relative',

    alignItems: 'center',

    justifyContent: 'center',
  },

  skyGlow: {
    position: 'absolute',

    width: '85%',

    height: '85%',

    top: -15,

    alignSelf: 'center',

    borderRadius: 150,

    backgroundColor: '#E4F7E8',
  },

  mountainBack: {
    position: 'absolute',

    left: 0,

    right: 0,

    bottom: 25,

    height: '55%',
  },

  mountainOne: {
    position: 'absolute',

    left: '-8%',

    bottom: 0,

    width: '55%',

    height: '85%',

    backgroundColor: '#D7EEDB',

    borderTopLeftRadius: 90,

    borderTopRightRadius: 90,

    transform: [{ rotate: '25deg' }],
  },

  mountainTwo: {
    position: 'absolute',

    right: '-10%',

    bottom: 0,

    width: '58%',

    height: '95%',

    backgroundColor: '#C7E6CE',

    borderTopLeftRadius: 100,

    borderTopRightRadius: 100,

    transform: [{ rotate: '-25deg' }],
  },

  mountainThree: {
    position: 'absolute',

    left: '34%',

    bottom: 0,

    width: '40%',

    height: '65%',

    backgroundColor: '#EAF7EC',

    borderTopLeftRadius: 80,

    borderTopRightRadius: 80,
  },

  cityLine: {
    position: 'absolute',

    left: 8,

    right: 8,

    bottom: 24,

    height: 50,

    flexDirection: 'row',

    alignItems: 'flex-end',

    justifyContent: 'space-around',

    opacity: 0.8,
  },

  cityBuildingSmall: {
    width: 22,

    height: 28,

    backgroundColor: '#B5DDBE',

    borderTopLeftRadius: 3,

    borderTopRightRadius: 3,
  },

  cityBuildingLarge: {
    width: 30,

    height: 44,

    backgroundColor: '#A7D5B2',

    borderTopLeftRadius: 4,

    borderTopRightRadius: 4,
  },

  cityBuildingMedium: {
    width: 26,

    height: 35,

    backgroundColor: '#B5DDBE',

    borderTopLeftRadius: 3,

    borderTopRightRadius: 3,
  },

  riderImage: {
    position: 'absolute',

    width: '100%',

    height: '100%',

    alignSelf: 'center',
  },

  road: {
    position: 'absolute',

    left: 0,

    right: 0,

    bottom: 0,

    height: 23,

    backgroundColor: '#D6E2D8',

    overflow: 'hidden',

    justifyContent: 'center',
  },

  roadLineOne: {
    position: 'absolute',

    left: '17%',

    width: 30,

    height: 2,

    backgroundColor: '#FFFFFF',
  },

  roadLineTwo: {
    position: 'absolute',

    left: '47%',

    width: 30,

    height: 2,

    backgroundColor: '#FFFFFF',
  },

  roadLineThree: {
    position: 'absolute',

    left: '77%',

    width: 30,

    height: 2,

    backgroundColor: '#FFFFFF',
  },

  featuresRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',
  },

  featureItem: {
    width: '31%',

    alignItems: 'center',
  },

  featureIcon: {
    width: 48,

    height: 48,

    borderRadius: 24,

    backgroundColor: '#E1F6E4',

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 7,
  },

  featureTitle: {
    fontSize: 10,

    lineHeight: 13,

    fontWeight: '700',

    textAlign: 'center',

    color: '#1F2937',
  },

  featureSubtitle: {
    fontSize: 10,

    lineHeight: 13,

    textAlign: 'center',

    color: '#1F2937',
  },

  pagination: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  paginationDot: {
    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: '#D1D5DB',

    marginHorizontal: 5,
  },

  paginationDotActive: {
    width: 10,

    height: 10,

    borderRadius: 5,

    backgroundColor: '#0BA457',
  },

  loginButton: {
    paddingHorizontal: 18,

    borderRadius: 14,

    backgroundColor: '#FFFFFF',

    borderWidth: 1.5,

    borderColor: '#0B8A46',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 10,
  },

  loginButtonText: {
    fontWeight: '800',

    color: '#14833F',
  },

  footerText: {
    textAlign: 'center',

    color: '#1F2937',
  },

  bottomSpacing: {
    height: 6,
  },
});

export default WelcomeScreen;
