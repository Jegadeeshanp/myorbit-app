import React from 'react';
import { View, Text } from 'react-native';

interface EmptyStateProps {
  emoji?: string;
  title?: string;
  subtitle?: string;
}

export default function EmptyState({ emoji = '📭', title = 'Nothing here', subtitle }: EmptyStateProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</Text>
      <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB' }}>{title}</Text>
      {subtitle ? <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>{subtitle}</Text> : null}
    </View>
  );
}
