import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, Target } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { useGoalsStore } from '../../../lib/stores';
import { Header, MyOrbitHeader, EmptyState, Chip, FAB, Card } from '../../../components/common';

const categories = ['All', 'Finance', 'Health', 'Career', 'Learning', 'Personal'];

export const GoalsOverviewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const goals = useGoalsStore((state) => state.goals);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const totalGoals = goals.length;
  const activeGoals = goals.filter((g) => g.status === 'active').length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const processCount = goals.reduce((acc, g) => acc + g.processCount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary }]}>Goals</Text>
        <MyOrbitHeader />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[TYPOGRAPHY.h2, { color: COLORS.goals }]}>{totalGoals}</Text>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Total Goals
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[TYPOGRAPHY.h2, { color: COLORS.tasks }]}>{activeGoals}</Text>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Active
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[TYPOGRAPHY.h2, { color: COLORS.success }]}>{completedGoals}</Text>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Completed
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[TYPOGRAPHY.h2, { color: COLORS.purple }]}>{processCount}</Text>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Processes
            </Text>
          </Card>
        </View>

        {/* Category Filter */}
        <View style={styles.filterContainer}>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Chip
                label={item}
                selected={selectedCategory === item}
                onPress={() => setSelectedCategory(item)}
                color={COLORS.goals}
              />
            )}
            scrollEnabled={true}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Empty State or Goals List */}
        {goals.length === 0 ? (
          <EmptyState
            icon={<Target size={48} color={COLORS.goals} />}
            title="No goals yet"
            description="Start by creating your first goal"
            buttonLabel="+ Create Goal"
            onButtonPress={() => navigation.navigate('NewGoalWizard')}
            buttonColor={COLORS.goals}
          />
        ) : (
          <View style={styles.goalsList}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })}
              >
                <Card style={[styles.goalCard, { borderLeftColor: COLORS.goals, borderLeftWidth: 4 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>
                        {goal.title}
                      </Text>
                      <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary, marginTop: SPACING.xs }]}>
                        {goal.description}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: COLORS.goals + '20' },
                      ]}
                    >
                      <Text style={[TYPOGRAPHY.caption, { color: COLORS.goals }]}>
                        {goal.status}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.progressBar, { marginTop: SPACING.md }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${goal.progress}%`,
                          backgroundColor: COLORS.goals,
                        },
                      ]}
                    />
                  </View>

                  <View style={[styles.goalMeta, { marginTop: SPACING.md }]}>
                    <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                      {goal.progress}% Progress
                    </Text>
                    <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                      {goal.milestones.filter((m) => m.completed === m.target).length}/{goal.milestones.length} Milestones
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon={<Plus size={32} color="#000" />}
        onPress={() => navigation.navigate('NewGoalWizard')}
        color={COLORS.goals}
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
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  filterContainer: {
    marginBottom: SPACING.xl,
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  goalsList: {
    gap: SPACING.md,
  },
  goalCard: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  goalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
