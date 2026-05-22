import { useState, useCallback, useMemo } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Modal, KeyboardAvoidingView, Platform, Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHealthEntry, upsertHealthEntry, getWorkouts, createWorkout, deleteWorkout } from '@myorbit/api';
import type { HealthEntry, Workout } from '@myorbit/api';
import Svg, {
  Circle as SvgCircle, Path, Text as SvgText, G,
} from 'react-native-svg';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Save,
  LayoutDashboard, Dumbbell, UtensilsCrossed, RefreshCw,
  X, Settings, Heart,
  Footprints, Moon, Droplets, Scale, Smile, Zap, HeartPulse,
  CheckCircle, AlertCircle, Flame, TrendingUp,
} from 'lucide-react-native';
import AppHeader from '@/components/shared/AppHeader';
import { useTheme } from '@/lib/themeStore';
import healthSync from '@/lib/healthSync';

function useC() {
  const T = useTheme();
  return { BG: T.bg, CARD: T.cardBg, MODAL: T.modalBg, SURF: T.surface, SALF: T.surfaceAlt ?? T.surface, BORD: T.border, TXT: T.text, TXT2: T.textSec, SUB: T.subText, DIM: T.mutedText ?? T.subText, INPUT: T.inputBg };
}

type SubTab = 'dashboard' | 'workouts' | 'nutrition' | 'sync';

const ACCENT = '#EF4444';

const SUB_TABS = [
  { key: 'dashboard' as SubTab, label: 'Dashboard', Icon: LayoutDashboard },
  { key: 'workouts'  as SubTab, label: 'Workouts',  Icon: Dumbbell },
  { key: 'nutrition' as SubTab, label: 'Nutrition', Icon: UtensilsCrossed },
  { key: 'sync'      as SubTab, label: 'Sync',      Icon: RefreshCw },
];

const METRICS = [
  { key: 'steps',       label: 'Steps',      unit: 'steps', Icon: Footprints, color: '#3B82F6', keyboard: 'numeric',      target: 10000 },
  { key: 'sleepHours',  label: 'Sleep',      unit: 'hrs',   Icon: Moon,       color: '#8B5CF6', keyboard: 'decimal-pad',   target: 8 },
  { key: 'waterMl',     label: 'Water',      unit: 'ml',    Icon: Droplets,   color: '#06B6D4', keyboard: 'numeric',      target: 2500 },
  { key: 'weightKg',    label: 'Weight',     unit: 'kg',    Icon: Scale,      color: '#F59E0B', keyboard: 'decimal-pad',   target: null },
  { key: 'mood',        label: 'Mood',       unit: '/5',    Icon: Smile,      color: '#EC4899', keyboard: 'numeric',      target: 5 },
  { key: 'energyLevel', label: 'Energy',     unit: '/10',   Icon: Zap,        color: '#10B981', keyboard: 'numeric',      target: 10 },
  { key: 'heartRate',   label: 'Heart Rate', unit: 'bpm',   Icon: HeartPulse, color: '#EF4444', keyboard: 'numeric',      target: null },
];

const WORKOUT_TYPES = ['running','cycling','strength','yoga','sports','other'] as const;

const WORKOUT_ICONS: Record<string, string> = {
  running: '🏃', cycling: '🚴', strength: '🏋️', yoga: '🧘', sports: '⚽', other: '💪',
};

// ── OrbitMini — 5-arc health ring ─────────────────────────────────────────────

function OrbitMini({ entry, size = 130 }: { entry?: Partial<HealthEntry> | null; size?: number }) {
  const cx = size / 2;
  const arcs = [
    { key: 'steps',       color: '#3B82F6', target: 10000, label: 'Steps'    },
    { key: 'energyLevel', color: '#10B981', target: 10,    label: 'Energy'   },
    { key: 'sleepHours',  color: '#8B5CF6', target: 8,     label: 'Sleep'    },
    { key: 'waterMl',     color: '#06B6D4', target: 2500,  label: 'Water'    },
    { key: 'mood',        color: '#EC4899', target: 5,     label: 'Mood'     },
  ];

  const score = useMemo(() => {
    if (!entry) return 0;
    let filled = 0;
    arcs.forEach(a => {
      const val = (entry as any)[a.key];
      if (val != null && val > 0) filled += Math.min(val / a.target, 1);
    });
    return Math.round((filled / arcs.length) * 100);
  }, [entry]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size}>
        {arcs.map((a, i) => {
          const r = (size / 2) - 8 - i * 11;
          const circ = 2 * Math.PI * r;
          const val = entry ? (entry as any)[a.key] : 0;
          const pct = val != null ? Math.min(val / a.target, 1) : 0;
          const dash = pct * circ;
          return (
            <G key={a.key}>
              <SvgCircle cx={cx} cy={cx} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={7} fill="none" />
              <SvgCircle
                cx={cx} cy={cx} r={r}
                stroke={a.color}
                strokeWidth={7}
                fill="none"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cx})`}
                opacity={pct > 0 ? 1 : 0.15}
              />
            </G>
          );
        })}
        <SvgText x={cx} y={cx - 6} textAnchor="middle" fontSize="22" fontWeight="800" fill="white">{score}</SvgText>
        <SvgText x={cx} y={cx + 12} textAnchor="middle" fontSize="10" fontWeight="600" fill="rgba(255,255,255,0.5)">ORBIT</SvgText>
      </Svg>
    </View>
  );
}

// ── Sub Nav ────────────────────────────────────────────────────────────────────

function SubNav({ active, onSelect }: { active: SubTab; onSelect: (t: SubTab) => void }) {
  const C = useC();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.BG, borderTopWidth: 1, borderTopColor: C.BORD }}>
      {SUB_TABS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <TouchableOpacity key={key} onPress={() => onSelect(key)}
            style={{ flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 7 }}>
            {isActive && <View style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, backgroundColor: ACCENT, borderRadius: 1 }} />}
            <Icon size={20} color={isActive ? ACCENT : C.SUB} />
            <Text style={{ fontSize: 11, fontWeight: '500', color: isActive ? ACCENT : C.SUB, marginTop: 3 }}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Date Selector ──────────────────────────────────────────────────────────────

function DateSelector({ date, onPrev, onNext }: { date: string; onPrev: () => void; onNext: () => void }) {
  const C = useC();
  const isToday = date === new Date().toLocaleDateString('en-CA');
  const label = isToday
    ? 'Today'
    : new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 14, backgroundColor: C.CARD, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.BORD }}>
      <TouchableOpacity onPress={onPrev} style={{ padding: 4 }}><ChevronLeft size={20} color={C.TXT2} /></TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {isToday && <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10B981' }} />}
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.TXT }}>{label}</Text>
      </View>
      <TouchableOpacity onPress={onNext} style={{ padding: 4 }}><ChevronRight size={20} color={C.TXT2} /></TouchableOpacity>
    </View>
  );
}

// ── Workout Card ───────────────────────────────────────────────────────────────

function WorkoutCard({ w, onDelete }: { w: Workout; onDelete: (id: string) => void }) {
  const C = useC();
  const meta: string[] = [];
  if (w.durationMins)   meta.push(`${w.durationMins} min`);
  if (w.distanceKm)     meta.push(`${w.distanceKm} km`);
  if (w.caloriesBurned) meta.push(`${w.caloriesBurned} cal`);
  return (
    <View style={{ backgroundColor: C.CARD, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.BORD }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 22 }}>{(w.type ? WORKOUT_ICONS[w.type] : null) ?? '💪'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.TXT, textTransform: 'capitalize' }}>{w.name}</Text>
          {meta.length > 0 && <Text style={{ fontSize: 12, color: C.SUB, marginTop: 2 }}>{meta.join(' · ')}</Text>}
        </View>
        <TouchableOpacity onPress={() => onDelete(w.id)} style={{ padding: 8 }}>
          <Trash2 size={15} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
      {!!w.notes && (
        <Text style={{ fontSize: 12, color: C.SUB, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.BORD }}>{w.notes}</Text>
      )}
    </View>
  );
}

// ── Add Workout Modal ──────────────────────────────────────────────────────────

function AddWorkoutModal({ visible, onClose, date, onSave }: {
  visible: boolean; onClose: () => void; date: string; onSave: (data: Partial<Workout>) => void;
}) {
  const C = useC();
  const [name, setName]         = useState('');
  const [type, setType]         = useState<Workout['type']>('running');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [distance, setDistance] = useState('');
  const [notes, setNotes]       = useState('');
  const save = () => {
    if (!name.trim() || !duration) return;
    onSave({
      name: name.trim(), type, durationMins: parseInt(duration),
      caloriesBurned: calories ? parseInt(calories) : undefined,
      distanceKm: distance ? parseFloat(distance) : undefined,
      notes: notes.trim() || undefined,
      date,
    });
    setName(''); setDuration(''); setCalories(''); setDistance(''); setNotes(''); setType('running');
    onClose();
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: C.CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}>
          <View style={{ width: 40, height: 4, backgroundColor: C.BORD, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: C.TXT, marginBottom: 16 }}>Log Workout</Text>
          <Text style={{ fontSize: 13, color: C.SUB, marginBottom: 4 }}>Name</Text>
          <TextInput style={{ borderWidth: 1, borderColor: C.BORD, borderRadius: 12, backgroundColor: C.SALF, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: C.TXT, marginBottom: 16 }}
            placeholder="e.g. Morning run" placeholderTextColor={C.DIM} value={name} onChangeText={setName} autoFocus />
          <Text style={{ fontSize: 13, color: C.SUB, marginBottom: 8 }}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {WORKOUT_TYPES.map((t) => (
                <TouchableOpacity key={t} onPress={() => setType(t)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: type === t ? ACCENT : C.BORD, backgroundColor: type === t ? ACCENT + '22' : C.SALF }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: type === t ? ACCENT : C.DIM, textTransform: 'capitalize' }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: C.SUB, marginBottom: 4 }}>Duration (min)</Text>
              <TextInput style={{ borderWidth: 1, borderColor: C.BORD, borderRadius: 12, backgroundColor: C.SALF, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: C.TXT }}
                placeholder="30" placeholderTextColor={C.DIM} value={duration} onChangeText={setDuration} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: C.SUB, marginBottom: 4 }}>Calories (opt.)</Text>
              <TextInput style={{ borderWidth: 1, borderColor: C.BORD, borderRadius: 12, backgroundColor: C.SALF, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: C.TXT }}
                placeholder="250" placeholderTextColor={C.DIM} value={calories} onChangeText={setCalories} keyboardType="numeric" />
            </View>
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: C.SUB, marginBottom: 4 }}>Distance km (opt.)</Text>
            <TextInput style={{ borderWidth: 1, borderColor: C.BORD, borderRadius: 12, backgroundColor: C.SALF, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: C.TXT }}
              placeholder="5.0" placeholderTextColor={C.DIM} value={distance} onChangeText={setDistance} keyboardType="decimal-pad" />
          </View>
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 13, color: C.SUB, marginBottom: 4 }}>Notes (opt.)</Text>
            <TextInput style={{ borderWidth: 1, borderColor: C.BORD, borderRadius: 12, backgroundColor: C.SALF, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: C.TXT, minHeight: 72, textAlignVertical: 'top' }}
              placeholder="How did it go?" placeholderTextColor={C.DIM} value={notes} onChangeText={setNotes} multiline />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: C.BORD }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: C.SUB }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={!name.trim() || !duration}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: name.trim() && duration ? 1 : 0.5 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Weekly Heatmap ─────────────────────────────────────────────────────────────

function WeeklyHeatmap({ workouts }: { workouts: Workout[] }) {
  const C = useC();
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const weekDates = days.map((_, i) => {
    const d = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = i - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    d.setDate(today.getDate() + diff);
    return d.toLocaleDateString('en-CA');
  });

  const workoutsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    workouts.forEach(w => { map[w.date] = (map[w.date] ?? 0) + 1; });
    return map;
  }, [workouts]);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: C.SUB, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>This Week</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {weekDates.map((date, i) => {
          const count = workoutsByDate[date] ?? 0;
          const isToday = date === today.toLocaleDateString('en-CA');
          return (
            <View key={date} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <View style={{
                width: '100%', aspectRatio: 1,
                borderRadius: 10,
                backgroundColor: count > 0 ? ACCENT + (count > 1 ? 'DD' : '66') : (isToday ? C.BORD : C.SALF),
                alignItems: 'center', justifyContent: 'center',
                borderWidth: isToday ? 1.5 : 0,
                borderColor: ACCENT,
              }}>
                {count > 0 && <Text style={{ fontSize: 12, fontWeight: '800', color: 'white' }}>{count}</Text>}
              </View>
              <Text style={{ fontSize: 10, color: isToday ? ACCENT : C.SUB, fontWeight: isToday ? '700' : '400' }}>{days[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Suggested Workouts ─────────────────────────────────────────────────────────

const SUGGESTED_WORKOUTS = [
  { name: 'Morning Run', type: 'running', duration: 30, emoji: '🏃', cal: 280 },
  { name: 'Strength Training', type: 'strength', duration: 45, emoji: '🏋️', cal: 350 },
  { name: 'Evening Yoga', type: 'yoga', duration: 30, emoji: '🧘', cal: 120 },
  { name: 'Cycling Ride', type: 'cycling', duration: 40, emoji: '🚴', cal: 320 },
];

// ── Sync View ──────────────────────────────────────────────────────────────────

function SyncView() {
  const C = useC();
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<'success' | 'error' | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const isAvailable = healthSync.isAvailable;
  const platformName = healthSync.platformName;

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const granted = await healthSync.requestPermissions();
      if (!granted) {
        Alert.alert('Permission Required', `Please grant ${platformName} access in your device settings to sync health data.`, [{ text: 'OK' }]);
        setSyncing(false);
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      const data = await healthSync.syncDate(today);
      if (!data) throw new Error('No data returned');
      await upsertHealthEntry({ date: today, steps: data.steps, sleepHours: data.sleepHours, heartRate: data.heartRate, waterMl: data.waterMl, weightKg: data.weightKg } as any);
      qc.invalidateQueries({ queryKey: ['health'] });
      setLastSync(new Date().toLocaleTimeString());
      setSyncResult('success');
    } catch {
      setSyncResult('error');
    } finally {
      setSyncing(false);
    }
  }, [qc]);

  const sources = Platform.OS === 'ios'
    ? [
        { label: 'Apple Health',  emoji: '🍎', note: 'Steps, sleep, heart rate, workouts, water, weight' },
        { label: 'Apple Watch',   emoji: '⌚', note: 'Syncs automatically via Apple Health' },
        { label: 'Garmin',        emoji: '🧭', note: 'Syncs via Apple Health' },
        { label: 'Amazfit',       emoji: '⌚', note: 'Syncs via Apple Health' },
      ]
    : [
        { label: 'Health Connect',   emoji: '🤖', note: 'Steps, sleep, heart rate, workouts, water, weight' },
        { label: 'Samsung Health',   emoji: '📱', note: 'Syncs via Health Connect' },
        { label: 'Google Fit',       emoji: '🏃', note: 'Syncs via Health Connect' },
        { label: 'Wear OS / Galaxy', emoji: '⌚', note: 'Syncs via Health Connect' },
        { label: 'Amazfit / Garmin', emoji: '🧭', note: 'Syncs natively into Health Connect' },
      ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: C.TXT, marginBottom: 4 }}>Health Data Sync</Text>
      <Text style={{ fontSize: 13, color: C.SUB, marginBottom: 20 }}>
        {isAvailable ? `Sync with ${platformName} to import today's health data.` : 'Health platform not available on this device.'}
      </Text>
      {isAvailable && (
        <TouchableOpacity onPress={handleSync} disabled={syncing}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14, marginBottom: 16, backgroundColor: syncResult === 'success' ? '#10B98122' : syncResult === 'error' ? '#EF444422' : ACCENT }}>
          {syncing ? <ActivityIndicator color="white" size="small" />
            : syncResult === 'success' ? <CheckCircle size={18} color="#10B981" />
            : syncResult === 'error'   ? <AlertCircle size={18} color="#EF4444" />
            : <RefreshCw size={18} color="white" />}
          <Text style={{ fontSize: 15, fontWeight: '600', color: syncResult === 'success' ? '#10B981' : syncResult === 'error' ? '#EF4444' : 'white' }}>
            {syncing ? 'Syncing…' : syncResult === 'success' ? `Synced at ${lastSync}` : syncResult === 'error' ? 'Sync failed — tap to retry' : `Sync from ${platformName}`}
          </Text>
        </TouchableOpacity>
      )}
      <Text style={{ fontSize: 14, fontWeight: '600', color: C.TXT, marginBottom: 10 }}>Connected Sources</Text>
      {sources.map((s) => (
        <View key={s.label} style={{ backgroundColor: C.CARD, borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.BORD }}>
          <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: C.TXT }}>{s.label}</Text>
            <Text style={{ fontSize: 12, color: C.SUB, marginTop: 2 }}>{s.note}</Text>
          </View>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isAvailable ? '#10B981' : C.BORD }} />
        </View>
      ))}
    </ScrollView>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function HealthScreen() {
  const C = useC();
  const [activeTab, setActiveTab] = useState<SubTab>('dashboard');
  const [date, setDate]           = useState(new Date().toLocaleDateString('en-CA'));
  const [showAdd, setShowAdd]     = useState(false);
  const [values, setValues]       = useState<Record<string, string>>({});
  const [saved, setSaved]         = useState(false);
  const qc = useQueryClient();

  const { data: entry, isLoading: loadingEntry, refetch: refetchEntry } =
    useQuery({ queryKey: ['health', date], queryFn: () => getHealthEntry(date), staleTime: 0 });
  const { data: workouts = [], isLoading: loadingWorkouts, refetch: refetchWorkouts } =
    useQuery({ queryKey: ['workouts', date], queryFn: () => getWorkouts(date), staleTime: 0 });

  useFocusEffect(useCallback(() => {
    qc.invalidateQueries({ queryKey: ['health'] });
    qc.invalidateQueries({ queryKey: ['workouts'] });
    qc.invalidateQueries({ queryKey: ['food'] });
  }, [qc]));

  const upsertMut = useMutation({
    mutationFn: upsertHealthEntry,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['health'] }); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });
  const createWMut = useMutation({ mutationFn: createWorkout,  onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }) });
  const deleteWMut = useMutation({ mutationFn: deleteWorkout,  onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }) });

  const prevDay = () => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate()-1); setDate(d.toLocaleDateString('en-CA')); setSaved(false); setValues({}); };
  const nextDay = () => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate()+1); setDate(d.toLocaleDateString('en-CA')); setSaved(false); setValues({}); };

  const getVal = (key: string) => {
    if (values[key] !== undefined) return values[key];
    const v = (entry as any)?.[key];
    return v != null ? String(v) : '';
  };

  const saveMetrics = () => {
    const data: any = { date };
    METRICS.forEach(({ key }) => { const v = getVal(key); if (v) data[key] = parseFloat(v); });
    upsertMut.mutate(data);
  };

  // Orbit score for the header card
  const orbitScore = useMemo(() => {
    if (!entry) return 0;
    let filled = 0;
    METRICS.filter(m => m.target).forEach(m => {
      const val = (entry as any)[m.key];
      if (val != null && val > 0 && m.target) filled += Math.min(val / m.target, 1);
    });
    const counted = METRICS.filter(m => m.target).length;
    return Math.round((filled / counted) * 100);
  }, [entry]);

  if (loadingEntry && !entry && loadingWorkouts && workouts.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.BG }}>
        <AppHeader title="Health" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={{ color: C.SUB, fontSize: 14 }}>Loading health data…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.BG }}>
      <AppHeader title="Health" showBack />

      <View style={{ flex: 1 }}>

        {/* ── DASHBOARD ──────────────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetchEntry(); refetchWorkouts(); }} />}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Orbit Score hero card */}
            <View style={{ margin: 16, marginBottom: 12, backgroundColor: C.CARD, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: C.BORD }}>
              <OrbitMini entry={entry} size={120} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Health Score</Text>
                <Text style={{ fontSize: 38, fontWeight: '900', color: C.TXT, lineHeight: 42 }}>{orbitScore}</Text>
                <Text style={{ fontSize: 12, color: C.SUB, marginTop: 2 }}>
                  {orbitScore >= 80 ? 'Excellent — keep it up!' : orbitScore >= 50 ? 'Good — a few more goals to hit' : 'Log your metrics to improve your score'}
                </Text>
                {/* Quick stats */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  {[
                    { key: 'steps', icon: '👟', color: '#3B82F6' },
                    { key: 'sleepHours', icon: '😴', color: '#8B5CF6' },
                    { key: 'waterMl', icon: '💧', color: '#06B6D4' },
                  ].map(s => {
                    const val = getVal(s.key);
                    return (
                      <View key={s.key} style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 14 }}>{s.icon}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: val ? s.color : C.SUB }}>{val || '—'}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            <DateSelector date={date} onPrev={prevDay} onNext={nextDay} />

            {/* Metrics grid */}
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {METRICS.map((m) => {
                  const val = getVal(m.key);
                  const pct = val && m.target ? Math.min(parseFloat(val) / m.target, 1) : 0;
                  return (
                    <View key={m.key} style={{ width: '47%', backgroundColor: C.CARD, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: val ? m.color + '40' : C.BORD }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <m.Icon size={16} color={m.color} />
                          <Text style={{ fontSize: 12, color: C.SUB }}>{m.label}</Text>
                        </View>
                        {m.target && val && (
                          <Text style={{ fontSize: 10, color: pct >= 1 ? '#10B981' : C.DIM, fontWeight: '600' }}>
                            {Math.round(pct * 100)}%
                          </Text>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: m.target ? 8 : 0 }}>
                        <TextInput
                          style={{ flex: 1, fontSize: 22, fontWeight: '800', color: m.color, padding: 0 }}
                          placeholder="—"
                          placeholderTextColor={C.BORD}
                          value={val}
                          onChangeText={(v) => setValues((prev) => ({ ...prev, [m.key]: v }))}
                          keyboardType={m.keyboard as any}
                        />
                        <Text style={{ fontSize: 13, color: C.SUB }}>{m.unit}</Text>
                      </View>
                      {m.target && (
                        <View style={{ height: 3, backgroundColor: C.SALF, borderRadius: 2, overflow: 'hidden' }}>
                          <View style={{ height: '100%', borderRadius: 2, width: `${pct * 100}%`, backgroundColor: pct >= 1 ? '#10B981' : m.color }} />
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity onPress={saveMetrics} disabled={upsertMut.isPending}
                style={{ marginTop: 14, paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: saved ? '#10B98122' : '#10B981' }}>
                {upsertMut.isPending
                  ? <ActivityIndicator color="white" size="small" />
                  : <>
                      <Save size={16} color={saved ? '#10B981' : 'white'} />
                      <Text style={{ fontSize: 15, fontWeight: '600', color: saved ? '#10B981' : 'white' }}>
                        {saved ? '✓ Saved' : 'Save Metrics'}
                      </Text>
                    </>
                }
              </TouchableOpacity>
            </View>

            {/* Workouts summary */}
            <View style={{ paddingHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: C.TXT }}>Workouts · {workouts.length}</Text>
                <TouchableOpacity onPress={() => setActiveTab('workouts')}
                  style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: ACCENT + '22' }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: ACCENT }}>See all →</Text>
                </TouchableOpacity>
              </View>
              {loadingWorkouts ? <ActivityIndicator color={ACCENT} />
                : workouts.length === 0
                  ? <View style={{ paddingVertical: 20, alignItems: 'center', backgroundColor: C.CARD, borderRadius: 16, borderWidth: 1, borderColor: C.BORD }}>
                      <Text style={{ fontSize: 24 }}>🏃</Text>
                      <Text style={{ fontSize: 13, color: C.SUB, marginTop: 6 }}>No workouts today</Text>
                    </View>
                  : workouts.slice(0, 2).map((w) => <WorkoutCard key={w.id} w={w} onDelete={deleteWMut.mutate} />)
              }
            </View>
          </ScrollView>
        )}

        {/* ── WORKOUTS ──────────────────────────────────────────────────────── */}
        {activeTab === 'workouts' && (
          <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refetchWorkouts} />} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

            {/* Stats strip */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'This week', val: String(workouts.length), icon: '📅', color: ACCENT },
                { label: 'Total mins', val: String(workouts.reduce((s, w) => s + (w.durationMins ?? 0), 0)), icon: '⏱', color: '#F9A44A' },
                { label: 'Calories', val: String(workouts.reduce((s, w) => s + (w.caloriesBurned ?? 0), 0)), icon: '🔥', color: '#FF6B6B' },
              ].map(s => (
                <View key={s.label} style={{ flex: 1, backgroundColor: C.CARD, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.BORD }}>
                  <Text style={{ fontSize: 16 }}>{s.icon}</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: s.color, marginTop: 4 }}>{s.val}</Text>
                  <Text style={{ fontSize: 10, color: C.SUB, marginTop: 2 }}>{s.label}</Text>
                </View>
              ))}
            </View>

            <DateSelector date={date} onPrev={prevDay} onNext={nextDay} />

            {/* Weekly heatmap */}
            <WeeklyHeatmap workouts={workouts} />

            {/* Past workouts */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.TXT }}>Logged Workouts</Text>
              <TouchableOpacity onPress={() => setShowAdd(true)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: ACCENT + '22' }}>
                <Plus size={13} color={ACCENT} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT }}>Log</Text>
              </TouchableOpacity>
            </View>

            {loadingWorkouts ? (
              <View style={{ paddingVertical: 48, alignItems: 'center' }}><ActivityIndicator size="large" color={ACCENT} /></View>
            ) : workouts.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center', backgroundColor: C.CARD, borderRadius: 16, borderWidth: 1, borderColor: C.BORD, marginBottom: 20 }}>
                <Text style={{ fontSize: 32 }}>🏋️</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: C.TXT2, marginTop: 8 }}>No workouts yet</Text>
                <Text style={{ fontSize: 12, color: C.SUB, marginTop: 4 }}>Tap Log to add your first workout</Text>
              </View>
            ) : (
              workouts.map((w) => <WorkoutCard key={w.id} w={w} onDelete={deleteWMut.mutate} />)
            )}

            {/* Suggested workouts */}
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.TXT, marginTop: 4, marginBottom: 12 }}>Suggested Workouts</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {SUGGESTED_WORKOUTS.map(s => (
                <TouchableOpacity key={s.name}
                  onPress={() => setShowAdd(true)}
                  style={{ width: '47%', backgroundColor: C.CARD, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.BORD }}>
                  <Text style={{ fontSize: 22, marginBottom: 6 }}>{s.emoji}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.TXT }}>{s.name}</Text>
                  <Text style={{ fontSize: 11, color: C.SUB, marginTop: 2 }}>{s.duration} min · ~{s.cal} cal</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* ── NUTRITION ──────────────────────────────────────────────────────── */}
        {activeTab === 'nutrition' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

            {/* Calorie hero card */}
            <View style={{ backgroundColor: C.CARD, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: C.BORD }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Flame size={16} color='#F9A44A' />
                <Text style={{ fontSize: 14, fontWeight: '700', color: C.TXT }}>Daily Calories</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 12 }}>
                <Text style={{ fontSize: 42, fontWeight: '900', color: '#F9A44A' }}>—</Text>
                <Text style={{ fontSize: 16, color: C.SUB, paddingBottom: 8 }}>/ 2000 kcal</Text>
              </View>
              {/* Macro grid */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[
                  { label: 'Protein', color: '#3B82F6', emoji: '🥩' },
                  { label: 'Carbs',   color: '#F9A44A', emoji: '🌾' },
                  { label: 'Fat',     color: '#EF4444', emoji: '🧈' },
                ].map(m => (
                  <View key={m.label} style={{ flex: 1, backgroundColor: m.color + '18', borderRadius: 12, padding: 10, alignItems: 'center' }}>
                    <Text style={{ fontSize: 18 }}>{m.emoji}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: m.color, marginTop: 4 }}>—g</Text>
                    <Text style={{ fontSize: 10, color: C.SUB, marginTop: 2 }}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Extras grid */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Fiber',   emoji: '🥦', color: '#10B981' },
                { label: 'Sugar',   emoji: '🍬', color: '#EC4899' },
                { label: 'Sodium',  emoji: '🧂', color: '#06B6D4' },
              ].map(e => (
                <View key={e.label} style={{ flex: 1, backgroundColor: C.CARD, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.BORD }}>
                  <Text style={{ fontSize: 18 }}>{e.emoji}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: e.color, marginTop: 4 }}>—</Text>
                  <Text style={{ fontSize: 10, color: C.SUB, marginTop: 2 }}>{e.label}</Text>
                </View>
              ))}
            </View>

            {/* Meal slots */}
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.TXT, marginBottom: 12 }}>Today's Meals</Text>
            {[
              { label: 'Breakfast', emoji: '🍳', time: '8:00 AM' },
              { label: 'Lunch',     emoji: '🥗', time: '1:00 PM' },
              { label: 'Dinner',    emoji: '🍽️', time: '7:00 PM' },
              { label: 'Snacks',    emoji: '🍎', time: 'Anytime' },
            ].map((m) => (
              <View key={m.label} style={{ backgroundColor: C.CARD, borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: C.BORD }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.SALF, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: C.TXT }}>{m.label}</Text>
                  <Text style={{ fontSize: 12, color: C.SUB, marginTop: 2 }}>{m.time}</Text>
                </View>
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.SALF, borderWidth: 1, borderColor: C.BORD }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: C.SUB }}>+ Log</Text>
                </View>
              </View>
            ))}
            <View style={{ marginTop: 4, padding: 14, backgroundColor: ACCENT + '18', borderRadius: 12, borderWidth: 1, borderColor: ACCENT + '33' }}>
              <Text style={{ fontSize: 12, color: C.SUB }}>Full nutrition tracking coming soon — use AI to log meals now</Text>
            </View>
          </ScrollView>
        )}

        {/* ── SYNC ──────────────────────────────────────────────────────────── */}
        {activeTab === 'sync' && <SyncView />}

      </View>

      {/* Bottom Nav */}
      <SubNav active={activeTab} onSelect={setActiveTab} />

      {/* FAB on workouts tab */}
      {activeTab === 'workouts' && (
        <TouchableOpacity onPress={() => setShowAdd(true)}
          style={{ position: 'absolute', bottom: 72, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', shadowColor: ACCENT, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 }}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      )}

      <AddWorkoutModal visible={showAdd} onClose={() => setShowAdd(false)} date={date} onSave={(data) => createWMut.mutate(data as any)} />
    </SafeAreaView>
  );
}
