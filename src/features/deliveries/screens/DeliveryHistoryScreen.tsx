import React, {useCallback, useMemo, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faCheck,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import {getDeliveryHistory, OrderRecord} from '../../../shared/services/api';

type HistoryStatus = 'DELIVERED';

type HistoryDelivery = {
  id: string;
  customer: string;
  area: string;
  amount: string;
  payment: 'COD' | 'ONLINE';
  status: HistoryStatus;
  completedOn: string;
};

type HistoryFilter = 'ALL' | 'DELIVERED';

const mapOrderToHistoryDelivery = (order: OrderRecord): HistoryDelivery => {
  const location = order.deliveryLocation || {};
  const deliveredAt = order.deliveredAt || order.updatedAt || order.createdAt;
  return {
    id: `#${order.orderNumber}`,
    customer: location.name || order.customer?.fullName || 'Customer',
    area: [location.locality, location.cityName, location.formattedAddress]
      .filter(Boolean)
      .join(', ') || 'Address unavailable',
    amount: `NPR ${Number(order.total || 0).toLocaleString('en-IN')}`,
    payment: String(order.paymentMethod).toLowerCase() === 'cod' ? 'COD' : 'ONLINE',
    status: 'DELIVERED',
    completedOn: deliveredAt ? new Date(deliveredAt).toLocaleString() : 'Date unavailable',
  };
};

function DeliveryHistoryScreen() {
  const [selectedFilter, setSelectedFilter] = useState<HistoryFilter>('ALL');
  const [historyDeliveries, setHistoryDeliveries] = useState<HistoryDelivery[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getDeliveryHistory()
        .then(records => {
          if (active) setHistoryDeliveries(records.map(mapOrderToHistoryDelivery));
        })
        .catch(error => {
          if (active) {
            Alert.alert(
              'Delivery history unavailable',
              error instanceof Error ? error.message : 'Please retry.',
            );
          }
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const filteredDeliveries = useMemo(() => {
    if (selectedFilter === 'ALL') {
      return historyDeliveries;
    }

    return historyDeliveries.filter(
      delivery => delivery.status === selectedFilter,
    );
  }, [selectedFilter]);

  const deliveredCount = historyDeliveries.filter(
    delivery => delivery.status === 'DELIVERED',
  ).length;

  const getStatusStyle = () => {
    return {
      backgroundColor: '#E8F5E9',
      textColor: '#2E7D32',
      label: 'DELIVERED',
    };
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Delivery History</Text>
            <Text style={styles.subtitle}>
              Review your past delivery activity
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{historyDeliveries.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{deliveredCount}</Text>
            <Text style={styles.summaryLabel}>Delivered</Text>
          </View>

        </View>

        <View style={styles.filterContainer}>
          {(['ALL', 'DELIVERED'] as HistoryFilter[]).map(filter => {
            const isSelected = selectedFilter === filter;

            return (
              <Pressable
                key={filter}
                style={[
                  styles.filterButton,
                  isSelected && styles.filterButtonSelected,
                ]}
                onPress={() => setSelectedFilter(filter)}
                accessibilityRole="button"
                accessibilityState={{selected: isSelected}}>
                <Text
                  style={[
                    styles.filterText,
                    isSelected && styles.filterTextSelected,
                  ]}>
                  {filter === 'ALL' ? 'All' : filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedFilter === 'ALL'
              ? 'Past Deliveries'
              : 'Delivered Deliveries'}
          </Text>
          <Text style={styles.resultCount}>
            {filteredDeliveries.length} records
          </Text>
        </View>

        {filteredDeliveries.length > 0 ? (
          filteredDeliveries.map(delivery => {
            const statusStyle = getStatusStyle();

            return (
              <View key={delivery.id} style={styles.deliveryCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderLabel}>Order</Text>
                    <Text style={styles.orderId}>{delivery.id}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {backgroundColor: statusStyle.backgroundColor},
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        {color: statusStyle.textColor},
                      ]}>
                      {statusStyle.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.customerRow}>
                  <View style={styles.customerIcon}>
                    <FontAwesomeIcon icon={faUser} size={16} color="#2E7D32" />
                  </View>

                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{delivery.customer}</Text>
                    <Text style={styles.customerArea}>{delivery.area}</Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Payment</Text>
                    <Text style={styles.detailValue}>{delivery.payment}</Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>
                      {delivery.status === 'DELIVERED'
                        ? 'Delivered on'
                        : 'Updated on'}
                    </Text>
                    <Text style={styles.detailValue}>
                      {delivery.completedOn}
                    </Text>
                  </View>
                </View>

                <View style={styles.bottomRow}>
                  <View>
                    <Text style={styles.amountLabel}>Order Amount</Text>
                    <Text style={styles.amountValue}>{delivery.amount}</Text>
                  </View>
                  <Text style={styles.readOnlyLabel}>History</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <FontAwesomeIcon icon={faCheck} size={24} color="#2E7D32" />
            </View>

            <Text style={styles.emptyTitle}>No deliveries found</Text>
            <Text style={styles.emptyText}>
              There are no records in this category yet.
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 16,
    marginBottom: 18,
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
  failedValue: {
    color: '#C62828',
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  filterTextSelected: {
    color: '#FFFFFF',
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
    color: '#111827',
  },
  resultCount: {
    fontSize: 11,
    color: '#7A827A',
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
    paddingRight: 6,
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
  readOnlyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7A827A',
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

export default DeliveryHistoryScreen;
