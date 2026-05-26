import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import {
  Wallet, Target, Heart, Flame, CheckSquare, ChartBar,
  Bell, Search, Sparkles, ChevronRight, CheckCheck,
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/authStore';
import { useModuleStore } from '@/lib/moduleStore';
import { getTodayTasks, getHabits, getGoals, logHabit } from '@myorbit/api';

// ── Dark theme ────────────────────────────────────────────────────────────────
const SB    = '#0a0f1e';
const BG    = '#0b1520';
const CARD  = '#111e2e';
const GREEN = '#00E5A0';
const BLUE  = '#5BE4FF';
const TXT   = '#e2e8f0';
const MUTED = '#7a8ba0';
const DIM   = '#3a5060';
const BORD  = '#1a2a3a';

// ── Module config ─────────────────────────────────────────────────────────────
const ALL_MODULES = [
  { key: 'tasks',    label: 'Tasks',    Icon: CheckSquare, color: '#2563EB', route: '/(tabs)/tasks'    },
  { key: 'habits',   label: 'Habits',   Icon: Flame,       color: '#D97706', route: '/(tabs)/habits'   },
  { key: 'health',   label: 'Health',   Icon: Heart,       color: '#E11D48', route: '/(tabs)/health'   },
  { key: 'finance',  label: 'Finance',  Icon: Wallet,      color: '#059669', route: '/(tabs)/finance'  },
  { key: 'goals',    label: 'Goals',    Icon: Target,      color: '#7C3AED', route: '/(tabs)/goals'    },
  { key: 'insights', label: 'Insights', Icon: ChartBar,    color: '#CA8A04', route: '/(tabs)/insights' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function buildSummaryText(habitsDone: number, habitsTotal: number, overdue: number) {
  const parts: string[] = [];
  if (habitsTotal > 0) {
    const pct = Math.round((habitsDone / habitsTotal) * 100);
    if (pct === 100) parts.push(`All ${habitsTotal} habits done — great work!`);
    else if (pct >= 50) parts.push(`Halfway through your habits — ${habitsDone}/${habitsTotal} done.`);
    else parts.push(`${habitsDone}/${habitsTotal} habits done so far today.`);
  }
  if (overdue > 0) {
    parts.push(`${overdue} overdue task${overdue > 1 ? 's' : ''} need attention.`);
  } else if (parts.length === 0) {
    parts.push('No overdue tasks — you\'re on track!');
  }
  return parts.join(' ');
}

function aiRecommendation(overdue: number, habitsDone: number, habitsTotal: number) {
  if (overdue > 0) return 'Clear your overdue tasks first — momentum builds from there.';
  if (habitsDone < habitsTotal) return 'Complete your remaining habits to close out today strong.';
  return 'You\'re crushing it today. Review your goals and set tomorrow\'s priorities.';
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const user           = useAuthStore((s) => s.user);
  const logout         = useAuthStore((s) => s.logout);
  const enabledModules = useModuleStore((s) => s.enabledModules);
  const visibleModules = ALL_MODULES.filter((m) => enabledModules.includes(m.key as any));

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const initials  = user?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) ?? 'M';

  const today = new Date().toISOString().split('T')[0];

  const { data: todayData, refetch: refetchTasks } = useQuery({
    queryKey: ['home-tasks'],
    queryFn: getTodayTasks,
    staleTime: 0,
  });

  const { data: habitsRaw = [], refetch: refetchHabits } = useQuery({
    queryKey: ['home-habits'],
    queryFn: getHabits,
    staleTime: 0,
  });

  const { data: goals = [], refetch: refetchGoals } = useQuery({
    queryKey: ['home-goals'],
    queryFn: getGoals,
    staleTime: 0,
  });

  useFocusEffect(useCallback(() => {
    void refetchTasks();
    void refetchHabits();
    void refetchGoals();
  }, [refetchTasks, refetchHabits, refetchGoals]));

  // Habits
  const todayDow      = new Date().getDay();
  const activeHabits  = habitsRaw.filter((h) => {
    if (!h.isActive) return false;
    try {
      const days: number[] = JSON.parse((h as any).daysOfWeek ?? '[0,1,2,3,4,5,6]');
      return days.includes(todayDow);
    } catch { return true; }
  });

  const [doneHabitIds, setDoneHabitIds] = useState<Set<string>>(new Set());
  React.useEffect(() => {
    setDoneHabitIds(new Set(habitsRaw.filter(h => h.logs?.some(l => l.logDate === today)).map(h => h.id)));
  }, [habitsRaw, today]);

  const habitsDone  = activeHabits.filter(h => doneHabitIds.has(h.id)).length;
  const habitsTotal = activeHabits.length;
  const habitPct    = habitsTotal > 0 ? Math.round((habitsDone / habitsTotal) * 100) : 0;

  const handleToggleHabit = useCallback(async (habitId: string) => {
    const wasDone = doneHabitIds.has(habitId);
    setDoneHabitIds(prev => { const n = new Set(prev); wasDone ? n.delete(habitId) : n.add(habitId); return n; });
    try {
      await logHabit(habitId, today);
    } catch {
      setDoneHabitIds(prev => { const n = new Set(prev); wasDone ? n.add(habitId) : n.delete(habitId); return n; });
    }
  }, [doneHabitIds, today]);

  // Tasks
  const overdueTasks  = todayData?.overdue ?? [];
  const todayTasks    = todayData?.today   ?? [];
  const allFocusTasks = [...overdueTasks, ...todayTasks];

  // Goals
  const activeGoals = (goals as any[]).filter((g) => g.status === 'active');
  const nearestGoal = activeGoals
    .filter((g) => g.deadline)
    .sort((a: any, b: any) => (a.deadline < b.deadline ? -1 : 1))[0];

  const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

  const summaryText      = buildSummaryText(habitsDone, habitsTotal, overdueTasks.length);
  const recommendation   = aiRecommendation(overdueTasks.length, habitsDone, habitsTotal);
  const orbitScore       = Math.round((habitPct * 0.5) + (overdueTasks.length === 0 ? 30 : 10) + (activeGoals.length > 0 ? 20 : 0));
  const scoreLabel       = orbitScore >= 80 ? 'Excellent' : orbitScore >= 60 ? 'Good' : 'Keep Going';
  const ringR            = 28;
  const ringCirc         = 2 * Math.PI * ringR;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const PRIORITY_COLOR: Record<string, string> = {
    high: '#EF4444', urgent: '#EF4444', medium: '#F59E0B', low: GREEN, none: MUTED,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      {/* ── Sticky Topbar ── */}
      <View style={s.topbar}>
        <View style={s.logoMark}>
          <Text style={s.logoText}>M</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: TXT }}>{greeting()}, {firstName}</Text>
          <Text style={{ fontSize: 10, color: DIM, marginTop: 1 }}>{formatDate()}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.iconBtn}>
            <Bell size={16} color={MUTED} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/(tabs)/settings' as any)}>
            <Search size={16} color={MUTED} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={s.avatarBtn}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>{initials}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ── */}
        <View style={s.heroCard}>
          {/* Tag */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <View style={s.aiTag}>
              <Sparkles size={11} color={GREEN} />
              <Text style={{ fontSize: 10, color: GREEN, fontWeight: '700', letterSpacing: 1, marginLeft: 5 }}>DAILY ORBIT · AI SUMMARY</Text>
            </View>
            <View style={s.pulseDot} />
          </View>

          {/* Summary text */}
          <Text style={{ fontSize: 16, fontWeight: '700', color: TXT, lineHeight: 24, marginBottom: 14 }}>
            {summaryText}
          </Text>

          {/* Bullets */}
          <View style={{ gap: 8, marginBottom: 14 }}>
            {habitsTotal > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN }} />
                <Text style={{ fontSize: 13, color: MUTED }}>{habitsDone}/{habitsTotal} habits complete today</Text>
              </View>
            )}
            {overdueTasks.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
                <Text style={{ fontSize: 13, color: MUTED }}>{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''} need attention</Text>
              </View>
            )}
            {nearestGoal && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#818CF8' }} />
                <Text style={{ fontSize: 13, color: MUTED }} numberOfLines={1}>
                  Goal &ldquo;{nearestGoal.title?.slice(0, 24)}&rdquo; in {daysUntil(nearestGoal.deadline)}d
                </Text>
              </View>
            )}
          </View>

          {/* Recommendation box */}
          <View style={s.recBox}>
            <Text style={{ fontSize: 9, color: GREEN, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>AI Recommendation</Text>
            <Text style={{ fontSize: 12, color: '#b2d8c8', lineHeight: 18 }}>{recommendation}</Text>
          </View>

          {/* CTA buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/insights')}
              style={s.ctaPrimary}
              activeOpacity={0.85}
            >
              <Sparkles size={13} color='#000' />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#000', marginLeft: 6 }}>Full Insights</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/tasks')}
              style={s.ctaSecondary}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: TXT }}>Today&apos;s Tasks →</Text>
            </TouchableOpacity>
          </View>

          {/* Score row */}
          <View style={s.scoreRow}>
            <View>
              <Text style={{ fontSize: 36, fontWeight: '700', color: TXT, lineHeight: 40 }}>{orbitScore}</Text>
              <Text style={{ fontSize: 9, color: GREEN, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>{scoreLabel}</Text>
            </View>
            {/* Mini ring */}
            <View style={{ width: 72, height: 72 }}>
              <View style={StyleSheet.absoluteFill}>
                {/* Background ring (simulated with border) */}
                <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 7, borderColor: BORD, position: 'absolute' }} />
              </View>
              <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: GREEN }}>{orbitScore}</Text>
              </View>
            </View>
            {/* Mini breakdown */}
            <View style={{ gap: 6, flex: 1, marginLeft: 14 }}>
              {[
                { label: 'Habits',  value: `${habitsDone}/${habitsTotal}`, color: GREEN },
                { label: 'Tasks',   value: `${allFocusTasks.length}`,      color: BLUE },
                { label: 'Goals',   value: `${activeGoals.length}`,        color: '#818CF8' },
              ].map(row => (
                <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: row.color }} />
                    <Text style={{ fontSize: 10, color: MUTED }}>{row.label}</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: TXT }}>{row.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Module Strip ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          {visibleModules.map((m) => {
            const Icon = m.Icon;
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => router.push(m.route as any)}
                activeOpacity={0.75}
                style={[s.modulePill, { borderColor: `${m.color}40` }]}
              >
                <Icon size={13} color={m.color} />
                <Text style={{ fontSize: 12, color: TXT, fontWeight: '600', marginLeft: 6 }}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Today's Focus ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View>
              <Text style={s.cardTitle}>Today&apos;s Focus</Text>
              {allFocusTasks.length > 0 && (
                <Text style={s.cardSub}>{overdueTasks.length > 0 ? `${overdueTasks.length} overdue · ` : ''}{allFocusTasks.length} total</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 11, color: GREEN, fontWeight: '600' }}>All tasks</Text>
              <ChevronRight size={13} color={GREEN} />
            </TouchableOpacity>
          </View>

          {allFocusTasks.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontSize: 13, color: MUTED }}>No tasks for today 🎉</Text>
            </View>
          ) : (
            allFocusTasks.slice(0, 5).map((t: any, i: number) => {
              const isOverdue = overdueTasks.some((o: any) => o.id === t.id);
              const priority  = t.task?.priority ?? 'none';
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => router.push('/(tabs)/tasks')}
                  activeOpacity={0.7}
                  style={[s.taskRow, { borderTopWidth: i === 0 ? 0 : 1 }]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isOverdue ? '#EF4444' : DIM, width: 18, textAlign: 'center' }}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: TXT }} numberOfLines={1}>{t.task?.title ?? 'Task'}</Text>
                    {isOverdue && <Text style={{ fontSize: 10, color: '#EF4444', marginTop: 1 }}>Overdue</Text>}
                  </View>
                  {priority !== 'none' && (
                    <Text style={{ fontSize: 10, fontWeight: '700', color: PRIORITY_COLOR[priority] ?? MUTED, textTransform: 'uppercase' }}>{priority}</Text>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Today's Habits ── */}
        {activeHabits.length > 0 && (
          <View style={[s.card, { marginTop: 12 }]}>
            <View style={s.cardHeader}>
              <View>
                <Text style={s.cardTitle}>Today&apos;s Habits</Text>
                <Text style={s.cardSub}>{habitsDone} of {habitsTotal} complete</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/habits')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={{ fontSize: 11, color: GREEN, fontWeight: '600' }}>All habits</Text>
                <ChevronRight size={13} color={GREEN} />
              </TouchableOpacity>
            </View>

            {/* Progress bar */}
            <View style={{ height: 4, backgroundColor: BORD, borderRadius: 4, marginBottom: 14, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${habitPct}%`, backgroundColor: GREEN, borderRadius: 4 }} />
            </View>

            {activeHabits.slice(0, 5).map((habit, i) => {
              const done = doneHabitIds.has(habit.id);
              return (
                <TouchableOpacity
                  key={habit.id}
                  onPress={() => handleToggleHabit(habit.id)}
                  activeOpacity={0.7}
                  style={[s.habitRow, { borderTopWidth: i === 0 ? 0 : 1 }]}
                >
                  <Text style={{ fontSize: 18, lineHeight: 22 }}>{(habit as any).emoji ?? (habit as any).iconEmoji ?? '✅'}</Text>
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: done ? DIM : TXT, textDecorationLine: done ? 'line-through' : 'none', marginLeft: 10 }}>
                    {habit.name}
                  </Text>
                  <View style={[s.habitCheck, done && s.habitCheckDone]}>
                    {done && <CheckCheck size={11} color='#000' />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Goals Card ── */}
        {activeGoals.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/goals')} activeOpacity={0.8} style={[s.card, { marginTop: 12 }]}>
            <View style={s.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={15} color='#7C3AED' />
                </View>
                <Text style={s.cardTitle}>Goals</Text>
              </View>
              <ChevronRight size={14} color={DIM} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: TXT, marginTop: 4, marginBottom: 4 }}>{activeGoals.length}</Text>
            <Text style={{ fontSize: 11, color: MUTED }}>
              {nearestGoal
                ? `${nearestGoal.title?.slice(0, 28)} · ${daysUntil(nearestGoal.deadline)}d left`
                : 'Active goals in progress'}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Orbit Insights Feed ── */}
        <View style={[s.card, { marginTop: 12 }]}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Orbit Insights</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/insights')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 11, color: GREEN, fontWeight: '600' }}>View all</Text>
              <ChevronRight size={13} color={GREEN} />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 14 }}>
            {habitsTotal > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: `${GREEN}18`, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  <Flame size={13} color={GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: TXT }}>Habit streak</Text>
                  <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{habitsDone}/{habitsTotal} completed · {habitPct}% done today</Text>
                </View>
              </View>
            )}
            {activeGoals.length > 0 && nearestGoal && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  <Target size={13} color='#7C3AED' />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: TXT }}>{nearestGoal.title?.slice(0, 30)}</Text>
                  <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{daysUntil(nearestGoal.deadline)} days until deadline</Text>
                </View>
              </View>
            )}
            {overdueTasks.length === 0 && allFocusTasks.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: `${BLUE}18`, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  <CheckSquare size={13} color={BLUE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: TXT }}>Tasks on track</Text>
                  <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>No overdue tasks · {allFocusTasks.length} total scheduled</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Log Health Banner ── */}
        <TouchableOpacity onPress={() => router.push('/(tabs)/health')} activeOpacity={0.85} style={s.healthBanner}>
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(225,29,72,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={20} color='#E11D48' />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: TXT, marginBottom: 3 }}>Log your health today</Text>
            <Text style={{ fontSize: 12, color: MUTED }}>Track steps, sleep, water & mood →</Text>
          </View>
          <ChevronRight size={16} color={DIM} />
        </TouchableOpacity>

      </ScrollView>

      {/* ── Floating AI FAB ── */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/insights')}
        activeOpacity={0.85}
        style={s.fab}
      >
        <Sparkles size={22} color='#000' />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  topbar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SB, borderBottomWidth: 1, borderBottomColor: BORD,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  logoMark: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#00E5A0',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 16, fontWeight: '800', color: '#000' },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#0e1623', borderWidth: 1, borderColor: BORD,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#6366F1',
    alignItems: 'center', justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: '#071a12', borderWidth: 1, borderColor: '#143322',
    borderRadius: 20, padding: 20, marginBottom: 14,
  },
  aiTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,229,160,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,160,0.22)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  pulseDot: {
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: GREEN,
    shadowColor: GREEN, shadowOpacity: 0.7, shadowRadius: 4,
  },
  recBox: {
    backgroundColor: 'rgba(0,229,160,0.06)', borderWidth: 1, borderColor: 'rgba(0,229,160,0.15)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  ctaPrimary: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: GREEN, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, flex: 1,
  },
  ctaSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: BORD,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flex: 1,
  },
  scoreRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 14,
    padding: 14, gap: 12,
    borderWidth: 1, borderColor: BORD,
  },
  modulePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD, borderWidth: 1,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORD,
    borderRadius: 16, padding: 16,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: TXT },
  cardSub:   { fontSize: 10, color: DIM, marginTop: 2 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderTopColor: BORD,
  },
  habitRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderTopColor: BORD,
  },
  habitCheck: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: BORD,
    alignItems: 'center', justifyContent: 'center',
  },
  habitCheckDone: { backgroundColor: GREEN, borderWidth: 0 },
  healthBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(225,29,72,0.08)', borderWidth: 1, borderColor: 'rgba(225,29,72,0.2)',
    borderRadius: 16, padding: 16, marginTop: 12,
  },
  fab: {
    position: 'absolute', right: 20, bottom: 90,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GREEN, shadowOpacity: 0.5, shadowRadius: 14, elevation: 10,
  },
});
