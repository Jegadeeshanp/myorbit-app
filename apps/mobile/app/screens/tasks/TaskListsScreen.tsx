import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, X, Clipboard } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { Card, Button } from '../../../components/common';
import { useTasksStore } from '../../../lib/stores';

export const TaskListsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const lists = useTasksStore((state) => state.lists);

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
          <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary }]}>Lists</Text>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={20} color={COLORS.tasks} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <X size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {lists.map((list) => (
          <TouchableOpacity
            key={list.id}
            onPress={() => navigation.navigate('TaskListDetail', { listId: list.id })}
          >
            <Card style={styles.listCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: list.color + '20' },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>{getListIcon(list.name)}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[TYPOGRAPHY.bodyLarge, { color: COLORS.textPrimary }]}>
                    {list.name}
                  </Text>
                  <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, marginTop: SPACING.xs }]}>
                    {list.taskCount} task{list.taskCount !== 1 ? 's' : ''}
                  </Text>
                </View>

                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: list.color },
                  ]}
                />

                <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                  ⋯
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  addButton: {
    padding: SPACING.sm,
  },
  listCard: {
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
  },
});
