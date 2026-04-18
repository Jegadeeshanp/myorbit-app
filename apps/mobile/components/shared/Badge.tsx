import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  color: string;
}

export default function Badge({ label, color }: BadgeProps) {
  return (
    <View
      className="rounded-full px-2 py-0.5"
      style={{ backgroundColor: color + '20' }}
    >
      <Text className="text-xs font-medium" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
