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
  faList,
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
import {getPartnerEarnings, getPartnerPayrollHistory} from '../../../shared/services/api';
import type {PartnerEarnings, PartnerPayslip} from '../../../shared/services/api';
import ProfileAvatarButton from '../../../shared/components/ProfileAvatarButton';
import PartnerBottomNavigation from '../../../shared/components/PartnerBottomNavigation';
import PartnerBrand from '../../../shared/components/PartnerBrand';
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

  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodType>('Transactions');

  const [summaryPeriod, setSummaryPeriod] = useState('This Month');
  const [earnings, setEarnings] = useState<PartnerEarnings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [payslips, setPayslips] = useState<PartnerPayslip[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(true);
  const [payrollError, setPayrollError] = useState('');

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

  useEffect(() => {
    let active = true;
    getPartnerPayrollHistory()
      .then(rows => { if (active) setPayslips(rows); })
      .catch(error => {
        if (active) setPayrollError(error instanceof Error ? error.message : 'Unable to load monthly salary statements.');
      })
      .finally(() => { if (active) setPayrollLoading(false); });
    return () => { active = false; };
  }, []);

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* HEADER */}

      <View style={styles.header}>
        <PartnerBrand />

        <View style={styles.headerActions}>
          <Pressable
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
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

          <ProfileAvatarButton
            imageUri={profile.profileImage?.url}
            name={profile.fullName}
            onPress={handleGoProfile}
          />
        </View>
      </View>

      {/* SCROLLABLE CONTENT */}

      <ScrollView
        style={styles.scrollView}
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

        <View style={styles.payrollCard}>
          <View style={styles.payrollHeader}>
            <View style={styles.payrollHeading}>
              <Text style={styles.payrollTitle}>Monthly salary</Text>
              <Text style={styles.payrollSubtitle}>Admin-approved payslips and transfer status</Text>
            </View>
            <Pressable style={styles.bankButton} onPress={() => navigation.navigate('PayoutAccount')} accessibilityRole="button">
              <Text style={styles.bankButtonText}>Bank details</Text>
            </Pressable>
          </View>
          {payrollError ? <Text style={styles.payrollError}>{payrollError}</Text> : null}
          {payrollLoading ? <Text style={styles.payrollEmpty}>Loading salary statements…</Text> : payslips.length ? payslips.map((payslip, index) => (
            <View key={payslip.period} style={[styles.payslipRow, index < payslips.length - 1 && styles.payslipBorder]}>
              <View style={styles.payslipHeading}>
                <Text style={styles.payslipPeriod}>{new Date(`${payslip.period}-15T12:00:00`).toLocaleDateString('en-IN', {month: 'long', year: 'numeric'})}</Text>
                <Text style={[styles.payslipStatus, payslip.paymentStatus === 'paid' ? styles.payslipPaid : payslip.paymentStatus === 'failed' ? styles.payslipFailed : styles.payslipPending]}>
                  {payslip.paymentStatus === 'paid' ? 'Paid' : payslip.paymentStatus === 'failed' ? 'Transfer failed · contact admin' : 'Approved · awaiting transfer'}
                </Text>
              </View>
              <Text style={styles.payslipDetail}>Payment for: {payslip.paymentPurpose}</Text>
              {payslip.invoiceNumber ? <Text style={styles.payslipDetail}>Receipt: {payslip.invoiceNumber}</Text> : null}
              {payslip.paidAt ? <Text style={styles.payslipDetail}>Paid on: {new Date(payslip.paidAt).toLocaleString('en-IN')}</Text> : null}
              {payslip.bankAccount?.bankName ? <Text style={styles.payslipDetail}>Paid to: {payslip.bankAccount.accountHolderName} · {payslip.bankAccount.bankName} · •••• {payslip.bankAccount.accountNumberLast4}</Text> : null}
              {[payslip.countryName, payslip.cityName, payslip.warehouseName].some(Boolean) ? <Text style={styles.payslipDetail}>Work location: {[payslip.countryName, payslip.cityName, payslip.warehouseName].filter(Boolean).join(' · ')}</Text> : null}
              <View style={styles.payslipAmounts}>
                <View><Text style={styles.payslipLabel}>Gross</Text><Text style={styles.payslipValue}>{formatNPR(payslip.grossPay)}</Text></View>
                <View><Text style={styles.payslipLabel}>Total deductions</Text><Text style={styles.payslipValue}>{formatNPR(payslip.incomeTax + payslip.employeeSsf + payslip.otherDeductions + payslip.attendanceDeduction)}</Text></View>
                <View style={styles.payslipNet}><Text style={styles.payslipLabel}>Net</Text><Text style={styles.payslipNetValue}>{formatNPR(payslip.netPay)}</Text></View>
              </View>
              <Text style={styles.payslipDetail}>Salary: Basic {formatNPR(payslip.basicPay)} · Allowance {formatNPR(payslip.allowance)} · Bonus {formatNPR(payslip.incentive)} · Festival expense {formatNPR(payslip.festivalExpense)}</Text>
              {payslip.incentiveReason ? <Text style={styles.payslipDetail}>Bonus / incentive reason: {payslip.incentiveReason}</Text> : null}
              <Text style={styles.payslipDetail}>Attendance: {payslip.daysPresent}/{payslip.scheduledWorkDays} days present · Paid leave {payslip.paidLeaveDays} days · Unpaid leave {payslip.unpaidLeaveDays} days · Deduction {formatNPR(payslip.attendanceDeduction)}</Text>
              {payslip.attendanceNote ? <Text style={styles.payslipDetail}>Attendance record: {payslip.attendanceNote}</Text> : null}
              <Text style={styles.payslipDetail}>Overtime: {payslip.overtimeHours} hours total · Max/day {payslip.maxDailyOvertimeHoursRecorded} hours · Max/week {payslip.maxWeeklyOvertimeHoursRecorded} hours · Pay {formatNPR(payslip.overtimePay)}</Text>
              <Text style={styles.payslipDetail}>Deductions: Employee SSF {formatNPR(payslip.employeeSsf)} on base {formatNPR(payslip.ssfBasePay)} · Income tax {formatNPR(payslip.incomeTax)} · Other {formatNPR(payslip.otherDeductions)}</Text>
              {payslip.otherDeductions > 0 ? <Text style={styles.payslipDetail}>Other deduction reason: {payslip.deductionCategory?.replace(/_/g, ' ')} · {payslip.deductionReason}</Text> : null}
              <Text style={styles.payslipDetail}>Employer SSF contribution: {formatNPR(payslip.employerSsf)} · Estimated annual taxable income: {formatNPR(payslip.taxableAnnualIncome)} · Projected annual tax: {formatNPR(payslip.projectedAnnualTax)}</Text>
              {payslip.transferReference ? <Text style={styles.payslipReference}>Transfer reference: {payslip.transferReference}</Text> : null}
              {payslip.paymentFailureReason ? <Text style={styles.payrollError}>Transfer issue: {payslip.paymentFailureReason}</Text> : null}
            </View>
          )) : <Text style={styles.payrollEmpty}>Your approved monthly salary statements will appear here.</Text>}
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

      <PartnerBottomNavigation activeRoute="Earnings" />
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
// STYLES
// ======================================================

const styles = StyleSheet.create({
  // Root

  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollView: {
    flex: 1,
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

  payrollCard: {
    marginTop: 14,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5ECE7',
  },

  payrollHeader: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  payrollHeading: {flex: 1},
  payrollTitle: {fontSize: 15, fontWeight: '800', color: '#26372C'},
  payrollSubtitle: {marginTop: 4, fontSize: 10, lineHeight: 15, color: '#77827A'},
  bankButton: {paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#EAF7EF'},
  bankButtonText: {color: '#087B40', fontSize: 10, fontWeight: '800'},
  payslipRow: {paddingVertical: 13},
  payslipBorder: {borderBottomWidth: 1, borderBottomColor: '#EDF1EE'},
  payslipHeading: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  payslipPeriod: {fontSize: 12, fontWeight: '800', color: '#26372C'},
  payslipStatus: {fontSize: 9, fontWeight: '700'},
  payslipDetail: {marginTop: 7, fontSize: 9, lineHeight: 14, color: '#647168'},
  payslipPaid: {color: '#168448'},
  payslipPending: {color: '#9A6A13'},
  payslipFailed: {color: '#B42318'},
  payslipAmounts: {flexDirection: 'row', justifyContent: 'space-between', gap: 5, marginTop: 11},
  payslipNet: {alignItems: 'flex-end'},
  payslipLabel: {fontSize: 9, color: '#7B857E'},
  payslipValue: {marginTop: 3, fontSize: 10, fontWeight: '700', color: '#49574E'},
  payslipNetValue: {marginTop: 3, fontSize: 11, fontWeight: '800', color: '#078A45'},
  payslipReference: {marginTop: 8, fontSize: 9, color: '#738078'},
  payrollEmpty: {paddingVertical: 16, color: '#758179', fontSize: 11, lineHeight: 17, textAlign: 'center'},
  payrollError: {paddingBottom: 12, color: '#B42318', fontSize: 11},

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

});

export default EarningsScreen;
