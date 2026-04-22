import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function LoadingSkeleton() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
}
