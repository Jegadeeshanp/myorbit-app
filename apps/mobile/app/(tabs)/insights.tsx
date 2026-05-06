import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getInsightScores } from '@myorbit/api';
import AppHeader from '@/components/shared/AppHeader';
import { useTheme } from '@/lib/themeStore';
import { Flame, CheckSquare, Target, Heart, Wallet } from 'lucide-react-native';

const MODULES = [
  { key: 'habits',  label: 'Habits',  weight: '30%', color: '#F59E0B', Icon: Flame },
  { key: 'tasks',   label: 'Tasks',   weight: '20%', color: '#8B5CF6', Icon: CheckSquare },
  { key: 'goals',   label: 'Goals',   weight: '20%', color: '#3B82F6', Icon: Target },
  { key: 'health',  label: 'Health',  weight: '20%', color: '#EF4444', Icon: Heart },
  { key: 'finance', label: 'Finance', weight: '10%', color: '#10B981', Icon: Wallet },
];

function ScoreRing({ score }: { score: number }) {
  const T = useTheme();
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs work';
  return (
    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
      <View style={{ width: 144, height: 144, borderRadius: 72, alignItems: 'center', justifyContent: 'center', borderWidth: 10, borderColor: color }}>
        <Text style={{ fontSize: 40, fontWeight: '700', color }}>{score}</Text>
        <Text style={{ fontSize: 12, color: T.subText, marginTop: 2 }}>/ 100</Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 12, color }}>{label}</Text>
      <Text style={{ fontSize: 13, color: T.subText }}>Life Score</Text>
    </View>
  );
}

export default function InsightsScreen() {
  const T = useTheme();
  const { data, isLoading, refetch, isFetching } =
    useQuery({ queryKey: ['insights'], queryFn: getInsightScores });

  const scores = data ?? { overall: 0, habits: 0, tasks: 0, goals: 0, health: 0, finance: 0 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <AppHeader title="Insights" showBack />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#10B981" />}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ paddingVertical: 96, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : (
          <>
            {/* Score ring */}
            <View style={{ backgroundColor: T.cardBg, marginHorizontal: 16, marginTop: 12, marginBottom: 16, borderRadius: 20, borderWidth: 1, borderColor: T.border }}>
              <ScoreRing score={scores.overall} />
            </View>

            {/* Module breakdown */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: T.subText, paddingHorizontal: 16, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Module Scores
            </Text>
            {MODULES.map((m) => {
              const score  = (scores as Record<string, number>)[m.key] ?? 0;
              const pct    = Math.min(score, 100);
              return (
                <View key={m.key} style={{ backgroundColor: T.cardBg, borderRadius: 16, marginHorizontal: 16, marginBottom: 10, padding: 16, borderWidth: 1, borderColor: T.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <m.Icon size={18} color={m.color} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: T.text }}>{m.label}</Text>
                      <View style={{ backgroundColor: m.color + '22', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, color: m.color, fontWeight: '600' }}>{m.weight}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: m.color }}>{score}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: T.border, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: m.color, borderRadius: 3 }} />
                  </View>
                  <Text style={{ fontSize: 11, color: T.mutedText, marginTop: 4 }}>out of 100</Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
