import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Star, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/lib/themeStore';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function AppHeader({ title, showBack = false, onBack }: AppHeaderProps) {
  const T = useTheme();
  const handleBack = onBack ?? (() => router.back());
  const goHome = () => router.replace('/(tabs)/');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, backgroundColor: T.bg, borderBottomWidth: 1, borderBottomColor: T.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
        {showBack && (
          <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginRight: 2 }}>
            <ChevronLeft size={22} color={T.text} />
          </TouchableOpacity>
        )}
        <Text style={{ fontSize: 21, fontWeight: '700', color: T.text }} numberOfLines={1}>{title}</Text>
      </View>
      <TouchableOpacity onPress={goHome} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6 }}>
        <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
          <Star size={12} color="white" fill="white" />
        </View>
        <Text style={{ fontSize: 12, fontWeight: '700', color: T.text }}>MyOrbit</Text>
      </TouchableOpacity>
    </View>
  );
}
