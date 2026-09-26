import React from 'react';

import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import type {MainStackParamList} from '../../../app/navigation/MainNavigator';

type SupportNavigationProp =
  NativeStackNavigationProp<MainStackParamList, 'Support'>;

type SupportTicket = {
  id: string;
  subject: string;
  category: string;
  status: 'OPEN' | 'IN PROGRESS' | 'RESOLVED';
  updatedAt: string;
};

const DEMO_TICKETS: SupportTicket[] = [
  {
    id: 'SUP-1001',
    subject: 'Unable to contact customer',
    category: 'Delivery',
    status: 'IN PROGRESS',
    updatedAt: 'Today, 10:35 AM',
  },
  {
    id: 'SUP-1000',
    subject: 'Payment collection clarification',
    category: 'Payment',
    status: 'RESOLVED',
    updatedAt: 'Yesterday, 4:20 PM',
  },
];

const SupportScreen = () => {
  const navigation =
    useNavigation<SupportNavigationProp>();

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'The DailyMart Nepal support contact system will be connected during the backend phase.',
      [
        {
          text: 'OK',
        },
      ],
    );
  };

  const handleCreateTicket = () => {
    navigation.navigate('CreateSupportTicket');
  };

  const handleViewTickets = () => {
    navigation.navigate('SupportTickets');
  };

  const handleTicketPress = (
    ticket: SupportTicket,
  ) => {
    navigation.navigate('SupportTicketDetails', {
      ticketId: ticket.id,
    });
  };

  const handleEmergency = () => {
    navigation.navigate('Emergency');
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
            Support & Help
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>
              How can we help?
            </Text>

            <Text style={styles.introText}>
              Get help with deliveries, payments, account issues,
              and other DailyMart Nepal operations.
            </Text>
          </View>

          <View style={styles.supportActions}>
            <Pressable
              style={styles.supportCard}
              onPress={handleContactSupport}
              accessibilityRole="button"
              accessibilityLabel="Contact support">
              <View
                style={[
                  styles.actionIconContainer,
                  styles.supportIconBackground,
                ]}>
                <Text style={styles.supportIcon}>?</Text>
              </View>

              <View style={styles.supportCardContent}>
                <Text style={styles.supportCardTitle}>
                  Contact Support
                </Text>

                <Text style={styles.supportCardDescription}>
                  Get help from the DailyMart Nepal support team.
                </Text>
              </View>

              <Text style={styles.cardArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.supportCard}
              onPress={handleCreateTicket}
              accessibilityRole="button"
              accessibilityLabel="Create support ticket">
              <View
                style={[
                  styles.actionIconContainer,
                  styles.ticketIconBackground,
                ]}>
                <Text style={styles.ticketIcon}>+</Text>
              </View>

              <View style={styles.supportCardContent}>
                <Text style={styles.supportCardTitle}>
                  Create Support Ticket
                </Text>

                <Text style={styles.supportCardDescription}>
                  Report a problem or ask about a delivery.
                </Text>
              </View>

              <Text style={styles.cardArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.supportCard}
              onPress={handleViewTickets}
              accessibilityRole="button"
              accessibilityLabel="View support tickets">
              <View
                style={[
                  styles.actionIconContainer,
                  styles.ticketListIconBackground,
                ]}>
                <Text style={styles.ticketListIcon}>T</Text>
              </View>

              <View style={styles.supportCardContent}>
                <Text style={styles.supportCardTitle}>
                  My Support Tickets
                </Text>

                <Text style={styles.supportCardDescription}>
                  View your previous support requests and statuses.
                </Text>
              </View>

              <Text style={styles.cardArrow}>›</Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Recent Support Requests
            </Text>

            <Pressable onPress={handleViewTickets}>
              <Text style={styles.sectionAction}>
                View all
              </Text>
            </Pressable>
          </View>

          {DEMO_TICKETS.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>✓</Text>
              </View>

              <Text style={styles.emptyTitle}>
                No support requests
              </Text>

              <Text style={styles.emptyDescription}>
                Your support tickets will appear here when you
                create one.
              </Text>
            </View>
          ) : (
            DEMO_TICKETS.map(ticket => (
              <Pressable
                key={ticket.id}
                style={styles.ticketCard}
                onPress={() =>
                  handleTicketPress(ticket)
                }
                accessibilityRole="button"
                accessibilityLabel={`Open support ticket ${ticket.id}`}>
                <View style={styles.ticketTopRow}>
                  <View style={styles.ticketTitleContainer}>
                    <Text style={styles.ticketId}>
                      {ticket.id}
                    </Text>

                    <Text style={styles.ticketSubject}>
                      {ticket.subject}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.ticketStatusBadge,
                      ticket.status === 'OPEN' &&
                        styles.ticketStatusOpen,
                      ticket.status === 'IN PROGRESS' &&
                        styles.ticketStatusProgress,
                      ticket.status === 'RESOLVED' &&
                        styles.ticketStatusResolved,
                    ]}>
                    <Text
                      style={[
                        styles.ticketStatusText,
                        ticket.status === 'OPEN' &&
                          styles.ticketStatusTextOpen,
                        ticket.status === 'IN PROGRESS' &&
                          styles.ticketStatusTextProgress,
                        ticket.status === 'RESOLVED' &&
                          styles.ticketStatusTextResolved,
                      ]}>
                      {ticket.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.ticketDivider} />

                <View style={styles.ticketBottomRow}>
                  <Text style={styles.ticketCategory}>
                    {ticket.category}
                  </Text>

                  <Text style={styles.ticketUpdated}>
                    {ticket.updatedAt}
                  </Text>
                </View>
              </Pressable>
            ))
          )}

          <View style={styles.emergencySection}>
            <View style={styles.emergencyHeader}>
              <View style={styles.emergencyHeaderText}>
                <Text style={styles.emergencyTitle}>
                  Emergency / SOS
                </Text>

                <Text style={styles.emergencySubtitle}>
                  For genuine safety or active delivery emergencies
                </Text>
              </View>

              <View style={styles.sosBadge}>
                <Text style={styles.sosBadgeText}>
                  SOS
                </Text>
              </View>
            </View>

            <Text style={styles.emergencyText}>
              Use the emergency option only when immediate
              assistance is required. Normal delivery issues
              should be reported through Support or a Support
              Ticket.
            </Text>

            <Pressable
              style={styles.emergencyButton}
              onPress={handleEmergency}
              accessibilityRole="button"
              accessibilityLabel="Open emergency SOS">
              <Text style={styles.emergencyButtonText}>
                Emergency / SOS
              </Text>
            </Pressable>
          </View>

          <View style={styles.helpInfoCard}>
            <Text style={styles.helpInfoTitle}>
              Common help topics
            </Text>

            <View style={styles.helpTopicRow}>
              <Text style={styles.helpTopicBullet}>•</Text>

              <Text style={styles.helpTopicText}>
                Customer unavailable or unreachable
              </Text>
            </View>

            <View style={styles.helpTopicRow}>
              <Text style={styles.helpTopicBullet}>•</Text>

              <Text style={styles.helpTopicText}>
                Wrong or difficult delivery location
              </Text>
            </View>

            <View style={styles.helpTopicRow}>
              <Text style={styles.helpTopicBullet}>•</Text>

              <Text style={styles.helpTopicText}>
                COD or payment collection issue
              </Text>
            </View>

            <View style={styles.helpTopicRow}>
              <Text style={styles.helpTopicBullet}>•</Text>

              <Text style={styles.helpTopicText}>
                Vehicle or delivery equipment problem
              </Text>
            </View>
          </View>

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

  introSection: {
    marginBottom: 18,
  },

  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },

  introText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
  },

  supportActions: {
    marginBottom: 26,
  },

  supportCard: {
    minHeight: 78,
    padding: 14,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  supportIconBackground: {
    backgroundColor: '#E8F5E9',
  },

  ticketIconBackground: {
    backgroundColor: '#E3F2FD',
  },

  ticketListIconBackground: {
    backgroundColor: '#FFF8E1',
  },

  supportIcon: {
    fontSize: 23,
    fontWeight: '800',
    color: '#2E7D32',
  },

  ticketIcon: {
    fontSize: 28,
    fontWeight: '400',
    color: '#1976D2',
  },

  ticketListIcon: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F59E0B',
  },

  supportCardContent: {
    flex: 1,
    paddingRight: 8,
  },

  supportCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },

  supportCardDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
  },

  cardArrow: {
    fontSize: 26,
    fontWeight: '400',
    color: '#2E7D32',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },

  ticketCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },

  ticketTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  ticketTitleContainer: {
    flex: 1,
    paddingRight: 10,
  },

  ticketId: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 5,
  },

  ticketSubject: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    color: '#1F2937',
  },

  ticketStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },

  ticketStatusOpen: {
    backgroundColor: '#FFF3E0',
  },

  ticketStatusProgress: {
    backgroundColor: '#E3F2FD',
  },

  ticketStatusResolved: {
    backgroundColor: '#E8F5E9',
  },

  ticketStatusText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  ticketStatusTextOpen: {
    color: '#EF6C00',
  },

  ticketStatusTextProgress: {
    color: '#1976D2',
  },

  ticketStatusTextResolved: {
    color: '#2E7D32',
  },

  ticketDivider: {
    height: 1,
    backgroundColor: '#EEF0EE',
    marginVertical: 13,
  },

  ticketBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  ticketCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },

  ticketUpdated: {
    fontSize: 10,
    color: '#9CA3AF',
  },

  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EAE5',
    paddingHorizontal: 24,
    paddingVertical: 35,
    marginBottom: 24,
  },

  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },

  emptyDescription: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    textAlign: 'center',
  },

  emergencySection: {
    marginTop: 12,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFF8F7',
    borderWidth: 1,
    borderColor: '#F3C7C3',
  },

  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  emergencyHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  emergencyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#7F1D1D',
  },

  emergencySubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: '#92400E',
  },

  sosBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sosBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  emergencyText: {
    marginTop: 13,
    fontSize: 12,
    lineHeight: 18,
    color: '#7F1D1D',
  },

  emergencyButton: {
    minHeight: 48,
    marginTop: 16,
    borderRadius: 11,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emergencyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  helpInfoCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0F7F0',
    borderWidth: 1,
    borderColor: '#D8EAD8',
  },

  helpInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },

  helpTopicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
  },

  helpTopicBullet: {
    width: 16,
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },

  helpTopicText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#667066',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default SupportScreen;