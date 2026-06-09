import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/lib/themeStore';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/authStore';
import Svg, { Circle as SvgCircle, Rect, Text as SvgText } from 'react-native-svg';
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
  LayoutDashboard, Pause, Pencil, Zap, X, Settings,
  CheckSquare, RotateCcw, Search, Flag,
  Wallet, Heart, Briefcase, BookOpen, User, CalendarDays, Trophy, Inbox,
  Play,
} from 'lucide-react-native';

// ── Types ────────────────────────────────────────────────────────────────────

type SubTab = 'overview' | 'active' | 'completed' | 'settings';

// ── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#A78BFA';

function useColors() {
  const T = useTheme();
  return {
    BG:      T.bg,
    SURFACE: T.cardBg,
    SURFACE2: T.surfaceAlt ?? T.surface,
    BORDER:  T.border,
    MUTED:   T.subText,
    TXT:     T.text,
    TXT2:    T.textSec,
    MODAL:   T.modalBg,
    INPUT:   T.inputBg,
  };
}

const SUB_TABS: { key: SubTab; label: string; Icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { key: 'overview',   label: 'Overview',   Icon: LayoutDashboard },
  { key: 'active',     label: 'Active',     Icon: Play },
  { key: 'completed',  label: 'Completed',  Icon: CheckCircle },
  { key: 'settings',   label: 'Settings',   Icon: Settings },
];

const CAT_COLORS: Record<string, string> = {
  Finance: '#00E5A0', Health: '#FF6B6B', Career: '#5BE4FF',
  Learning: '#6366F1', Personal: '#F9A44A', Other: '#A78BFA',
  default: '#A78BFA',
};

const CAT_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Finance: Wallet, Health: Heart, Career: Briefcase,
  Learning: BookOpen, Personal: User, Other: Flag,
};

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: '#00E5A0', bg: '#00E5A022' },
  completed: { label: 'Completed', color: '#5BE4FF', bg: '#5BE4FF22' },
  paused:    { label: 'Paused',    color: '#F9A44A', bg: '#F9A44A22' },
};

const CATEGORIES = ['Finance', 'Health', 'Career', 'Learning', 'Personal', 'Other'] as const;
const FREQ_OPTIONS = ['daily', 'weekly', 'monthly'] as const;

// ── Radial Progress Ring ──────────────────────────────────────────────────────

function RadialProgress({ pct, color, size = 64, strokeWidth = 6, children }: {
  pct: number; color: string; size?: number; strokeWidth?: number; children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  const cx = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <SvgCircle cx={cx} cy={cx} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} fill="none" />
        <SvgCircle cx={cx} cy={cx} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </Svg>
      {children}
    </View>
  );
}

// ── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({ goal, onEdit, onDelete, onComplete, onPause, onToggleMilestone, compact }: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onPause: (id: string, current: Goal['status']) => void;
  onToggleMilestone: (goalId: string, ms: GoalMilestone) => void;
  compact?: boolean;
}) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2 } = useColors();
  const catColor   = CAT_COLORS[goal.category ?? 'default'] ?? '#A78BFA';
  const cfg        = STATUS_CONFIG[goal.status];
  const milestones = goal.milestones ?? [];
  const processes  = goal.processes  ?? [];
  const done       = milestones.filter(m => m.isCompleted).length;
  const pct        = milestones.length ? Math.round((done / milestones.length) * 100) : 0;
  const today      = new Date().toLocaleDateString('en-CA');
  const isOverdue  = goal.deadline && goal.deadline < today && goal.status === 'active';
  const daysLeft: number | null = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <View style={{
      backgroundColor: SURFACE,
      borderRadius: 18,
      marginBottom: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: BORDER,
    }}>
      {/* Top accent bar */}
      <View style={{ height: 3, backgroundColor: catColor, opacity: 0.9 }} />

      <View style={{ padding: 14 }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            {/* Chips row */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: catColor + '22' }}>
                {(() => { const I = CAT_ICONS[goal.category]; return I ? <I size={10} color={catColor} /> : null; })()}
                <Text style={{ fontSize: 11, fontWeight: '600', color: catColor }}>{goal.category}</Text>
              </View>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: cfg.bg }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: cfg.color }}>{cfg.label}</Text>
              </View>
              {isOverdue && (
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: '#FF6B6B22' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#FF6B6B' }}>Overdue</Text>
                </View>
              )}
              {daysLeft !== null && !isOverdue && goal.status === 'active' && (
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: SURFACE2 }}>
                  <Text style={{ fontSize: 11, color: MUTED }}>
                    {daysLeft <= 0 ? 'Due today' : `${daysLeft}d left`}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: TXT }}>{goal.title}</Text>
            {goal.why != null && !compact && (
              <Text style={{ fontSize: 12, color: MUTED, marginTop: 3, fontStyle: 'italic' }} numberOfLines={1}>"{goal.why}"</Text>
            )}
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity onPress={() => onEdit(goal)} style={{ padding: 6, borderRadius: 8, backgroundColor: ACCENT + '22' }}>
              <Pencil size={13} color={ACCENT} />
            </TouchableOpacity>
            {goal.status !== 'completed' && (
              <TouchableOpacity onPress={() => onPause(goal.id, goal.status)} style={{ padding: 6, borderRadius: 8, backgroundColor: goal.status === 'paused' ? '#F9A44A22' : SURFACE2 }}>
                {goal.status === 'paused' ? <RotateCcw size={13} color="#F9A44A" /> : <Pause size={13} color={MUTED} />}
              </TouchableOpacity>
            )}
            {goal.status !== 'completed' && (
              <TouchableOpacity onPress={() => onComplete(goal.id)} style={{ padding: 6, borderRadius: 8, backgroundColor: '#00E5A022' }}>
                <CheckCircle size={13} color="#00E5A0" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => onDelete(goal.id)} style={{ padding: 6, borderRadius: 8, backgroundColor: '#FF6B6B22' }}>
              <Trash2 size={13} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress bar */}
        {milestones.length > 0 && (
          <View style={{ marginBottom: compact ? 0 : 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ fontSize: 11, color: MUTED }}>{done}/{milestones.length} milestones</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: catColor }}>{pct}%</Text>
            </View>
            <View style={{ height: 5, backgroundColor: SURFACE2, borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ height: '100%', borderRadius: 3, width: `${pct}%`, backgroundColor: catColor }} />
            </View>
          </View>
        )}

        {/* Milestones list (non-compact) */}
        {!compact && milestones.length > 0 && (
          <View style={{ marginTop: 2, marginBottom: 8, gap: 5 }}>
            {milestones.map(ms => (
              <TouchableOpacity key={ms.id} onPress={() => onToggleMilestone(goal.id, ms)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 }}>
                {ms.isCompleted
                  ? <CheckCircle size={14} color="#00E5A0" />
                  : <Circle size={14} color={MUTED} />}
                <Text style={{ flex: 1, fontSize: 12, color: ms.isCompleted ? MUTED : TXT2, textDecorationLine: ms.isCompleted ? 'line-through' : 'none' }} numberOfLines={1}>
                  {ms.title}
                </Text>
                <Text style={{ fontSize: 10, color: MUTED }}>
                  {ms.horizon === '1m' ? '1mo' : ms.horizon === '3m' ? '3mo' : ms.horizon === '6m' ? '6mo' : ms.horizon}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Processes (non-compact) */}
        {!compact && processes.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
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
    </View>
  );
}

// ── Add / Edit Goal Modal ─────────────────────────────────────────────────────

type GoalFormStep = 1 | 2;

interface GoalFormData {
  title: string; category: string; why: string; metric: string; deadline: string;
  ms1m: string; ms3m: string; ms6m: string;
  proc1: string; proc1freq: typeof FREQ_OPTIONS[number];
  proc2: string; proc2freq: typeof FREQ_OPTIONS[number];
}

function GoalModal({ visible, initial, onClose, onCreate, onUpdate }: {
  visible: boolean; initial?: Goal | null; onClose: () => void;
  onCreate: (data: GoalFormData) => void; onUpdate: (id: string, data: Partial<GoalFormData>) => void;
}) {
  const { SURFACE, SURFACE2, BORDER, MUTED, TXT } = useColors();
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
        title: initial.title, category: initial.category ?? 'Personal', why: initial.why ?? '',
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
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
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
                    const color   = CAT_COLORS[c];
                    return (
                      <TouchableOpacity key={c} onPress={() => set('category', c)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: active ? color : BORDER, backgroundColor: active ? color + '22' : SURFACE2 }}>
                        {CatIcon && <CatIcon size={12} color={active ? color : MUTED} />}
                        <Text style={{ fontSize: 12, fontWeight: '600', color: active ? color : MUTED }}>{c}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Why? (optional)</Text>
                <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: TXT, marginBottom: 14, minHeight: 60, textAlignVertical: 'top' }}
                  placeholder="Your motivation for this goal..." placeholderTextColor={MUTED} multiline value={form.why} onChangeText={v => set('why', v)} />
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

// ── Sub Nav ──────────────────────────────────────────────────────────────────

function SubNav({ active, onSelect }: { active: SubTab; onSelect: (t: SubTab) => void }) {
  const { BG, BORDER, MUTED } = useColors();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: BG, borderTopWidth: 1, borderTopColor: BORDER }}>
      {SUB_TABS.map(({ key, label, Icon }) => {
        const on = active === key;
        return (
          <TouchableOpacity key={key} onPress={() => onSelect(key)}
            style={{ flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 7 }}>
            {on && <View style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, backgroundColor: ACCENT, borderRadius: 1 }} />}
            <Icon size={20} color={on ? ACCENT : MUTED} />
            <Text style={{ fontSize: 11, fontWeight: '500', color: on ? ACCENT : MUTED, marginTop: 3 }}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Stable empty array — prevents new [] reference on every render when query is loading
const EMPTY_GOALS: any[] = [];

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2 } = useColors();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<SubTab>('overview');
  const [showAdd, setShowAdd]     = useState(false);
  const [editGoal, setEditGoal]   = useState<Goal | null>(null);
  const [catFilter, setCatFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const qc = useQueryClient();

  const { data: goals = EMPTY_GOALS, isLoading, refetch } =
    useQuery({ queryKey: ['goals'], queryFn: getGoals });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['goals'] });
  const onMutateError = () => Alert.alert('Error', 'Something went wrong. Please try again.');

  const deleteMut   = useMutation({ mutationFn: deleteGoal, onSuccess: invalidate, onError: onMutateError });
  const completeMut = useMutation({ mutationFn: (id: string) => updateGoal(id, { status: 'completed' }), onSuccess: invalidate, onError: onMutateError });
  const pauseMut    = useMutation({ mutationFn: ({ id, status }: { id: string; status: Goal['status'] }) => updateGoal(id, { status: status === 'paused' ? 'active' : 'paused' }), onSuccess: invalidate, onError: onMutateError });
  const updateMut   = useMutation({ mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateGoal>[1] }) => updateGoal(id, data), onSuccess: invalidate, onError: onMutateError });
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
    await updateMut.mutateAsync({ id, data: {
      title: form.title?.trim(),
      category: form.category,
      why: form.why?.trim() || undefined,
      metric: form.metric?.trim() || undefined,
      deadline: form.deadline || undefined,
    } });
  };

  const handleDelete = (id: string) => {
    const g = goals.find(x => x.id === id);
    Alert.alert('Delete Goal', `Delete "${g?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(id) },
    ]);
  };

  const activeGoals    = useMemo(() => goals.filter(g => g.status === 'active'),    [goals]);
  const completedGoals = useMemo(() => goals.filter(g => g.status === 'completed'), [goals]);
  const pausedGoals    = useMemo(() => goals.filter(g => g.status === 'paused'),    [goals]);

  const avgProgress = useMemo(() =>
    activeGoals.length
      ? Math.round(activeGoals.reduce((s, g) => {
          const ms = g.milestones ?? [];
          return s + (ms.length ? ms.filter(m => m.isCompleted).length / ms.length : 0);
        }, 0) / activeGoals.length * 100)
      : 0,
  [activeGoals]);

  const applySearch = (list: Goal[]) =>
    searchQuery ? list.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase())) : list;

  const filteredGoals = useMemo(() =>
    applySearch(catFilter === 'All' ? goals : goals.filter(g => g.category === catFilter)),
  [goals, catFilter, searchQuery]);

  const sharedProps = {
    onEdit: setEditGoal,
    onDelete: handleDelete,
    onComplete: (id: string) => completeMut.mutate(id),
    onPause: (id: string, status: Goal['status']) => pauseMut.mutate({ id, status }),
    onToggleMilestone: (goalId: string, ms: GoalMilestone) => toggleMilestoneMut.mutate({ goalId, ms }),
  };

  // ── Category stats for settings tab ──────────────────────────────────────
  const catStats = useMemo(() =>
    CATEGORIES.map(cat => {
      const list = goals.filter(g => g.category === cat);
      const active = list.filter(g => g.status === 'active').length;
      const completed = list.filter(g => g.status === 'completed').length;
      const total = list.length;
      const pct = total ? Math.round((completed / total) * 100) : 0;
      return { cat, total, active, completed, pct, color: CAT_COLORS[cat] };
    }).filter(s => s.total > 0),
  [goals]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, backgroundColor: BG }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: TXT }}>Goals</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)}
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 9, gap: 8 }}>
          <Search size={15} color={MUTED} />
          <TextInput style={{ flex: 1, fontSize: 14, color: TXT }} placeholder="Search goals…" placeholderTextColor={MUTED} value={searchQuery} onChangeText={setSearchQuery} />
          {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={15} color={MUTED} /></TouchableOpacity>}
        </View>
      </View>

      <View style={{ flex: 1 }}>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Stats strip with radial rings */}
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Overall progress ring */}
                <View style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: BORDER }}>
                  <RadialProgress pct={avgProgress} color={ACCENT} size={72} strokeWidth={6}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: ACCENT }}>{avgProgress}%</Text>
                  </RadialProgress>
                  <Text style={{ fontSize: 11, color: MUTED, marginTop: 6, fontWeight: '600' }}>Avg Progress</Text>
                </View>

                {/* Stat boxes */}
                <View style={{ flex: 1.6, gap: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: BORDER }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: '#00E5A0' }}>{activeGoals.length}</Text>
                      <Text style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Active</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: BORDER }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: '#5BE4FF' }}>{completedGoals.length}</Text>
                      <Text style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Done</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: BORDER }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: '#F9A44A' }}>{pausedGoals.length}</Text>
                      <Text style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Paused</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: BORDER }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: TXT }}>{goals.length}</Text>
                      <Text style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Total</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Category filter pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {['All', ...CATEGORIES].map(c => {
                const color = c === 'All' ? ACCENT : CAT_COLORS[c];
                const active = catFilter === c;
                return (
                  <TouchableOpacity key={c} onPress={() => setCatFilter(c)}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: active ? color : BORDER, backgroundColor: active ? color + '22' : SURFACE, marginRight: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: active ? color : MUTED }}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Goal cards */}
            <View style={{ paddingHorizontal: 16 }}>
              {isLoading ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}><ActivityIndicator size="large" color={ACCENT} /></View>
              ) : filteredGoals.length === 0 ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <Target size={40} color={MUTED} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2, marginTop: 12 }}>{searchQuery ? 'No goals match' : 'No goals yet'}</Text>
                  <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{!searchQuery && 'Tap + to set your first goal'}</Text>
                </View>
              ) : (
                filteredGoals.map(g => <GoalCard key={g.id} goal={g} {...sharedProps} />)
              )}
            </View>
          </ScrollView>
        )}

        {/* ── ACTIVE ── */}
        {activeTab === 'active' && (
          <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            {/* Urgency insight banner */}
            {activeGoals.length > 0 && (() => {
              const overdue = activeGoals.filter(g => g.deadline && g.deadline < new Date().toLocaleDateString('en-CA'));
              const nearDeadline = activeGoals.filter(g => {
                if (!g.deadline) return false;
                const days = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86_400_000);
                return days >= 0 && days <= 7;
              });
              if (overdue.length === 0 && nearDeadline.length === 0) return null;
              return (
                <View style={{ backgroundColor: '#FF6B6B18', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FF6B6B33' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FF6B6B', marginBottom: 4 }}>
                    {overdue.length > 0 ? `⚠ ${overdue.length} goal${overdue.length > 1 ? 's' : ''} overdue` : `⏰ ${nearDeadline.length} goal${nearDeadline.length > 1 ? 's' : ''} due within 7 days`}
                  </Text>
                  <Text style={{ fontSize: 12, color: MUTED }}>Review and take action to stay on track.</Text>
                </View>
              );
            })()}

            {/* Status summary chips */}
            {activeGoals.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: '#00E5A022', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#00E5A033' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#00E5A0' }}>{activeGoals.length}</Text>
                  <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>In Progress</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: BORDER }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: ACCENT }}>{avgProgress}%</Text>
                  <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Avg Progress</Text>
                </View>
              </View>
            )}

            {isLoading ? (
              <View style={{ paddingVertical: 48, alignItems: 'center' }}><ActivityIndicator size="large" color={ACCENT} /></View>
            ) : applySearch(activeGoals).length === 0 ? (
              <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                <Play size={40} color={MUTED} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2, marginTop: 12 }}>{searchQuery ? 'No active goals match' : 'No active goals'}</Text>
                <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{!searchQuery && 'Tap + to start working towards something'}</Text>
              </View>
            ) : (
              applySearch(activeGoals).map(g => <GoalCard key={g.id} goal={g} {...sharedProps} />)
            )}
          </ScrollView>
        )}

        {/* ── COMPLETED ── */}
        {activeTab === 'completed' && (
          <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            {/* Trophy banner */}
            {completedGoals.length > 0 && (
              <View style={{ backgroundColor: '#5BE4FF18', borderRadius: 18, padding: 18, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#5BE4FF33' }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🏆</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#5BE4FF' }}>{completedGoals.length} Goal{completedGoals.length > 1 ? 's' : ''} Achieved</Text>
                <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Every completed goal is a victory worth celebrating.</Text>
              </View>
            )}

            {isLoading ? (
              <View style={{ paddingVertical: 48, alignItems: 'center' }}><ActivityIndicator size="large" color={ACCENT} /></View>
            ) : applySearch(completedGoals).length === 0 ? (
              <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                <Trophy size={40} color={MUTED} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2, marginTop: 12 }}>{searchQuery ? 'No completed goals match' : 'No completed goals yet'}</Text>
                <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{!searchQuery && "Keep working — you'll get there!"}</Text>
              </View>
            ) : (
              applySearch(completedGoals).map(g => <GoalCard key={g.id} goal={g} {...sharedProps} compact />)
            )}
          </ScrollView>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            {/* Overview stats */}
            <View style={{ backgroundColor: SURFACE, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: BORDER }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: TXT, marginBottom: 14 }}>Goal Overview</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {[
                  { label: 'Total',     val: goals.length,           color: TXT },
                  { label: 'Active',    val: activeGoals.length,     color: '#00E5A0' },
                  { label: 'Completed', val: completedGoals.length,  color: '#5BE4FF' },
                  { label: 'Paused',    val: pausedGoals.length,     color: '#F9A44A' },
                ].map(s => (
                  <View key={s.label} style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: s.color }}>{s.val}</Text>
                    <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Category breakdown */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Category Breakdown</Text>
            {catStats.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: MUTED }}>No goals yet to show breakdown</Text>
              </View>
            ) : (
              catStats.map(s => {
                const CatIcon = CAT_ICONS[s.cat];
                return (
                  <View key={s.cat} style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {CatIcon && <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: s.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                          <CatIcon size={15} color={s.color} />
                        </View>}
                        <Text style={{ fontSize: 14, fontWeight: '600', color: TXT }}>{s.cat}</Text>
                      </View>
                      <Text style={{ fontSize: 12, color: MUTED }}>{s.completed}/{s.total} done</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: SURFACE2, borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ height: '100%', borderRadius: 3, width: `${s.pct}%`, backgroundColor: s.color }} />
                    </View>
                    <Text style={{ fontSize: 11, color: s.color, fontWeight: '700', marginTop: 5 }}>{s.pct}% complete</Text>
                  </View>
                );
              })
            )}

            {/* Navigation to app settings */}
            <TouchableOpacity onPress={() => router.push('/(tabs)/settings' as any)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: SURFACE, borderRadius: 14, padding: 14, marginTop: 8, borderWidth: 1, borderColor: BORDER }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Settings size={16} color={MUTED} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: TXT2 }}>App Settings</Text>
              </View>
              <ChevronRight size={16} color={MUTED} />
            </TouchableOpacity>
          </ScrollView>
        )}

      </View>

      {/* Bottom Nav */}
      <SubNav active={activeTab} onSelect={tab => { setActiveTab(tab); setSearchQuery(''); }} />

      {/* Modals */}
      <GoalModal visible={showAdd} onClose={() => setShowAdd(false)} onCreate={handleCreate} onUpdate={() => {}} />
      <GoalModal visible={!!editGoal} initial={editGoal} onClose={() => setEditGoal(null)} onCreate={() => {}} onUpdate={handleUpdate} />
    </SafeAreaView>
  );
}
