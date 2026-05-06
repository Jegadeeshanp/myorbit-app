import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';
import { useTheme } from '@/lib/themeStore';

interface TaskItemProps {
  title: string;
  done?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
}

export default function TaskItem({ title, done, onToggle, onPress }: TaskItemProps) {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.cardBg, borderBottomWidth: 1, borderBottomColor: theme.surfaceAlt }}>
      <TouchableOpacity onPress={onToggle} style={{ marginRight: 12 }}>
        {done ? <CheckCircle size={22} color="#10B981" /> : <Circle size={22} color={theme.textSec} />}
      </TouchableOpacity>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: done ? theme.mutedText : theme.text, textDecorationLine: done ? 'line-through' : 'none' }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
