import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X, Flag, Plus, Trash2, GripVertical } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { useTasksStore } from '../../../lib/stores';

export const TaskDetailSheet: React.FC = () => {
  const navigation = useNavigation<any>();
  const [taskTitle, setTaskTitle] = useState('Morning Stretch');
  const lists = useTasksStore((state) => state.lists);

  const currentList = lists[0]; // Family list for example

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          onPress={() => navigation.goBack()}
        />

        {/* Bottom Sheet */}
        <View style={styles.sheet}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Text style={{ fontSize: 16 }}>📋</Text>
              <View>
                <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary }]}>
                  {currentList?.name}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <TouchableOpacity>
                <Flag size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Checkbox & Date */}
          <View style={styles.row}>
            <View style={styles.checkbox} />
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
              📅 23 Mar, 05:45
            </Text>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, marginLeft: SPACING.lg }]}>
              🔄 Every Day
            </Text>
          </View>

          {/* Title Input */}
          <TextInput
            style={[styles.titleInput, TYPOGRAPHY.h4]}
            value={taskTitle}
            onChangeText={setTaskTitle}
            placeholderTextColor={COLORS.textSecondary}
          />

          {/* Notes */}
          <TextInput
            style={[styles.notesInput, TYPOGRAPHY.body]}
            placeholder="Add notes..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
          />

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>🏷</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Plus size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity>
              <Trash2 size={20} color={COLORS.error} />
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    maxHeight: '70%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    borderColor: COLORS.border,
    borderWidth: 2,
  },
  titleInput: {
    color: COLORS.textPrimary,
    paddingVertical: SPACING.md,
    fontSize: 20,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginVertical: SPACING.md,
    minHeight: 80,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
  },
});

export default TaskDetailSheet;
