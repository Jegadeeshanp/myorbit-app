import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  CheckBox,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { MyOrbitHeader, Card, Button, FAB } from '../../../components/common';

export const FinanceSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'preferences' | 'categories' | 'data'>('preferences');
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [expenseSubTab, setExpenseSubTab] = useState<'expense' | 'income'>('expense');

  const currencies = [
    { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
    { code: 'USD', label: 'USD', symbol: '$' },
    { code: 'EUR', label: 'EUR', symbol: '€' },
    { code: 'GBP', label: 'GBP', symbol: '£' },
    { code: 'SGD', label: 'SGD', symbol: 'S$' },
    { code: 'AED', label: 'UAE Dirham', symbol: 'د.إ' },
  ];

  const categories = [
    'Rent', 'Groceries', 'Restaurants', 'Fuel', 'Transport',
    'Utilities', 'Internet', 'Mobile', 'Shopping', 'Subscriptions',
    'Medical', 'Insurance', 'Travel', 'Education', 'Gifts',
    'Miscellaneous', 'Food', 'Bills', 'Healthcare', 'Entertainment',
    'Loan', 'Investment', 'Others',
  ];

  const expenseTrackingCategories = [
    'Food', 'Transport', 'Shopping', 'Bills', 'Healthcare',
    'Entertainment', 'Education', 'Travel', 'Others', 'Subscriptions',
    'Groceries', 'Investment', 'Restaurants', 'Helper Salary', 'Internet',
    'Loan', 'Office', 'Medical', 'Maintenance', 'Rent', 'Family',
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: SPACING.md }}>
          <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>
            Finance Settings
          </Text>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
            Manage your finance preferences and data
          </Text>
        </View>
        <MyOrbitHeader />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['preferences', 'categories', 'data'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: COLORS.tasks, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                TYPOGRAPHY.bodySmall,
                {
                  color: activeTab === tab ? COLORS.tasks : COLORS.textSecondary,
                  fontWeight: activeTab === tab ? '600' : '400',
                },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {activeTab === 'preferences' && (
          <>
            {/* Currency */}
            <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>
              Choose your default display currency
            </Text>

            <View style={[styles.grid, { marginTop: SPACING.lg }]}>
              {currencies.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  onPress={() => setSelectedCurrency(curr.code)}
                  style={[
                    styles.currencyOption,
                    selectedCurrency === curr.code && { borderColor: COLORS.tasks, borderWidth: 2 },
                  ]}
                >
                  <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textPrimary }]}>
                    {curr.code}
                  </Text>
                  <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                    {curr.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Default View */}
            <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
              Default View
            </Text>

            <View style={[styles.grid, { marginTop: SPACING.lg }]}>
              {['Overview', 'Transactions', 'Accounts', 'Assets'].map((view) => (
                <Card
                  key={view}
                  style={[
                    styles.viewOption,
                    view === 'Overview' && { backgroundColor: COLORS.tasks + '20' },
                  ]}
                  onPress={() => {}}
                >
                  <Text
                    style={[
                      TYPOGRAPHY.bodySmall,
                      {
                        color: view === 'Overview' ? COLORS.tasks : COLORS.textPrimary,
                        fontWeight: view === 'Overview' ? '600' : '400',
                      },
                    ]}
                  >
                    {view}
                  </Text>
                </Card>
              ))}
            </View>
          </>
        )}

        {activeTab === 'categories' && (
          <>
            {/* Sub-toggle */}
            <View style={styles.subToggle}>
              <TouchableOpacity
                onPress={() => setExpenseSubTab('expense')}
                style={[
                  styles.subToggleButton,
                  expenseSubTab === 'expense' && { backgroundColor: COLORS.error + '20' },
                ]}
              >
                <Text
                  style={[
                    TYPOGRAPHY.bodySmall,
                    {
                      color: expenseSubTab === 'expense' ? COLORS.error : COLORS.textSecondary,
                      fontWeight: expenseSubTab === 'expense' ? '600' : '400',
                    },
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setExpenseSubTab('income')}
                style={[
                  styles.subToggleButton,
                  expenseSubTab === 'income' && { backgroundColor: COLORS.tasks + '20' },
                ]}
              >
                <Text
                  style={[
                    TYPOGRAPHY.bodySmall,
                    {
                      color: expenseSubTab === 'income' ? COLORS.tasks : COLORS.textSecondary,
                      fontWeight: expenseSubTab === 'income' ? '600' : '400',
                    },
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            {/* Add New Category */}
            <Card style={{ marginTop: SPACING.lg, padding: SPACING.lg }}>
              <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary, marginBottom: SPACING.md }]}>
                ADD NEW CATEGORY
              </Text>
              <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                <View style={[styles.iconPicker, { flex: 1 }]} />
                <View style={[styles.input, { flex: 2 }]} />
                <Button title="+ Add" onPress={() => {}} size="small" />
              </View>
            </Card>

            {/* Categories List */}
            <Text
              style={[
                TYPOGRAPHY.bodySmall,
                { color: COLORS.textSecondary, marginTop: SPACING.lg },
              ]}
            >
              EXPENSE CATEGORIES — {categories.length} total
            </Text>

            {categories.map((cat) => (
              <Card key={cat} style={{ marginTop: SPACING.sm, padding: SPACING.md, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, marginRight: SPACING.md }}>🏷</Text>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary, flex: 1 }]}>
                  {cat}
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                  🔒 built-in
                </Text>
              </Card>
            ))}
          </>
        )}

        {activeTab === 'data' && (
          <>
            {/* Import Data */}
            <Card style={{ padding: SPACING.lg }}>
              <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>
                Import Data
              </Text>
              <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary, marginTop: SPACING.md }]}>
                Import assets and transactions from Excel or CSV files.
              </Text>
              <Button
                title="⬆ Import from Excel / CSV"
                onPress={() => {}}
                color={COLORS.tasks}
                style={{ marginTop: SPACING.lg }}
              />
            </Card>

            {/* Export Data */}
            <Card style={{ marginTop: SPACING.lg, padding: SPACING.lg }}>
              <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>
                Export Data
              </Text>
              <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary, marginTop: SPACING.md }]}>
                Export all your data (assets, liabilities, snapshots, goals) at any time.
              </Text>

              <View style={{ gap: SPACING.md, marginTop: SPACING.lg }}>
                <Button title="⬇ Export CSV" onPress={() => {}} variant="outline" />
                <Button title="⬇ Export JSON" onPress={() => {}} color={COLORS.tasks} />
              </View>

              <Card
                style={{
                  marginTop: SPACING.lg,
                  backgroundColor: COLORS.surface,
                  padding: SPACING.md,
                }}
              >
                <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                  📦 CSV — Transactions only
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, marginTop: SPACING.sm }]}>
                  📁 JSON — All data: accounts, assets, liabilities, budgets
                </Text>
              </Card>
            </Card>
          </>
        )}
      </ScrollView>

      {/* FABs */}
      <FAB
        icon={<Text style={{ fontSize: 20 }}>🤖</Text>}
        onPress={() => {}}
        color={COLORS.purple}
        style={{ bottom: SPACING.xl + 64 + SPACING.lg, right: SPACING.xl }}
      />
      <FAB
        icon={<Text style={{ fontSize: 18 }}>+</Text>}
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
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  currencyOption: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  viewOption: {
    width: '48%',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  subToggle: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  subToggleButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  iconPicker: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 44,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 44,
  },
});

export default FinanceSettingsScreen;
