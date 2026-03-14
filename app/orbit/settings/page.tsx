'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authStore';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Settings, Users, Shield, CreditCard } from 'lucide-react';
import Link from 'next/link';
import AccountTab from '@/components/settings/AccountTab';
import PreferencesTab from '@/components/settings/PreferencesTab';
import ProfilesTab from '@/components/settings/ProfilesTab';
import DataPrivacyTab from '@/components/settings/DataPrivacyTab';
import { FinanceProvider } from '@/lib/financeStore';
import SubscriptionTab from '@/components/settings/SubscriptionTab';

const TABS = [
  { id: 'account',      label: 'Account',           icon: User },
  { id: 'preferences',  label: 'Preferences',        icon: Settings },
  { id: 'profiles',     label: 'Profiles & Sharing', icon: Users },
  { id: 'data',         label: 'Data & Privacy',     icon: Shield },
  { id: 'subscription', label: 'Subscription',       icon: CreditCard },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  const { auth, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => { signOut(); router.push('/signin'); };

  return (
    <FinanceProvider>
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="mx-auto max-w-4xl px-6 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/orbit" className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          </div>
          {auth.status === 'authenticated' && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                {auth.user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{auth.user.name}</span>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="mb-8 flex gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
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
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
          {activeTab === 'account'      && <AccountTab onSignOut={handleSignOut} />}
          {activeTab === 'preferences'  && <PreferencesTab />}
          {activeTab === 'profiles'     && <ProfilesTab />}
          {activeTab === 'data'         && <DataPrivacyTab />}
          {activeTab === 'subscription' && <SubscriptionTab />}
        </div>
      </div>
    </div>
    </FinanceProvider>
  );
}
