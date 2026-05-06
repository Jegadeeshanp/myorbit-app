import { useState } from 'react';
import { View, Text, RefreshControl, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getInsightScores } from '@myorbit/api';
import type { InsightScores } from '@myorbit/api';
import Screen from '@/components/shared/Screen';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import { ChartBar } from 'lucide-react-native';

const MODULES: {
  key:   keyof Omit<InsightScores, 'overall'>;
  label: string;
  color: string;
}[] = [
  { key: 'finance', label: 'Finance', color: '#10B981' },
  { key: 'habits',  label: 'Habits',  color: '#8B5CF6' },
  { key: 'health',  label: 'Health',  color: '#F43F5E' },
  { key: 'goals',   label: 'Goals',   color: '#F59E0B' },
];

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <View className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
      <View
        className="h-full rounded-full"
        style={{ width: `${Math.min(score, 100)}%`, backgroundColor: color }}
      />
    </View>
  );
}

export default function ReflectScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: scores, isLoading, error, refetch } = useQuery<InsightScores>({
    queryKey: ['insights'],
    queryFn:  getInsightScores,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) return <LoadingSkeleton />;

  const overall = scores?.overall ?? 0;

  return (
    <Screen>
      <View className="pt-6 pb-3">
        <Text className="text-2xl font-bold text-gray-900">Reflect</Text>
        <Text className="text-sm text-gray-500 mt-0.5">Your wellness scores</Text>
      </View>

      {error ? (
        <View className="rounded-2xl bg-rose-50 border border-rose-100 p-4 mb-3">
          <Text className="text-sm text-rose-600">
            Couldn't load scores. Pull down to retry.
          </Text>
        </View>
      ) : (
        <>
          {/* Overall score hero */}
          <View className="rounded-2xl bg-white border border-blue-100 px-5 py-5 mb-3 items-center">
            <View className="h-16 w-16 rounded-2xl bg-blue-50 items-center justify-center mb-3">
              <ChartBar size={28} color="#3B82F6" />
            </View>
            <Text className="text-4xl font-bold text-blue-600">{overall}</Text>
            <Text className="text-sm text-gray-400 mt-1">Overall score</Text>
            <ScoreBar score={overall} color="#3B82F6" />
          </View>

          {/* Module scores */}
          {MODULES.map(m => {
            const score = scores?.[m.key] ?? 0;
            return (
              <View
                key={m.key}
                className="rounded-2xl bg-white border border-gray-100 px-5 py-4 mb-2"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-gray-900">
                    {m.label}
                  </Text>
                  <Text
                    className="text-xl font-bold"
                    style={{ color: m.color }}
                  >
                    {score}
                  </Text>
                </View>
                <ScoreBar score={score} color={m.color} />
                <Text className="text-xs text-gray-400 mt-1">out of 100</Text>
              </View>
            );
          })}
        </>
      )}
    </Screen>
  );
}
