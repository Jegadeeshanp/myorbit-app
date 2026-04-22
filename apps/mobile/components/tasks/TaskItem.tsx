import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';

interface TaskItemProps {
  title: string;
  done?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
}

export default function TaskItem({ title, done, onToggle, onPress }: TaskItemProps) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#242424' }}>
      <TouchableOpacity onPress={onToggle} style={{ marginRight: 12 }}>
        {done ? <CheckCircle size={22} color="#10B981" /> : <Circle size={22} color="#D1D5DB" />}
      </TouchableOpacity>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: done ? '#9CA3AF' : '#FFFFFF', textDecorationLine: done ? 'line-through' : 'none' }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
