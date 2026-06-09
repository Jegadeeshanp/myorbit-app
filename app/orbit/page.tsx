'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Wallet, Target, HeartPulse, Flame, CheckSquare, Sparkles,
  Search, Bell, Settings, ChevronRight, CheckCheck, BarChart2,
} from 'lucide-react';
import { useAuth } from '@/lib/authStore';
import { useFinance } from '@/lib/financeStore';

// ── Types ─────────────────────────────────────────────────────────────────────
type TaskInst = { id: string; task: { title: string; priority: string } };
type Habit    = { id: string; name: string; iconEmoji: string; daysOfWeek: string; logs: { logDate: string }[] };
type Goal     = { id: string; title: string; deadline: string | null; status: string };

// ── Helpers ───────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function fmtBal(n: number) {
  const a = Math.abs(n);
  if (a >= 100000) return `${(a / 100000).toFixed(1)}L`;
  if (a >= 1000)   return `${(a / 1000).toFixed(1)}K`;
  return a.toFixed(0);
}

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

// ── Module strip config ───────────────────────────────────────────────────────
const MODS = [
  { key: 'finance',  label: 'Finance',  Icon: Wallet,      href: '/orbit/finance',
    iconBg: { d: 'rgba(0,229,160,0.14)',   l: 'rgba(0,184,122,0.14)' },
    iconColor: { d: '#00E5A0', l: '#00b87a' },
    accent: { d: '#00E5A0', l: '#00b87a' },
    border: { d: 'rgba(0,229,160,0.35)',   l: 'rgba(0,184,122,0.35)' },
    glow:   { d: '0 0 18px rgba(0,229,160,0.2)', l: '0 0 18px rgba(0,184,122,0.2)' },
  },
  { key: 'health',   label: 'Health',   Icon: HeartPulse,  href: '/orbit/health',
    iconBg: { d: 'rgba(255,107,107,0.14)', l: 'rgba(224,52,52,0.14)' },
    iconColor: { d: '#FF6B6B', l: '#e03434' },
    accent: { d: '#FF6B6B', l: '#e03434' },
    border: { d: 'rgba(255,107,107,0.35)', l: 'rgba(224,52,52,0.35)' },
    glow:   { d: '0 0 18px rgba(255,107,107,0.2)', l: '0 0 18px rgba(224,52,52,0.2)' },
  },
  { key: 'goals',    label: 'Goals',    Icon: Target,       href: '/orbit/goals',
    iconBg: { d: 'rgba(167,139,250,0.14)', l: 'rgba(139,92,246,0.14)' },
    iconColor: { d: '#A78BFA', l: '#8b5cf6' },
    accent: { d: '#A78BFA', l: '#8b5cf6' },
    border: { d: 'rgba(167,139,250,0.35)', l: 'rgba(139,92,246,0.35)' },
    glow:   { d: '0 0 18px rgba(167,139,250,0.2)', l: '0 0 18px rgba(139,92,246,0.2)' },
  },
  { key: 'tasks',    label: 'Tasks',    Icon: CheckSquare,  href: '/orbit/tasks',
    iconBg: { d: 'rgba(91,228,255,0.14)',  l: 'rgba(14,165,233,0.14)' },
    iconColor: { d: '#5BE4FF', l: '#0ea5e9' },
    accent: { d: '#5BE4FF', l: '#0ea5e9' },
    border: { d: 'rgba(91,228,255,0.35)',  l: 'rgba(14,165,233,0.35)' },
    glow:   { d: '0 0 18px rgba(91,228,255,0.2)', l: '0 0 18px rgba(14,165,233,0.2)' },
  },
  { key: 'habits',   label: 'Habits',   Icon: Flame,        href: '/orbit/habits',
    iconBg: { d: 'rgba(249,164,74,0.14)',  l: 'rgba(224,123,16,0.14)' },
    iconColor: { d: '#F9A44A', l: '#e07b10' },
    accent: { d: '#F9A44A', l: '#e07b10' },
    border: { d: 'rgba(249,164,74,0.35)',  l: 'rgba(224,123,16,0.35)' },
    glow:   { d: '0 0 18px rgba(249,164,74,0.2)', l: '0 0 18px rgba(224,123,16,0.2)' },
  },
  { key: 'insights', label: 'Insights', Icon: Sparkles,     href: '/orbit/insights',
    iconBg: { d: 'rgba(249,164,74,0.14)',  l: 'rgba(224,123,16,0.14)' },
    iconColor: { d: '#F9A44A', l: '#e07b10' },
    accent: { d: '#F9A44A', l: '#e07b10' },
    border: { d: 'rgba(249,164,74,0.35)',  l: 'rgba(224,123,16,0.35)' },
    glow:   { d: '0 0 18px rgba(249,164,74,0.2)', l: '0 0 18px rgba(224,123,16,0.2)' },
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export default function OrbitDashboard() {
  const { auth }  = useAuth();
  const user      = auth.status === 'authenticated' ? auth.user : null;
  const { state } = useFinance();

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const initials  = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? 'M';
  const today     = new Date().toISOString().split('T')[0];
  const weekday   = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const [tasks,        setTasks]        = useState<{ overdue: TaskInst[]; today: TaskInst[] } | null>(null);
  const [habits,       setHabits]       = useState<Habit[]>([]);
  const [goals,        setGoals]        = useState<Goal[]>([]);
  const [healthLogged, setHealthLogged] = useState<boolean | null>(null);
  const [doneHabitIds, setDoneHabitIds] = useState<Set<string>>(new Set());
  const [dataLoading,  setDataLoading]  = useState(true);
  const [isDark,       setIsDark]       = useState(true);
  const [activeKey,    setActiveKey]    = useState('finance');

  // Detect live dark-mode state (for inline-style gradients)
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const fetchDashboard = useCallback(() => {
    if (auth.status !== 'authenticated') return;
    Promise.all([
      fetch('/api/tasks/today').then(r => r.json()).catch(() => ({ overdue: [], today: [] })),
      fetch('/api/habits').then(r => r.json()).catch(() => []),
      fetch('/api/goals').then(r => r.json()).catch(() => []),
      fetch(`/api/health/entries?date=${today}`).then(r => r.json()).catch(() => null),
    ]).then(([t, h, g, he]) => {
      setTasks({ overdue: t?.overdue ?? [], today: t?.today ?? [] });
      setHabits(Array.isArray(h) ? h : []);
      setGoals(Array.isArray(g) ? g : []);
      setHealthLogged(!!he && !!he.id);
      setDoneHabitIds(new Set(
        (Array.isArray(h) ? h : [])
          .filter((hb: Habit) => hb.logs?.some(l => l.logDate === today))
          .map((hb: Habit) => hb.id),
      ));
      setDataLoading(false);
    });
  }, [auth.status, today]);

  // Fetch on mount and re-fetch every time the user navigates back to this tab
  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchDashboard(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchDashboard]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const todayDow    = new Date().getDay();
  const todayHabits = habits.filter(h => {
    try { return (JSON.parse(h.daysOfWeek ?? '[0,1,2,3,4,5,6]') as number[]).includes(todayDow); }
    catch { return true; }
  });
  const doneCount     = todayHabits.filter(h => doneHabitIds.has(h.id)).length;
  const habitProgress = todayHabits.length > 0 ? Math.round((doneCount / todayHabits.length) * 100) : 0;

  const overdueTasks = tasks?.overdue ?? [];
  const todayTasks   = tasks?.today ?? [];
  const allTasks     = [...overdueTasks, ...todayTasks];

  const activeGoals = (goals as any[]).filter(g => g.status === 'active');
  const nearestGoal = activeGoals
    .filter(g => g.deadline)
    .sort((a, b) => (a.deadline < b.deadline ? -1 : 1))[0];

  const totalBalance = state.loadState === 'ready'
    ? state.accounts.reduce((s, a) => s + (a.balance ?? 0), 0)
    : null;

  const orbitScore = Math.min(100, Math.round(
    (habitProgress * 0.4) +
    (overdueTasks.length === 0 ? 30 : Math.max(0, 30 - overdueTasks.length * 5)) +
    (activeGoals.length > 0 ? 20 : 0) +
    (healthLogged ? 10 : 0),
  ));
  const scoreLabel = orbitScore >= 80 ? 'Excellent' : orbitScore >= 60 ? 'On Track' : orbitScore >= 40 ? 'Keep Going' : 'Slightly Behind';

  const heroHeading = overdueTasks.length > 0
    ? 'Your orbit looks slightly behind today.'
    : (doneCount === todayHabits.length && todayHabits.length > 0)
    ? 'Your orbit is looking great today!'
    : `Let's keep your orbit on track.`;

  const heroBullets: { color: string; text: string }[] = [
    overdueTasks.length > 0 ? { color: isDark ? '#FF6B6B' : '#e03434', text: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} overdue — clear these first` } : null,
    todayHabits.length > 0  ? { color: isDark ? '#F9A44A' : '#e07b10', text: doneCount < todayHabits.length ? `Your habits are ${habitProgress}% done today` : 'All habits complete today 🎉' } : null,
    nearestGoal             ? { color: isDark ? '#818cf8' : '#4f46e5', text: `${nearestGoal.title?.slice(0, 36)} — ${daysUntil(nearestGoal.deadline!)}d remaining` } : null,
  ].filter(Boolean) as { color: string; text: string }[];

  const heroRec = overdueTasks.length > 0
    ? 'Clear overdue items before 6 PM, then log your health to boost your orbit score.'
    : 'Stay consistent — your habits and goals are the foundation of your orbit.';

  const toggleHabit = useCallback(async (id: string) => {
    const wasDone = doneHabitIds.has(id);
    setDoneHabitIds(prev => { const n = new Set(prev); wasDone ? n.delete(id) : n.add(id); return n; });
    try {
      await fetch(`/api/habits/${id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today }),
      });
    } catch {
      setDoneHabitIds(prev => { const n = new Set(prev); wasDone ? n.add(id) : n.delete(id); return n; });
    }
  }, [doneHabitIds, today]);

  // Orbit score ring
  const ringR    = 76;
  const ringCirc = 2 * Math.PI * ringR;
  const ringArc  = (orbitScore / 100) * ringCirc;

  const PRIORITY_COLOR: Record<string, string> = {
    urgent: isDark ? '#FF6B6B' : '#e03434',
    high:   isDark ? '#FF6B6B' : '#e03434',
    medium: isDark ? '#F9A44A' : '#e07b10',
    low:    isDark ? '#00E5A0' : '#00b87a',
    none:   isDark ? '#3d5166' : '#94a3b8',
  };

  // Theme-resolved shorthand
  const t = isDark
    ? { bg: '#090d16', card: '#0e1420', deep: '#070b13', bord: 'rgba(255,255,255,0.06)', bord2: 'rgba(255,255,255,0.11)', text: '#e4eaf4', text2: '#8fa3b8', dim: '#3d5166', green: '#00E5A0', blue: '#5BE4FF', amber: '#F9A44A', red: '#FF6B6B', purple: '#A78BFA', indigo: '#818cf8' }
    : { bg: '#f0f4f8', card: '#ffffff', deep: '#e8edf4', bord: 'rgba(0,0,0,0.08)', bord2: 'rgba(0,0,0,0.14)', text: '#0f172a', text2: '#475569', dim: '#94a3b8', green: '#00b87a', blue: '#0ea5e9', amber: '#e07b10', red: '#e03434', purple: '#8b5cf6', indigo: '#4f46e5' };

  const CARD: React.CSSProperties = {
    background: t.card, border: `1px solid ${t.bord}`, borderRadius: 24,
    padding: '28px 30px', position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.2s, border-color 0.2s',
  };

  // Module strip pill live data
  function modPillData(key: string): { value: string; sub: string; valueColor: string } {
    switch (key) {
      case 'finance':
        if (totalBalance === null) return { value: '—', sub: 'Net position', valueColor: t.text2 };
        return {
          value: `${totalBalance < 0 ? '–' : ''}₹${fmtBal(totalBalance)}`,
          sub: 'Net position',
          valueColor: totalBalance < 0 ? t.red : t.green,
        };
      case 'health':
        return {
          value: healthLogged === null ? '—' : healthLogged ? 'Logged ✓' : 'Not logged',
          sub: healthLogged ? 'Today\'s health' : 'Log today',
          valueColor: healthLogged ? t.green : t.text2,
        };
      case 'goals':
        return {
          value: dataLoading ? '—' : `${activeGoals.length}`,
          sub: nearestGoal ? `${daysUntil(nearestGoal.deadline!)}d · ${nearestGoal.title?.slice(0, 12)}` : 'Active goals',
          valueColor: t.indigo,
        };
      case 'tasks':
        return {
          value: dataLoading ? '—' : `${overdueTasks.length}`,
          sub: `overdue · ${allTasks.length} total`,
          valueColor: overdueTasks.length > 0 ? t.red : t.green,
        };
      case 'habits':
        return {
          value: dataLoading ? '—' : `${doneCount}/${todayHabits.length}`,
          sub: `today · ${habitProgress}% done`,
          valueColor: t.amber,
        };
      case 'insights':
        return { value: '4', sub: 'new updates', valueColor: t.amber };
      default:
        return { value: '—', sub: '', valueColor: t.text2 };
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>

      {/* ── Fixed Topbar ─────────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: 62,
        background: isDark ? 'rgba(7,11,19,0.88)' : 'rgba(248,250,252,0.92)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${t.bord}`,
        display: 'flex', alignItems: 'center', padding: '0 clamp(16px,4vw,48px)', gap: 14,
      }}>
        {/* MyOrbit icon */}
        <div style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, overflow: 'hidden', boxShadow: '0 0 18px rgba(0,229,160,0.25)' }}>
          <Image src="/icons/top-icon.svg" alt="MyOrbit" width={36} height={36} priority />
        </div>

        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{greeting()}, {firstName}</div>
          <div style={{ fontSize: 11, color: t.green, marginTop: 1, fontWeight: 500 }}>
            {weekday} · {overdueTasks.length > 0 ? `${overdueTasks.length} thing${overdueTasks.length > 1 ? 's' : ''} need attention` : 'Everything on track'}
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 16px', borderRadius: 10, minWidth: 120, maxWidth: 220,
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${t.bord}`, fontSize: 12, color: t.dim, cursor: 'pointer',
          }}>
            <Search size={14} color={t.dim} style={{ flexShrink: 0 }} />
            Search everything...
          </div>
          {/* Bell */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${t.bord}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={16} color={t.text2} strokeWidth={1.75} />
          </div>
          {/* Settings */}
          <Link href="/orbit/settings" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${t.bord}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Settings size={16} color={t.text2} strokeWidth={1.75} />
            </div>
          </Link>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 62 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,48px) 0' }}>
          <div style={{
            borderRadius: 28, padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,44px)', position: 'relative', overflow: 'hidden',
            background: isDark
              ? 'linear-gradient(140deg,#071c12 0%,#08131e 40%,#090d16 100%)'
              : 'linear-gradient(140deg,#e8fdf4 0%,#eff6ff 55%,#f0f4f8 100%)',
            border: `1px solid ${isDark ? 'rgba(0,229,160,0.18)' : 'rgba(0,184,122,0.28)'}`,
          }}>
            {/* Glow overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: isDark
                ? 'radial-gradient(ellipse 55% 80% at 100% 50%, rgba(0,229,160,0.1) 0%,transparent 65%), radial-gradient(ellipse 30% 40% at 0% 0%, rgba(91,228,255,0.05) 0%,transparent 60%)'
                : 'radial-gradient(ellipse 55% 80% at 100% 50%, rgba(0,184,122,0.08) 0%,transparent 65%), radial-gradient(ellipse 30% 40% at 0% 0%, rgba(14,165,233,0.05) 0%,transparent 60%)',
            }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 40, alignItems: 'center', position: 'relative' }}>
              {/* Left: text content */}
              <div>
                {/* Tag */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: t.green,
                    boxShadow: `0 0 12px ${t.green}`,
                    animation: 'orbitPulse 2.5s ease-in-out infinite',
                  }} />
                  <span style={{ fontSize: 9, color: t.green, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700 }}>
                    Daily Orbit
                  </span>
                </div>

                {/* Heading */}
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Georgia, serif', color: t.text, lineHeight: 1.25, marginBottom: 20 }}>
                  {heroHeading}
                </div>

                {/* Bullets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                  {heroBullets.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, fontSize: 13, color: t.text2, lineHeight: 1.5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: b.color, boxShadow: `0 0 7px ${b.color}`, flexShrink: 0, marginTop: 5 }} />
                      {b.text}
                    </div>
                  ))}
                  {heroBullets.length === 0 && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, fontSize: 13, color: t.text2, lineHeight: 1.5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.green, boxShadow: `0 0 7px ${t.green}`, flexShrink: 0, marginTop: 5 }} />
                      All caught up — great work today!
                    </div>
                  )}
                </div>

                {/* Recommendation */}
                <div style={{
                  fontSize: 13, color: t.text2, lineHeight: 1.65, padding: '14px 18px', borderRadius: 14, marginBottom: 24,
                  background: isDark ? 'rgba(0,229,160,0.05)' : 'rgba(0,184,122,0.07)',
                  border: `1px solid ${isDark ? 'rgba(0,229,160,0.12)' : 'rgba(0,184,122,0.18)'}`,
                }}>
                  <strong style={{ color: t.green, fontWeight: 600 }}>Recommended focus: </strong>
                  {heroRec}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link href="/orbit/tasks">
                    <button style={{
                      padding: '12px 26px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 13, border: 'none', color: '#000',
                      background: 'linear-gradient(135deg,#00E5A0,#00c47a)', transition: 'all 0.2s',
                    }}>Review Tasks</button>
                  </Link>
                  <Link href="/orbit/insights">
                    <button style={{
                      padding: '12px 26px', borderRadius: 12, cursor: 'pointer', fontSize: 13, color: t.text2,
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      border: `1px solid ${t.bord2}`, transition: 'all 0.2s',
                    }}>View Insights</button>
                  </Link>
                </div>
              </div>

              {/* Right: Orbit Score Ring */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ position: 'relative' }}>
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00E5A0" />
                        <stop offset="100%" stopColor="#5BE4FF" />
                      </linearGradient>
                      <filter id="scoreGlow">
                        <feGaussianBlur stdDeviation="3" result="b" />
                        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <circle cx="90" cy="90" r={ringR} fill="none" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'} strokeWidth="10" />
                    <circle cx="90" cy="90" r={ringR} fill="none" stroke="url(#scoreGrad)" strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${ringArc} ${ringCirc}`}
                      strokeDashoffset={ringCirc * 0.25}
                      filter="url(#scoreGlow)" />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-64%)', textAlign: 'center' }}>
                    <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1, fontFamily: 'Georgia, serif', color: t.text }}>{orbitScore}</div>
                    <div style={{ fontSize: 10, color: t.green, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>Orbit Score</div>
                  </div>
                </div>
                {/* Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px', width: '100%' }}>
                  {[
                    { label: 'Habits',  val: `${habitProgress}%`, color: t.amber },
                    { label: 'Health',  val: healthLogged === null ? '—' : healthLogged ? '✓' : '0%', color: healthLogged ? t.green : t.red },
                    { label: 'Tasks',   val: `${Math.max(0, 100 - overdueTasks.length * 20)}%`, color: t.blue },
                    { label: 'Goals',   val: activeGoals.length > 0 ? '✓' : '—', color: t.indigo },
                  ].map(r => (
                    <div key={r.label} style={{ fontSize: 11, color: t.text2, display: 'flex', justifyContent: 'space-between' }}>
                      {r.label} <span style={{ fontWeight: 600, color: r.color }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Module Strip ────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 62, zIndex: 100,
        background: isDark ? 'rgba(9,13,22,0.88)' : 'rgba(248,250,252,0.92)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${t.bord}`,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(10px,2vw,14px) clamp(16px,4vw,48px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
            {MODS.map(m => {
              const isActive = activeKey === m.key;
              const pd = modPillData(m.key);
              const d = isDark;
              return (
                <Link key={m.key} href={m.href} onClick={() => setActiveKey(m.key)} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', padding: '16px 18px 15px',
                    borderRadius: 18, cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    transition: 'all 0.2s',
                    background: isActive
                      ? (d ? 'linear-gradient(145deg,#071a10,#0a0e18)' : 'linear-gradient(145deg,#e8fdf4,#f0fdf8)')
                      : (d ? '#0e1420' : '#ffffff'),
                    border: isActive ? `1px solid ${d ? m.border.d : m.border.l}` : `1px solid ${t.bord}`,
                    boxShadow: isActive
                      ? `0 0 0 1px ${d ? m.border.d.replace('0.35', '0.18') : m.border.l.replace('0.35', '0.18')}, 0 8px 24px ${d ? m.border.d.replace('0.35', '0.1') : m.border.l.replace('0.35', '0.1')}`
                      : 'none',
                  }}>
                    {/* Active top accent */}
                    {isActive && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                        borderRadius: '18px 18px 0 0',
                        background: `linear-gradient(90deg,${d ? m.accent.d : m.accent.l},transparent)`,
                      }} />
                    )}
                    {/* Icon + name */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 18, marginBottom: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: d ? m.iconBg.d : m.iconBg.l,
                        border: `1px solid ${d ? m.border.d : m.border.l}`,
                        boxShadow: d ? m.glow.d : m.glow.l,
                      }}>
                        <m.Icon size={22} color={d ? m.iconColor.d : m.iconColor.l} strokeWidth={1.75} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? (d ? m.accent.d : m.accent.l) : t.text, marginTop: 10 }}>
                        {m.label}
                      </div>
                    </div>
                    {/* Value */}
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Georgia, serif', color: pd.valueColor, marginBottom: 3 }}>
                      {pd.value}
                    </div>
                    {/* Sub */}
                    <div style={{ fontSize: 10, color: t.dim }}>{pd.sub}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content Rows ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(16px,2vw,24px) clamp(16px,4vw,48px) 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Row 1: Focus + Finance ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>

          {/* Today's Focus */}
          <div style={{ ...CARD, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Today&apos;s Focus</div>
                <div style={{ fontSize: 12, color: t.dim, marginTop: 3 }}>
                  {overdueTasks.length > 0 ? `${overdueTasks.length} overdue · ` : ''}{allTasks.length} total
                </div>
              </div>
              <Link href="/orbit/tasks" style={{ fontSize: 11, color: t.green, fontWeight: 600, textDecoration: 'none' }}>All tasks →</Link>
            </div>

            {/* AI smart hint */}
            {overdueTasks.length > 0 && (
              <div style={{
                fontSize: 12, color: t.indigo, fontStyle: 'italic',
                padding: '11px 16px', borderRadius: 12, marginBottom: 16,
                background: isDark ? 'rgba(99,102,241,0.07)' : 'rgba(79,70,229,0.06)',
                border: `1px solid ${isDark ? 'rgba(99,102,241,0.14)' : 'rgba(79,70,229,0.14)'}`,
                lineHeight: 1.55,
              }}>
                Completing {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''} will improve your orbit score.
              </div>
            )}

            {dataLoading ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: 40, background: t.bord, borderRadius: 8, animation: 'pulse 2s infinite' }} />)}
              </div>
            ) : allTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: t.dim, fontSize: 14 }}>
                No tasks for today 🎉
              </div>
            ) : (
              allTasks.slice(0, 5).map((inst: TaskInst, i) => {
                const isOverdue = overdueTasks.some(o => o.id === inst.id);
                const pri = inst.task?.priority ?? 'none';
                return (
                  <Link key={inst.id} href="/orbit/tasks" style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '14px 0', borderBottom: i < Math.min(allTasks.length, 5) - 1 ? `1px solid ${t.bord}` : 'none',
                      cursor: 'pointer',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, width: 18, textAlign: 'center', flexShrink: 0, color: isOverdue ? t.red : t.green }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inst.task?.title ?? 'Task'}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: isOverdue ? t.red : t.green }}>
                          {isOverdue ? 'Overdue' : 'Due today'}
                        </div>
                      </div>
                      {pri !== 'none' && (
                        <div style={{
                          fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 7,
                          letterSpacing: '0.08em', flexShrink: 0, textTransform: 'uppercase',
                          background: `${PRIORITY_COLOR[pri]}18`,
                          color: PRIORITY_COLOR[pri],
                          border: `1px solid ${PRIORITY_COLOR[pri]}35`,
                        }}>{pri}</div>
                      )}
                    </div>
                  </Link>
                );
              })
            )}

            {allTasks.length > 5 && (
              <Link href="/orbit/tasks" style={{ textDecoration: 'none' }}>
                <button style={{
                  marginTop: 16, width: '100%', padding: 13,
                  background: t.deep, border: `1px solid ${t.bord}`,
                  borderRadius: 13, color: t.dim, fontSize: 12, cursor: 'pointer',
                }}>+{allTasks.length - 5} more tasks</button>
              </Link>
            )}
          </div>

          {/* Finance */}
          <div style={{ ...CARD, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 11, color: t.dim, letterSpacing: '0.04em', fontWeight: 600, marginBottom: 6 }}>Finance</div>
            <div style={{
              fontSize: 44, fontWeight: 700, lineHeight: 1, fontFamily: 'Georgia, serif',
              color: totalBalance !== null ? (totalBalance < 0 ? t.red : t.text) : t.dim,
              marginBottom: 6, marginTop: 8,
            }}>
              {totalBalance !== null ? `${totalBalance < 0 ? '–' : ''}₹${fmtBal(totalBalance)}` : '—'}
            </div>
            <div style={{ fontSize: 13, color: t.text2, marginBottom: 16 }}>Net position this month</div>

            {totalBalance !== null && totalBalance < 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                padding: '5px 12px', borderRadius: 8, marginBottom: 16, width: 'fit-content',
                background: `${t.red}18`, border: `1px solid ${t.red}35`, color: t.red,
              }}>↓ Net negative — review spending</div>
            )}

            {/* Sparkline placeholder */}
            <svg style={{ width: '100%', height: 44 }} viewBox="0 0 240 44" fill="none">
              <polyline points="0,34 40,28 80,32 120,20 160,24 200,14 240,18" stroke={`${t.red}4d`} strokeWidth="1.5" />
              <polyline points="0,34 40,28 80,32 120,20 160,24 200,14 240,18" stroke={t.red} strokeWidth="2" strokeDasharray="4 2" />
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '14px 0 20px' }}>
              {[
                { label: 'Accounts tracked', val: state.loadState === 'ready' ? `${state.accounts.length}` : '—', valColor: t.text },
                { label: 'Net worth trend',  val: '↑ 3%', valColor: t.green },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: t.text2 }}>{r.label}</span>
                  <span style={{ color: r.valColor, fontWeight: 600 }}>{r.val}</span>
                </div>
              ))}
            </div>

            <Link href="/orbit/finance" style={{ textDecoration: 'none', marginTop: 'auto' }}>
              <div style={{
                padding: 11, borderRadius: 12, textAlign: 'center',
                background: isDark ? 'rgba(0,229,160,0.07)' : 'rgba(0,184,122,0.07)',
                border: `1px solid ${isDark ? 'rgba(0,229,160,0.16)' : 'rgba(0,184,122,0.16)'}`,
                color: t.green, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>View Finance →</div>
            </Link>
          </div>
        </div>

        {/* ── Row 2: Health + Goals + Habits ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 20 }}>

          {/* Health */}
          <div style={CARD}>
            <div style={{ fontSize: 11, color: t.dim, letterSpacing: '0.04em', fontWeight: 600, marginBottom: 10 }}>Health</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Health ring */}
              <div style={{ position: 'relative', margin: '8px 0 16px' }}>
                <svg width="150" height="150" viewBox="0 0 150 150">
                  <defs><filter id="hglow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                  <circle cx="75" cy="75" r="62" fill="none" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'} strokeWidth="8"/>
                  <path d="M75,13 A62,62 0 0,1 127,44"  fill="none" stroke="#00E5A0" strokeWidth="8" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px rgba(0,229,160,0.6))' }}/>
                  <path d="M131,54 A62,62 0 0,1 125,103" fill="none" stroke="#A78BFA" strokeWidth="8" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px rgba(167,139,250,0.6))' }}/>
                  <path d="M119,113 A62,62 0 0,1 76,137"  fill="none" stroke="#F9A44A" strokeWidth="8" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px rgba(249,164,74,0.5))' }}/>
                  <path d="M55,136 A62,62 0 0,1 21,102"  fill="none" stroke="#5BE4FF" strokeWidth="8" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px rgba(91,228,255,0.5))' }}/>
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'Georgia, serif', color: t.text, lineHeight: 1 }}>
                    {healthLogged ? '✓' : '—'}
                  </div>
                  <div style={{ fontSize: 8, color: t.green, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 3 }}>Health</div>
                </div>
              </div>
              {/* Metrics chips */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
                {[
                  { label: 'Steps',   color: t.green,  pct: 72 },
                  { label: 'Sleep',   color: t.purple, pct: 81 },
                  { label: 'Protein', color: t.amber,  pct: 40 },
                  { label: 'Mood',    color: t.blue,   pct: 60 },
                ].map(m => (
                  <div key={m.label} style={{ background: t.deep, border: `1px solid ${t.bord}`, borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: t.dim, letterSpacing: '0.06em', marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: m.color, marginBottom: 4 }}>{m.pct}%</div>
                    <div style={{ height: 3, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: 99 }}>
                      <div style={{ height: '100%', width: `${m.pct}%`, background: m.color, borderRadius: 99, boxShadow: `0 0 5px ${m.color}80` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Goals */}
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Goals</div>
              <Link href="/orbit/goals" style={{ fontSize: 11, color: t.green, fontWeight: 600, textDecoration: 'none' }}>All →</Link>
            </div>

            {dataLoading ? (
              <div style={{ height: 80, background: t.bord, borderRadius: 8 }} />
            ) : activeGoals.length === 0 ? (
              <div style={{ fontSize: 13, color: t.dim, paddingTop: 16 }}>No active goals</div>
            ) : (
              activeGoals.slice(0, 2).map((g: any, i: number) => {
                const pct = g.targetValue ? Math.round((g.currentValue / g.targetValue) * 100) : 67;
                return (
                  <div key={g.id} style={{ padding: '16px 0', borderBottom: i < Math.min(activeGoals.length, 2) - 1 ? `1px solid ${t.bord}` : 'none' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 5 }}>{g.title?.slice(0, 28)}</div>
                    <div style={{ fontSize: 11, color: t.text2, marginBottom: 10 }}>
                      {g.deadline ? `${daysUntil(g.deadline)} days remaining · ${pct}% on track` : 'In progress'}
                    </div>
                    <div style={{ height: 4, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: 99, marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: t.indigo, borderRadius: 99, boxShadow: `0 0 6px ${t.indigo}80` }} />
                    </div>
                    <div style={{ fontSize: 10, color: t.dim }}>{pct}% complete</div>
                  </div>
                );
              })
            )}

            {nearestGoal && (
              <div style={{ marginTop: 14, padding: '12px 14px', background: t.deep, border: `1px solid ${t.bord}`, borderRadius: 13 }}>
                <div style={{ fontSize: 9, color: t.indigo, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5 }}>GOAL INSIGHT</div>
                <div style={{ fontSize: 12, color: t.text2, lineHeight: 1.55 }}>
                  Your daily consistency is strong. Keep the momentum going this week.
                </div>
              </div>
            )}
          </div>

          {/* Habits */}
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Habits</div>
              <Link href="/orbit/habits" style={{ fontSize: 11, color: t.green, fontWeight: 600, textDecoration: 'none' }}>All →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '16px 0 18px', borderBottom: `1px solid ${t.bord}`, marginBottom: 14 }}>
              <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'Georgia, serif', color: t.text, lineHeight: 1 }}>{doneCount}</div>
              <div style={{ fontSize: 13, color: t.text2 }}>of {todayHabits.length} complete today</div>
              {doneCount > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, marginTop: 6,
                  padding: '5px 14px', borderRadius: 99,
                  background: `${t.amber}1a`, border: `1px solid ${t.amber}35`, color: t.amber,
                }}>🔥 Keep the streak alive!</div>
              )}
            </div>
            {dataLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2].map(i => <div key={i} style={{ height: 36, background: t.bord, borderRadius: 8 }} />)}
              </div>
            ) : (
              todayHabits.slice(0, 3).map((h, i) => {
                const done = doneHabitIds.has(h.id);
                return (
                  <button key={h.id} onClick={() => toggleHabit(h.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                    borderBottom: i < Math.min(todayHabits.length, 3) - 1 ? `1px solid ${t.bord}` : 'none',
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{(h as any).emoji ?? h.iconEmoji ?? '✅'}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: done ? t.dim : t.text, textDecoration: done ? 'line-through' : 'none' }}>
                      {h.name}
                    </span>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? t.green : 'transparent',
                      border: done ? 'none' : `1.5px solid ${t.bord2}`,
                      transition: 'all 0.2s',
                    }}>
                      {done && <CheckCheck size={13} color="#000" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Row 3: Insights + Log Health ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Orbit Insights */}
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Orbit Insights</div>
              <Link href="/orbit/insights" style={{ fontSize: 11, color: t.green, fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
            </div>
            {[
              { tag: 'Finance',  tagColor: t.amber,  text: totalBalance !== null && totalBalance < 0 ? <><strong style={{ color: t.text }}>Net balance is negative.</strong> Review your spending and upcoming bills.</> : <><strong style={{ color: t.text }}>Finance is tracked</strong> across {state.accounts.length} accounts.</> },
              { tag: 'Health',   tagColor: t.purple, text: healthLogged ? <><strong style={{ color: t.text }}>Health logged today ✓</strong> — great job staying consistent.</> : <><strong style={{ color: t.text }}>No health log yet.</strong> Track steps, sleep & mood today.</> },
              { tag: 'Habits',   tagColor: t.red,    text: doneCount < todayHabits.length ? <>You&apos;re <strong style={{ color: t.text }}>at risk of missing</strong> habits today. Log before midnight.</> : <><strong style={{ color: t.text }}>All habits complete</strong> — excellent streak momentum!</> },
              { tag: 'Goals',    tagColor: t.indigo, text: nearestGoal ? <><strong style={{ color: t.text }}>{nearestGoal.title?.slice(0, 24)}</strong> is on track — {daysUntil(nearestGoal.deadline!)} days left.</> : <><strong style={{ color: t.text }}>Set a goal</strong> to start tracking your progress.</> },
            ].map((ins, i) => (
              <div key={ins.tag} style={{ padding: '16px 0', borderBottom: i < 3 ? `1px solid ${t.bord}` : 'none', cursor: 'pointer' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6, color: ins.tagColor }}>{ins.tag}</div>
                <div style={{ fontSize: 13, color: t.text2, lineHeight: 1.55 }}>{ins.text}</div>
              </div>
            ))}
          </div>

          {/* Log Health */}
          <div style={{ ...CARD }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: isDark ? 'rgba(255,107,107,0.1)' : 'rgba(224,52,52,0.08)',
              border: `1px solid ${isDark ? 'rgba(255,107,107,0.2)' : 'rgba(224,52,52,0.18)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, marginBottom: 18,
            }}>❤️</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: t.text, marginBottom: 8, fontFamily: 'Georgia, serif' }}>
              {healthLogged ? 'Health logged today ✓' : 'Log your health'}
            </div>
            <div style={{ fontSize: 13, color: t.text2, lineHeight: 1.6, marginBottom: 20 }}>
              {healthLogged
                ? 'Great work staying consistent. View your metrics and daily report.'
                : 'No health activity logged today. Keep your orbit complete by tracking the basics.'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {[
                { color: t.green,  label: 'Steps & activity' },
                { color: t.purple, label: 'Sleep quality' },
                { color: t.blue,   label: 'Mood & energy' },
                { color: t.amber,  label: 'Nutrition & water' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: t.text2,
                  padding: '10px 14px', background: t.deep, border: `1px solid ${t.bord}`, borderRadius: 12,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, boxShadow: `0 0 5px ${item.color}`, flexShrink: 0 }} />
                  {item.label}
                </div>
              ))}
            </div>
            <Link href="/orbit/health" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%', padding: 13, borderRadius: 13, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: isDark ? 'linear-gradient(135deg,rgba(255,107,107,0.15),rgba(255,107,107,0.05))' : 'linear-gradient(135deg,rgba(224,52,52,0.08),rgba(224,52,52,0.03))',
                border: `1px solid ${isDark ? 'rgba(255,107,107,0.2)' : 'rgba(224,52,52,0.2)'}`,
                color: t.red, textAlign: 'center',
              }}>
                {healthLogged ? 'View health metrics →' : 'Start health log →'}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Floating AI FAB ─────────────────────────────────────────────────────── */}
      <Link href="/orbit/insights" style={{ textDecoration: 'none' }}>
        <button style={{
          position: 'fixed', bottom: 32, right: 40, zIndex: 300,
          width: 56, height: 56, borderRadius: 18, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#00E5A0,#00c47a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 28px rgba(0,229,160,0.4)',
          transition: 'all 0.2s',
        }}>
          <Sparkles size={22} color="#000" />
        </button>
      </Link>

      <style>{`
        @keyframes orbitPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
