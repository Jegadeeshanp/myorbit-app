import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getInsightScores } from '@myorbit/api';
import AppHeader from '@/components/shared/AppHeader';

const MODULES = [
  { key: 'habits',  label: 'Habits',  weight: '30%', color: '#F59E0B', emoji: '🔥' },
  { key: 'tasks',   label: 'Tasks',   weight: '20%', color: '#8B5CF6', emoji: '✅' },
  { key: 'goals',   label: 'Goals',   weight: '20%', color: '#3B82F6', emoji: '🎯' },
  { key: 'health',  label: 'Health',  weight: '20%', color: '#EF4444', emoji: '🩺' },
  { key: 'finance', label: 'Finance', weight: '10%', color: '#10B981', emoji: '💰' },
] as const;

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs work';
  return (
    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
      <View style={{ width: 144, height: 144, borderRadius: 72, alignItems: 'center', justifyContent: 'center', borderWidth: 10, borderColor: color }}>
        <Text style={{ fontSize: 40, fontWeight: '700', color }}>{score}</Text>
        <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>/ 100</Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 12, color }}>{label}</Text>
      <Text style={{ fontSize: 13, color: '#9CA3AF' }}>Life Score</Text>
    </View>
  );
}

export default function InsightsScreen() {
  const { data, isLoading, refetch, isFetching } =
    useQuery({ queryKey: ['insights'], queryFn: getInsightScores });

  const scores = data ?? { overall: 0, habits: 0, tasks: 0, goals: 0, health: 0, finance: 0 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111111' }}>
      <AppHeader title="Insights" showBack icon={<Sparkles size={18} color="#8B5CF6" />} />

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
            <View style={{ backgroundColor: '#1A1A1A', marginHorizontal: 16, marginTop: 12, marginBottom: 16, borderRadius: 20, borderWidth: 1, borderColor: '#2A2A2A' }}>
              <ScoreRing score={scores.overall} />
            </View>

            {/* Module breakdown */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#9CA3AF', paddingHorizontal: 16, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Module Scores
            </Text>
            {MODULES.map((m) => {
              const score  = scores[m.key] ?? 0;
              const pct    = Math.min(score, 100);
              return (
                <View key={m.key} style={{ backgroundColor: '#1A1A1A', borderRadius: 16, marginHorizontal: 16, marginBottom: 10, padding: 16, borderWidth: 1, borderColor: '#2A2A2A' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 18 }}>{m.emoji}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>{m.label}</Text>
                      <View style={{ backgroundColor: m.color + '22', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, color: m.color, fontWeight: '600' }}>{m.weight}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: m.color }}>{score}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: m.color, borderRadius: 3 }} />
                  </View>
                  <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>out of 100</Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
