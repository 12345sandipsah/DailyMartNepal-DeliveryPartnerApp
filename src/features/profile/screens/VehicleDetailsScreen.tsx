import React from 'react';
import {Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faArrowLeft, faFileLines, faTruck} from '@fortawesome/free-solid-svg-icons';
import type {MainStackParamList} from '../../../app/navigation/MainNavigator';
import {useProfile} from '../context/ProfileContext';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'VehicleDetails'>;

const VehicleDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const {profile} = useProfile();
  const fields = [
    {label: 'Vehicle type', value: profile.vehicleType || 'Not assigned'},
    {label: 'Registration number', value: profile.vehicleNumber || 'Not assigned'},
    {label: 'Assigned warehouse', value: profile.warehouseName || 'Not assigned'},
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
          <FontAwesomeIcon icon={faArrowLeft} size={17} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Vehicle Details</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><FontAwesomeIcon icon={faTruck} size={24} color="#168447" /></View>
          <Text style={styles.title}>Your assigned vehicle</Text>
          <Text style={styles.subtitle}>Vehicle information is managed by your DailyMart warehouse administrator.</Text>
        </View>
        <View style={styles.card}>
          {fields.map((field, index) => (
            <View key={field.label} style={[styles.field, index > 0 && styles.separator]}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <Text style={styles.fieldValue}>{field.value}</Text>
            </View>
          ))}
        </View>
        <Pressable style={styles.documentsLink} onPress={() => navigation.navigate('Documents')} accessibilityRole="button">
          <FontAwesomeIcon icon={faFileLines} size={18} color="#168447" />
          <Text style={styles.documentsText}>View vehicle registration and insurance documents</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#F7F9F7'},
  header: {height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5EAE5'},
  backButton: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {flex: 1, textAlign: 'center', color: '#1F2937', fontSize: 18, fontWeight: '700'},
  headerSpacer: {width: 42},
  content: {padding: 16, paddingBottom: 32},
  hero: {alignItems: 'center', padding: 22, borderRadius: 18, backgroundColor: '#EAF6EC'},
  heroIcon: {width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF'},
  title: {marginTop: 13, color: '#1F2937', fontSize: 17, fontWeight: '700'},
  subtitle: {marginTop: 6, color: '#667066', fontSize: 11, lineHeight: 17, textAlign: 'center'},
  card: {marginTop: 16, paddingHorizontal: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EAE5'},
  field: {paddingVertical: 15},
  separator: {borderTopWidth: 1, borderTopColor: '#EEF0EE'},
  fieldLabel: {fontSize: 11, color: '#6B7280'},
  fieldValue: {marginTop: 5, fontSize: 14, fontWeight: '700', color: '#1F2937'},
  documentsLink: {marginTop: 14, padding: 15, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EAE5'},
  documentsText: {flex: 1, fontSize: 12, color: '#334155'},
  arrow: {fontSize: 24, color: '#168447'},
});

export default VehicleDetailsScreen;
