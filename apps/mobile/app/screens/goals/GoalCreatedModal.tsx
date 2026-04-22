import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X, RefreshCw, CheckList } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { Card, Button } from '../../../components/common';

export const GoalCreatedModal: React.FC = () => {
  const navigation = useNavigation<any>();

  const handleClose = () => {
    navigation.goBack();
  };

  const handleAddHabit = () => {
    // Navigate to add habit
    handleClose();
  };

  const handleAddTask = () => {
    // Navigate to add task
    handleClose();
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
              Goal Created!
            </Text>
            <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary }]}>
              Reading
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* Success Banner */}
            <View style={styles.successBanner}>
              <Text style={[TYPOGRAPHY.body, { color: '#FFFFFF' }]}>
                ✅ Goal saved! Build momentum now.
              </Text>
            </View>

            {/* Question */}
            <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
              What would you like to add?
            </Text>

            {/* Action Cards */}
            <View style={styles.actionsContainer}>
              {/* Add Habit Card */}
              <TouchableOpacity
                onPress={handleAddHabit}
                style={[styles.actionCard, { borderColor: COLORS.habits, borderWidth: 2 }]}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: COLORS.habits + '20' },
                  ]}
                >
                  <RefreshCw size={28} color={COLORS.habits} />
                </View>
                <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.md }]}>
                  Add a Habit
                </Text>
                <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary, marginTop: SPACING.sm }]}>
                  Recurring routine
                </Text>
              </TouchableOpacity>

              {/* Add Task Card */}
              <TouchableOpacity
                onPress={handleAddTask}
                style={[styles.actionCard, { borderColor: COLORS.blue, borderWidth: 1 }]}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: COLORS.blue + '20' },
                  ]}
                >
                  <CheckList size={28} color={COLORS.blue} />
                </View>
                <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.md }]}>
                  Add a Task
                </Text>
                <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary, marginTop: SPACING.sm }]}>
                  One-time action
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Close Button */}
          <View style={styles.footer}>
            <Button
              title="Done"
              onPress={handleClose}
              color={COLORS.goals}
              style={{ width: '100%' }}
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
    maxHeight: '85%',
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
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  successBanner: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
});

export default GoalCreatedModal;
