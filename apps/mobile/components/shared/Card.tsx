import { View } from 'react-native';

export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-4 mb-3">
      {children}
    </View>
  );
}
