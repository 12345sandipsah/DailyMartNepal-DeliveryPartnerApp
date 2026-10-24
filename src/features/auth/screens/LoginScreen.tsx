import React, { useState } from 'react';
import {loginPartner} from '../../../shared/services/api';

import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';

import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';

import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';

import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';

import { faEye } from '@fortawesome/free-solid-svg-icons/faEye';

import { faEyeSlash } from '@fortawesome/free-solid-svg-icons/faEyeSlash';

import { faGlobe } from '@fortawesome/free-solid-svg-icons/faGlobe';

import { faLeaf } from '@fortawesome/free-solid-svg-icons/faLeaf';

import { faLock } from '@fortawesome/free-solid-svg-icons/faLock';

import type { AuthStackParamList } from '../../../app/navigation/AuthNavigator';

type LoginScreenProps = {
  onAuthenticated?: () => void;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

/**

 * Accepts a 10-digit Nepali mobile number.

 * An optional 977 or +977 country prefix is supported.

 * Spaces, parentheses, and hyphens are ignored.

 */

function isValidNepalMobileNumber(value: string): boolean {
  const localPhone = value.replace(/[\s()-]/g, '');
  return /^9\d{9}$/.test(localPhone);
}

function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [phone, setPhone] = useState('');

  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  const [phoneError, setPhoneError] = useState('');

  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
  /**
   * Frontend validation only.
   * Real credential verification must be performed by the backend.
   */

  const handleLogin = async () => {
    const nextPhoneError = !phone.trim()
      ? 'Mobile number is required.'
      : !isValidNepalMobileNumber(phone)
      ? 'Enter a valid 10-digit Nepali mobile number.'
      : '';

    const nextPasswordError =
      password.trim().length === 0 ? 'Password is required.' : '';

    setPhoneError(nextPhoneError);
    setPasswordError(nextPasswordError);
    setLoginError('');

    if (nextPhoneError || nextPasswordError) return;

    setIsSubmitting(true);
    try {
      await loginPartner(phone, password);
      onAuthenticated?.();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    // Forgot Password screen will be added later.*
  };

  const handleRegister = () => {
    // Registration screen will be added later.*
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* TOP BAR */}

          <View style={styles.topBar}>
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <FontAwesomeIcon icon={faArrowLeft} size={20} color="#1F2937" />
            </Pressable>

            <Pressable
              style={styles.languageButton}
              accessibilityRole="button"
              accessibilityLabel="Select language"
            >
              <FontAwesomeIcon
                icon={faGlobe}
                size={15}
                color="#087744"
                style={styles.languageIcon}
              />

              <Text style={styles.languageText}>English</Text>

              <FontAwesomeIcon
                icon={faChevronDown}
                size={11}
                color="#087744"
                style={styles.languageArrow}
              />
            </Pressable>
          </View>

          {/* BRAND */}

          <View style={styles.brandContainer}>
            <View style={styles.brandRow}>
              <View style={styles.logoLeaf}>
                <FontAwesomeIcon
                  icon={faLeaf}
                  size={32}
                  color="#21B34B"
                  style={styles.logoLeafIcon}
                />
              </View>

              <View>
                <Text style={styles.logoText}>
                  <Text style={styles.logoDaily}>Daily</Text>

                  <Text style={styles.logoMart}>Mart</Text>
                </Text>

                
              </View>
            </View>

            <View style={styles.partnerBadge}>
              <Text style={styles.partnerBadgeText}>Delivery Partner</Text>
            </View>
          </View>

          {/* TITLE */}

          <View style={styles.titleSection}>
            <Text style={styles.title}>Login to Your Account</Text>

            <Text style={styles.subtitle}>
              Continue to manage your deliveries
            </Text>
          </View>

          {/* HERO ILLUSTRATION */}

          <View style={styles.heroContainer}>
            <View style={styles.heroBackground} />

            <View style={styles.heroGlow} />

            {/* Clouds */}

            <View style={[styles.cloud, styles.cloudLeft]}>
              <View style={styles.cloudOne} />

              <View style={styles.cloudTwo} />

              <View style={styles.cloudThree} />
            </View>

            <View style={[styles.cloud, styles.cloudRight]}>
              <View style={styles.cloudOne} />

              <View style={styles.cloudTwo} />

              <View style={styles.cloudThree} />
            </View>

            {/* Mountains */}

            <View style={styles.mountainLayer}>
              <View style={styles.mountainBackOne} />

              <View style={styles.mountainBackTwo} />

              <View style={styles.mountainFront} />

              <View style={styles.snowCapOne} />

              <View style={styles.snowCapTwo} />
            </View>

            {/* City and temples */}

            <View style={styles.cityLayer}>
              <View style={[styles.temple, styles.templeLeft]}>
                <View style={styles.templeRoofOne} />

                <View style={styles.templeRoofTwo} />

                <View style={styles.templeBody} />
              </View>

              <View style={[styles.temple, styles.templeRight]}>
                <View style={styles.templeRoofOne} />

                <View style={styles.templeRoofTwo} />

                <View style={styles.templeBody} />
              </View>

              <View style={styles.buildingOne} />

              <View style={styles.buildingTwo} />

              <View style={styles.buildingThree} />
            </View>

            {/* Greenery */}

            <View style={styles.heroGreenery}>
              <View style={styles.greenBlobOne} />

              <View style={styles.greenBlobTwo} />

              <View style={styles.greenBlobThree} />

              <View style={styles.greenBlobFour} />
            </View>

            {/* Road */}

            <View style={styles.heroRoad}>
              <View style={styles.heroRoadLineOne} />

              <View style={styles.heroRoadLineTwo} />
            </View>

            {/* Existing rider image */}

            <Image
              source={require('../../../assets/rider2.png')}
              resizeMode="contain"
              style={styles.riderImage}
              accessibilityLabel="DailyMart delivery partner illustration"
            />
          </View>

          {/* LOGIN FORM */}

          <View style={styles.formCard}>
            {/* MOBILE NUMBER */}
            <Text style={styles.fieldLabelOutside}>Mobile Number</Text>
            <View
              style={[styles.field, phoneError ? styles.fieldError : undefined]}
            >
              <View style={styles.countryPrefixContainer}>
                <Text
                  style={styles.countryFlag}
                  accessibilityLabel="Nepal flag"
                >
                  🇳🇵
                </Text>
                <Text style={styles.countryCode}>+977</Text>
                <View style={styles.countryPrefixDivider} />
              </View>
              <View style={styles.fieldContent}>
                <TextInput
                  value={phone}
                  onChangeText={value => {
                    setPhone(value.replace(/[^0-9]/g, '').slice(0, 10));
                    setPhoneError('');
                  }}
                  placeholder="98XXXXXXXX"
                  placeholderTextColor="#7A8084"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={10}
                  style={styles.input}
                  accessibilityLabel="Nepali mobile number"
                  accessibilityHint="Enter your 10-digit Nepali mobile number. Country code +977 is already selected."
                  returnKeyType="next"
                />
              </View>
            </View>
            {phoneError ? (
              <Text style={styles.errorText} accessibilityLiveRegion="polite">
                {phoneError}
              </Text>
            ) : null}

            {/* PASSWORD */}
            <Text style={styles.fieldLabelOutside}>Password</Text>

            <View
              style={[
                styles.field,

                styles.passwordField,

                passwordError ? styles.fieldError : undefined,
              ]}
            >
              <View style={styles.fieldIconContainer}>
                <FontAwesomeIcon icon={faLock} size={19} color="#697277" />
              </View>

              <View style={styles.fieldContent}>
                <TextInput
                  value={password}
                  onChangeText={value => {
                    setPassword(value);

                    setPasswordError('');
                  }}
                  placeholder=""
                  placeholderTextColor="#7A8084"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  accessibilityLabel="Password"
                  returnKeyType="default"
                />
              </View>

              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(previous => !previous)}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? 'Hide password' : 'Show password'
                }
                accessibilityState={{
                  selected: showPassword,
                }}
              >
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  size={20}
                  color="#5F676C"
                />
              </Pressable>
            </View>

            {passwordError ? (
              <Text style={styles.errorText} accessibilityLiveRegion="polite">
                {passwordError}
              </Text>
            ) : null}

            {loginError ? (
              <Text style={styles.errorText} accessibilityLiveRegion="polite">{loginError}</Text>
            ) : null}

            {/* REMEMBER ME / FORGOT PASSWORD */}

            <View style={styles.optionsRow}>
              <Pressable
                style={styles.rememberContainer}
                onPress={() => setRememberMe(previous => !previous)}
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: rememberMe,
                }}
              >
                <View
                  style={[
                    styles.checkbox,

                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe ? (
                    <FontAwesomeIcon icon={faCheck} size={13} color="#FFFFFF" />
                  ) : null}
                </View>

                <Text style={styles.rememberText}>Remember me</Text>
              </Pressable>

              <Pressable
                onPress={handleForgotPassword}
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
              >
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </Pressable>
            </View>

            {/* LOGIN BUTTON */}

            <Pressable
              style={[styles.loginButton, isSubmitting && {opacity: 0.65}]}
              onPress={handleLogin}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Login"
            >
              <Text style={styles.loginButtonText}>{isSubmitting ? 'Signing in...' : 'Login'}</Text>

              <FontAwesomeIcon
                icon={faArrowRight}
                size={20}
                color="#FFFFFF"
                style={styles.loginArrowIcon}
              />
            </Pressable>

            {/* REGISTRATION */}

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>New here? </Text>

              <Pressable
                onPress={handleRegister}
                accessibilityRole="button"
                accessibilityLabel="Register as Delivery Partner"
              >
                <Text style={styles.registerLink}>
                  Register as Delivery Partner
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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

    paddingHorizontal: 18,

    paddingTop: 4,

    paddingBottom: 18,
  },

  topBar: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  backButton: {
    width: 42,

    height: 42,

    alignItems: 'center',

    justifyContent: 'center',
  },

  languageButton: {
    minWidth: 112,

    height: 42,

    paddingHorizontal: 12,

    borderRadius: 22,

    borderWidth: 1.5,

    borderColor: '#C8E4D3',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  languageIcon: {
    marginRight: 6,
  },

  languageText: {
    fontSize: 13,

    fontWeight: '600',

    color: '#1F2937',
  },

  languageArrow: {
    marginLeft: 6,
  },

  brandContainer: {
    alignItems: 'center',

    marginTop: 16,
  },

  brandRow: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  logoLeaf: {
    width: 38,

    height: 46,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 2,
  },

  logoLeafIcon: {
    transform: [{ rotate: '-16deg' }],
  },

  logoText: {
    fontSize: 33,

    lineHeight: 37,

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
    fontSize: 17,

    textAlign: 'right',

    fontWeight: '600',

    color: '#07553E',
  },

  partnerBadge: {
    marginTop: 8,

    paddingHorizontal: 21,

    paddingVertical: 7,

    borderRadius: 17,

    backgroundColor: '#DDF2E0',
  },

  partnerBadgeText: {
    fontSize: 16,

    fontWeight: '800',

    color: '#14833F',
  },

  titleSection: {
    alignItems: 'center',

    marginTop: 17,
  },

  title: {
    fontSize: 29,

    lineHeight: 35,

    textAlign: 'center',

    color: '#123D34',

    fontWeight: '800',
  },

  subtitle: {
    marginTop: 5,

    fontSize: 16,

    textAlign: 'center',

    color: '#727A7E',

    fontWeight: '500',
  },

  heroContainer: {
    width: '100%',

    height: 215,

    marginTop: 13,

    overflow: 'hidden',

    borderRadius: 22,

    position: 'relative',

    backgroundColor: '#EFFAF1',
  },

  heroBackground: {
    position: 'absolute',

    left: 0,

    right: 0,

    top: 0,

    bottom: 0,

    backgroundColor: '#ECF9EE',
  },

  heroGlow: {
    position: 'absolute',

    width: '75%',

    height: 90,

    left: '12.5%',

    top: -25,

    borderRadius: 60,

    backgroundColor: '#F8FFF9',
  },

  cloud: {
    position: 'absolute',

    width: 66,

    height: 25,

    zIndex: 1,
  },

  cloudLeft: {
    left: 5,

    top: 25,
  },

  cloudRight: {
    right: 6,

    top: 36,

    transform: [{ scale: 0.8 }],
  },

  cloudOne: {
    position: 'absolute',

    width: 30,

    height: 16,

    borderRadius: 20,

    backgroundColor: '#FFFFFF',

    left: 0,

    bottom: 0,
  },

  cloudTwo: {
    position: 'absolute',

    width: 25,

    height: 21,

    borderRadius: 20,

    backgroundColor: '#FFFFFF',

    left: 19,

    bottom: 2,
  },

  cloudThree: {
    position: 'absolute',

    width: 34,

    height: 15,

    borderRadius: 20,

    backgroundColor: '#FFFFFF',

    right: 0,

    bottom: 0,
  },

  mountainLayer: {
    position: 'absolute',

    left: 0,

    right: 0,

    top: '25%',

    height: '42%',
  },

  mountainBackOne: {
    position: 'absolute',

    width: 115,

    height: 82,

    left: -12,

    bottom: 4,

    backgroundColor: '#C6E4CB',

    borderRadius: 18,

    transform: [{ rotate: '45deg' }],
  },

  mountainBackTwo: {
    position: 'absolute',

    width: 135,

    height: 97,

    left: '37%',

    bottom: 3,

    backgroundColor: '#D6EED9',

    borderRadius: 20,

    transform: [{ rotate: '45deg' }],
  },

  mountainFront: {
    position: 'absolute',

    width: 116,

    height: 84,

    right: -12,

    bottom: 3,

    backgroundColor: '#BEDDC4',

    borderRadius: 18,

    transform: [{ rotate: '45deg' }],
  },

  snowCapOne: {
    position: 'absolute',

    width: 30,

    height: 20,

    left: '47%',

    top: 9,

    backgroundColor: '#FFFFFF',

    transform: [{ rotate: '45deg' }],

    opacity: 0.9,
  },

  snowCapTwo: {
    position: 'absolute',

    width: 23,

    height: 16,

    right: '20%',

    top: 25,

    backgroundColor: '#FFFFFF',

    transform: [{ rotate: '45deg' }],

    opacity: 0.82,
  },

  cityLayer: {
    position: 'absolute',

    left: 0,

    right: 0,

    bottom: '23%',

    height: '31%',

    zIndex: 2,
  },

  temple: {
    position: 'absolute',

    bottom: 0,

    alignItems: 'center',
  },

  templeLeft: {
    left: 12,

    width: 55,

    height: 74,
  },

  templeRight: {
    right: 75,

    width: 42,

    height: 56,

    opacity: 0.72,
  },

  templeRoofOne: {
    position: 'absolute',

    top: 0,

    width: 47,

    height: 15,

    backgroundColor: '#9BC8A1',

    transform: [{ rotate: '45deg' }],

    borderRadius: 4,
  },

  templeRoofTwo: {
    position: 'absolute',

    top: 13,

    width: 37,

    height: 13,

    backgroundColor: '#A7D1AC',

    transform: [{ rotate: '45deg' }],

    borderRadius: 4,
  },

  templeBody: {
    position: 'absolute',

    bottom: 0,

    width: 23,

    height: 40,

    backgroundColor: '#A4CCA9',
  },

  buildingOne: {
    position: 'absolute',

    right: '9%',

    bottom: 0,

    width: 22,

    height: 43,

    backgroundColor: '#B9D8BD',
  },

  buildingTwo: {
    position: 'absolute',

    right: '3%',

    bottom: 0,

    width: 17,

    height: 32,

    backgroundColor: '#C3DEC7',
  },

  buildingThree: {
    position: 'absolute',

    right: '16%',

    bottom: 0,

    width: 18,

    height: 35,

    backgroundColor: '#B4D5B9',
  },

  heroGreenery: {
    position: 'absolute',

    left: -5,

    right: -5,

    bottom: '11%',

    height: '25%',

    zIndex: 3,
  },

  greenBlobOne: {
    position: 'absolute',

    left: -6,

    bottom: 0,

    width: 76,

    height: 56,

    borderRadius: 40,

    backgroundColor: '#78BC80',
  },

  greenBlobTwo: {
    position: 'absolute',

    left: '15%',

    bottom: 0,

    width: 66,

    height: 49,

    borderRadius: 40,

    backgroundColor: '#6EB477',
  },

  greenBlobThree: {
    position: 'absolute',

    right: '14%',

    bottom: 0,

    width: 67,

    height: 51,

    borderRadius: 40,

    backgroundColor: '#73B97B',
  },

  greenBlobFour: {
    position: 'absolute',

    right: -8,

    bottom: 0,

    width: 78,

    height: 59,

    borderRadius: 40,

    backgroundColor: '#68B172',
  },

  heroRoad: {
    position: 'absolute',

    left: -10,

    right: -10,

    bottom: -9,

    height: '24%',

    backgroundColor: '#DDE4DF',

    zIndex: 4,
  },

  heroRoadLineOne: {
    position: 'absolute',

    left: '8%',

    top: '49%',

    width: 48,

    height: 3,

    borderRadius: 2,

    backgroundColor: '#FFFFFF',
  },

  heroRoadLineTwo: {
    position: 'absolute',

    right: '7%',

    top: '43%',

    width: 52,

    height: 3,

    borderRadius: 2,

    backgroundColor: '#FFFFFF',
  },

  riderImage: {
    position: 'absolute',

    alignSelf: 'center',

    width: '90%',

    height: '96%',

    bottom: 0,

    zIndex: 10,
  },

  formCard: {
    marginTop: -8,

    paddingHorizontal: 18,

    paddingTop: 18,

    paddingBottom: 18,

    backgroundColor: '#FFFFFF',

    borderRadius: 28,

    zIndex: 20,

    shadowColor: '#6D7770',

    shadowOffset: {
      width: 0,

      height: -2,
    },

    shadowOpacity: 0.07,

    shadowRadius: 12,

    elevation: 4,
  },

  field: {
    minHeight: 78,

    borderWidth: 1.5,

    borderColor: '#DFE4E1',

    borderRadius: 17,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 13,

    backgroundColor: '#FFFFFF',
  },

  fieldError: {
    borderColor: '#C62828',
  },

  errorText: {
    color: '#C62828',

    fontSize: 12,

    lineHeight: 17,

    marginTop: 5,

    marginLeft: 6,
  },

  passwordField: {
    marginTop: 14,
  },

  fieldLabelOutside: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 7,
    marginLeft: 4,
  },
  countryPrefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  countryFlag: {
    fontSize: 21,
    marginRight: 7,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  countryPrefixDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#D1D5DB',
    marginLeft: 12,
  },
  fieldIconContainer: {
    width: 38,

    alignItems: 'center',

    justifyContent: 'center',
  },

  fieldContent: {
    flex: 1,

    justifyContent: 'center',

    marginLeft: 6,
  },

  input: {
    padding: 0,

    margin: 0,

    fontSize: 17,

    color: '#202528',

    fontWeight: '500',

    minHeight: 26,
  },

  eyeButton: {
    width: 38,

    height: 44,

    alignItems: 'center',

    justifyContent: 'center',
  },

  optionsRow: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginTop: 16,

    marginBottom: 18,
  },

  rememberContainer: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  checkbox: {
    width: 24,

    height: 24,

    borderRadius: 6,

    borderWidth: 1.5,

    borderColor: '#C6CECA',

    alignItems: 'center',

    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: '#0BA457',

    borderColor: '#0BA457',
  },

  rememberText: {
    marginLeft: 8,

    fontSize: 14,

    color: '#697176',

    fontWeight: '500',
  },

  forgotPassword: {
    fontSize: 14,

    color: '#168344',

    fontWeight: '700',
  },

  loginButton: {
    minHeight: 54,

    borderRadius: 15,

    backgroundColor: '#0BA457',

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 17,
  },

  loginButtonText: {
    flex: 1,

    textAlign: 'center',

    marginLeft: 25,

    color: '#FFFFFF',

    fontSize: 19,

    fontWeight: '800',
  },

  loginArrowIcon: {
    marginLeft: 4,
  },

  registerContainer: {
    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    flexWrap: 'wrap',

    marginTop: 18,
  },

  registerText: {
    fontSize: 14,

    color: '#202528',
  },

  registerLink: {
    fontSize: 14,

    color: '#14833F',

    fontWeight: '800',
  },
});

export default LoginScreen;
