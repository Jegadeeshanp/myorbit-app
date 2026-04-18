import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHealthEntry, upsertHealthEntry } from '@myorbit/api';
import type { HealthEntry } from '@myorbit/api';
import Screen from '@/components/shared/Screen';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import {
  Heart, Footprints, Droplets, Moon,
  Activity, Zap,
} from 'lucide-react-native';

const today = new Date().toISOString().split('T')[0];

type MetricKey = 'steps' | 'sleepHours' | 'waterMl' | 'weightKg' | 'mood' | 'energyLevel';

const METRICS: {
  key:   MetricKey;
  label: string;
  unit:  string;
  icon:  typeof Heart;
  color: string;
}[] = [
  { key: 'steps',       label: 'Steps',  unit: 'steps', icon: Footprints, color: '#3B82F6' },
  { key: 'sleepHours',  label: 'Sleep',  unit: 'hrs',   icon: Moon,       color: '#8B5CF6' },
  { key: 'waterMl',     label: 'Water',  unit: 'ml',    icon: Droplets,   color: '#06B6D4' },
  { key: 'weightKg',    label: 'Weight', unit: 'kg',    icon: Activity,   color: '#F59E0B' },
  { key: 'mood',        label: 'Mood',   unit: '/5',    icon: Heart,      color: '#F43F5E' },
  { key: 'energyLevel', label: 'Energy', unit: '/10',   icon: Zap,        color: '#10B981' },
];

export default function BodyScreen() {
  const queryClient = useQueryClient();
  const [editing, setEditing]   = useState<MetricKey | null>(null);
  const [inputVal, setInputVal] = useState('');

  const { data: entry, isLoading } = useQuery<HealthEntry>({
    queryKey: ['health', today],
    queryFn:  () => getHealthEntry(today),
  });

  const upsertMutation = useMutation({
    mutationFn: (data: Partial<HealthEntry>) =>
      upsertHealthEntry({ ...data, date: today }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['health'] }),
  });

  const handleSave = (key: MetricKey) => {
    const num = parseFloat(inputVal);
    if (!isNaN(num)) upsertMutation.mutate({ [key]: num });
    setEditing(null);
    setInputVal('');
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <Screen>
      <View className="pt-6 pb-3">
        <Text className="text-2xl font-bold text-gray-900">Body</Text>
        <Text className="text-sm text-gray-500 mt-0.5">Today · {today}</Text>
      </View>

      <View className="flex-row flex-wrap gap-3">
        {METRICS.map(m => {
          const val       = entry?.[m.key];
          const isEditing = editing === m.key;

          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => {
                setEditing(m.key);
                setInputVal(val != null ? String(val) : '');
              }}
              className="rounded-2xl bg-white border border-gray-100 p-4"
              style={{ width: '47%' }}
              activeOpacity={0.8}
            >
              <View
                className="h-8 w-8 rounded-xl items-center justify-center mb-2"
                style={{ backgroundColor: m.color + '20' }}
              >
                <m.icon size={16} color={m.color} />
              </View>
              <Text className="text-xs text-gray-400">{m.label}</Text>

              {isEditing ? (
                <View className="flex-row items-center gap-1 mt-1">
                  <TextInput
                    autoFocus
                    value={inputVal}
                    onChangeText={setInputVal}
                    keyboardType="numeric"
                    onSubmitEditing={() => handleSave(m.key)}
                    onBlur={() => handleSave(m.key)}
                    className="flex-1 text-lg font-bold border-b border-gray-300 pb-0.5"
                    style={{ color: m.color }}
                  />
                  <Text className="text-xs text-gray-400">{m.unit}</Text>
                </View>
              ) : (
                <Text
                  className="text-lg font-bold mt-1"
                  style={{ color: val != null ? m.color : '#D1D5DB' }}
                >
                  {val != null ? String(val) : '—'}
                  {val != null && (
                    <Text className="text-xs font-normal text-gray-400">
                      {' '}{m.unit}
                    </Text>
                  )}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Screen>
  );
}
