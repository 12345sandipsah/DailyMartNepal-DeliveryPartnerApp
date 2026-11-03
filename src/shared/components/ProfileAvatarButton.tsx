import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';

type ProfileAvatarButtonProps = {
  imageUri?: string | null;
  name?: string | null;
  onPress: () => void;
  size?: number;
};

const getInitials = (name?: string | null) =>
  name?.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'DP';

const ProfileAvatarButton = ({
  imageUri,
  name,
  onPress,
  size = 46,
}: ProfileAvatarButtonProps) => (
  <Pressable
    style={({pressed}) => [
      styles.avatar,
      {width: size, height: size, borderRadius: size / 2},
      pressed && styles.pressed,
    ]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel="Open profile">
    {imageUri ? (
      <Image
        source={{uri: imageUri}}
        style={{width: size, height: size, borderRadius: size / 2}}
        resizeMode="cover"
      />
    ) : (
      <Text style={styles.initials}>{getInitials(name)}</Text>
    )}
    <View style={styles.onlineDot} />
  </Pressable>
);

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
    backgroundColor: '#E4F0E8',
  },
  pressed: {
    opacity: 0.82,
  },
  initials: {
    color: '#07553E',
    fontSize: 14,
    fontWeight: '800',
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
});

export default ProfileAvatarButton;
