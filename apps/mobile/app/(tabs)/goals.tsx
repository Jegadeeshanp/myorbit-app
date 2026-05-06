import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/lib/themeStore';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/authStore';
import Svg, { Rect, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform,
  Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGoals, createGoal, updateGoal, deleteGoal,
  createMilestone, updateMilestone,
  createProcess, deleteProcess,
} from '@myorbit/api';
import type { Goal, GoalMilestone, GoalProcess } from '@myorbit/api';
import {
  Plus, Target, CheckCircle, Circle, Trash2, ChevronRight,
  LayoutDashboard, Pause, Pencil, Zap, MoreHorizontal, X, Settings,
  CheckSquare, RotateCcw, Search, Menu, Flag,
  Wallet, Heart, Briefcase, BookOpen, User, CalendarDays, Trophy, Inbox,
} from 'lucide-react-native';

// ── Types ────────────────────────────────────────────────────────────────────

type SubTab = 'overview' | 'active' | 'completed' | 'all';

// ── Constants ────────────────────────────────────────────────────────────────

const ACCENT  = '#7C3AED';

function useColors() {
  const T = useTheme();
  return {
    BG:      T.bg,
    SURFACE: T.cardBg,
    SURFACE2:T.surfaceAlt,
    BORDER:  T.border,
    MUTED:   T.subText,
    TXT:     T.text,
    TXT2:    T.textSec,
    MODAL:   T.modalBg,
    INPUT:   T.inputBg,
  };
}

const SUB_TABS = [
  { key: 'overview'  as SubTab, label: 'Overview',  Icon: LayoutDashboard },
  { key: 'active'    as SubTab, label: 'Active',    Icon: CheckCircle },
  { key: 'completed' as SubTab, label: 'Completed', Icon: CheckSquare },
];
const MORE_ITEMS = [
  { key: 'all' as SubTab, label: 'All Goals', Icon: Target },
];

const CAT_COLORS: Record<string, string> = {
  Finance: '#10B981', Health: '#EF4444', Career: '#3B82F6',
  Learning: '#8B5CF6', Personal: '#F59E0B', Other: '#64748B',
};

const CAT_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Finance: Wallet, Health: Heart, Career: Briefcase,
  Learning: BookOpen, Personal: User, Other: MoreHorizontal,
};

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: '#10B981', bg: '#10B98122' },
  completed: { label: 'Completed', color: '#3B82F6', bg: '#3B82F622' },
  paused:    { label: 'Paused',    color: '#F59E0B', bg: '#F59E0B22' },
};

const CATEGORIES: Goal['category'][] = ['Finance', 'Health', 'Career', 'Learning', 'Personal', 'Other'];
const FREQ_OPTIONS = ['daily', 'weekly', 'monthly'] as const;

// ── MyOrbit Logo ─────────────────────────────────────────────────────────────

function MyOrbitLogo() {
  return (
    <Svg width={28} height={28} viewBox="0 0 40 40">
      <Rect x="0" y="0" width="40" height="40" rx="10" ry="10" fill="#10B981" />
      <SvgCircle cx="20" cy="20" r="13" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none" />
      <SvgCircle cx="20" cy="7" r="2.5" fill="white" />
      <SvgCircle cx="33" cy="20" r="2.5" fill="white" />
      <SvgCircle cx="20" cy="33" r="2.5" fill="white" />
      <SvgCircle cx="7" cy="20" r="2.5" fill="white" />
      <SvgText x="20" y="26" textAnchor="middle" fontFamily="System" fontWeight="800" fontSize="16" fill="white">M</SvgText>
    </Svg>
  );
}

// ── Sub Nav ──────────────────────────────────────────────────────────────────

function SubNav({ active, onSelect, onMore }: {
  active: SubTab; onSelect: (t: SubTab) => void; onMore: () => void;
}) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const isMoreActive = !SUB_TABS.some(t => t.key === active);
  return (
    <View style={{ flexDirection: 'row', backgroundColor: BG, borderTopWidth: 1, borderTopColor: BORDER }}>
      {SUB_TABS.map(({ key, label, Icon }) => {
        const on = active === key;
        return (
          <TouchableOpacity key={key} onPress={() => onSelect(key)}
            style={{ flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 7 }}>
            {on && <View style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, backgroundColor: ACCENT, borderRadius: 1 }} />}
            <Icon size={20} color={on ? ACCENT : MUTED} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: on ? ACCENT : MUTED, marginTop: 3 }}>{label}</Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity onPress={onMore} style={{ width: 52, alignItems: 'center', paddingTop: 8, paddingBottom: 7 }}>
        {isMoreActive && <View style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, backgroundColor: ACCENT, borderRadius: 1 }} />}
        <MoreHorizontal size={20} color={isMoreActive ? ACCENT : MUTED} />
        <Text style={{ fontSize: 12, fontWeight: '500', color: isMoreActive ? ACCENT : MUTED, marginTop: 3 }}>More</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── More Sheet ───────────────────────────────────────────────────────────────

function MoreSheet({ visible, active, onSelect, onClose, userName }: {
  visible: boolean; active: SubTab; onSelect: (t: SubTab) => void; onClose: () => void; userName?: string;
}) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const initials = (userName ?? 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 }}>
        <View style={{ width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />

        {/* User profile */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: BORDER }}>
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: TXT2 }} numberOfLines={1}>{userName ?? 'User'}</Text>
            <Text style={{ fontSize: 11, color: MUTED }}>Personal account</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color={MUTED} />
          </TouchableOpacity>
        </View>

        {/* Nav items */}
        {MORE_ITEMS.map(({ key, label, Icon }) => (
          <TouchableOpacity key={key} onPress={() => { onSelect(key); onClose(); }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: active === key ? ACCENT + '22' : 'transparent' }}>
            <Icon size={16} color={active === key ? ACCENT : MUTED} />
            <Text style={{ fontSize: 15, fontWeight: '500', color: active === key ? ACCENT : TXT2 }}>{label}</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 1, backgroundColor: BORDER, marginHorizontal: 16, marginVertical: 4 }} />
        <TouchableOpacity onPress={() => { onClose(); router.push('/(tabs)/settings' as any); }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
          <Settings size={16} color={MUTED} />
          <Text style={{ fontSize: 15, fontWeight: '500', color: TXT2 }}>Goals Settings</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({ goal, onEdit, onDelete, onComplete, onPause, onToggleMilestone }: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onPause: (id: string, current: Goal['status']) => void;
  onToggleMilestone: (goalId: string, ms: GoalMilestone) => void;
}) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const catColor   = CAT_COLORS[goal.category] ?? '#64748B';
  const cfg        = STATUS_CONFIG[goal.status];
  const milestones = goal.milestones ?? [];
  const processes  = goal.processes ?? [];
  const done       = milestones.filter(m => m.isCompleted).length;
  const pct        = milestones.length ? Math.round((done / milestones.length) * 100) : 0;
  const isOverdue  = goal.deadline && goal.deadline < new Date().toLocaleDateString('en-CA') && goal.status === 'active';

  return (
    <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: catColor }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          {/* Badges */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: catColor + '22' }}>
              {(() => { const CatIcon = CAT_ICONS[goal.category]; return CatIcon ? <CatIcon size={10} color={catColor} /> : null; })()}
              <Text style={{ fontSize: 11, fontWeight: '600', color: catColor }}>{goal.category}</Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: cfg.bg }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: cfg.color }}>{cfg.label}</Text>
            </View>
            {isOverdue && (
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: '#EF444422' }}>
                <Text style={{ fontSize: 11, fontWeight: '500', color: '#EF4444' }}>Overdue</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 17, fontWeight: '600', color: TXT }}>{goal.title}</Text>
          {goal.why && <Text style={{ fontSize: 13, color: MUTED, marginTop: 3, fontStyle: 'italic' }} numberOfLines={2}>"{goal.why}"</Text>}
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity onPress={() => onEdit(goal)} style={{ padding: 6, borderRadius: 8, backgroundColor: ACCENT + '22' }}>
            <Pencil size={13} color={ACCENT} />
          </TouchableOpacity>
          {goal.status !== 'completed' && (
            <TouchableOpacity onPress={() => onPause(goal.id, goal.status)} style={{ padding: 6, borderRadius: 8, backgroundColor: goal.status === 'paused' ? '#F59E0B22' : SURFACE2 }}>
              {goal.status === 'paused'
                ? <RotateCcw size={13} color="#F59E0B" />
                : <Pause size={13} color={MUTED} />}
            </TouchableOpacity>
          )}
          {goal.status !== 'completed' && (
            <TouchableOpacity onPress={() => onComplete(goal.id)} style={{ padding: 6, borderRadius: 8, backgroundColor: '#10B98122' }}>
              <CheckCircle size={13} color="#10B981" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => onDelete(goal.id)} style={{ padding: 6, borderRadius: 8, backgroundColor: '#EF444422' }}>
            <Trash2 size={13} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Deadline */}
      {goal.deadline && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <CalendarDays size={12} color={isOverdue ? '#EF4444' : MUTED} />
          <Text style={{ fontSize: 12, color: isOverdue ? '#EF4444' : MUTED }}>{goal.deadline}</Text>
        </View>
      )}

      {/* Milestone progress bar */}
      {milestones.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 11, color: MUTED }}>{done}/{milestones.length} milestones</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: TXT2 }}>{pct}%</Text>
          </View>
          <View style={{ height: 5, backgroundColor: SURFACE2, borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ height: '100%', borderRadius: 3, width: `${pct}%`, backgroundColor: catColor }} />
          </View>
        </View>
      )}

      {/* Milestones list */}
      {milestones.length > 0 && (
        <View style={{ marginBottom: 8, gap: 4 }}>
          {milestones.map(ms => {
            const horizonLabel = ms.horizon === '1m' ? '1 Month' : ms.horizon === '3m' ? '3 Months' : '6 Months';
            return (
              <TouchableOpacity key={ms.id} onPress={() => onToggleMilestone(goal.id, ms)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 }}>
                {ms.isCompleted
                  ? <CheckCircle size={14} color="#10B981" />
                  : <Circle size={14} color="#4B5563" />}
                <Text style={{ flex: 1, fontSize: 13, color: ms.isCompleted ? MUTED : '#E5E7EB', textDecorationLine: ms.isCompleted ? 'line-through' : 'none' }}>
                  {ms.title}
                </Text>
                <Text style={{ fontSize: 11, color: MUTED }}>{horizonLabel}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Processes */}
      {processes.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {processes.map(p => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: ACCENT + '18' }}>
              <Zap size={9} color={ACCENT} />
              <Text style={{ fontSize: 11, color: ACCENT, fontWeight: '500' }}>{p.title}</Text>
              <Text style={{ fontSize: 10, color: MUTED }}>· {p.frequency}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Add / Edit Goal Modal (2-step) ───────────────────────────────────────────

type GoalFormStep = 1 | 2;

interface GoalFormData {
  title: string; category: Goal['category']; why: string; metric: string; deadline: string;
  ms1m: string; ms3m: string; ms6m: string;
  proc1: string; proc1freq: typeof FREQ_OPTIONS[number];
  proc2: string; proc2freq: typeof FREQ_OPTIONS[number];
}

function GoalModal({ visible, initial, onClose, onCreate, onUpdate }: {
  visible: boolean; initial?: Goal | null; onClose: () => void;
  onCreate: (data: GoalFormData) => void; onUpdate: (id: string, data: Partial<GoalFormData>) => void;
}) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const isEdit = !!initial;
  const [step, setStep] = useState<GoalFormStep>(1);
  const [form, setForm] = useState<GoalFormData>({
    title: '', category: 'Personal', why: '', metric: '', deadline: '',
    ms1m: '', ms3m: '', ms6m: '', proc1: '', proc1freq: 'daily', proc2: '', proc2freq: 'weekly',
  });

  useEffect(() => {
    if (!visible) return;
    setStep(1);
    if (initial) {
      const ms = initial.milestones ?? [];
      const ps = initial.processes ?? [];
      setForm({
        title: initial.title, category: initial.category, why: initial.why ?? '',
        metric: initial.metric ?? '', deadline: initial.deadline ?? '',
        ms1m: ms.find(m => m.horizon === '1m')?.title ?? '',
        ms3m: ms.find(m => m.horizon === '3m')?.title ?? '',
        ms6m: ms.find(m => m.horizon === '6m')?.title ?? '',
        proc1: ps[0]?.title ?? '', proc1freq: (ps[0]?.frequency as any) ?? 'daily',
        proc2: ps[1]?.title ?? '', proc2freq: (ps[1]?.frequency as any) ?? 'weekly',
      });
    } else {
      setForm({ title: '', category: 'Personal', why: '', metric: '', deadline: '', ms1m: '', ms3m: '', ms6m: '', proc1: '', proc1freq: 'daily', proc2: '', proc2freq: 'weekly' });
    }
  }, [visible, initial?.id]);

  const set = (k: keyof GoalFormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (isEdit && initial) { onUpdate(initial.id, form); } else { onCreate(form); }
    onClose();
  };

  const today = new Date().toLocaleDateString('en-CA');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, maxHeight: '90%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: TXT }}>
              {isEdit ? 'Edit Goal' : step === 1 ? 'New Goal' : 'Milestones & Processes'}
            </Text>
            {!isEdit && (
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {([1, 2] as GoalFormStep[]).map(s => (
                  <View key={s} style={{ height: 4, width: 28, borderRadius: 2, backgroundColor: s <= step ? ACCENT : BORDER }} />
                ))}
              </View>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {(step === 1 || isEdit) && (
              <>
                <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Title *</Text>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: TXT, marginBottom: 14 }}
                  placeholder="e.g. Save ₹5 lakhs, Run a marathon" placeholderTextColor={MUTED}
                  value={form.title} onChangeText={v => set('title', v)} autoFocus={!isEdit} />

                <Text style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>Category</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {CATEGORIES.map(c => {
                    const CatIcon = CAT_ICONS[c];
                    const active  = form.category === c;
                    return (
                      <TouchableOpacity key={c} onPress={() => set('category', c)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: active ? ACCENT : BORDER, backgroundColor: active ? ACCENT + '22' : SURFACE2 }}>
                        {CatIcon && <CatIcon size={12} color={active ? ACCENT : MUTED} />}
                        <Text style={{ fontSize: 12, fontWeight: '600', color: active ? ACCENT : MUTED }}>{c}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Why? (optional)</Text>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: TXT, marginBottom: 14, minHeight: 60, textAlignVertical: 'top' }}
                  placeholder="Your motivation for this goal..." placeholderTextColor={MUTED} multiline value={form.why} onChangeText={v => set('why', v)} />

                <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Success Metric (optional)</Text>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT, marginBottom: 14 }}
                  placeholder="How will you measure success?" placeholderTextColor={MUTED} value={form.metric} onChangeText={v => set('metric', v)} />

                <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Deadline (optional)</Text>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: TXT, marginBottom: 16 }}
                  placeholder={`YYYY-MM-DD (e.g. ${today})`} placeholderTextColor={MUTED}
                  value={form.deadline} onChangeText={v => set('deadline', v)} keyboardType="numbers-and-punctuation" />
              </>
            )}

            {(step === 2 && !isEdit) && (
              <>
                <Text style={{ fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Milestones (optional)</Text>
                {([
                  { key: 'ms6m' as keyof GoalFormData, label: '6-Month milestone' },
                  { key: 'ms3m' as keyof GoalFormData, label: '3-Month milestone' },
                  { key: 'ms1m' as keyof GoalFormData, label: '1-Month milestone' },
                ] as const).map(({ key, label }) => (
                  <View key={key} style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>{label}</Text>
                    <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 16, paddingVertical: 11, fontSize: 14, color: TXT }}
                      placeholder={`Where will you be in ${key.replace('ms', '')}?`} placeholderTextColor={MUTED}
                      value={form[key]} onChangeText={v => set(key, v)} />
                  </View>
                ))}

                <Text style={{ fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 10 }}>Recurring Processes (optional)</Text>
                {([
                  { titleKey: 'proc1' as keyof GoalFormData, freqKey: 'proc1freq' as keyof GoalFormData, n: 1 },
                  { titleKey: 'proc2' as keyof GoalFormData, freqKey: 'proc2freq' as keyof GoalFormData, n: 2 },
                ] as const).map(({ titleKey, freqKey, n }) => (
                  <View key={String(n)} style={{ marginBottom: 12, flexDirection: 'row', gap: 8 }}>
                    <TextInput style={{ flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: TXT }}
                      placeholder={`Process ${n} (e.g. Run 5km)`} placeholderTextColor={MUTED}
                      value={form[titleKey]} onChangeText={v => set(titleKey, v)} />
                    <View style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, overflow: 'hidden' }}>
                      {FREQ_OPTIONS.map(f => (
                        <TouchableOpacity key={f} onPress={() => set(freqKey, f)}
                          style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: form[freqKey] === f ? ACCENT + '22' : 'transparent' }}>
                          <Text style={{ fontSize: 12, color: form[freqKey] === f ? ACCENT : MUTED, fontWeight: '500', textTransform: 'capitalize' }}>{f}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
                <View style={{ height: 16 }} />
              </>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            {!isEdit && step === 2 ? (
              <>
                <TouchableOpacity onPress={() => setStep(1)} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER }}>
                  <Text style={{ fontSize: 15, fontWeight: '500', color: MUTED }}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={!form.title.trim()}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: form.title.trim() ? 1 : 0.5 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>Create Goal</Text>
                </TouchableOpacity>
              </>
            ) : isEdit ? (
              <>
                <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER }}>
                  <Text style={{ fontSize: 15, fontWeight: '500', color: MUTED }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={!form.title.trim()}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: form.title.trim() ? 1 : 0.5 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>Save</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER }}>
                  <Text style={{ fontSize: 15, fontWeight: '500', color: MUTED }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { if (!form.title.trim()) return; setStep(2); }} disabled={!form.title.trim()}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: form.title.trim() ? 1 : 0.5 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>Next →</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Goals List ───────────────────────────────────────────────────────────────

function GoalsList({ goals, isLoading, refetch, onEdit, onDelete, onComplete, onPause, onToggleMilestone, EmptyIcon, emptyText, emptySubtext }: {
  goals: Goal[]; isLoading: boolean; refetch: () => void;
  onEdit: (g: Goal) => void; onDelete: (id: string) => void; onComplete: (id: string) => void;
  onPause: (id: string, current: Goal['status']) => void;
  onToggleMilestone: (goalId: string, ms: GoalMilestone) => void;
  EmptyIcon: React.ComponentType<{ size: number; color: string }>; emptyText: string; emptySubtext: string;
}) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  return (
    <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {isLoading ? (
        <View style={{ paddingVertical: 48, alignItems: 'center' }}><ActivityIndicator size="large" color={ACCENT} /></View>
      ) : goals.length === 0 ? (
        <View style={{ paddingVertical: 48, alignItems: 'center' }}>
          <EmptyIcon size={40} color={MUTED} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2, marginTop: 12 }}>{emptyText}</Text>
          <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{emptySubtext}</Text>
        </View>
      ) : (
        goals.map(g => (
          <GoalCard key={g.id} goal={g} onEdit={onEdit} onDelete={onDelete}
            onComplete={onComplete} onPause={onPause} onToggleMilestone={onToggleMilestone} />
        ))
      )}
    </ScrollView>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab]   = useState<SubTab>('overview');
  const [showAdd, setShowAdd]       = useState(false);
  const [showMore, setShowMore]     = useState(false);
  const [editGoal, setEditGoal]     = useState<Goal | null>(null);
  const [catFilter, setCatFilter]   = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const qc = useQueryClient();

  const { data: goals = [], isLoading, refetch } =
    useQuery({ queryKey: ['goals'], queryFn: getGoals });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['goals'] });
  const onMutateError = () => Alert.alert('Error', 'Something went wrong. Please try again.');

  const deleteMut   = useMutation({ mutationFn: deleteGoal, onSuccess: invalidate, onError: onMutateError });
  const completeMut = useMutation({ mutationFn: (id: string) => updateGoal(id, { status: 'completed' }), onSuccess: invalidate, onError: onMutateError });
  const pauseMut    = useMutation({ mutationFn: ({ id, status }: { id: string; status: Goal['status'] }) => updateGoal(id, { status: status === 'paused' ? 'active' : 'paused' }), onSuccess: invalidate, onError: onMutateError });
  const updateMut   = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<Goal> }) => updateGoal(id, data), onSuccess: invalidate, onError: onMutateError });
  const toggleMilestoneMut = useMutation({
    mutationFn: ({ goalId, ms }: { goalId: string; ms: GoalMilestone }) =>
      updateMilestone(goalId, ms.id, { isCompleted: !ms.isCompleted }),
    onSuccess: invalidate, onError: onMutateError,
  });

  const handleCreate = async (form: GoalFormData) => {
    const milestones = [
      form.ms6m.trim() ? { title: form.ms6m.trim(), horizon: '6m' } : null,
      form.ms3m.trim() ? { title: form.ms3m.trim(), horizon: '3m' } : null,
      form.ms1m.trim() ? { title: form.ms1m.trim(), horizon: '1m' } : null,
    ].filter(Boolean);
    const processes = [
      form.proc1.trim() ? { title: form.proc1.trim(), frequency: form.proc1freq } : null,
      form.proc2.trim() ? { title: form.proc2.trim(), frequency: form.proc2freq } : null,
    ].filter(Boolean);
    try {
      await createGoal({ title: form.title.trim(), category: form.category, why: form.why.trim() || undefined, metric: form.metric.trim() || undefined, deadline: form.deadline || undefined, milestones: milestones as any, processes: processes as any, status: 'active' });
      invalidate();
    } catch { onMutateError(); }
  };

  const handleUpdate = async (id: string, form: Partial<GoalFormData>) => {
    await updateMut.mutateAsync({ id, data: { title: form.title?.trim(), category: form.category, why: form.why?.trim() || undefined, metric: form.metric?.trim() || undefined, deadline: form.deadline || undefined } });
  };

  const handleDelete = (id: string) => {
    const g = goals.find(x => x.id === id);
    Alert.alert('Delete Goal', `Delete "${g?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(id) },
    ]);
  };

  const totalGoals     = goals.length;
  const activeGoals    = useMemo(() => goals.filter(g => g.status === 'active'), [goals]);
  const completedGoals = useMemo(() => goals.filter(g => g.status === 'completed'), [goals]);
  const avgProgress    = useMemo(() =>
    activeGoals.length
      ? Math.round(activeGoals.reduce((s, g) => {
          const ms = g.milestones ?? [];
          return s + (ms.length ? ms.filter(m => m.isCompleted).length / ms.length : 0);
        }, 0) / activeGoals.length * 100)
      : 0,
  [activeGoals]);

  const applySearch = (list: Goal[]) =>
    searchQuery ? list.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.category.toLowerCase().includes(searchQuery.toLowerCase())) : list;

  const filteredAll = useMemo(() => applySearch(catFilter === 'All' ? goals : goals.filter(g => g.category === catFilter)), [goals, catFilter, searchQuery]);

  const headerTitle = activeTab === 'overview' ? 'Goals' : activeTab === 'active' ? 'Active' : activeTab === 'completed' ? 'Completed' : 'All Goals';

  const sharedProps = {
    onEdit: setEditGoal,
    onDelete: handleDelete,
    onComplete: (id: string) => completeMut.mutate(id),
    onPause: (id: string, status: Goal['status']) => pauseMut.mutate({ id, status }),
    onToggleMilestone: (goalId: string, ms: GoalMilestone) => toggleMilestoneMut.mutate({ goalId, ms }),
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, backgroundColor: BG }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <TouchableOpacity onPress={() => setShowMore(true)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' }}>
            <Menu size={20} color="#E5E7EB" />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '700', color: TXT }} numberOfLines={1}>{headerTitle}</Text>
        </View>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/')} activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 6 }}>
          <MyOrbitLogo />
          <Text style={{ fontSize: 18, fontWeight: '700', color: TXT }}>MyOrbit</Text>
        </TouchableOpacity>
      </View>

      {/* Search + Add */}
      <View style={{ paddingHorizontal: 14, paddingBottom: 10, backgroundColor: BG, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 9, gap: 8 }}>
          <Search size={15} color={MUTED} />
          <TextInput style={{ flex: 1, fontSize: 14, color: TXT }} placeholder="Search goals…" placeholderTextColor={MUTED} value={searchQuery} onChangeText={setSearchQuery} />
          {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={15} color={MUTED} /></TouchableOpacity>}
        </View>
        <TouchableOpacity onPress={() => setShowAdd(true)}
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Stats */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginVertical: 14 }}>
              {[
                { label: 'Total',    val: String(totalGoals),            color: '#64748B' },
                { label: 'Active',   val: String(activeGoals.length),    color: ACCENT },
                { label: 'Done',     val: String(completedGoals.length), color: '#3B82F6' },
                { label: 'Progress', val: `${avgProgress}%`,             color: '#10B981' },
              ].map(s => (
                <View key={s.label} style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: s.color }}>{s.val}</Text>
                  <Text style={{ fontSize: 10, color: MUTED, marginTop: 2, textAlign: 'center' }}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Category filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {['All', ...CATEGORIES].map(c => (
                <TouchableOpacity key={c} onPress={() => setCatFilter(c)}
                  style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: catFilter === c ? ACCENT : BORDER, backgroundColor: catFilter === c ? ACCENT + '22' : SURFACE2, marginRight: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: catFilter === c ? ACCENT : MUTED }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Goals */}
            <View style={{ paddingHorizontal: 16 }}>
              {isLoading ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}><ActivityIndicator size="large" color={ACCENT} /></View>
              ) : filteredAll.length === 0 ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <Target size={40} color={MUTED} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2, marginTop: 12 }}>{searchQuery ? 'No goals match your search' : 'No goals yet'}</Text>
                  <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{!searchQuery && 'Tap + to set your first goal'}</Text>
                </View>
              ) : (
                filteredAll.map(g => <GoalCard key={g.id} goal={g} {...sharedProps} />)
              )}
            </View>
          </ScrollView>
        )}

        {/* ── ACTIVE ── */}
        {activeTab === 'active' && (
          <GoalsList goals={applySearch(activeGoals)} isLoading={isLoading} refetch={refetch} {...sharedProps}
            EmptyIcon={Target} emptyText={searchQuery ? 'No active goals match' : 'No active goals'} emptySubtext={!searchQuery ? 'Tap + to start working towards something' : ''} />
        )}

        {/* ── COMPLETED ── */}
        {activeTab === 'completed' && (
          <GoalsList goals={applySearch(completedGoals)} isLoading={isLoading} refetch={refetch} {...sharedProps}
            EmptyIcon={Trophy} emptyText={searchQuery ? 'No completed goals match' : 'No completed goals yet'} emptySubtext={!searchQuery ? 'Keep working — you\'ll get there!' : ''} />
        )}

        {/* ── ALL ── */}
        {activeTab === 'all' && (
          <GoalsList goals={applySearch(goals)} isLoading={isLoading} refetch={refetch} {...sharedProps}
            EmptyIcon={Inbox} emptyText={searchQuery ? 'No goals match your search' : 'No goals yet'} emptySubtext={!searchQuery ? 'Add your first goal to get started' : ''} />
        )}

      </View>

      {/* Bottom Nav */}
      <SubNav active={activeTab} onSelect={tab => { setActiveTab(tab); setSearchQuery(''); }} onMore={() => setShowMore(true)} />

      {/* Modals */}
      <MoreSheet visible={showMore} active={activeTab} onSelect={tab => { setActiveTab(tab); setSearchQuery(''); }} onClose={() => setShowMore(false)} userName={user?.name} />

      <GoalModal visible={showAdd} onClose={() => setShowAdd(false)} onCreate={handleCreate} onUpdate={() => {}} />
      <GoalModal visible={!!editGoal} initial={editGoal} onClose={() => setEditGoal(null)} onCreate={() => {}} onUpdate={handleUpdate} />
    </SafeAreaView>
  );
}
