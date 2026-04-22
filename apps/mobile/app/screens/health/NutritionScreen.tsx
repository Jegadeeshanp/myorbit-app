import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, Settings, Plus } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { MyOrbitHeader, Card, Button } from '../../../components/common';

const meals = [
  {
    name: 'Morning',
    time: '6am–11am',
    icon: '🌅',
  },
  {
    name: 'Noon',
    time: '11am–2pm',
    icon: '☀️',
  },
  {
    name: 'Evening',
    time: '2pm–7pm',
    icon: '🌤️',
  },
  {
    name: 'Night',
    time: '7pm onwards',
    icon: '🌙',
  },
];

export const NutritionScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', gap: SPACING.md }}>
          <TouchableOpacity>
            <ChevronLeft size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>Today</Text>
          <TouchableOpacity>
            <ChevronRight size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <MyOrbitHeader />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Set Profile"
            onPress={() => {}}
            variant="outline"
            size="small"
            style={{ flex: 1 }}
          />
          <Button
            title="+ Log Food"
            onPress={() => {}}
            color={COLORS.tasks}
            size="small"
            style={{ flex: 1, marginLeft: SPACING.md }}
          />
        </View>

        {/* Alert Banner */}
        <Card
          style={[
            styles.alertBanner,
            {
              borderColor: COLORS.warning,
              borderWidth: 1.5,
              backgroundColor: COLORS.warning + '10',
            },
          ]}
        >
          <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary }]}>
            Set your body profile to get personalised calorie & macro targets.
          </Text>
          <Button
            title="Set up"
            onPress={() => {}}
            variant="outline"
            size="small"
            style={{ marginTop: SPACING.md }}
          />
        </Card>

        {/* Calories Card */}
        <Card style={{ marginTop: SPACING.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
              Calories / Daily target: 2,000 kcal
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
              0 consumed
            </Text>
          </View>

          <View style={[styles.chipRow, { marginTop: SPACING.lg }]}>
            <View style={[styles.chip, { backgroundColor: COLORS.tasks + '20' }]}>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.tasks, fontWeight: '600' }]}>
                0 consumed
              </Text>
            </View>
            <View style={[styles.chip, { backgroundColor: COLORS.border }]}>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, fontWeight: '600' }]}>
                2,000 target
              </Text>
            </View>
            <View style={[styles.chip, { backgroundColor: COLORS.blue + '20' }]}>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.blue, fontWeight: '600' }]}>
                2000 remaining
              </Text>
            </View>
          </View>
        </Card>

        {/* Macros */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Macros
        </Text>

        <View style={[styles.macroGrid, { marginTop: SPACING.md }]}>
          {[
            { name: 'Protein', target: 50, consumed: 0 },
            { name: 'Carbs', target: 250, consumed: 0 },
            { name: 'Fat', target: 65, consumed: 0 },
          ].map((macro) => (
            <Card key={macro.name} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary }]}>
                {macro.name}
              </Text>
              <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary, marginTop: SPACING.sm }]}>
                {macro.target}g
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, marginTop: SPACING.xs }]}>
                {macro.consumed}g
              </Text>
            </Card>
          ))}
        </View>

        {/* Micros */}
        <View style={[styles.microGrid, { marginTop: SPACING.lg }]}>
          {[
            { name: 'Fiber', target: 28, consumed: 0, unit: 'g' },
            { name: 'Sodium', target: 2300, consumed: 0, unit: 'mg' },
          ].map((micro) => (
            <Card key={micro.name} style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                {micro.name}
              </Text>
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                  {micro.target}{micro.unit}
                </Text>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
                  ({micro.consumed}{micro.unit})
                </Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Meal Sections */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Meals
        </Text>

        {meals.map((meal) => (
          <Card key={meal.name} style={{ marginTop: SPACING.md, padding: SPACING.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Text style={{ fontSize: 20 }}>{meal.icon}</Text>
                  <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                    {meal.name}
                  </Text>
                </View>
                <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, marginTop: SPACING.xs }]}>
                  {meal.time}
                </Text>
              </View>
              <TouchableOpacity>
                <Plus size={24} color={COLORS.tasks} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ marginTop: SPACING.md }}>
              <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary }]}>
                + Add {meal.name.toLowerCase()} food
              </Text>
            </TouchableOpacity>
          </Card>
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
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  alertBanner: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  chip: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
  },
  macroGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  microGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
});

export default NutritionScreen;
