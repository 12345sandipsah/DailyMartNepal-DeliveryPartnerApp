import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';
import PartnerLogo from './PartnerLogo';

type PartnerBrandProps = {
  style?: StyleProp<ViewStyle>;
};

const PartnerBrand = ({style}: PartnerBrandProps) => (
  <View style={[styles.container, style]}>
    <PartnerLogo width={46} height={46} style={styles.logo} />
    <View style={styles.copy}>
      <Text style={styles.name} numberOfLines={1}>
        DailyMart
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        Delivery Partner
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  logo: {
    marginRight: 7,
  },
  copy: {
    flexShrink: 1,
  },
  name: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '800',
    color: '#07553E',
  },
  subtitle: {
    marginTop: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    color: '#39725D',
  },
});

export default PartnerBrand;
