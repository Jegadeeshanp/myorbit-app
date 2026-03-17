'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, ChevronRight, Calendar, Zap } from 'lucide-react';
import { toast } from '@/components/Toast';

type Goal = {
  id: string; title: string; category: string; why?: string;
  deadline?: string; status: string;
  milestones: { id: string; isCompleted: boolean }[];
  processes: { id: string }[];
};

const GRADIENT_BY_CATEGORY: Record<string, string> = {
  Finance: 'from-emerald-500 to-teal-600', Health: 'from-rose-500 to-pink-600',
  Career: 'from-amber-500 to-orange-600',  Learning: 'from-blue-500 to-indigo-600',
  Personal: 'from-indigo-500 to-purple-600', Other: 'from-gray-400 to-gray-600',
};
const CATEGORY_COLORS: Record<string, string> = {
  Finance: 'bg-emerald-100 text-emerald-700', Health: 'bg-rose-100 text-rose-700',
  Career: 'bg-amber-100 text-amber-700',       Learning: 'bg-blue-100 text-blue-700',
  Personal: 'bg-indigo-100 text-indigo-700',   Other: 'bg-gray-100 text-gray-700',
};

export default function ActiveGoalsPage() {
  const router = useRouter();
  const [goals, setGoals]     = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setGoals(d.filter((g: Goal) => g.status === 'active')); })
      .catch(() => toast('Failed to load', 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Active Goals</h1>
        <p className="text-sm text-gray-600 mt-0.5">{goals.length} in progress</p>
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-center">
          <Target className="h-12 w-12 text-indigo-300 mb-3" />
          <p className="font-semibold text-gray-900">No active goals</p>
          <p className="text-sm text-gray-500 mt-1">All caught up or go create some goals!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {goals.map(goal => {
            const done  = goal.milestones.filter(m => m.isCompleted).length;
            const total = goal.milestones.length;
            const pct   = total > 0 ? (done / total) * 100 : 0;
            const grad  = GRADIENT_BY_CATEGORY[goal.category] || GRADIENT_BY_CATEGORY.Other;
            const cat   = CATEGORY_COLORS[goal.category] || CATEGORY_COLORS.Other;
            const overdue = goal.deadline && goal.deadline < new Date().toISOString().split('T')[0];
            return (
              <div key={goal.id} onClick={() => router.push(`/orbit/goals/${goal.id}`)}
                className="group cursor-pointer rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className={`h-1.5 bg-gradient-to-r ${grad}`} />
                <div className="p-5">
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${cat} mb-3 inline-block`}>{goal.category}</span>
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-indigo-700 transition-colors">{goal.title}</h3>
                  {goal.why && <p className="text-sm text-gray-500 italic mb-3 line-clamp-1">"{goal.why}"</p>}
                  {total > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Milestones</span><span>{done}/{total}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        <div className={`h-1.5 rounded-full bg-gradient-to-r ${grad}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                      {goal.processes.length > 0 && <span className="text-xs text-gray-500 flex items-center gap-1"><Zap className="h-3 w-3 text-indigo-400" />{goal.processes.length}</span>}
                      {goal.deadline && <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-rose-600 font-medium' : 'text-gray-500'}`}><Calendar className="h-3 w-3" />{goal.deadline}</span>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
