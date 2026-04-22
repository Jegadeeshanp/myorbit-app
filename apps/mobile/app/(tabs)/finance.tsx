import { useState, useMemo, useEffect } from 'react';
import { router } from 'expo-router';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccounts, getTransactions, createTransaction, deleteTransaction,
  getAssets, createAsset, updateAsset, deleteAsset,
  getLiabilities, createLiability, updateLiability, deleteLiability,
} from '@myorbit/api';
import type {
  Account, Transaction, CreateTransactionInput,
  Asset, Liability, CreateAssetInput, CreateLiabilityInput,
} from '@myorbit/api';
import {
  TrendingUp, TrendingDown, ArrowLeftRight, Plus, Wallet,
  CreditCard, Banknote, ChevronLeft, ChevronRight, Trash2,
  LayoutDashboard, Landmark, BarChart3,
  MoreHorizontal, X, Settings, Pencil, CheckCircle,
  CalendarDays, DollarSign, Tag,
  ShieldCheck, Lightbulb, Calendar, PieChart,
  Search, Shield, Activity, Zap,
  Home, ShoppingCart, Utensils, Fuel, Bus, Wifi, Smartphone,
  ShoppingBag, RefreshCw, Stethoscope, Plane, GraduationCap,
  Gift, Package, Coffee, Receipt, Heart, Film, PiggyBank,
  Briefcase, Award, Laptop, Building2, Percent, RotateCcw,
  Undo2, Star, Repeat2, ChevronDown,
} from 'lucide-react-native';
import AppHeader from '@/components/shared/AppHeader';
import { Svg, Path } from 'react-native-svg';

// ── Types ──────────────────────────────────────────────────────────────────────

type SubTab = 'overview' | 'accounts' | 'transactions' | 'assets' | 'liabilities' | 'budget' | 'vitals' | 'settings';

// ── Constants ──────────────────────────────────────────────────────────────────

const ACCENT = '#10B981';
const SCREEN_BG = '#111111';
const SURFACE = '#171A20';
const SURFACE_ALT = '#1D222B';
const BORDER = '#252B35';
const MUTED = '#94A3B8';
const SUBTLE = '#667085';

const SUB_TABS = [
  { key: 'overview'      as SubTab, label: 'Overview',     Icon: LayoutDashboard },
  { key: 'transactions'  as SubTab, label: 'Transactions', Icon: ArrowLeftRight  },
  { key: 'assets'        as SubTab, label: 'Assets',       Icon: TrendingUp      },
  { key: 'liabilities'   as SubTab, label: 'Liabilities',  Icon: CreditCard      },
];

const MORE_ITEMS = [
  { key: 'accounts'  as SubTab, label: 'Accounts', Icon: Landmark  },
  { key: 'budget'    as SubTab, label: 'Budget',   Icon: Wallet    },
  { key: 'vitals'    as SubTab, label: 'Vitals',   Icon: BarChart3 },
  { key: 'settings'  as SubTab, label: 'Settings', Icon: Settings  },
];

const ACCOUNT_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'Bank': Landmark, 'Credit Card': CreditCard, 'Debit Card': CreditCard,
  'Cash': Banknote, 'Wallet': Wallet,
};
const ACCOUNT_COLORS: Record<string, string> = {
  'Bank': '#10B981', 'Credit Card': '#EF4444', 'Debit Card': '#3B82F6',
  'Cash': '#F59E0B', 'Wallet': '#8B5CF6',
};

const INCOME_CATEGORIES = [
  'Salary', 'Bonus', 'Freelance', 'Business', 'Dividends',
  'Interest', 'Rental Income', 'Cashback', 'Refund', 'Gifts', 'Other Income', 'Friends',
];
const EXPENSE_CATEGORIES = [
  'Rent', 'Groceries', 'Restaurants', 'Fuel', 'Transport', 'Utilities',
  'Internet', 'Mobile', 'Shopping', 'Subscriptions', 'Medical', 'Insurance',
  'Travel', 'Education', 'Gifts', 'Miscellaneous', 'Food', 'Bills',
  'Healthcare', 'Entertainment', 'Loan', 'Investment', 'Others', 'Housing', 'Family',
];

type CatCfg = { Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>; bg: string; color: string };
const CATEGORY_CONFIG: Record<string, CatCfg> = {
  // Expense
  'Rent':          { Icon: Home,          bg: '#581C87', color: '#C084FC' },
  'Groceries':     { Icon: ShoppingCart,  bg: '#14532D', color: '#4ADE80' },
  'Restaurants':   { Icon: Utensils,      bg: '#7C2D12', color: '#FB923C' },
  'Fuel':          { Icon: Fuel,          bg: '#78350F', color: '#FCD34D' },
  'Transport':     { Icon: Bus,           bg: '#1E3A5F', color: '#60A5FA' },
  'Utilities':     { Icon: Zap,           bg: '#713F12', color: '#FDE047' },
  'Internet':      { Icon: Wifi,          bg: '#0C3454', color: '#38BDF8' },
  'Mobile':        { Icon: Smartphone,    bg: '#134E4A', color: '#2DD4BF' },
  'Shopping':      { Icon: ShoppingBag,   bg: '#831843', color: '#F472B6' },
  'Subscriptions': { Icon: RefreshCw,     bg: '#3B0764', color: '#A78BFA' },
  'Medical':       { Icon: Stethoscope,   bg: '#7F1D1D', color: '#FCA5A5' },
  'Insurance':     { Icon: Shield,        bg: '#064E3B', color: '#34D399' },
  'Travel':        { Icon: Plane,         bg: '#1E3A5F', color: '#93C5FD' },
  'Education':     { Icon: GraduationCap, bg: '#2E1065', color: '#C084FC' },
  'Gifts':         { Icon: Gift,          bg: '#500724', color: '#FB7185' },
  'Miscellaneous': { Icon: Package,       bg: '#1C1C2E', color: '#94A3B8' },
  'Food':          { Icon: Coffee,        bg: '#713F12', color: '#FCD34D' },
  'Bills':         { Icon: Receipt,       bg: '#1C1C2E', color: '#94A3B8' },
  'Healthcare':    { Icon: Heart,         bg: '#7F1D1D', color: '#F87171' },
  'Entertainment': { Icon: Film,          bg: '#3B0764', color: '#A78BFA' },
  'Loan':          { Icon: Landmark,      bg: '#7C2D12', color: '#FDBA74' },
  'Investment':    { Icon: PiggyBank,     bg: '#14532D', color: '#4ADE80' },
  'Others':        { Icon: Tag,           bg: '#1F2937', color: '#9CA3AF' },
  'Housing':       { Icon: Home,          bg: '#1F2937', color: '#9CA3AF' },
  'Family':        { Icon: Heart,         bg: '#1C1C2E', color: '#E5E7EB' },
  'Food & Dining': { Icon: Coffee,        bg: '#713F12', color: '#FCD34D' },
  'Bills & Utilities': { Icon: Receipt,   bg: '#1C1C2E', color: '#94A3B8' },
  'Personal Care': { Icon: Star,          bg: '#1C1C2E', color: '#94A3B8' },
  'Other':         { Icon: Tag,           bg: '#1F2937', color: '#9CA3AF' },
  // Income
  'Salary':        { Icon: Briefcase,     bg: '#14532D', color: '#4ADE80' },
  'Bonus':         { Icon: Award,         bg: '#14532D', color: '#4ADE80' },
  'Freelance':     { Icon: Laptop,        bg: '#1E3A5F', color: '#60A5FA' },
  'Business':      { Icon: Building2,     bg: '#3B0764', color: '#C084FC' },
  'Dividends':     { Icon: TrendingUp,    bg: '#064E3B', color: '#34D399' },
  'Interest':      { Icon: Percent,       bg: '#134E4A', color: '#2DD4BF' },
  'Rental Income': { Icon: Home,          bg: '#78350F', color: '#FB923C' },
  'Cashback':      { Icon: RotateCcw,     bg: '#14532D', color: '#4ADE80' },
  'Refund':        { Icon: Undo2,         bg: '#1C1C2E', color: '#94A3B8' },
  'Gift':          { Icon: Gift,          bg: '#500724', color: '#FB7185' },
  'Other Income':  { Icon: Package,       bg: '#1C1C2E', color: '#94A3B8' },
  'Friends':       { Icon: Star,          bg: '#1C1C2E', color: '#94A3B8' },
};

function getCatIcon(cat: string): CatCfg {
  return CATEGORY_CONFIG[cat] ?? { Icon: Tag, bg: '#1F2937', color: '#9CA3AF' };
}

const ASSET_CATEGORY_LIST = [
  'Stocks & Equity', 'Mutual Funds', 'Real Estate', 'Gold & Silver',
  'FD & RD', 'Bonds', 'Debt Funds', 'EPF / PPF / NPS', 'SSY', 'Crypto',
  'International', 'Employer Stock', 'Cash & Savings', 'Liquid Funds',
  'Arbitrage Funds', 'Commodities', 'ULIP', 'Moneyback Insurance',
  'Endowment Plans', 'Other',
];

const ASSET_CATEGORY_COLORS: Record<string, string> = {
  'Stocks & Equity': '#3B82F6', 'Mutual Funds': '#8B5CF6', 'Real Estate': '#D97706',
  'Gold & Silver': '#EAB308', 'FD & RD': '#10B981', 'Bonds': '#6366F1',
  'Debt Funds': '#0D9488', 'EPF / PPF / NPS': '#16A34A', 'SSY': '#EC4899',
  'Crypto': '#EA580C', 'International': '#0EA5E9', 'Employer Stock': '#7C3AED',
  'Cash & Savings': '#10B981', 'Liquid Funds': '#06B6D4', 'Arbitrage Funds': '#3B82F6',
  'Commodities': '#78716C', 'ULIP': '#6B7280', 'Moneyback Insurance': '#F43F5E',
  'Endowment Plans': '#64748B', 'Other': '#9CA3AF',
};

const BUDGET_BLUEPRINT = [
  { key: 'housing', label: 'Housing', categories: ['Housing', 'Bills & Utilities'], limit: 50000, color: '#10B981' },
  { key: 'food', label: 'Food + Outside', categories: ['Food & Dining'], limit: 10000, color: '#F59E0B' },
  { key: 'groceries', label: 'Groceries', categories: ['Shopping'], limit: 20000, color: '#14B8A6' },
  { key: 'transport', label: 'Transportation', categories: ['Transport', 'Travel'], limit: 15000, color: '#3B82F6' },
  { key: 'medical', label: 'Medical', categories: ['Healthcare'], limit: 3000, color: '#EF4444' },
  { key: 'lifestyle', label: 'Life Style', categories: ['Entertainment', 'Personal Care'], limit: 15000, color: '#8B5CF6' },
  { key: 'learning', label: 'Learning', categories: ['Education'], limit: 6000, color: '#0EA5E9' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  const abs = Math.abs(n);
  if (abs >= 10_000_000) return `₹${(abs / 10_000_000).toFixed(2)}Cr`;
  if (abs >= 100_000)    return `₹${(abs / 100_000).toFixed(2)}L`;
  return '₹' + abs.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function monthLabel(year: number, month: number) {
  return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function advanceMonth(dateStr: string): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function catColor(cat: string) {
  return ASSET_CATEGORY_COLORS[cat] ?? '#9CA3AF';
}

function budgetStatusColor(ratio: number) {
  if (ratio >= 1) return '#EF4444';
  if (ratio >= 0.75) return '#F59E0B';
  return '#10B981';
}

// ── Sub Nav ────────────────────────────────────────────────────────────────────

function SubNav({ active, onSelect, onMore }: {
  active: SubTab; onSelect: (t: SubTab) => void; onMore: () => void;
}) {
  const isMoreActive = !SUB_TABS.some(t => t.key === active);
  return (
    <View style={{ flexDirection: 'row', backgroundColor: SCREEN_BG, borderTopWidth: 1, borderTopColor: BORDER }}>
      {SUB_TABS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <TouchableOpacity key={key} onPress={() => onSelect(key)}
            style={{ flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 7 }}>
            <Icon size={20} color={isActive ? ACCENT : SUBTLE} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: isActive ? ACCENT : SUBTLE, marginTop: 3 }}>{label}</Text>
            {isActive && <View style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, backgroundColor: ACCENT, borderRadius: 1 }} />}
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity onPress={onMore} style={{ width: 52, alignItems: 'center', paddingTop: 8, paddingBottom: 7 }}>
        <MoreHorizontal size={20} color={isMoreActive ? ACCENT : SUBTLE} />
        <Text style={{ fontSize: 12, fontWeight: '500', color: isMoreActive ? ACCENT : SUBTLE, marginTop: 3 }}>More</Text>
        {isMoreActive && <View style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, backgroundColor: ACCENT, borderRadius: 1 }} />}
      </TouchableOpacity>
    </View>
  );
}

// ── More Sheet ─────────────────────────────────────────────────────────────────

function MoreSheet({ visible, active, onSelect, onClose }: {
  visible: boolean; active: SubTab; onSelect: (t: SubTab) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose} />
        <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#3A3A3A', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' }}>
            <Text style={{ fontWeight: '600', fontSize: 15, color: '#FFFFFF' }}>More</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          {MORE_ITEMS.map(({ key, label, Icon }) => (
            <TouchableOpacity key={key} onPress={() => { onSelect(key); onClose(); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: active === key ? '#052e1a' : 'transparent' }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: active === key ? ACCENT + '22' : '#242424', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={active === key ? ACCENT : '#9CA3AF'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: active === key ? ACCENT : '#E5E7EB' }}>{label}</Text>
              </View>
              {active === key && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT }} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

// ── Month Selector ─────────────────────────────────────────────────────────────

function MonthSelector({ year, month, onPrev, onNext }: {
  year: number; month: number; onPrev: () => void; onNext: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 14, marginVertical: 10, backgroundColor: SURFACE, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: BORDER }}>
      <TouchableOpacity onPress={onPrev} style={{ padding: 4 }}><ChevronLeft size={20} color="#9CA3AF" /></TouchableOpacity>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>{monthLabel(year, month)}</Text>
      <TouchableOpacity onPress={onNext} style={{ padding: 4 }}><ChevronRight size={20} color="#9CA3AF" /></TouchableOpacity>
    </View>
  );
}

// ── Account Card (horizontal scroll) ──────────────────────────────────────────

function AccountCard({ account }: { account: Account }) {
  const Icon = ACCOUNT_ICONS[account.type] ?? Wallet;
  const color = ACCOUNT_COLORS[account.type] ?? '#64748B';
  return (
    <View style={{ width: 160, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 14, marginRight: 12, borderWidth: 1, borderColor: color + '22' }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Icon size={18} color={color} />
      </View>
      <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 2 }}>{account.type}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }} numberOfLines={1}>{account.name}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: account.balance >= 0 ? '#10B981' : '#EF4444' }}>{formatINR(account.balance)}</Text>
    </View>
  );
}

// ── Account Row (vertical list) ────────────────────────────────────────────────

function AccountRow({ account }: { account: Account }) {
  const color = ACCOUNT_COLORS[account.type] ?? '#64748B';
  const Icon = ACCOUNT_ICONS[account.type] ?? Wallet;
  return (
    <View style={{ backgroundColor: SURFACE, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER }}>
      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Icon size={17} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>{account.name}</Text>
        <Text style={{ fontSize: 16, color: MUTED, marginTop: 2 }}>{account.type}</Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '700', color: account.balance >= 0 ? '#10B981' : '#EF4444' }}>{formatINR(account.balance)}</Text>
    </View>
  );
}

// ── Transaction Item ───────────────────────────────────────────────────────────

function TxItem({ tx, onDelete }: { tx: Transaction; onDelete: (id: string) => void }) {
  const isIncome   = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';
  const Icon  = isTransfer ? ArrowLeftRight : isIncome ? TrendingUp : TrendingDown;
  const color = isTransfer ? '#3B82F6' : isIncome ? '#10B981' : '#EF4444';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: 1, borderBottomColor: BORDER }}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
        <Icon size={14} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#FFFFFF' }} numberOfLines={1}>{tx.description}</Text>
        <Text style={{ fontSize: 16, color: MUTED, marginTop: 2 }}>{tx.category} - {tx.date}</Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '700', color, marginRight: 8 }}>
        {isIncome ? '+' : isTransfer ? '' : '-'}{formatINR(tx.amount)}
      </Text>
      <TouchableOpacity onPress={() => onDelete(tx.id)} style={{ padding: 4 }}>
        <Trash2 size={15} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

// ── Asset Card ─────────────────────────────────────────────────────────────────

function AssetCard({ asset, onEdit, onDelete }: {
  asset: Asset;
  onEdit: (a: Asset) => void;
  onDelete: (id: string) => void;
}) {
  const color = catColor(asset.category);
  const pnl   = asset.value - asset.invested;
  const pnlPct = asset.invested > 0 ? ((pnl / asset.invested) * 100).toFixed(1) : '0';
  return (
    <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Tag size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }} numberOfLines={1}>{asset.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 }}>
            <View style={{ backgroundColor: color + '20', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color }}>{asset.category}</Text>
            </View>
            {asset.units != null && asset.units > 0 && (
              <Text style={{ fontSize: 16, color: '#9CA3AF' }}>{asset.units} units</Text>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => onEdit(asset)} style={{ padding: 4 }}>
            <Pencil size={15} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(asset.id)} style={{ padding: 4 }}>
            <Trash2 size={15} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 14, gap: 8 }}>
        <View style={{ flex: 1, backgroundColor: '#242424', borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 2 }}>Invested</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#E5E7EB' }}>{formatINR(asset.invested)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#242424', borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 2 }}>Current Value</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#10B981' }}>{formatINR(asset.value)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: pnl >= 0 ? '#10B98122' : '#EF444422', borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 2 }}>P&L</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: pnl >= 0 ? '#10B981' : '#EF4444' }}>
            {pnl >= 0 ? '+' : '−'}{formatINR(pnl)} ({pnl >= 0 ? '+' : ''}{pnlPct}%)
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Liability Card ─────────────────────────────────────────────────────────────

function LiabilityCard({ liability, onPay, onEdit, onDelete }: {
  liability: Liability;
  onPay:    (l: Liability) => void;
  onEdit:   (l: Liability) => void;
  onDelete: (id: string) => void;
}) {
  const days    = daysUntil(liability.nextDueDate);
  const overdue = days !== null && days < 0;
  const dueSoon = days !== null && days <= 7 && days >= 0;
  const paidPct = liability.borrowed > 0
    ? Math.round((liability.totalRepaid / liability.borrowed) * 100)
    : 0;

  return (
    <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#EF444422', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <CreditCard size={18} color="#EF4444" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>{liability.name}</Text>
          {!!liability.lender && (
            <Text style={{ fontSize: 16, color: '#9CA3AF', marginTop: 1 }}>{liability.lender}</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => onPay(liability)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B98122', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <CheckCircle size={12} color={ACCENT} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: ACCENT }}>Pay</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onEdit(liability)} style={{ padding: 4 }}>
            <Pencil size={15} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(liability.id)} style={{ padding: 4 }}>
            <Trash2 size={15} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ marginTop: 12, marginBottom: 8 }}>
        <View style={{ height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ height: 6, width: `${paidPct}%` as `${number}%`, backgroundColor: ACCENT, borderRadius: 3 }} />
        </View>
        <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>{paidPct}% repaid</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, backgroundColor: '#242424', borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 2 }}>Outstanding</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>{formatINR(liability.outstanding)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#242424', borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 2 }}>EMI / mo</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#E5E7EB' }}>{formatINR(liability.monthlyEmi)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: overdue ? '#EF444422' : dueSoon ? '#D9770622' : '#242424', borderRadius: 10, padding: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 }}>
            <CalendarDays size={10} color={overdue ? '#EF4444' : dueSoon ? '#D97706' : '#9CA3AF'} />
            <Text style={{ fontSize: 14, color: overdue ? '#EF4444' : dueSoon ? '#D97706' : '#9CA3AF' }}>Next due</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: overdue ? '#EF4444' : dueSoon ? '#D97706' : '#E5E7EB' }}>
            {fmtDate(liability.nextDueDate)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
          {liability.emisLeft} EMIs left · Borrowed {formatINR(liability.borrowed)}
        </Text>
        <Text style={{ fontSize: 14, color: '#10B981' }}>Repaid {formatINR(liability.totalRepaid)}</Text>
      </View>
    </View>
  );
}

// ── Add Transaction Modal ──────────────────────────────────────────────────────

function AddTxModal({ visible, onClose, accounts, onSave }: {
  visible: boolean; onClose: () => void;
  accounts: Account[]; onSave: (data: CreateTransactionInput) => void;
}) {
  const today = new Date().toLocaleDateString('en-CA');
  const [type,       setType]       = useState<'income' | 'expense' | 'transfer'>('expense');
  const [amount,     setAmount]     = useState('');
  const [desc,       setDesc]       = useState('');
  const [category,   setCategory]   = useState('');
  const [date,       setDate]       = useState(today);
  const [accountId,  setAccId]      = useState('');
  const [fromAccId,  setFromAccId]  = useState('');
  const [toAccId,    setToAccId]    = useState('');
  const [recurring,  setRecurring]  = useState(false);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const typeColor = type === 'income' ? '#10B981' : type === 'expense' ? '#EF4444' : '#3B82F6';
  const typeIcons = { expense: TrendingDown, income: TrendingUp, transfer: ArrowLeftRight };

  const reset = () => {
    setAmount(''); setDesc(''); setCategory(''); setDate(today);
    setAccId(''); setFromAccId(''); setToAccId(''); setRecurring(false);
  };

  const save = () => {
    const amt = parseFloat(amount);
    if (type === 'transfer') {
      if (!amt || !fromAccId || !toAccId) return;
      onSave({ type, amount: Math.abs(amt), description: desc.trim() || 'Transfer', category: 'Transfer', date, accountId: fromAccId, toAccountId: toAccId } as any);
    } else {
      if (!amt || !category) return;
      onSave({ type, amount: type === 'expense' ? -Math.abs(amt) : Math.abs(amt), description: desc.trim() || category, category, date, accountId: accountId || undefined });
    }
    reset(); onClose();
  };

  const AccountPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (id: string) => void }) => (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>{label}</Text>
      <View style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', overflow: 'hidden' }}>
        {accounts.length === 0 ? (
          <View style={{ padding: 12 }}><Text style={{ color: '#6B7280', fontSize: 14 }}>No accounts</Text></View>
        ) : (
          accounts.map((a, i) => (
            <TouchableOpacity key={a.id} onPress={() => onChange(a.id)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: i < accounts.length - 1 ? 1 : 0, borderBottomColor: '#2A2A2A', backgroundColor: value === a.id ? '#10B98115' : 'transparent' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: value === a.id ? '#10B981' : '#E5E7EB' }} numberOfLines={1}>{a.name}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>{a.type}</Text>
              </View>
              <ChevronDown size={14} color={value === a.id ? '#10B981' : '#4B5563'} />
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: '#141414', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 12, paddingBottom: 36 }}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 14 }} />

          {/* Type tabs */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222', marginBottom: 20 }}>
            {(['expense', 'income', 'transfer'] as const).map((t) => {
              const c = t === 'income' ? '#10B981' : t === 'expense' ? '#EF4444' : '#3B82F6';
              const TIcon = typeIcons[t];
              return (
                <TouchableOpacity key={t} onPress={() => { setType(t); setCategory(''); reset(); }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: type === t ? c : 'transparent' }}>
                  <TIcon size={15} color={type === t ? c : '#6B7280'} />
                  <Text style={{ fontSize: 15, fontWeight: type === t ? '700' : '500', color: type === t ? c : '#6B7280', textTransform: 'capitalize' }}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8 }}>

            {/* ── TRANSFER FORM ── */}
            {type === 'transfer' && (
              <>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', letterSpacing: 1, marginBottom: 14 }}>TRANSFER DETAILS</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
                  <AccountPicker label="From account" value={fromAccId} onChange={setFromAccId} />
                  <AccountPicker label="To account"   value={toAccId}   onChange={setToAccId}   />
                </View>

                <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB', marginBottom: 8 }}>Amount (₹)</Text>
                <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#1E1E1E', paddingHorizontal: 16, paddingVertical: 13, fontSize: 20, fontWeight: '700', color: 'white', marginBottom: 18 }} placeholder="0" placeholderTextColor="#4B5563" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

                <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB', marginBottom: 6 }}>Date</Text>
                <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#1E1E1E', paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: 'white', marginBottom: 18 }} value={date} onChangeText={setDate} />

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB' }}>Note </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>Optional</Text>
                </View>
                <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#1E1E1E', paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: 'white', marginBottom: 18 }} placeholder="e.g. Monthly savings transfer" placeholderTextColor="#4B5563" value={desc} onChangeText={setDesc} />

                <TouchableOpacity onPress={() => setRecurring(r => !r)}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 14, padding: 14, marginBottom: 8 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#10B98122', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Repeat2 size={18} color="#10B981" />
                  </View>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Recurring</Text>
                  <View style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: recurring ? '#10B981' : '#333', justifyContent: 'center', paddingHorizontal: 3 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', alignSelf: recurring ? 'flex-end' : 'flex-start' }} />
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* ── EXPENSE / INCOME FORM ── */}
            {type !== 'transfer' && (
              <>
                {/* Amount */}
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB', marginBottom: 8 }}>Amount (₹)</Text>
                <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#1E1E1E', paddingHorizontal: 16, paddingVertical: 13, fontSize: 20, fontWeight: '700', color: 'white', marginBottom: 18 }} placeholder="0.00" placeholderTextColor="#4B5563" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

                {/* Description */}
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB', marginBottom: 8 }}>Description</Text>
                <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#1E1E1E', paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: 'white', marginBottom: 18 }} placeholder="e.g. Grocery shopping" placeholderTextColor="#4B5563" value={desc} onChangeText={setDesc} />

                {/* Category grid */}
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', letterSpacing: 1, marginBottom: 12 }}>CATEGORY</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                  {categories.map((c) => {
                    const cfg = getCatIcon(c);
                    const CIcon = cfg.Icon;
                    const isSelected = category === c;
                    return (
                      <TouchableOpacity key={c} onPress={() => setCategory(c)}
                        style={{ width: '31%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: isSelected ? typeColor : '#1E1E1E', backgroundColor: isSelected ? typeColor + '18' : '#1A1A1A' }}>
                        <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CIcon size={17} color={cfg.color} strokeWidth={1.8} />
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? typeColor : '#D1D5DB', flex: 1 }} numberOfLines={1}>{c}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity style={{ width: '31%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: '#2A2A2A', borderStyle: 'dashed' }}>
                    <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={17} color="#6B7280" />
                    </View>
                    <Text style={{ fontSize: 13, color: '#6B7280' }}>Add new</Text>
                  </TouchableOpacity>
                </View>

                {/* Account */}
                {accounts.length > 0 && (
                  <>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB', marginBottom: 8 }}>Account</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => setAccId('')}
                          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: !accountId ? ACCENT : '#2A2A2A', backgroundColor: !accountId ? '#10B98122' : '#1E1E1E' }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: !accountId ? ACCENT : '#6B7280' }}>None</Text>
                        </TouchableOpacity>
                        {accounts.map((a) => (
                          <TouchableOpacity key={a.id} onPress={() => setAccId(a.id)}
                            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: accountId === a.id ? ACCENT : '#2A2A2A', backgroundColor: accountId === a.id ? '#10B98122' : '#1E1E1E' }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: accountId === a.id ? ACCENT : '#6B7280' }}>{a.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </>
                )}

                {/* Date */}
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB', marginBottom: 8 }}>Date</Text>
                <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#1E1E1E', paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: 'white', marginBottom: 22 }} placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
              </>
            )}

            {/* Save / Cancel */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              <TouchableOpacity onPress={() => { reset(); onClose(); }} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#2A2A2A' }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#6B7280' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save}
                style={{ flex: 2, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: typeColor, opacity: (type === 'transfer' ? (!!amount && !!fromAccId && !!toAccId) : (!!amount && !!category)) ? 1 : 0.4 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>
                  {type === 'transfer' ? 'Transfer' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Add / Edit Asset Modal ─────────────────────────────────────────────────────

function AssetModal({ visible, initial, accounts, onClose, onSave }: {
  visible: boolean;
  initial?: Asset | null;
  accounts: Account[];
  onClose: () => void;
  onSave: (data: CreateAssetInput) => void;
}) {
  const isEdit = !!initial;
  const [name,     setName]     = useState('');
  const [category, setCategory] = useState(ASSET_CATEGORY_LIST[0]);
  const [invested, setInvested] = useState('');
  const [units,    setUnits]    = useState('');
  const [perUnit,  setPerUnit]  = useState('');
  const [value,    setValue]    = useState('');
  const [accountId,setAccId]    = useState('');
  const [invType,  setInvType]  = useState<'lump_sum' | 'sip'>('lump_sum');

  // Populate / reset fields whenever the modal opens or the target asset changes
  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setName(initial.name);
      setCategory(initial.category);
      setInvested(String(initial.invested));
      setValue(initial.value > 0 ? String(initial.value) : '');
      setUnits(initial.units != null ? String(initial.units) : '');
      setPerUnit(initial.units && initial.units > 0 && initial.value > 0
        ? String(Math.round((initial.value / initial.units) * 100) / 100)
        : '');
      setAccId(initial.accountId ?? '');
      setInvType((initial.investmentType ?? 'lump_sum') as 'lump_sum' | 'sip');
    } else {
      setName(''); setCategory(ASSET_CATEGORY_LIST[0]); setInvested('');
      setValue(''); setUnits(''); setPerUnit(''); setAccId(''); setInvType('lump_sum');
    }
  }, [visible, initial?.id]);  // re-run when modal opens or edit target changes

  const canSave = !!name.trim() && Number(invested) > 0;

  const handleSave = () => {
    if (!canSave) return;
    const numUnits   = Number(units) > 0 ? Number(units) : undefined;
    const numPerUnit = Number(perUnit) > 0 ? Number(perUnit) : undefined;
    const computedValue = numUnits && numPerUnit
      ? numUnits * numPerUnit
      : Number(value) > 0 ? Number(value) : Number(invested);
    onSave({
      name: name.trim(),
      category,
      invested: Number(invested),
      value: computedValue,
      units: numUnits ?? null,
      accountId: accountId || undefined,
      investmentType: invType,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#3A3A3A', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 }}>
            {isEdit ? 'Edit Asset' : 'Add Asset'}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
            {/* Category */}
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 8 }}>Asset Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {ASSET_CATEGORY_LIST.map((cat) => {
                  const c = catColor(cat);
                  const isActive = category === cat;
                  return (
                    <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: isActive ? c : '#2A2A2A', backgroundColor: isActive ? c + '20' : '#242424' }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: isActive ? c : '#9CA3AF' }}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Name */}
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>Asset Name</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'white', marginBottom: 16 }} placeholder="e.g. Reliance Industries" value={name} onChangeText={setName} />

            {/* Invested */}
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>Amount Invested (₹) *</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'white', marginBottom: 16 }} placeholder="0" value={invested} onChangeText={setInvested} keyboardType="decimal-pad" />

            {/* Units + Per Unit */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>Units (optional)</Text>
                <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'white' }} placeholder="e.g. 50" value={units} onChangeText={(v) => {
                  setUnits(v);
                  if (Number(v) > 0 && Number(perUnit) > 0) setValue(String(Number(v) * Number(perUnit)));
                }} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>Per Unit ₹ (optional)</Text>
                <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'white' }} placeholder="e.g. 2500" value={perUnit} onChangeText={(v) => {
                  setPerUnit(v);
                  if (Number(units) > 0 && Number(v) > 0) setValue(String(Number(units) * Number(v)));
                }} keyboardType="decimal-pad" />
              </View>
            </View>

            {/* Current Value */}
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>Current Value ₹ (optional)</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'white', marginBottom: 16 }} placeholder="Auto-computed from units × per unit" value={value} onChangeText={setValue} keyboardType="decimal-pad" />

            {/* Investment Type */}
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 8 }}>Investment Type</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {(['lump_sum', 'sip'] as const).map((t) => (
                <TouchableOpacity key={t} onPress={() => setInvType(t)}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: invType === t ? ACCENT : '#2A2A2A', backgroundColor: invType === t ? '#10B98122' : '#242424' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: invType === t ? ACCENT : '#6B7280' }}>{t === 'lump_sum' ? 'Lump Sum' : 'SIP'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Account */}
            {accounts.length > 0 && (
              <>
                <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 8 }}>Fund from Account (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => setAccId('')}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: !accountId ? ACCENT : '#2A2A2A', backgroundColor: !accountId ? '#10B98122' : '#242424' }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: !accountId ? ACCENT : '#6B7280' }}>None</Text>
                    </TouchableOpacity>
                    {accounts.map((a) => (
                      <TouchableOpacity key={a.id} onPress={() => setAccId(a.id)}
                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: accountId === a.id ? ACCENT : '#2A2A2A', backgroundColor: accountId === a.id ? '#10B98122' : '#242424' }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: accountId === a.id ? ACCENT : '#6B7280' }}>{a.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A' }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={!canSave}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: canSave ? 1 : 0.5 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>{isEdit ? 'Update' : 'Save Asset'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Add / Edit Liability Modal ─────────────────────────────────────────────────

function LiabilityModal({ visible, initial, accounts, onClose, onSave }: {
  visible: boolean;
  initial?: Liability | null;
  accounts: Account[];
  onClose: () => void;
  onSave: (data: CreateLiabilityInput) => void;
}) {
  const isEdit = !!initial;
  const [name,       setName]       = useState('');
  const [lender,     setLender]     = useState('');
  const [borrowed,   setBorrowed]   = useState('');
  const [outstanding,setOutstanding]= useState('');
  const [totalRepaid,setTotalRepaid]= useState('0');
  const [emi,        setEmi]        = useState('');
  const [emisLeft,   setEmisLeft]   = useState('');
  const [nextDue,    setNextDue]    = useState('');
  const [repAccId,   setRepAccId]   = useState('');

  // Populate / reset fields whenever the modal opens or the target liability changes
  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setName(initial.name); setLender(initial.lender ?? '');
      setBorrowed(String(initial.borrowed)); setOutstanding(String(initial.outstanding));
      setTotalRepaid(String(initial.totalRepaid ?? 0)); setEmi(String(initial.monthlyEmi));
      setEmisLeft(String(initial.emisLeft ?? '')); setNextDue(initial.nextDueDate ?? '');
      setRepAccId(initial.repaymentAccountId ?? '');
    } else {
      setName(''); setLender(''); setBorrowed(''); setOutstanding('');
      setTotalRepaid('0'); setEmi(''); setEmisLeft(''); setNextDue(''); setRepAccId('');
    }
  }, [visible, initial?.id]);

  const canSave = !!name.trim() && Number(borrowed) > 0 && Number(outstanding) >= 0 && Number(emi) > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      name:               name.trim(),
      lender:             lender.trim() || undefined,
      borrowed:           Number(borrowed),
      outstanding:        Number(outstanding),
      totalRepaid:        Number(totalRepaid) || 0,
      monthlyEmi:         Number(emi),
      emisLeft:           Number(emisLeft) || 0,
      nextDueDate:        nextDue || undefined,
      repaymentAccountId: repAccId || undefined,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#3A3A3A', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 }}>
            {isEdit ? 'Edit Liability' : 'Add Liability'}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>Loan Name *</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'white', marginBottom: 12 }} placeholder="Home Loan" value={name} onChangeText={setName} />

            <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>Lender / Bank</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'white', marginBottom: 12 }} placeholder="SBI Bank" value={lender} onChangeText={setLender} />

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>Total Borrowed (₹) *</Text>
                <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'white' }} placeholder="2500000" value={borrowed} onChangeText={setBorrowed} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>Outstanding (₹) *</Text>
                <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'white' }} placeholder="210000" value={outstanding} onChangeText={setOutstanding} keyboardType="decimal-pad" />
              </View>
            </View>

            <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>Total Repaid (₹)</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'white', marginBottom: 12 }} placeholder="0" value={totalRepaid} onChangeText={setTotalRepaid} keyboardType="decimal-pad" />

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>Monthly EMI (₹) *</Text>
                <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'white' }} placeholder="18500" value={emi} onChangeText={setEmi} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>EMIs Left</Text>
                <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'white' }} placeholder="12" value={emisLeft} onChangeText={setEmisLeft} keyboardType="number-pad" />
              </View>
            </View>

            <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>Next Due Date (YYYY-MM-DD)</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'white', marginBottom: 12 }} placeholder="2025-02-01" value={nextDue} onChangeText={setNextDue} keyboardType="numbers-and-punctuation" />

            {accounts.length > 0 && (
              <>
                <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 8 }}>Repayment Account (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => setRepAccId('')}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: !repAccId ? ACCENT : '#2A2A2A', backgroundColor: !repAccId ? '#10B98122' : '#242424' }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: !repAccId ? ACCENT : '#6B7280' }}>None</Text>
                    </TouchableOpacity>
                    {accounts.map((a) => (
                      <TouchableOpacity key={a.id} onPress={() => setRepAccId(a.id)}
                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: repAccId === a.id ? ACCENT : '#2A2A2A', backgroundColor: repAccId === a.id ? '#10B98122' : '#242424' }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: repAccId === a.id ? ACCENT : '#6B7280' }}>{a.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A' }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={!canSave}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: canSave ? 1 : 0.5 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>{isEdit ? 'Update' : 'Save Loan'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Record Payment Modal ───────────────────────────────────────────────────────

function RecordPaymentModal({ visible, liability, accounts, onClose, onPay }: {
  visible: boolean;
  liability: Liability | null;
  accounts: Account[];
  onClose: () => void;
  onPay: (id: string, amount: number, repayAccountId?: string) => void;
}) {
  const [amount,   setAmount]   = useState('');
  const [repAccId, setRepAccId] = useState('');

  const max       = liability?.outstanding ?? 0;
  const suggested = liability?.monthlyEmi ?? 0;
  const numAmt    = Number(amount);
  const canSave   = numAmt > 0 && numAmt <= max;

  // Reset when modal opens or target liability changes
  useEffect(() => {
    if (!visible) return;
    setAmount('');
    setRepAccId(liability?.repaymentAccountId ?? '');
  }, [visible, liability?.id]);

  const handlePay = () => {
    if (!liability || !canSave) return;
    onPay(liability.id, numAmt, repAccId || undefined);
    setAmount(''); onClose();
  };

  if (!liability) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#3A3A3A', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>Record Payment</Text>
          <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 20 }}>{liability.name}{liability.lender ? ` · ${liability.lender}` : ''}</Text>

          <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>Payment Amount (₹)</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'white', marginBottom: 10 }} placeholder="0" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" autoFocus />

          {/* Quick-fill buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <TouchableOpacity onPress={() => setAmount(String(suggested))}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#2A2A2A', borderWidth: 1, borderColor: '#3A3A3A' }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#E5E7EB' }}>EMI {formatINR(suggested)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAmount(String(max))}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#2A2A2A', borderWidth: 1, borderColor: '#3A3A3A' }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#E5E7EB' }}>Full {formatINR(max)}</Text>
            </TouchableOpacity>
          </View>

          {/* Debit account */}
          {accounts.length > 0 && (
            <>
              <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 8 }}>Debit from Account</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => setRepAccId('')}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: !repAccId ? ACCENT : '#2A2A2A', backgroundColor: !repAccId ? '#10B98122' : '#242424' }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: !repAccId ? ACCENT : '#6B7280' }}>None</Text>
                  </TouchableOpacity>
                  {accounts.map((a) => (
                    <TouchableOpacity key={a.id} onPress={() => setRepAccId(a.id)}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: repAccId === a.id ? ACCENT : '#2A2A2A', backgroundColor: repAccId === a.id ? '#10B98122' : '#242424' }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: repAccId === a.id ? ACCENT : '#6B7280' }}>{a.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {/* Preview */}
          <View style={{ backgroundColor: '#242424', borderRadius: 12, padding: 14, marginBottom: 20, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>Outstanding before</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>{formatINR(max)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>After payment</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: ACCENT }}>{formatINR(Math.max(0, max - numAmt))}</Text>
            </View>
            {liability.nextDueDate && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF' }}>Next due (after payment)</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#E5E7EB' }}>{fmtDate(advanceMonth(liability.nextDueDate))}</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A' }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePay} disabled={!canSave}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: canSave ? 1 : 0.5 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Record Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Overview helpers ───────────────────────────────────────────────────────────

function fmtCompact(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000)   return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000)     return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

function getHealthScore(txs: Transaction[], totalAssets: number, totalLiab: number) {
  const now = new Date();
  const thisMo = txs.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const inc  = thisMo.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp  = thisMo.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const rate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;

  const savingsScore  = Math.max(0, Math.min(25, Math.round(rate * 0.8)));
  const debtScore     = totalAssets === 0 ? 0 : totalLiab < totalAssets * 0.3 ? 25 : totalLiab < totalAssets * 0.5 ? 18 : 10;
  const conScore      = txs.length > 5 ? 25 : Math.round(txs.length * 5);
  const divScore      = totalAssets > 0 ? 25 : 0;
  const total = savingsScore + debtScore + conScore + divScore;

  const summary = total >= 75
    ? `You're saving ${Math.round(rate)}% of income. Debt levels are manageable.`
    : total >= 50
    ? `Savings rate is ${Math.round(rate)}%. Consider reducing your debt utilization.`
    : `Low savings rate detected. Focus on cutting expenses and building an emergency fund.`;

  return {
    score: total, summary,
    factors: [
      { label: 'Savings Rate',    score: savingsScore, max: 25 },
      { label: 'Debt Level',      score: debtScore,    max: 25 },
      { label: 'Consistency',     score: conScore,     max: 25 },
      { label: 'Diversification', score: divScore,     max: 25 },
    ],
  };
}

type InsightItem = { text: string; type: 'positive' | 'warning' | 'neutral' };

function getInsights(txs: Transaction[], totalAssets: number, totalLiab: number): InsightItem[] {
  const now = new Date();
  const thisMo = txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const lastMo = txs.filter(t => {
    const d = new Date(t.date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });
  const items: InsightItem[] = [];

  // Category spending changes
  const catThis: Record<string, number> = {};
  const catLast: Record<string, number> = {};
  thisMo.filter(t => t.type === 'expense').forEach(t => { catThis[t.category] = (catThis[t.category] ?? 0) + Math.abs(t.amount); });
  lastMo.filter(t => t.type === 'expense').forEach(t => { catLast[t.category] = (catLast[t.category] ?? 0) + Math.abs(t.amount); });
  Object.entries(catThis).forEach(([cat, amt]) => {
    const prev = catLast[cat] ?? 0;
    if (prev > 0) {
      const change = Math.round(((amt - prev) / prev) * 100);
      if (change > 20) items.push({ text: `You spent ${change}% more on ${cat} this month.`, type: 'warning' });
      if (change < -15) items.push({ text: `${cat} spending dropped by ${Math.abs(change)}% — great discipline!`, type: 'positive' });
    }
  });

  // Savings rate
  const inc = thisMo.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp = thisMo.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const rate = inc > 0 ? Math.max(0, Math.round(((inc - exp) / inc) * 100)) : 0;
  if (rate > 30)      items.push({ text: `You are saving ${rate}% of your income this month. Excellent!`, type: 'positive' });
  else if (rate > 10) items.push({ text: `Your savings rate is ${rate}% this month. Try to push above 30%.`, type: 'neutral' });
  else if (inc > 0)   items.push({ text: `Your savings rate is only ${rate}%. Consider cutting discretionary spending.`, type: 'warning' });

  // Debt ratio
  if (totalAssets > 0 || totalLiab > 0) {
    const dr = totalAssets > 0 ? Math.round((totalLiab / totalAssets) * 100) : 0;
    if (dr < 30)       items.push({ text: `Debt-to-asset ratio is ${dr}% — a healthy financial position.`, type: 'positive' });
    else if (dr < 60)  items.push({ text: `Your debt is ${dr}% of your assets. Focus on paying down liabilities.`, type: 'neutral' });
    else               items.push({ text: `Your debt is ${dr}% of your assets. Prioritise reducing debt urgently.`, type: 'warning' });
  }

  return items.slice(0, 3);
}

const ALLOC_COLORS = ['#10B981', '#3B82F6', '#F97316', '#EAB308', '#8B5CF6', '#06B6D4'];
const SPEND_COLORS = ['#10B981', '#3B82F6', '#F97316', '#EAB308', '#8B5CF6'];

// ── Finance Settings Component ─────────────────────────────────────────────────

const BUILT_IN_EXPENSE_CATS = [
  { name: 'Rent', icon: '🏠' }, { name: 'Groceries', icon: '🛒' },
  { name: 'Restaurants', icon: '🍽️' }, { name: 'Fuel', icon: '⛽' },
  { name: 'Transport', icon: '🚌' }, { name: 'Utilities', icon: '🔌' },
  { name: 'Internet', icon: '🌐' }, { name: 'Mobile', icon: '📱' },
  { name: 'Shopping', icon: '🛍️' }, { name: 'Subscriptions', icon: '🔄' },
  { name: 'Medical', icon: '💊' }, { name: 'Insurance', icon: '🛡️' },
  { name: 'Travel', icon: '✈️' }, { name: 'Education', icon: '📚' },
  { name: 'Gifts', icon: '🎁' }, { name: 'Miscellaneous', icon: '📦' },
  { name: 'Food', icon: '☕' }, { name: 'Bills', icon: '🧾' },
  { name: 'Healthcare', icon: '❤️' }, { name: 'Entertainment', icon: '🎬' },
  { name: 'Loan', icon: '🏦' }, { name: 'Investment', icon: '📈' },
  { name: 'Others', icon: '📌' }, { name: 'Housing', icon: '🏡' },
  { name: 'Family', icon: '👨‍👩‍👧' },
];

const BUILT_IN_INCOME_CATS = [
  { name: 'Salary', icon: '💵' }, { name: 'Bonus', icon: '🏆' },
  { name: 'Freelance', icon: '💻' }, { name: 'Business', icon: '🏪' },
  { name: 'Dividends', icon: '📈' }, { name: 'Interest', icon: '💹' },
  { name: 'Rental Income', icon: '🏠' }, { name: 'Cashback', icon: '🔄' },
  { name: 'Refund', icon: '↩️' }, { name: 'Gifts', icon: '🎁' },
  { name: 'Other Income', icon: '💰' }, { name: 'Friends', icon: '⭐' },
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
];

const NUMBER_FORMATS = [
  { id: 'indian', example: '₹1,00,000', label: 'Indian' },
  { id: 'intl',   example: '₹100,000',  label: 'International' },
  { id: 'euro',   example: '₹100.000',  label: 'European' },
];

const DEFAULT_VIEWS = ['Overview', 'Transactions', 'Accounts', 'Assets'];

const EXPENSE_EXCLUDE_CATS = [
  'Food & Dining', 'Transport', 'Shopping', 'Bills & Utilities', 'Healthcare',
  'Entertainment', 'Education', 'Travel', 'Other', 'Subscriptions', 'Groceries',
  'Investment', 'Restaurants', 'Helper Salary', 'Internet', 'Loan', 'Office',
  'Medical', 'Maintenance', 'Rent', 'Family',
];

function FinanceSettings({ transactions, assets, liabilities, accounts }: {
  transactions: any[]; assets: any[]; liabilities: any[]; accounts: any[];
}) {
  const [settingsTab, setSettingsTab] = useState<'preferences' | 'categories' | 'data'>('preferences');
  const [currency, setCurrency]       = useState('INR');
  const [numFormat, setNumFormat]     = useState('indian');
  const [defaultView, setDefaultView] = useState('Overview');
  const [excluded, setExcluded]       = useState<string[]>([]);
  const [catType, setCatType]         = useState<'expense' | 'income'>('expense');
  const [newCatName, setNewCatName]   = useState('');
  const [newCatIcon, setNewCatIcon]   = useState('📌');
  const [customExpCats, setCustomExpCats] = useState<{ name: string; icon: string }[]>([]);
  const [customIncCats, setCustomIncCats] = useState<{ name: string; icon: string }[]>([]);

  const toggleExclude = (cat: string) => {
    setExcluded(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const addCustomCat = () => {
    const name = newCatName.trim();
    if (!name) return;
    const entry = { name, icon: newCatIcon };
    if (catType === 'expense') setCustomExpCats(prev => [...prev, entry]);
    else setCustomIncCats(prev => [...prev, entry]);
    setNewCatName('');
    setNewCatIcon('📌');
  };

  const expCats  = [...BUILT_IN_EXPENSE_CATS, ...customExpCats];
  const incCats  = [...BUILT_IN_INCOME_CATS,  ...customIncCats];
  const showCats = catType === 'expense' ? expCats : incCats;

  const QUICK_ICONS = ['📌','🏠','🛒','🍔','🚌','⚡','💊','🎁','💰','📈','🎬','✈️','📱','🌐','💳','🛍️','❤️','📚','🏪','💵','🎀','🔄','⛽'];

  return (
    <View style={{ flex: 1 }}>
      {/* Settings sub-tabs */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 4, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 4 }}>
        {(['preferences', 'categories', 'data'] as const).map((t) => (
          <TouchableOpacity key={t} onPress={() => setSettingsTab(t)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9, backgroundColor: settingsTab === t ? ACCENT : 'transparent' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: settingsTab === t ? 'white' : '#6B7280', textTransform: 'capitalize' }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* ── PREFERENCES ── */}
        {settingsTab === 'preferences' && (
          <>
            {/* Currency */}
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>Currency</Text>
              <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Choose your default display currency</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {CURRENCIES.map((c) => (
                  <TouchableOpacity key={c.code} onPress={() => setCurrency(c.code)}
                    style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: currency === c.code ? ACCENT : '#2A2A2A', backgroundColor: currency === c.code ? '#10B98118' : '#242424', alignItems: 'center', minWidth: 80 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: currency === c.code ? ACCENT : '#9CA3AF' }}>{c.symbol}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: currency === c.code ? ACCENT : '#6B7280', marginTop: 2 }}>{c.code}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Number Format */}
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>Number Format</Text>
              <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>How amounts are displayed</Text>
              {NUMBER_FORMATS.map((f) => (
                <TouchableOpacity key={f.id} onPress={() => setNumFormat(f.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A', gap: 12 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: numFormat === f.id ? ACCENT : '#4B5563', alignItems: 'center', justifyContent: 'center' }}>
                    {numFormat === f.id && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT }} />}
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, color: '#E5E7EB' }}>{f.example}</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Default View */}
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>Default View</Text>
              <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Which page opens when you visit Finance</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DEFAULT_VIEWS.map((v) => (
                  <TouchableOpacity key={v} onPress={() => setDefaultView(v)}
                    style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: defaultView === v ? ACCENT : '#2A2A2A', backgroundColor: defaultView === v ? '#10B98122' : '#242424' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: defaultView === v ? ACCENT : '#6B7280' }}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Expense Tracking Exclusions */}
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>Expense Tracking</Text>
              <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Check a category to exempt it from expense totals and vitals (e.g. Investment, SIP)</Text>
              <View style={{ gap: 2 }}>
                {EXPENSE_EXCLUDE_CATS.map((cat) => (
                  <TouchableOpacity key={cat} onPress={() => toggleExclude(cat)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222', gap: 12 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: excluded.includes(cat) ? ACCENT : '#4B5563', backgroundColor: excluded.includes(cat) ? ACCENT : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {excluded.includes(cat) && <Text style={{ fontSize: 12, color: 'white', fontWeight: '700' }}>✓</Text>}
                    </View>
                    {(() => { const cfg = getCatIcon(cat); const CIcon = cfg.Icon; return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center' }}><CIcon size={14} color={cfg.color} /></View><Text style={{ fontSize: 14, color: '#E5E7EB' }}>{cat}</Text></View>; })()}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ── CATEGORIES ── */}
        {settingsTab === 'categories' && (
          <>
            {/* Expense / Income toggle */}
            <View style={{ flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 4, marginBottom: 16 }}>
              {(['expense', 'income'] as const).map((t) => (
                <TouchableOpacity key={t} onPress={() => setCatType(t)}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9, backgroundColor: catType === t ? (t === 'expense' ? '#EF4444' : ACCENT) : 'transparent' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: catType === t ? 'white' : '#6B7280', textTransform: 'capitalize' }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Add New Category */}
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>ADD NEW CATEGORY</Text>
              {/* Icon picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {QUICK_ICONS.map((ic) => (
                    <TouchableOpacity key={ic} onPress={() => setNewCatIcon(ic)}
                      style={{ width: 40, height: 40, borderRadius: 10, borderWidth: 2, borderColor: newCatIcon === ic ? ACCENT : '#2A2A2A', backgroundColor: newCatIcon === ic ? '#10B98118' : '#242424', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 20 }}>{ic}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#242424', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A' }}>
                  <Text style={{ fontSize: 24 }}>{newCatIcon}</Text>
                </View>
                <TextInput
                  style={{ flex: 1, borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: 'white' }}
                  placeholder="Category name..."
                  placeholderTextColor="#4B5563"
                  value={newCatName}
                  onChangeText={setNewCatName}
                />
                <TouchableOpacity onPress={addCustomCat}
                  style={{ paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, backgroundColor: ACCENT, opacity: newCatName.trim() ? 1 : 0.5 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>+ Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category list */}
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{catType.toUpperCase()} CATEGORIES</Text>
                <Text style={{ fontSize: 13, color: '#6B7280' }}>{showCats.length} total</Text>
              </View>
              {showCats.map((cat, i) => (
                <View key={cat.name} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: i < showCats.length - 1 ? 1 : 0, borderBottomColor: '#1E1E1E', gap: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#242424', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, color: '#E5E7EB', fontWeight: '500' }}>{cat.name}</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#2A2A2A' }}>
                    <Text style={{ fontSize: 11, color: '#6B7280' }}>{i < (catType === 'expense' ? BUILT_IN_EXPENSE_CATS.length : BUILT_IN_INCOME_CATS.length) ? 'built-in' : 'custom'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── DATA ── */}
        {settingsTab === 'data' && (
          <>
            {/* Import */}
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 18, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>Import Data</Text>
              <Text style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 22, marginBottom: 16 }}>
                Import assets and transactions from Excel or CSV files. Supports Zerodha/Groww stock holdings, mutual fund statements, HDFC/SBI/ICICI credit card statements, and custom spreadsheets.
              </Text>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: ACCENT }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: ACCENT }}>⬆ Import from Excel / CSV</Text>
              </TouchableOpacity>
            </View>

            {/* Export */}
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 18, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>Export Data</Text>
              <Text style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 22, marginBottom: 16 }}>
                Export all your data (assets, liabilities, snapshots, goals) at any time.{' '}
                <Text style={{ color: 'white', fontWeight: '600' }}>Your data is yours and always will be.</Text>
              </Text>
              <TouchableOpacity style={{ paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB' }}>⬇ Export CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingVertical: 13, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>⬇ Export JSON</Text>
              </TouchableOpacity>
              <View style={{ marginTop: 12, gap: 6 }}>
                <Text style={{ fontSize: 13, color: '#6B7280' }}>📄 CSV — Transactions only, compatible with Excel/Sheets</Text>
                <Text style={{ fontSize: 13, color: '#6B7280' }}>📋 JSON — All data: accounts, assets, liabilities, budgets</Text>
              </View>
            </View>

            {/* Data Summary */}
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>Your Data</Text>
              {[
                { label: 'Transactions', count: transactions.length },
                { label: 'Assets',       count: assets.length },
                { label: 'Liabilities',  count: liabilities.length },
                { label: 'Accounts',     count: accounts.length },
              ].map((d, i) => (
                <View key={d.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: '#2A2A2A' }}>
                  <Text style={{ fontSize: 15, color: '#9CA3AF' }}>{d.label}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>{d.count} records</Text>
                </View>
              ))}
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function FinanceScreen() {
  const now = new Date();
  const [year,      setYear]      = useState(now.getFullYear());
  const [month,     setMonth]     = useState(now.getMonth());
  const [activeTab, setActiveTab] = useState<SubTab>('overview');
  const [showMore,  setShowMore]  = useState(false);

  // Modal state
  const [showAddTx,      setShowAddTx]      = useState(false);
  const [showAddAsset,   setShowAddAsset]   = useState(false);
  const [editAsset,      setEditAsset]      = useState<Asset | null>(null);
  const [showAddLiab,    setShowAddLiab]    = useState(false);
  const [editLiability,  setEditLiability]  = useState<Liability | null>(null);
  const [payLiability,   setPayLiability]   = useState<Liability | null>(null);

  // Assets category filter + search
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('All');
  const [assetSearch, setAssetSearch] = useState('');

  const qc = useQueryClient();

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: accounts     = [], refetch: refetchAccounts } = useQuery({ queryKey: ['accounts'],     queryFn: getAccounts });
  const { data: transactions = [], isLoading: txLoading, refetch: refetchTx } = useQuery({ queryKey: ['transactions'], queryFn: getTransactions });
  const { data: assets       = [], isLoading: assetsLoading, refetch: refetchAssets } = useQuery({ queryKey: ['assets'],       queryFn: getAssets });
  const { data: liabilities  = [], isLoading: liabLoading,   refetch: refetchLiab } = useQuery({ queryKey: ['liabilities'],  queryFn: getLiabilities });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['accounts'] });
    qc.invalidateQueries({ queryKey: ['transactions'] });
    qc.invalidateQueries({ queryKey: ['assets'] });
    qc.invalidateQueries({ queryKey: ['liabilities'] });
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createTxMut     = useMutation({ mutationFn: createTransaction,  onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); } });
  const deleteTxMut     = useMutation({ mutationFn: deleteTransaction,  onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); } });
  const createAssetMut  = useMutation({ mutationFn: createAsset,        onSuccess: () => invalidateAll() });
  const updateAssetMut  = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<CreateAssetInput> }) => updateAsset(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }) });
  const deleteAssetMut  = useMutation({ mutationFn: deleteAsset,        onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }) });
  const createLiabMut   = useMutation({ mutationFn: createLiability,    onSuccess: () => qc.invalidateQueries({ queryKey: ['liabilities'] }) });
  const updateLiabMut   = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<CreateLiabilityInput> }) => updateLiability(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['liabilities'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); qc.invalidateQueries({ queryKey: ['transactions'] }); } });
  const deleteLiabMut   = useMutation({ mutationFn: deleteLiability,    onSuccess: () => qc.invalidateQueries({ queryKey: ['liabilities'] }) });

  // ── Computed values ────────────────────────────────────────────────────────

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthTx  = useMemo(() => transactions.filter(t => t.date.startsWith(monthStr)), [transactions, monthStr]);
  const income   = useMemo(() => monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const expense  = useMemo(() => monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0), [monthTx]);
  const net      = income - expense;

  const totalAssetsValue = useMemo(() => assets.reduce((s, a) => s + a.value, 0), [assets]);
  const totalInvested    = useMemo(() => assets.reduce((s, a) => s + a.invested, 0), [assets]);
  const totalLiabilities = useMemo(() => liabilities.reduce((s, l) => s + l.outstanding, 0), [liabilities]);
  const availableBalance = useMemo(() => accounts.filter(a => a.type !== 'Credit Card').reduce((s, a) => s + a.balance, 0), [accounts]);
  const netWorth         = totalAssetsValue + availableBalance - totalLiabilities;

  const liabSummary = useMemo(() => ({
    borrowed:    liabilities.reduce((s, l) => s + l.borrowed, 0),
    outstanding: liabilities.reduce((s, l) => s + l.outstanding, 0),
    repaid:      liabilities.reduce((s, l) => s + (l.totalRepaid ?? 0), 0),
  }), [liabilities]);

  const repaidPct = liabSummary.borrowed > 0
    ? Math.round((liabSummary.repaid / liabSummary.borrowed) * 100)
    : 0;

  // Asset category tabs (dynamic — only show categories that have assets)
  const assetCategoryTabs = useMemo(() => {
    const present = new Set(assets.map(a => a.category));
    return ['All', ...ASSET_CATEGORY_LIST.filter(c => present.has(c))];
  }, [assets]);

  const filteredAssets = useMemo(() => {
    let list = assets;
    if (assetCategoryFilter !== 'All') list = list.filter(a => a.category === assetCategoryFilter);
    if (assetSearch.trim()) {
      const q = assetSearch.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
    }
    return list;
  }, [assets, assetCategoryFilter, assetSearch]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleRecordPayment = (id: string, amount: number, repayAccountId?: string) => {
    const l = liabilities.find(x => x.id === id);
    if (!l) return;
    const nextDue = l.nextDueDate ? advanceMonth(l.nextDueDate) : undefined;
    updateLiabMut.mutate({
      id,
      data: {
        outstanding:  Math.max(0, l.outstanding - amount),
        totalRepaid:  (l.totalRepaid ?? 0) + amount,
        emisLeft:     Math.max(0, (l.emisLeft ?? 0) - 1),
        ...(nextDue ? { nextDueDate: nextDue } : {}),
        ...(repayAccountId ? { repaymentAccountId: repayAccountId } : {}),
      },
    });
    setPayLiability(null);
  };

  const handleDeleteAsset = (id: string) => {
    Alert.alert('Delete Asset', 'Are you sure you want to delete this asset?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAssetMut.mutate(id) },
    ]);
  };

  const handleDeleteLiability = (id: string) => {
    Alert.alert('Delete Liability', 'Are you sure you want to delete this loan?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteLiabMut.mutate(id) },
    ]);
  };

  // Which FAB action to show for current tab
  const fabVisible = ['transactions', 'assets', 'liabilities'].includes(activeTab);
  const onFabPress = () => {
    if (activeTab === 'transactions') setShowAddTx(true);
    else if (activeTab === 'assets')  setShowAddAsset(true);
    else if (activeTab === 'liabilities') setShowAddLiab(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  // Map active sub-tab to a human-readable title shown in the header
  const PAGE_TITLES: Record<SubTab, string> = {
    overview: 'Overview', accounts: 'Accounts', transactions: 'Transactions', assets: 'Assets',
    liabilities: 'Liabilities', budget: 'Budget', vitals: 'Vitals', settings: 'Settings',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: SCREEN_BG }}>
      {/* Header — shows the current sub-tab name; tapping MyOrbit goes home */}
      <AppHeader title={PAGE_TITLES[activeTab]} showBack={false} />

      {/* Content */}
      <View style={{ flex: 1, backgroundColor: SCREEN_BG }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 92 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetchAccounts(); refetchTx(); refetchAssets(); refetchLiab(); }} tintColor={ACCENT} />}
        >

          {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (() => {
            const _ov_now = new Date();
            const thisMoTx        = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === _ov_now.getMonth() && d.getFullYear() === _ov_now.getFullYear(); });
            const thisMonthIncome  = thisMoTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const thisMonthExpense = thisMoTx.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
            const thisSavings      = Math.max(0, thisMonthIncome - thisMonthExpense);
            const thisSavingsRate  = thisMonthIncome > 0 ? Math.round((thisSavings / thisMonthIncome) * 100) : 0;

            const healthData = getHealthScore(transactions, totalAssetsValue, totalLiabilities);
            const insights   = getInsights(transactions, totalAssetsValue, totalLiabilities);

            const catSpend: Record<string, number> = {};
            transactions.filter(t => t.type === 'expense').forEach(t => { catSpend[t.category] = (catSpend[t.category] ?? 0) + Math.abs(t.amount); });
            const SPENDING_EXCLUDE = ['Investment', 'EPF / PPF / NPS', 'SSY', 'Bonds', 'Debt Funds', 'Mutual Funds', 'Stocks & Equity'];
            const topCategories = Object.entries(catSpend).filter(([cat]) => !SPENDING_EXCLUDE.includes(cat)).sort((a, b) => b[1] - a[1]).slice(0, 5);
            const maxCatSpend   = topCategories[0]?.[1] ?? 1;

            const moSpend: Record<string, number> = {};
            thisMoTx.filter(t => t.type === 'expense').forEach(t => { moSpend[t.category] = (moSpend[t.category] ?? 0) + Math.abs(t.amount); });
            const topMonthExp = Object.entries(moSpend).sort((a, b) => b[1] - a[1]).slice(0, 5);
            const maxMoSpend  = topMonthExp[0]?.[1] ?? 1;

            const assetByCat: Record<string, number> = {};
            assets.forEach(a => { assetByCat[a.category] = (assetByCat[a.category] ?? 0) + a.value; });
            const allocSlices = Object.entries(assetByCat).sort((a, b) => b[1] - a[1]).slice(0, 6);
            const maxAllocVal = allocSlices[0]?.[1] ?? 1;

            const upcoming = [...liabilities]
              .filter(l => l.nextDueDate)
              .sort((a, b) => new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime())
              .slice(0, 5);

            const hColor = healthData.score >= 75 ? '#10B981' : healthData.score >= 50 ? '#F59E0B' : '#EF4444';

            return (
              <>
                {/* ── Net Worth ── */}
                <View style={{ marginHorizontal: 16, marginTop: 2, marginBottom: 10, backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <Text style={{ fontSize: 16, color: MUTED }}>Net Worth</Text>
                    {totalAssetsValue > 0 && netWorth > 0 && (
                      <View style={{ backgroundColor: '#10B98122', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 9, fontWeight: '600', color: '#10B981' }}>
                          {Math.round((totalAssetsValue / netWorth) * 100)}% in assets
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 29, fontWeight: '800', color: netWorth >= 0 ? '#10B981' : '#EF4444' }}>
                    {netWorth < 0 ? '−' : ''}{formatINR(Math.abs(netWorth))}
                  </Text>
                  {(totalAssetsValue + totalLiabilities) > 0 && (() => {
                    const assetW = Math.round((totalAssetsValue / (totalAssetsValue + totalLiabilities)) * 100);
                    const liabW  = 100 - assetW;
                    return (
                      <View style={{ marginTop: 12 }}>
                        <View style={{ height: 5, borderRadius: 3, flexDirection: 'row', overflow: 'hidden', backgroundColor: BORDER }}>
                          <View style={{ width: `${assetW}%` as `${number}%`, backgroundColor: '#10B981' }} />
                          <View style={{ width: `${liabW}%` as `${number}%`, backgroundColor: '#EF4444' }} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                          <Text style={{ fontSize: 14, color: '#10B981' }}>Assets {fmtCompact(totalAssetsValue)}</Text>
                          <Text style={{ fontSize: 14, color: '#EF4444' }}>Liabilities {fmtCompact(totalLiabilities)}</Text>
                        </View>
                      </View>
                    );
                  })()}
                </View>

                {/* ── 3 Metric Cards: Assets, Liabilities, Accounts (matching web) ── */}
                <View style={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Assets',          sub: `${assets.length} assets tracked`,     val: totalAssetsValue,  color: '#10B981', bg: '#10B98122', Icon: Wallet,     tab: 'assets'      as SubTab },
                    { label: 'Liabilities',     sub: `${liabilities.length} active loans`,   val: totalLiabilities, color: '#EF4444', bg: '#EF444422', Icon: CreditCard, tab: 'liabilities' as SubTab },
                    { label: 'Account Balance', sub: 'Bank, wallets & cash',                  val: availableBalance, color: '#10B981', bg: '#10B98122', Icon: Landmark,   tab: 'accounts'    as SubTab },
                  ].map((m) => (
                    <TouchableOpacity key={m.label} onPress={() => setActiveTab(m.tab)}
                      style={{ backgroundColor: SURFACE, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: m.bg }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: m.bg, alignItems: 'center', justifyContent: 'center' }}>
                        <m.Icon size={17} color={m.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, color: MUTED }}>{m.label}</Text>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: m.color }} numberOfLines={1}>{fmtCompact(m.val)}</Text>
                        <Text style={{ fontSize: 16, color: SUBTLE, marginTop: 1 }}>{m.sub}</Text>
                      </View>
                      <ChevronRight size={16} color="#4B5563" />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ── Financial Health Score ── */}
                <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: '#1A1A1A', borderRadius: 20, padding: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <ShieldCheck size={16} color={hColor} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Financial Health Score</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 8, borderColor: hColor, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111111' }}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: hColor }}>{healthData.score}</Text>
                      <Text style={{ fontSize: 9, color: '#9CA3AF' }}>/ 100</Text>
                    </View>
                    <View style={{ flex: 1, gap: 7 }}>
                      {healthData.factors.map((f, i) => {
                        const pct = Math.round((f.score / f.max) * 100);
                        const fc  = pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444';
                        return (
                          <View key={i}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>{f.label}</Text>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: fc }}>{f.score}/{f.max}</Text>
                            </View>
                            <View style={{ height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, overflow: 'hidden' }}>
                              <View style={{ height: 4, width: `${pct}%` as `${number}%`, backgroundColor: fc, borderRadius: 2 }} />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 12, lineHeight: 18 }}>{healthData.summary}</Text>
                </View>

                {/* ── Smart Insights ── */}
                {insights.length > 0 && (
                  <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: '#1A1A1A', borderRadius: 20, padding: 18 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Lightbulb size={16} color="#F59E0B" />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Smart Insights</Text>
                    </View>
                    {insights.map((ins, i) => {
                      const ic = ins.type === 'positive' ? '#10B981' : ins.type === 'warning' ? '#F59E0B' : '#9CA3AF';
                      const bg = ins.type === 'positive' ? '#10B98115' : ins.type === 'warning' ? '#F59E0B15' : '#2A2A2A';
                      return (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: bg, borderRadius: 10, padding: 10, marginBottom: i < insights.length - 1 ? 8 : 0 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ic, marginTop: 5 }} />
                          <Text style={{ flex: 1, fontSize: 14, color: '#E5E7EB', lineHeight: 18 }}>{ins.text}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ── Savings Rate ── */}
                <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: '#1A1A1A', borderRadius: 20, padding: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <DollarSign size={16} color="#3B82F6" />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Savings Rate</Text>
                    </View>
                    <View style={{ backgroundColor: thisSavingsRate >= 20 ? '#10B98122' : '#F59E0B22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: thisSavingsRate >= 20 ? '#10B981' : '#F59E0B' }}>{thisSavingsRate}%</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {[
                      { label: 'Income',  val: thisMonthIncome,  color: '#10B981', bg: '#10B98115' },
                      { label: 'Expense', val: thisMonthExpense, color: '#EF4444', bg: '#EF444415' },
                      { label: 'Savings', val: thisSavings,      color: '#3B82F6', bg: '#3B82F615' },
                    ].map((s) => (
                      <View key={s.label} style={{ flex: 1, backgroundColor: s.bg, borderRadius: 12, padding: 10, alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 2 }}>{s.label}</Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: s.color }} numberOfLines={1}>{fmtCompact(s.val)}</Text>
                      </View>
                    ))}
                  </View>
                  {thisMonthIncome > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <View style={{ height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, overflow: 'hidden' }}>
                        <View style={{ height: 6, width: `${Math.min(thisSavingsRate, 100)}%` as `${number}%`, backgroundColor: thisSavingsRate >= 20 ? '#10B981' : '#F59E0B', borderRadius: 3 }} />
                      </View>
                      <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>
                        {thisSavingsRate >= 30 ? '🎉 Excellent savings rate!' : thisSavingsRate >= 20 ? '👍 Good savings rate' : '💡 Aim for 20%+ savings'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* ── Spending by Category (all time) ── */}
                {topCategories.length > 0 && (
                  <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: '#1A1A1A', borderRadius: 20, padding: 18 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <PieChart size={16} color="#8B5CF6" />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Spending by Category</Text>
                    </View>
                    {topCategories.map(([cat, amt], i) => {
                      const pct = Math.round((amt / maxCatSpend) * 100);
                      const c   = SPEND_COLORS[i % SPEND_COLORS.length];
                      return (
                        <View key={cat} style={{ marginBottom: i < topCategories.length - 1 ? 12 : 0 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              {(() => { const cfg = getCatIcon(cat); const CIcon = cfg.Icon; return <View style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center' }}><CIcon size={13} color={cfg.color} /></View>; })()}
                              <Text style={{ fontSize: 14, color: '#E5E7EB' }}>{cat}</Text>
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: c }}>{fmtCompact(amt)}</Text>
                          </View>
                          <View style={{ height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ height: 4, width: `${pct}%` as `${number}%`, backgroundColor: c, borderRadius: 2 }} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ── Recent Transactions ── */}
                <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Recent Transactions</Text>
                    {transactions.length > 5 && (
                      <TouchableOpacity onPress={() => setActiveTab('transactions')}>
                        <Text style={{ fontSize: 14, color: ACCENT }}>View all →</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, overflow: 'hidden' }}>
                    {transactions.length === 0 ? (
                      <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                        <Text style={{ fontSize: 28, marginBottom: 8 }}>💸</Text>
                        <Text style={{ fontSize: 14, color: '#9CA3AF' }}>No transactions yet</Text>
                      </View>
                    ) : (
                      transactions.slice(0, 5).map((tx) => <TxItem key={tx.id} tx={tx} onDelete={deleteTxMut.mutate} />)
                    )}
                  </View>
                </View>

                {/* ── Top Expenses this month ── */}
                {topMonthExp.length > 0 && (
                  <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: '#1A1A1A', borderRadius: 20, padding: 18 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <TrendingDown size={16} color="#EF4444" />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Top Expenses This Month</Text>
                    </View>
                    {topMonthExp.map(([cat, amt], i) => {
                      const pct = Math.round((amt / maxMoSpend) * 100);
                      const c   = SPEND_COLORS[i % SPEND_COLORS.length];
                      return (
                        <View key={cat} style={{ marginBottom: i < topMonthExp.length - 1 ? 12 : 0 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
                              <Text style={{ fontSize: 14, color: '#E5E7EB' }}>{cat}</Text>
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: c }}>{fmtCompact(amt)}</Text>
                          </View>
                          <View style={{ height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ height: 4, width: `${pct}%` as `${number}%`, backgroundColor: c, borderRadius: 2 }} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ── Asset Allocation (Donut ring + legend, matching web layout) ── */}
                {allocSlices.length > 0 && (
                  <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: '#1A1A1A', borderRadius: 20, padding: 18 }}>
                    <View style={{ marginBottom: 14 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Asset Allocation</Text>
                      <Text style={{ fontSize: 15, color: '#6B7280', marginTop: 2 }}>Where your wealth is stored</Text>
                    </View>
                    {/* Donut + legend row (same layout as web) */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                      {/* Donut ring: true proportional pie chart using react-native-svg */}
                      <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
                        <Svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute' }}>
                          {(() => {
                            const polarToCartesian = (cx: number, cy: number, r: number, a: number) => {
                              const rad = (a - 90) * Math.PI / 180.0;
                              return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
                            };
                            let startAngle = 0;
                            return allocSlices.map(([cat, val], i) => {
                              const share = totalAssetsValue > 0 ? val / totalAssetsValue : 0;
                              const angle = share * 360;
                              const endAngle = startAngle + angle;
                              const largeArcFlag = angle > 180 ? 1 : 0;
                              const start = polarToCartesian(60, 60, 50, startAngle);
                              const end   = polarToCartesian(60, 60, 50, endAngle);
                              const d = `M ${start.x} ${start.y} A 50 50 0 ${largeArcFlag} 1 ${end.x} ${end.y} L 60 60 Z`;
                              startAngle = endAngle;
                              return <Path key={cat} d={d} fill={ALLOC_COLORS[i % ALLOC_COLORS.length]} fillOpacity={0.9} />;
                            });
                          })()}
                        </Svg>
                        {/* Inner donut hole */}
                        <View style={{ position: 'absolute', left: 24, top: 24, width: 72, height: 72, borderRadius: 36, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF' }}>{allocSlices.length}</Text>
                          <Text style={{ fontSize: 14, color: '#6B7280', marginTop: -2 }}>classes</Text>
                        </View>
                      </View>
                      {/* Legend list */}
                      <View style={{ flex: 1, gap: 7 }}>
                        {allocSlices.map(([cat, val], i) => {
                          const c = ALLOC_COLORS[i % ALLOC_COLORS.length];
                          const sharePct = totalAssetsValue > 0 ? Math.round((val / totalAssetsValue) * 100) : 0;
                          return (
                            <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c, flexShrink: 0 }} />
                                <Text style={{ fontSize: 14, color: '#9CA3AF', flex: 1 }} numberOfLines={1}>{cat}</Text>
                              </View>
                              <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>{fmtCompact(val)}</Text>
                                <Text style={{ fontSize: 14, color: '#6B7280' }}>{sharePct}%</Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                    {/* Proportional segmented bar — shows actual proportions */}
                    <View style={{ height: 6, flexDirection: 'row', borderRadius: 3, overflow: 'hidden', backgroundColor: '#2A2A2A', marginTop: 16 }}>
                      {allocSlices.map(([, val], i) => (
                        <View key={i} style={{ flex: totalAssetsValue > 0 ? (val / totalAssetsValue) * 100 : 0, backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
                      ))}
                    </View>
                    <TouchableOpacity onPress={() => setActiveTab('assets')} style={{ marginTop: 12, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: ACCENT }}>View all assets →</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── Upcoming Bills ── */}
                {upcoming.length > 0 && (
                  <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: '#1A1A1A', borderRadius: 20, padding: 18 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <Calendar size={16} color="#F59E0B" />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Upcoming Bills</Text>
                    </View>
                    {upcoming.map((l, i) => {
                      const days    = daysUntil(l.nextDueDate);
                      const overdue = days !== null && days < 0;
                      const dueSoon = days !== null && days <= 7 && days >= 0;
                      const dc = overdue ? '#EF4444' : dueSoon ? '#F59E0B' : '#9CA3AF';
                      return (
                        <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < upcoming.length - 1 ? 1 : 0, borderBottomColor: '#2A2A2A' }}>
                          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: overdue ? '#EF444422' : '#F59E0B22', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <CreditCard size={16} color={overdue ? '#EF4444' : '#F59E0B'} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>{l.name}</Text>
                            <Text style={{ fontSize: 16, color: dc, marginTop: 1 }}>
                              {overdue ? `${Math.abs(days!)}d overdue` : days === 0 ? 'Due today' : `Due in ${days}d`} · {fmtDate(l.nextDueDate)}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>{fmtCompact(l.monthlyEmi)}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            );
          })()}

          {/* ── TRANSACTIONS ──────────────────────────────────────────────── */}
          {activeTab === 'transactions' && (
            <>
              {/* Month selector */}
              <MonthSelector year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />

              {/* Summary row */}
              <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Income',  val: income,           color: '#10B981', Icon: TrendingUp   },
                  { label: 'Expense', val: expense,          color: '#EF4444', Icon: TrendingDown },
                  { label: 'Net',     val: Math.abs(net),    color: net >= 0 ? '#10B981' : '#EF4444', Icon: ArrowLeftRight },
                ].map((s) => (
                  <View key={s.label} style={{ flex: 1, backgroundColor: '#1A1A1A', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 }}>
                    <s.Icon size={14} color={s.color} />
                    <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>{s.label}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: s.color }}>{formatINR(s.val)}</Text>
                  </View>
                ))}
              </View>

              {/* Transaction list */}
              <View style={{ marginHorizontal: 20, backgroundColor: '#1A1A1A', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#E5E7EB' }}>{monthLabel(year, month)}</Text>
                  <Text style={{ fontSize: 14, color: '#9CA3AF' }}>{monthTx.length} transactions</Text>
                </View>
                {txLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator color={ACCENT} /></View>
                ) : monthTx.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, marginBottom: 8 }}>💸</Text>
                    <Text style={{ fontSize: 14, color: '#9CA3AF' }}>No transactions this month</Text>
                    <TouchableOpacity onPress={() => setShowAddTx(true)}
                      style={{ marginTop: 12, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: ACCENT }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>+ Add Transaction</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  monthTx.map((tx) => <TxItem key={tx.id} tx={tx} onDelete={deleteTxMut.mutate} />)
                )}
              </View>
            </>
          )}

          {/* ── ASSETS ────────────────────────────────────────────────────── */}
          {activeTab === 'assets' && (() => {
            const pnl    = totalAssetsValue - totalInvested;
            const pnlPct = totalInvested > 0 ? ((pnl / totalInvested) * 100).toFixed(1) : '0';

            // Allocation breakdown (for bottom section)
            const assetByCat: Record<string, number> = {};
            assets.forEach(a => { assetByCat[a.category] = (assetByCat[a.category] ?? 0) + a.value; });
            const allocSlicesAll = Object.entries(assetByCat).sort((a, b) => b[1] - a[1]);

            return (
              <View style={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 6 }}>
                {/* Summary cards */}
                {assets.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: 'Invested',      val: formatINR(totalInvested),         color: '#3B82F6', bg: '#3B82F622' },
                      { label: 'Current Value', val: formatINR(totalAssetsValue),       color: '#10B981', bg: '#10B98122' },
                      { label: `P&L (${pnl >= 0 ? '+' : ''}${pnlPct}%)`, val: formatINR(Math.abs(pnl)), color: pnl >= 0 ? '#10B981' : '#EF4444', bg: pnl >= 0 ? '#10B98122' : '#EF444422' },
                    ].map((m) => (
                      <View key={m.label} style={{ flex: 1, backgroundColor: '#1A1A1A', borderRadius: 14, padding: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: m.bg }}>
                        <Text style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 4 }}>{m.label}</Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: m.color }} numberOfLines={1}>{m.val}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Search + Add row */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A', paddingHorizontal: 10 }}>
                    <Search size={14} color="#6B7280" />
                    <TextInput
                      value={assetSearch}
                      onChangeText={setAssetSearch}
                      placeholder="Search assets…"
                      placeholderTextColor="#4B5563"
                      style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: '#FFFFFF' }}
                    />
                  </View>
                  <TouchableOpacity onPress={() => setShowAddAsset(true)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ACCENT, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
                    <Plus size={14} color="white" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Add</Text>
                  </TouchableOpacity>
                </View>

                {/* Category tabs */}
                {assets.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {assetCategoryTabs.map((cat) => {
                        const isActive = assetCategoryFilter === cat;
                        const c = cat === 'All' ? ACCENT : catColor(cat);
                        return (
                          <TouchableOpacity key={cat} onPress={() => setAssetCategoryFilter(cat)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: isActive ? c : '#2A2A2A', backgroundColor: isActive ? c + '22' : '#1E1E1E' }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: isActive ? c : '#9CA3AF' }}>{cat}</Text>
                            {cat !== 'All' && (
                              <View style={{ backgroundColor: isActive ? c + '33' : '#2A2A2A', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
                                <Text style={{ fontSize: 9, fontWeight: '700', color: isActive ? c : '#6B7280' }}>
                                  {assets.filter(a => a.category === cat).length}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}

                {/* Asset list */}
                {assetsLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator color={ACCENT} /></View>
                ) : filteredAssets.length === 0 ? (
                  <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                    <TrendingUp size={36} color="#2A2A2A" />
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginTop: 12 }}>
                      {assetSearch.trim() ? 'No assets match your search' : 'No assets tracked yet'}
                    </Text>
                    {!assetSearch.trim() && (
                      <>
                        <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
                          Add your investments — stocks, funds, real estate and more
                        </Text>
                        <TouchableOpacity onPress={() => setShowAddAsset(true)}
                          style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: ACCENT }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>+ Add First Asset</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                ) : (
                  filteredAssets.map((a) => (
                    <AssetCard key={a.id} asset={a} onEdit={setEditAsset} onDelete={handleDeleteAsset} />
                  ))
                )}

                {/* Allocation breakdown — shown on All tab when 2+ categories (matches web) */}
                {assetCategoryFilter === 'All' && allocSlicesAll.length > 1 && (
                  <View style={{ marginTop: 8 }}>
                    {/* Donut + legend */}
                    <View style={{ backgroundColor: '#1A1A1A', borderRadius: 20, padding: 18, marginBottom: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>Allocation</Text>
                      <Text style={{ fontSize: 15, color: '#6B7280', marginBottom: 14 }}>Distribution across asset classes</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        {/* Donut ring: proportional SVG */}
                        <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
                          <Svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute' }}>
                            {(() => {
                              const polarToCartesian = (cx: number, cy: number, r: number, a: number) => {
                                const rad = (a - 90) * Math.PI / 180.0;
                                return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
                              };
                              let startAngle = 0;
                              return allocSlicesAll.slice(0, 6).map(([cat, val], i) => {
                                const share = totalAssetsValue > 0 ? val / totalAssetsValue : 0;
                                const angle = share * 360;
                                const endAngle = startAngle + angle;
                                const largeArcFlag = angle > 180 ? 1 : 0;
                                const start = polarToCartesian(60, 60, 50, startAngle);
                                const end   = polarToCartesian(60, 60, 50, endAngle);
                                const d = `M ${start.x} ${start.y} A 50 50 0 ${largeArcFlag} 1 ${end.x} ${end.y} L 60 60 Z`;
                                startAngle = endAngle;
                                return <Path key={cat} d={d} fill={ALLOC_COLORS[i % ALLOC_COLORS.length]} fillOpacity={0.9} />;
                              });
                            })()}
                          </Svg>
                          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF' }}>{allocSlicesAll.length}</Text>
                            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: -2 }}>classes</Text>
                          </View>
                        </View>
                        {/* Legend */}
                        <View style={{ flex: 1, gap: 8 }}>
                          {allocSlicesAll.slice(0, 6).map(([cat, val], i) => {
                            const c = ALLOC_COLORS[i % ALLOC_COLORS.length];
                            const pct = totalAssetsValue > 0 ? Math.round((val / totalAssetsValue) * 100) : 0;
                            return (
                              <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c, flexShrink: 0 }} />
                                  <Text style={{ fontSize: 14, color: '#9CA3AF', flex: 1 }} numberOfLines={1}>{cat}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>{fmtCompact(val)}</Text>
                                  <Text style={{ fontSize: 14, color: '#6B7280' }}>{pct}%</Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                      {/* Proportional bar */}
                      <View style={{ height: 6, flexDirection: 'row', borderRadius: 3, overflow: 'hidden', backgroundColor: '#2A2A2A', marginTop: 16 }}>
                        {allocSlicesAll.map(([, val], i) => (
                          <View key={i} style={{ flex: totalAssetsValue > 0 ? (val / totalAssetsValue) * 100 : 0, backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
                        ))}
                      </View>
                    </View>

                    {/* Breakdown card */}
                    <View style={{ backgroundColor: '#1A1A1A', borderRadius: 20, padding: 18 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 14 }}>Breakdown</Text>
                      <View style={{ gap: 12 }}>
                        {allocSlicesAll.map(([cat, val], i) => {
                          const pct = totalAssetsValue > 0 ? Math.round((val / totalAssetsValue) * 100) : 0;
                          const c = ALLOC_COLORS[i % ALLOC_COLORS.length];
                          return (
                            <View key={cat}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: c + '22', alignItems: 'center', justifyContent: 'center' }}>
                                    <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: c }} />
                                  </View>
                                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#E5E7EB' }}>{cat}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>{fmtCompact(val)}</Text>
                                  <Text style={{ fontSize: 14, color: '#6B7280', width: 32, textAlign: 'right' }}>{pct}%</Text>
                                </View>
                              </View>
                              <View style={{ height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, overflow: 'hidden' }}>
                                <View style={{ height: 6, width: `${pct}%` as `${number}%`, backgroundColor: c, borderRadius: 3 }} />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })()}

          {/* ── LIABILITIES ───────────────────────────────────────────────── */}
          {activeTab === 'liabilities' && (
            <View style={{ padding: 20 }}>
              {/* Summary cards */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Total Borrowed', val: formatINR(liabSummary.borrowed),    color: '#3B82F6', bg: '#3B82F622' },
                  { label: 'Total Repaid',   val: formatINR(liabSummary.repaid),      color: '#10B981', bg: '#10B98122' },
                  { label: 'Outstanding',    val: formatINR(liabSummary.outstanding), color: '#EF4444', bg: '#EF444422' },
                ].map((m) => (
                  <View key={m.label} style={{ flex: 1, backgroundColor: '#1A1A1A', borderRadius: 14, padding: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: m.bg }}>
                    <Text style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 4 }}>{m.label}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: m.color }} numberOfLines={1}>{m.val}</Text>
                  </View>
                ))}
              </View>

              {/* Repayment progress */}
              {liabilities.length > 0 && (
                <View style={{ backgroundColor: '#1A1A1A', borderRadius: 14, padding: 14, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 15, fontWeight: '500', color: '#E5E7EB' }}>Overall repayment progress</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: ACCENT }}>{repaidPct}% paid</Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: '#2A2A2A', borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ height: 8, width: `${repaidPct}%` as `${number}%`, backgroundColor: ACCENT, borderRadius: 4 }} />
                  </View>
                </View>
              )}

              {/* Liability list */}
              {liabLoading ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator color={ACCENT} /></View>
              ) : liabilities.length === 0 ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>🎉</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF' }}>No liabilities!</Text>
                  <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>Debt-free or add your first loan below</Text>
                  <TouchableOpacity onPress={() => setShowAddLiab(true)}
                    style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: ACCENT }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>+ Add Loan</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                liabilities.map((l) => (
                  <LiabilityCard key={l.id} liability={l}
                    onPay={setPayLiability}
                    onEdit={setEditLiability}
                    onDelete={handleDeleteLiability}
                  />
                ))
              )}
            </View>
          )}

          {/* ── ACCOUNTS ─────────────────────────────────────────────────── */}
          {activeTab === 'accounts' && (() => {
            const creditUsed = Math.abs(accounts.filter(a => a.type === 'Credit Card').reduce((s, a) => s + Math.min(0, a.balance), 0));
            const now2 = new Date();
            const today2 = now2.toISOString().slice(0, 10);
            const spentThisMonth = transactions.filter(t => {
              if (t.type !== 'expense') return false;
              if (t.date > today2) return false;
              const d = new Date(t.date);
              return d.getMonth() === now2.getMonth() && d.getFullYear() === now2.getFullYear();
            }).reduce((s, t) => s + Math.abs(t.amount), 0);

            const byType: Record<string, Account[]> = {
              'Bank': [], 'Credit Card': [], 'Debit Card': [], 'Wallet': [], 'Cash': [],
            };
            accounts.forEach(a => { if (byType[a.type]) byType[a.type].push(a); });

            const SECTIONS = [
              { key: 'Bank',         label: 'Bank Accounts', Icon: Landmark,   color: '#10B981' },
              { key: 'Credit Card',  label: 'Credit Cards',  Icon: CreditCard, color: '#EF4444' },
              { key: 'Debit Card',   label: 'Debit Cards',   Icon: CreditCard, color: '#3B82F6' },
              { key: 'Wallet',       label: 'Wallets',       Icon: Wallet,     color: '#8B5CF6' },
              { key: 'Cash',         label: 'Cash',          Icon: Banknote,   color: '#F59E0B' },
            ];

            return (
              <View style={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 6 }}>
                {/* Green gradient hero card (matching web) */}
                <View style={{ borderRadius: 16, padding: 14, marginBottom: 10, backgroundColor: '#10B981', shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.8)' }}>Total Balance</Text>
                  <Text style={{ fontSize: 30, fontWeight: '800', color: 'white', marginTop: 5 }}>{formatINR(availableBalance)}</Text>
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', marginTop: 1 }}>Bank, cash and wallet balances</Text>
                </View>

                {/* 3 metric cards */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Balance',     val: formatINR(availableBalance), color: '#10B981', bg: '#10B98122', sub: 'Bank + Wallets + Cash', Icon: Landmark     },
                    { label: 'Credit Used', val: formatINR(creditUsed),       color: '#EF4444', bg: '#EF444422', sub: 'Outstanding balance',   Icon: CreditCard   },
                    { label: 'Spent',       val: formatINR(spentThisMonth),   color: '#F97316', bg: '#F9731622', sub: 'This month',             Icon: TrendingDown },
                  ].map((m) => (
                    <View key={m.label} style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: BORDER }}>
                      <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: m.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                        <m.Icon size={13} color={m.color} />
                      </View>
                      <Text style={{ fontSize: 8, color: MUTED, marginBottom: 2 }}>{m.label}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: m.color }} numberOfLines={1}>{m.val}</Text>
                      <Text style={{ fontSize: 8, color: SUBTLE, marginTop: 2 }}>{m.sub}</Text>
                    </View>
                  ))}
                </View>

                {/* Accounts grouped by type */}
                {accounts.length === 0 ? (
                  <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                    <Text style={{ fontSize: 36, marginBottom: 8 }}>🏦</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF' }}>No accounts yet</Text>
                    <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>Add your bank and wallet accounts</Text>
                  </View>
                ) : (
                  SECTIONS.filter(s => (byType[s.key] ?? []).length > 0).map(({ key, label, Icon, color }) => (
                    <View key={key} style={{ marginBottom: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Icon size={14} color={color} />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#E5E7EB' }}>{label}</Text>
                        <View style={{ backgroundColor: SURFACE_ALT, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 14, color: MUTED }}>{byType[key]?.length ?? 0}</Text>
                        </View>
                      </View>
                      {(byType[key] ?? []).map((a) => <AccountRow key={a.id} account={a} />)}
                    </View>
                  ))
                )}
              </View>
            );
          })()}

          {/* ── BUDGET ────────────────────────────────────────────────────── */}
          {activeTab === 'budget' && (() => {
            const now3 = new Date();
            const monthTx = transactions.filter((t) => {
              if (t.type !== 'expense') return false;
              const d = new Date(t.date);
              return d.getMonth() === now3.getMonth() && d.getFullYear() === now3.getFullYear();
            });

            const spentByCategory: Record<string, number> = {};
            monthTx.forEach((t) => {
              spentByCategory[t.category] = (spentByCategory[t.category] ?? 0) + Math.abs(t.amount);
            });

            const budgetCards = BUDGET_BLUEPRINT.map((item) => {
              const spent = item.categories.reduce((sum, category) => sum + (spentByCategory[category] ?? 0), 0);
              const progress = item.limit > 0 ? spent / item.limit : 0;
              const remaining = item.limit - spent;
              return {
                ...item,
                spent,
                progress,
                remaining,
                statusColor: budgetStatusColor(progress),
              };
            });

            const totalBudget = budgetCards.reduce((sum, item) => sum + item.limit, 0);
            const totalSpent = budgetCards.reduce((sum, item) => sum + item.spent, 0);

            return (
              <View style={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 6 }}>
              <View style={{ display: 'none' }}>
                <Text style={{ fontSize: 36 }}>🎯</Text>
              </View>
              <Text style={{ fontSize: 14, color: MUTED }}>Monthly Budget</Text>
              <Text style={{ fontSize: 27, fontWeight: '800', color: '#FFFFFF', marginTop: 4 }}>{formatINR(totalBudget)}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <View style={{ flex: 1, backgroundColor: SURFACE_ALT, borderRadius: 12, padding: 10 }}>
                  <Text style={{ fontSize: 14, color: MUTED }}>Spent</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444', marginTop: 2 }}>{formatINR(totalSpent)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: SURFACE_ALT, borderRadius: 12, padding: 10 }}>
                  <Text style={{ fontSize: 14, color: MUTED }}>Remaining</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#10B981', marginTop: 2 }}>{formatINR(Math.max(totalBudget - totalSpent, 0))}</Text>
                </View>
              </View>
              {budgetCards.map((item) => (
                <View key={item.key} style={{ backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>{item.label}</Text>
                      <Text style={{ fontSize: 15, color: MUTED, marginTop: 2 }}>{item.categories.join(', ')}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>{formatINR(item.limit)}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: BORDER, borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
                    <View style={{ width: `${Math.min(item.progress * 100, 100)}%` as `${number}%`, height: 6, backgroundColor: item.statusColor }} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, color: item.statusColor }}>
                      {item.progress >= 1 ? 'Over budget' : `${Math.round(item.progress * 100)}% used`}
                    </Text>
                    <Text style={{ fontSize: 14, color: MUTED }}>
                      {item.remaining >= 0 ? `${formatINR(item.remaining)} left` : `${formatINR(Math.abs(item.remaining))} over`}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, backgroundColor: SURFACE_ALT, borderRadius: 12, padding: 9 }}>
                      <Text style={{ fontSize: 9, color: MUTED }}>Spent</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginTop: 2 }}>{formatINR(item.spent)}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: SURFACE_ALT, borderRadius: 12, padding: 9 }}>
                      <Text style={{ fontSize: 9, color: MUTED }}>Status</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: item.statusColor, marginTop: 2 }}>
                        {item.progress >= 1 ? 'Alert' : item.progress >= 0.75 ? 'Watch' : 'On track'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              </View>
            );
          })()}

          {/* ── VITALS ────────────────────────────────────────────────────── */}
          {activeTab === 'vitals' && (() => {
            const _now = new Date();
            const thisMonthTx = transactions.filter(t => {
              const d = new Date(t.date);
              return d.getMonth() === _now.getMonth() && d.getFullYear() === _now.getFullYear();
            });
            const monthlyIncome  = thisMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const monthlyExpense = thisMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
            const savings        = Math.max(0, monthlyIncome - monthlyExpense);
            const savingsRate    = monthlyIncome > 0 ? savings / monthlyIncome : 0;

            const liquidAssets   = accounts.filter(a => a.type !== 'Credit Card').reduce((s, a) => s + Math.max(0, a.balance), 0);
            const investedAssets = assets.reduce((s, a) => s + a.value, 0);
            const totalAss       = liquidAssets + investedAssets;
            const totalLiab      = liabilities.reduce((s, l) => s + l.outstanding, 0);
            const netWorth       = totalAss - totalLiab;
            const emergencyFund  = accounts.filter(a => a.type === 'Cash' || a.type === 'Bank').reduce((s, a) => s + Math.max(0, a.balance), 0);
            const runwayMonths   = monthlyExpense > 0 ? emergencyFund / monthlyExpense : 0;
            const debtRatio      = totalAss > 0 ? totalLiab / totalAss : 0;
            const fiYears        = savings > 0 ? Math.round((monthlyExpense * 12 * 25) / (savings * 12)) : null;

            // Scores (each /2, total /10)
            const sEF  = runwayMonths >= 6 ? 2 : runwayMonths >= 3 ? 1.5 : runwayMonths >= 1 ? 1 : 0.5;
            const sSR  = savingsRate >= 0.40 ? 2 : savingsRate >= 0.25 ? 1.5 : savingsRate >= 0.10 ? 1 : 0.5;
            const sDR  = debtRatio < 0.20 ? 2 : debtRatio < 0.30 ? 1.5 : debtRatio < 0.50 ? 1 : 0.5;
            const totalScore = Math.round((sEF + sSR + sDR + 0.5 + 0.5) * 10) / 10; // insurance defaults to 0.5 without profile
            const scoreColor = totalScore >= 7 ? '#10B981' : totalScore >= 5 ? '#F59E0B' : '#EF4444';
            const scoreLabel = totalScore >= 7 ? 'Good' : totalScore >= 5 ? 'Fair' : 'Needs Work';

            const barC = (s: number) => s >= 1.5 ? '#10B981' : s >= 1 ? '#F59E0B' : '#EF4444';

            const topActions = [
              { cond: runwayMonths < 6,      label: 'Build emergency fund',   detail: `Need ${fmtCompact(Math.max(0, monthlyExpense * (6 - runwayMonths)))} more for 6-month safety net` },
              { cond: savingsRate < 0.25,    label: 'Increase savings rate',  detail: `Aim for 25%+ — currently ${Math.round(savingsRate * 100)}%` },
              { cond: debtRatio >= 0.20,     label: 'Reduce debt',            detail: `Debt ratio is ${Math.round(debtRatio * 100)}% — target below 20%` },
            ].filter(a => a.cond);

            return (
              <View style={{ padding: 20 }}>
                {/* Hero Score Card */}
                <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Activity size={16} color={scoreColor} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Vital Score</Text>
                    <View style={{ backgroundColor: scoreColor + '22', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: scoreColor }}>{scoreLabel}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    {/* Score ring */}
                    <View style={{ width: 94, height: 94, borderRadius: 47, borderWidth: 9, borderColor: scoreColor, alignItems: 'center', justifyContent: 'center', backgroundColor: SCREEN_BG }}>
                      <Text style={{ fontSize: 24, fontWeight: '800', color: scoreColor }}>{totalScore}</Text>
                      <Text style={{ fontSize: 14, color: '#6B7280' }}>/10</Text>
                    </View>
                    {/* Factor bars */}
                    <View style={{ flex: 1, gap: 8 }}>
                      {[
                        { label: 'Emergency Fund', score: sEF },
                        { label: 'Savings Rate',   score: sSR },
                        { label: 'Debt Ratio',     score: sDR },
                      ].map((f) => (
                        <View key={f.label}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                            <Text style={{ fontSize: 14, color: '#9CA3AF' }}>{f.label}</Text>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: barC(f.score) }}>{f.score}/2</Text>
                          </View>
                          <View style={{ height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ height: 4, width: `${(f.score / 2) * 100}%` as `${number}%`, backgroundColor: barC(f.score), borderRadius: 2 }} />
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Profile quick-stats */}
                <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Activity size={16} color="#9CA3AF" />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Financial Profile</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {[
                      { label: 'Monthly Income',  val: fmtCompact(monthlyIncome),  color: '#10B981', sub: 'This month' },
                      { label: 'Monthly Expense', val: fmtCompact(monthlyExpense), color: '#EF4444', sub: 'This month' },
                      { label: 'Liquid Assets',   val: fmtCompact(liquidAssets),   color: '#3B82F6', sub: 'Bank + Wallets' },
                    ].map((t) => (
                      <View key={t.label} style={{ flex: 1, backgroundColor: SURFACE_ALT, borderRadius: 12, padding: 10 }}>
                        <Text style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>{t.label}</Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: t.color }}>{t.val}</Text>
                        <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}>{t.sub}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Emergency Fund */}
                <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Emergency Fund</Text>
                    <View style={{ backgroundColor: barC(sEF) + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: barC(sEF) }}>{sEF}/2</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>
                    Cash & Savings: <Text style={{ fontWeight: '700', color: '#E5E7EB' }}>{fmtCompact(emergencyFund)}</Text>
                  </Text>
                  <Text style={{ fontSize: 14, color: runwayMonths >= 6 ? '#10B981' : '#F59E0B' }}>
                    Monthly runway: <Text style={{ fontWeight: '700' }}>{runwayMonths.toFixed(1)} months</Text>
                  </Text>
                  <View style={{ height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, overflow: 'hidden', marginTop: 10 }}>
                    <View style={{ height: 6, width: `${Math.min((runwayMonths / 12) * 100, 100)}%` as `${number}%`, backgroundColor: barC(sEF), borderRadius: 3 }} />
                  </View>
                  <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                    {runwayMonths < 6 ? `Build ${fmtCompact(Math.max(0, monthlyExpense * (6 - runwayMonths)))} more for a 6-month safety net` : '6-month emergency fund is in place ✓'}
                  </Text>
                </View>

                {/* Savings Rate */}
                <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Savings Rate</Text>
                    <View style={{ backgroundColor: barC(sSR) + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: barC(sSR) }}>{sSR}/2</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>
                    Income: <Text style={{ color: '#10B981', fontWeight: '600' }}>{fmtCompact(monthlyIncome)}</Text>
                    {'  '}Expense: <Text style={{ color: '#EF4444', fontWeight: '600' }}>{fmtCompact(monthlyExpense)}</Text>
                  </Text>
                  <Text style={{ fontSize: 14, color: savingsRate >= 0.2 ? '#10B981' : '#F59E0B' }}>
                    Saving <Text style={{ fontWeight: '700' }}>{Math.round(savingsRate * 100)}%</Text> of income this month
                  </Text>
                  {fiYears !== null && (
                    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>FI estimate at current pace: ~{fiYears} yrs</Text>
                  )}
                  <View style={{ height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, overflow: 'hidden', marginTop: 10 }}>
                    <View style={{ height: 6, width: `${Math.min(savingsRate * 200, 100)}%` as `${number}%`, backgroundColor: barC(sSR), borderRadius: 3 }} />
                  </View>
                </View>

                {/* Debt Ratio */}
                {(totalAss > 0 || totalLiab > 0) && (
                  <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <Shield size={16} color="#9CA3AF" />
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF', flex: 1 }}>Debt Ratio</Text>
                      <View style={{ backgroundColor: barC(sDR) + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: barC(sDR) }}>{sDR}/2</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }}>
                      {Math.round(debtRatio * 100)}%
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>Liabilities ÷ Total Assets</Text>
                    <View style={{ gap: 6 }}>
                      {[
                        { label: 'Total Assets',      val: fmtCompact(totalAss),  color: '#10B981' },
                        { label: 'Total Liabilities', val: fmtCompact(totalLiab), color: '#EF4444' },
                        { label: 'Net Worth',         val: fmtCompact(netWorth),  color: netWorth >= 0 ? '#10B981' : '#EF4444' },
                      ].map((r) => (
                        <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 14, color: '#9CA3AF' }}>{r.label}</Text>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: r.color }}>{r.val}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={{ height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, overflow: 'hidden', marginTop: 12 }}>
                      <View style={{ height: 6, width: `${Math.min(debtRatio * 100, 100)}%` as `${number}%`, backgroundColor: barC(sDR), borderRadius: 3 }} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                      <Text style={{ fontSize: 14, color: '#10B981' }}>● &lt;20% Good</Text>
                      <Text style={{ fontSize: 14, color: '#F59E0B' }}>● 20–30% Fair</Text>
                      <Text style={{ fontSize: 14, color: '#EF4444' }}>● &gt;50% High</Text>
                    </View>
                  </View>
                )}

                {/* Future Impact */}
                {monthlyIncome > 0 && monthlyExpense > 0 && (
                  <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <TrendingUp size={16} color="#3B82F6" />
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Future Impact</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1, backgroundColor: '#3B82F622', borderRadius: 12, padding: 14 }}>
                        <Text style={{ fontSize: 14, color: '#93C5FD', marginBottom: 4 }}>At {Math.round(savingsRate * 100)}% savings</Text>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#DBEAFE' }}>{fiYears !== null ? `${fiYears} yrs` : 'N/A'}</Text>
                        <Text style={{ fontSize: 14, color: '#93C5FD', marginTop: 2 }}>to Financial Independence</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#10B98122', borderRadius: 12, padding: 14 }}>
                        <Text style={{ fontSize: 14, color: '#6EE7B7', marginBottom: 4 }}>If savings = 30%</Text>
                        {(() => {
                          const s30 = monthlyIncome * 0.30;
                          const fi30 = s30 > 0 ? Math.round((monthlyExpense * 12 * 25) / (s30 * 12)) : null;
                          return (
                            <>
                              <Text style={{ fontSize: 18, fontWeight: '800', color: '#D1FAE5' }}>{fi30 !== null ? `${fi30} yrs` : '—'}</Text>
                              <Text style={{ fontSize: 14, color: '#6EE7B7', marginTop: 2 }}>
                                {s30 > savings ? `Save ${fmtCompact(s30 - savings)} more/mo` : 'Already at target ✓'}
                              </Text>
                            </>
                          );
                        })()}
                      </View>
                    </View>
                  </View>
                )}

                {/* Top Actions */}
                {topActions.length > 0 && (
                  <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <Zap size={16} color="#F59E0B" />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Top Actions</Text>
                    </View>
                    {topActions.map((a, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: SURFACE_ALT, borderRadius: 12, padding: 12, marginBottom: i < topActions.length - 1 ? 8 : 0 }}>
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#F59E0B22', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#F59E0B' }}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#E5E7EB' }}>{a.label}</Text>
                          {!!a.detail && <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 2 }}>{a.detail}</Text>}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })()}

          {/* ── SETTINGS ──────────────────────────────────────────────────── */}
          {activeTab === 'settings' && <FinanceSettings transactions={transactions} assets={assets} liabilities={liabilities} accounts={accounts} />}

        </ScrollView>
      </View>

      {/* Bottom Nav */}
      <SubNav active={activeTab} onSelect={setActiveTab} onMore={() => setShowMore(true)} />

      {/* FAB */}
      {fabVisible && (
        <TouchableOpacity onPress={onFabPress}
          style={{ position: 'absolute', bottom: 72, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', shadowColor: ACCENT, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 }}>
          <Plus size={26} color="white" />
        </TouchableOpacity>
      )}

      {/* Modals */}
      <MoreSheet visible={showMore} active={activeTab} onSelect={setActiveTab} onClose={() => setShowMore(false)} />
      <AddTxModal visible={showAddTx} onClose={() => setShowAddTx(false)} accounts={accounts} onSave={(data) => createTxMut.mutate(data)} />
      <AssetModal visible={showAddAsset} accounts={accounts} onClose={() => setShowAddAsset(false)}
        onSave={(data) => createAssetMut.mutate(data)} />
      <AssetModal visible={!!editAsset} initial={editAsset} accounts={accounts}
        onClose={() => setEditAsset(null)}
        onSave={(data) => { if (editAsset) updateAssetMut.mutate({ id: editAsset.id, data }); setEditAsset(null); }} />
      <LiabilityModal visible={showAddLiab} accounts={accounts} onClose={() => setShowAddLiab(false)}
        onSave={(data) => createLiabMut.mutate(data)} />
      <LiabilityModal visible={!!editLiability} initial={editLiability} accounts={accounts}
        onClose={() => setEditLiability(null)}
        onSave={(data) => { if (editLiability) updateLiabMut.mutate({ id: editLiability.id, data }); setEditLiability(null); }} />
      <RecordPaymentModal visible={!!payLiability} liability={payLiability} accounts={accounts}
        onClose={() => setPayLiability(null)} onPay={handleRecordPayment} />
    </SafeAreaView>
  );
}
