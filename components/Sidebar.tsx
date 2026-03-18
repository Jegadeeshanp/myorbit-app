'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { IconDashboard, IconAccounts, IconExpenses, IconInvestments, IconBudgets, IconLiabilities } from './Icons';
import type { ReactNode } from 'react';

interface NavItem {
  name: string;
  icon: ReactNode;
  href: string;
}

export default function Sidebar() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: <IconDashboard className="w-6 h-6" />, href: '/orbit' },
    { name: 'Money', icon: <IconDashboard className="w-6 h-6" />, href: '/orbit/money' },
    { name: 'Accounts', icon: <IconAccounts className="w-6 h-6" />, href: '/orbit/money/accounts' },
    { name: 'Transactions', icon: <IconExpenses className="w-6 h-6" />, href: '/orbit/money/transactions' },
    { name: 'Investments', icon: <IconInvestments className="w-6 h-6" />, href: '/orbit/money/investments' },
    { name: 'Budgets', icon: <IconBudgets className="w-6 h-6" />, href: '/orbit/money/budgets' },
    { name: 'Liabilities', icon: <IconLiabilities className="w-6 h-6" />, href: '/orbit/money/liabilities' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen p-6 flex flex-col shadow-sm overflow-y-auto">
      <Link href="/orbit" className="mb-8 block">
        <h2 className="text-2xl font-bold text-green-900 hover:text-green-800 transition">
          MyOrbit
        </h2>
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                isActive
                  ? 'bg-green-50 text-green-900 font-semibold border-l-4 border-green-800'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 pt-4 space-y-2">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition text-sm font-medium"
        >
          <span className="text-lg">⚙️</span>
          Settings
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition text-sm font-medium"
        >
          <span className="text-lg">🚪</span>
          Logout
        </Link>
      </div>
    </aside>
  );
}
