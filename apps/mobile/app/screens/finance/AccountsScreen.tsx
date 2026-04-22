import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, Search, AlertCircle } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, CURRENCY } from '../../../lib/theme';
import { MyOrbitHeader, Card, Button, FAB } from '../../../components/common';
import { useFinanceStore } from '../../../lib/stores';

export const AccountsScreen: React.FC = () => {
  const { accounts } = useFinanceStore((state) => state);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary }]}>
          Accounts
        </Text>
        <MyOrbitHeader />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Balance
            </Text>
            <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary, marginTop: SPACING.sm }]}>
              {CURRENCY.symbol}
              {totalBalance.toLocaleString()}
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Credit Used
            </Text>
            <Text style={[TYPOGRAPHY.h3, { color: COLORS.error, marginTop: SPACING.sm }]}>
              {CURRENCY.symbol}66,607
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Spent
            </Text>
            <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary, marginTop: SPACING.sm }]}>
              {CURRENCY.symbol}498
            </Text>
          </Card>
        </View>

        {/* Search & Add */}
        <View style={[styles.row, { marginTop: SPACING.lg }]}>
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.textSecondary} />
          </View>
          <Button title="Add account" onPress={() => {}} color={COLORS.tasks} size="small" />
        </View>

        {/* Bank Accounts Section */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Bank Accounts
        </Text>

        {accounts
          .filter((a) => a.type === 'savings')
          .map((account) => (
            <Card key={account.id} style={{ marginTop: SPACING.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                    {account.name}
                  </Text>
                  <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, marginTop: SPACING.xs }]}>
                    {account.institution}
                  </Text>
                </View>
                <Text style={[TYPOGRAPHY.bodyLarge, { color: COLORS.textPrimary, fontWeight: '600' }]}>
                  {CURRENCY.symbol}
                  {account.balance.toLocaleString()}
                </Text>
              </View>
              <View
                style={[
                  styles.warningBadge,
                  { marginTop: SPACING.md, backgroundColor: COLORS.warning + '20' },
                ]}
              >
                <AlertCircle size={16} color={COLORS.warning} />
                <Text style={[TYPOGRAPHY.caption, { color: COLORS.warning, marginLeft: SPACING.sm }]}>
                  Balance mismatch
                </Text>
                <TouchableOpacity style={{ marginLeft: SPACING.md }}>
                  <Text style={[TYPOGRAPHY.caption, { color: COLORS.warning, fontWeight: '600' }]}>
                    Fix Now →
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}

        {/* Credit Cards Section */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Credit Cards
        </Text>

        <Card style={{ marginTop: SPACING.md }}>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
            HDFC Regalia
          </Text>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.error, marginTop: SPACING.xs }]}>
            -{CURRENCY.symbol}30,506
          </Text>
          <View style={[styles.progressBar, { marginTop: SPACING.md }]}>
            <View
              style={[
                styles.progressFill,
                { width: '35%', backgroundColor: COLORS.error },
              ]}
            />
          </View>
        </Card>

        {/* Wallets */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Wallets
        </Text>

        <Card style={{ marginTop: SPACING.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                Amazon
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                {CURRENCY.symbol}410
              </Text>
            </View>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Metro Card
            </Text>
          </View>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, marginTop: SPACING.sm }]}>
            {CURRENCY.symbol}1,724
          </Text>
        </Card>
      </ScrollView>

      {/* FABs */}
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
  summaryGrid: {
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
    justifyContent: 'center',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
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

export default AccountsScreen;
