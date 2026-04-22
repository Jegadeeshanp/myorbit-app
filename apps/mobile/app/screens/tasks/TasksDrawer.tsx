import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Calendar, Inbox, ChevronRight, Plus, Settings, Sun } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { useTasksStore } from '../../../lib/stores';

export const TasksDrawer: React.FC = () => {
  const navigation = useNavigation<any>();
  const lists = useTasksStore((state) => state.lists);
  const [selectedListId, setSelectedListId] = useState('l2'); // Family list selected

  const handleListTap = (listId: string) => {
    setSelectedListId(listId);
    // Navigate to TaskListDetail
    navigation.navigate('TaskListDetail', { listId });
  };

  const getListIcon = (name: string) => {
    const iconMap: Record<string, string> = {
      'Health & Fitness': '💪',
      'Family': '🏠',
      'Daily Task': '✓',
      'Bill & Renewal': '💳',
      'Weekly & Monthly': '📅',
      'Self Improvement': '📚',
    };
    return iconMap[name] || '📋';
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          onPress={() => navigation.goBack()}
        />

        {/* Drawer */}
        <View style={styles.drawer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
              <Calendar size={24} color={COLORS.tasks} />
              <View>
                <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>
                  Tasks
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                  Planner workspace
                </Text>
              </View>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Navigation Items */}
            <TouchableOpacity style={styles.navItem}>
              <Sun size={20} color={COLORS.textSecondary} />
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
              <Calendar size={20} color={COLORS.textSecondary} />
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                Next 7 Days
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
              <Inbox size={20} color={COLORS.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                  Inbox
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={[TYPOGRAPHY.caption, { color: '#000' }]}>1</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
              <Calendar size={20} color={COLORS.textSecondary} />
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                Calendar
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Lists Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary }]}>
                  Lists ({lists.length})
                </Text>
                <TouchableOpacity>
                  <Plus size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {lists.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  onPress={() => handleListTap(list.id)}
                  style={[
                    styles.listItem,
                    selectedListId === list.id && styles.listItemSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: list.color + '20' },
                    ]}
                  >
                    <Text style={{ fontSize: 14 }}>
                      {getListIcon(list.name)}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                      {list.name}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: list.color },
                    ]}
                  />

                  <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                    {list.taskCount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer - User Profile */}
          <View style={styles.footer}>
            <View style={styles.userProfile}>
              <View style={styles.avatar}>
                <Text style={[TYPOGRAPHY.bodyLarge, { color: '#000', fontWeight: '600' }]}>
                  JP
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                  Jegadeeshan Panneerselvam
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                  Personal account
                </Text>
              </View>
              <Settings size={20} color={COLORS.textSecondary} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  drawer: {
    width: '80%',
    backgroundColor: COLORS.background,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderRightColor: COLORS.border,
    borderRightWidth: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  badge: {
    backgroundColor: COLORS.tasks,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  section: {
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  listItemSelected: {
    backgroundColor: COLORS.tasks + '20',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  footer: {
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.tasks,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TasksDrawer;
