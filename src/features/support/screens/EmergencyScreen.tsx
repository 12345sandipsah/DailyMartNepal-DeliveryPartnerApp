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

type EmergencyType =
  | 'Safety Emergency'
  | 'Road Accident'
  | 'Vehicle Breakdown'
  | 'Medical Emergency'
  | 'Threat / Security Issue'
  | 'Other';

const EMERGENCY_TYPES: EmergencyType[] = [
  'Safety Emergency',
  'Road Accident',
  'Vehicle Breakdown',
  'Medical Emergency',
  'Threat / Security Issue',
  'Other',
];

const EmergencyScreen = () => {
  const navigation = useNavigation();

  const [selectedType, setSelectedType] =
    useState<EmergencyType>('Safety Emergency');

  const [orderReference, setOrderReference] =
    useState('');

  const [notes, setNotes] = useState('');

  const [showTypes, setShowTypes] =
    useState(false);

  const [isEmergencyActive, setIsEmergencyActive] =
    useState(false);

  const handleActivateEmergency = () => {
    Alert.alert(
      'Confirm Emergency',
      'Are you sure this is a genuine emergency that requires immediate assistance?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Activate SOS',
          style: 'destructive',
          onPress: () => {
            setIsEmergencyActive(true);
          },
        },
      ],
    );
  };

  const handleCancelEmergency = () => {
    Alert.alert(
      'Cancel Emergency',
      'Are you sure you want to cancel the current emergency alert?',
      [
        {
          text: 'Keep Active',
          style: 'cancel',
        },
        {
          text: 'Cancel Emergency',
          style: 'destructive',
          onPress: () => {
            setIsEmergencyActive(false);
          },
        },
      ],
    );
  };

  if (isEmergencyActive) {
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
              Emergency Active
            </Text>

            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.activeScrollContent}>
            <View style={styles.activeIconContainer}>
              <Text style={styles.activeIcon}>SOS</Text>
            </View>

            <Text style={styles.activeTitle}>
              Emergency Alert Activated
            </Text>

            <Text style={styles.activeDescription}>
              Your emergency request has been recorded in this
              frontend demo. In the production system, this event
              will be sent to the DailyMart Nepal operations and
              emergency support system.
            </Text>

            <View style={styles.activeCard}>
              <View style={styles.activeStatusRow}>
                <Text style={styles.activeStatusLabel}>
                  Status
                </Text>

                <View style={styles.activeStatusBadge}>
                  <Text style={styles.activeStatusText}>
                    ACTIVE
                  </Text>
                </View>
              </View>

              <View style={styles.activeDivider} />

              <View style={styles.activeDetailRow}>
                <Text style={styles.activeDetailLabel}>
                  Emergency Type
                </Text>

                <Text style={styles.activeDetailValue}>
                  {selectedType}
                </Text>
              </View>

              {orderReference.trim() !== '' && (
                <View style={styles.activeDetailRow}>
                  <Text style={styles.activeDetailLabel}>
                    Order Reference
                  </Text>

                  <Text style={styles.activeDetailValue}>
                    #{orderReference.trim()}
                  </Text>
                </View>
              )}

              {notes.trim() !== '' && (
                <View style={styles.activeNotesSection}>
                  <Text style={styles.activeDetailLabel}>
                    Additional Information
                  </Text>

                  <Text style={styles.activeNotes}>
                    {notes.trim()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>
                Important
              </Text>

              <Text style={styles.warningText}>
                In the production app, emergency handling will
                require backend confirmation, partner identity,
                current delivery information, location handling,
                and an auditable emergency event.
              </Text>
            </View>

            <Pressable
              style={styles.cancelEmergencyButton}
              onPress={handleCancelEmergency}
              accessibilityRole="button"
              accessibilityLabel="Cancel active emergency">
              <Text style={styles.cancelEmergencyButtonText}>
                Cancel Emergency
              </Text>
            </Pressable>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

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
            Emergency / SOS
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroSection}>
            <View style={styles.sosCircle}>
              <Text style={styles.sosText}>SOS</Text>
            </View>

            <Text style={styles.heroTitle}>
              Emergency Assistance
            </Text>

            <Text style={styles.heroDescription}>
              Use SOS only for a genuine safety, accident, medical,
              or security emergency during your work.
            </Text>
          </View>

          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>
              Before activating SOS
            </Text>

            <Text style={styles.warningText}>
              Normal delivery problems should be reported through
              a support ticket. Use this screen only when an
              immediate emergency requires special assistance.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>
              Emergency Type
            </Text>

            <Pressable
              style={styles.selectButton}
              onPress={() =>
                setShowTypes(
                  previous => !previous,
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Select emergency type">
              <Text style={styles.selectButtonText}>
                {selectedType}
              </Text>

              <Text style={styles.selectArrow}>
                {showTypes ? '⌃' : '⌄'}
              </Text>
            </Pressable>

            {showTypes && (
              <View style={styles.dropdown}>
                {EMERGENCY_TYPES.map(type => (
                  <Pressable
                    key={type}
                    style={[
                      styles.dropdownItem,
                      type === selectedType &&
                        styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setSelectedType(type);
                      setShowTypes(false);
                    }}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        type === selectedType &&
                          styles.dropdownItemTextActive,
                      ]}>
                      {type}
                    </Text>

                    {type === selectedType && (
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
              maxLength={30}
            />

            <Text style={styles.helperText}>
              Enter the order number when the emergency is related
              to an active delivery.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>
              Additional Information
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.notesInput,
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Briefly explain what happened..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              maxLength={300}
            />

            <Text style={styles.characterCount}>
              {notes.length}/300
            </Text>
          </View>

          <View style={styles.emergencyGuidanceCard}>
            <View style={styles.guidanceIcon}>
              <Text style={styles.guidanceIconText}>
                !
              </Text>
            </View>

            <View style={styles.guidanceContent}>
              <Text style={styles.guidanceTitle}>
                Safety first
              </Text>

              <Text style={styles.guidanceText}>
                Move to a safe location when possible. Do not put
                yourself at additional risk while using the app.
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.activateButton}
            onPress={handleActivateEmergency}
            accessibilityRole="button"
            accessibilityLabel="Activate emergency SOS">
            <Text style={styles.activateButtonText}>
              Activate Emergency / SOS
            </Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Cancel emergency screen">
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

  activeScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 35,
    paddingBottom: 30,
  },

  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  sosCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  sosText: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7F1D1D',
    textAlign: 'center',
  },

  heroDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },

  warningCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFF8F7',
    borderWidth: 1,
    borderColor: '#F3C7C3',
    marginBottom: 20,
  },

  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7F1D1D',
  },

  warningText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 19,
    color: '#7F1D1D',
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
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },

  selectArrow: {
    fontSize: 20,
    color: '#D32F2F',
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
    backgroundColor: '#FFF8F7',
  },

  dropdownItemText: {
    fontSize: 13,
    color: '#4B5563',
  },

  dropdownItemTextActive: {
    color: '#B71C1C',
    fontWeight: '700',
  },

  checkMark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D32F2F',
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

  notesInput: {
    minHeight: 120,
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

  emergencyGuidanceCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    marginBottom: 20,
  },

  guidanceIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  guidanceIconText: {
    fontSize: 16,
    fontWeight: '900',
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

  activateButton: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activateButtonText: {
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

  activeIconContainer: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },

  activeIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  activeTitle: {
    fontSize: 23,
    fontWeight: '700',
    color: '#7F1D1D',
    textAlign: 'center',
  },

  activeDescription: {
    marginTop: 9,
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },

  activeCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3C7C3',
  },

  activeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  activeStatusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  activeStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFEBEE',
  },

  activeStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C62828',
    letterSpacing: 0.7,
  },

  activeDivider: {
    height: 1,
    backgroundColor: '#EEF0EE',
    marginVertical: 15,
  },

  activeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  activeDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  activeDetailValue: {
    maxWidth: '60%',
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'right',
  },

  activeNotesSection: {
    marginTop: 2,
  },

  activeNotes: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 19,
    color: '#4B5563',
  },

  cancelEmergencyButton: {
    minHeight: 52,
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelEmergencyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D32F2F',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default EmergencyScreen;