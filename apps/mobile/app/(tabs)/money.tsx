import { useState, useMemo } from 'react';
import {
  View, Text, FlatList, RefreshControl,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getAccounts, getTransactions } from '@myorbit/api';
import type { Account, Transaction } from '@myorbit/api';
import Screen from '@/components/shared/Screen';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import { Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';

const ACCOUNT_TYPES = ['All', 'Bank', 'Credit Card', 'Debit Card', 'Cash', 'Wallet'] as const;

export default function MoneyScreen() {
  const [refreshing, setRefreshing]             = useState(false);
  const [selectedType, setSelectedType]         = useState('All');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const { data: accounts = [], isLoading: acLoading, refetch: refetchAc } =
    useQuery<Account[]>({ queryKey: ['accounts'], queryFn: getAccounts });

  const { data: transactions = [], isLoading: txLoading, refetch: refetchTx } =
    useQuery<Transaction[]>({
      queryKey: ['transactions'],
      queryFn:  () => getTransactions(),
    });

  const visibleTypes = ACCOUNT_TYPES.filter(t =>
    t === 'All' || accounts.some(a => a.type === t)
  );

  const filteredTxs = useMemo(() => {
    if (selectedType === 'All' && !selectedAccountId) return transactions;
    const typeIds = new Set(
      accounts
        .filter(a => selectedType === 'All' || a.type === selectedType)
        .map(a => a.id)
    );
    const targetIds = selectedAccountId ? new Set([selectedAccountId]) : typeIds;
    return transactions.filter(t => t.accountId && targetIds.has(t.accountId));
  }, [transactions, accounts, selectedType, selectedAccountId]);

  const summary = useMemo(() => {
    const now = new Date();
    const thisMonth = filteredTxs.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income  = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    return { income, expense, net: income - expense };
  }, [filteredTxs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAc(), refetchTx()]);
    setRefreshing(false);
  };

  if (acLoading || txLoading) return <LoadingSkeleton />;

  return (
    <Screen scrollable={false}>
      <View className="pt-6 pb-3">
        <Text className="text-2xl font-bold text-gray-900">Money</Text>
        <Text className="text-sm text-gray-500 mt-0.5">This month</Text>
      </View>

      {/* Summary row */}
      <View className="flex-row gap-2 mb-4">
        {[
          { label: 'Income',  value: summary.income,  color: '#10B981' },
          { label: 'Expense', value: summary.expense, color: '#F43F5E' },
          { label: 'Net',     value: summary.net,     color: summary.net >= 0 ? '#10B981' : '#F43F5E' },
        ].map(m => (
          <View key={m.label} className="flex-1 rounded-2xl bg-white border border-gray-100 p-3">
            <Text className="text-xs text-gray-400">{m.label}</Text>
            <Text className="text-sm font-bold mt-0.5" style={{ color: m.color }}>
              ₹{Math.abs(m.value).toLocaleString('en-IN')}
            </Text>
          </View>
        ))}
      </View>

      {/* Account type filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3 flex-none"
      >
        <View className="flex-row gap-2 pr-4">
          {visibleTypes.map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => { setSelectedType(type); setSelectedAccountId(''); }}
              className={`rounded-full px-3 py-1.5 ${
                selectedType === type
                  ? 'bg-gray-900'
                  : 'border border-gray-300'
              }`}
            >
              <Text className={`text-xs font-medium ${
                selectedType === type ? 'text-white' : 'text-gray-500'
              }`}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Transaction list */}
      {filteredTxs.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No transactions"
          subtitle="No transactions for this period"
        />
      ) : (
        <FlatList
          data={filteredTxs.slice(0, 60)}
          keyExtractor={t => t.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#10B981"
            />
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item: tx }) => {
            const isPositive = tx.amount > 0;
            return (
              <View className="flex-row items-center gap-3 rounded-xl bg-white border border-gray-100 px-3 py-3 mb-1.5">
                <View
                  className={`h-9 w-9 rounded-xl items-center justify-center ${
                    isPositive ? 'bg-emerald-50' : 'bg-rose-50'
                  }`}
                >
                  {isPositive
                    ? <ArrowUpRight  size={16} color="#10B981" />
                    : <ArrowDownLeft size={16} color="#F43F5E" />
                  }
                </View>
                <View className="flex-1 min-w-0">
                  <Text
                    className="text-sm font-medium text-gray-900"
                    numberOfLines={1}
                  >
                    {tx.description}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {tx.category} · {tx.date}
                  </Text>
                </View>
                <Text
                  className={`text-sm font-bold ${
                    isPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isPositive ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                </Text>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
