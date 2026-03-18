// components/OnboardingWizard.tsx
// Shown to new users when they have no accounts/assets/liabilities yet.
// Wrap this around the orbit layout or show as a modal overlay.
//
// Usage in app/orbit/layout.tsx or app/orbit/page.tsx:
//   const { state } = useFinance();
//   const isNew = state.loadState === 'ready' && state.accounts.length === 0 && state.assets.length === 0;
//   if (isNew) return <OnboardingWizard />;

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Target, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useFinance } from '@/lib/financeStore';

const STEPS = [
  {
    id: 'welcome',
    icon: <span className="text-4xl">👋</span>,
    title: "Welcome to MyOrbit",
    subtitle: "Let's set up your financial dashboard in 2 minutes.",
    cta: "Get started",
  },
  {
    id: 'account',
    icon: <Wallet className="h-10 w-10 text-emerald-600" />,
    title: "Add your first account",
    subtitle: "Start with your primary bank account or salary account.",
    cta: "Add account",
  },
  {
    id: 'goal',
    icon: <Target className="h-10 w-10 text-emerald-600" />,
    title: "What are you saving for?",
    subtitle: "Set a savings goal to stay motivated.",
    cta: "Set a goal",
  },
  {
    id: 'done',
    icon: <CheckCircle2 className="h-10 w-10 text-emerald-600" />,
    title: "You're all set!",
    subtitle: "Your dashboard is ready. Start tracking your finances.",
    cta: "Go to dashboard",
  },
];

const ACCOUNT_TYPES = ['Bank', 'Credit Card', 'Cash', 'Debit Card', 'Wallet'] as const;

export default function OnboardingWizard({ onDismiss }: { onDismiss?: () => void }) {
  const router = useRouter();
  const { addAccount } = useFinance();
  const [step,      setStep]      = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const dismiss = () => { setDismissed(true); onDismiss?.(); };

  // Account form state
  const [acctName,    setAcctName]    = useState('');
  const [acctType,    setAcctType]    = useState<typeof ACCOUNT_TYPES[number]>('Bank');
  const [acctBalance, setAcctBalance] = useState('');
  const [acctError,   setAcctError]   = useState('');

  if (dismissed) return null;

  const handleNext = async () => {
    if (step === 1) {
      // Validate and save account
      if (!acctName.trim()) { setAcctError('Account name is required.'); return; }
      const balance = parseFloat(acctBalance) || 0;
      setLoading(true);
      try {
        await addAccount({ name: acctName.trim(), type: acctType, balance });
        setAcctError('');
        setStep(s => s + 1);
      } catch (e: any) {
        setAcctError(e.message || 'Failed to create account.');
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step === 2) {
      // Skip goal for now — navigate to orbit
      setStep(s => s + 1);
      return;
    }
    if (step === STEPS.length - 1) {
      dismiss();
      router.push('/orbit/finance/accounts');
      return;
    }
    setStep(s => s + 1);
  };

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8">
          {/* Step indicator */}
          <div className="flex gap-1.5 mb-8">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            ))}
          </div>

          {/* Icon */}
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 mb-6">
            {current.icon}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{current.title}</h2>
          <p className="text-gray-500 mb-8">{current.subtitle}</p>

          {/* Step-specific form */}
          {step === 1 && (
            <div className="space-y-4 mb-6">
              {acctError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{acctError}</div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account name</label>
                <input value={acctName} onChange={e => setAcctName(e.target.value)}
                  placeholder="e.g. HDFC Savings Account"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account type</label>
                <select value={acctType} onChange={e => setAcctType(e.target.value as typeof ACCOUNT_TYPES[number])}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                  {ACCOUNT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current balance (₹)</label>
                <input type="number" value={acctBalance} onChange={e => setAcctBalance(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 mb-6">
              {['Emergency fund', 'Home down payment', 'Retirement', 'Travel', 'Education', 'Other'].map(goal => (
                <button key={goal} onClick={() => handleNext()}
                  className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-emerald-400 hover:bg-emerald-50 transition">
                  {goal}
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {step > 0 && step < STEPS.length - 1 && (
              <button onClick={() => setDismissed(true)}
                className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Skip for now
              </button>
            )}
            {step !== 2 && (
              <button onClick={handleNext} disabled={loading}
                className="flex-1 rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60 transition">
                {loading ? 'Saving…' : current.cta}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
