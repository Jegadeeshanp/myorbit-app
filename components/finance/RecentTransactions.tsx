'use client';

import {
  Coffee, CreditCard, FileText, Film, ShoppingBag, Truck,
  Home, ShoppingCart, Utensils, Fuel, Bus, Zap, Wifi, Smartphone,
  RefreshCw, Stethoscope, Shield, Plane, GraduationCap, Gift, Package,
  Landmark, PiggyBank, TrendingUp, Wallet, ArrowLeftRight,
  ArrowUpRight, MoreHorizontal, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { Transaction } from '@/lib/financeData';

// ── Icon + colour maps (mirrors TransactionList) ───────────────────────────
const EXPENSE_ICON_MAP: Record<string, React.ComponentType<any>> = {
  Rent:                 Home,
  Groceries:            ShoppingCart,
  Restaurants:          Utensils,
  Fuel:                 Fuel,
  Transport:            Bus,
  Utilities:            Zap,
  Internet:             Wifi,
  Mobile:               Smartphone,
  Shopping:             ShoppingBag,
  Subscriptions:        RefreshCw,
  Medical:              Stethoscope,
  Insurance:            Shield,
  Travel:               Plane,
  Education:            GraduationCap,
  Gifts:                Gift,
  Miscellaneous:        Package,
  Investment:           PiggyBank,
  Loan:                 Landmark,
  'Opening Balance':    TrendingUp,
  'Balance Adjustment': Wallet,
  // Legacy
  Food:                 Coffee,
  Bills:                FileText,
  Healthcare:           Stethoscope,
  Entertainment:        Film,
  Others:               MoreHorizontal,
  Default:              CreditCard,
};

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  Rent:                 { bg: 'bg-violet-100',  text: 'text-violet-700'  },
  Groceries:            { bg: 'bg-green-100',   text: 'text-green-700'   },
  Restaurants:          { bg: 'bg-orange-100',  text: 'text-orange-700'  },
  Fuel:                 { bg: 'bg-amber-100',   text: 'text-amber-700'   },
  Transport:            { bg: 'bg-blue-100',    text: 'text-blue-700'    },
  Utilities:            { bg: 'bg-yellow-100',  text: 'text-yellow-700'  },
  Internet:             { bg: 'bg-sky-100',     text: 'text-sky-700'     },
  Mobile:               { bg: 'bg-cyan-100',    text: 'text-cyan-700'    },
  Shopping:             { bg: 'bg-pink-100',    text: 'text-pink-700'    },
  Subscriptions:        { bg: 'bg-indigo-100',  text: 'text-indigo-700'  },
  Medical:              { bg: 'bg-red-100',     text: 'text-red-700'     },
  Insurance:            { bg: 'bg-teal-100',    text: 'text-teal-700'    },
  Travel:               { bg: 'bg-sky-100',     text: 'text-sky-700'     },
  Education:            { bg: 'bg-indigo-100',  text: 'text-indigo-700'  },
  Gifts:                { bg: 'bg-rose-100',    text: 'text-rose-700'    },
  Miscellaneous:        { bg: 'bg-gray-100',    text: 'text-gray-600'    },
  Investment:           { bg: 'bg-teal-100',    text: 'text-teal-700'    },
  Loan:                 { bg: 'bg-orange-100',  text: 'text-orange-700'  },
  'Opening Balance':    { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Balance Adjustment': { bg: 'bg-gray-100',    text: 'text-gray-600'    },
  // Income
  Salary:               { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  Bonus:                { bg: 'bg-green-100',   text: 'text-green-700'   },
  Freelance:            { bg: 'bg-blue-100',    text: 'text-blue-700'    },
  Business:             { bg: 'bg-violet-100',  text: 'text-violet-700'  },
  Dividends:            { bg: 'bg-teal-100',    text: 'text-teal-700'    },
  Interest:             { bg: 'bg-cyan-100',    text: 'text-cyan-700'    },
  'Rental Income':      { bg: 'bg-amber-100',   text: 'text-amber-700'   },
  Cashback:             { bg: 'bg-lime-100',    text: 'text-lime-700'    },
  Refund:               { bg: 'bg-slate-100',   text: 'text-slate-600'   },
  'Other Income':       { bg: 'bg-gray-100',    text: 'text-gray-600'    },
  // Legacy
  Food:                 { bg: 'bg-orange-100',  text: 'text-orange-700'  },
  Bills:                { bg: 'bg-yellow-100',  text: 'text-yellow-700'  },
  Entertainment:        { bg: 'bg-pink-100',    text: 'text-pink-700'    },
  Healthcare:           { bg: 'bg-red-100',     text: 'text-red-700'     },
  Transfer:             { bg: 'bg-blue-100',    text: 'text-blue-700'    },
  Default:              { bg: 'bg-gray-100',    text: 'text-gray-600'    },
};

function TxIcon({ tx }: { tx: { type: string; category: string } }) {
  if (tx.type === 'income') {
    return (
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-emerald-50">
        <ArrowUpRight className="h-5 w-5 text-emerald-600" />
      </div>
    );
  }
  if (tx.category === 'Transfer') {
    return (
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-blue-50">
        <ArrowLeftRight className="h-5 w-5 text-blue-500" />
      </div>
    );
  }
  const Icon = EXPENSE_ICON_MAP[tx.category] ?? EXPENSE_ICON_MAP.Default;
  const col  = CAT_COLORS[tx.category]      ?? CAT_COLORS.Default;
  return (
    <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${col.bg}`}>
      <Icon className={`h-5 w-5 ${col.text}`} />
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
type RecentTransactionsProps = {
  transactions: Transaction[];
};

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recent = [...transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
          <p className="text-xs text-gray-400">Latest activity</p>
        </div>
        <Link href="/orbit/finance/transactions"
          className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition">
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {recent.map((tx) => {
          const isExpense = tx.type === 'expense';
          return (
            <div key={tx.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <TxIcon tx={tx} />
                <div>
                  <div className="text-sm font-semibold text-gray-900">{tx.category}</div>
                  <div className="text-xs text-gray-500">{tx.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${isExpense ? 'text-red-600' : 'text-emerald-700'}`}>
                  {isExpense ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
