import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';

type PartnerLogoProps = {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

const PartnerLogo = ({width = 180, height = 180, style}: PartnerLogoProps) => {
  const borderRadius = Math.min(width, height) * 0.29;

  return (
    <View style={[styles.clip, {width, height, borderRadius}, style]}>
      <Image
        source={require('../../assets/dm-mark.png')}
        style={{width, height}}
        resizeMode="cover"
        accessibilityLabel="DailyMart logo"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  clip: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default PartnerLogo;
