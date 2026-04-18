import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface TodaySectionHeaderProps {
  label:     string;
  count:     number;
  color:     string;
  collapsed: boolean;
  onToggle:  () => void;
}

export default function TodaySectionHeader({
  label, count, color, collapsed, onToggle,
}: TodaySectionHeaderProps) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      className="flex-row items-center gap-2 px-4 py-3"
      activeOpacity={0.7}
    >
      <ChevronRight
        size={16}
        color="#9CA3AF"
        style={{ transform: [{ rotate: collapsed ? '0deg' : '90deg' }] }}
      />
      <Text className="text-sm font-semibold" style={{ color }}>{label}</Text>
      <View
        className="rounded-full px-2 py-0.5"
        style={{ backgroundColor: color + '20' }}
      >
        <Text className="text-xs font-medium" style={{ color }}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}
