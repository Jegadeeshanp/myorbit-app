import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/lib/themeStore';
import Svg, { Rect, Circle, Text as SvgText } from 'react-native-svg';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

// App_icon2: green circle M logo — used in all page headers
function MyOrbitLogo() {
  return (
    <Svg width={28} height={28} viewBox="0 0 40 40">
      {/* Green rounded square */}
      <Rect x="0" y="0" width="40" height="40" rx="10" ry="10" fill="#10B981" />
      {/* Orbit ring */}
      <Circle cx="20" cy="20" r="13" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none" />
      {/* Orbit dots */}
      <Circle cx="20" cy="7" r="2.5" fill="white" />
      <Circle cx="33" cy="20" r="2.5" fill="white" />
      <Circle cx="20" cy="33" r="2.5" fill="white" />
      <Circle cx="7" cy="20" r="2.5" fill="white" />
      {/* M letter */}
      <SvgText
        x="20"
        y="26"
        textAnchor="middle"
        fontFamily="System"
        fontWeight="800"
        fontSize="16"
        fill="white"
      >
        M
      </SvgText>
    </Svg>
  );
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
      <TouchableOpacity onPress={goHome} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 6 }}>
        <MyOrbitLogo />
        <Text style={{ fontSize: 18, fontWeight: '700', color: T.text }}>MyOrbit</Text>
      </TouchableOpacity>
    </View>
  );
}
