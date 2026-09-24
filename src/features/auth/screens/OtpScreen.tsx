import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '../../../app/navigation/AuthNavigator';

type OtpScreenProps = NativeStackScreenProps<AuthStackParamList, 'Otp'> & {
  onAuthenticated?: () => void;
};

function OtpScreen({ route, onAuthenticated }: OtpScreenProps) {
  const { phone } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState(30);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (secondsLeft === 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft(previous => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);

    const updatedOtp = [...otp];
    updatedOtp[index] = digit;
    setOtp(updatedOtp);

    if (digit && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    event: {
      nativeEvent: {
        key: string;
      };
    },
    index: number,
  ) => {
    if (
      event.nativeEvent.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const enteredOtp = otp.join('');

    if (enteredOtp.length !== 6) {
      return;
    }

    // Temporary frontend-only authentication.
    // Real OTP verification will be connected to the backend later.
    console.log('Phone:', phone);
    console.log('Entered OTP:', enteredOtp);

    onAuthenticated?.();
  };

  const handleResend = () => {
    if (secondsLeft > 0) {
      return;
    }

    setSecondsLeft(30);

    // Resend OTP API will be connected later.
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.appName}>DailyMart Nepal</Text>

          <Text style={styles.title}>Verify OTP</Text>

          <Text style={styles.subtitle}>
            Enter the 6-digit verification code sent to:
          </Text>

          <Text style={styles.phoneNumber}>{phone}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>OTP Code</Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => {
                  inputRefs.current[index] = ref;
                }}
                value={digit}
                onChangeText={value => handleOtpChange(value, index)}
                onKeyPress={event => handleKeyPress(event, index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                style={styles.otpInput}
                selectTextOnFocus
              />
            ))}
          </View>

          <Pressable
            style={[
              styles.verifyButton,
              !isOtpComplete && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={!isOtpComplete}
          >
            <Text style={styles.verifyButtonText}>Verify OTP</Text>
          </Pressable>

          <View style={styles.resendContainer}>
            {secondsLeft > 0 ? (
              <Text style={styles.resendTimer}>
                Resend OTP in {secondsLeft}s
              </Text>
            ) : (
              <Pressable onPress={handleResend}>
                <Text style={styles.resendButton}>Resend OTP</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  header: {
    marginBottom: 40,
  },

  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111111',
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
    lineHeight: 23,
  },

  phoneNumber: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },

  form: {
    width: '100%',
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 12,
  },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  otpInput: {
    width: 48,
    height: 54,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 10,
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
    backgroundColor: '#FFFFFF',
  },

  verifyButton: {
    height: 52,
    borderRadius: 10,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
  },

  verifyButtonDisabled: {
    opacity: 0.45,
  },

  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  resendContainer: {
    marginTop: 20,
    alignItems: 'center',
  },

  resendTimer: {
    fontSize: 14,
    color: '#777777',
  },

  resendButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
});

export default OtpScreen;