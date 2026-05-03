import { useState } from 'react';
import { router } from 'expo-router';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Modal, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHealthEntry, upsertHealthEntry, getWorkouts, createWorkout, deleteWorkout } from '@myorbit/api';
import type { HealthEntry, Workout } from '@myorbit/api';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Save,
  LayoutDashboard, Dumbbell, UtensilsCrossed, RefreshCw,
  MoreHorizontal, X, Settings, Heart,
} from 'lucide-react-native';
import AppHeader from '@/components/shared/AppHeader';
import { useTheme } from '@/lib/themeStore';

function useC() {
  const T = useTheme();
  return { BG: T.bg, CARD: T.cardBg, MODAL: T.modalBg, SURF: T.surface, SALF: T.surfaceAlt, BORD: T.border, TXT: T.text, TXT2: T.textSec, SUB: T.subText, DIM: T.mutedText, INPUT: T.inputBg };
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
  { key: 'steps',       label: 'Steps',      unit: 'steps', emoji: '👟', color: '#3B82F6', keyboard: 'numeric' },
  { key: 'sleepHours',  label: 'Sleep',      unit: 'hrs',   emoji: '😴', color: '#8B5CF6', keyboard: 'decimal-pad' },
  { key: 'waterMl',     label: 'Water',      unit: 'ml',    emoji: '💧', color: '#06B6D4', keyboard: 'numeric' },
  { key: 'weightKg',    label: 'Weight',     unit: 'kg',    emoji: '⚖️', color: '#F59E0B', keyboard: 'decimal-pad' },
  { key: 'mood',        label: 'Mood',       unit: '/5',    emoji: '😊', color: '#EC4899', keyboard: 'numeric' },
  { key: 'energyLevel', label: 'Energy',     unit: '/10',   emoji: '⚡', color: '#10B981', keyboard: 'numeric' },
  { key: 'heartRate',   label: 'Heart Rate', unit: 'bpm',   emoji: '❤️', color: '#EF4444', keyboard: 'numeric' },
] as const;

const WORKOUT_TYPES = ['running','cycling','strength','yoga','sports','other'] as const;

// ── Sub Nav ────────────────────────────────────────────────────────────────────

function SubNav({ active, onSelect, onMore }: { active: SubTab; onSelect: (t: SubTab) => void; onMore: () => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A' }}>
      {SUB_TABS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <TouchableOpacity key={key} onPress={() => onSelect(key)}
            style={{ flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 8 }}>
            <Icon size={16} color={isActive ? ACCENT : '#9CA3AF'} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: isActive ? ACCENT : '#9CA3AF', marginTop: 2 }}>{label}</Text>
            {isActive && <View style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, backgroundColor: ACCENT, borderRadius: 1 }} />}
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity onPress={onMore} style={{ width: 48, alignItems: 'center', paddingTop: 10, paddingBottom: 8 }}>
        <MoreHorizontal size={16} color="#9CA3AF" />
        <Text style={{ fontSize: 13, fontWeight: '500', color: '#9CA3AF', marginTop: 2 }}>More</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── More Sheet ─────────────────────────────────────────────────────────────────

function MoreSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 }}>
        <View style={{ width: 40, height: 4, backgroundColor: '#3A3A3A', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' }}>
          <Text style={{ fontWeight: '600', fontSize: 15, color: '#FFFFFF' }}>More</Text>
          <TouchableOpacity onPress={onClose} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
          <Settings size={16} color="#9CA3AF" />
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#E5E7EB' }}>Health Settings</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Date Selector ──────────────────────────────────────────────────────────────

function DateSelector({ date, onPrev, onNext }: { date: string; onPrev: () => void; onNext: () => void }) {
  const isToday = date === new Date().toLocaleDateString('en-CA');
  const label = isToday
    ? '📌 Today'
    : new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginVertical: 12, backgroundColor: '#1A1A1A', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
      <TouchableOpacity onPress={onPrev} style={{ padding: 4 }}><ChevronLeft size={20} color="#374151" /></TouchableOpacity>
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>{label}</Text>
      <TouchableOpacity onPress={onNext} style={{ padding: 4 }}><ChevronRight size={20} color="#374151" /></TouchableOpacity>
    </View>
  );
}

// ── Workout Card ───────────────────────────────────────────────────────────────

function WorkoutCard({ w, onDelete }: { w: Workout; onDelete: (id: string) => void }) {
  const icons: Record<string, string> = { running: '🏃', cycling: '🚴', strength: '🏋️', yoga: '🧘', sports: '⚽', other: '💪' };
  const meta: string[] = [];
  if (w.durationMins) meta.push(`${w.durationMins} min`);
  if (w.distanceKm)   meta.push(`${w.distanceKm} km`);
  if (w.caloriesBurned) meta.push(`${w.caloriesBurned} cal`);
  return (
    <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 26, marginRight: 14 }}>{icons[w.type] ?? '💪'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', textTransform: 'capitalize' }}>{w.name}</Text>
          <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>{meta.join(' · ')}</Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(w.id)} style={{ padding: 8 }}>
          <Trash2 size={15} color="#EF4444" />
        </TouchableOpacity>
      </View>
      {!!w.notes && (
        <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#2A2A2A' }}>{w.notes}</Text>
      )}
    </View>
  );
}

// ── Add Workout Modal ──────────────────────────────────────────────────────────

function AddWorkoutModal({ visible, onClose, date, onSave }: {
  visible: boolean; onClose: () => void; date: string; onSave: (data: Partial<Workout>) => void;
}) {
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
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#3A3A3A', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 }}>Log Workout</Text>
          <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Name</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#FFFFFF', marginBottom: 16 }} placeholder="e.g. Morning run" value={name} onChangeText={setName} autoFocus />
          <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {WORKOUT_TYPES.map((t) => (
                <TouchableOpacity key={t} onPress={() => setType(t)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: type === t ? ACCENT : '#E5E7EB', backgroundColor: type === t ? '#EF444422' : '#242424' }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: type === t ? ACCENT : '#6B7280', textTransform: 'capitalize' }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Duration (min)</Text>
              <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#FFFFFF' }} placeholder="30" value={duration} onChangeText={setDuration} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Calories (opt.)</Text>
              <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#FFFFFF' }} placeholder="250" value={calories} onChangeText={setCalories} keyboardType="numeric" />
            </View>
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Distance (km, opt.)</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#FFFFFF' }} placeholder="5.0" value={distance} onChangeText={setDistance} keyboardType="decimal-pad" />
          </View>
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Notes (opt.)</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#FFFFFF', minHeight: 72, textAlignVertical: 'top' }} placeholder="How did it go?" value={notes} onChangeText={setNotes} multiline />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A' }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#9CA3AF' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={!name.trim() || !duration}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: name.trim() && duration ? 1 : 0.5 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Nutrition Placeholder ──────────────────────────────────────────────────────

function NutritionView() {
  const meals = [
    { label: 'Breakfast', emoji: '🍳', time: '8:00 AM' },
    { label: 'Lunch',     emoji: '🥗', time: '1:00 PM' },
    { label: 'Dinner',    emoji: '🍽️', time: '7:00 PM' },
    { label: 'Snacks',    emoji: '🍎', time: 'Anytime' },
  ];
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#E5E7EB', marginBottom: 12 }}>Today's Meals</Text>
      {meals.map((m) => (
        <TouchableOpacity key={m.label}
          style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: '#2A2A2A' }}>
          <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>{m.label}</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{m.time}</Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#2A2A2A' }}>
            <Text style={{ fontSize: 16, color: '#9CA3AF' }}>+ Log</Text>
          </View>
        </TouchableOpacity>
      ))}
      <View style={{ marginTop: 8, padding: 14, backgroundColor: '#EF444422', borderRadius: 12 }}>
        <Text style={{ fontSize: 13, color: '#9CA3AF' }}>Full nutrition tracking coming soon</Text>
      </View>
    </ScrollView>
  );
}

// ── Sync View ──────────────────────────────────────────────────────────────────

function SyncView() {
  const sources = [
    { label: 'Apple Health',  emoji: '🍎', status: 'Not connected' },
    { label: 'Google Fit',    emoji: '🏃', status: 'Not connected' },
    { label: 'Fitbit',        emoji: '⌚', status: 'Not connected' },
    { label: 'Garmin',        emoji: '🧭', status: 'Not connected' },
  ];
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#E5E7EB', marginBottom: 4 }}>Health Data Sources</Text>
      <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Connect your devices to sync health data automatically</Text>
      {sources.map((s) => (
        <View key={s.label} style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
          <Text style={{ fontSize: 28 }}>{s.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>{s.label}</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{s.status}</Text>
          </View>
          <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#2A2A2A' }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#9CA3AF' }}>Connect</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function HealthScreen() {
  const [activeTab, setActiveTab] = useState<SubTab>('dashboard');
  const [date, setDate]           = useState(new Date().toLocaleDateString('en-CA'));
  const [showAdd, setShowAdd]     = useState(false);
  const [showMore, setShowMore]   = useState(false);
  const [values, setValues]       = useState<Record<string, string>>({});
  const [saved, setSaved]         = useState(false);
  const qc = useQueryClient();

  const { data: entry, isLoading: loadingEntry, refetch: refetchEntry } =
    useQuery({ queryKey: ['health', date], queryFn: () => getHealthEntry(date) });
  const { data: workouts = [], isLoading: loadingWorkouts, refetch: refetchWorkouts } =
    useQuery({ queryKey: ['workouts', date], queryFn: () => getWorkouts(date) });

  const upsertMut = useMutation({
    mutationFn: upsertHealthEntry,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['health'] }); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });
  const createWMut = useMutation({ mutationFn: createWorkout,  onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }) });
  const deleteWMut = useMutation({ mutationFn: deleteWorkout,  onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }) });

  const prevDay = () => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate()-1); setDate(d.toLocaleDateString('en-CA')); setSaved(false); };
  const nextDay = () => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate()+1); setDate(d.toLocaleDateString('en-CA')); setSaved(false); };

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111111' }}>
      <AppHeader title="Health" showBack />

      <View style={{ flex: 1 }}>
      {/* ── DASHBOARD ─────────────────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetchEntry(); refetchWorkouts(); }} />} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <DateSelector date={date} onPrev={prevDay} onNext={nextDay} />

          {/* Metrics grid */}
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {METRICS.map((m) => (
                <View key={m.key} style={{ width: '47%', backgroundColor: '#1A1A1A', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                    <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{m.label}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <TextInput
                      style={{ flex: 1, fontSize: 22, fontWeight: '700', color: m.color, padding: 0 }}
                      placeholder="—"
                      placeholderTextColor="#D1D5DB"
                      value={getVal(m.key)}
                      onChangeText={(v) => setValues((prev) => ({ ...prev, [m.key]: v }))}
                      keyboardType={m.keyboard as any}
                    />
                    <Text style={{ fontSize: 16, color: '#9CA3AF' }}>{m.unit}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={saveMetrics} disabled={upsertMut.isPending}
              style={{ marginTop: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: saved ? '#10B98122' : '#10B981' }}>
              {upsertMut.isPending
                ? <ActivityIndicator color="white" size="small" />
                : <>
                    <Save size={16} color={saved ? '#10B981' : 'white'} />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: saved ? '#10B981' : 'white' }}>
                      {saved ? '✓ Saved' : 'Save Metrics'}
                    </Text>
                  </>
              }
            </TouchableOpacity>
          </View>

          {/* Workouts summary on dashboard */}
          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#E5E7EB' }}>🏋️ Workouts · {workouts.length}</Text>
              <TouchableOpacity onPress={() => setActiveTab('workouts')}
                style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#EF444422' }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: ACCENT }}>See all →</Text>
              </TouchableOpacity>
            </View>
            {loadingWorkouts ? <ActivityIndicator color={ACCENT} />
              : workouts.length === 0
                ? <View style={{ paddingVertical: 24, alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 16 }}>
                    <Text style={{ fontSize: 28, marginBottom: 6 }}>🏃</Text>
                    <Text style={{ fontSize: 16, color: '#9CA3AF' }}>No workouts logged</Text>
                  </View>
                : workouts.slice(0, 3).map((w) => <WorkoutCard key={w.id} w={w} onDelete={deleteWMut.mutate} />)
            }
          </View>
        </ScrollView>
      )}

      {/* ── WORKOUTS ──────────────────────────────────────────────────────── */}
      {activeTab === 'workouts' && (
        <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refetchWorkouts} />} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          <DateSelector date={date} onPrev={prevDay} onNext={nextDay} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#E5E7EB' }}>Workouts · {workouts.length}</Text>
            <TouchableOpacity onPress={() => setShowAdd(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#EF444422' }}>
              <Plus size={14} color={ACCENT} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>Log</Text>
            </TouchableOpacity>
          </View>
          {loadingWorkouts ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}><ActivityIndicator size="large" color={ACCENT} /></View>
          ) : workouts.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 16 }}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🏋️</Text>
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#E5E7EB' }}>No workouts yet</Text>
              <Text style={{ fontSize: 16, color: '#9CA3AF', marginTop: 4 }}>Tap Log to add your first workout</Text>
            </View>
          ) : (
            workouts.map((w) => <WorkoutCard key={w.id} w={w} onDelete={deleteWMut.mutate} />)
          )}
        </ScrollView>
      )}

      {/* ── NUTRITION ─────────────────────────────────────────────────────── */}
      {activeTab === 'nutrition' && <NutritionView />}

      {/* ── SYNC ──────────────────────────────────────────────────────────── */}
      {activeTab === 'sync' && <SyncView />}

      </View>

      {/* Bottom Nav */}
      <SubNav active={activeTab} onSelect={setActiveTab} onMore={() => setShowMore(true)} />

      {/* FAB on workouts tab */}
      {activeTab === 'workouts' && (
        <TouchableOpacity onPress={() => setShowAdd(true)}
          style={{ position: 'absolute', bottom: 72, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', shadowColor: ACCENT, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 }}>
          <Plus size={26} color="white" />
        </TouchableOpacity>
      )}

      <AddWorkoutModal visible={showAdd} onClose={() => setShowAdd(false)} date={date} onSave={(data) => createWMut.mutate(data as any)} />
      <MoreSheet visible={showMore} onClose={() => setShowMore(false)} />
    </SafeAreaView>
  );
}
