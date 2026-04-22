import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search, Plus } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, CURRENCY } from '../../../lib/theme';
import { MyOrbitHeader, Card, Button, FAB } from '../../../components/common';
import { useFinanceStore } from '../../../lib/stores';

export const BudgetScreen: React.FC = () => {
  const { budgets } = useFinanceStore((state) => state);

  const totalPlanned = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary }]}>Budget</Text>
        <MyOrbitHeader />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                Inflow
              </Text>
              <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.sm }]}>
                {CURRENCY.symbol}0
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                Planned
              </Text>
              <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.sm }]}>
                {CURRENCY.symbol}
                {totalPlanned.toLocaleString()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                Net Balance
              </Text>
              <Text style={[TYPOGRAPHY.h4, { color: COLORS.error, marginTop: SPACING.sm }]}>
                -{CURRENCY.symbol}{totalSpent} Overspent
              </Text>
            </View>
          </View>
        </Card>

        {/* Search & Add */}
        <View style={[styles.row, { marginTop: SPACING.lg }]}>
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.textSecondary} />
          </View>
          <TouchableOpacity>
            <Plus size={24} color={COLORS.tasks} />
          </TouchableOpacity>
        </View>

        {/* Budget List */}
        <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary, marginTop: SPACING.lg }]}>
          {budgets.length} Categories
        </Text>

        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.limit) * 100;
          const color =
            percentage > 100
              ? COLORS.error
              : percentage > 80
              ? COLORS.warning
              : COLORS.tasks;

          return (
            <Card key={budget.id} style={{ marginTop: SPACING.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                    {budget.category}
                  </Text>
                  <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, marginTop: SPACING.xs }]}>
                    {CURRENCY.symbol}
                    {budget.limit.toLocaleString()}
                  </Text>
                </View>
                <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary }]}>
                  {percentage.toFixed(0)}%
                </Text>
              </View>

              <View style={[styles.progressBar, { marginTop: SPACING.md }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(percentage, 100)}%`, backgroundColor: color },
                  ]}
                />
              </View>

              {budget.tags.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.md }}>
                  {budget.tags.map((tag) => (
                    <View
                      key={tag}
                      style={{
                        backgroundColor: COLORS.surface,
                        paddingHorizontal: SPACING.sm,
                        paddingVertical: 2,
                        borderRadius: BORDER_RADIUS.sm,
                      }}
                    >
                      <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>

      {/* FAB */}
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
  summaryCard: {
    padding: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    justifyContent: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});

export default BudgetScreen;
