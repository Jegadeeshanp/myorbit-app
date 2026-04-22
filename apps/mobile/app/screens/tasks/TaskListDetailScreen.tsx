import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Menu, Plus, ArrowUpDown } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { MyOrbitHeader, Card, FAB } from '../../../components/common';
import { useTasksStore } from '../../../lib/stores';

export const TaskListDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const listId = route.params?.listId;

  const lists = useTasksStore((state) => state.lists);
  const tasks = useTasksStore((state) => state.tasks);
  const [sortAscending, setSortAscending] = useState(true);

  const currentList = useMemo(
    () => lists.find((l) => l.id === listId),
    [listId, lists]
  );

  const listTasks = useMemo(
    () => tasks.filter((t) => t.listId === listId),
    [listId, tasks]
  );

  if (!currentList) {
    return (
      <View style={styles.container}>
        <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
          List not found
        </Text>
      </View>
    );
  }

  const getListIcon = (name: string) => {
    switch (name) {
      case 'Health & Fitness':
        return '💪';
      case 'Family':
        return '🏠';
      case 'Daily Task':
        return '✓';
      case 'Bill & Renewal':
        return '💳';
      case 'Weekly & Monthly':
        return '📅';
      case 'Self Improvement':
        return '📚';
      default:
        return '📋';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Menu size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary }]}>Tasks</Text>
        <MyOrbitHeader />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Text style={{ fontSize: 24 }}>{getListIcon(currentList.name)}</Text>
          <Text style={[TYPOGRAPHY.h2, { color: COLORS.textPrimary }]}>
            {currentList.name}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
            🔍 Search tasks...
          </Text>
        </View>

        {/* List Header */}
        <View style={styles.listHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Text style={[TYPOGRAPHY.bodyLarge, { color: COLORS.textPrimary }]}>
              {currentList.name}
            </Text>
            <View
              style={[
                styles.taskCountBadge,
                { backgroundColor: currentList.color + '20' },
              ]}
            >
              <Text style={[TYPOGRAPHY.caption, { color: currentList.color }]}>
                {listTasks.length}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => setSortAscending(!sortAscending)}>
            <ArrowUpDown size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tasks List */}
        {listTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
              No tasks in this list
            </Text>
          </View>
        ) : (
          listTasks.map((task, index) => (
            <TouchableOpacity
              key={task.id}
              onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
              style={[
                styles.taskRow,
                {
                  borderBottomColor: COLORS.border,
                  borderBottomWidth: index < listTasks.length - 1 ? 1 : 0,
                },
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: currentList.color,
                  },
                ]}
              />

              <View style={{ flex: 1 }}>
                <Text style={[TYPOGRAPHY.bodyLarge, { color: COLORS.textPrimary }]}>
                  {task.title}
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: SPACING.sm,
                    marginTop: SPACING.xs,
                  }}
                >
                  {task.dueDate && (
                    <Text style={[TYPOGRAPHY.caption, { color: COLORS.blue }]}>
                      📅 {task.dueDate}
                    </Text>
                  )}
                  {task.dueTime && (
                    <Text style={[TYPOGRAPHY.caption, { color: COLORS.tasks }]}>
                      {task.dueTime}
                    </Text>
                  )}
                  {task.repeat && <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>🔄</Text>}
                </View>
              </View>

              {task.priority === 'high' && (
                <Text style={[TYPOGRAPHY.caption, { color: COLORS.error }]}>🚩</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon={<Plus size={32} color="#000" />}
        onPress={() => {}}
        color={COLORS.tasks}
        style={{ bottom: SPACING.xl, right: SPACING.xl }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  searchBar: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginVertical: SPACING.lg,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  taskCountBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  emptyState: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    marginTop: SPACING.xs,
  },
});

export default TaskListDetailScreen;
