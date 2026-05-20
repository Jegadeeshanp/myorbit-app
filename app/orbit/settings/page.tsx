'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authStore';
import { ArrowLeft, User, Settings, Shield, CreditCard, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import AccountTab from '@/components/settings/AccountTab';
import PreferencesTab from '@/components/settings/PreferencesTab';
import DataPrivacyTab from '@/components/settings/DataPrivacyTab';
import { FinanceProvider } from '@/lib/financeStore';
import SubscriptionTab from '@/components/settings/SubscriptionTab';
import DashboardTab from '@/components/settings/DashboardTab';

const TABS = [
  { id: 'account',      label: 'Account',     icon: User              },
  { id: 'preferences',  label: 'Preferences', icon: Settings          },
  { id: 'dashboard',    label: 'Dashboard',   icon: LayoutDashboard   },
  { id: 'data',         label: 'Data',        icon: Shield            },
  { id: 'billing',      label: 'Billing',     icon: CreditCard        },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  const { auth, signOut } = useAuth();

  const handleSignOut = () => signOut(); // nextSignOut handles redirect via callbackUrl

  return (
    <FinanceProvider>
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#0d1117]">
      <div className="mx-auto max-w-4xl px-6 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/orbit" className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-700">
              <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
          </div>
          {auth.status === 'authenticated' && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                {auth.user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{auth.user.name}</span>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="mb-8 flex gap-1 overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5 shadow-sm">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-none items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          {activeTab === 'account'     && <AccountTab onSignOut={handleSignOut} />}
          {activeTab === 'preferences' && <PreferencesTab />}
          {activeTab === 'dashboard'   && <DashboardTab />}
          {activeTab === 'data'        && <DataPrivacyTab />}
          {activeTab === 'billing'     && <SubscriptionTab />}
        </div>
      </div>
    </div>
    </FinanceProvider>
  );
}
