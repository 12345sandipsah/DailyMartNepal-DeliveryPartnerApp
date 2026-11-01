import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowTrendUp,
  faBell,
  faChevronDown,
  faCircleInfo,
  faCoins,
  faGift,
  faHandHoldingDollar,
  faHouse,
  faList,
  faUser,
  faTruck,
} from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  Alert,
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
import {getPartnerEarnings} from '../../../shared/services/api';
import type {PartnerEarnings} from '../../../shared/services/api';
import {useProfile} from '../../profile/context/ProfileContext';

// ======================================================
// TYPES
// ======================================================

type EarningsNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Earnings'
>;

type TransactionType = 'delivery' | 'tip' | 'bonus';

type PeriodType = 'Transactions' | 'Daily' | 'Weekly' | 'Monthly';

type Transaction = {
  id: string;
  type: TransactionType;
  title: string;
  subtitle: string;
  amount: number;
  label: string;
  date: string;
};

type SummaryCardProps = {
  type: TransactionType;
  value: string;
  label: string;
};

type TransactionRowProps = {
  transaction: Transaction;
  isLast: boolean;
};

type BottomNavItemProps = {
  icon: IconProp;
  label: string;
  active: boolean;
  notification?: boolean;
  onPress: () => void;
};

type WeeklyBarStyle =
  | 'barMonday'
  | 'barTuesday'
  | 'barWednesday'
  | 'barThursday'
  | 'barFriday'
  | 'barSaturday'
  | 'barSunday';

type WeeklyBar = {
  day: string;
  style: WeeklyBarStyle;
  active: boolean;
};

// ======================================================
// The payout ledger has no daily chart endpoint. Do not draw synthetic bars.
// ======================================================

const WEEKLY_BARS: WeeklyBar[] = [];

// ======================================================
// HELPERS
// ======================================================

const formatNPR = (amount: number): string =>
  `NPR ${amount.toLocaleString('en-IN')}`;

const getTransactionIcon = (type: TransactionType): IconProp => {
  switch (type) {
    case 'delivery':
      return faTruck;
    case 'tip':
      return faHandHoldingDollar;
    case 'bonus':
      return faGift;
    default:
      return faCoins;
  }
};

// ======================================================
// EARNINGS SCREEN
// ======================================================

const EarningsScreen = () => {
  const navigation = useNavigation<EarningsNavigationProp>();
  const {profile} = useProfile();
  const initials = profile.fullName.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'DP';

  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodType>('Transactions');

  const [summaryPeriod, setSummaryPeriod] = useState('This Month');
  const [earnings, setEarnings] = useState<PartnerEarnings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const apiPeriod = summaryPeriod === 'Today'
    ? 'today'
    : summaryPeriod === 'This Week'
      ? 'week'
      : summaryPeriod === 'All Time'
        ? 'all'
        : 'month';

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');
    getPartnerEarnings(apiPeriod)
      .then(result => { if (active) setEarnings(result); })
      .catch(error => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load confirmed payout records.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [apiPeriod]);

  // ----------------------------------------------------
  const filteredTransactions = useMemo(() => {
    const ledgerRows: Transaction[] = (earnings?.transactions || []).map(transaction => ({
      id: transaction.id,
      type: 'delivery',
      title: transaction.reference || transaction.transferReference || 'Delivery partner payout',
      subtitle: [transaction.notes, transaction.transferReference && `Transfer: ${transaction.transferReference}`]
        .filter(Boolean)
        .join(' · ') || 'Recorded by DailyMart finance',
      amount: transaction.amount,
      label: 'Paid',
      date: transaction.date,
    }));
    if (selectedPeriod === 'Transactions') {
      return ledgerRows;
    }

    if (ledgerRows.length === 0) {
      return [];
    }

    const newestTimestamp = Math.max(
      ...ledgerRows.map(transaction =>
        new Date(transaction.date).getTime(),
      ),
    );

    const newestDate = new Date(newestTimestamp);
    newestDate.setHours(0, 0, 0, 0);

    let daysBack = 0;

    switch (selectedPeriod) {
      case 'Daily':
        daysBack = 0;
        break;
      case 'Weekly':
        daysBack = 6;
        break;
      case 'Monthly':
        daysBack = 29;
        break;
      default:
        daysBack = 0;
    }

    const startDate = new Date(newestDate);
    startDate.setDate(startDate.getDate() - daysBack);

    return ledgerRows.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      transactionDate.setHours(0, 0, 0, 0);

      return (
        transactionDate >= startDate &&
        transactionDate <= newestDate
      );
    });
  }, [earnings, selectedPeriod]);

  const totalEarnings = earnings?.paidOutInPeriod;

  // ----------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  const handleGoDeliveries = () => {
    navigation.navigate('Deliveries');
  };

  const handleGoNotifications = () => {
    navigation.navigate('Notifications');
  };

  const handleGoProfile = () => {
    navigation.navigate('Profile');
  };

  // ----------------------------------------------------
  // SUMMARY PERIOD SELECTOR
  // ----------------------------------------------------

  const handleSelectSummaryPeriod = () => {
    Alert.alert('Earnings Period', 'Choose a period to view.', [
      {
        text: 'Today',
        onPress: () => setSummaryPeriod('Today'),
      },
      {
        text: 'This Week',
        onPress: () => setSummaryPeriod('This Week'),
      },
      {
        text: 'This Month',
        onPress: () => setSummaryPeriod('This Month'),
      },
      {text: 'All Time', onPress: () => setSummaryPeriod('All Time')},
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  // ----------------------------------------------------
  // ====================================================
  // RENDER
  // ====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={styles.leafIcon}>
            <Text style={styles.leafIconText}>◢</Text>
          </View>

          <View>
            <Text style={styles.brandText}>
              Daily
              <Text style={styles.brandGreen}>Mart</Text>
            </Text>

            <Text style={styles.nepalText}>Nepal</Text>
            <Text style={styles.partnerText}>Delivery Partner</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.notificationButton}
            onPress={handleGoNotifications}
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
          >
            <FontAwesomeIcon
              icon={faBell}
              size={19}
              color="#263238"
            />
            <View style={styles.notificationDot} />
          </Pressable>

          <Pressable
            style={styles.avatar}
            onPress={handleGoProfile}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <Text style={styles.avatarText}>{initials}</Text>
            <View style={styles.onlineDot} />
          </Pressable>
        </View>
      </View>

      {/* SCROLLABLE CONTENT */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* TITLE */}

        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Earnings</Text>

          <Pressable
            style={styles.periodButton}
            onPress={handleSelectSummaryPeriod}
            accessibilityRole="button"
            accessibilityLabel={`Earnings period: ${summaryPeriod}`}
          >
            <Text style={styles.periodText}>{summaryPeriod}</Text>
            <FontAwesomeIcon
              icon={faChevronDown}
              size={12}
              color="#596164"
            />
          </Pressable>
        </View>

        {loadError ? <Text style={styles.loadError}>{loadError}</Text> : null}

        {/* TOTAL EARNINGS */}

        <View style={styles.totalCard}>
          <View style={styles.totalCardLeft}>
            <Text style={styles.totalLabel}>Paid out</Text>

            <Text style={styles.totalAmount}>
              {isLoading || totalEarnings === undefined ? 'NPR —' : formatNPR(totalEarnings)}
            </Text>

            <View style={styles.growthRow}>
              <View style={styles.growthBadge}>
                <FontAwesomeIcon
                  icon={faArrowTrendUp}
                  size={11}
                  color="#078A45"
                />
                <Text style={styles.growthText}>{isLoading ? '…' : String(earnings?.periodPayoutCount || 0)}</Text>
              </View>

              <Text style={styles.growthDescription}>
                confirmed payouts
              </Text>
            </View>
          </View>

          {/* WEEKLY CHART */}

          <View style={styles.chartContainer}>
            <View style={styles.barChart}>
              {WEEKLY_BARS.map(item => (
                <View key={item.day} style={styles.barColumn}>
                  <View
                    style={[
                      styles.bar,
                      styles[item.style],
                      item.active && styles.activeBar,
                    ]}
                  />
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              ))}
              {WEEKLY_BARS.length === 0 && (
                <Text style={styles.emptyTransactionsText}>Ledger total</Text>
              )}
            </View>
          </View>
        </View>

        {/* SUMMARY CARDS */}

        <View style={styles.summaryRow}>
          <SummaryCard
            type="delivery"
            value={earnings ? formatNPR(earnings.paidOutInPeriod) : '—'}
            label="Paid this period"
          />

          <SummaryCard
            type="tip"
            value={earnings ? String(earnings.periodPayoutCount) : '—'}
            label="Transfers"
          />

          <SummaryCard
            type="bonus"
            value={earnings ? formatNPR(earnings.paidOutAllTime) : '—'}
            label="Paid all time"
          />
        </View>

        {/* TRANSACTION PERIOD TABS */}

        <View style={styles.tabsContainer}>
          {(
            ['Transactions', 'Daily', 'Weekly', 'Monthly'] as PeriodType[]
          ).map(period => {
            const isActive = selectedPeriod === period;

            return (
              <Pressable
                key={period}
                style={[
                  styles.tabButton,
                  isActive && styles.tabButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive && styles.tabTextActive,
                  ]}
                >
                  {period}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* TRANSACTION HISTORY */}

        <View style={styles.transactionCard}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                isLast={index === filteredTransactions.length - 1}
              />
            ))
          ) : (
            <View style={styles.emptyTransactions}>
              <FontAwesomeIcon
                icon={faList}
                size={24}
                color="#9AA49C"
              />
              <Text style={styles.emptyTransactionsText}>
                No transactions found for this period.
              </Text>
            </View>
          )}
        </View>

        {/* PAYOUT INFORMATION */}

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <FontAwesomeIcon
              icon={faCircleInfo}
              size={17}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Earnings Information
            </Text>

            <Text style={styles.infoText}>
              Only completed payouts recorded by DailyMart finance appear here. {earnings?.payoutRateConfigured ? 'Your payout rate is configured.' : 'A wallet balance and self-service withdrawal are not enabled for this account.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* FIXED BOTTOM NAVIGATION */}

      <View style={styles.bottomNav}>
        <BottomNavItem
          icon={faHouse}
          label="Home"
          active={false}
          onPress={handleGoHome}
        />

        <BottomNavItem
          icon={faTruck}
          label="Deliveries"
          active={false}
          onPress={handleGoDeliveries}
        />

        <BottomNavItem
          icon={faCoins}
          label="Earnings"
          active={true}
          onPress={() => {}}
        />

        <BottomNavItem
          icon={faList}
          label="Notifications"
          active={false}
          notification
          onPress={handleGoNotifications}
        />

        <BottomNavItem
          icon={faUser}
          label="Profile"
          active={false}
          onPress={handleGoProfile}
        />
      </View>
    </SafeAreaView>
  );
};

// ======================================================
// SUMMARY CARD
// ======================================================

const SummaryCard = ({
  type,
  value,
  label,
}: SummaryCardProps) => {
  const icon = getTransactionIcon(type);

  const iconStyle =
    type === 'delivery'
      ? styles.summaryIconDelivery
      : type === 'tip'
        ? styles.summaryIconTip
        : styles.summaryIconBonus;

  const iconColor =
    type === 'delivery'
      ? '#078A45'
      : type === 'tip'
        ? '#2478D4'
        : '#B77912';

  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, iconStyle]}>
        <FontAwesomeIcon
          icon={icon}
          size={17}
          color={iconColor}
        />
      </View>

      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
};

// ======================================================
// TRANSACTION ROW
// ======================================================

const TransactionRow = ({
  transaction,
  isLast,
}: TransactionRowProps) => {
  const { type, title, subtitle, amount, label } = transaction;

  const icon = getTransactionIcon(type);

  const iconStyle =
    type === 'delivery'
      ? styles.transactionIconDelivery
      : type === 'tip'
        ? styles.transactionIconTip
        : styles.transactionIconBonus;

  const iconColor =
    type === 'delivery'
      ? '#078A45'
      : type === 'tip'
        ? '#E88A17'
        : '#6A45D7';

  return (
    <View
      style={[
        styles.transactionRow,
        !isLast && styles.transactionRowBorder,
      ]}
    >
      <View style={[styles.transactionIcon, iconStyle]}>
        <FontAwesomeIcon
          icon={icon}
          size={17}
          color={iconColor}
        />
      </View>

      <View style={styles.transactionContent}>
        <Text style={styles.transactionTitle}>{title}</Text>

        <Text
          style={styles.transactionSubtitle}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      </View>

      <View style={styles.transactionAmountContainer}>
        <Text style={styles.transactionAmount}>
          + {formatNPR(amount)}
        </Text>

        <Text style={styles.transactionType}>{label}</Text>
      </View>
    </View>
  );
};

// ======================================================
// BOTTOM NAVIGATION ITEM
// ======================================================

const BottomNavItem = ({
  icon,
  label,
  active,
  notification,
  onPress,
}: BottomNavItemProps) => {
  return (
    <Pressable
      style={styles.bottomNavItem}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <View style={styles.bottomIconWrapper}>
        <FontAwesomeIcon
          icon={icon}
          size={20}
          color={active ? '#078A45' : '#7B8588'}
        />

        {notification && (
          <View style={styles.bottomNotificationDot} />
        )}
      </View>

      <Text
        style={[
          styles.bottomLabel,
          active && styles.bottomLabelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  // Root

  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header

  header: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  leafIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 3,
    marginTop: 2,
  },

  leafIconText: {
    fontSize: 28,
    color: '#149447',
    transform: [{ rotate: '-25deg' }],
  },

  brandText: {
    fontSize: 27,
    lineHeight: 29,
    fontWeight: '800',
    color: '#185F47',
  },

  brandGreen: {
    color: '#18A84D',
  },

  nepalText: {
    marginTop: -2,
    marginLeft: 83,
    fontSize: 15,
    lineHeight: 16,
    fontWeight: '700',
    color: '#185F47',
  },

  partnerText: {
    marginTop: 2,
    fontSize: 13,
    color: '#53715F',
    fontWeight: '500',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  notificationButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 10,
  },

  notificationDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F04444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E4F0E8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#07553E',
  },

  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#21B34B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Scroll content

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },

  // Title

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 14,
  },

  pageTitle: {
    fontSize: 31,
    fontWeight: '800',
    color: '#111827',
  },

  periodButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 23,
    backgroundColor: '#EAF8EE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  periodText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E2A22',
  },

  // Total earnings card

  totalCard: {
    minHeight: 194,
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#069541',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 14,
  },

  totalCardLeft: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },

  totalLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  totalAmount: {
    marginTop: 4,
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    flexWrap: 'wrap',
  },

  growthBadge: {
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 18,
    backgroundColor: '#E7FFF0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  growthText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#149447',
  },

  growthDescription: {
    marginLeft: 9,
    fontSize: 12,
    color: '#E8FFF0',
  },

  // Weekly chart

  chartContainer: {
    width: 152,
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
    paddingLeft: 6,
  },

  barChart: {
    height: 142,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  bar: {
    width: 12,
    borderRadius: 4,
    backgroundColor: '#70C98E',
    opacity: 0.85,
  },

  barMonday: {
    height: 42,
  },

  barTuesday: {
    height: 28,
  },

  barWednesday: {
    height: 36,
  },

  barThursday: {
    height: 48,
  },

  barFriday: {
    height: 62,
  },

  barSaturday: {
    height: 48,
  },

  barSunday: {
    height: 76,
  },

  activeBar: {
    backgroundColor: '#FFFFFF',
    opacity: 1,
  },

  barLabel: {
    marginTop: 7,
    fontSize: 8,
    color: '#E5F8EA',
    fontWeight: '600',
  },

  // Summary cards

  summaryRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },

  summaryCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#EFF2EF',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  summaryIconDelivery: {
    backgroundColor: '#E2F6E8',
  },

  summaryIconTip: {
    backgroundColor: '#E7F0FF',
  },

  summaryIconBonus: {
    backgroundColor: '#FFF0DD',
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  summaryLabel: {
    marginTop: 3,
    fontSize: 10,
    color: '#68706A',
    textAlign: 'center',
  },

  // Wallet

  walletCard: {
    minHeight: 94,
    borderRadius: 18,
    paddingHorizontal: 15,
    backgroundColor: '#EAF8EE',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C7F0D2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  walletInfo: {
    flex: 1,
    marginLeft: 12,
  },

  walletLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B756D',
  },

  walletAmount: {
    marginTop: 3,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },

  withdrawButton: {
    minHeight: 48,
    paddingHorizontal: 13,
    borderRadius: 16,
    backgroundColor: '#079741',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  withdrawText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Period tabs

  tabsContainer: {
    minHeight: 56,
    padding: 4,
    borderRadius: 17,
    backgroundColor: '#F1F3F4',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  tabButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },

  tabButtonActive: {
    backgroundColor: '#079741',
  },

  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#69706B',
    textAlign: 'center',
  },

  tabTextActive: {
    color: '#FFFFFF',
  },

  // Transaction history

  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF1EE',
    overflow: 'hidden',
  },

  transactionRow: {
    minHeight: 82,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },

  transactionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0EE',
  },

  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  transactionIconDelivery: {
    backgroundColor: '#E2F6E8',
  },

  transactionIconTip: {
    backgroundColor: '#FFF0DD',
  },

  transactionIconBonus: {
    backgroundColor: '#EEE7FF',
  },

  transactionContent: {
    flex: 1,
    paddingRight: 8,
  },

  transactionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },

  transactionSubtitle: {
    marginTop: 5,
    fontSize: 9,
    lineHeight: 14,
    color: '#727A74',
  },

  transactionAmountContainer: {
    minWidth: 76,
    alignItems: 'flex-end',
  },

  transactionAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#149447',
  },

  transactionType: {
    marginTop: 3,
    fontSize: 9,
    color: '#727A74',
  },

  // Empty transactions

  emptyTransactions: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },

  emptyTransactionsText: {
    fontSize: 12,
    color: '#68706A',
    textAlign: 'center',
  },

  // Earnings information

  infoCard: {
    marginTop: 14,
    marginBottom: 4,
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#F0F7F0',
    borderWidth: 1,
    borderColor: '#D8EAD8',
    flexDirection: 'row',
  },

  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#243126',
  },

  infoText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    color: '#6B756D',
  },

  loadError: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    color: '#B42318',
    backgroundColor: '#FFF1F0',
    fontSize: 12,
  },

  // Bottom navigation

  bottomNav: {
    minHeight: 70,
    paddingHorizontal: 7,
    paddingTop: 7,
    paddingBottom: 5,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEFEC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomIconWrapper: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomLabel: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '600',
    color: '#69716B',
  },

  bottomLabelActive: {
    color: '#079741',
    fontWeight: '800',
  },

  bottomNotificationDot: {
    position: 'absolute',
    top: 0,
    right: 1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F44336',
  },
});

export default EarningsScreen;
