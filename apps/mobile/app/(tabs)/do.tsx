import { useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllTasks, getTaskLists, deleteTask, updateTask } from '@myorbit/api';
import type { Task, TaskList } from '@myorbit/api';
import Screen from '@/components/shared/Screen';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import { CheckSquare, Circle, Trash2 } from 'lucide-react-native';

export default function DoScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: tasks = [], isLoading, refetch } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn:  () => getAllTasks(),
  });

  const { data: lists = [] } = useQuery<TaskList[]>({
    queryKey: ['task-lists'],
    queryFn:  getTaskLists,
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => updateTask(id, { status: 'completed' }),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <Screen scrollable={false}>
      <View className="pt-6 pb-3">
        <Text className="text-2xl font-bold text-gray-900">Tasks</Text>
        <Text className="text-sm text-gray-500 mt-0.5">{tasks.length} active</Text>
      </View>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks"
          subtitle="All done! Add a task to get started."
        />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={t => t.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#10B981"
            />
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item: task }) => (
            <View className="flex-row items-center gap-3 rounded-xl bg-white border border-gray-100 px-3 py-3 mb-1.5">
              <TouchableOpacity onPress={() => completeMutation.mutate(task.id)}>
                <Circle size={20} color="#D1D5DB" />
              </TouchableOpacity>
              <Text
                className="flex-1 text-sm font-medium text-gray-900"
                numberOfLines={1}
              >
                {task.title}
              </Text>
              {task.dueDate && (
                <Text className="text-xs text-gray-400">{task.dueDate}</Text>
              )}
              <TouchableOpacity
                onPress={() => deleteMutation.mutate(task.id)}
                className="p-1"
              >
                <Trash2 size={16} color="#F43F5E" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </Screen>
  );
}
