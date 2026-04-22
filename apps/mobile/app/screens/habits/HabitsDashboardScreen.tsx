import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, Flame } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { MyOrbitHeader, EmptyState, FAB, Card, StatCard } from '../../../components/common';
import { useHabitsStore } from '../../../lib/stores';

export const HabitsDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const habits = useHabitsStore((state) => state.habits);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary }]}>Dashboard</Text>
        <MyOrbitHeader />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Overview Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.h3, { color: COLORS.habits }]}>0/0</Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                Today's Done
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textTertiary }]}>
                habits completed
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.h3, { color: COLORS.habits }]}>0</Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                Total Streak XP
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textTertiary }]}>
                combined streak days
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.h3, { color: COLORS.habits }]}>0</Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                Longest Streak
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textTertiary }]}>
                consecutive days
              </Text>
            </View>
          </View>
        </Card>

        {/* Empty State */}
        <EmptyState
          icon={<Flame size={48} color={COLORS.habits} />}
          title="No habits yet"
          description="Start building your daily system"
          buttonLabel="+ Create Habit"
          onButtonPress={() => {}}
          buttonColor={COLORS.habits}
        />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon={<Plus size={32} color="#000" />}
        onPress={() => {}}
        color={COLORS.habits}
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
  statsCard: {
    marginBottom: SPACING.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default HabitsDashboardScreen;
