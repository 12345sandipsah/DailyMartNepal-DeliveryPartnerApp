import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import type { AuthStackParamList } from '../../../app/navigation/AuthNavigator';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [phone, setPhone] = useState('');

  const handleContinue = () => {
    const trimmedPhone = phone.trim();

    if (!trimmedPhone) {
      return;
    }

    navigation.navigate('Otp', {
      phone: trimmedPhone,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.appName}>DailyMart Nepal</Text>

          <Text style={styles.title}>Delivery Partner</Text>

          <Text style={styles.subtitle}>
            Sign in to manage your deliveries
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Mobile Number</Text>

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter mobile number"
            placeholderTextColor="#999999"
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={15}
            style={styles.input}
          />

          <Pressable
            style={styles.button}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
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

  form: {
    width: '100%',
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#FFFFFF',
  },

  button: {
    height: 52,
    borderRadius: 10,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;