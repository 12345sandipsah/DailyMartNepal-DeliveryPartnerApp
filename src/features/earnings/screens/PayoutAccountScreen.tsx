import React, {useEffect, useState} from 'react';
import type {ReactNode} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import type {MainStackParamList} from '../../../app/navigation/MainNavigator';
import {
  getPartnerBankBranches,
  getPartnerBanks,
  getPartnerPayoutAccount,
  updatePartnerPayoutAccount,
} from '../../../shared/services/api';
import type {PartnerBank, PartnerBankBranch, PartnerPayoutAccount} from '../../../shared/services/api';

type Navigation = NativeStackNavigationProp<MainStackParamList, 'PayoutAccount'>;

const PayoutAccountScreen = () => {
  const navigation = useNavigation<Navigation>();
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [banks, setBanks] = useState<PartnerBank[]>([]);
  const [branches, setBranches] = useState<PartnerBankBranch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [picker, setPicker] = useState<'bank' | 'branch' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [accountType, setAccountType] = useState<'Savings' | 'Current'>('Savings');
  const [accountNumber, setAccountNumber] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<PartnerPayoutAccount['verificationStatus']>('unverified');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationMatchPercentage, setVerificationMatchPercentage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
    const load = async () => {
      const [banksResult, accountResult] = await Promise.allSettled([
        getPartnerBanks(),
        getPartnerPayoutAccount(),
      ]);
      if (!active) return;

      const availableBanks = banksResult.status === 'fulfilled' ? banksResult.value : [];
      if (banksResult.status === 'fulfilled') setBanks(availableBanks);
      else setError(banksResult.reason instanceof Error ? banksResult.reason.message : 'Unable to load the bank list.');

      if (accountResult.status === 'fulfilled') {
        const account = accountResult.value;
        setAccountHolderName(account.accountHolderName);
        setBankName(account.bankName);
        setBranchName(account.branchName);
        setBranchCode(account.branchCode || '');
        setAccountType(account.accountType);
        setAccountNumber(account.accountNumber);
        setVerificationStatus(account.verificationStatus || 'unverified');
        setVerificationMessage(account.verificationMessage || '');
        setVerificationMatchPercentage(account.verificationMatchPercentage ?? null);

        const savedBank = availableBanks.find(bank => normalize(bank.name) === normalize(account.bankName));
        if (savedBank) {
          setSelectedBankId(savedBank.id);
          setBankName(savedBank.name);
          try {
            const availableBranches = await getPartnerBankBranches(savedBank.id);
            if (!active) return;
            setBranches(availableBranches);
            const savedBranch = account.branchCode
              ? availableBranches.find(branch => branch.id === account.branchCode)
              : (() => {
                  const matches = availableBranches.filter(branch => normalize(branch.name) === normalize(account.branchName));
                  return matches.length === 1 ? matches[0] : undefined;
                })();
            if (savedBranch) {
              setBranchName(savedBranch.name);
              setBranchCode(savedBranch.id);
            } else if (account.branchName || account.branchCode) {
              setBranchName('');
              setBranchCode('');
            }
          } catch (branchError) {
            if (active) setError(branchError instanceof Error ? branchError.message : 'Unable to load this bank’s branches.');
          }
        }
      } else if (banksResult.status === 'fulfilled') {
        setError(accountResult.reason instanceof Error ? accountResult.reason.message : 'Unable to load bank details.');
      }

      if (active) setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  const chooseBank = async (bank: PartnerBank) => {
    setPicker(null);
    setSelectedBankId(bank.id);
    setBankName(bank.name);
    setBranchName('');
    setBranchCode('');
    setBranches([]);
    setBranchesLoading(true);
    setError('');
    try {
      setBranches(await getPartnerBankBranches(bank.id));
    } catch (branchError) {
      setError(branchError instanceof Error ? branchError.message : 'Unable to load this bank’s branches.');
    } finally {
      setBranchesLoading(false);
    }
  };

  const chooseBranch = (branch: PartnerBankBranch) => {
    setBranchName(branch.name);
    setBranchCode(branch.id);
    setPicker(null);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (!selectedBankId || !branchCode) {
        setError('Select a bank and one of its branches from the lists.');
        return;
      }
      const savedAccount = await updatePartnerPayoutAccount({accountHolderName, bankName, branchName, branchCode, accountType, accountNumber});
      setBankName(savedAccount.bankName);
      setBranchName(savedAccount.branchName);
      setBranchCode(savedAccount.branchCode);
      setVerificationStatus(savedAccount.verificationStatus);
      setVerificationMessage(savedAccount.verificationMessage || '');
      setVerificationMatchPercentage(savedAccount.verificationMatchPercentage ?? null);
      setNotice('Bank details saved. Payroll can use this account only after verification or admin approval.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save bank details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Salary bank account</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Where should your salary go?</Text>
          <Text style={styles.introText}>Enter the account details exactly as they appear at your bank. Only you and payroll administrators can access these details.</Text>
        </View>

        {loading ? <ActivityIndicator color="#078A45" style={styles.loader} /> : <View style={styles.formCard}>
          <Field label="Account holder name" value={accountHolderName} onChangeText={setAccountHolderName} placeholder="Name registered with the bank" autoCapitalize="words" />
          <DropdownField label="Bank name" value={bankName} placeholder="Select your bank" onPress={() => { setPickerSearch(''); setPicker('bank'); }} disabled={branchesLoading} />
          {!selectedBankId && bankName ? <Text style={styles.helper}>Your saved bank is not in the current list. Select your bank again to load its branches.</Text> : null}
          <DropdownField
            label="Branch"
            value={branchName ? `${branchName}${branchCode ? ` · ${branchCode}` : ''}` : ''}
            placeholder={!selectedBankId ? 'Select a bank first' : branchesLoading ? 'Loading branches…' : 'Select a branch'}
            onPress={() => { setPickerSearch(''); setPicker('branch'); }}
            disabled={!selectedBankId || branchesLoading || branches.length === 0}
            trailing={branchesLoading ? <ActivityIndicator size="small" color="#078A45" /> : undefined}
          />

          <Text style={styles.label}>Account type</Text>
          <View style={styles.typeRow}>
            {(['Savings', 'Current'] as const).map(type => (
              <Pressable key={type} onPress={() => setAccountType(type)} style={[styles.typeButton, accountType === type && styles.typeButtonActive]} accessibilityRole="button" accessibilityState={{selected: accountType === type}}>
                <Text style={[styles.typeText, accountType === type && styles.typeTextActive]}>{type}</Text>
              </Pressable>
            ))}
          </View>

          <Field label="Account number" value={accountNumber} onChangeText={setAccountNumber} placeholder="Enter your bank account number" keyboardType="default" autoCapitalize="characters" maxLength={34} />
          <Text style={styles.helper}>Your account number is encrypted before it is stored.</Text>
          {accountNumber ? <View style={[styles.verificationCard, verificationStatus === 'verified' || verificationStatus === 'admin_approved' ? styles.verificationGood : verificationStatus === 'review_required' || verificationStatus === 'service_unavailable' || verificationStatus === 'unverified' ? styles.verificationPending : styles.verificationBad]}>
            <Text style={styles.verificationTitle}>{verificationTitle(verificationStatus)}</Text>
            <Text style={styles.verificationBody}>{verificationMessage || 'Save your bank details to request verification.'}</Text>
            {verificationMatchPercentage !== null ? <Text style={styles.verificationMatch}>NCHL name match: {verificationMatchPercentage}%</Text> : null}
          </View> : null}
        </View>}

        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
        {notice ? <Text style={styles.notice} accessibilityRole="alert">{notice}</Text> : null}
        {!loading ? <Pressable style={[styles.saveButton, saving && styles.disabled]} onPress={save} disabled={saving} accessibilityRole="button">
          <Text style={styles.saveText}>{saving ? 'Saving and verifying…' : 'Save and verify bank details'}</Text>
        </Pressable> : null}
      </ScrollView>
      <SelectionModal
        visible={picker !== null}
        title={picker === 'bank' ? 'Select your bank' : 'Select a branch'}
        searchPlaceholder={picker === 'bank' ? 'Search bank names' : 'Search branches or codes'}
        search={pickerSearch}
        onSearch={setPickerSearch}
        onClose={() => setPicker(null)}
        options={picker === 'bank'
          ? banks.map(bank => ({id: bank.id, label: bank.name, detail: bank.shortCode}))
          : branches.map(branch => ({id: branch.id, label: branch.name, detail: `Branch code ${branch.id}`}))}
        selectedId={picker === 'bank' ? selectedBankId : branchCode}
        onSelect={option => {
          if (picker === 'bank') {
            const bank = banks.find(entry => entry.id === option.id);
            if (bank) void chooseBank(bank);
          } else {
            const branch = branches.find(entry => entry.id === option.id);
            if (branch) chooseBranch(branch);
          }
        }}
      />
    </SafeAreaView>
  );
};

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
};

const Field = ({label, value, onChangeText, placeholder, autoCapitalize = 'none', keyboardType = 'default', maxLength}: FieldProps) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9AA49C" autoCapitalize={autoCapitalize} autoCorrect={false} keyboardType={keyboardType} maxLength={maxLength} />
  </View>
);

type PickerOption = {id: string; label: string; detail?: string};

const verificationTitle = (status: PartnerPayoutAccount['verificationStatus']) => ({
  verified: 'Verified by NCHL',
  admin_approved: 'Approved after admin review',
  review_required: 'Admin review required',
  rejected: 'Bank account not verified',
  admin_rejected: 'Bank account rejected',
  service_unavailable: 'NCHL could not be reached',
  unverified: 'Not verified',
}[status]);

const DropdownField = ({label, value, placeholder, onPress, disabled = false, trailing}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  trailing?: ReactNode;
}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Pressable
      style={[styles.dropdown, disabled && styles.dropdownDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value || placeholder}`}
      accessibilityState={{disabled}}
    >
      <Text numberOfLines={1} style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>{value || placeholder}</Text>
      {trailing || <Text style={styles.dropdownChevron}>⌄</Text>}
    </Pressable>
  </View>
);

const SelectionModal = ({visible, title, searchPlaceholder, search, onSearch, onClose, options, selectedId, onSelect}: {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  search: string;
  onSearch: (value: string) => void;
  onClose: () => void;
  options: PickerOption[];
  selectedId: string;
  onSelect: (option: PickerOption) => void;
}) => {
  const filteredOptions = options.filter(option => `${option.label} ${option.detail || ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close selection" />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close list"><Text style={styles.modalClose}>×</Text></Pressable>
          </View>
          <TextInput
            style={styles.modalSearch}
            value={search}
            onChangeText={onSearch}
            placeholder={searchPlaceholder}
            placeholderTextColor="#829087"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={searchPlaceholder}
          />
          <FlatList
            data={filteredOptions}
            keyExtractor={option => option.id}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={24}
            renderItem={({item}) => (
              <Pressable
                style={styles.optionRow}
                onPress={() => onSelect(item)}
                accessibilityRole="button"
                accessibilityState={{selected: item.id === selectedId}}
              >
                <View style={styles.optionCopy}>
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  {item.detail ? <Text style={styles.optionDetail}>{item.detail}</Text> : null}
                </View>
                {item.id === selectedId ? <Text style={styles.optionSelected}>✓</Text> : null}
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.emptyOptions}>No matching results.</Text>}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#F7FAF8'},
  header: {minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8EFEA'},
  backButton: {width: 40, height: 42, justifyContent: 'center'},
  backText: {fontSize: 34, lineHeight: 38, color: '#185F47'},
  headerTitle: {flex: 1, textAlign: 'center', color: '#173E31', fontSize: 17, fontWeight: '800'},
  headerSpacer: {width: 40},
  content: {padding: 18, paddingBottom: 32},
  introCard: {padding: 18, borderRadius: 16, backgroundColor: '#EAF7EF', marginBottom: 16},
  introTitle: {fontSize: 18, fontWeight: '800', color: '#185F47'},
  introText: {marginTop: 7, color: '#53665B', fontSize: 13, lineHeight: 19},
  loader: {marginTop: 40},
  formCard: {padding: 18, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6ECE8'},
  field: {marginBottom: 17},
  label: {marginBottom: 7, color: '#38483E', fontSize: 13, fontWeight: '700'},
  input: {minHeight: 50, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1, borderColor: '#DCE4DF', color: '#202C25', backgroundColor: '#FFFFFF', fontSize: 15},
  dropdown: {minHeight: 50, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1, borderColor: '#DCE4DF', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  dropdownDisabled: {backgroundColor: '#F4F7F5'},
  dropdownText: {flex: 1, color: '#202C25', fontSize: 15},
  dropdownPlaceholder: {color: '#9AA49C'},
  dropdownChevron: {color: '#53665B', fontSize: 20, lineHeight: 22},
  typeRow: {flexDirection: 'row', gap: 10, marginBottom: 17},
  typeButton: {flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 9, borderWidth: 1, borderColor: '#DCE4DF', backgroundColor: '#FFFFFF'},
  typeButtonActive: {borderColor: '#078A45', backgroundColor: '#ECF8F0'},
  typeText: {fontSize: 13, fontWeight: '700', color: '#5A665E'},
  typeTextActive: {color: '#078A45'},
  helper: {marginTop: -6, color: '#77847B', fontSize: 11},
  verificationCard: {marginTop: 10, padding: 12, borderWidth: 1, borderRadius: 10},
  verificationGood: {borderColor: '#BFE5CB', backgroundColor: '#F0FAF3'},
  verificationPending: {borderColor: '#F0D9A6', backgroundColor: '#FFFAED'},
  verificationBad: {borderColor: '#EFC8C5', backgroundColor: '#FFF4F3'},
  verificationTitle: {color: '#234733', fontSize: 13, fontWeight: '800'},
  verificationBody: {marginTop: 4, color: '#58675D', fontSize: 11, lineHeight: 16},
  verificationMatch: {marginTop: 5, color: '#775B1C', fontSize: 11, fontWeight: '700'},
  error: {marginTop: 12, color: '#B13A38', fontSize: 13, lineHeight: 19},
  notice: {marginTop: 12, color: '#237542', fontSize: 13, lineHeight: 19},
  saveButton: {minHeight: 52, marginTop: 18, borderRadius: 11, backgroundColor: '#0BA359', alignItems: 'center', justifyContent: 'center'},
  disabled: {opacity: 0.55},
  saveText: {color: '#FFFFFF', fontSize: 16, fontWeight: '800'},
  modalBackdrop: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(18, 34, 25, 0.48)'},
  modalCard: {width: '100%', maxWidth: 500, height: '78%', padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF'},
  modalHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12},
  modalTitle: {flex: 1, color: '#173E31', fontSize: 18, fontWeight: '800'},
  modalClose: {paddingLeft: 12, color: '#53665B', fontSize: 28, lineHeight: 30},
  modalSearch: {minHeight: 46, paddingHorizontal: 12, marginBottom: 10, borderRadius: 10, borderWidth: 1, borderColor: '#DCE4DF', color: '#202C25', backgroundColor: '#F9FBF9', fontSize: 14},
  optionRow: {minHeight: 54, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E8EFEA', flexDirection: 'row', alignItems: 'center', gap: 12},
  optionCopy: {flex: 1},
  optionLabel: {color: '#26382D', fontSize: 14, fontWeight: '700'},
  optionDetail: {marginTop: 2, color: '#79877E', fontSize: 11},
  optionSelected: {color: '#078A45', fontSize: 19, fontWeight: '800'},
  emptyOptions: {paddingVertical: 24, textAlign: 'center', color: '#79877E', fontSize: 14},
});

export default PayoutAccountScreen;
