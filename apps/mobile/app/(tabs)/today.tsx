import { useState } from 'react';
import { View, Text, RefreshControl, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTodayTasks, completeInstance } from '@myorbit/api';
import type { TaskInstance, TodayResponse } from '@myorbit/api';
import Screen from '@/components/shared/Screen';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import TodaySectionHeader from '@/components/tasks/TodaySectionHeader';
import TaskItem from '@/components/tasks/TaskItem';
import AICommandModal from '@/components/shared/AICommandModal';
import { Sun, Sparkles } from 'lucide-react-native';

interface Section {
  key:   'overdue' | 'today' | 'missed' | 'completed';
  title: string;
  color: string;
  data:  TaskInstance[];
}

const SECTION_CONFIG = [
  { key: 'overdue'   as const, title: 'Overdue',   color: '#F43F5E' },
  { key: 'today'     as const, title: 'Today',     color: '#10B981' },
  { key: 'missed'    as const, title: 'Missed',    color: '#F59E0B' },
  { key: 'completed' as const, title: 'Completed', color: '#9CA3AF' },
];

export default function TodayScreen() {
  const queryClient = useQueryClient();
  const [collapsed,   setCollapsed]   = useState<Set<string>>(new Set());
  const [refreshing,  setRefreshing]  = useState(false);
  const [showAI,      setShowAI]      = useState(false);

  const { data, isLoading, error, refetch } = useQuery<TodayResponse>({
    queryKey: ['today'],
    queryFn:  getTodayTasks,
  });

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleComplete = async (instanceId: string) => {
    try {
      await completeInstance(instanceId);
      queryClient.invalidateQueries({ queryKey: ['today'] });
    } catch { /* silent */ }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <Screen>
        <EmptyState icon={Sun} title="Couldn't load today" subtitle="Pull down to retry" />
      </Screen>
    );
  }

  const sections: Section[] = SECTION_CONFIG
    .map(cfg => ({ ...cfg, data: data?.[cfg.key] ?? [] }))
    .filter(s => s.data.length > 0);

  const totalPending =
    (data?.overdue.length  ?? 0) +
    (data?.today.length    ?? 0) +
    (data?.missed.length   ?? 0);

  const aiFab = (
    <TouchableOpacity
      onPress={() => setShowAI(true)}
      style={styles.fab}
      activeOpacity={0.85}
    >
      <Sparkles size={22} color="#fff" />
    </TouchableOpacity>
  );

  if (sections.length === 0) {
    return (
      <Screen>
        <View className="pt-6 pb-2">
          <Text className="text-2xl font-bold text-gray-900">Today</Text>
        </View>
        <EmptyState
          icon={Sun}
          title="All caught up!"
          subtitle="No pending tasks for today"
        />
        {aiFab}
        <AICommandModal
          visible={showAI}
          onClose={() => setShowAI(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['today'] })}
        />
      </Screen>
    );
  }

  return (
    <Screen scrollable={false}>
      <View className="pt-6 pb-3">
        <Text className="text-2xl font-bold text-gray-900">Today</Text>
        <Text className="text-sm text-gray-500 mt-0.5">{totalPending} pending</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
        renderSectionHeader={({ section }) => (
          <View className="rounded-t-2xl border border-gray-100 bg-white mt-2 overflow-hidden">
            <TodaySectionHeader
              label={section.title}
              count={section.data.length}
              color={section.color}
              collapsed={collapsed.has(section.key)}
              onToggle={() => toggleCollapse(section.key)}
            />
          </View>
        )}
        renderItem={({ item, section }) =>
          collapsed.has(section.key) ? null : (
            <View className="bg-white px-2 border-x border-gray-100">
              <TaskItem
                instance={item}
                onComplete={
                  section.key !== 'completed' ? handleComplete : undefined
                }
              />
            </View>
          )
        }
        renderSectionFooter={() => (
          <View className="rounded-b-2xl bg-white border-b border-x border-gray-100 h-2 mb-1" />
        )}
        showsVerticalScrollIndicator={false}
      />

      {aiFab}
      <AICommandModal
        visible={showAI}
        onClose={() => setShowAI(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['today'] })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fab: {
    position:        'absolute',
    bottom:          24,
    right:           20,
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: '#10B981',
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#10B981',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.4,
    shadowRadius:    8,
    elevation:       8,
  },
});
