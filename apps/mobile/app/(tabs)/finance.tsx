import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { router } from 'expo-router';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccounts, updateAccount, deleteAccount,
  getTransactions, createTransaction, updateTransaction, deleteTransaction,
  getAssets, createAsset, updateAsset, deleteAsset,
  getLiabilities, createLiability, updateLiability, deleteLiability,
  getBudgets, createBudget, updateBudget, deleteBudget,
  apiRequest,
} from '@myorbit/api';
import type {
  Account, Transaction, CreateTransactionInput,
  Asset, Liability, CreateAssetInput, CreateLiabilityInput,
  Budget, CreateBudgetInput,
} from '@myorbit/api';
import {
  TrendingUp, TrendingDown, ArrowLeftRight, Plus, Wallet,
  CreditCard, Banknote, ChevronLeft, ChevronRight, Trash2,
  LayoutDashboard, Landmark, ChartBar,
  MoreHorizontal, X, Settings, Pencil, CheckCircle,
  CalendarDays, DollarSign, Tag,
  ShieldCheck, Lightbulb, Calendar, ChartPie,
  Search, Shield, Activity, Zap,
  Home, ShoppingCart, Utensils, Fuel, Bus, Wifi, Smartphone,
  ShoppingBag, RefreshCw, Stethoscope, Plane, GraduationCap,
  Gift, Package, Coffee, Receipt, Heart, Film, PiggyBank,
  Briefcase, Award, Laptop, Building2, Percent, RotateCcw,
  Undo2, Star, Repeat2, ChevronDown,
} from 'lucide-react-native';
import AppHeader from '@/components/shared/AppHeader';
import { Svg, Path } from 'react-native-svg';
import { useTheme } from '@/lib/themeStore';

// ── Types ──────────────────────────────────────────────────────────────────────

type SubTab = 'overview' | 'accounts' | 'transactions' | 'assets' | 'liabilities' | 'budget' | 'vitals' | 'settings';

// ── Constants ──────────────────────────────────────────────────────────────────

const ACCENT = '#10B981';
function useFinanceColors() {
  const T = useTheme();
  return {
    SCREEN_BG:   T.bg,
    SURFACE:     T.cardBg,
    SURFACE_ALT: T.surfaceAlt,
    BORDER:      T.border,
    MUTED:       T.subText,
    SUBTLE:      T.mutedText,
    TXT:         T.text,
    TXT2:        T.textSec,
    INPUT:       T.inputBg,
    MODAL:       T.modalBg,
  };
}

const SUB_TABS = [
  { key: 'overview'      as SubTab, label: 'Overview',     Icon: LayoutDashboard },
  { key: 'transactions'  as SubTab, label: 'Transactions', Icon: ArrowLeftRight  },
  { key: 'assets'        as SubTab, label: 'Assets',       Icon: TrendingUp      },
  { key: 'liabilities'   as SubTab, label: 'Liabilities',  Icon: CreditCard      },
];

const MORE_ITEMS = [
  { key: 'accounts'  as SubTab, label: 'Accounts', Icon: Landmark  },
  { key: 'budget'    as SubTab, label: 'Budget',   Icon: Wallet    },
  { key: 'vitals'    as SubTab, label: 'Vitals',   Icon: ChartBar },
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

const CAT_KEYWORDS: [string[], CatCfg][] = [
  [['food','meal','lunch','dinner','breakfast','cafe','restaurant','dining','eat','snack','burger','pizza','biryani','swiggy','zomato'],  { Icon: Utensils,    bg: '#7C2D12', color: '#FB923C' }],
  [['grocery','groceries','vegetables','fruit','supermarket','mart','lulu'],                                                            { Icon: ShoppingCart, bg: '#14532D', color: '#4ADE80' }],
  [['petrol','diesel','fuel','gas','shell','hp','iocl'],                                                                               { Icon: Fuel,         bg: '#78350F', color: '#FCD34D' }],
  [['rent','lease','flat','apartment','pg','hostel','lodge'],                                                                          { Icon: Home,         bg: '#581C87', color: '#C084FC' }],
  [['medical','hospital','clinic','pharmacy','doctor','medicine','health','apollo'],                                                    { Icon: Stethoscope,  bg: '#7F1D1D', color: '#FCA5A5' }],
  [['transport','bus','metro','train','auto','cab','ola','uber','taxi','rickshaw'],                                                     { Icon: Bus,          bg: '#1E3A5F', color: '#60A5FA' }],
  [['shopping','clothes','fashion','zara','h&m','amazon','flipkart','myntra','dress'],                                                  { Icon: ShoppingBag,  bg: '#831843', color: '#F472B6' }],
  [['subscription','netflix','spotify','prime','hotstar','youtube','disney'],                                                          { Icon: RefreshCw,    bg: '#3B0764', color: '#A78BFA' }],
  [['salary','payroll','ctc','income'],                                                                                               { Icon: Briefcase,    bg: '#14532D', color: '#4ADE80' }],
  [['investment','invest','sip','mutual','stocks','equity','nifty'],                                                                   { Icon: PiggyBank,    bg: '#14532D', color: '#4ADE80' }],
  [['family','parent','mom','dad','amma','appa','kids','children','wife','husband'],                                                   { Icon: Heart,        bg: '#1C1C2E', color: '#E5E7EB' }],
  [['loan','emi','credit','debt','repay'],                                                                                            { Icon: Landmark,     bg: '#7C2D12', color: '#FDBA74' }],
  [['electricity','water','gas','utility','bill','recharge','mobile','internet','wifi'],                                               { Icon: Zap,          bg: '#713F12', color: '#FDE047' }],
  [['entertainment','movie','film','theatre','concert','game','cricket','sport'],                                                      { Icon: Film,         bg: '#3B0764', color: '#A78BFA' }],
  [['travel','flight','hotel','trip','vacation','holiday','tour'],                                                                    { Icon: Plane,        bg: '#1E3A5F', color: '#93C5FD' }],
];

function getCatIcon(cat: string): CatCfg {
  if (!cat) return { Icon: Tag, bg: '#1F2937', color: '#9CA3AF' };
  if (CATEGORY_CONFIG[cat]) return CATEGORY_CONFIG[cat];
  const lower = cat.toLowerCase();
  const exactKey = Object.keys(CATEGORY_CONFIG).find(k => k.toLowerCase() === lower);
  if (exactKey) return CATEGORY_CONFIG[exactKey];
  for (const [keywords, cfg] of CAT_KEYWORDS) {
    if (keywords.some(kw => lower.includes(kw))) return cfg;
  }
  return { Icon: Tag, bg: '#1F2937', color: '#9CA3AF' };
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
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
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
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose} />
        <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 }}>
          <View style={{ width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER }}>
            <Text style={{ fontWeight: '600', fontSize: 15, color: TXT }}>More</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} color={MUTED} />
            </TouchableOpacity>
          </View>
          {MORE_ITEMS.map(({ key, label, Icon }) => (
            <TouchableOpacity key={key} onPress={() => { onSelect(key); onClose(); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: active === key ? '#052e1a' : 'transparent' }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: active === key ? ACCENT + '22' : SURFACE_ALT, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={active === key ? ACCENT : MUTED} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: active === key ? ACCENT : TXT2 }}>{label}</Text>
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
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 14, marginVertical: 10, backgroundColor: SURFACE, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: BORDER }}>
      <TouchableOpacity onPress={onPrev} style={{ padding: 4 }}><ChevronLeft size={20} color={MUTED} /></TouchableOpacity>
      <Text style={{ fontSize: 14, fontWeight: '600', color: TXT }}>{monthLabel(year, month)}</Text>
      <TouchableOpacity onPress={onNext} style={{ padding: 4 }}><ChevronRight size={20} color={MUTED} /></TouchableOpacity>
    </View>
  );
}

// ── Account Card (horizontal scroll) ──────────────────────────────────────────

function AccountCard({ account }: { account: Account }) {
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  const Icon = ACCOUNT_ICONS[account.type] ?? Wallet;
  const color = ACCOUNT_COLORS[account.type] ?? '#64748B';
  return (
    <View style={{ width: 160, backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginRight: 12, borderWidth: 1, borderColor: color + '22' }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Icon size={18} color={color} />
      </View>
      <Text style={{ fontSize: 14, color: MUTED, marginBottom: 2 }}>{account.type}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: TXT, marginBottom: 4 }} numberOfLines={1}>{account.name}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: account.balance >= 0 ? '#10B981' : '#EF4444' }}>{formatINR(account.balance)}</Text>
    </View>
  );
}

// ── Account Row (vertical list) ────────────────────────────────────────────────

function AccountRow({ account, onOptions }: { account: Account; onOptions?: () => void }) {
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  const color = ACCOUNT_COLORS[account.type] ?? '#64748B';
  const Icon = ACCOUNT_ICONS[account.type] ?? Wallet;
  const isCreditCard = account.type === 'Credit Card';
  const creditUsed = isCreditCard ? Math.abs(Math.min(account.balance, 0)) : 0;
  const creditLimit = account.creditLimit ?? 0;
  const creditAvailable = isCreditCard && creditLimit ? Math.max(0, creditLimit - creditUsed) : 0;
  const usedPct = isCreditCard && creditLimit > 0 ? Math.min(Math.round((creditUsed / creditLimit) * 100), 100) : 0;
  const barColor = usedPct >= 90 ? '#EF4444' : usedPct >= 75 ? '#F59E0B' : '#10B981';

  return (
    <View style={{ backgroundColor: SURFACE, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
          <Icon size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: TXT }}>{account.name}</Text>
          <Text style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{account.type}</Text>
        </View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: isCreditCard ? (account.balance < 0 ? '#EF4444' : '#10B981') : (account.balance >= 0 ? '#10B981' : '#EF4444'), marginRight: 8 }}>
          {isCreditCard && account.balance < 0 ? '−' : ''}{formatINR(Math.abs(account.balance))}
        </Text>
        <TouchableOpacity onPress={onOptions} style={{ padding: 6 }}>
          <MoreHorizontal size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
      {isCreditCard && creditLimit > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 13, marginBottom: 8 }}>
            <Text style={{ color: MUTED }}>Limit {formatINR(creditLimit)} · </Text>
            <Text style={{ color: barColor, fontWeight: '600' }}>Used {usedPct}%</Text>
          </Text>
          <View style={{ height: 5, backgroundColor: BORDER, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
            <View style={{ width: `${usedPct}%` as `${number}%`, height: 5, backgroundColor: barColor }} />
          </View>
          <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '600' }}>
            Available {formatINR(creditAvailable)}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Transaction Item ───────────────────────────────────────────────────────────

function TxItem({ tx, accountName, onMenuOpen }: {
  tx: Transaction; accountName?: string;
  onMenuOpen: (tx: Transaction, y: number) => void;
}) {
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  const btnRef = useRef<any>(null);
  const isIncome   = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';
  const color = isTransfer ? '#3B82F6' : isIncome ? '#10B981' : '#EF4444';
  const cfg   = getCatIcon(tx.category);
  const CIcon = cfg.Icon;
  const shortDate = tx.date
    ? new Date(tx.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';

  const handleMenuOpen = () => {
    btnRef.current?.measureInWindow((_x: number, y: number, _w: number, h: number) => {
      onMenuOpen(tx, y + h / 2);
    });
  };

  return (
    <View style={{ paddingHorizontal: 14, paddingVertical: 13, backgroundColor: SURFACE, borderBottomWidth: 1, borderBottomColor: BORDER }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <CIcon size={18} color={cfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: TXT }} numberOfLines={1}>{tx.description}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6, flexWrap: 'wrap' }}>
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: cfg.bg }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: cfg.color }}>{tx.category}</Text>
            </View>
            <Text style={{ fontSize: 12, color: MUTED }}>{[accountName, shortDate].filter(Boolean).join(' · ')}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 15, fontWeight: '700', color, marginRight: 8 }}>
          {isIncome ? '+' : isTransfer ? '' : '−'}{formatINR(tx.amount)}
        </Text>
        <TouchableOpacity ref={btnRef} onPress={handleMenuOpen} style={{ padding: 6 }}>
          <MoreHorizontal size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Asset Card ─────────────────────────────────────────────────────────────────

function AssetCard({ asset, onEdit, onDelete }: {
  asset: Asset;
  onEdit: (a: Asset) => void;
  onDelete: (id: string) => void;
}) {
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  const [expanded, setExpanded] = useState(false);
  const color = catColor(asset.category);
  const pnl   = asset.value - asset.invested;
  const pnlPct = asset.invested > 0 ? ((pnl / asset.invested) * 100).toFixed(1) : '0';
  return (
    <View style={{ backgroundColor: SURFACE, borderRadius: 16, marginBottom: 10, overflow: 'hidden' }}>
      <TouchableOpacity onPress={() => setExpanded(v => !v)} activeOpacity={0.7}
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 }}>
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: color + '18', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Tag size={16} color={color + 'CC'} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: TXT }} numberOfLines={1}>{asset.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 }}>
            <View style={{ backgroundColor: color + '18', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: color + 'CC' }}>{asset.category}</Text>
            </View>
            {asset.units != null && asset.units > 0 && (
              <Text style={{ fontSize: 12, color: MUTED }}>{asset.units} units</Text>
            )}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#10B981' }}>{formatINR(asset.value)}</Text>
          <Text style={{ fontSize: 12, color: pnl >= 0 ? '#10B981' : '#EF4444', marginTop: 2 }}>
            {pnl >= 0 ? '+' : '−'}{pnlPct}%
          </Text>
        </View>
        <ChevronDown size={16} color={MUTED} style={{ marginLeft: 8, transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />
      </TouchableOpacity>
      {expanded && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: BORDER }}>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <View style={{ flex: 1, backgroundColor: SURFACE_ALT, borderRadius: 10, padding: 10 }}>
              <Text style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Invested</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: TXT2 }}>{formatINR(asset.invested)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: SURFACE_ALT, borderRadius: 10, padding: 10 }}>
              <Text style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Current</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#10B981' }}>{formatINR(asset.value)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: pnl >= 0 ? '#10B98118' : '#EF444418', borderRadius: 10, padding: 10 }}>
              <Text style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>P&L</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: pnl >= 0 ? '#10B981' : '#EF4444' }}>
                {pnl >= 0 ? '+' : '−'}{formatINR(Math.abs(pnl))}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <TouchableOpacity onPress={() => onEdit(asset)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: BORDER }}>
              <Pencil size={13} color={MUTED} />
              <Text style={{ fontSize: 13, color: MUTED }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(asset.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: '#EF444418' }}>
              <Trash2 size={13} color="#EF4444" />
              <Text style={{ fontSize: 13, color: '#EF4444' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  const [expanded, setExpanded] = useState(false);
  const days    = daysUntil(liability.nextDueDate);
  const overdue = days !== null && days < 0;
  const dueSoon = days !== null && days <= 7 && days >= 0;
  const paidPct = liability.borrowed > 0
    ? Math.round((liability.totalRepaid / liability.borrowed) * 100)
    : 0;

  return (
    <View style={{ backgroundColor: SURFACE, borderRadius: 16, marginBottom: 10, overflow: 'hidden' }}>
      <TouchableOpacity onPress={() => setExpanded(v => !v)} activeOpacity={0.7}
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 }}>
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#EF444418', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <CreditCard size={16} color="#EF4444CC" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: TXT }} numberOfLines={1}>{liability.name}</Text>
          {!!liability.lender && (
            <Text style={{ fontSize: 12, color: MUTED, marginTop: 1 }} numberOfLines={1}>{liability.lender}</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#EF4444' }}>{formatINR(liability.outstanding)}</Text>
          <Text style={{ fontSize: 12, color: MUTED }}>{paidPct}% repaid</Text>
        </View>
        <ChevronDown size={16} color={MUTED} style={{ marginLeft: 8, transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: BORDER }}>
          {/* Progress bar */}
          <View style={{ marginTop: 12, marginBottom: 10 }}>
            <View style={{ height: 6, backgroundColor: BORDER, borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ height: 6, width: `${paidPct}%` as `${number}%`, backgroundColor: ACCENT, borderRadius: 3 }} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: SURFACE_ALT, borderRadius: 10, padding: 10 }}>
              <Text style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Outstanding</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>{formatINR(liability.outstanding)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: SURFACE_ALT, borderRadius: 10, padding: 10 }}>
              <Text style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>EMI / mo</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: TXT2 }}>{formatINR(liability.monthlyEmi)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: overdue ? '#EF444422' : dueSoon ? '#D9770622' : SURFACE_ALT, borderRadius: 10, padding: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                <CalendarDays size={10} color={overdue ? '#EF4444' : dueSoon ? '#D97706' : MUTED} />
                <Text style={{ fontSize: 11, color: overdue ? '#EF4444' : dueSoon ? '#D97706' : MUTED }}>Next due</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: overdue ? '#EF4444' : dueSoon ? '#D97706' : TXT2 }}>
                {fmtDate(liability.nextDueDate)}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 12, color: MUTED, marginTop: 10 }}>
            {liability.emisLeft} EMIs left · Borrowed {formatINR(liability.borrowed)} · Repaid {formatINR(liability.totalRepaid)}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <TouchableOpacity onPress={() => onPay(liability)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: '#10B98118' }}>
              <CheckCircle size={13} color={ACCENT} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>Pay</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onEdit(liability)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: BORDER }}>
              <Pencil size={13} color={MUTED} />
              <Text style={{ fontSize: 13, color: MUTED }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(liability.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: '#EF444418' }}>
              <Trash2 size={13} color="#EF4444" />
              <Text style={{ fontSize: 13, color: '#EF4444' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Finance Date Picker ───────────────────────────────────────────────────────

function FinanceDatePicker({ visible, value, onConfirm, onClose }: {
  visible: boolean; value: string; onConfirm: (v: string) => void; onClose: () => void;
}) {
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  const todayStr = () => new Date().toLocaleDateString('en-CA');

  const parseDate = (s: string) => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const [viewYear,  setViewYear]  = useState(() => parseDate(value).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parseDate(value).getMonth());
  const [selected,  setSelected]  = useState(value || todayStr());

  useEffect(() => {
    if (visible) {
      const d = parseDate(value || todayStr());
      setSelected(value || todayStr());
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [visible, value]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow    = new Date(viewYear, viewMonth, 1).getDay();
  const leadingBlanks = firstDow === 0 ? 6 : firstDow - 1;
  const cells = Array.from({ length: leadingBlanks + daysInMonth }, (_, i) =>
    i < leadingBlanks ? null : i - leadingBlanks + 1
  );

  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  const dayLabels  = ['Mo','Tu','We','Th','Fr','Sa','Su'];

  const setQuick = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const s = d.toLocaleDateString('en-CA');
    setSelected(s);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const cellDate = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onClose} />
      <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: TXT }}>Select Date</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <X size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Quick chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[['Today', 0], ['Yesterday', -1], ['Last Week', -7]] .map(([label, offset]) => {
            const s = (() => { const d = new Date(); d.setDate(d.getDate() + Number(offset)); return d.toLocaleDateString('en-CA'); })();
            const active = selected === s;
            return (
              <TouchableOpacity key={String(label)} onPress={() => setQuick(Number(offset))}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
                  borderColor: active ? ACCENT : BORDER, backgroundColor: active ? ACCENT + '22' : SURFACE_ALT }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: active ? ACCENT : MUTED }}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Month nav */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <TouchableOpacity onPress={prevMonth} style={{ padding: 6 }}>
            <ChevronLeft size={20} color={MUTED} />
          </TouchableOpacity>
          <Text style={{ fontSize: 15, fontWeight: '700', color: TXT2 }}>
            {monthNames[viewMonth]} {viewYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={{ padding: 6 }}>
            <ChevronRight size={20} color={MUTED} />
          </TouchableOpacity>
        </View>

        {/* Day-of-week headers */}
        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
          {dayLabels.map(d => (
            <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: SUBTLE, marginBottom: 4 }}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((day, i) => {
            if (day === null) return <View key={`b${i}`} style={{ width: `${100/7}%`, aspectRatio: 1 }} />;
            const iso = cellDate(day);
            const isSelected = selected === iso;
            const isToday = iso === todayStr();
            return (
              <TouchableOpacity key={iso} onPress={() => setSelected(iso)}
                style={{ width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isSelected ? ACCENT : 'transparent',
                  borderWidth: isToday && !isSelected ? 1 : 0, borderColor: ACCENT }}>
                  <Text style={{ fontSize: 14, fontWeight: isSelected || isToday ? '700' : '400',
                    color: isSelected ? TXT : isToday ? ACCENT : TXT2 }}>{day}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Confirm */}
        <TouchableOpacity onPress={() => { onConfirm(selected); onClose(); }}
          style={{ marginTop: 16, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: ACCENT }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: TXT }}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Simple Account Dropdown ───────────────────────────────────────────────────

function SimpleAccountDropdown({ value, onChange, accounts, placeholder = 'Select account (optional)' }: {
  value: string; onChange: (id: string) => void;
  accounts: Account[]; placeholder?: string;
}) {
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  const [open, setOpen] = useState(false);
  const selected = accounts.find(a => a.id === value);
  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: value ? ACCENT : BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 }}>
        <Landmark size={15} color={value ? ACCENT : SUBTLE} />
        <Text style={{ flex: 1, fontSize: 14, color: value ? TXT2 : MUTED, marginLeft: 8 }} numberOfLines={1}>
          {selected ? `${selected.name} · ${selected.type}` : placeholder}
        </Text>
        {value ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={15} color="#6B7280" />
          </TouchableOpacity>
        ) : (
          <ChevronDown size={15} color="#6B7280" />
        )}
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={() => setOpen(false)} />
        <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 16, paddingBottom: 36 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: TXT, paddingHorizontal: 20, marginBottom: 8 }}>Select Account</Text>
          <TouchableOpacity onPress={() => { onChange(''); setOpen(false); }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: !value ? '#10B98115' : 'transparent' }}>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: !value ? ACCENT : TXT2 }}>None</Text>
            {!value && <Text style={{ color: ACCENT, fontWeight: '700' }}>✓</Text>}
          </TouchableOpacity>
          {accounts.map((a, i) => (
            <TouchableOpacity key={a.id} onPress={() => { onChange(a.id); setOpen(false); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: i < accounts.length - 1 ? 1 : 0, borderBottomColor: BORDER, backgroundColor: value === a.id ? '#10B98115' : 'transparent' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: value === a.id ? ACCENT : TXT2 }}>{a.name}</Text>
                <Text style={{ fontSize: 12, color: SUBTLE, marginTop: 1 }}>{a.type}</Text>
              </View>
              {value === a.id && <Text style={{ color: ACCENT, fontWeight: '700' }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </>
  );
}

// ── Account Overlay Picker ────────────────────────────────────────────────────

function AccountOverlay({ label, value, onChange, dropKey, accounts, activeDropdown, openDropdown, closeDropdown }: {
  label: string; value: string; onChange: (id: string) => void; dropKey: 'from' | 'to' | 'acct';
  accounts: Account[]; activeDropdown: 'from' | 'to' | 'acct' | null;
  openDropdown: (key: 'from' | 'to' | 'acct') => void; closeDropdown: () => void;
}) {
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  const selected = accounts.find(a => a.id === value);
  const isOpen = activeDropdown === dropKey;
  return (
    <>
      <TouchableOpacity onPress={() => openDropdown(dropKey)}
        style={{ borderWidth: 1, borderColor: value ? ACCENT : BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        {selected ? (
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: TXT2 }} numberOfLines={1}>{selected.name}</Text>
            <Text style={{ fontSize: 11, color: MUTED }}>{selected.type}</Text>
          </View>
        ) : (
          <Text style={{ flex: 1, fontSize: 13, color: '#4B5563' }}>{label}</Text>
        )}
        <ChevronDown size={14} color={value ? ACCENT : '#4B5563'} />
      </TouchableOpacity>
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closeDropdown}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={closeDropdown} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: SURFACE, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: BORDER }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: TXT }}>{label}</Text>
            <TouchableOpacity onPress={closeDropdown} style={{ padding: 4 }}>
              <X size={18} color={MUTED} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => { onChange(''); closeDropdown(); }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: !value ? '#10B98115' : 'transparent' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: !value ? ACCENT : MUTED }}>None</Text>
              {!value && <Text style={{ fontSize: 14, color: ACCENT }}>✓</Text>}
            </TouchableOpacity>
            {accounts.map((a, i) => (
              <TouchableOpacity key={a.id} onPress={() => { onChange(a.id); closeDropdown(); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: i < accounts.length - 1 ? 1 : 0, borderBottomColor: BORDER, backgroundColor: value === a.id ? '#10B98115' : 'transparent' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: value === a.id ? ACCENT : TXT2 }}>{a.name}</Text>
                  <Text style={{ fontSize: 12, color: SUBTLE, marginTop: 1 }}>{a.type}</Text>
                </View>
                {value === a.id && <Text style={{ fontSize: 14, color: ACCENT, fontWeight: '700' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

// ── Add Transaction Modal ──────────────────────────────────────────────────────

function AddTxModal({ visible, onClose, accounts, onSave }: {
  visible: boolean; onClose: () => void;
  accounts: Account[]; onSave: (data: CreateTransactionInput) => void;
}) {
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
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
      onSave({ type, amount: -Math.abs(amt), description: desc.trim() || 'Transfer', category: 'Transfer', date, accountId: fromAccId });
      onSave({ type, amount: Math.abs(amt), description: desc.trim() || 'Transfer', category: 'Transfer', date, accountId: toAccId });
    } else {
      if (!amt || !category) return;
      onSave({ type, amount: type === 'expense' ? -Math.abs(amt) : Math.abs(amt), description: desc.trim() || category, category, date, accountId: accountId || undefined });
    }
    reset(); onClose();
  };

  const [activeDropdown,   setActiveDropdown]   = useState<'from' | 'to' | 'acct' | null>(null);
  const [showDatePicker,   setShowDatePicker]   = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showCustomCat,    setShowCustomCat]    = useState(false);
  const [customCatText,    setCustomCatText]    = useState('');

  const openDropdown = (key: 'from' | 'to' | 'acct') => setActiveDropdown(key);
  const closeDropdown = () => setActiveDropdown(null);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: SCREEN_BG, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 12, paddingBottom: 36 }}>
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
                  <TIcon size={15} color={type === t ? c : SUBTLE} />
                  <Text style={{ fontSize: 15, fontWeight: type === t ? '700' : '500', color: type === t ? c : SUBTLE, textTransform: 'capitalize' }}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8 }}>

            {/* ── TRANSFER FORM ── */}
            {type === 'transfer' && (
              <>
                <Text style={{ fontSize: 13, fontWeight: '700', color: SUBTLE, letterSpacing: 1, marginBottom: 14 }}>TRANSFER DETAILS</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>From account</Text>
                    <AccountOverlay label="From account" value={fromAccId} onChange={setFromAccId} dropKey="from" accounts={accounts} activeDropdown={activeDropdown} openDropdown={openDropdown} closeDropdown={closeDropdown} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>To account</Text>
                    <AccountOverlay label="To account" value={toAccId} onChange={setToAccId} dropKey="to" accounts={accounts} activeDropdown={activeDropdown} openDropdown={openDropdown} closeDropdown={closeDropdown} />
                  </View>
                </View>

                <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2, marginBottom: 8 }}>Amount (₹)</Text>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: INPUT, paddingHorizontal: 16, paddingVertical: 13, fontSize: 20, fontWeight: '700', color: TXT, marginBottom: 18 }} placeholder="0" placeholderTextColor="#4B5563" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

                <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2, marginBottom: 6 }}>Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}
                  style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: INPUT, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                  <CalendarDays size={16} color={date ? ACCENT : SUBTLE} style={{ marginRight: 8 }} />
                  <Text style={{ flex: 1, fontSize: 15, color: date ? TXT2 : SUBTLE }}>
                    {date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select date'}
                  </Text>
                  <ChevronRight size={14} color="#6B7280" />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2 }}>Note </Text>
                  <Text style={{ fontSize: 13, color: SUBTLE }}>Optional</Text>
                </View>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: INPUT, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: TXT, marginBottom: 18 }} placeholder="e.g. Monthly savings transfer" placeholderTextColor="#4B5563" value={desc} onChangeText={setDesc} />

                <TouchableOpacity onPress={() => setRecurring(r => !r)}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: INPUT, borderRadius: 14, padding: 14, marginBottom: 8 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#10B98122', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Repeat2 size={18} color="#10B981" />
                  </View>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: TXT }}>Recurring</Text>
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
                <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2, marginBottom: 8 }}>Amount (₹)</Text>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: INPUT, paddingHorizontal: 16, paddingVertical: 13, fontSize: 20, fontWeight: '700', color: TXT, marginBottom: 18 }} placeholder="0.00" placeholderTextColor="#4B5563" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

                {/* Description */}
                <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2, marginBottom: 8 }}>Description</Text>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: INPUT, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: TXT, marginBottom: 18 }} placeholder="e.g. Grocery shopping" placeholderTextColor="#4B5563" value={desc} onChangeText={setDesc} />

                {/* Category grid */}
                <Text style={{ fontSize: 13, fontWeight: '700', color: SUBTLE, letterSpacing: 1, marginBottom: 12 }}>CATEGORY</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                  {categories.map((c) => {
                    const cfg = getCatIcon(c);
                    const CIcon = cfg.Icon;
                    const isSelected = category === c;
                    return (
                      <TouchableOpacity key={c} onPress={() => setCategory(c)}
                        style={{ width: '22%', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 14, borderWidth: 2, borderColor: isSelected ? typeColor : BORDER, backgroundColor: isSelected ? typeColor + '18' : SURFACE }}>
                        <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
                          <CIcon size={17} color={cfg.color} strokeWidth={1.8} />
                        </View>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: isSelected ? typeColor : '#D1D5DB', textAlign: 'center' }} numberOfLines={2}>{c}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {customCategories.map((c) => {
                    const isSelected = category === c;
                    return (
                      <TouchableOpacity key={c} onPress={() => setCategory(c)}
                        style={{ width: '31%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: isSelected ? typeColor : BORDER, backgroundColor: isSelected ? typeColor + '18' : SURFACE }}>
                        <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Tag size={17} color={isSelected ? typeColor : MUTED} />
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? typeColor : '#D1D5DB', flex: 1 }} numberOfLines={1}>{c}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity onPress={() => { setCustomCatText(''); setShowCustomCat(true); }}
                    style={{ width: '31%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: BORDER, borderStyle: 'dashed' }}>
                    <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={17} color={ACCENT} />
                    </View>
                    <Text style={{ fontSize: 13, color: ACCENT }}>Add new</Text>
                  </TouchableOpacity>
                </View>

                {/* Account dropdown */}
                {accounts.length > 0 && (
                  <>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2, marginBottom: 8 }}>Account</Text>
                    <AccountOverlay label="Select account" value={accountId} onChange={setAccId} dropKey="acct" accounts={accounts} activeDropdown={activeDropdown} openDropdown={openDropdown} closeDropdown={closeDropdown} />
                    <View style={{ marginBottom: 18 }} />
                  </>
                )}

                {/* Date */}
                <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2, marginBottom: 8 }}>Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}
                  style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: INPUT, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 22 }}>
                  <CalendarDays size={16} color={date ? ACCENT : SUBTLE} style={{ marginRight: 8 }} />
                  <Text style={{ flex: 1, fontSize: 15, color: date ? TXT2 : SUBTLE }}>
                    {date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select date'}
                  </Text>
                  <ChevronRight size={14} color="#6B7280" />
                </TouchableOpacity>
              </>
            )}

            {/* Save / Cancel */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              <TouchableOpacity onPress={() => { reset(); onClose(); }} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: BORDER }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: SUBTLE }}>Cancel</Text>
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
      <FinanceDatePicker visible={showDatePicker} value={date} onConfirm={setDate} onClose={() => setShowDatePicker(false)} />
      {/* Add Custom Category Sheet */}
      <Modal visible={showCustomCat} animationType="slide" transparent onRequestClose={() => setShowCustomCat(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={() => setShowCustomCat(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 24, paddingBottom: 36 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: TXT, marginBottom: 16 }}>Add Custom Category</Text>
            <TextInput
              value={customCatText}
              onChangeText={setCustomCatText}
              placeholder="e.g. Hobbies, Pet Care…"
              placeholderTextColor="#4B5563"
              autoFocus
              style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: TXT, marginBottom: 16 }}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowCustomCat(false)}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: BORDER }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: SUBTLE }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const cat = customCatText.trim();
                  if (!cat) return;
                  if (!customCategories.includes(cat)) setCustomCategories(prev => [...prev, cat]);
                  setCategory(cat);
                  setShowCustomCat(false);
                }}
                disabled={!customCatText.trim()}
                style={{ flex: 2, alignItems: 'center', paddingVertical: 13, borderRadius: 12, backgroundColor: ACCENT, opacity: customCatText.trim() ? 1 : 0.4 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>Add Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Modal>
  );
}

// ── Edit Transaction Modal ────────────────────────────────────────────────────

function EditTxModal({ visible, tx, accounts, onClose, onSave }: {
  visible: boolean; tx: Transaction | null; accounts: Account[];
  onClose: () => void; onSave: (id: string, data: Partial<CreateTransactionInput>) => void;
}) {
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  const [amount,         setAmount]         = useState('');
  const [desc,           setDesc]           = useState('');
  const [category,       setCategory]       = useState('');
  const [date,           setDate]           = useState('');
  const [accountId,      setAccId]          = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (tx) {
      setAmount(String(Math.abs(tx.amount)));
      setDesc(tx.description);
      setCategory(tx.category);
      setDate(tx.date);
      setAccId(tx.accountId ?? '');
    }
  }, [tx?.id]);

  if (!tx) return null;

  const isTransfer = tx.type === 'transfer';
  const typeColor  = isTransfer ? '#3B82F6' : tx.type === 'income' ? '#10B981' : '#EF4444';
  const typeLabel  = isTransfer ? 'transfer' : tx.type === 'income' ? 'income' : 'expense';
  const categories = tx.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const save = () => {
    const amt = parseFloat(amount);
    if (!amt) return;
    onSave(tx.id, {
      amount: tx.type === 'expense' ? -Math.abs(amt) : Math.abs(amt),
      description: desc.trim() || tx.description,
      category,
      date,
      accountId: accountId || undefined,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ backgroundColor: SCREEN_BG, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 16, paddingBottom: 36 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: TXT }}>
                  Edit {typeLabel}
                </Text>
                <Text style={{ fontSize: 13, color: SUBTLE, marginTop: 3 }}>{isTransfer ? 'Transfer between accounts' : tx.type === 'income' ? 'Update income record' : 'Update payment record'}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 540 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}>

              {/* Amount */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: SUBTLE, letterSpacing: 1, marginBottom: 8 }}>AMOUNT (₹)</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: INPUT, paddingHorizontal: 16, paddingVertical: 13, fontSize: 22, fontWeight: '700', color: TXT, marginBottom: 18 }}
                placeholder="0.00" placeholderTextColor="#4B5563"
                value={amount} onChangeText={setAmount} keyboardType="decimal-pad"
              />

              {/* Description */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: SUBTLE, letterSpacing: 1, marginBottom: 8 }}>DESCRIPTION</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: INPUT, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: TXT, marginBottom: 18 }}
                placeholder="e.g. Grocery shopping" placeholderTextColor="#4B5563"
                value={desc} onChangeText={setDesc}
              />

              {/* Category grid */}
              {!isTransfer && (
                <>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: SUBTLE, letterSpacing: 1, marginBottom: 12 }}>CATEGORY</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                    {categories.map((c) => {
                      const cfg = getCatIcon(c);
                      const CIcon = cfg.Icon;
                      const isSelected = category === c;
                      return (
                        <TouchableOpacity key={c} onPress={() => setCategory(c)}
                          style={{ width: '31%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: isSelected ? typeColor : BORDER, backgroundColor: isSelected ? typeColor + '18' : SURFACE }}>
                          <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CIcon size={17} color={cfg.color} strokeWidth={1.8} />
                          </View>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? typeColor : '#D1D5DB', flex: 1 }} numberOfLines={1}>{c}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Account chips */}
              {accounts.length > 0 && (
                <>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: SUBTLE, letterSpacing: 1, marginBottom: 8 }}>ACCOUNT</Text>
                  <SimpleAccountDropdown value={accountId} onChange={setAccId} accounts={accounts} />
                </>
              )}

              {/* Date */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: SUBTLE, letterSpacing: 1, marginBottom: 8 }}>DATE</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}
                style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: INPUT, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 22 }}>
                <CalendarDays size={16} color={date ? ACCENT : SUBTLE} style={{ marginRight: 8 }} />
                <Text style={{ flex: 1, fontSize: 15, color: date ? TXT2 : SUBTLE }}>
                  {date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select date'}
                </Text>
                <ChevronRight size={14} color="#6B7280" />
              </TouchableOpacity>

              {/* Buttons */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                <TouchableOpacity onPress={onClose}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 15, borderRadius: 14, borderWidth: 1, borderColor: BORDER }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: SUBTLE }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={save}
                  style={{ flex: 2, alignItems: 'center', paddingVertical: 15, borderRadius: 14, backgroundColor: typeColor, opacity: amount ? 1 : 0.4 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>
                    Update {typeLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
      <FinanceDatePicker visible={showDatePicker} value={date} onConfirm={setDate} onClose={() => setShowDatePicker(false)} />
    </Modal>
  );
}

// ── Edit Account Modal ────────────────────────────────────────────────────────

function EditAccountModal({ visible, account, onClose, onSave }: {
  visible: boolean; account: Account | null;
  onClose: () => void; onSave: (id: string, data: { balance: number; name?: string; creditLimit?: number }) => void;
}) {
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  const [balance,     setBalance]     = useState('');
  const [name,        setName]        = useState('');
  const [creditLimit, setCreditLimit] = useState('');

  useEffect(() => {
    if (account) {
      setBalance(String(account.balance));
      setName(account.name);
      setCreditLimit(account.creditLimit ? String(account.creditLimit) : '');
    }
  }, [account?.id]);

  if (!account) return null;

  const isCreditCard = account.type === 'Credit Card';
  const color = ACCOUNT_COLORS[account.type] ?? '#64748B';
  const Icon  = ACCOUNT_ICONS[account.type] ?? Wallet;

  const handleSave = () => {
    const b = parseFloat(balance);
    if (isNaN(b)) return;
    const data: { balance: number; name?: string; creditLimit?: number } = { balance: b };
    if (name.trim() && name.trim() !== account.name) data.name = name.trim();
    if (isCreditCard) {
      const cl = parseFloat(creditLimit);
      if (!isNaN(cl) && cl > 0) data.creditLimit = cl;
    }
    onSave(account.id, data);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ backgroundColor: SCREEN_BG, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 16, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={color} />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: TXT }}>Edit Account</Text>
                  <Text style={{ fontSize: 13, color: SUBTLE, marginTop: 2 }}>{account.type}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                <X size={20} color={MUTED} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
              <Text style={{ fontSize: 13, fontWeight: '600', color: SUBTLE, letterSpacing: 0.5, marginBottom: 6 }}>ACCOUNT NAME</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: INPUT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: TXT, marginBottom: 16 }}
                value={name} onChangeText={setName} placeholder="Account name"
                placeholderTextColor={MUTED}
              />
              <Text style={{ fontSize: 13, fontWeight: '600', color: SUBTLE, letterSpacing: 0.5, marginBottom: 6 }}>
                {isCreditCard ? 'OUTSTANDING BALANCE (₹)' : 'BALANCE (₹)'}
              </Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: INPUT, paddingHorizontal: 16, paddingVertical: 13, fontSize: 22, fontWeight: '700', color: TXT, marginBottom: 16 }}
                value={balance} onChangeText={setBalance} keyboardType="numbers-and-punctuation" autoFocus
              />
              {isCreditCard && (
                <>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: SUBTLE, letterSpacing: 0.5, marginBottom: 6 }}>CREDIT LIMIT (₹)</Text>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: INPUT, paddingHorizontal: 16, paddingVertical: 13, fontSize: 18, fontWeight: '700', color: TXT, marginBottom: 16 }}
                    value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric"
                    placeholder="e.g. 100000" placeholderTextColor={MUTED}
                  />
                </>
              )}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: BORDER }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: SUBTLE }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave}
                  style={{ flex: 2, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: ACCENT }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ── Add / Edit Budget Modal ────────────────────────────────────────────────────

function BudgetModal({ visible, initial, onClose, onSave }: {
  visible: boolean;
  initial?: Budget | null;
  onClose: () => void;
  onSave: (data: CreateBudgetInput) => void;
}) {
  const T = useTheme();
  const C = { TXT: T.text, SURFACE: T.cardBg, BORDER: T.border, MUTED: T.subText, INPUT: T.inputBg, MODAL: T.modalBg, SUBTLE: T.mutedText };
  const [name, setName]     = useState('');
  const [amount, setAmount] = useState('');
  const [cats, setCats]     = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setAmount(initial ? String(initial.budget) : '');
    setCats(initial?.category ?? '');
  }, [visible, initial?.id]);

  const canSave = !!name.trim() && Number(amount) > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
        <View style={{ backgroundColor: C.MODAL, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.BORDER, alignSelf: 'center', marginBottom: 20 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: C.TXT, marginBottom: 20 }}>
            {initial ? 'Edit Budget' : 'Add Budget'}
          </Text>
          <Text style={{ fontSize: 13, color: C.MUTED, marginBottom: 6 }}>Budget name</Text>
          <TextInput
            value={name} onChangeText={setName} placeholder="e.g. Groceries"
            placeholderTextColor={C.SUBTLE}
            style={{ borderWidth: 1, borderColor: C.BORDER, borderRadius: 12, backgroundColor: C.INPUT, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.TXT, marginBottom: 14 }}
          />
          <Text style={{ fontSize: 13, color: C.MUTED, marginBottom: 6 }}>Monthly limit (₹)</Text>
          <TextInput
            value={amount} onChangeText={setAmount} placeholder="e.g. 10000"
            placeholderTextColor={C.SUBTLE} keyboardType="decimal-pad"
            style={{ borderWidth: 1, borderColor: C.BORDER, borderRadius: 12, backgroundColor: C.INPUT, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.TXT, marginBottom: 14 }}
          />
          <Text style={{ fontSize: 13, color: C.MUTED, marginBottom: 6 }}>Categories (comma-separated, optional)</Text>
          <TextInput
            value={cats} onChangeText={setCats} placeholder="e.g. Groceries, Food"
            placeholderTextColor={C.SUBTLE}
            style={{ borderWidth: 1, borderColor: C.BORDER, borderRadius: 12, backgroundColor: C.INPUT, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.TXT, marginBottom: 20 }}
          />
          <TouchableOpacity onPress={() => { if (canSave) { onSave({ name: name.trim(), budget: Number(amount), category: cats.trim() }); onClose(); } }}
            style={{ backgroundColor: canSave ? '#10B981' : '#6B7280', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>{initial ? 'Update' : 'Save'}</Text>
          </TouchableOpacity>
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
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  const isEdit = !!initial;
  const [name,     setName]     = useState('');
  const [category, setCategory] = useState(ASSET_CATEGORY_LIST[0]);
  const [invested, setInvested] = useState('');
  const [units,    setUnits]    = useState('');
  const [perUnit,  setPerUnit]  = useState('');
  const [value,    setValue]    = useState('');
  const [accountId,setAccId]    = useState('');
  const [invType,  setInvType]  = useState<'lump_sum' | 'sip'>('lump_sum');
  // SIP-specific fields
  type SipFreq    = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  type SipEndType = 'forever' | 'after' | 'on_date';
  const [sipFreq,         setSipFreq]         = useState<SipFreq>('monthly');
  const [sipStart,        setSipStart]        = useState(() => new Date().toLocaleDateString('en-CA'));
  const [sipEndType,      setSipEndType]      = useState<SipEndType>('forever');
  const [sipEndAfter,     setSipEndAfter]     = useState('');
  const [sipEndDate,      setSipEndDate]      = useState('');
  const [sipAmount,       setSipAmount]       = useState('');
  const [showSipStart,    setShowSipStart]    = useState(false);
  const [showSipEndDate,  setShowSipEndDate]  = useState(false);

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
      if (initial.sipConfig) {
        setSipFreq(initial.sipConfig.frequency as SipFreq);
        setSipStart(initial.sipConfig.startDate);
        setSipEndType(initial.sipConfig.endType as SipEndType);
        setSipEndAfter(initial.sipConfig.endAfterTimes != null ? String(initial.sipConfig.endAfterTimes) : '');
        setSipEndDate(initial.sipConfig.endDate ?? '');
        setSipAmount(initial.sipConfig.amount != null ? String(initial.sipConfig.amount) : '');
      } else {
        setSipFreq('monthly'); setSipStart(new Date().toLocaleDateString('en-CA'));
        setSipEndType('forever'); setSipEndAfter(''); setSipEndDate(''); setSipAmount('');
      }
    } else {
      setName(''); setCategory(ASSET_CATEGORY_LIST[0]); setInvested('');
      setValue(''); setUnits(''); setPerUnit(''); setAccId(''); setInvType('lump_sum');
      setSipFreq('monthly'); setSipStart(new Date().toLocaleDateString('en-CA'));
      setSipEndType('forever'); setSipEndAfter(''); setSipEndDate(''); setSipAmount('');
    }
  }, [visible, initial?.id]);  // re-run when modal opens or edit target changes

  const canSave = !!name.trim() && (invType === 'sip' ? Number(sipAmount) > 0 : Number(invested) > 0);

  const handleSave = () => {
    if (!canSave) return;
    const numUnits   = Number(units) > 0 ? Number(units) : undefined;
    const numPerUnit = Number(perUnit) > 0 ? Number(perUnit) : undefined;
    const computedValue = numUnits && numPerUnit
      ? numUnits * numPerUnit
      : Number(value) > 0 ? Number(value) : Number(invested);
    const sipCfg = invType === 'sip' ? {
      frequency: sipFreq,
      startDate: sipStart,
      endType: sipEndType,
      endAfterTimes: sipEndType === 'after' && sipEndAfter ? Number(sipEndAfter) : undefined,
      endDate: sipEndType === 'on_date' && sipEndDate ? sipEndDate : undefined,
      amount: Number(sipAmount) > 0 ? Number(sipAmount) : undefined,
    } : null;
    onSave({
      name: name.trim(),
      category,
      invested: Number(invested),
      value: computedValue,
      units: numUnits ?? null,
      accountId: accountId || undefined,
      investmentType: invType,
      ...(sipCfg ? { sipConfig: sipCfg } : {}),
    } as any);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}>
          <View style={{ width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: TXT, marginBottom: 16 }}>
            {isEdit ? 'Edit Asset' : 'Add Asset'}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
            {/* Category */}
            <Text style={{ fontSize: 14, color: MUTED, marginBottom: 8 }}>Asset Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {ASSET_CATEGORY_LIST.map((cat) => {
                  const c = catColor(cat);
                  const isActive = category === cat;
                  return (
                    <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: isActive ? c : BORDER, backgroundColor: isActive ? c + '20' : SURFACE_ALT }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: isActive ? c : MUTED }}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Name */}
            <Text style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>Asset Name</Text>
            <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT, marginBottom: 16 }} placeholder="e.g. Reliance Industries" value={name} onChangeText={setName} />

            {/* Invested */}
            <Text style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>Amount Invested (₹) *</Text>
            <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT, marginBottom: 16 }} placeholder="0" value={invested} onChangeText={setInvested} keyboardType="decimal-pad" />

            {/* Units + Per Unit */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>Units (optional)</Text>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT }} placeholder="e.g. 50" value={units} onChangeText={(v) => {
                  setUnits(v);
                  if (Number(v) > 0 && Number(perUnit) > 0) setValue(String(Number(v) * Number(perUnit)));
                }} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>Per Unit ₹ (optional)</Text>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT }} placeholder="e.g. 2500" value={perUnit} onChangeText={(v) => {
                  setPerUnit(v);
                  if (Number(units) > 0 && Number(v) > 0) setValue(String(Number(units) * Number(v)));
                }} keyboardType="decimal-pad" />
              </View>
            </View>

            {/* Current Value */}
            <Text style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>Current Value ₹ (optional)</Text>
            <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT, marginBottom: 16 }} placeholder="Auto-computed from units × per unit" value={value} onChangeText={setValue} keyboardType="decimal-pad" />

            {/* Investment Type */}
            <Text style={{ fontSize: 14, color: MUTED, marginBottom: 8 }}>Investment Type</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {(['lump_sum', 'sip'] as const).map((t) => (
                <TouchableOpacity key={t} onPress={() => setInvType(t)}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: invType === t ? ACCENT : BORDER, backgroundColor: invType === t ? '#10B98122' : SURFACE_ALT }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: invType === t ? ACCENT : SUBTLE }}>{t === 'lump_sum' ? 'Lump Sum' : 'SIP'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* SIP Schedule (shown only when SIP selected) */}
            {invType === 'sip' && (
              <View style={{ backgroundColor: '#10B98112', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#10B98133' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: ACCENT, letterSpacing: 1, marginBottom: 14 }}>SIP SCHEDULE</Text>

                {/* SIP Amount */}
                <Text style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>SIP Amount per installment (₹)</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT, marginBottom: 14 }}
                  placeholder="e.g. 5000"
                  placeholderTextColor={SUBTLE}
                  value={sipAmount}
                  onChangeText={setSipAmount}
                  keyboardType="decimal-pad"
                />

                {/* Frequency */}
                <Text style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>Frequency</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {([['daily','Daily'],['weekly','Weekly'],['monthly','Monthly'],['yearly','Yearly'],['custom','Custom']] as const).map(([v, l]) => (
                    <TouchableOpacity key={v} onPress={() => setSipFreq(v as any)}
                      style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: sipFreq === v ? ACCENT : SURFACE_ALT, borderWidth: 1, borderColor: sipFreq === v ? ACCENT : BORDER }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: sipFreq === v ? 'white' : MUTED }}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Start Date */}
                <Text style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>Start Date</Text>
                <TouchableOpacity onPress={() => setShowSipStart(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 14 }}>
                  <CalendarDays size={15} color={ACCENT} />
                  <Text style={{ flex: 1, fontSize: 14, color: TXT2, marginLeft: 8 }}>
                    {sipStart ? new Date(sipStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select start date'}
                  </Text>
                  <ChevronRight size={14} color="#6B7280" />
                </TouchableOpacity>

                {/* Duration / End */}
                <Text style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>Duration</Text>
                <View style={{ gap: 8 }}>
                  {/* Forever */}
                  <TouchableOpacity onPress={() => setSipEndType('forever')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: sipEndType === 'forever' ? ACCENT : BORDER, borderRadius: 12, backgroundColor: sipEndType === 'forever' ? '#10B98115' : SURFACE_ALT, paddingHorizontal: 14, paddingVertical: 11 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: sipEndType === 'forever' ? ACCENT : SUBTLE, alignItems: 'center', justifyContent: 'center' }}>
                      {sipEndType === 'forever' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT }} />}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: sipEndType === 'forever' ? TXT2 : MUTED }}>Forever</Text>
                  </TouchableOpacity>
                  {/* After N times */}
                  <TouchableOpacity onPress={() => setSipEndType('after')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: sipEndType === 'after' ? ACCENT : BORDER, borderRadius: 12, backgroundColor: sipEndType === 'after' ? '#10B98115' : SURFACE_ALT, paddingHorizontal: 14, paddingVertical: 11 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: sipEndType === 'after' ? ACCENT : SUBTLE, alignItems: 'center', justifyContent: 'center' }}>
                      {sipEndType === 'after' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT }} />}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: sipEndType === 'after' ? TXT2 : MUTED, marginRight: 8 }}>After</Text>
                    <TextInput
                      value={sipEndAfter}
                      onChangeText={v => { setSipEndAfter(v); setSipEndType('after'); }}
                      keyboardType="number-pad"
                      placeholder="12"
                      placeholderTextColor="#4B5563"
                      style={{ width: 50, borderWidth: 1, borderColor: BORDER, borderRadius: 8, backgroundColor: SURFACE, paddingHorizontal: 8, paddingVertical: 5, fontSize: 14, color: TXT, textAlign: 'center' }}
                    />
                    <Text style={{ fontSize: 14, color: MUTED }}>times</Text>
                  </TouchableOpacity>
                  {/* On date */}
                  <TouchableOpacity onPress={() => setSipEndType('on_date')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: sipEndType === 'on_date' ? ACCENT : BORDER, borderRadius: 12, backgroundColor: sipEndType === 'on_date' ? '#10B98115' : SURFACE_ALT, paddingHorizontal: 14, paddingVertical: 11 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: sipEndType === 'on_date' ? ACCENT : SUBTLE, alignItems: 'center', justifyContent: 'center' }}>
                      {sipEndType === 'on_date' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT }} />}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: sipEndType === 'on_date' ? TXT2 : MUTED, marginRight: 8 }}>On date</Text>
                    {sipEndType === 'on_date' && (
                      <TouchableOpacity onPress={() => setShowSipEndDate(true)}
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 8, backgroundColor: SURFACE, paddingHorizontal: 10, paddingVertical: 5 }}>
                        <Text style={{ flex: 1, fontSize: 13, color: sipEndDate ? TXT2 : '#4B5563' }}>
                          {sipEndDate ? new Date(sipEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pick date'}
                        </Text>
                        <CalendarDays size={13} color={ACCENT} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Account */}
            {accounts.length > 0 && (
              <>
                <Text style={{ fontSize: 14, color: MUTED, marginBottom: 6 }}>Fund from Account</Text>
                <SimpleAccountDropdown value={accountId} onChange={setAccId} accounts={accounts} placeholder="Select account (optional)" />
                <View style={{ marginBottom: 4 }} />
              </>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: MUTED }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={!canSave}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: canSave ? 1 : 0.5 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>{isEdit ? 'Update' : 'Save Asset'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <FinanceDatePicker visible={showSipStart} value={sipStart} onConfirm={setSipStart} onClose={() => setShowSipStart(false)} />
      <FinanceDatePicker visible={showSipEndDate} value={sipEndDate} onConfirm={setSipEndDate} onClose={() => setShowSipEndDate(false)} />
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
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  const isEdit = !!initial;
  const [name,           setName]           = useState('');
  const [lender,         setLender]         = useState('');
  const [borrowed,       setBorrowed]       = useState('');
  const [outstanding,    setOutstanding]    = useState('');
  const [totalRepaid,    setTotalRepaid]    = useState('0');
  const [emi,            setEmi]            = useState('');
  const [emisLeft,       setEmisLeft]       = useState('');
  const [nextDue,        setNextDue]        = useState('');
  const [repAccId,       setRepAccId]       = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

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
        <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}>
          <View style={{ width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: TXT, marginBottom: 16 }}>
            {isEdit ? 'Edit Liability' : 'Add Liability'}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
            <Text style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>Loan Name *</Text>
            <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT, marginBottom: 12 }} placeholder="Home Loan" value={name} onChangeText={setName} />

            <Text style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>Lender / Bank</Text>
            <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT, marginBottom: 12 }} placeholder="SBI Bank" value={lender} onChangeText={setLender} />

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>Total Borrowed (₹) *</Text>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT }} placeholder="2500000" value={borrowed} onChangeText={setBorrowed} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>Outstanding (₹) *</Text>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT }} placeholder="210000" value={outstanding} onChangeText={setOutstanding} keyboardType="decimal-pad" />
              </View>
            </View>

            <Text style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>Total Repaid (₹)</Text>
            <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT, marginBottom: 12 }} placeholder="0" value={totalRepaid} onChangeText={setTotalRepaid} keyboardType="decimal-pad" />

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>Monthly EMI (₹) *</Text>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT }} placeholder="18500" value={emi} onChangeText={setEmi} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>EMIs Left</Text>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT }} placeholder="12" value={emisLeft} onChangeText={setEmisLeft} keyboardType="number-pad" />
              </View>
            </View>

            <Text style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>Next Due Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}
              style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <CalendarDays size={15} color={nextDue ? ACCENT : SUBTLE} style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, fontSize: 14, color: nextDue ? TXT2 : SUBTLE }}>
                {nextDue ? new Date(nextDue).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select due date'}
              </Text>
              <ChevronRight size={14} color="#6B7280" />
            </TouchableOpacity>

            {accounts.length > 0 && (
              <>
                <Text style={{ fontSize: 14, color: MUTED, marginBottom: 6 }}>Repayment Account</Text>
                <SimpleAccountDropdown value={repAccId} onChange={setRepAccId} accounts={accounts} placeholder="Select account (optional)" />
              </>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: MUTED }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={!canSave}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: canSave ? 1 : 0.5 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>{isEdit ? 'Update' : 'Save Loan'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <FinanceDatePicker visible={showDatePicker} value={nextDue} onConfirm={setNextDue} onClose={() => setShowDatePicker(false)} />
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
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
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
        <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}>
          <View style={{ width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: TXT }}>Record Payment</Text>
          <Text style={{ fontSize: 14, color: MUTED, marginBottom: 20 }}>{liability.name}{liability.lender ? ` · ${liability.lender}` : ''}</Text>

          <Text style={{ fontSize: 14, color: MUTED, marginBottom: 4 }}>Payment Amount (₹)</Text>
          <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT, marginBottom: 10 }} placeholder="0" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" autoFocus />

          {/* Quick-fill buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <TouchableOpacity onPress={() => setAmount(String(suggested))}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: BORDER, borderWidth: 1, borderColor: BORDER }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: TXT2 }}>EMI {formatINR(suggested)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAmount(String(max))}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: BORDER, borderWidth: 1, borderColor: BORDER }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: TXT2 }}>Full {formatINR(max)}</Text>
            </TouchableOpacity>
          </View>

          {/* Debit account */}
          {accounts.length > 0 && (
            <>
              <Text style={{ fontSize: 14, color: MUTED, marginBottom: 8 }}>Debit from Account</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => setRepAccId('')}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: !repAccId ? ACCENT : BORDER, backgroundColor: !repAccId ? '#10B98122' : SURFACE_ALT }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: !repAccId ? ACCENT : SUBTLE }}>None</Text>
                  </TouchableOpacity>
                  {accounts.map((a) => (
                    <TouchableOpacity key={a.id} onPress={() => setRepAccId(a.id)}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: repAccId === a.id ? ACCENT : BORDER, backgroundColor: repAccId === a.id ? '#10B98122' : SURFACE_ALT }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: repAccId === a.id ? ACCENT : SUBTLE }}>{a.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {/* Preview */}
          <View style={{ backgroundColor: SURFACE_ALT, borderRadius: 12, padding: 14, marginBottom: 20, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: MUTED }}>Outstanding before</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>{formatINR(max)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: MUTED }}>After payment</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: ACCENT }}>{formatINR(Math.max(0, max - numAmt))}</Text>
            </View>
            {liability.nextDueDate && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: MUTED }}>Next due (after payment)</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: TXT2 }}>{fmtDate(advanceMonth(liability.nextDueDate))}</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: MUTED }}>Cancel</Text>
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

const FINANCE_SYSTEM_CATS = ['Opening Balance', 'Balance Adjustment', 'Adjustment', 'Credit Card Payment', 'Transfer', 'opening_balance', 'adjustment'];

function getHealthScore(txs: Transaction[], totalAssets: number, totalLiab: number) {
  const now = new Date();
  const thisMo = txs.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      && !FINANCE_SYSTEM_CATS.includes(t.category) && t.type !== 'opening_balance' && t.type !== 'adjustment' && t.type !== 'transfer';
  });
  const inc  = thisMo.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp  = thisMo.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const rate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;

  const savingsScore  = Math.max(0, Math.min(25, Math.round(rate * 0.8)));
  const debtScore     = totalAssets === 0 ? 0 : totalLiab < totalAssets * 0.3 ? 25 : totalLiab < totalAssets * 0.5 ? 18 : 10;
  const realTxCount   = txs.filter(t => t.type !== 'opening_balance' && t.type !== 'adjustment').length;
  const conScore      = realTxCount > 5 ? 25 : Math.round(realTxCount * 5);
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
  const isSystemTx = (t: Transaction) => FINANCE_SYSTEM_CATS.includes(t.category) || t.type === 'opening_balance' || t.type === 'adjustment' || t.type === 'transfer';
  const thisMo = txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && !isSystemTx(t); });
  const lastMo = txs.filter(t => {
    const d = new Date(t.date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear() && !isSystemTx(t);
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
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  const [settingsTab, setSettingsTab] = useState<'preferences' | 'categories' | 'data'>('preferences');
  const [currency, setCurrency]       = useState('INR');
  const [numFormat, setNumFormat]     = useState('indian');
  const [defaultView, setDefaultView] = useState('Overview');
  const [excluded, setExcluded]       = useState<string[]>([]);
  const [catType, setCatType]         = useState<'expense' | 'income'>('expense');
  const [newCatName, setNewCatName]   = useState('');
  const [newCatIcon, setNewCatIcon]   = useState('Tag');
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
    setNewCatIcon('Tag');
  };

  const expCats  = [...BUILT_IN_EXPENSE_CATS, ...customExpCats];
  const incCats  = [...BUILT_IN_INCOME_CATS,  ...customIncCats];
  const showCats = catType === 'expense' ? expCats : incCats;

  const CAT_QUICK_ICONS: { name: string; Icon: React.ComponentType<{ size: number; color: string }> }[] = [
    { name: 'Tag',          Icon: Tag          },
    { name: 'Home',         Icon: Home         },
    { name: 'ShoppingCart', Icon: ShoppingCart },
    { name: 'Utensils',     Icon: Utensils     },
    { name: 'Bus',          Icon: Bus          },
    { name: 'Zap',          Icon: Zap          },
    { name: 'Stethoscope',  Icon: Stethoscope  },
    { name: 'Gift',         Icon: Gift         },
    { name: 'Banknote',     Icon: Banknote     },
    { name: 'TrendingUp',   Icon: TrendingUp   },
    { name: 'Film',         Icon: Film         },
    { name: 'Plane',        Icon: Plane        },
    { name: 'Smartphone',   Icon: Smartphone   },
    { name: 'Wifi',         Icon: Wifi         },
    { name: 'CreditCard',   Icon: CreditCard   },
    { name: 'ShoppingBag',  Icon: ShoppingBag  },
    { name: 'Heart',        Icon: Heart        },
    { name: 'GraduationCap', Icon: GraduationCap },
    { name: 'Building2',    Icon: Building2    },
    { name: 'DollarSign',   Icon: DollarSign   },
    { name: 'Star',         Icon: Star         },
    { name: 'RotateCcw',    Icon: RotateCcw    },
    { name: 'Fuel',         Icon: Fuel         },
    { name: 'Coffee',       Icon: Coffee       },
    { name: 'Briefcase',    Icon: Briefcase    },
    { name: 'Package',      Icon: Package      },
    { name: 'Receipt',      Icon: Receipt      },
    { name: 'PiggyBank',    Icon: PiggyBank    },
  ];
  const CAT_ICON_MAP = Object.fromEntries(CAT_QUICK_ICONS.map(i => [i.name, i.Icon]));
  function getCatQuickIcon(name: string): React.ComponentType<{ size: number; color: string }> { return CAT_ICON_MAP[name] ?? Tag; }

  return (
    <View style={{ flex: 1 }}>
      {/* Settings sub-tabs */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 4, backgroundColor: SURFACE, borderRadius: 12, padding: 4 }}>
        {(['preferences', 'categories', 'data'] as const).map((t) => (
          <TouchableOpacity key={t} onPress={() => setSettingsTab(t)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9, backgroundColor: settingsTab === t ? ACCENT : 'transparent' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: settingsTab === t ? 'white' : SUBTLE, textTransform: 'capitalize' }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* ── PREFERENCES ── */}
        {settingsTab === 'preferences' && (
          <>
            {/* Currency */}
            <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: TXT, marginBottom: 4 }}>Currency</Text>
              <Text style={{ fontSize: 13, color: SUBTLE, marginBottom: 14 }}>Choose your default display currency</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {CURRENCIES.map((c) => (
                  <TouchableOpacity key={c.code} onPress={() => setCurrency(c.code)}
                    style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: currency === c.code ? ACCENT : BORDER, backgroundColor: currency === c.code ? '#10B98118' : SURFACE_ALT, alignItems: 'center', minWidth: 80 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: currency === c.code ? ACCENT : MUTED }}>{c.symbol}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: currency === c.code ? ACCENT : SUBTLE, marginTop: 2 }}>{c.code}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Number Format */}
            <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: TXT, marginBottom: 4 }}>Number Format</Text>
              <Text style={{ fontSize: 13, color: SUBTLE, marginBottom: 14 }}>How amounts are displayed</Text>
              {NUMBER_FORMATS.map((f) => (
                <TouchableOpacity key={f.id} onPress={() => setNumFormat(f.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER, gap: 12 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: numFormat === f.id ? ACCENT : '#4B5563', alignItems: 'center', justifyContent: 'center' }}>
                    {numFormat === f.id && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT }} />}
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, color: TXT2 }}>{f.example}</Text>
                  <Text style={{ fontSize: 13, color: SUBTLE }}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Default View */}
            <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: TXT, marginBottom: 4 }}>Default View</Text>
              <Text style={{ fontSize: 13, color: SUBTLE, marginBottom: 14 }}>Which page opens when you visit Finance</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DEFAULT_VIEWS.map((v) => (
                  <TouchableOpacity key={v} onPress={() => setDefaultView(v)}
                    style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: defaultView === v ? ACCENT : BORDER, backgroundColor: defaultView === v ? '#10B98122' : SURFACE_ALT }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: defaultView === v ? ACCENT : SUBTLE }}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Expense Tracking Exclusions */}
            <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: TXT, marginBottom: 4 }}>Expense Tracking</Text>
              <Text style={{ fontSize: 13, color: SUBTLE, marginBottom: 14 }}>Check a category to exempt it from expense totals and vitals (e.g. Investment, SIP)</Text>
              <View style={{ gap: 2 }}>
                {EXPENSE_EXCLUDE_CATS.map((cat) => (
                  <TouchableOpacity key={cat} onPress={() => toggleExclude(cat)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222', gap: 12 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: excluded.includes(cat) ? ACCENT : '#4B5563', backgroundColor: excluded.includes(cat) ? ACCENT : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {excluded.includes(cat) && <Text style={{ fontSize: 12, color: 'white', fontWeight: '700' }}>✓</Text>}
                    </View>
                    {(() => { const cfg = getCatIcon(cat); const CIcon = cfg.Icon; return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center' }}><CIcon size={14} color={cfg.color} /></View><Text style={{ fontSize: 14, color: TXT2 }}>{cat}</Text></View>; })()}
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
            <View style={{ flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 12, padding: 4, marginBottom: 16 }}>
              {(['expense', 'income'] as const).map((t) => (
                <TouchableOpacity key={t} onPress={() => setCatType(t)}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9, backgroundColor: catType === t ? (t === 'expense' ? '#EF4444' : ACCENT) : 'transparent' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: catType === t ? 'white' : SUBTLE, textTransform: 'capitalize' }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Add New Category */}
            <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: TXT, marginBottom: 12 }}>ADD NEW CATEGORY</Text>
              {/* Icon picker */}
              <ScrollView style={{ maxHeight: 136, marginBottom: 12 }} showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {CAT_QUICK_ICONS.map(({ name, Icon: CIC }) => (
                    <TouchableOpacity key={name} onPress={() => setNewCatIcon(name)}
                      style={{ width: 40, height: 40, borderRadius: 10, borderWidth: 2, borderColor: newCatIcon === name ? ACCENT : BORDER, backgroundColor: newCatIcon === name ? '#10B98118' : SURFACE_ALT, alignItems: 'center', justifyContent: 'center' }}>
                      <CIC size={18} color={newCatIcon === name ? ACCENT : MUTED} />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: SURFACE_ALT, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER }}>
                  {(() => { const CIC = getCatQuickIcon(newCatIcon); return <CIC size={22} color={ACCENT} />; })()}
                </View>
                <TextInput
                  style={{ flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE_ALT, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: TXT }}
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
            <View style={{ backgroundColor: SURFACE, borderRadius: 16, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: TXT, textTransform: 'uppercase', letterSpacing: 0.5 }}>{catType.toUpperCase()} CATEGORIES</Text>
                <Text style={{ fontSize: 13, color: SUBTLE }}>{showCats.length} total</Text>
              </View>
              {showCats.map((cat, i) => {
                const catCfg = getCatIcon(cat.name);
                const CatIC = catCfg.Icon;
                return (
                <View key={cat.name} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: i < showCats.length - 1 ? 1 : 0, borderBottomColor: BORDER, gap: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: catCfg.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <CatIC size={18} color={catCfg.color} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, color: TXT2, fontWeight: '500' }}>{cat.name}</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: BORDER }}>
                    <Text style={{ fontSize: 11, color: SUBTLE }}>{i < (catType === 'expense' ? BUILT_IN_EXPENSE_CATS.length : BUILT_IN_INCOME_CATS.length) ? 'built-in' : 'custom'}</Text>
                  </View>
                </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── DATA ── */}
        {settingsTab === 'data' && (
          <>
            {/* Import */}
            <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 18, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: TXT, marginBottom: 8 }}>Import Data</Text>
              <Text style={{ fontSize: 14, color: MUTED, lineHeight: 22, marginBottom: 16 }}>
                Import assets and transactions from Excel or CSV files. Supports Zerodha/Groww stock holdings, mutual fund statements, HDFC/SBI/ICICI credit card statements, and custom spreadsheets.
              </Text>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: ACCENT }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: ACCENT }}>⬆ Import from Excel / CSV</Text>
              </TouchableOpacity>
            </View>

            {/* Export */}
            <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 18, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: TXT, marginBottom: 8 }}>Export Data</Text>
              <Text style={{ fontSize: 14, color: MUTED, lineHeight: 22, marginBottom: 16 }}>
                Export all your data (assets, liabilities, snapshots, goals) at any time.{' '}
                <Text style={{ color: TXT, fontWeight: '600' }}>Your data is yours and always will be.</Text>
              </Text>
              <TouchableOpacity style={{ paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: BORDER, alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2 }}>⬇ Export CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingVertical: 13, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>⬇ Export JSON</Text>
              </TouchableOpacity>
              <View style={{ marginTop: 12, gap: 6 }}>
                <Text style={{ fontSize: 13, color: SUBTLE }}>📄 CSV — Transactions only, compatible with Excel/Sheets</Text>
                <Text style={{ fontSize: 13, color: SUBTLE }}>📋 JSON — All data: accounts, assets, liabilities, budgets</Text>
              </View>
            </View>

            {/* Data Summary */}
            <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: TXT, marginBottom: 12 }}>Your Data</Text>
              {[
                { label: 'Transactions', count: transactions.length },
                { label: 'Assets',       count: assets.length },
                { label: 'Liabilities',  count: liabilities.length },
                { label: 'Accounts',     count: accounts.length },
              ].map((d, i) => (
                <View key={d.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: BORDER }}>
                  <Text style={{ fontSize: 15, color: MUTED }}>{d.label}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: TXT }}>{d.count} records</Text>
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
  const { SCREEN_BG, SURFACE, SURFACE_ALT, BORDER, MUTED, SUBTLE, TXT, TXT2, INPUT, MODAL } = useFinanceColors();
  const now = new Date();
  const [year,      setYear]      = useState(now.getFullYear());
  const [month,     setMonth]     = useState(now.getMonth());
  const [activeTab, setActiveTab] = useState<SubTab>('overview');
  const [showMore,  setShowMore]  = useState(false);

  // Modal state
  const [showAddTx,      setShowAddTx]      = useState(false);
  const [editTx,         setEditTx]         = useState<Transaction | null>(null);
  const [showAddAsset,   setShowAddAsset]   = useState(false);
  const [editAsset,      setEditAsset]      = useState<Asset | null>(null);
  const [showAddLiab,    setShowAddLiab]    = useState(false);
  const [editLiability,  setEditLiability]  = useState<Liability | null>(null);
  const [payLiability,   setPayLiability]   = useState<Liability | null>(null);
  const [editAccount,    setEditAccount]    = useState<Account | null>(null);
  const [accountMenu,    setAccountMenu]    = useState<Account | null>(null);
  const [showAddBudget,  setShowAddBudget]  = useState(false);
  const [editBudget,     setEditBudget]     = useState<Budget | null>(null);
  const [budgetSearch,   setBudgetSearch]   = useState('');
  const [txMenu, setTxMenu] = useState<{ tx: Transaction; y: number } | null>(null);

  // Assets category filter + search
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('All');
  const [assetSearch, setAssetSearch] = useState('');

  // Transactions filter + search
  const [txSearch, setTxSearch] = useState('');
  const [txAccountFilter, setTxAccountFilter] = useState('All');
  const [upcomingTxOpen, setUpcomingTxOpen] = useState(true);

  // Liabilities search
  const [liabSearch, setLiabSearch] = useState('');

  const qc = useQueryClient();

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: accounts     = [], refetch: refetchAccounts } = useQuery({ queryKey: ['accounts'],     queryFn: getAccounts });
  const { data: transactions = [], isLoading: txLoading, refetch: refetchTx } = useQuery({ queryKey: ['transactions'], queryFn: () => getTransactions() });
  const { data: assets       = [], isLoading: assetsLoading, refetch: refetchAssets } = useQuery({ queryKey: ['assets'],       queryFn: getAssets });
  const { data: liabilities  = [], isLoading: liabLoading,   refetch: refetchLiab } = useQuery({ queryKey: ['liabilities'],  queryFn: getLiabilities });
  const { data: budgets      = [] } = useQuery({ queryKey: ['budgets'], queryFn: getBudgets });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['accounts'] });
    qc.invalidateQueries({ queryKey: ['transactions'] });
    qc.invalidateQueries({ queryKey: ['assets'] });
    qc.invalidateQueries({ queryKey: ['liabilities'] });
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createTxMut     = useMutation({ mutationFn: createTransaction,  onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); } });
  const updateTxMut     = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionInput> }) => updateTransaction(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); } });
  const deleteTxMut     = useMutation({ mutationFn: deleteTransaction,  onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); } });
  const createAssetMut  = useMutation({ mutationFn: createAsset,        onSuccess: () => invalidateAll() });
  const updateAssetMut  = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<CreateAssetInput> }) => updateAsset(id, data), onSuccess: () => invalidateAll() });
  const deleteAssetMut  = useMutation({ mutationFn: deleteAsset,        onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }) });
  const createLiabMut   = useMutation({ mutationFn: createLiability,    onSuccess: () => qc.invalidateQueries({ queryKey: ['liabilities'] }) });
  const updateLiabMut   = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<CreateLiabilityInput> }) => updateLiability(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['liabilities'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); qc.invalidateQueries({ queryKey: ['transactions'] }); } });
  const deleteLiabMut      = useMutation({ mutationFn: deleteLiability,    onSuccess: () => qc.invalidateQueries({ queryKey: ['liabilities'] }) });
  const updateAccountMut   = useMutation({ mutationFn: ({ id, data }: { id: string; data: { balance?: number; name?: string; creditLimit?: number } }) => updateAccount(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }) });
  const deleteAccountMut   = useMutation({ mutationFn: deleteAccount,      onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }) });
  const createBudgetMut = useMutation({ mutationFn: createBudget, onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }) });
  const updateBudgetMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<CreateBudgetInput> }) => updateBudget(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }) });
  const deleteBudgetMut = useMutation({ mutationFn: deleteBudget, onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }) });

  // ── Vitals profile (persisted in /api/settings) ───────────────────────────
  const [vitalsProfile, setVitalsProfile] = useState({ age: 0, dependents: 0, termCover: 0, healthCover: 0 });
  const [vitalsProfileLoaded, setVitalsProfileLoaded] = useState(false);
  const [vitalsProfileSaving, setVitalsProfileSaving] = useState(false);
  const [vitalsProfileOpen, setVitalsProfileOpen] = useState(true);
  const vitalsProfileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiRequest<{ preferences: { age: number | null; dependents: number | null; termCover: number | null; healthCover: number | null } }>('/api/settings')
      .then(data => {
        const p = data?.preferences ?? {};
        setVitalsProfile({
          age:        typeof p.age        === 'number' ? p.age        : 0,
          dependents: typeof p.dependents === 'number' ? p.dependents : 0,
          termCover:  typeof p.termCover  === 'number' ? p.termCover  : 0,
          healthCover:typeof p.healthCover=== 'number' ? p.healthCover: 0,
        });
        setVitalsProfileLoaded(true);
      })
      .catch(() => setVitalsProfileLoaded(true));
  }, []);

  const updateVitalsProfile = useCallback((key: keyof typeof vitalsProfile, val: number) => {
    setVitalsProfile(prev => {
      const next = { ...prev, [key]: val };
      if (vitalsProfileTimer.current) clearTimeout(vitalsProfileTimer.current);
      vitalsProfileTimer.current = setTimeout(() => {
        setVitalsProfileSaving(true);
        apiRequest('/api/settings', {
          method: 'PATCH',
          body: JSON.stringify({ [key]: val === 0 ? null : val }),
        }).finally(() => setVitalsProfileSaving(false));
      }, 600);
      return next;
    });
  }, []);

  // ── Computed values ────────────────────────────────────────────────────────

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const todayStr = new Date().toLocaleDateString('en-CA');
  const monthTx  = useMemo(() => transactions.filter(t => t.date.startsWith(monthStr)), [transactions, monthStr]);
  const pastMonthTx = useMemo(() => monthTx.filter(t => t.date <= todayStr), [monthTx, todayStr]);
  const SYSTEM_CATS = ['Opening Balance', 'Balance Adjustment', 'Adjustment', 'Credit Card Payment', 'Transfer'];
  const income   = useMemo(() => pastMonthTx.filter(t => t.type === 'income'  && !SYSTEM_CATS.includes(t.category)).reduce((s, t) => s + t.amount, 0), [pastMonthTx]);
  const expense  = useMemo(() => pastMonthTx.filter(t => t.type === 'expense' && !SYSTEM_CATS.includes(t.category)).reduce((s, t) => s + Math.abs(t.amount), 0), [pastMonthTx]);
  const net      = income - expense;

  const filteredMonthTx = useMemo(() => {
    const acctMap = Object.fromEntries(accounts.map(a => [a.id, a.name]));
    let list = monthTx.filter(t => t.type !== 'opening_balance' && t.type !== 'adjustment' && t.date <= todayStr);
    if (txAccountFilter !== 'All') list = list.filter(t => (t.accountId ? acctMap[t.accountId] : null) === txAccountFilter);
    if (txSearch.trim()) {
      const q = txSearch.toLowerCase();
      list = list.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [monthTx, txAccountFilter, txSearch, accounts, todayStr]);

  const upcomingMonthTx = useMemo(() => {
    const acctMap = Object.fromEntries(accounts.map(a => [a.id, a.name]));
    let list = monthTx.filter(t => t.type !== 'opening_balance' && t.type !== 'adjustment' && t.date > todayStr);
    if (txAccountFilter !== 'All') list = list.filter(t => (t.accountId ? acctMap[t.accountId] : null) === txAccountFilter);
    if (txSearch.trim()) {
      const q = txSearch.toLowerCase();
      list = list.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [monthTx, txAccountFilter, txSearch, accounts, todayStr]);

  const totalAssetsValue  = useMemo(() => assets.reduce((s, a) => s + a.value, 0), [assets]);
  const totalInvested     = useMemo(() => assets.reduce((s, a) => s + a.invested, 0), [assets]);
  const totalLiabilities  = useMemo(() => liabilities.reduce((s, l) => s + l.outstanding, 0), [liabilities]);
  const availableBalance  = useMemo(() => accounts.filter(a => a.type !== 'Credit Card').reduce((s, a) => s + a.balance, 0), [accounts]);
  const allAccountsBalance = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);
  const netWorth          = totalAssetsValue + allAccountsBalance - totalLiabilities;

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
    const accId = repayAccountId ?? l.repaymentAccountId;
    if (accId) {
      createTxMut.mutate({
        date: new Date().toLocaleDateString('en-CA'),
        category: 'Loan',
        description: `${l.name} EMI`,
        amount: -Math.abs(amount),
        type: 'expense',
        accountId: accId,
      });
    }
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
  const fabVisible = false;
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
          contentContainerStyle={{ paddingBottom: 92, paddingTop: 12 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetchAccounts(); refetchTx(); refetchAssets(); refetchLiab(); qc.invalidateQueries({ queryKey: ['budgets'] }); }} tintColor={ACCENT} />}
        >

          {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (() => {
            const _ov_now = new Date();
            // System-only exclusions — matches web SavingsRateCard exactly
            const SYSTEM_EXCL = ['Opening Balance', 'Balance Adjustment', 'Adjustment', 'Credit Card Payment', 'Transfer'];
            const thisMoTx = transactions.filter(t => {
              const d = new Date(t.date);
              return d.getMonth() === _ov_now.getMonth() && d.getFullYear() === _ov_now.getFullYear()
                && t.type !== 'adjustment' && t.type !== 'opening_balance' && t.type !== 'transfer';
            });
            // Savings rate — matches web: exclude system cats only
            const thisMonthIncome  = thisMoTx.filter(t => t.type === 'income'  && !SYSTEM_EXCL.includes(t.category)).reduce((s, t) => s + t.amount, 0);
            const thisMonthExpense = thisMoTx.filter(t => t.type === 'expense' && !SYSTEM_EXCL.includes(t.category)).reduce((s, t) => s + Math.abs(t.amount), 0);
            const thisSavings      = Math.max(0, thisMonthIncome - thisMonthExpense);
            const thisSavingsRate  = thisMonthIncome > 0 ? Math.max(0, Math.round(((thisMonthIncome - thisMonthExpense) / thisMonthIncome) * 100)) : 0;

            const healthData = getHealthScore(transactions, totalAssetsValue, totalLiabilities);
            const insights   = getInsights(transactions, totalAssetsValue, totalLiabilities);

            // Spending by Category — ALL-TIME, type===expense, excluding system categories
            const catSpend: Record<string, number> = {};
            transactions.filter(t => t.type === 'expense' && !SYSTEM_EXCL.includes(t.category)).forEach(t => { catSpend[t.category] = (catSpend[t.category] ?? 0) + Math.abs(t.amount); });
            const topCategories = Object.entries(catSpend).sort((a, b) => b[1] - a[1]).slice(0, 5);
            const maxCatSpend   = topCategories[0]?.[1] ?? 1;

            // Top Expenses this month — matches web TopExpenses: current month, system exclusions
            const moSpend: Record<string, number> = {};
            thisMoTx.filter(t => t.type === 'expense' && !SYSTEM_EXCL.includes(t.category)).forEach(t => { moSpend[t.category] = (moSpend[t.category] ?? 0) + Math.abs(t.amount); });
            // Recent Transactions — matches web RecentTransactions: all-time latest 5, all types
            const visibleTx = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
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
                {(() => {
                  // Web formula: totalAssets = invested assets + ALL account balances
                  const totalAssetsDisplay = totalAssetsValue + allAccountsBalance;
                  const total    = totalAssetsDisplay + totalLiabilities;
                  const assetPct = total > 0 ? Math.round((totalAssetsDisplay / total) * 100) : 0;
                  const liabPct  = 100 - assetPct;
                  return (
                <View style={{ marginHorizontal: 16, marginTop: 2, marginBottom: 10, backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: MUTED }}>Net Worth</Text>
                    {total > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B98115', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <TrendingUp size={10} color="#10B981" />
                        <Text style={{ fontSize: 10, fontWeight: '600', color: '#10B981' }}>{assetPct}% in assets</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 32, fontWeight: '800', color: netWorth >= 0 ? TXT : '#EF4444', letterSpacing: -1, lineHeight: 36 }}>
                    {netWorth < 0 ? '−' : ''}{formatINR(Math.abs(netWorth))}
                  </Text>
                  {/* Assets • Liabilities inline — matches web layout */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 13, color: MUTED }}>Assets</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#10B981' }}>{fmtCompact(totalAssetsDisplay)}</Text>
                    <Text style={{ fontSize: 13, color: BORDER }}>•</Text>
                    <Text style={{ fontSize: 13, color: MUTED }}>Liabilities</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>{fmtCompact(totalLiabilities)}</Text>
                  </View>
                  {total > 0 && (
                    <View style={{ marginTop: 10 }}>
                      <View style={{ height: 5, borderRadius: 3, flexDirection: 'row', overflow: 'hidden', backgroundColor: BORDER }}>
                        <View style={{ width: `${assetPct}%` as `${number}%`, backgroundColor: '#10B981' }} />
                        <View style={{ width: `${liabPct}%` as `${number}%`, backgroundColor: '#EF4444' }} />
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={{ fontSize: 11, color: MUTED }}>{assetPct}% assets</Text>
                        <Text style={{ fontSize: 11, color: MUTED }}>{liabPct}% liabilities</Text>
                      </View>
                    </View>
                  )}
                </View>
                  );
                })()}

                {/* ── 3 Metric Cards: Assets, Liabilities, Accounts (matching web) ── */}
                <View style={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Assets',          sub: `${assets.length} assets tracked`,     val: totalAssetsValue,  color: '#10B981', bg: '#10B98122', Icon: Wallet,     tab: 'assets'      as SubTab },
                    { label: 'Liabilities',     sub: `${liabilities.length} active loans`,   val: totalLiabilities, color: '#EF4444', bg: '#EF444422', Icon: CreditCard, tab: 'liabilities' as SubTab },
                    { label: 'Account Balance', sub: 'Bank, wallets & cash',                  val: availableBalance, color: '#10B981', bg: '#10B98122', Icon: Landmark,   tab: 'accounts'    as SubTab },
                  ].map((m) => (
                    <TouchableOpacity key={m.label} onPress={() => setActiveTab(m.tab)}
                      style={{ backgroundColor: SURFACE, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: m.bg }}>
                      <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: m.bg, alignItems: 'center', justifyContent: 'center' }}>
                        <m.Icon size={20} color={m.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, color: MUTED }}>{m.label}</Text>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: m.color }} numberOfLines={1}>{fmtCompact(m.val)}</Text>
                        <Text style={{ fontSize: 12, color: SUBTLE, marginTop: 2 }}>{m.sub}</Text>
                      </View>
                      <ChevronRight size={18} color="#4B5563" />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ── Financial Health Score ── */}
                <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: SURFACE, borderRadius: 20, padding: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <ShieldCheck size={16} color={hColor} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: TXT }}>Financial Health Score</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 8, borderColor: hColor, alignItems: 'center', justifyContent: 'center', backgroundColor: SCREEN_BG }}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: hColor }}>{healthData.score}</Text>
                      <Text style={{ fontSize: 9, color: MUTED }}>/ 100</Text>
                    </View>
                    <View style={{ flex: 1, gap: 7 }}>
                      {healthData.factors.map((f, i) => {
                        const pct = Math.round((f.score / f.max) * 100);
                        const fc  = pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444';
                        return (
                          <View key={i}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                              <Text style={{ fontSize: 14, color: MUTED }}>{f.label}</Text>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: fc }}>{f.score}/{f.max}</Text>
                            </View>
                            <View style={{ height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden' }}>
                              <View style={{ height: 4, width: `${pct}%` as `${number}%`, backgroundColor: fc, borderRadius: 2 }} />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, color: MUTED, marginTop: 12, lineHeight: 18 }}>{healthData.summary}</Text>
                </View>

                {/* ── Smart Insights ── */}
                {insights.length > 0 && (
                  <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: SURFACE, borderRadius: 20, padding: 18 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Lightbulb size={16} color="#F59E0B" />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: TXT }}>Smart Insights</Text>
                    </View>
                    {insights.map((ins, i) => {
                      const ic = ins.type === 'positive' ? '#10B981' : ins.type === 'warning' ? '#F59E0B' : MUTED;
                      const bg = ins.type === 'positive' ? '#10B98115' : ins.type === 'warning' ? '#F59E0B15' : BORDER;
                      return (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: bg, borderRadius: 10, padding: 10, marginBottom: i < insights.length - 1 ? 8 : 0 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ic, marginTop: 5 }} />
                          <Text style={{ flex: 1, fontSize: 14, color: TXT2, lineHeight: 18 }}>{ins.text}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ── Savings Rate ── */}
                <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: SURFACE, borderRadius: 20, padding: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <DollarSign size={16} color="#3B82F6" />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: TXT }}>Savings Rate</Text>
                    </View>
                    <View style={{ backgroundColor: thisSavingsRate >= 20 ? '#10B98122' : '#F59E0B22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: thisSavingsRate >= 20 ? '#10B981' : '#F59E0B' }}>{thisSavingsRate}%</Text>
                    </View>
                  </View>
                  {[
                    { label: 'Income',   val: thisMonthIncome,  color: '#10B981', pct: 100 },
                    { label: 'Expenses', val: thisMonthExpense, color: '#EF4444', pct: thisMonthIncome > 0 ? Math.min(100, Math.round((thisMonthExpense / thisMonthIncome) * 100)) : 0 },
                    { label: 'Savings',  val: thisSavings,      color: '#3B82F6', pct: Math.min(thisSavingsRate, 100) },
                  ].map((s, i) => (
                    <View key={s.label} style={{ marginBottom: i < 2 ? 12 : 0 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ fontSize: 13, color: MUTED }}>{s.label}</Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: s.color }}>{fmtCompact(s.val)}</Text>
                      </View>
                      <View style={{ height: 6, backgroundColor: BORDER, borderRadius: 3, overflow: 'hidden' }}>
                        <View style={{ height: 6, width: `${s.pct}%` as `${number}%`, backgroundColor: s.color, borderRadius: 3 }} />
                      </View>
                    </View>
                  ))}
                  <Text style={{ fontSize: 12, color: MUTED, marginTop: 10 }}>
                    {thisSavingsRate >= 30 ? '🎉 Excellent savings rate!' : thisSavingsRate >= 20 ? '👍 Good savings rate' : '💡 Aim for 20%+ savings'}
                  </Text>
                </View>

                {/* ── Spending by Category (all time) ── */}
                {topCategories.length > 0 && (
                  <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: SURFACE, borderRadius: 20, padding: 18 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <View>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: TXT }}>Spending by Category</Text>
                        <Text style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Top 5 expense categories</Text>
                      </View>
                      <ChartPie size={16} color="#8B5CF6" />
                    </View>
                    {topCategories.map(([cat, amt], i) => {
                      const pct = Math.round((amt / maxCatSpend) * 100);
                      const c   = SPEND_COLORS[i % SPEND_COLORS.length];
                      return (
                        <View key={cat} style={{ marginBottom: i < topCategories.length - 1 ? 12 : 0 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              {(() => { const cfg = getCatIcon(cat); const CIcon = cfg.Icon; return <View style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center' }}><CIcon size={13} color={cfg.color} /></View>; })()}
                              <Text style={{ fontSize: 14, color: TXT2 }}>{cat}</Text>
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: c }}>{fmtCompact(amt)}</Text>
                          </View>
                          <View style={{ height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden' }}>
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
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: TXT }}>Recent Transactions</Text>
                      <Text style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Latest</Text>
                    </View>
                    <TouchableOpacity onPress={() => setActiveTab('transactions')}>
                      <Text style={{ fontSize: 14, color: ACCENT }}>View all →</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ backgroundColor: SURFACE, borderRadius: 16, overflow: 'hidden' }}>
                    {visibleTx.length === 0 ? (
                      <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                        <ArrowLeftRight size={36} color={MUTED} style={{ marginBottom: 8 }} />
                        <Text style={{ fontSize: 14, color: MUTED }}>No transactions yet</Text>
                      </View>
                    ) : (
                      visibleTx.map((tx) => {
                        const ovAcctMap = Object.fromEntries(accounts.map(a => [a.id, a.name]));
                        return <TxItem key={tx.id} tx={tx} accountName={tx.accountId ? ovAcctMap[tx.accountId] : undefined} onMenuOpen={(t, y) => setTxMenu({ tx: t, y })} />;
                      })
                    )}
                  </View>
                </View>

                {/* ── Top Expenses this month ── */}
                {topMonthExp.length > 0 && (
                  <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: SURFACE, borderRadius: 20, padding: 18 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <TrendingDown size={16} color="#EF4444" />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: TXT }}>Top Expenses This Month</Text>
                    </View>
                    {topMonthExp.map(([cat, amt], i) => {
                      const pct = Math.round((amt / maxMoSpend) * 100);
                      const c   = SPEND_COLORS[i % SPEND_COLORS.length];
                      return (
                        <View key={cat} style={{ marginBottom: i < topMonthExp.length - 1 ? 12 : 0 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
                              <Text style={{ fontSize: 14, color: TXT2 }}>{cat}</Text>
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: c }}>{fmtCompact(amt)}</Text>
                          </View>
                          <View style={{ height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ height: 4, width: `${pct}%` as `${number}%`, backgroundColor: c, borderRadius: 2 }} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ── Asset Allocation (Donut ring + legend, matching web layout) ── */}
                {allocSlices.length > 0 && (
                  <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: SURFACE, borderRadius: 20, padding: 18 }}>
                    <View style={{ marginBottom: 14 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: TXT }}>Asset Allocation</Text>
                      <Text style={{ fontSize: 15, color: SUBTLE, marginTop: 2 }}>Where your wealth is stored</Text>
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
                        <View style={{ position: 'absolute', left: 24, top: 24, width: 72, height: 72, borderRadius: 36, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 20, fontWeight: '800', color: TXT }}>{allocSlices.length}</Text>
                          <Text style={{ fontSize: 14, color: SUBTLE, marginTop: -2 }}>classes</Text>
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
                                <Text style={{ fontSize: 14, color: MUTED, flex: 1 }} numberOfLines={1}>{cat}</Text>
                              </View>
                              <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: TXT }}>{fmtCompact(val)}</Text>
                                <Text style={{ fontSize: 14, color: SUBTLE }}>{sharePct}%</Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                    {/* Proportional segmented bar — shows actual proportions */}
                    <View style={{ height: 6, flexDirection: 'row', borderRadius: 3, overflow: 'hidden', backgroundColor: BORDER, marginTop: 16 }}>
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
                  <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: SURFACE, borderRadius: 20, padding: 18 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <Calendar size={16} color="#F59E0B" />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: TXT }}>Upcoming Bills</Text>
                    </View>
                    {upcoming.map((l, i) => {
                      const days    = daysUntil(l.nextDueDate);
                      const overdue = days !== null && days < 0;
                      const dueSoon = days !== null && days <= 7 && days >= 0;
                      const dc = overdue ? '#EF4444' : dueSoon ? '#F59E0B' : MUTED;
                      return (
                        <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < upcoming.length - 1 ? 1 : 0, borderBottomColor: BORDER }}>
                          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: overdue ? '#EF444422' : '#F59E0B22', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <CreditCard size={16} color={overdue ? '#EF4444' : '#F59E0B'} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: TXT }}>{l.name}</Text>
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
          {activeTab === 'transactions' && (() => {
            const acctMap = Object.fromEntries(accounts.map(a => [a.id, a.name]));
            const txAccountOptions = ['All', ...Array.from(new Set(monthTx.map(t => t.accountId ? acctMap[t.accountId] : null).filter((n): n is string => Boolean(n))))];
            return (
            <>
              {/* Summary row */}
              <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Income',  val: income,           color: '#10B981', Icon: TrendingUp   },
                  { label: 'Expense', val: expense,          color: '#EF4444', Icon: TrendingDown },
                  { label: 'Net',     val: Math.abs(net),    color: net >= 0 ? '#10B981' : '#EF4444', Icon: ArrowLeftRight },
                ].map((s) => (
                  <View key={s.label} style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 16, padding: 14, alignItems: 'center' }}>
                    <s.Icon size={16} color={s.color} />
                    <Text style={{ fontSize: 12, color: MUTED, marginTop: 5 }}>{s.label}</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: s.color, marginTop: 2 }}>{fmtCompact(s.val)}</Text>
                  </View>
                ))}
              </View>

              {/* Search + Add row */}
              <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 10 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 10 }}>
                  <Search size={14} color="#6B7280" />
                  <TextInput
                    value={txSearch}
                    onChangeText={setTxSearch}
                    placeholder="Search transactions…"
                    placeholderTextColor="#4B5563"
                    style={{ flex: 1, paddingVertical: 9, paddingHorizontal: 8, fontSize: 14, color: TXT }}
                  />
                </View>
                <TouchableOpacity onPress={() => setShowAddTx(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: ACCENT, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 }}>
                  <Plus size={14} color="white" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: 'white' }}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Filter chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginBottom: 12 }} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
                {txAccountOptions.map((opt) => {
                  const active = txAccountFilter === opt;
                  return (
                    <TouchableOpacity key={opt} onPress={() => setTxAccountFilter(opt)}
                      style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: active ? ACCENT : SURFACE, borderWidth: 1, borderColor: active ? ACCENT : BORDER }}>
                      <Text style={{ fontSize: 13, fontWeight: active ? '600' : '400', color: active ? 'white' : MUTED }}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Upcoming transactions */}
              {upcomingMonthTx.length > 0 && (
                <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: '#F59E0B44' }}>
                  <TouchableOpacity onPress={() => setUpcomingTxOpen(v => !v)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
                    <View style={{ marginRight: 8 }}><CalendarDays size={15} color="#F59E0B" /></View>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#F59E0B' }}>Upcoming ({upcomingMonthTx.length})</Text>
                    <View style={{ transform: [{ rotate: upcomingTxOpen ? '0deg' : '-90deg' }] }}>
                      <ChevronDown size={16} color="#F59E0B" />
                    </View>
                  </TouchableOpacity>
                  {upcomingTxOpen && upcomingMonthTx.map((tx) => (
                    <TxItem key={tx.id} tx={tx} accountName={tx.accountId ? acctMap[tx.accountId] : undefined} onMenuOpen={(t, y) => setTxMenu({ tx: t, y })} />
                  ))}
                </View>
              )}

              {/* Past transaction list */}
              <View style={{ marginHorizontal: 16, backgroundColor: SURFACE, borderRadius: 16 }}>
                <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: TXT2 }}>{monthLabel(year, month)}</Text>
                  <Text style={{ fontSize: 13, color: MUTED }}>{filteredMonthTx.length} transactions</Text>
                </View>
                {txLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator color={ACCENT} /></View>
                ) : filteredMonthTx.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <ArrowLeftRight size={36} color={MUTED} style={{ marginBottom: 8 }} />
                    <Text style={{ fontSize: 14, color: MUTED }}>
                      {txSearch || txAccountFilter !== 'All' ? 'No matching transactions' : 'No transactions this month'}
                    </Text>
                    {!txSearch && txAccountFilter === 'All' && (
                      <TouchableOpacity onPress={() => setShowAddTx(true)}
                        style={{ marginTop: 12, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: ACCENT }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>+ Add Transaction</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  filteredMonthTx.map((tx) => (
                    <TxItem key={tx.id} tx={tx} accountName={tx.accountId ? acctMap[tx.accountId] : undefined} onMenuOpen={(t, y) => setTxMenu({ tx: t, y })} />
                  ))
                )}
              </View>
            </>
            );
          })()}

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
                      <View key={m.label} style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: m.bg }}>
                        <Text style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>{m.label}</Text>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: m.color }} numberOfLines={1}>{m.val}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Search + Add row */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 10 }}>
                    <Search size={14} color="#6B7280" />
                    <TextInput
                      value={assetSearch}
                      onChangeText={setAssetSearch}
                      placeholder="Search assets…"
                      placeholderTextColor="#4B5563"
                      style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: TXT }}
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
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: isActive ? c : BORDER, backgroundColor: isActive ? c + '22' : SURFACE_ALT }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: isActive ? c : MUTED }}>{cat}</Text>
                            {cat !== 'All' && (
                              <View style={{ backgroundColor: isActive ? c + '33' : BORDER, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
                                <Text style={{ fontSize: 9, fontWeight: '700', color: isActive ? c : SUBTLE }}>
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
                    <TrendingUp size={36} color={BORDER} />
                    <Text style={{ fontSize: 14, fontWeight: '500', color: MUTED, marginTop: 12 }}>
                      {assetSearch.trim() ? 'No assets match your search' : 'No assets tracked yet'}
                    </Text>
                    {!assetSearch.trim() && (
                      <>
                        <Text style={{ fontSize: 14, color: SUBTLE, marginTop: 4, textAlign: 'center' }}>
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
                    <View style={{ backgroundColor: SURFACE, borderRadius: 20, padding: 18, marginBottom: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: TXT, marginBottom: 4 }}>Allocation</Text>
                      <Text style={{ fontSize: 15, color: SUBTLE, marginBottom: 14 }}>Distribution across asset classes</Text>
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
                          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 20, fontWeight: '800', color: TXT }}>{allocSlicesAll.length}</Text>
                            <Text style={{ fontSize: 14, color: SUBTLE, marginTop: -2 }}>classes</Text>
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
                                  <Text style={{ fontSize: 14, color: MUTED, flex: 1 }} numberOfLines={1}>{cat}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                                  <Text style={{ fontSize: 14, fontWeight: '600', color: TXT }}>{fmtCompact(val)}</Text>
                                  <Text style={{ fontSize: 14, color: SUBTLE }}>{pct}%</Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                      {/* Proportional bar */}
                      <View style={{ height: 6, flexDirection: 'row', borderRadius: 3, overflow: 'hidden', backgroundColor: BORDER, marginTop: 16 }}>
                        {allocSlicesAll.map(([, val], i) => (
                          <View key={i} style={{ flex: totalAssetsValue > 0 ? (val / totalAssetsValue) * 100 : 0, backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
                        ))}
                      </View>
                    </View>

                    {/* Breakdown card */}
                    <View style={{ backgroundColor: SURFACE, borderRadius: 20, padding: 18 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: TXT, marginBottom: 14 }}>Breakdown</Text>
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
                                  <Text style={{ fontSize: 14, fontWeight: '500', color: TXT2 }}>{cat}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <Text style={{ fontSize: 14, fontWeight: '700', color: TXT }}>{fmtCompact(val)}</Text>
                                  <Text style={{ fontSize: 14, color: SUBTLE, width: 32, textAlign: 'right' }}>{pct}%</Text>
                                </View>
                              </View>
                              <View style={{ height: 6, backgroundColor: BORDER, borderRadius: 3, overflow: 'hidden' }}>
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
            <View style={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 6 }}>
              {/* Summary cards */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Total Borrowed', val: formatINR(liabSummary.borrowed),    color: '#3B82F6', bg: '#3B82F622' },
                  { label: 'Total Repaid',   val: formatINR(liabSummary.repaid),      color: '#10B981', bg: '#10B98122' },
                  { label: 'Outstanding',    val: formatINR(liabSummary.outstanding), color: '#EF4444', bg: '#EF444422' },
                ].map((m) => (
                  <View key={m.label} style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: m.bg }}>
                    <Text style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>{m.label}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: m.color }} numberOfLines={1}>{m.val}</Text>
                  </View>
                ))}
              </View>

              {/* Repayment progress */}
              {liabilities.length > 0 && (
                <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: TXT2 }}>Overall repayment progress</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: ACCENT }}>{repaidPct}% paid</Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: BORDER, borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ height: 8, width: `${repaidPct}%` as `${number}%`, backgroundColor: ACCENT, borderRadius: 4 }} />
                  </View>
                </View>
              )}

              {/* Search + Add row */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 10 }}>
                  <Search size={14} color="#6B7280" />
                  <TextInput
                    value={liabSearch}
                    onChangeText={setLiabSearch}
                    placeholder="Search loans…"
                    placeholderTextColor="#4B5563"
                    style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: TXT }}
                  />
                </View>
                <TouchableOpacity onPress={() => setShowAddLiab(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ACCENT, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
                  <Plus size={14} color="white" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Liability list */}
              {liabLoading ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator color={ACCENT} /></View>
              ) : liabilities.length === 0 ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>🎉</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: MUTED }}>No liabilities!</Text>
                  <Text style={{ fontSize: 14, color: MUTED, marginTop: 4 }}>Debt-free or add your first loan below</Text>
                  <TouchableOpacity onPress={() => setShowAddLiab(true)}
                    style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: ACCENT }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>+ Add Loan</Text>
                  </TouchableOpacity>
                </View>
              ) : (() => {
                const filtered = liabSearch.trim()
                  ? liabilities.filter(l => l.name.toLowerCase().includes(liabSearch.toLowerCase()) || (l.lender ?? '').toLowerCase().includes(liabSearch.toLowerCase()))
                  : liabilities;
                if (filtered.length === 0) {
                  return (
                    <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: MUTED }}>No loans match "{liabSearch}"</Text>
                    </View>
                  );
                }
                return filtered.map((l) => (
                  <LiabilityCard key={l.id} liability={l}
                    onPay={setPayLiability}
                    onEdit={setEditLiability}
                    onDelete={handleDeleteLiability}
                  />
                ));
              })()}
            </View>
          )}

          {/* ── ACCOUNTS ─────────────────────────────────────────────────── */}
          {activeTab === 'accounts' && (() => {
            const creditUsed   = Math.abs(accounts.filter(a => a.type === 'Credit Card').reduce((s, a) => s + Math.min(0, a.balance), 0));
            const totalBalance = availableBalance - creditUsed;
            const now2 = new Date();
            const today2 = now2.toISOString().slice(0, 10);
            const spentThisMonth = transactions.filter(t => {
              if (t.type !== 'expense') return false;
              if (FINANCE_SYSTEM_CATS.includes(t.category)) return false;
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
                <View style={{ borderRadius: 20, padding: 22, marginBottom: 14, backgroundColor: '#10B981', shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 14, elevation: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.8)' }}>Total Balance</Text>
                  <Text style={{ fontSize: 38, fontWeight: '800', color: 'white', marginTop: 6, letterSpacing: -1 }}>{formatINR(totalBalance)}</Text>
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>Liquid assets minus credit used</Text>
                </View>

                {/* 3 metric cards */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Balance',     val: formatINR(availableBalance), color: '#10B981', bg: '#10B98122', sub: 'Bank + Wallets + Cash', Icon: Landmark     },
                    { label: 'Credit Used', val: formatINR(creditUsed),       color: '#EF4444', bg: '#EF444422', sub: 'Outstanding balance',   Icon: CreditCard   },
                    { label: 'Spent',       val: formatINR(spentThisMonth),   color: '#F97316', bg: '#F9731622', sub: 'This month',             Icon: TrendingDown },
                  ].map((m) => (
                    <View key={m.label} style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: BORDER }}>
                      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: m.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                        <m.Icon size={16} color={m.color} />
                      </View>
                      <Text style={{ fontSize: 11, color: MUTED, marginBottom: 3 }}>{m.label}</Text>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: m.color }} numberOfLines={1}>{m.val}</Text>
                      <Text style={{ fontSize: 10, color: SUBTLE, marginTop: 3 }}>{m.sub}</Text>
                    </View>
                  ))}
                </View>

                {/* Accounts grouped by type */}
                {accounts.length === 0 ? (
                  <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                    <Landmark size={40} color={MUTED} style={{ marginBottom: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '500', color: MUTED }}>No accounts yet</Text>
                    <Text style={{ fontSize: 14, color: MUTED, marginTop: 4 }}>Add your bank and wallet accounts</Text>
                  </View>
                ) : (
                  SECTIONS.filter(s => (byType[s.key] ?? []).length > 0).map(({ key, label, Icon, color }) => (
                    <View key={key} style={{ marginBottom: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Icon size={14} color={color} />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: TXT2 }}>{label}</Text>
                        <View style={{ backgroundColor: SURFACE_ALT, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 14, color: MUTED }}>{byType[key]?.length ?? 0}</Text>
                        </View>
                      </View>
                      {(byType[key] ?? []).map((a) => (
                        <AccountRow
                          key={a.id}
                          account={a}
                          onOptions={() => setAccountMenu(a)}
                        />
                      ))}
                    </View>
                  ))
                )}
              </View>
            );
          })()}

          {/* ── BUDGET ────────────────────────────────────────────────────── */}
          {activeTab === 'budget' && (() => {
            const now3 = new Date();
            const budgetInflow = transactions.filter(t => {
              const d = new Date(t.date);
              return t.type === 'income' && !FINANCE_SYSTEM_CATS.includes(t.category) && d.getMonth() === now3.getMonth() && d.getFullYear() === now3.getFullYear();
            }).reduce((s, t) => s + t.amount, 0);

            const BUDGET_COLORS = ['#10B981','#F59E0B','#14B8A6','#3B82F6','#EF4444','#8B5CF6','#0EA5E9','#EC4899','#F97316','#6366F1'];

            const budgetCards = budgets
              .filter(b => !budgetSearch.trim() || b.name.toLowerCase().includes(budgetSearch.toLowerCase()))
              .map((b, i) => {
                const progress = b.budget > 0 ? b.spent / b.budget : 0;
                const remaining = b.budget - b.spent;
                const color = BUDGET_COLORS[i % BUDGET_COLORS.length];
                const cats = b.category ? b.category.split(',').map(s => s.trim()).filter(Boolean) : [];
                return { ...b, progress, remaining, color, cats, statusColor: budgetStatusColor(progress) };
              });

            const totalBudget = budgetCards.reduce((s, b) => s + b.budget, 0);
            const totalSpent  = budgetCards.reduce((s, b) => s + b.spent, 0);
            const netBalance  = budgetInflow - totalSpent;

            return (
              <View style={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 6 }}>

                {/* Summary row */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Inflow',  val: budgetInflow,        color: '#10B981', bg: '#10B98122' },
                    { label: 'Planned', val: totalBudget,          color: '#3B82F6', bg: '#3B82F622' },
                    { label: 'Net',     val: Math.abs(netBalance), color: netBalance >= 0 ? '#10B981' : '#EF4444', bg: netBalance >= 0 ? '#10B98122' : '#EF444422' },
                  ].map((m) => (
                    <View key={m.label} style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: m.bg }}>
                      <Text style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>{m.label}</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: m.color }} numberOfLines={1}>{fmtCompact(m.val)}</Text>
                    </View>
                  ))}
                </View>

                {/* Search + Add row */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 10 }}>
                    <Search size={14} color="#6B7280" />
                    <TextInput
                      value={budgetSearch}
                      onChangeText={setBudgetSearch}
                      placeholder="Search budgets…"
                      placeholderTextColor="#4B5563"
                      style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: TXT }}
                    />
                  </View>
                  <TouchableOpacity onPress={() => { setEditBudget(null); setShowAddBudget(true); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ACCENT, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
                    <Plus size={14} color="white" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Add</Text>
                  </TouchableOpacity>
                </View>

                {/* Budget cards from API */}
                {budgetCards.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <ChartBar size={36} color={MUTED} style={{ marginBottom: 8 }} />
                    <Text style={{ fontSize: 14, color: MUTED }}>
                      {budgetSearch.trim() ? 'No budgets match your search' : 'No budgets yet — tap Add to create one'}
                    </Text>
                  </View>
                ) : budgetCards.map((item) => (
                  <View key={item.id} style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: TXT }}>{item.name}</Text>
                        {item.cats.length > 0 && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                            {item.cats.map(cat => (
                              <View key={cat} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: item.color + '22' }}>
                                <Text style={{ fontSize: 11, color: item.color, fontWeight: '600' }}>{cat}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: TXT }}>{formatINR(item.budget)}</Text>
                        <TouchableOpacity style={{ padding: 4 }} onPress={() => { setEditBudget(item); setShowAddBudget(true); }}>
                          <Pencil size={15} color={MUTED} />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ padding: 4 }} onPress={() => deleteBudgetMut.mutate(item.id)}>
                          <Trash2 size={15} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={{ height: 6, backgroundColor: BORDER, borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
                      <View style={{ width: `${Math.min(item.progress * 100, 100)}%` as `${number}%`, height: 6, backgroundColor: item.statusColor }} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1, backgroundColor: SURFACE_ALT, borderRadius: 10, padding: 10 }}>
                        <Text style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Spent</Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: item.statusColor }}>{fmtCompact(item.spent)}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: SURFACE_ALT, borderRadius: 10, padding: 10 }}>
                        <Text style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Used</Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: item.statusColor }}>{Math.round(item.progress * 100)}%</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: item.remaining >= 0 ? '#10B98122' : '#EF444422', borderRadius: 10, padding: 10 }}>
                        <Text style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>{item.remaining >= 0 ? 'Left' : 'Over'}</Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: item.remaining >= 0 ? '#10B981' : '#EF4444' }}>{fmtCompact(Math.abs(item.remaining))}</Text>
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
            const SYSTEM_CATS = ['Opening Balance', 'Balance Adjustment', 'Adjustment', 'Credit Card Payment', 'Transfer', 'opening_balance', 'adjustment'];
            const thisMonthTx = transactions.filter(t => {
              const d = new Date(t.date);
              return d.getMonth() === _now.getMonth() && d.getFullYear() === _now.getFullYear()
                && !SYSTEM_CATS.includes(t.category) && t.type !== 'opening_balance' && t.type !== 'adjustment' && t.type !== 'transfer';
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

            const idealTerm  = Math.max(0, (monthlyExpense * 12 * 25) - netWorth);
            const healthRec  = vitalsProfile.dependents >= 3 ? 2500000 : 1500000;

            // Scores (each /2, total /10)
            const sEF     = runwayMonths >= 6 ? 2 : runwayMonths >= 3 ? 1.5 : runwayMonths >= 1 ? 1 : 0.5;
            const sSR     = savingsRate >= 0.40 ? 2 : savingsRate >= 0.25 ? 1.5 : savingsRate >= 0.10 ? 1 : 0.5;
            const sDR     = debtRatio < 0.20 ? 2 : debtRatio < 0.30 ? 1.5 : debtRatio < 0.50 ? 1 : 0.5;
            const sTerm   = (() => { const r = idealTerm > 0 ? vitalsProfile.termCover / idealTerm : (vitalsProfile.termCover > 0 ? 1 : 0); return r >= 1 ? 2 : r >= 0.7 ? 1.5 : r >= 0.4 ? 1 : 0.5; })();
            const sHealth = (() => { const r = vitalsProfile.healthCover / healthRec; return r >= 1 ? 2 : r >= 0.7 ? 1.5 : r >= 0.4 ? 1 : 0.5; })();
            const totalScore = Math.round((sEF + sSR + sDR + sTerm + sHealth) * 10) / 10;
            const scoreColor = totalScore >= 8 ? '#10B981' : totalScore >= 6 ? '#3B82F6' : totalScore >= 4 ? '#F59E0B' : '#EF4444';
            const scoreLabel = totalScore >= 8 ? 'Excellent' : totalScore >= 6 ? 'Good' : totalScore >= 4 ? 'Fair' : 'Needs Work';

            const barC = (s: number) => s >= 1.5 ? '#10B981' : s >= 1 ? '#F59E0B' : '#EF4444';

            const completeness = Math.round(
              ([vitalsProfile.age > 0, vitalsProfile.termCover > 0, vitalsProfile.healthCover > 0,
                monthlyIncome > 0, monthlyExpense > 0, liquidAssets > 0].filter(Boolean).length / 6) * 100
            );
            const completenessColor = completeness >= 80 ? '#10B981' : completeness >= 50 ? '#F59E0B' : '#EF4444';

            const topActions = [
              { score: sEF,    cond: runwayMonths < 6,        label: 'Build emergency fund',      detail: `Need ${fmtCompact(Math.max(0, monthlyExpense * (6 - runwayMonths)))} more for 6-month safety net` },
              { score: sSR,    cond: savingsRate < 0.25,      label: 'Increase savings rate',     detail: `Aim for 25%+ — currently ${Math.round(savingsRate * 100)}%` },
              { score: sTerm,  cond: sTerm < 2,               label: 'Increase term insurance',   detail: `Ideal cover is ${fmtCompact(idealTerm)}; enter your policy in Financial Profile` },
              { score: sHealth,cond: sHealth < 2,             label: 'Improve health insurance',  detail: `Recommended cover: ${fmtCompact(healthRec)}` },
              { score: sDR,    cond: debtRatio >= 0.20,       label: 'Reduce debt',               detail: `Debt ratio is ${Math.round(debtRatio * 100)}% — target below 20%` },
            ].filter(a => a.cond).sort((a, b) => a.score - b.score).slice(0, 3);

            const weakest = [
              { name: 'emergency fund', score: sEF },
              { name: 'savings rate',   score: sSR },
              { name: 'debt ratio',     score: sDR },
              { name: 'term insurance', score: sTerm },
              { name: 'health cover',   score: sHealth },
            ].sort((a, b) => a.score - b.score)[0];
            const insightText = totalScore >= 8
              ? 'Your finances are in excellent shape. Keep maintaining these habits.'
              : `Focus on improving your ${weakest.name} to boost your Vital score.`;

            return (
              <View style={{ padding: 16 }}>
                {/* Hero Score Card */}
                <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Activity size={16} color={scoreColor} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: TXT, flex: 1 }}>Vital Score</Text>
                    <View style={{ backgroundColor: scoreColor + '22', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: scoreColor }}>{scoreLabel}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    {/* Score ring */}
                    <View style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 8, borderColor: scoreColor, alignItems: 'center', justifyContent: 'center', backgroundColor: SCREEN_BG, flexShrink: 0 }}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: scoreColor }}>{totalScore}</Text>
                      <Text style={{ fontSize: 11, color: MUTED }}>/10</Text>
                    </View>
                    {/* Factor bars */}
                    <View style={{ flex: 1, gap: 7 }}>
                      {[
                        { label: 'Emergency Fund', score: sEF },
                        { label: 'Savings Rate',   score: sSR },
                        { label: 'Debt Ratio',     score: sDR },
                        { label: 'Term Insurance', score: sTerm },
                        { label: 'Health Cover',   score: sHealth },
                      ].map((f) => (
                        <View key={f.label}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={{ fontSize: 11, color: MUTED }}>{f.label}</Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: barC(f.score) }}>{f.score}/2</Text>
                          </View>
                          <View style={{ height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ height: 4, width: `${(f.score / 2) * 100}%` as `${number}%`, backgroundColor: barC(f.score), borderRadius: 2 }} />
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={{ backgroundColor: SURFACE_ALT, borderRadius: 10, padding: 12, marginTop: 14 }}>
                    <Text style={{ fontSize: 12, color: MUTED, lineHeight: 18 }}>{insightText}</Text>
                  </View>
                </View>

                {/* Financial Profile (collapsible) */}
                <View style={{ backgroundColor: SURFACE, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' }}>
                  <TouchableOpacity onPress={() => setVitalsProfileOpen(v => !v)} activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 }}>
                    <Activity size={15} color={MUTED} />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: TXT, flex: 1 }}>Financial Profile</Text>
                    <Text style={{ fontSize: 12, color: completenessColor, marginRight: 6 }}>{completeness}% complete</Text>
                    <ChevronDown size={15} color={MUTED} style={{ transform: [{ rotate: vitalsProfileOpen ? '180deg' : '0deg' }] }} />
                  </TouchableOpacity>
                  {/* Completeness bar */}
                  <View style={{ height: 3, backgroundColor: BORDER }}>
                    <View style={{ height: 3, width: `${completeness}%` as `${number}%`, backgroundColor: completenessColor }} />
                  </View>

                  {vitalsProfileOpen && (
                    <View style={{ padding: 14, paddingTop: 12 }}>
                      {/* Auto-pulled stats */}
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                        {[
                          { label: 'Monthly Income',  val: fmtCompact(monthlyIncome),  color: '#10B981', sub: 'This month' },
                          { label: 'Monthly Expense', val: fmtCompact(monthlyExpense), color: '#EF4444', sub: 'This month' },
                          { label: 'Liquid Assets',   val: fmtCompact(liquidAssets),   color: '#3B82F6', sub: 'Bank + Wallets' },
                        ].map((t) => (
                          <View key={t.label} style={{ flex: 1, backgroundColor: SURFACE_ALT, borderRadius: 10, padding: 10 }}>
                            <Text style={{ fontSize: 9, color: MUTED, marginBottom: 2 }}>{t.label}</Text>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: t.color }}>{t.val}</Text>
                            <Text style={{ fontSize: 9, color: SUBTLE, marginTop: 2 }}>{t.sub}</Text>
                          </View>
                        ))}
                      </View>

                      {/* User inputs */}
                      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                        {([
                          { key: 'age' as const,        label: 'Age',          suffix: 'yrs',  placeholder: '30' },
                          { key: 'dependents' as const, label: 'Dependents',   suffix: '',     placeholder: '0' },
                          { key: 'termCover' as const,  label: 'Term Cover',   suffix: '₹',    placeholder: '1Cr' },
                          { key: 'healthCover' as const,label: 'Health Cover', suffix: '₹',    placeholder: '15L' },
                        ] as const).map((field) => (
                          <View key={field.key} style={{ width: '46%' }}>
                            <Text style={{ fontSize: 11, color: MUTED, marginBottom: 5 }}>{field.label}</Text>
                            <View style={{ borderWidth: 1, borderColor: vitalsProfile[field.key] > 0 ? ACCENT : BORDER, borderRadius: 10, backgroundColor: SURFACE_ALT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8 }}>
                              <TextInput
                                style={{ flex: 1, fontSize: 13, color: TXT2 }}
                                keyboardType="numeric"
                                value={vitalsProfile[field.key] > 0 ? String(vitalsProfile[field.key]) : ''}
                                onChangeText={v => updateVitalsProfile(field.key, v ? Number(v) : 0)}
                                placeholder={field.placeholder}
                                placeholderTextColor={SUBTLE}
                              />
                              {!!field.suffix && <Text style={{ fontSize: 11, color: SUBTLE }}>{field.suffix}</Text>}
                            </View>
                          </View>
                        ))}
                      </View>

                      <Text style={{ fontSize: 11, color: SUBTLE, marginTop: 10 }}>
                        {!vitalsProfileLoaded ? 'Loading...' : vitalsProfileSaving ? 'Saving...' : 'Changes auto-saved to your account.'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Core Vitals — Emergency Fund */}
                <Text style={{ fontSize: 13, fontWeight: '700', color: MUTED, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Core Vitals</Text>

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  {/* Emergency Fund */}
                  <View style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: BORDER }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: TXT }}>Emergency Fund</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: barC(sEF) }}>{sEF}/2</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: MUTED }}>Cash & Savings: <Text style={{ color: TXT2, fontWeight: '600' }}>{fmtCompact(emergencyFund)}</Text></Text>
                    <Text style={{ fontSize: 11, color: runwayMonths >= 6 ? '#10B981' : '#F59E0B', marginTop: 2 }}>
                      Runway: <Text style={{ fontWeight: '700' }}>{runwayMonths.toFixed(1)} mo</Text>
                    </Text>
                    <View style={{ height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
                      <View style={{ height: 4, width: `${Math.min((runwayMonths / 12) * 100, 100)}%` as `${number}%`, backgroundColor: barC(sEF), borderRadius: 2 }} />
                    </View>
                    <Text style={{ fontSize: 10, color: SUBTLE, marginTop: 4 }}>
                      {runwayMonths < 6 ? `${fmtCompact(Math.max(0, monthlyExpense * (6 - runwayMonths)))} more for 6-mo` : '6-month fund in place ✓'}
                    </Text>
                  </View>

                  {/* Savings Rate */}
                  <View style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: BORDER }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: TXT }}>Savings Rate</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: barC(sSR) }}>{sSR}/2</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: MUTED }}>Income: <Text style={{ color: '#10B981', fontWeight: '600' }}>{fmtCompact(monthlyIncome)}</Text></Text>
                    <Text style={{ fontSize: 11, color: savingsRate >= 0.2 ? '#10B981' : '#F59E0B', marginTop: 2 }}>
                      Saving <Text style={{ fontWeight: '700' }}>{Math.round(savingsRate * 100)}%</Text> this month
                    </Text>
                    <View style={{ height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
                      <View style={{ height: 4, width: `${Math.min(savingsRate * 200, 100)}%` as `${number}%`, backgroundColor: barC(sSR), borderRadius: 2 }} />
                    </View>
                    {fiYears !== null && (
                      <Text style={{ fontSize: 10, color: SUBTLE, marginTop: 4 }}>FI at current pace: ~{fiYears} yrs</Text>
                    )}
                  </View>
                </View>

                {/* Debt Ratio */}
                {(totalAss > 0 || totalLiab > 0) && (
                  <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Shield size={14} color={MUTED} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: TXT, flex: 1 }}>Debt Ratio</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: barC(sDR) }}>{sDR}/2</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                      <Text style={{ fontSize: 28, fontWeight: '800', color: barC(sDR) }}>{Math.round(debtRatio * 100)}%</Text>
                      <View style={{ flex: 1, gap: 4 }}>
                        {[
                          { label: 'Assets',      val: fmtCompact(totalAss),  color: '#10B981' },
                          { label: 'Liabilities', val: fmtCompact(totalLiab), color: '#EF4444' },
                          { label: 'Net Worth',   val: fmtCompact(netWorth),  color: netWorth >= 0 ? '#10B981' : '#EF4444' },
                        ].map((r) => (
                          <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 11, color: MUTED }}>{r.label}</Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: r.color }}>{r.val}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={{ height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden', marginTop: 10 }}>
                      <View style={{ height: 4, width: `${Math.min(debtRatio * 100, 100)}%` as `${number}%`, backgroundColor: barC(sDR), borderRadius: 2 }} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                      <Text style={{ fontSize: 10, color: '#10B981' }}>● &lt;20% Good</Text>
                      <Text style={{ fontSize: 10, color: '#F59E0B' }}>● 20–30% Fair</Text>
                      <Text style={{ fontSize: 10, color: '#EF4444' }}>● &gt;50% High</Text>
                    </View>
                  </View>
                )}

                {/* Protection */}
                <Text style={{ fontSize: 13, fontWeight: '700', color: MUTED, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Protection</Text>

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  {/* Term Insurance */}
                  <View style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: BORDER }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: TXT }}>Term Insurance</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: barC(sTerm) }}>{sTerm}/2</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: MUTED }}>Current: <Text style={{ color: TXT2, fontWeight: '600' }}>{vitalsProfile.termCover > 0 ? fmtCompact(vitalsProfile.termCover) : '—'}</Text></Text>
                    <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Ideal: <Text style={{ color: TXT2, fontWeight: '600' }}>{idealTerm > 0 ? fmtCompact(idealTerm) : '—'}</Text></Text>
                    <View style={{ height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
                      <View style={{ height: 4, width: `${Math.min(idealTerm > 0 ? (vitalsProfile.termCover / idealTerm) * 100 : (vitalsProfile.termCover > 0 ? 100 : 0), 100)}%` as `${number}%`, backgroundColor: barC(sTerm), borderRadius: 2 }} />
                    </View>
                    <Text style={{ fontSize: 10, color: SUBTLE, marginTop: 4 }}>
                      {vitalsProfile.termCover === 0 ? 'Enter amount in Financial Profile' :
                        vitalsProfile.termCover >= idealTerm ? 'Fully covered ✓' :
                        `Gap: ${fmtCompact(idealTerm - vitalsProfile.termCover)}`}
                    </Text>
                  </View>

                  {/* Health Insurance */}
                  <View style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: BORDER }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: TXT }}>Health Insurance</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: barC(sHealth) }}>{sHealth}/2</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: MUTED }}>Current: <Text style={{ color: TXT2, fontWeight: '600' }}>{vitalsProfile.healthCover > 0 ? fmtCompact(vitalsProfile.healthCover) : '—'}</Text></Text>
                    <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Recommended: <Text style={{ color: TXT2, fontWeight: '600' }}>{fmtCompact(healthRec)}</Text></Text>
                    <View style={{ height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
                      <View style={{ height: 4, width: `${Math.min((vitalsProfile.healthCover / healthRec) * 100, 100)}%` as `${number}%`, backgroundColor: barC(sHealth), borderRadius: 2 }} />
                    </View>
                    <Text style={{ fontSize: 10, color: SUBTLE, marginTop: 4 }}>
                      {vitalsProfile.healthCover === 0 ? 'Enter amount in Financial Profile' :
                        vitalsProfile.healthCover >= healthRec ? 'Covered ✓' :
                        `Gap: ${fmtCompact(healthRec - vitalsProfile.healthCover)}`}
                    </Text>
                  </View>
                </View>

                {/* Future Impact */}
                {monthlyIncome > 0 && monthlyExpense > 0 && (
                  <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <TrendingUp size={14} color="#3B82F6" />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: TXT }}>Future Impact</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1, backgroundColor: '#3B82F618', borderRadius: 12, padding: 12 }}>
                        <Text style={{ fontSize: 10, color: '#93C5FD', marginBottom: 4 }}>At {Math.round(savingsRate * 100)}% savings</Text>
                        <Text style={{ fontSize: 17, fontWeight: '800', color: '#DBEAFE' }}>{fiYears !== null ? `${fiYears} yrs` : 'N/A'}</Text>
                        <Text style={{ fontSize: 10, color: '#93C5FD', marginTop: 2 }}>to Financial Independence</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#10B98118', borderRadius: 12, padding: 12 }}>
                        <Text style={{ fontSize: 10, color: '#6EE7B7', marginBottom: 4 }}>If savings = 30%</Text>
                        {(() => {
                          const s30 = monthlyIncome * 0.30;
                          const fi30 = s30 > 0 ? Math.round((monthlyExpense * 12 * 25) / (s30 * 12)) : null;
                          return (
                            <>
                              <Text style={{ fontSize: 17, fontWeight: '800', color: '#D1FAE5' }}>{fi30 !== null ? `${fi30} yrs` : '—'}</Text>
                              <Text style={{ fontSize: 10, color: '#6EE7B7', marginTop: 2 }}>
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
                  <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Zap size={14} color="#F59E0B" />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: TXT }}>Top Actions</Text>
                    </View>
                    {topActions.map((a, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: SURFACE_ALT, borderRadius: 10, padding: 10, marginBottom: i < topActions.length - 1 ? 8 : 0 }}>
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#F59E0B22', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B' }}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: TXT2 }}>{a.label}</Text>
                          {!!a.detail && <Text style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{a.detail}</Text>}
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
        {activeTab === 'transactions' && (
          <MonthSelector year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
        )}
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

      {/* Transaction context popup */}
      {txMenu && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setTxMenu(null)}>
          <Pressable style={{ flex: 1 }} onPress={() => setTxMenu(null)} />
          <View style={{
            position: 'absolute',
            top: Math.max(60, txMenu.y - 44),
            right: 16,
            backgroundColor: '#1E2330',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#2A3040',
            shadowColor: '#000',
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 14,
            minWidth: 140,
            overflow: 'hidden',
          }}>
            <TouchableOpacity onPress={() => { setTxMenu(null); setEditTx(txMenu.tx); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2A3040' }}>
              <Pencil size={15} color={TXT2} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: TXT2 }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setTxMenu(null); deleteTxMut.mutate(txMenu.tx.id); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 }}>
              <Trash2 size={15} color="#EF4444" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#EF4444' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* Modals */}
      <MoreSheet visible={showMore} active={activeTab} onSelect={setActiveTab} onClose={() => setShowMore(false)} />
      <AddTxModal visible={showAddTx} onClose={() => setShowAddTx(false)} accounts={accounts} onSave={(data) => createTxMut.mutate(data)} />
      <EditTxModal visible={!!editTx} tx={editTx} accounts={accounts} onClose={() => setEditTx(null)} onSave={(id, data) => updateTxMut.mutate({ id, data })} />
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
      <BudgetModal visible={showAddBudget} initial={editBudget} onClose={() => { setShowAddBudget(false); setEditBudget(null); }}
        onSave={(data) => { if (editBudget) updateBudgetMut.mutate({ id: editBudget.id, data }); else createBudgetMut.mutate(data); }} />
      <RecordPaymentModal visible={!!payLiability} liability={payLiability} accounts={accounts}
        onClose={() => setPayLiability(null)} onPay={handleRecordPayment} />
      <EditAccountModal visible={!!editAccount} account={editAccount} onClose={() => setEditAccount(null)}
        onSave={(id, data) => updateAccountMut.mutate({ id, data })} />

      {/* Account options bottom-sheet */}
      {accountMenu && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setAccountMenu(null)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setAccountMenu(null)} />
          <View style={{ backgroundColor: MODAL, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 36 }}>
            {/* handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginTop: 12, marginBottom: 16 }} />
            {/* account header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: (ACCOUNT_COLORS[accountMenu.type] ?? '#64748B') + '22', alignItems: 'center', justifyContent: 'center' }}>
                {(() => { const I = ACCOUNT_ICONS[accountMenu.type] ?? Wallet; return <I size={18} color={ACCOUNT_COLORS[accountMenu.type] ?? '#64748B'} />; })()}
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: TXT }}>{accountMenu.name}</Text>
                <Text style={{ fontSize: 12, color: MUTED }}>{accountMenu.type}</Text>
              </View>
            </View>
            {/* Edit */}
            <TouchableOpacity
              onPress={() => { setEditAccount(accountMenu); setAccountMenu(null); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: BORDER }}
            >
              <Pencil size={18} color={TXT2} />
              <Text style={{ fontSize: 15, fontWeight: '500', color: TXT }}>Edit</Text>
            </TouchableOpacity>
            {/* Delete */}
            <TouchableOpacity
              onPress={() => {
                setAccountMenu(null);
                setTimeout(() => {
                  Alert.alert('Delete Account', `Delete "${accountMenu.name}"? All associated data will be removed.`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteAccountMut.mutate(accountMenu.id) },
                  ]);
                }, 300);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 18 }}
            >
              <Trash2 size={18} color="#EF4444" />
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#EF4444' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
