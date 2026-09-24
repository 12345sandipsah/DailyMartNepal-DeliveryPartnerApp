import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type DeliveryStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED UP'
  | 'OUT FOR DELIVERY'
  | 'DELIVERED'
  | 'FAILED';

type Delivery = {
  id: string;
  customer: string;
  area: string;
  distance: string;
  eta: string;
  amount: string;
  payment: 'COD' | 'ONLINE';
  status: DeliveryStatus;
};

const deliveries: Delivery[] = [
  {
    id: '#DM12345',
    customer: 'Customer',
    area: 'Birgunj',
    distance: '2.4 km',
    eta: '12 min',
    amount: 'NPR 850',
    payment: 'COD',
    status: 'OUT FOR DELIVERY',
  },
  {
    id: '#DM12346',
    customer: 'Customer',
    area: 'Adarsh Nagar',
    distance: '3.1 km',
    eta: '18 min',
    amount: 'NPR 620',
    payment: 'ONLINE',
    status: 'ACCEPTED',
  },
  {
    id: '#DM12347',
    customer: 'Customer',
    area: 'Ghantaghar',
    distance: '1.8 km',
    eta: '10 min',
    amount: 'NPR 1,150',
    payment: 'COD',
    status: 'ASSIGNED',
  },
  {
    id: '#DM12348',
    customer: 'Customer',
    area: 'Maitri Path',
    distance: '4.2 km',
    eta: '25 min',
    amount: 'NPR 480',
    payment: 'ONLINE',
    status: 'PICKED UP',
  },
  {
    id: '#DM12349',
    customer: 'Customer',
    area: 'Birta',
    distance: '2.7 km',
    eta: '15 min',
    amount: 'NPR 760',
    payment: 'COD',
    status: 'DELIVERED',
  },
  {
    id: '#DM12350',
    customer: 'Customer',
    area: 'Power House',
    distance: '3.8 km',
    eta: '-',
    amount: 'NPR 530',
    payment: 'COD',
    status: 'FAILED',
  },
];

type Filter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

type DeliveriesScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Deliveries'
>;

function DeliveriesScreen() {
  const navigation = useNavigation<DeliveriesScreenNavigationProp>();

  const [selectedFilter, setSelectedFilter] = useState<Filter>('ALL');

  const filteredDeliveries = useMemo(() => {
    switch (selectedFilter) {
      case 'ACTIVE':
        return deliveries.filter(delivery =>
          [
            'ASSIGNED',
            'ACCEPTED',
            'PICKED UP',
            'OUT FOR DELIVERY',
          ].includes(delivery.status),
        );

      case 'COMPLETED':
        return deliveries.filter(
          delivery => delivery.status === 'DELIVERED',
        );

      case 'FAILED':
        return deliveries.filter(
          delivery => delivery.status === 'FAILED',
        );

      default:
        return deliveries;
    }
  }, [selectedFilter]);

  const handleDeliveryPress = (delivery: Delivery) => {
    navigation.navigate('DeliveryDetails', {
      deliveryId: delivery.id,
    });
  };

  const getStatusStyle = (status: DeliveryStatus) => {
    switch (status) {
      case 'DELIVERED':
        return {
          backgroundColor: '#E8F5E9',
          textColor: '#2E7D32',
        };

      case 'FAILED':
        return {
          backgroundColor: '#FDECEC',
          textColor: '#C62828',
        };

      case 'ASSIGNED':
        return {
          backgroundColor: '#FFF7E6',
          textColor: '#B26A00',
        };

      default:
        return {
          backgroundColor: '#EEF8EF',
          textColor: '#2E7D32',
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Deliveries</Text>
            <Text style={styles.subtitle}>
              Manage your assigned deliveries
            </Text>
          </View>

          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>TODAY</Text>
          </View>
        </View>

        <View style={styles.filterContainer}>
          {(['ALL', 'ACTIVE', 'COMPLETED', 'FAILED'] as Filter[]).map(
            filter => {
              const isSelected = selectedFilter === filter;

              return (
                <Pressable
                  key={filter}
                  style={[
                    styles.filterButton,
                    isSelected && styles.filterButtonSelected,
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isSelected && styles.filterTextSelected,
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {filteredDeliveries.length}
            </Text>
            <Text style={styles.summaryLabel}>Showing</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>8</Text>
            <Text style={styles.summaryLabel}>Today</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>5</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedFilter === 'ALL'
              ? "Today's Deliveries"
              : `${selectedFilter} Deliveries`}
          </Text>
        </View>

        {filteredDeliveries.length > 0 ? (
          filteredDeliveries.map(delivery => {
            const statusStyle = getStatusStyle(delivery.status);

            return (
              <Pressable
                key={delivery.id}
                style={styles.deliveryCard}
                onPress={() => handleDeliveryPress(delivery)}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderLabel}>Order</Text>
                    <Text style={styles.orderId}>{delivery.id}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: statusStyle.backgroundColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: statusStyle.textColor,
                        },
                      ]}
                    >
                      {delivery.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.customerRow}>
                  <View style={styles.customerIcon}>
                    <Text style={styles.customerIconText}>C</Text>
                  </View>

                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>
                      {delivery.customer}
                    </Text>
                    <Text style={styles.customerArea}>
                      {delivery.area}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Distance</Text>
                    <Text style={styles.detailValue}>
                      {delivery.distance}
                    </Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>ETA</Text>
                    <Text style={styles.detailValue}>
                      {delivery.eta}
                    </Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Payment</Text>
                    <Text style={styles.detailValue}>
                      {delivery.payment}
                    </Text>
                  </View>
                </View>

                <View style={styles.bottomRow}>
                  <View>
                    <Text style={styles.amountLabel}>Order Amount</Text>
                    <Text style={styles.amountValue}>
                      {delivery.amount}
                    </Text>
                  </View>

                  <Text style={styles.arrow}>›</Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>✓</Text>
            </View>

            <Text style={styles.emptyTitle}>No deliveries found</Text>

            <Text style={styles.emptyText}>
              There are no deliveries in this category right now.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF7',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  title: {
    fontSize: 27,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: '#6B7280',
  },

  todayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },

  todayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },

  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E3E8E3',
  },

  filterButton: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    paddingHorizontal: 6,
  },

  filterButtonSelected: {
    backgroundColor: '#2E7D32',
  },

  filterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },

  filterTextSelected: {
    color: '#FFFFFF',
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
  },

  summaryLabel: {
    marginTop: 3,
    fontSize: 11,
    color: '#7A827A',
  },

  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E4E8E4',
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  orderLabel: {
    fontSize: 11,
    color: '#8A918A',
    marginBottom: 3,
  },

  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  statusBadge: {
    maxWidth: 125,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: '#EEF0EE',
    marginVertical: 15,
  },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  customerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAF4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  customerIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },

  customerInfo: {
    flex: 1,
  },

  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  customerArea: {
    marginTop: 3,
    fontSize: 12,
    color: '#7A827A',
  },

  detailsRow: {
    flexDirection: 'row',
    paddingVertical: 13,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F2F0',
    marginBottom: 14,
  },

  detailBox: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 10,
    color: '#8A918A',
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  amountLabel: {
    fontSize: 10,
    color: '#8A918A',
    marginBottom: 3,
  },

  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },

  arrow: {
    fontSize: 28,
    fontWeight: '300',
    color: '#2E7D32',
  },

  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    paddingHorizontal: 28,
    paddingVertical: 42,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  emptyIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#7A827A',
    textAlign: 'center',
  },
});

export default DeliveriesScreen;