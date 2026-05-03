'use client';

import { useState } from 'react';

export default function Home() {
  const [authMode, setAuthMode] = useState<'landing' | 'signin' | 'signup'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just redirect to orbit
    window.location.href = '/orbit';
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just redirect to orbit
    window.location.href = '/orbit';
  };

  // Landing Page
  if (authMode === 'landing') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-200 bg-white">
          <h1 className="text-3xl font-bold text-green-900">MyOrbit</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setAuthMode('signin')}
              className="px-6 py-2 text-gray-700 font-semibold hover:text-green-900"
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className="px-6 py-2 bg-green-800 text-white font-semibold rounded-lg hover:bg-green-900"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <h2 className="text-6xl font-bold text-gray-900 mb-6 text-center">
            Manage Your Life in One Place
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl text-center mb-12">
            MyOrbit helps you organize your finances, goals, health, habits, and tasks in one beautiful dashboard.
          </p>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Finance */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-300 shadow-md hover:shadow-lg transition">
              <div className="text-6xl mb-4">�</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Finance</h3>
              <p className="text-sm text-gray-700">Track accounts, expenses, investments, budgets & loans</p>
            </div>

            {/* Goals */}
            <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-300 shadow-sm opacity-60 cursor-not-allowed">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Goals</h3>
              <p className="text-sm text-gray-600">
                Set & track financial goals
                <span className="block mt-1 text-xs font-semibold text-gray-500">Coming Soon</span>
              </p>
            </div>

            {/* Health */}
            <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-300 shadow-sm opacity-60 cursor-not-allowed">
              <div className="text-6xl mb-4">❤️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Health</h3>
              <p className="text-sm text-gray-600">
                Monitor fitness & wellness
                <span className="block mt-1 text-xs font-semibold text-gray-500">Coming Soon</span>
              </p>
            </div>

            {/* Habits */}
            <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-300 shadow-sm opacity-60 cursor-not-allowed">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Habits</h3>
              <p className="text-sm text-gray-600">
                Build good habits
                <span className="block mt-1 text-xs font-semibold text-gray-500">Coming Soon</span>
              </p>
            </div>

            {/* To-Do */}
            <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-300 shadow-sm opacity-60 cursor-not-allowed md:col-start-2">
              <div className="text-6xl mb-4">✍️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">To-Do</h3>
              <p className="text-sm text-gray-600">
                Organize tasks & projects
                <span className="block mt-1 text-xs font-semibold text-gray-500">Coming Soon</span>
              </p>
            </div>

            {/* Insights */}
            <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-300 shadow-sm opacity-60 cursor-not-allowed">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Insights</h3>
              <p className="text-sm text-gray-600">
                Get smart recommendations
                <span className="block mt-1 text-xs font-semibold text-gray-400">Coming Soon</span>
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-20">
          <button
            onClick={() => setAuthMode('signup')}
            className="px-10 py-4 bg-green-800 text-white text-lg font-semibold rounded-lg hover:bg-green-900 shadow-lg"
          >
            Get Started Now →
          </button>
        </div>
      </main>
    );
  }

  // Sign In Page
  if (authMode === 'signin') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <button
            onClick={() => setAuthMode('landing')}
            className="text-green-700 font-semibold mb-8 hover:text-green-900"
          >
            ← Back
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-8">Sign in to your MyOrbit account</p>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-green-800 text-white font-semibold rounded-lg hover:bg-green-900 transition mt-6"
              >
                Sign In
              </button>
            </form>

            <p className="text-center text-gray-600 mt-6">
              Don't have an account?{' '}
              <button
                onClick={() => setAuthMode('signup')}
                className="text-green-700 font-semibold hover:text-green-900"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Sign Up Page
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => setAuthMode('landing')}
          className="text-green-700 font-semibold mb-8 hover:text-green-900"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Join MyOrbit</h2>
          <p className="text-gray-600 mb-8">Create your account to get started</p>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-green-800 text-white font-semibold rounded-lg hover:bg-green-900 transition mt-6"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <button
              onClick={() => setAuthMode('signin')}
              className="text-green-700 font-semibold hover:text-green-900"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
