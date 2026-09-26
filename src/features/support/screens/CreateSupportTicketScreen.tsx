import React, {useState} from 'react';

import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';

import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import type {MainStackParamList} from '../../../app/navigation/MainNavigator';

import {
  useSupportTickets,
} from '../context/SupportTicketContext';

import type {
  TicketCategory,
  TicketPriority,
} from '../context/SupportTicketContext';

type CreateSupportTicketNavigationProp =
  NativeStackNavigationProp<
    MainStackParamList,
    'CreateSupportTicket'
  >;

const CATEGORIES: TicketCategory[] = [
  'Delivery',
  'Payment',
  'Customer',
  'Vehicle',
  'Warehouse',
  'Account',
  'Other',
];

const PRIORITIES: TicketPriority[] = [
  'NORMAL',
  'HIGH',
  'URGENT',
];

const CreateSupportTicketScreen = () => {
  const navigation =
    useNavigation<CreateSupportTicketNavigationProp>();

  const {addTicket} = useSupportTickets();

  const [category, setCategory] =
    useState<TicketCategory>('Delivery');

  const [priority, setPriority] =
    useState<TicketPriority>('NORMAL');

  const [subject, setSubject] = useState('');

  const [description, setDescription] =
    useState('');

  const [orderReference, setOrderReference] =
    useState('');

  const [showCategories, setShowCategories] =
    useState(false);

  const [showPriorities, setShowPriorities] =
    useState(false);

  const handleSubmit = () => {
    const trimmedSubject = subject.trim();

    const trimmedDescription =
      description.trim();

    const trimmedOrderReference =
      orderReference.trim();

    if (!trimmedSubject) {
      Alert.alert(
        'Subject Required',
        'Please enter a subject for your support request.',
      );
      return;
    }

    if (trimmedSubject.length < 5) {
      Alert.alert(
        'Subject Too Short',
        'Please enter a more descriptive subject.',
      );
      return;
    }

    if (!trimmedDescription) {
      Alert.alert(
        'Description Required',
        'Please describe the issue you are facing.',
      );
      return;
    }

    if (trimmedDescription.length < 10) {
      Alert.alert(
        'Description Too Short',
        'Please provide more details about the issue.',
      );
      return;
    }

    const createdTicket = addTicket({
      category,
      priority,
      subject: trimmedSubject,
      description: trimmedDescription,
      orderReference:
        trimmedOrderReference || undefined,
    });

    Alert.alert(
      'Support Ticket Created',
      `Your support ticket ${createdTicket.id} has been created successfully.`,
      [
        {
          text: 'View Ticket',
          onPress: () => {
            navigation.replace('SupportTicketDetails', {
              ticketId: createdTicket.id,
            });
          },
        },
        {
          text: 'My Tickets',
          onPress: () => {
            navigation.replace('SupportTickets');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            Create Support Ticket
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>
              Tell us what happened
            </Text>

            <Text style={styles.introText}>
              Provide enough information so the DailyMart Nepal
              support team can understand and handle your issue.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>
              Issue Category
            </Text>

            <Pressable
              style={styles.selectButton}
              onPress={() =>
                setShowCategories(
                  previous => !previous,
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Select issue category">
              <Text style={styles.selectButtonText}>
                {category}
              </Text>

              <Text style={styles.selectArrow}>
                {showCategories ? '⌃' : '⌄'}
              </Text>
            </Pressable>

            {showCategories && (
              <View style={styles.dropdown}>
                {CATEGORIES.map(item => (
                  <Pressable
                    key={item}
                    style={[
                      styles.dropdownItem,
                      item === category &&
                        styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setCategory(item);
                      setShowCategories(false);
                    }}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        item === category &&
                          styles.dropdownItemTextActive,
                      ]}>
                      {item}
                    </Text>

                    {item === category && (
                      <Text style={styles.checkMark}>
                        ✓
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>
              Priority
            </Text>

            <Pressable
              style={styles.selectButton}
              onPress={() =>
                setShowPriorities(
                  previous => !previous,
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Select support priority">
              <Text style={styles.selectButtonText}>
                {priority}
              </Text>

              <Text style={styles.selectArrow}>
                {showPriorities ? '⌃' : '⌄'}
              </Text>
            </Pressable>

            {showPriorities && (
              <View style={styles.dropdown}>
                {PRIORITIES.map(item => (
                  <Pressable
                    key={item}
                    style={[
                      styles.dropdownItem,
                      item === priority &&
                        styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setPriority(item);
                      setShowPriorities(false);
                    }}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        item === priority &&
                          styles.dropdownItemTextActive,
                      ]}>
                      {item}
                    </Text>

                    {item === priority && (
                      <Text style={styles.checkMark}>
                        ✓
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>
              Order / Delivery Reference
            </Text>

            <TextInput
              style={styles.input}
              value={orderReference}
              onChangeText={setOrderReference}
              placeholder="Example: DM12345"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              returnKeyType="next"
            />

            <Text style={styles.helperText}>
              Enter the order number when your issue is related
              to a specific delivery.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>
              Subject
            </Text>

            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Example: Customer is unreachable"
              placeholderTextColor="#9CA3AF"
              maxLength={100}
              returnKeyType="next"
            />

            <Text style={styles.characterCount}>
              {subject.length}/100
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>
              Description
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.descriptionInput,
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue in detail..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              maxLength={500}
            />

            <Text style={styles.characterCount}>
              {description.length}/500
            </Text>
          </View>

          <View style={styles.guidanceCard}>
            <View style={styles.guidanceIcon}>
              <Text style={styles.guidanceIconText}>
                i
              </Text>
            </View>

            <View style={styles.guidanceContent}>
              <Text style={styles.guidanceTitle}>
                Before submitting
              </Text>

              <Text style={styles.guidanceText}>
                Include the order number, location, customer
                information, and what happened whenever those
                details are relevant.
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.submitButton}
            onPress={handleSubmit}
            accessibilityRole="button"
            accessibilityLabel="Submit support ticket">
            <Text style={styles.submitButtonText}>
              Submit Support Ticket
            </Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Cancel support ticket">
            <Text style={styles.cancelButtonText}>
              Cancel
            </Text>
          </Pressable>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },

  container: {
    flex: 1,
  },

  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAE5',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    fontSize: 32,
    lineHeight: 32,
    color: '#1F2937',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  headerSpacer: {
    width: 42,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 30,
  },

  introCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#F0F7F0',
    borderWidth: 1,
    borderColor: '#D8EAD8',
    marginBottom: 22,
  },

  introTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  introText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 19,
    color: '#667066',
  },

  formSection: {
    marginBottom: 20,
  },

  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },

  selectButton: {
    minHeight: 50,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE3DD',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },

  selectArrow: {
    fontSize: 20,
    color: '#2E7D32',
    fontWeight: '600',
  },

  dropdown: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE3DD',
    overflow: 'hidden',
  },

  dropdownItem: {
    minHeight: 46,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F0',
  },

  dropdownItemActive: {
    backgroundColor: '#F0F7F0',
  },

  dropdownItemText: {
    fontSize: 13,
    color: '#4B5563',
  },

  dropdownItemTextActive: {
    color: '#2E7D32',
    fontWeight: '700',
  },

  checkMark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },

  input: {
    minHeight: 50,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE3DD',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#1F2937',
  },

  descriptionInput: {
    minHeight: 140,
    paddingTop: 14,
  },

  helperText: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    color: '#8A918A',
  },

  characterCount: {
    marginTop: 5,
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
  },

  guidanceCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    marginBottom: 20,
  },

  guidanceIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  guidanceIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  guidanceContent: {
    flex: 1,
  },

  guidanceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },

  guidanceText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#667066',
  },

  submitButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  cancelButton: {
    minHeight: 48,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE3DD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default CreateSupportTicketScreen;