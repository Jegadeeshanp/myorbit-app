import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Trash2, Edit2, Plus, Zap } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { useGoalsStore } from '../../../lib/stores';
import { Header, Card, Button, Badge, MyOrbitHeader } from '../../../components/common';

export const GoalDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const goalId = route.params?.goalId;

  const goals = useGoalsStore((state) => state.goals);
  const deleteGoal = useGoalsStore((state) => state.deleteGoal);

  const goal = useMemo(() => goals.find((g) => g.id === goalId), [goalId, goals]);

  if (!goal) {
    return (
      <View style={styles.container}>
        <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>Goal not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: () => {
          deleteGoal(goalId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>Goal</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Trash2 size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Hero Card */}
        <Card
          style={[
            styles.heroCard,
            {
              backgroundImage: `linear-gradient(135deg, ${COLORS.goals} 0%, ${COLORS.goalsPurple} 100%)`,
              backgroundColor: COLORS.goals,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Badge label={goal.category} color="#FFFFFF" textColor={COLORS.goals} />
            <Edit2 size={20} color="#FFFFFF" />
          </View>

          <Text style={[TYPOGRAPHY.h2, { color: '#FFFFFF', marginTop: SPACING.md }]}>
            {goal.title}
          </Text>
          <Text style={[TYPOGRAPHY.bodySmall, { color: '#FFFFFF', marginTop: SPACING.sm, fontStyle: 'italic' }]}>
            {goal.description}
          </Text>

          <View style={[styles.metadata, { marginTop: SPACING.lg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Text style={[TYPOGRAPHY.caption, { color: '#FFFFFF' }]}>📈</Text>
              <Text style={[TYPOGRAPHY.bodySmall, { color: '#FFFFFF' }]}>
                {goal.metric}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Text style={[TYPOGRAPHY.caption, { color: '#FFFFFF' }]}>📅</Text>
              <Text style={[TYPOGRAPHY.bodySmall, { color: '#FFFFFF' }]}>
                Due {goal.deadline}
              </Text>
            </View>
          </View>

          <View style={[styles.statChips, { marginTop: SPACING.lg }]}>
            <View style={styles.chip}>
              <Text style={[TYPOGRAPHY.caption, { color: '#FFFFFF' }]}>
                {goal.progress}% Progress
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={[TYPOGRAPHY.caption, { color: '#FFFFFF' }]}>
                {goal.milestones.filter((m) => m.completed === m.target).length}/{goal.milestones.length} Milestones
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={[TYPOGRAPHY.caption, { color: '#FFFFFF' }]}>
                {goal.processCount} Processes
              </Text>
            </View>
          </View>

          <View style={[styles.progressBar, { marginTop: SPACING.lg }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${goal.progress}%`,
                  backgroundColor: '#FFFFFF',
                },
              ]}
            />
          </View>
        </Card>

        {/* Goal Details Section */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Goal Details
        </Text>

        {/* Why This Goal */}
        <Card style={{ marginTop: SPACING.md }}>
          <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary }]}>
            WHY THIS GOAL
          </Text>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary, marginTop: SPACING.md }]}>
            {goal.description}
          </Text>
        </Card>

        {/* Success Metric */}
        <Card style={{ marginTop: SPACING.md }}>
          <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary }]}>
            SUCCESS METRIC
          </Text>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary, marginTop: SPACING.md }]}>
            📈 {goal.metric}
          </Text>
        </Card>

        {/* Deadline & Status */}
        <View style={[styles.row, { marginTop: SPACING.md }]}>
          <Card style={{ flex: 1 }}>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              DEADLINE
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary, marginTop: SPACING.sm }]}>
              📅 {goal.deadline}
            </Text>
          </Card>
          <Card style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              STATUS
            </Text>
            <Badge
              label={goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              color={COLORS.goals}
              textColor="#000"
              size="small"
            />
          </Card>
        </View>

        {/* Edit Button */}
        <Button
          title="✏️ Edit Goal Details"
          onPress={() => {}}
          variant="outline"
          color={COLORS.goals}
          style={{ marginTop: SPACING.lg }}
        />

        {/* Milestone Breakdown */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Milestone Breakdown
        </Text>

        <Card style={{ marginTop: SPACING.md }}>
          {goal.milestones.map((milestone) => (
            <View
              key={milestone.id}
              style={[
                styles.milestoneRow,
                { borderBottomColor: COLORS.border, borderBottomWidth: 1 },
              ]}
            >
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                🏁 {milestone.duration}: {milestone.completed}/{milestone.target}
              </Text>
            </View>
          ))}
        </Card>

        {/* Active Processes */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Active Processes
        </Text>

        <Card style={{ marginTop: SPACING.md }}>
          <View style={styles.processRow}>
            <View style={[styles.processDot, { backgroundColor: COLORS.blue }]} />
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                Read every day
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                Daily
              </Text>
            </View>
          </View>
          <View style={[styles.processRow, { borderTopColor: COLORS.border, borderTopWidth: 1, paddingTopColor: SPACING.md }]}>
            <View style={[styles.processDot, { backgroundColor: COLORS.blue }]} />
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                Summary
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                Weekly
              </Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Quick Actions
        </Text>

        <View style={[styles.row, { marginTop: SPACING.md }]}>
          <Button
            title="+ Add Milestone"
            onPress={() => {}}
            variant="outline"
            size="small"
            style={{ flex: 1 }}
          />
          <Button
            title="⚡ Add Process"
            onPress={() => {}}
            variant="outline"
            size="small"
            style={{ flex: 1, marginLeft: SPACING.md }}
          />
        </View>

        <Button
          title="✏️ Edit Goal"
          onPress={() => {}}
          variant="outline"
          style={{ marginTop: SPACING.md }}
        />
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
  heroCard: {
    padding: SPACING.lg,
  },
  metadata: {
    gap: SPACING.md,
  },
  statChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.full,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  milestoneRow: {
    paddingVertical: SPACING.md,
  },
  processRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  processDot: {
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS.full,
  },
});

export default GoalDetailScreen;
