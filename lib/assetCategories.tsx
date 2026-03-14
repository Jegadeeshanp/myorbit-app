// Central definition of all asset categories with icons and styling.
// Import this wherever asset categories are needed to keep everything in sync.

import React from 'react';
import {
  TrendingUp, BarChart3, Home, Coins, Building2, Landmark,
  LineChart, ShieldCheck, Heart, Bitcoin, Globe, Briefcase,
  PiggyBank, Droplets, RefreshCw, Package, Shield, CreditCard,
  FileText, Plus,
} from 'lucide-react';

export type AssetCategory =
  | 'Stocks & Equity'
  | 'Mutual Funds'
  | 'Real Estate'
  | 'Gold & Silver'
  | 'FD & RD'
  | 'Bonds'
  | 'Debt Funds'
  | 'EPF / PPF / NPS'
  | 'SSY'
  | 'Crypto'
  | 'International'
  | 'Employer Stock'
  | 'Cash & Savings'
  | 'Liquid Funds'
  | 'Arbitrage Funds'
  | 'Commodities'
  | 'ULIP'
  | 'Moneyback Insurance'
  | 'Endowment Plans'
  | 'Other';

export type AssetCategoryConfig = {
  label: AssetCategory;
  icon: React.ElementType;
  color: string;       // text color
  bg: string;          // icon background
  tagBg: string;       // pill background
  tagText: string;     // pill text
  // Which "group tab" this belongs to
  group: 'All' | 'Equity' | 'Mutual Funds' | 'Real Estate' | 'Cash' | 'Gold' | 'Debt' | 'Insurance' | 'Other';
};

export const ASSET_CATEGORIES: AssetCategoryConfig[] = [
  { label: 'Stocks & Equity',    icon: TrendingUp,    color: 'text-blue-600',    bg: 'bg-blue-50',    tagBg: 'bg-blue-100',    tagText: 'text-blue-700',    group: 'Equity' },
  { label: 'Mutual Funds',       icon: BarChart3,     color: 'text-purple-600',  bg: 'bg-purple-50',  tagBg: 'bg-purple-100',  tagText: 'text-purple-700',  group: 'Mutual Funds' },
  { label: 'Real Estate',        icon: Home,          color: 'text-amber-600',   bg: 'bg-amber-50',   tagBg: 'bg-amber-100',   tagText: 'text-amber-700',   group: 'Real Estate' },
  { label: 'Gold & Silver',      icon: Coins,         color: 'text-yellow-600',  bg: 'bg-yellow-50',  tagBg: 'bg-yellow-100',  tagText: 'text-yellow-700',  group: 'Gold' },
  { label: 'FD & RD',            icon: Building2,     color: 'text-emerald-600', bg: 'bg-emerald-50', tagBg: 'bg-emerald-100', tagText: 'text-emerald-700', group: 'Debt' },
  { label: 'Bonds',              icon: Landmark,      color: 'text-indigo-600',  bg: 'bg-indigo-50',  tagBg: 'bg-indigo-100',  tagText: 'text-indigo-700',  group: 'Debt' },
  { label: 'Debt Funds',         icon: LineChart,     color: 'text-teal-600',    bg: 'bg-teal-50',    tagBg: 'bg-teal-100',    tagText: 'text-teal-700',    group: 'Debt' },
  { label: 'EPF / PPF / NPS',    icon: ShieldCheck,   color: 'text-green-600',   bg: 'bg-green-50',   tagBg: 'bg-green-100',   tagText: 'text-green-700',   group: 'Debt' },
  { label: 'SSY',                icon: Heart,         color: 'text-pink-600',    bg: 'bg-pink-50',    tagBg: 'bg-pink-100',    tagText: 'text-pink-700',    group: 'Other' },
  { label: 'Crypto',             icon: Bitcoin,       color: 'text-orange-600',  bg: 'bg-orange-50',  tagBg: 'bg-orange-100',  tagText: 'text-orange-700',  group: 'Equity' },
  { label: 'International',      icon: Globe,         color: 'text-sky-600',     bg: 'bg-sky-50',     tagBg: 'bg-sky-100',     tagText: 'text-sky-700',     group: 'Equity' },
  { label: 'Employer Stock',     icon: Briefcase,     color: 'text-violet-600',  bg: 'bg-violet-50',  tagBg: 'bg-violet-100',  tagText: 'text-violet-700',  group: 'Equity' },
  { label: 'Cash & Savings',     icon: PiggyBank,     color: 'text-emerald-600', bg: 'bg-emerald-50', tagBg: 'bg-emerald-100', tagText: 'text-emerald-700', group: 'Cash' },
  { label: 'Liquid Funds',       icon: Droplets,      color: 'text-cyan-600',    bg: 'bg-cyan-50',    tagBg: 'bg-cyan-100',    tagText: 'text-cyan-700',    group: 'Cash' },
  { label: 'Arbitrage Funds',    icon: RefreshCw,     color: 'text-blue-500',    bg: 'bg-blue-50',    tagBg: 'bg-blue-100',    tagText: 'text-blue-600',    group: 'Mutual Funds' },
  { label: 'Commodities',        icon: Package,       color: 'text-stone-600',   bg: 'bg-stone-50',   tagBg: 'bg-stone-100',   tagText: 'text-stone-700',   group: 'Other' },
  { label: 'ULIP',               icon: Shield,        color: 'text-gray-600',    bg: 'bg-gray-50',    tagBg: 'bg-gray-100',    tagText: 'text-gray-700',    group: 'Insurance' },
  { label: 'Moneyback Insurance',icon: CreditCard,    color: 'text-rose-500',    bg: 'bg-rose-50',    tagBg: 'bg-rose-100',    tagText: 'text-rose-700',    group: 'Insurance' },
  { label: 'Endowment Plans',    icon: FileText,      color: 'text-slate-600',   bg: 'bg-slate-50',   tagBg: 'bg-slate-100',   tagText: 'text-slate-700',   group: 'Insurance' },
  { label: 'Other',              icon: Plus,          color: 'text-gray-500',    bg: 'bg-gray-50',    tagBg: 'bg-gray-100',    tagText: 'text-gray-600',    group: 'Other' },
];

export const CATEGORY_MAP = new Map(ASSET_CATEGORIES.map(c => [c.label, c]));

export function getCategoryConfig(label: string): AssetCategoryConfig {
  return CATEGORY_MAP.get(label as AssetCategory) ?? ASSET_CATEGORIES[ASSET_CATEGORIES.length - 1];
}

// Unique group tabs derived from categories
export const GROUP_TABS = ['All', 'Equity', 'Mutual Funds', 'Real Estate', 'Cash', 'Gold', 'Debt', 'Insurance', 'Other'] as const;
export type GroupTab = typeof GROUP_TABS[number];
