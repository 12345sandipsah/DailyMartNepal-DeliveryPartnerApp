import React, {useState} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';

import type { RouteProp } from '@react-navigation/native';

import { useSupportTickets } from '../context/SupportTicketContext';

import type {
  TicketPriority,
  TicketStatus,
} from '../context/SupportTicketContext';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChevronLeft,
  faCircleExclamation,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';

type TicketDetailsParams = {
  SupportTicketDetails: {
    ticketId: string;
  };
};

type TicketDetailsRouteProp = RouteProp<
  TicketDetailsParams,
  'SupportTicketDetails'
>;

const getStatusStyles = (status: TicketStatus) => {
  switch (status) {
    case 'OPEN':
      return {
        badge: styles.statusBadgeOpen,

        text: styles.statusTextOpen,
      };

    case 'IN PROGRESS':
      return {
        badge: styles.statusBadgeProgress,

        text: styles.statusTextProgress,
      };

    case 'RESOLVED':
      return {
        badge: styles.statusBadgeResolved,

        text: styles.statusTextResolved,
      };

    default:
      return {
        badge: styles.statusBadgeOpen,

        text: styles.statusTextOpen,
      };
  }
};

const getPriorityStyles = (priority: TicketPriority) => {
  switch (priority) {
    case 'URGENT':
      return {
        badge: styles.priorityBadgeUrgent,

        text: styles.priorityTextUrgent,
      };

    case 'HIGH':
      return {
        badge: styles.priorityBadgeHigh,

        text: styles.priorityTextHigh,
      };

    default:
      return {
        badge: styles.priorityBadgeNormal,

        text: styles.priorityTextNormal,
      };
  }
};

const SupportTicketDetailsScreen = () => {
  const navigation = useNavigation();

  const route = useRoute<TicketDetailsRouteProp>();

  const { getTicketById, replyToTicket } = useSupportTickets();

  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const ticket = getTicketById(route.params.ticketId);

  if (!ticket) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <FontAwesomeIcon icon={faChevronLeft} size={18} color="#1F2937" />
            </Pressable>

            <Text style={styles.headerTitle}>Ticket Details</Text>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.notFoundContainer}>
            <View style={styles.notFoundIconContainer}>
              <FontAwesomeIcon
                icon={faCircleExclamation}
                size={28}
                color="#C62828"
              />
            </View>

            <Text style={styles.notFoundTitle}>Ticket Not Found</Text>

            <Text style={styles.notFoundText}>
              The support ticket could not be found. It may no longer be
              available in the current session.
            </Text>

            <Pressable
              style={styles.backToTicketsButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back to support tickets"
            >
              <Text style={styles.backToTicketsButtonText}>
                Back to Tickets
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const statusStyles = getStatusStyles(ticket.status);

  const priorityStyles = getPriorityStyles(ticket.priority);

  const handleSendReply = async () => {
    const message = reply.trim();
    if (!message || sending) return;
    setSending(true);
    try {
      await replyToTicket(ticket.id, message);
      setReply('');
    } catch (error) {
      Alert.alert(
        'Message not sent',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <FontAwesomeIcon icon={faChevronLeft} size={18} color="#1F2937" />
          </Pressable>

          <Text style={styles.headerTitle}>Ticket Details</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.ticketHeaderCard}>
            <View style={styles.ticketHeaderTopRow}>
              <View style={styles.ticketIdContainer}>
                <Text style={styles.ticketLabel}>SUPPORT TICKET</Text>

                <Text style={styles.ticketId}>{ticket.id}</Text>
              </View>

              <View style={[styles.statusBadge, statusStyles.badge]}>
                <Text style={[styles.statusText, statusStyles.text]}>
                  {ticket.status}
                </Text>
              </View>
            </View>

            <Text style={styles.subject}>{ticket.subject}</Text>

            <Text style={styles.updatedText}>
              Last updated {ticket.updatedAt}
            </Text>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Ticket Information</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category</Text>

              <Text style={styles.infoValue}>{ticket.category}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Priority</Text>

              <View style={[styles.priorityBadge, priorityStyles.badge]}>
                <Text style={[styles.priorityText, priorityStyles.text]}>
                  {ticket.priority}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created</Text>

              <Text style={styles.infoValue}>{ticket.createdAt}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated</Text>

              <Text style={styles.infoValue}>{ticket.updatedAt}</Text>
            </View>

            {ticket.orderReference && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Order Reference</Text>

                <Text style={styles.orderReference}>
                  #{ticket.orderReference}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>Issue Description</Text>

            <Text style={styles.description}>{ticket.description}</Text>
          </View>

          <View style={styles.timelineCard}>
            <Text style={styles.sectionTitle}>Support Progress</Text>

            <View style={styles.timelineItem}>
              <View style={styles.timelineIndicator}>
                <View style={styles.timelineDotActive} />

                <View style={styles.timelineLine} />
              </View>

              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Ticket Created</Text>

                <Text style={styles.timelineText}>
                  Your support request was submitted.
                </Text>

                <Text style={styles.timelineTime}>{ticket.createdAt}</Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineIndicator}>
                <View
                  style={[
                    styles.timelineDot,

                    ticket.status !== 'OPEN' && styles.timelineDotActive,
                  ]}
                />

                <View style={styles.timelineLine} />
              </View>

              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Under Review</Text>

                <Text style={styles.timelineText}>
                  {ticket.status === 'OPEN'
                    ? 'Your ticket is waiting for the support team to review it.'
                    : 'The DailyMart Nepal support team is reviewing your request.'}
                </Text>

                <Text style={styles.timelineTime}>
                  {ticket.status === 'OPEN' ? 'Waiting' : 'Updated'}
                </Text>
              </View>
            </View>

            <View style={styles.timelineItemLast}>
              <View style={styles.timelineIndicator}>
                <View
                  style={[
                    styles.timelineDot,

                    ticket.status === 'RESOLVED' && styles.timelineDotActive,
                  ]}
                />
              </View>

              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>
                  {ticket.status === 'RESOLVED' ? 'Resolved' : 'Resolution'}
                </Text>

                <Text style={styles.timelineText}>
                  {ticket.status === 'RESOLVED'
                    ? 'The support request has been resolved.'
                    : 'The support team will provide a resolution after the review is complete.'}
                </Text>

                <Text style={styles.timelineTime}>
                  {ticket.status === 'RESOLVED' ? ticket.updatedAt : 'Pending'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.responseCard}>
            <View style={styles.responseHeader}>
              <Text style={styles.sectionTitle}>Latest ticket update</Text>

              <View style={styles.responseBadge}>
                <Text style={styles.responseBadgeText}>UPDATE</Text>
              </View>
            </View>

            <Text style={styles.responseText}>{ticket.latestResponse}</Text>
          </View>

          <View style={styles.conversationCard}>
            <Text style={styles.sectionTitle}>Ticket conversation</Text>
            {ticket.messages.map(message => (
              <View key={message.id} style={styles.messageItem}>
                <View style={styles.messageMeta}>
                  <Text style={styles.messageAuthor}>
                    {message.authorType === 'delivery_partner'
                      ? 'You'
                      : message.authorType === 'admin'
                        ? 'DailyMart Support'
                        : message.authorName}
                  </Text>
                  <Text style={styles.messageTime}>{message.createdAt}</Text>
                </View>
                <Text style={styles.messageBody}>{message.body}</Text>
              </View>
            ))}
            <View style={styles.replyRow}>
              <TextInput
                value={reply}
                onChangeText={setReply}
                placeholder="Write a message to support…"
                placeholderTextColor="#9AA39C"
                multiline
                maxLength={4000}
                style={styles.replyInput}
              />
              <Pressable
                style={[styles.sendButton, (!reply.trim() || sending) && styles.sendButtonDisabled]}
                disabled={!reply.trim() || sending}
                onPress={handleSendReply}
                accessibilityRole="button"
                accessibilityLabel="Send message">
                {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                  <FontAwesomeIcon icon={faPaperPlane} size={14} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.bottomInfoCard}>
            <Text style={styles.bottomInfoTitle}>Need more help?</Text>

            <Text style={styles.bottomInfoText}>
              For an urgent delivery or safety issue, use the Support &
              Emergency section instead of waiting for a normal ticket response.
            </Text>
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

    fontWeight: '400',
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

    paddingTop: 18,

    paddingBottom: 30,
  },

  ticketHeaderCard: {
    padding: 18,

    borderRadius: 18,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E5EAE5',
  },

  ticketHeaderTopRow: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent: 'space-between',
  },

  ticketIdContainer: {
    flex: 1,

    paddingRight: 10,
  },

  ticketLabel: {
    fontSize: 9,

    fontWeight: '800',

    letterSpacing: 1,

    color: '#8A918A',

    marginBottom: 5,
  },

  ticketId: {
    fontSize: 19,

    fontWeight: '700',

    color: '#2E7D32',
  },

  statusBadge: {
    paddingHorizontal: 9,

    paddingVertical: 6,

    borderRadius: 9,
  },

  statusBadgeOpen: {
    backgroundColor: '#FFF3E0',
  },

  statusBadgeProgress: {
    backgroundColor: '#E3F2FD',
  },

  statusBadgeResolved: {
    backgroundColor: '#E8F5E9',
  },

  statusText: {
    fontSize: 8,

    fontWeight: '800',

    letterSpacing: 0.5,
  },

  statusTextOpen: {
    color: '#EF6C00',
  },

  statusTextProgress: {
    color: '#1976D2',
  },

  statusTextResolved: {
    color: '#2E7D32',
  },

  subject: {
    marginTop: 17,

    fontSize: 21,

    lineHeight: 28,

    fontWeight: '700',

    color: '#1F2937',
  },

  updatedText: {
    marginTop: 7,

    fontSize: 11,

    color: '#9CA3AF',
  },

  detailsCard: {
    marginTop: 14,

    padding: 18,

    borderRadius: 16,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E5EAE5',
  },

  sectionTitle: {
    fontSize: 15,

    fontWeight: '700',

    color: '#1F2937',
  },

  infoRow: {
    minHeight: 42,

    marginTop: 9,

    paddingVertical: 8,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    borderBottomWidth: 1,

    borderBottomColor: '#F0F2F0',
  },

  infoLabel: {
    fontSize: 12,

    color: '#6B7280',
  },

  infoValue: {
    maxWidth: '55%',

    fontSize: 12,

    fontWeight: '600',

    color: '#374151',

    textAlign: 'right',
  },

  orderReference: {
    fontSize: 12,

    fontWeight: '700',

    color: '#2E7D32',
  },

  priorityBadge: {
    paddingHorizontal: 9,

    paddingVertical: 5,

    borderRadius: 9,
  },

  priorityBadgeUrgent: {
    backgroundColor: '#FFEBEE',
  },

  priorityBadgeHigh: {
    backgroundColor: '#FFF3E0',
  },

  priorityBadgeNormal: {
    backgroundColor: '#F3F4F6',
  },

  priorityText: {
    fontSize: 8,

    fontWeight: '800',

    letterSpacing: 0.5,
  },

  priorityTextUrgent: {
    color: '#C62828',
  },

  priorityTextHigh: {
    color: '#EF6C00',
  },

  priorityTextNormal: {
    color: '#6B7280',
  },

  descriptionCard: {
    marginTop: 14,

    padding: 18,

    borderRadius: 16,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E5EAE5',
  },

  description: {
    marginTop: 12,

    fontSize: 13,

    lineHeight: 21,

    color: '#4B5563',
  },

  timelineCard: {
    marginTop: 14,

    padding: 18,

    borderRadius: 16,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E5EAE5',
  },

  timelineItem: {
    marginTop: 18,

    flexDirection: 'row',
  },

  timelineItemLast: {
    marginTop: 18,

    flexDirection: 'row',
  },

  timelineIndicator: {
    width: 24,

    alignItems: 'center',
  },

  timelineDot: {
    width: 12,

    height: 12,

    borderRadius: 6,

    backgroundColor: '#D1D5DB',
  },

  timelineDotActive: {
    width: 12,

    height: 12,

    borderRadius: 6,

    backgroundColor: '#2E7D32',
  },

  timelineLine: {
    width: 1,

    flex: 1,

    minHeight: 48,

    marginTop: 4,

    backgroundColor: '#DDE3DD',
  },

  timelineContent: {
    flex: 1,

    paddingLeft: 10,

    paddingBottom: 4,
  },

  timelineTitle: {
    fontSize: 13,

    fontWeight: '700',

    color: '#1F2937',
  },

  timelineText: {
    marginTop: 4,

    fontSize: 11,

    lineHeight: 17,

    color: '#6B7280',
  },

  timelineTime: {
    marginTop: 5,

    fontSize: 10,

    color: '#9CA3AF',
  },

  responseCard: {
    marginTop: 14,

    padding: 18,

    borderRadius: 16,

    backgroundColor: '#F0F7F0',

    borderWidth: 1,

    borderColor: '#D8EAD8',
  },

  conversationCard: {
    marginBottom: 12,
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3E9E3',
    backgroundColor: '#FFFFFF',
  },

  messageItem: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F7F9F7',
  },

  messageMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },

  messageAuthor: {
    color: '#526158',
    fontSize: 10,
    fontWeight: '700',
  },

  messageTime: {
    color: '#99A29B',
    fontSize: 9,
  },

  messageBody: {
    marginTop: 6,
    color: '#59675E',
    fontSize: 11,
    lineHeight: 16,
  },

  replyRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },

  replyInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E0E7E1',
    borderRadius: 9,
    color: '#36443A',
    fontSize: 11,
  },

  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#2E7D32',
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },

  responseHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  responseBadge: {
    paddingHorizontal: 8,

    paddingVertical: 5,

    borderRadius: 9,

    backgroundColor: '#E0EFE1',
  },

  responseBadgeText: {
    fontSize: 8,

    fontWeight: '800',

    color: '#2E7D32',

    letterSpacing: 0.5,
  },

  responseText: {
    marginTop: 11,

    fontSize: 12,

    lineHeight: 19,

    color: '#4B5563',
  },

  bottomInfoCard: {
    marginTop: 14,

    padding: 16,

    borderRadius: 16,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E5EAE5',
  },

  bottomInfoTitle: {
    fontSize: 13,

    fontWeight: '700',

    color: '#1F2937',
  },

  bottomInfoText: {
    marginTop: 5,

    fontSize: 11,

    lineHeight: 17,

    color: '#6B7280',
  },

  notFoundContainer: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 32,
  },

  notFoundIconContainer: {
    width: 64,

    height: 64,

    borderRadius: 32,

    backgroundColor: '#FFEBEE',

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 16,
  },

  notFoundIcon: {
    fontSize: 28,

    fontWeight: '800',

    color: '#C62828',
  },

  notFoundTitle: {
    fontSize: 20,

    fontWeight: '700',

    color: '#1F2937',

    textAlign: 'center',
  },

  notFoundText: {
    marginTop: 8,

    fontSize: 13,

    lineHeight: 20,

    color: '#6B7280',

    textAlign: 'center',
  },

  backToTicketsButton: {
    minHeight: 48,

    marginTop: 20,

    paddingHorizontal: 22,

    borderRadius: 12,

    backgroundColor: '#2E7D32',

    alignItems: 'center',

    justifyContent: 'center',
  },

  backToTicketsButtonText: {
    fontSize: 14,

    fontWeight: '700',

    color: '#FFFFFF',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default SupportTicketDetailsScreen;
