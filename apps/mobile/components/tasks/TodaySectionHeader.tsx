import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface TodaySectionHeaderProps {
  title: string;
  count?: number;
  color?: string;
  bg?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function TodaySectionHeader({ title, count, color = '#10B981', bg = '#10B98122', collapsed, onToggle }: TodaySectionHeaderProps) {
  return (
    <TouchableOpacity onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color }}>{title}</Text>
        {count !== undefined && (
          <View style={{ borderRadius: 20, paddingHorizontal: 6, backgroundColor: color + '33' }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color }}>{count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
