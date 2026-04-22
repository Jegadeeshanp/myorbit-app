import React from 'react';
import { View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export default function Screen({ children, style }: ScreenProps) {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: '#111111' }, style]}>
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
}
