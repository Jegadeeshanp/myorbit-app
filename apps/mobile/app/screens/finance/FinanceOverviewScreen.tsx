import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Wallet, TrendingUp } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, CURRENCY } from '../../../lib/theme';
import { MyOrbitHeader, Card, Button } from '../../../components/common';
import { useFinanceStore } from '../../../lib/stores';

const formatCurrency = (amount: number) => {
  return `${CURRENCY.symbol}${(amount / 100000).toFixed(2)}L`;
};

export const FinanceOverviewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { netWorth, assets, liabilities, accountBalance, transactions, budgets } =
    useFinanceStore((state) => state);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Wallet size={24} color={COLORS.tasks} />
        <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary }]}>Finance</Text>
        <MyOrbitHeader />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Net Worth Hero */}
        <Card
          style={[
            styles.heroCard,
            { backgroundColor: COLORS.tasks },
          ]}
        >
          <Text style={[TYPOGRAPHY.caption, { color: '#FFFFFF' }]}>
            NET WORTH
          </Text>
          <Text style={[TYPOGRAPHY.h2, { color: '#FFFFFF', marginTop: SPACING.md }]}>
            {formatCurrency(netWorth)}
          </Text>
          <Text style={[TYPOGRAPHY.bodySmall, { color: '#FFFFFF', marginTop: SPACING.sm }]}>
            +62% in assets
          </Text>

          <View style={[styles.heroRow, { marginTop: SPACING.lg }]}>
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.caption, { color: '#FFFFFF' }]}>
                Assets
              </Text>
              <Text style={[TYPOGRAPHY.bodyLarge, { color: '#FFFFFF', marginTop: SPACING.xs }]}>
                {formatCurrency(assets)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.caption, { color: '#FFFFFF' }]}>
                Liabilities
              </Text>
              <Text style={[TYPOGRAPHY.bodyLarge, { color: COLORS.error, marginTop: SPACING.xs }]}>
                {formatCurrency(liabilities)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Quick Stats */}
        <View style={[styles.statsRow, { marginTop: SPACING.lg }]}>
          <Card style={{ flex: 1 }}>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Account Balance
            </Text>
            <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary, marginTop: SPACING.sm }]}>
              {CURRENCY.symbol}
              {accountBalance.toLocaleString()}
            </Text>
          </Card>
        </View>

        {/* Financial Health Score */}
        <Card style={{ marginTop: SPACING.lg }}>
          <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>
            Financial Health Score
          </Text>
          <View style={[styles.scoreCircle, { marginTop: SPACING.lg }]}>
            <Text style={[TYPOGRAPHY.h1, { color: COLORS.tasks }]}>60</Text>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Fair
            </Text>
          </View>

          <View style={[styles.scoreRow, { marginTop: SPACING.lg }]}>
            {[
              { name: 'Savings Rate', score: '0/25' },
              { name: 'Debt Level', score: '10/20' },
              { name: 'Consistency', score: '25/25' },
              { name: 'Diversification', score: '10/10' },
            ].map((item) => (
              <View key={item.name} style={{ marginBottom: SPACING.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary }]}>
                    {item.name}
                  </Text>
                  <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textPrimary }]}>
                    {item.score}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary, marginTop: SPACING.lg }]}>
            💡 Savings rate is 0%. Consider reducing your debt allocation.
          </Text>
        </Card>

        {/* Recent Transactions */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Recent Transactions
        </Text>

        <Card style={{ marginTop: SPACING.md }}>
          {transactions.slice(0, 3).map((txn, idx) => (
            <View
              key={txn.id}
              style={[
                styles.transactionRow,
                { borderBottomWidth: idx < 2 ? 1 : 0 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                  {txn.title}
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, marginTop: SPACING.xs }]}>
                  {txn.date}
                </Text>
              </View>
              <Text
                style={[
                  TYPOGRAPHY.bodyLarge,
                  {
                    color: txn.type === 'expense' ? COLORS.error : COLORS.tasks,
                    fontWeight: '600',
                  },
                ]}
              >
                {txn.type === 'expense' ? '-' : '+'}
                {CURRENCY.symbol}
                {txn.amount}
              </Text>
            </View>
          ))}
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
  heroCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.tasks + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreRow: {
    gap: SPACING.sm,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomColor: COLORS.border,
  },
});

export default FinanceOverviewScreen;
