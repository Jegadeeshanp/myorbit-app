import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHabits, logHabit, createHabit, updateHabit, deleteHabit } from '@myorbit/api';
import type { Habit } from '@myorbit/api';
import {
  Flame, Plus, CheckCircle, Circle, Trash2, Pencil,
  LayoutDashboard, CalendarDays, Timer, CalendarClock,
  MoreHorizontal, X, Settings, Search, Menu,
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/authStore';
import Svg, { Circle as SvgCircle, Rect, Text as SvgText } from 'react-native-svg';

type SubTab = 'dashboard' | 'calendar' | 'focus' | 'countdown' | 'streaks';

const ACCENT   = '#10B981';
const SURFACE  = '#1A1A1A';
const SURFACE2 = '#242424';
const BORDER   = '#2A2A2A';
const MUTED    = '#9CA3AF';

const SUB_TABS = [
  { key: 'dashboard' as SubTab, label: 'Dashboard', Icon: LayoutDashboard },
  { key: 'calendar'  as SubTab, label: 'Calendar',  Icon: CalendarDays },
  { key: 'focus'     as SubTab, label: 'Focus',     Icon: Timer },
  { key: 'countdown' as SubTab, label: 'Countdown', Icon: CalendarClock },
];

const HEADER_TITLES: Record<SubTab, string> = {
  dashboard: 'Dashboard',
  calendar:  'Calendar',
  focus:     'Focus Timer',
  countdown: 'Countdowns',
  streaks:   'Streaks',
};

const EMOJIS = ['✅','🔥','💪','📚','🧘','🏃','💧','🥗','😴','🎯','✍️','🎵','🎨','🏋️','☕','🚶','🧠','💊','🌅','🛌'];
const COLORS  = ['#10B981','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#EC4899','#14B8A6','#F97316','#6366F1','#78716C'];
const DAYS    = ['S','M','T','W','T','F','S'];

function getLast7() {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dates.push(d.toLocaleDateString('en-CA'));
  }
  return dates;
}

function streak(habit: Habit): number {
  if (!habit.logs?.length) return 0;
  const today = new Date().toLocaleDateString('en-CA');
  let count = 0; let cursor = new Date();
  while (true) {
    const ds = cursor.toLocaleDateString('en-CA');
    const logged = habit.logs.some((l) => l.logDate === ds);
    if (!logged) { if (ds === today) { cursor.setDate(cursor.getDate() - 1); continue; } break; }
    count++; cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

// ── MyOrbit Logo SVG ───────────────────────────────────────────────────────────

function MyOrbitLogo() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32">
      <Rect width={32} height={32} rx={8} fill="#7C3AED" />
      <SvgCircle cx={16} cy={16} r={7} stroke="white" strokeWidth={2.5} fill="none" />
      <SvgCircle cx={16} cy={9} r={2.5} fill="white" />
    </Svg>
  );
}

// ── Sub Nav ────────────────────────────────────────────────────────────────────

function SubNav({ active, onSelect, onMore }: { active: SubTab; onSelect: (t: SubTab) => void; onMore: () => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: BORDER }}>
      {SUB_TABS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <TouchableOpacity key={key} onPress={() => onSelect(key)}
            style={{ flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: isActive ? ACCENT + '22' : 'transparent' }}>
              <Icon size={16} color={isActive ? ACCENT : MUTED} />
            </View>
            <Text style={{ fontSize: 10, fontWeight: '500', color: isActive ? ACCENT : MUTED, marginTop: 2 }}>{label}</Text>
            {isActive && <View style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, backgroundColor: ACCENT, borderRadius: 1 }} />}
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity onPress={onMore} style={{ width: 48, alignItems: 'center', paddingTop: 10, paddingBottom: 8 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
          <MoreHorizontal size={16} color={MUTED} />
        </View>
        <Text style={{ fontSize: 10, fontWeight: '500', color: MUTED, marginTop: 2 }}>More</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── More Sheet ─────────────────────────────────────────────────────────────────

function MoreSheet({ visible, onClose, onStreaks, userName }: {
  visible: boolean; onClose: () => void; onStreaks: () => void; userName: string;
}) {
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 }}>
        <View style={{ width: 40, height: 4, backgroundColor: '#3A3A3A', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />

        {/* User header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }} numberOfLines={1}>{userName}</Text>
            <Text style={{ fontSize: 12, color: MUTED }}>Personal account</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color={MUTED} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 1, backgroundColor: BORDER, marginHorizontal: 16 }} />

        {/* Streaks */}
        <TouchableOpacity onPress={() => { onStreaks(); onClose(); }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
          <Flame size={16} color={MUTED} />
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#E5E7EB' }}>Streaks</Text>
        </TouchableOpacity>

        <View style={{ height: 1, backgroundColor: BORDER, marginHorizontal: 16 }} />

        {/* Settings */}
        <TouchableOpacity onPress={() => { onClose(); router.push('/(tabs)/settings' as any); }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
          <Settings size={16} color={MUTED} />
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#E5E7EB' }}>Settings</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Habit Card ─────────────────────────────────────────────────────────────────

function HabitCard({ habit, today, last7, onLog, onEdit, onDelete }: {
  habit: Habit; today: string; last7: string[];
  onLog: (id: string) => void; onEdit: (h: Habit) => void; onDelete: (id: string) => void;
}) {
  const doneToday = habit.logs?.some((l) => l.logDate === today) ?? false;
  const s = streak(habit);
  const color = habit.color ?? ACCENT;
  return (
    <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: color, elevation: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <Text style={{ fontSize: 26 }}>{habit.iconEmoji ?? '✅'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>{habit.name}</Text>
            {s > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <Flame size={11} color="#F59E0B" />
                <Text style={{ fontSize: 12, color: '#F59E0B', fontWeight: '500' }}>{s} day streak</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity onPress={() => onEdit(habit)} style={{ padding: 5, borderRadius: 8, backgroundColor: SURFACE2 }}>
            <Pencil size={13} color={MUTED} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onLog(habit.id)}>
            {doneToday ? <CheckCircle size={28} color={color} /> : <Circle size={28} color="#D1D5DB" />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(habit.id)} style={{ padding: 4 }}>
            <Trash2 size={15} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      {/* 7-day dots */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {last7.map((d) => {
          const logged = habit.logs?.some((l) => l.logDate === d) ?? false;
          return (
            <View key={d} style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: logged ? color : SURFACE2 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: logged ? 'white' : '#D1D5DB' }}>
                {new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Calendar View ──────────────────────────────────────────────────────────────

function CalendarView({ habits }: { habits: Habit[] }) {
  const last30: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    last30.push(d.toLocaleDateString('en-CA'));
  }
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#E5E7EB', marginBottom: 16 }}>Last 30 Days</Text>
      {habits.map((habit) => {
        const color = habit.color ?? ACCENT;
        return (
          <View key={habit.id} style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 12, elevation: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Text style={{ fontSize: 18 }}>{habit.iconEmoji ?? '✅'}</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>{habit.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {last30.map((d) => {
                const logged = habit.logs?.some((l) => l.logDate === d) ?? false;
                return <View key={d} style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: logged ? color : SURFACE2 }} />;
              })}
            </View>
          </View>
        );
      })}
      {habits.length === 0 && (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: MUTED }}>No habits to display</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Streaks View ───────────────────────────────────────────────────────────────

function StreaksView({ habits }: { habits: Habit[] }) {
  const sorted = [...habits].sort((a, b) => streak(b) - streak(a));
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#E5E7EB', marginBottom: 16 }}>Habit Consistency</Text>
      {sorted.map((habit) => {
        const s = streak(habit);
        const color = habit.color ?? ACCENT;
        const best = habit.logs?.length ?? 0;
        return (
          <View key={habit.id} style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 24 }}>{habit.iconEmoji ?? '✅'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>{habit.name}</Text>
              <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{best} total logs</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Flame size={14} color={s > 0 ? '#F59E0B' : MUTED} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: s > 0 ? color : MUTED }}>{s}</Text>
              </View>
              <Text style={{ fontSize: 10, color: MUTED }}>streak</Text>
            </View>
          </View>
        );
      })}
      {sorted.length === 0 && (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: MUTED }}>No habits yet</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Focus Timer ────────────────────────────────────────────────────────────────

function FocusView() {
  const [seconds, setSeconds]   = useState(25 * 60);
  const [running, setRunning]   = useState(false);
  const [duration, setDuration] = useState(25);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(id); setRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct  = seconds / (duration * 60);
  const toggle = () => setRunning(r => !r);
  const reset  = () => { setRunning(false); setSeconds(duration * 60); };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#E5E7EB', marginBottom: 24 }}>Focus Timer</Text>
      <View style={{ width: 200, height: 200, borderRadius: 100, borderWidth: 8, borderColor: ACCENT + '33', backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', marginBottom: 32, elevation: 4 }}>
        <View style={{ position: 'absolute', width: 184, height: 184, borderRadius: 92, borderWidth: 8, borderColor: ACCENT, borderTopColor: 'transparent', transform: [{ rotate: `${(1 - pct) * 360}deg` }] }} />
        <Text style={{ fontSize: 40, fontWeight: '700', color: '#FFFFFF' }}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </Text>
        <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Focus session</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 32 }}>
        {[15, 25, 45, 60].map((m) => (
          <TouchableOpacity key={m} onPress={() => { setDuration(m); setSeconds(m * 60); setRunning(false); }}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: duration === m ? ACCENT : SURFACE2 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: duration === m ? 'white' : MUTED }}>{m}m</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <TouchableOpacity onPress={reset} style={{ paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: MUTED }}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggle} style={{ paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, backgroundColor: running ? '#EF4444' : ACCENT }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>{running ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Habit Modal (Add + Edit) ───────────────────────────────────────────────────

function HabitModal({ visible, initial, onClose, onSave }: {
  visible: boolean; initial?: Habit | null; onClose: () => void; onSave: (data: Partial<Habit>) => void;
}) {
  const isEdit = !!initial;
  const [name, setName]   = useState('');
  const [emoji, setEmoji] = useState('✅');
  const [color, setColor] = useState(ACCENT);
  const [days, setDays]   = useState<number[]>([0,1,2,3,4,5,6]);

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setName(initial.name);
      setEmoji(initial.iconEmoji ?? '✅');
      setColor(initial.color ?? ACCENT);
      setDays(Array.isArray(initial.daysOfWeek) ? initial.daysOfWeek : [0,1,2,3,4,5,6]);
    } else {
      setName(''); setEmoji('✅'); setColor(ACCENT); setDays([0,1,2,3,4,5,6]);
    }
  }, [visible, initial?.id]);

  const toggleDay = (d: number) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

  const save = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), iconEmoji: emoji, color, daysOfWeek: days, isActive: true, goalPerDay: 1, isCountBased: false });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, maxHeight: '88%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#3A3A3A', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 }}>{isEdit ? 'Edit Habit' : 'New Habit'}</Text>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>Name</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#FFFFFF', marginBottom: 16 }}
              placeholder="e.g. Morning run" placeholderTextColor={MUTED}
              value={name} onChangeText={setName} autoFocus={!isEdit}
            />
            <Text style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {EMOJIS.map(e => (
                  <TouchableOpacity key={e} onPress={() => setEmoji(e)}
                    style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: emoji === e ? ACCENT + '22' : SURFACE2, borderWidth: emoji === e ? 1.5 : 0, borderColor: ACCENT }}>
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>Color</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => setColor(c)}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: 'white' }} />
              ))}
            </View>
            <Text style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>Days</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {DAYS.map((d, i) => (
                <TouchableOpacity key={i} onPress={() => toggleDay(i)}
                  style={{ flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: days.includes(i) ? ACCENT : SURFACE2 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: days.includes(i) ? 'white' : MUTED }}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: MUTED }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save} disabled={!name.trim()}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: name.trim() ? 1 : 0.5 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>{isEdit ? 'Save' : 'Add Habit'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function HabitsScreen() {
  const [activeTab, setActiveTab] = useState<SubTab>('dashboard');
  const [showAdd, setShowAdd]     = useState(false);
  const [showMore, setShowMore]   = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const user = useAuthStore((s) => s.user);
  const userName = user?.name ?? 'User';

  const qc = useQueryClient();
  const today = new Date().toLocaleDateString('en-CA');
  const last7 = getLast7();

  const { data: habits = [], isLoading, refetch } =
    useQuery({ queryKey: ['habits'], queryFn: getHabits });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['habits'] });
  const onMutateError = () => Alert.alert('Error', 'Something went wrong. Please try again.');

  const logMut    = useMutation({ mutationFn: ({ id }: { id: string }) => logHabit(id, today), onSuccess: invalidate, onError: onMutateError });
  const deleteMut = useMutation({ mutationFn: deleteHabit,  onSuccess: invalidate, onError: onMutateError });
  const createMut = useMutation({ mutationFn: createHabit,  onSuccess: invalidate, onError: onMutateError });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Habit> }) => updateHabit(id, data),
    onSuccess: invalidate,
    onError: onMutateError,
  });

  const handleDelete = (id: string) => {
    const h = habits.find(x => x.id === id);
    Alert.alert('Delete Habit', `Delete "${h?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(id) },
    ]);
  };

  const handleTabSelect = (t: SubTab) => { setActiveTab(t); setSearchQuery(''); };

  const activeHabits  = habits.filter(h => h.isActive);
  const filteredHabits = searchQuery
    ? activeHabits.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeHabits;

  const doneToday = activeHabits.filter(h => h.logs?.some(l => l.logDate === today)).length;
  const totalXP   = activeHabits.reduce((s, h) => s + streak(h) * 10, 0);
  const topStreak = Math.max(0, ...activeHabits.map(h => streak(h)));

  const canAddHabit = activeTab === 'dashboard' || activeTab === 'streaks';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111111' }} edges={['top']}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, backgroundColor: '#111111' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <TouchableOpacity onPress={() => setShowMore(true)}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' }}>
            <Menu size={20} color="#E5E7EB" />
          </TouchableOpacity>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={18} color="#F59E0B" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFFFFF' }} numberOfLines={1}>
            {HEADER_TITLES[activeTab]}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/' as any)} activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 6 }}>
          <MyOrbitLogo />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>MyOrbit</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search bar + Add button ───────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 14, paddingBottom: 10, backgroundColor: '#111111', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 9, gap: 8 }}>
          <Search size={15} color={MUTED} />
          <TextInput
            style={{ flex: 1, fontSize: 14, color: '#FFFFFF' }}
            placeholder="Search habits…"
            placeholderTextColor={MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}><X size={15} color={MUTED} /></TouchableOpacity>
          )}
        </View>
        {canAddHabit && (
          <TouchableOpacity onPress={() => setShowAdd(true)}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <View style={{ flex: 1 }}>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {/* Stats */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginVertical: 14 }}>
              {[
                { label: 'Done Today', val: `${doneToday}/${activeHabits.length}`, color: ACCENT,     emoji: '✅' },
                { label: 'Streak XP',  val: String(totalXP),                       color: '#F59E0B', emoji: '⚡' },
                { label: 'Top Streak', val: `${topStreak}d`,                        color: '#EF4444', emoji: '🔥' },
              ].map((s) => (
                <View key={s.label} style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 16, padding: 12, alignItems: 'center', elevation: 2 }}>
                  <Text style={{ fontSize: 18, marginBottom: 4 }}>{s.emoji}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: s.color }}>{s.val}</Text>
                  <Text style={{ fontSize: 11, color: MUTED, marginTop: 2, textAlign: 'center' }}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Habits list */}
            <View style={{ paddingHorizontal: 16 }}>
              {isLoading ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}><ActivityIndicator size="large" color={ACCENT} /></View>
              ) : activeHabits.length === 0 ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>🔥</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB' }}>No habits yet</Text>
                  <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Tap + to add your first habit</Text>
                </View>
              ) : filteredHabits.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: MUTED }}>No habits match "{searchQuery}"</Text>
                </View>
              ) : (
                <>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>All Habits</Text>
                  {filteredHabits.map(h => (
                    <HabitCard key={h.id} habit={h} today={today} last7={last7}
                      onLog={(id) => logMut.mutate({ id })}
                      onEdit={setEditHabit}
                      onDelete={handleDelete} />
                  ))}
                </>
              )}
            </View>
          </ScrollView>
        )}

        {/* CALENDAR */}
        {activeTab === 'calendar' && <CalendarView habits={activeHabits} />}

        {/* FOCUS */}
        {activeTab === 'focus' && <FocusView />}

        {/* COUNTDOWN */}
        {activeTab === 'countdown' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>⏳</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB' }}>Countdowns</Text>
            <Text style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>Coming soon</Text>
          </View>
        )}

        {/* STREAKS */}
        {activeTab === 'streaks' && <StreaksView habits={activeHabits} />}

      </View>

      {/* Bottom Nav */}
      <SubNav active={activeTab} onSelect={handleTabSelect} onMore={() => setShowMore(true)} />

      {/* Add Habit */}
      <HabitModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={data => createMut.mutate(data)}
      />

      {/* Edit Habit */}
      <HabitModal
        visible={!!editHabit}
        initial={editHabit}
        onClose={() => setEditHabit(null)}
        onSave={data => { if (editHabit) updateMut.mutate({ id: editHabit.id, data }); }}
      />

      <MoreSheet
        visible={showMore}
        onClose={() => setShowMore(false)}
        onStreaks={() => handleTabSelect('streaks')}
        userName={userName}
      />
    </SafeAreaView>
  );
}
