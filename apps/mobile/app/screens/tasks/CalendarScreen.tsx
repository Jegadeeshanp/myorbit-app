import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, Menu, ChevronLeft, ChevronRight, List } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { MyOrbitHeader, Card, FAB } from '../../../components/common';

const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const dates = [20, 21, 22, 23, 24, 25, 26];
const timeSlots = Array.from({ length: 18 }, (_, i) => {
  const hour = 6 + i;
  return `${String(hour).padStart(2, '0')}:00`;
});

export const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [viewMode, setViewMode] = useState<'week' | 'month' | '3days' | 'day'>('week');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Menu size={24} color={COLORS.textPrimary} />
        <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary }]}>Calendar</Text>
        <MyOrbitHeader />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
            🔍 Search tasks...
          </Text>
        </View>

        {/* Calendar Widget */}
        <View style={styles.calendarWidget}>
          {/* Header Row */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity>
              <Menu size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
              20 April / Today
            </Text>
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <TouchableOpacity>
                <ChevronLeft size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity>
                <ChevronRight size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity>
                <List size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Column Headers */}
          <View style={styles.columnHeaders}>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, width: 40 }]}>
              TIME
            </Text>
            {dates.map((date, i) => (
              <View key={`col-${date}`} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                  {daysOfWeek[i]}
                </Text>
                <Text
                  style={[
                    TYPOGRAPHY.bodySmall,
                    {
                      color: i === 0 ? COLORS.tasks : COLORS.textPrimary,
                      fontWeight: i === 0 ? '600' : '400',
                    },
                  ]}
                >
                  {date}
                </Text>
              </View>
            ))}
          </View>

          {/* All day Row */}
          <View style={styles.allDayRow}>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, width: 40 }]}>
              All
            </Text>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, flex: 1 }]}>
              day
            </Text>
          </View>

          {/* Time Slots */}
          {timeSlots.slice(0, 12).map((time) => (
            <View key={time} style={styles.timeSlot}>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, width: 40 }]}>
                {time}
              </Text>
              {dates.map((_, i) => (
                <View key={`slot-${time}-${i}`} style={{ flex: 1, borderLeftColor: COLORS.border, borderLeftWidth: 1 }} />
              ))}
            </View>
          ))}
        </View>

        {/* View Mode Toggles */}
        <View style={styles.viewModeContainer}>
          {(['year', 'month', 'week', '3days', 'day'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewMode(mode as any)}
              style={[
                styles.viewModeButton,
                mode === 'week' && { borderBottomColor: COLORS.tasks, borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={[
                  TYPOGRAPHY.bodySmall,
                  {
                    color: mode === 'week' ? COLORS.tasks : COLORS.textSecondary,
                  },
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
    marginBottom: SPACING.lg,
  },
  calendarWidget: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  columnHeaders: {
    flexDirection: 'row',
    paddingBottom: SPACING.md,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },
  allDayRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },
  timeSlot: {
    flexDirection: 'row',
    paddingVertical: SPACING.xs,
    minHeight: 40,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },
  viewModeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
});

export default CalendarScreen;
