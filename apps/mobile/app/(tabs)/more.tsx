import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/authStore';
import { Target, Heart, ChartBar, Settings, LogOut, ChevronRight, User } from 'lucide-react-native';
import AppHeader from '@/components/shared/AppHeader';
import { useTheme } from '@/lib/themeStore';

const ITEMS = [
  { label: 'Goals',    subtitle: 'Track your milestones',  icon: Target,   color: '#3B82F6', route: '/(tabs)/goals'    },
  { label: 'Health',   subtitle: 'Metrics & workouts',     icon: Heart,    color: '#EF4444', route: '/(tabs)/health'   },
  { label: 'Insights', subtitle: 'Life score & tips',      icon: ChartBar,  color: '#8B5CF6', route: '/(tabs)/insights' },
  { label: 'Settings', subtitle: 'Account & preferences',  icon: Settings, color: '#9CA3AF', route: '/(tabs)/settings' },
];

export default function MoreScreen() {
  const theme  = useTheme();
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader title="More" showBack />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

        {/* User card */}
        <View style={{ backgroundColor: theme.cardBg, borderRadius: 20, padding: 16, marginTop: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: theme.border }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#10B98122', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} color="#10B981" />
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>{user?.name ?? 'User'}</Text>
            <Text style={{ fontSize: 13, color: theme.subText, marginTop: 2 }}>{user?.email ?? ''}</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={{ backgroundColor: theme.cardBg, borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
          {ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.label}
                onPress={() => router.push(item.route as any)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: idx < ITEMS.length - 1 ? 1 : 0, borderBottomColor: theme.border }}
                activeOpacity={0.7}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: item.color + '22' }}>
                  <Icon size={20} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{item.label}</Text>
                  <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>{item.subtitle}</Text>
                </View>
                <ChevronRight size={18} color={theme.mutedText} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ backgroundColor: theme.cardBg, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.border }}
          activeOpacity={0.7}
        >
          <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF444422' }}>
            <LogOut size={20} color="#EF4444" />
          </View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
