import React, {useMemo, useState} from 'react';

import {
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

import {
  useSupportTickets,
} from '../context/SupportTicketContext';

import type {
  TicketPriority,
  TicketStatus,
} from '../context/SupportTicketContext';

type FilterType =
  | 'ALL'
  | 'OPEN'
  | 'IN PROGRESS'
  | 'RESOLVED';

type SupportTicketsNavigationProp =
  NativeStackNavigationProp<
    MainStackParamList,
    'SupportTickets'
  >;

const FILTERS: FilterType[] = [
  'ALL',
  'OPEN',
  'IN PROGRESS',
  'RESOLVED',
];

const getPriorityStyle = (
  priority: TicketPriority,
) => {
  switch (priority) {
    case 'URGENT':
      return {
        container: styles.priorityUrgent,
        text: styles.priorityTextUrgent,
      };

    case 'HIGH':
      return {
        container: styles.priorityHigh,
        text: styles.priorityTextHigh,
      };

    case 'NORMAL':
    default:
      return {
        container: styles.priorityNormal,
        text: styles.priorityTextNormal,
      };
  }
};

const getStatusStyle = (
  status: TicketStatus,
) => {
  switch (status) {
    case 'OPEN':
      return {
        container: styles.statusOpen,
        text: styles.statusTextOpen,
      };

    case 'IN PROGRESS':
      return {
        container: styles.statusProgress,
        text: styles.statusTextProgress,
      };

    case 'RESOLVED':
      return {
        container: styles.statusResolved,
        text: styles.statusTextResolved,
      };

    default:
      return {
        container: styles.statusOpen,
        text: styles.statusTextOpen,
      };
  }
};

const formatFilterLabel = (
  filter: FilterType,
): string => {
  switch (filter) {
    case 'ALL':
      return 'All';

    case 'OPEN':
      return 'Open';

    case 'IN PROGRESS':
      return 'In Progress';

    case 'RESOLVED':
      return 'Resolved';

    default:
      return filter;
  }
};

const SupportTicketsScreen = () => {
  const navigation =
    useNavigation<SupportTicketsNavigationProp>();

  const {tickets} = useSupportTickets();

  const [activeFilter, setActiveFilter] =
    useState<FilterType>('ALL');

  const filteredTickets = useMemo(() => {
    if (activeFilter === 'ALL') {
      return tickets;
    }

    return tickets.filter(
      ticket => ticket.status === activeFilter,
    );
  }, [activeFilter, tickets]);

  const openCount = useMemo(
    () =>
      tickets.filter(
        ticket => ticket.status === 'OPEN',
      ).length,
    [tickets],
  );

  const inProgressCount = useMemo(
    () =>
      tickets.filter(
        ticket => ticket.status === 'IN PROGRESS',
      ).length,
    [tickets],
  );

  const resolvedCount = useMemo(
    () =>
      tickets.filter(
        ticket => ticket.status === 'RESOLVED',
      ).length,
    [tickets],
  );

  const handleTicketPress = (
    ticketId: string,
  ) => {
    navigation.navigate('SupportTicketDetails', {
      ticketId,
    });
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
            My Support Tickets
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {tickets.length}
            </Text>

            <Text style={styles.summaryLabel}>
              Total
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {openCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Open
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {inProgressCount}
            </Text>

            <Text style={styles.summaryLabel}>
              In Progress
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {resolvedCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Resolved
            </Text>
          </View>
        </View>

        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}>
            {FILTERS.map(filter => (
              <Pressable
                key={filter}
                style={[
                  styles.filterButton,
                  activeFilter === filter &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setActiveFilter(filter)
                }
                accessibilityRole="button"
                accessibilityLabel={`Filter ${formatFilterLabel(
                  filter,
                ).toLowerCase()} tickets`}>
                <Text
                  style={[
                    styles.filterButtonText,
                    activeFilter === filter &&
                      styles.filterButtonTextActive,
                  ]}>
                  {formatFilterLabel(filter)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>
              {activeFilter === 'ALL'
                ? 'All Tickets'
                : `${formatFilterLabel(
                    activeFilter,
                  )} Tickets`}
            </Text>

            <Text style={styles.resultCount}>
              {filteredTickets.length}{' '}
              {filteredTickets.length === 1
                ? 'ticket'
                : 'tickets'}
            </Text>
          </View>

          {filteredTickets.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>✓</Text>
              </View>

              <Text style={styles.emptyTitle}>
                No tickets found
              </Text>

              <Text style={styles.emptyDescription}>
                There are no support tickets in this category.
              </Text>
            </View>
          ) : (
            filteredTickets.map(ticket => {
              const statusStyle =
                getStatusStyle(ticket.status);

              const priorityStyle =
                getPriorityStyle(ticket.priority);

              return (
                <Pressable
                  key={ticket.id}
                  style={styles.ticketCard}
                  onPress={() =>
                    handleTicketPress(ticket.id)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Open support ticket ${ticket.id}`}>
                  <View style={styles.ticketHeader}>
                    <View style={styles.ticketHeading}>
                      <Text style={styles.ticketId}>
                        {ticket.id}
                      </Text>

                      <Text style={styles.ticketSubject}>
                        {ticket.subject}
                      </Text>
                    </View>

                    <Text style={styles.ticketArrow}>
                      ›
                    </Text>
                  </View>

                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        statusStyle.container,
                      ]}>
                      <Text
                        style={[
                          styles.badgeText,
                          statusStyle.text,
                        ]}>
                        {ticket.status}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.priorityBadge,
                        priorityStyle.container,
                      ]}>
                      <Text
                        style={[
                          styles.badgeText,
                          priorityStyle.text,
                        ]}>
                        {ticket.priority}
                      </Text>
                    </View>

                    <View style={styles.categoryBadge}>
                      <Text
                        style={styles.categoryBadgeText}>
                        {ticket.category}
                      </Text>
                    </View>
                  </View>

                  {ticket.orderReference && (
                    <View style={styles.referenceRow}>
                      <Text style={styles.referenceLabel}>
                        Order
                      </Text>

                      <Text style={styles.referenceValue}>
                        #{ticket.orderReference}
                      </Text>
                    </View>
                  )}

                  <View style={styles.ticketDivider} />

                  <View style={styles.ticketFooter}>
                    <Text style={styles.updatedLabel}>
                      Last updated
                    </Text>

                    <Text style={styles.updatedValue}>
                      {ticket.updatedAt}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}

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

  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },

  summaryLabel: {
    marginTop: 4,
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
  },

  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5EAE5',
  },

  filterSection: {
    marginTop: 14,
  },

  filterContent: {
    paddingHorizontal: 16,
  },

  filterButton: {
    minHeight: 38,
    paddingHorizontal: 15,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#DDE3DD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  filterButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },

  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5F6B61',
  },

  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 30,
  },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  resultTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },

  resultCount: {
    fontSize: 11,
    color: '#6B7280',
  },

  ticketCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },

  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  ticketHeading: {
    flex: 1,
    paddingRight: 8,
  },

  ticketId: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 5,
  },

  ticketSubject: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: '#1F2937',
  },

  ticketArrow: {
    fontSize: 25,
    color: '#2E7D32',
    marginTop: 2,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 13,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    marginRight: 7,
    marginBottom: 5,
  },

  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    marginRight: 7,
    marginBottom: 5,
  },

  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: '#F3F4F6',
    marginBottom: 5,
  },

  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  statusOpen: {
    backgroundColor: '#FFF3E0',
  },

  statusProgress: {
    backgroundColor: '#E3F2FD',
  },

  statusResolved: {
    backgroundColor: '#E8F5E9',
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

  priorityUrgent: {
    backgroundColor: '#FFEBEE',
  },

  priorityHigh: {
    backgroundColor: '#FFF3E0',
  },

  priorityNormal: {
    backgroundColor: '#F3F4F6',
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

  categoryBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6B7280',
  },

  referenceRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  referenceLabel: {
    fontSize: 11,
    color: '#8A918A',
    marginRight: 6,
  },

  referenceValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },

  ticketDivider: {
    height: 1,
    backgroundColor: '#EEF0EE',
    marginVertical: 13,
  },

  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  updatedLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },

  updatedValue: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EAE5',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  emptyIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  emptyIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
  },

  emptyTitle: {
    fontSize: 17,
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

  bottomSpacing: {
    height: 20,
  },
});

export default SupportTicketsScreen;