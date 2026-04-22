import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Activity, Plus } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { MyOrbitHeader, Card, Button } from '../../../components/common';
import { useHealthStore } from '../../../lib/stores';

const rings = [
  { name: 'Steps', value: 0, target: 10000, color: COLORS.tasks, unit: 'steps' },
  { name: 'Exercise', value: 0, target: 30, color: COLORS.habits, unit: 'min' },
  { name: 'Sleep', value: 0, target: 8, color: COLORS.blue, unit: 'hrs' },
  { name: 'Water', value: 0, target: 8, color: COLORS.blue, unit: 'cups' },
  { name: 'Calories', value: 0, target: 2000, color: COLORS.health, unit: 'kcal' },
];

export const HealthDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const metrics = useHealthStore((state) => state.metrics);

  const renderRing = (ring: any, index: number) => (
    <View key={ring.name} style={[styles.ringContainer, { flex: index < 3 ? 1 : 1 }]}>
      <View style={[styles.ring, { borderColor: ring.color }]}>
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>
          {ring.value}
        </Text>
        <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
          {ring.unit}
        </Text>
      </View>
      <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' }]}>
        {ring.name}
      </Text>
    </View>
  );

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
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="🏃 Add Workout"
            onPress={() => {}}
            variant="outline"
            size="small"
            style={{ flex: 1 }}
          />
          <Button
            title="+ Log Today"
            onPress={() => {}}
            color={COLORS.health}
            size="small"
            style={{ flex: 1, marginLeft: SPACING.md }}
          />
        </View>

        {/* Today's Rings Section */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl, marginBottom: SPACING.md }]}>
          Today's Rings
        </Text>

        <View style={styles.ringsGrid}>
          {rings.slice(0, 3).map(renderRing)}
        </View>
        <View style={styles.ringsGrid}>
          {rings.slice(3).map((ring, i) => renderRing(ring, 3 + i))}
        </View>

        {/* Metric Grid */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl, marginBottom: SPACING.md }]}>
          Health Metrics
        </Text>

        <View style={styles.metricGrid}>
          {Object.values(metrics).map((metric) => (
            <Card key={metric.name} style={{ flex: 1, padding: SPACING.md }}>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                {metric.name}
              </Text>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary, marginTop: SPACING.sm }]}>
                {metric.value}
              </Text>
            </Card>
          ))}
        </View>

        {/* Health Tasks */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Today's Health Tasks
        </Text>

        <Card style={{ marginTop: SPACING.md, alignItems: 'center', paddingVertical: SPACING.xl }}>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>✓</Text>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary, marginTop: SPACING.md, textAlign: 'center' }]}>
            No health tasks scheduled.
          </Text>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' }]}>
            Link tasks to health habits to see them here.
          </Text>
        </Card>

        {/* Health Habits */}
        <View style={[styles.row, { marginTop: SPACING.xl }]}>
          <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, flex: 1 }]}>
            Health Habits
          </Text>
          <TouchableOpacity>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.health }]}>
              Manage →
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={{ marginTop: SPACING.md, alignItems: 'center', paddingVertical: SPACING.xl }}>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary, textAlign: 'center' }]}>
            Add habits with the 'health' category →
          </Text>
        </Card>

        {/* Today's Workouts */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Today's Workouts
        </Text>

        <Card style={{ marginTop: SPACING.md, alignItems: 'center', paddingVertical: SPACING.xl }}>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary, textAlign: 'center' }]}>
            No workouts logged today.
          </Text>
          <TouchableOpacity style={{ marginTop: SPACING.md }}>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.health }]}>
              Log a workout →
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Weekly Stats */}
        <View style={[styles.row, { marginTop: SPACING.xl }]}>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>0</Text>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Habits this week
            </Text>
          </Card>
          <Card style={{ flex: 1, marginHorizontal: SPACING.md, alignItems: 'center' }}>
            <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>0</Text>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Workouts this week
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>—</Text>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Avg sleep
            </Text>
          </Card>
        </View>

        {/* Health Insights */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Health Insights
        </Text>

        <Card style={{ marginTop: SPACING.md, padding: SPACING.lg, gap: SPACING.md }}>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
            • Keep up with your daily hydration routine
          </Text>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
            • Consider adding more cardio workouts
          </Text>
        </Card>
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
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  ringsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  ringContainer: {
    alignItems: 'center',
  },
  ring: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default HealthDashboardScreen;
