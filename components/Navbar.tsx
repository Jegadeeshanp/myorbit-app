'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Finance Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your money and investments
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition flex items-center gap-2">
            <span className="text-lg">📅</span>
            March 2026
          </button>

          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg transition"
            title="Toggle theme"
          >
            🌙
          </button>

          <Link href="/settings">
            <button className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-700 to-green-900 text-white font-bold flex items-center justify-center hover:shadow-lg transition">
              👤
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
