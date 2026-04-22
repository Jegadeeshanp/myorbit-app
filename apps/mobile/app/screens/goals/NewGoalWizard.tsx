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
import { X, Edit2 } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { useGoalsStore } from '../../../lib/stores';
import { Button, Badge, Card } from '../../../components/common';

export const NewGoalWizard: React.FC = () => {
  const navigation = useNavigation<any>();
  const addGoal = useGoalsStore((state) => state.addGoal);
  const [step, setStep] = useState(4);

  // Mock goal data for this wizard
  const goalData = {
    id: `goal-${Date.now()}`,
    title: 'Reading',
    description: 'Read',
    category: 'Personal' as const,
    metric: 'Complete books',
    deadline: '2026-07-31',
    status: 'active' as const,
    progress: 0,
    milestones: [
      { id: 'm1', duration: '6M' as const, target: 10, completed: 0 },
      { id: 'm2', duration: '3M' as const, target: 6, completed: 0 },
      { id: 'm3', duration: '1M' as const, target: 3, completed: 0 },
    ],
    processCount: 2,
  };

  const handleBack = () => {
    setStep(3);
  };

  const handleCreateGoal = () => {
    addGoal(goalData);
    navigation.navigate('GoalCreated');
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
    >
      <View style={styles.container}>
        {/* Semi-transparent background */}
        <View style={styles.backdrop} />

        {/* Bottom Sheet */}
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>
              New Goal
            </Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                Step 4 of 4
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <X size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressSegment, { backgroundColor: COLORS.goals }]} />
            <View style={[styles.progressSegment, { backgroundColor: COLORS.goals }]} />
            <View style={[styles.progressSegment, { backgroundColor: COLORS.goals }]} />
            <View style={[styles.progressSegment, { backgroundColor: COLORS.goals }]} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* Title */}
            <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary }]}>
              Review & Confirm
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary, marginTop: SPACING.sm }]}>
              Your goal at a glance.
            </Text>

            {/* Goal Preview Card */}
            <Card
              style={[
                styles.previewCard,
                {
                  backgroundColor: COLORS.goals,
                  backgroundImage: `linear-gradient(135deg, ${COLORS.goals} 0%, ${COLORS.goalsPurple} 100%)`,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Badge label={goalData.category} color="#FFFFFF" textColor={COLORS.goals} />
                <Edit2 size={20} color="#FFFFFF" />
              </View>

              <Text style={[TYPOGRAPHY.h2, { color: '#FFFFFF', marginTop: SPACING.lg }]}>
                {goalData.title}
              </Text>

              <Text style={[TYPOGRAPHY.bodySmall, { color: '#FFFFFF', marginTop: SPACING.sm, fontStyle: 'italic' }]}>
                {goalData.description}
              </Text>

              <View style={[styles.cardMeta, { marginTop: SPACING.lg }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Text style={[TYPOGRAPHY.caption, { color: '#FFFFFF' }]}>✏️</Text>
                  <Text style={[TYPOGRAPHY.bodySmall, { color: '#FFFFFF' }]}>
                    {goalData.metric}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm }}>
                  <Text style={[TYPOGRAPHY.caption, { color: '#FFFFFF' }]}>📅</Text>
                  <Text style={[TYPOGRAPHY.bodySmall, { color: '#FFFFFF' }]}>
                    Due {goalData.deadline}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Milestones Section */}
            <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
              Milestones
            </Text>

            {goalData.milestones.map((milestone, index) => (
              <View
                key={milestone.id}
                style={[
                  styles.milestoneItem,
                  { borderBottomWidth: index < goalData.milestones.length - 1 ? 1 : 0 },
                ]}
              >
                <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                  🏁 {milestone.duration}: Complete {milestone.target} books
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <Button
              title="Back"
              onPress={handleBack}
              variant="outline"
              size="medium"
              style={{ flex: 1 }}
            />
            <Button
              title="Create Goal"
              onPress={handleCreateGoal}
              color={COLORS.goals}
              size="medium"
              style={{ flex: 1, marginLeft: SPACING.lg }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
    paddingBottom: SPACING.lg,
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
  progressContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  previewCard: {
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  cardMeta: {
    gap: SPACING.sm,
  },
  milestoneItem: {
    paddingVertical: SPACING.md,
    borderBottomColor: COLORS.border,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
});

export default NewGoalWizard;
