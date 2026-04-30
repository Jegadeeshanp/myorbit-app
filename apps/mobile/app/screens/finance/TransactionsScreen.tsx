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
import { Search, Plus } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, CURRENCY } from '../../../lib/theme';
import { MyOrbitHeader, Card, Button, FAB, Chip } from '../../../components/common';
import { useFinanceStore } from '../../../lib/stores';

export const TransactionsScreen: React.FC = () => {
  const { transactions } = useFinanceStore((state) => state);
  const [accountFilter, setAccountFilter] = useState('All');

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary }]}>
          Transactions
        </Text>
        <MyOrbitHeader />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Summary Chips */}
        <View style={styles.summaryRow}>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Income
            </Text>
            <Text style={[TYPOGRAPHY.bodyLarge, { color: COLORS.tasks, marginTop: SPACING.sm }]}>
              {CURRENCY.symbol}{totalIncome}
            </Text>
          </Card>
          <Card style={{ flex: 1, marginHorizontal: SPACING.sm, alignItems: 'center' }}>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Expenses
            </Text>
            <Text style={[TYPOGRAPHY.bodyLarge, { color: COLORS.error, marginTop: SPACING.sm }]}>
              {CURRENCY.symbol}{totalExpenses}
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Net Balance
            </Text>
            <Text
              style={[
                TYPOGRAPHY.bodyLarge,
                { color: netBalance >= 0 ? COLORS.tasks : COLORS.error, marginTop: SPACING.sm },
              ]}
            >
              {CURRENCY.symbol}{netBalance}
            </Text>
          </Card>
        </View>

        {/* Search & Add */}
        <View style={[styles.row, { marginTop: SPACING.lg }]}>
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.textSecondary} />
          </View>
          <TouchableOpacity>
            <Plus size={24} color={COLORS.tasks} />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: SPACING.md }}
          contentContainerStyle={styles.filterRow}
        >
          {['All', 'Bank', 'Credit Card', 'Cash'].map((filter) => (
            <Chip
              key={filter}
              label={filter}
              selected={filter === accountFilter}
              onPress={() => setAccountFilter(filter)}
              color={COLORS.tasks}
            />
          ))}
          <Chip
            label="This Month ▾"
            selected={false}
            onPress={() => {}}
            color={COLORS.tasks}
          />
        </ScrollView>

        {/* Transactions Grouped by Month */}
        <Text
          style={[
            TYPOGRAPHY.bodySmall,
            { color: COLORS.textSecondary, marginTop: SPACING.lg, marginBottom: SPACING.md },
          ]}
        >
          April 2026 NOW · {transactions.length} entries · -{CURRENCY.symbol}
          {totalExpenses}
        </Text>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {transactions.map((txn, idx) => (
            <TouchableOpacity
              key={txn.id}
              style={[
                styles.transactionItem,
                { borderBottomWidth: idx < transactions.length - 1 ? 1 : 0 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                  {txn.title}
                </Text>
                <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs }}>
                  <Text
                    style={[
                      TYPOGRAPHY.caption,
                      {
                        backgroundColor: COLORS.purple + '40',
                        color: COLORS.purple,
                        paddingHorizontal: SPACING.sm,
                        paddingVertical: 2,
                        borderRadius: BORDER_RADIUS.sm,
                      },
                    ]}
                  >
                    {txn.category}
                  </Text>
                  <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                    {txn.account} · {txn.date}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    TYPOGRAPHY.bodyLarge,
                    { color: txn.type === 'income' ? COLORS.tasks : COLORS.error, fontWeight: '600' },
                  ]}
                >
                  {txn.type === 'income' ? '+' : '-'}{CURRENCY.symbol}{txn.amount}
                </Text>
                {txn.recurring && (
                  <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                    🔄
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </Card>
      </ScrollView>

      {/* FABs */}
      <FAB
        icon={<Text style={{ fontSize: 20 }}>🤖</Text>}
        onPress={() => {}}
        color={COLORS.purple}
        style={{ bottom: SPACING.xl + 64 + SPACING.lg, right: SPACING.xl }}
      />
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
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingRight: SPACING.lg,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomColor: COLORS.border,
  },
});

export default TransactionsScreen;
