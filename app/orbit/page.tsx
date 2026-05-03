'use client';

import Link from 'next/link';

export default function Orbit() {
  const modules = [
    {
      id: 'finance',
      name: 'Finance',
      icon: '💰',
      description: 'Track accounts, expenses, investments, budgets & loans',
      color: 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 hover:shadow-lg',
      available: true,
      href: '/orbit/finance',
    },
    {
      id: 'goals',
      name: 'Goals',
      icon: '🎯',
      description: 'Set & track financial goals',
      color: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 hover:shadow-lg',
      available: true,
      href: '/orbit/goals',
    },
    {
      id: 'health',
      name: 'Health',
      icon: '🏃',
      description: 'Monitor fitness & wellness',
      color: 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-300 hover:shadow-lg',
      available: true,
      href: '/orbit/health',
    },
    {
      id: 'habits',
      name: 'Habits',
      icon: '✅',
      description: 'Build good habits',
      color: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 hover:shadow-lg',
      available: true,
      href: '/orbit/habits',
    },
    {
      id: 'todo',
      name: 'To-Do',
      icon: '📋',
      description: 'Organize tasks & projects',
      color: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 hover:shadow-lg',
      available: true,
      href: '/orbit/tasks',
    },
    {
      id: 'insights',
      name: 'Insights',
      icon: '🧠',
      description: 'Get smart recommendations',
      color: 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-300 hover:shadow-lg',
      available: true,
      href: '/orbit/insights',
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-green-900">MyOrbit</h1>
          <p className="text-gray-600 mt-1">Your personal life management dashboard</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Choose a Module</h2>
          <p className="text-lg text-gray-600">Pick what you want to organize and manage</p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module) => (
            <div
              key={module.id}
              className={`p-8 rounded-2xl border-2 transition-all ${module.color}`}
            >
              {module.available ? (
                <Link href={module.href || '#'}>
                  <div className="cursor-pointer block h-full">
                    <div className="text-7xl mb-6">{module.icon}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{module.name}</h3>
                    <p className="text-gray-700 mb-6">{module.description}</p>
                    <div className="inline-block px-4 py-2 bg-green-800 text-white font-semibold rounded-lg hover:bg-green-900 transition">
                      Open Module →
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="block h-full">
                  <div className="text-7xl mb-6">{module.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{module.name}</h3>
                  <p className="text-gray-600 mb-6">{module.description}</p>
                  <div className="inline-block px-4 py-2 bg-gray-400 text-gray-700 text-sm font-semibold rounded-lg">
                    Coming Soon
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 p-8 bg-white rounded-2xl border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">✅ All Modules Available</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-center gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Finance:</strong> Track accounts, expenses, investments, budgets & loans</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Goals:</strong> Set financial targets and track progress</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Health:</strong> Monitor fitness and wellness metrics</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Habits:</strong> Build and track positive habits</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>To-Do:</strong> Organize your tasks and projects</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Insights:</strong> AI-powered financial health scoring</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
