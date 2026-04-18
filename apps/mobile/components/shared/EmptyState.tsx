import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon:     LucideIcon;
  title:    string;
  subtitle: string;
}

export default function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
        <Icon size={24} color="#94A3B8" />
      </View>
      <Text className="text-sm font-medium text-gray-600">{title}</Text>
      <Text className="mt-1 text-xs text-gray-400">{subtitle}</Text>
    </View>
  );
}
