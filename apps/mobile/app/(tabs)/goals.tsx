import { useState, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
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
  Plus, Target, CheckCircle, Circle, Trash2, ChevronLeft, ChevronRight,
  LayoutDashboard, Pause, Pencil, Zap, MoreHorizontal, X, Settings,
  CheckSquare, RotateCcw,
} from 'lucide-react-native';
import AppHeader from '@/components/shared/AppHeader';

// ── Types ────────────────────────────────────────────────────────────────────

type SubTab = 'overview' | 'active' | 'completed' | 'all';

// ── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#7C3AED';   // violet-700

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

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: '#10B981', bg: '#10B98122' },
  completed: { label: 'Completed', color: '#3B82F6', bg: '#3B82F622' },
  paused:    { label: 'Paused',    color: '#F59E0B', bg: '#F59E0B22' },
};

const CATEGORIES: Goal['category'][] = ['Finance', 'Health', 'Career', 'Learning', 'Personal', 'Other'];
const FREQ_OPTIONS = ['daily', 'weekly', 'monthly'] as const;

// ── Sub Nav ──────────────────────────────────────────────────────────────────

function SubNav({ active, onSelect, onMore }: {
  active: SubTab; onSelect: (t: SubTab) => void; onMore: () => void;
}) {
  const isMoreActive = !SUB_TABS.some(t => t.key === active);
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
        <MoreHorizontal size={16} color={isMoreActive ? ACCENT : '#9CA3AF'} />
        <Text style={{ fontSize: 13, fontWeight: '500', color: isMoreActive ? ACCENT : '#9CA3AF', marginTop: 2 }}>More</Text>
        {isMoreActive && <View style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, backgroundColor: ACCENT, borderRadius: 1 }} />}
      </TouchableOpacity>
    </View>
  );
}

// ── More Sheet ───────────────────────────────────────────────────────────────

function MoreSheet({ visible, active, onSelect, onClose }: {
  visible: boolean; active: SubTab; onSelect: (t: SubTab) => void; onClose: () => void;
}) {
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
        {MORE_ITEMS.map(({ key, label, Icon }) => (
          <TouchableOpacity key={key} onPress={() => { onSelect(key); onClose(); }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: active === key ? '#7C3AED22' : 'white' }}>
            <Icon size={16} color={active === key ? ACCENT : '#9CA3AF'} />
            <Text style={{ fontSize: 16, fontWeight: '500', color: active === key ? ACCENT : '#374151' }}>{label}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 1, backgroundColor: '#2A2A2A', marginHorizontal: 16, marginVertical: 4 }} />
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
          <Settings size={16} color="#9CA3AF" />
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#E5E7EB' }}>Goals Settings</Text>
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
  const catColor   = CAT_COLORS[goal.category] ?? '#64748B';
  const cfg        = STATUS_CONFIG[goal.status];
  const milestones = goal.milestones ?? [];
  const processes  = goal.processes ?? [];
  const done       = milestones.filter(m => m.isCompleted).length;
  const pct        = milestones.length ? Math.round((done / milestones.length) * 100) : 0;
  const isOverdue  = goal.deadline && goal.deadline < new Date().toLocaleDateString('en-CA') && goal.status === 'active';

  return (
    <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderLeftWidth: 3, borderLeftColor: catColor }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: catColor + '22' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: catColor }}>{goal.category}</Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: cfg.bg }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: cfg.color }}>{cfg.label}</Text>
            </View>
            {isOverdue && (
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: '#EF444422' }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#EF4444' }}>Overdue</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>{goal.title}</Text>
          {goal.why && <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3, fontStyle: 'italic' }} numberOfLines={2}>"{goal.why}"</Text>}
        </View>
        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity onPress={() => onEdit(goal)} style={{ padding: 6, borderRadius: 8, backgroundColor: '#7C3AED22' }}>
            <Pencil size={14} color={ACCENT} />
          </TouchableOpacity>
          {goal.status !== 'completed' && (
            <TouchableOpacity onPress={() => onPause(goal.id, goal.status)} style={{ padding: 6, borderRadius: 8, backgroundColor: goal.status === 'paused' ? '#F59E0B22' : '#2A2A2A' }}>
              {goal.status === 'paused'
                ? <RotateCcw size={14} color="#F59E0B" />
                : <Pause size={14} color="#9CA3AF" />}
            </TouchableOpacity>
          )}
          {goal.status !== 'completed' && (
            <TouchableOpacity onPress={() => onComplete(goal.id)} style={{ padding: 6, borderRadius: 8, backgroundColor: '#10B98122' }}>
              <CheckCircle size={14} color="#10B981" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => onDelete(goal.id)} style={{ padding: 6, borderRadius: 8, backgroundColor: '#EF444422' }}>
            <Trash2 size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Deadline */}
      {goal.deadline && (
        <Text style={{ fontSize: 16, color: isOverdue ? '#EF4444' : '#9CA3AF', marginBottom: 8 }}>
          📅 {goal.deadline}
        </Text>
      )}

      {/* Milestone progress bar */}
      {milestones.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
            <Text style={{ fontSize: 16, color: '#9CA3AF' }}>{done}/{milestones.length} milestones</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#E5E7EB' }}>{pct}%</Text>
          </View>
          <View style={{ height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, overflow: 'hidden' }}>
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
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 }}>
                {ms.isCompleted
                  ? <CheckCircle size={16} color="#10B981" />
                  : <Circle size={16} color="#D1D5DB" />}
                <Text style={{ flex: 1, fontSize: 16, color: ms.isCompleted ? '#9CA3AF' : '#374151', textDecorationLine: ms.isCompleted ? 'line-through' : 'none' }}>
                  {ms.title}
                </Text>
                <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{horizonLabel}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Processes */}
      {processes.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {processes.map(p => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: ACCENT + '11' }}>
              <Zap size={10} color={ACCENT} />
              <Text style={{ fontSize: 16, color: ACCENT, fontWeight: '500' }}>{p.title}</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>· {p.frequency}</Text>
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
  title: string;
  category: Goal['category'];
  why: string;
  metric: string;
  deadline: string;
  ms1m: string;   // 1-month milestone title
  ms3m: string;   // 3-month milestone title
  ms6m: string;   // 6-month milestone title
  proc1: string;
  proc1freq: typeof FREQ_OPTIONS[number];
  proc2: string;
  proc2freq: typeof FREQ_OPTIONS[number];
}

function GoalModal({ visible, initial, onClose, onCreate, onUpdate }: {
  visible: boolean;
  initial?: Goal | null;
  onClose: () => void;
  onCreate: (data: GoalFormData) => void;
  onUpdate: (id: string, data: Partial<GoalFormData>) => void;
}) {
  const isEdit = !!initial;
  const [step, setStep]   = useState<GoalFormStep>(1);
  const [form, setForm]   = useState<GoalFormData>({
    title: '', category: 'Personal', why: '', metric: '', deadline: '',
    ms1m: '', ms3m: '', ms6m: '',
    proc1: '', proc1freq: 'daily', proc2: '', proc2freq: 'weekly',
  });

  useEffect(() => {
    if (!visible) return;
    setStep(1);
    if (initial) {
      const ms = initial.milestones ?? [];
      const ps = initial.processes ?? [];
      setForm({
        title:    initial.title,
        category: initial.category,
        why:      initial.why ?? '',
        metric:   initial.metric ?? '',
        deadline: initial.deadline ?? '',
        ms1m: ms.find(m => m.horizon === '1m')?.title ?? '',
        ms3m: ms.find(m => m.horizon === '3m')?.title ?? '',
        ms6m: ms.find(m => m.horizon === '6m')?.title ?? '',
        proc1: ps[0]?.title ?? '',
        proc1freq: (ps[0]?.frequency as any) ?? 'daily',
        proc2: ps[1]?.title ?? '',
        proc2freq: (ps[1]?.frequency as any) ?? 'weekly',
      });
    } else {
      setForm({ title: '', category: 'Personal', why: '', metric: '', deadline: '', ms1m: '', ms3m: '', ms6m: '', proc1: '', proc1freq: 'daily', proc2: '', proc2freq: 'weekly' });
    }
  }, [visible, initial?.id]);

  const set = (k: keyof GoalFormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (isEdit && initial) {
      onUpdate(initial.id, form);
    } else {
      onCreate(form);
    }
    onClose();
  };

  const today = new Date().toLocaleDateString('en-CA');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, maxHeight: '90%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#3A3A3A', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
              {isEdit ? 'Edit Goal' : step === 1 ? 'New Goal' : 'Milestones & Processes'}
            </Text>
            {!isEdit && (
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {([1, 2] as GoalFormStep[]).map(s => (
                  <View key={s} style={{ height: 4, width: 28, borderRadius: 2, backgroundColor: s <= step ? ACCENT : '#E5E7EB' }} />
                ))}
              </View>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* ── STEP 1 ── */}
            {(step === 1 || isEdit) && (
              <>
                <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Title *</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#FFFFFF', marginBottom: 14 }}
                  placeholder="e.g. Save ₹5 lakhs, Run a marathon"
                  value={form.title}
                  onChangeText={v => set('title', v)}
                  autoFocus={!isEdit}
                />

                <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>Category</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity key={c} onPress={() => set('category', c)}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: form.category === c ? ACCENT : '#E5E7EB', backgroundColor: form.category === c ? '#7C3AED22' : '#242424' }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: form.category === c ? ACCENT : '#6B7280' }}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Why? (optional)</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: '#FFFFFF', marginBottom: 14, minHeight: 60, textAlignVertical: 'top' }}
                  placeholder="Your motivation for this goal..."
                  multiline
                  value={form.why}
                  onChangeText={v => set('why', v)}
                />

                <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Success Metric (optional)</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#FFFFFF', marginBottom: 14 }}
                  placeholder="How will you measure success?"
                  value={form.metric}
                  onChangeText={v => set('metric', v)}
                />

                <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Deadline (optional)</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#FFFFFF', marginBottom: 16 }}
                  placeholder={`YYYY-MM-DD (e.g. ${today})`}
                  value={form.deadline}
                  onChangeText={v => set('deadline', v)}
                  keyboardType="numbers-and-punctuation"
                />
              </>
            )}

            {/* ── STEP 2 (new goals only) ── */}
            {(step === 2 && !isEdit) && (
              <>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Milestones (optional)</Text>

                {([
                  { key: 'ms6m' as keyof GoalFormData, label: '6-Month milestone' },
                  { key: 'ms3m' as keyof GoalFormData, label: '3-Month milestone' },
                  { key: 'ms1m' as keyof GoalFormData, label: '1-Month milestone' },
                ] as const).map(({ key, label }) => (
                  <View key={key} style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>{label}</Text>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 11, fontSize: 16, color: '#FFFFFF' }}
                      placeholder={`Where will you be in ${key.replace('ms', '')}?`}
                      value={form[key]}
                      onChangeText={v => set(key, v)}
                    />
                  </View>
                ))}

                <Text style={{ fontSize: 16, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 10 }}>Recurring Processes (optional)</Text>

                {([
                  { titleKey: 'proc1' as keyof GoalFormData, freqKey: 'proc1freq' as keyof GoalFormData, n: 1 },
                  { titleKey: 'proc2' as keyof GoalFormData, freqKey: 'proc2freq' as keyof GoalFormData, n: 2 },
                ] as const).map(({ titleKey, freqKey, n }) => (
                  <View key={String(n)} style={{ marginBottom: 12, flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={{ flex: 1, borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 14, paddingVertical: 11, fontSize: 16, color: '#FFFFFF' }}
                      placeholder={`Process ${n} (e.g. Run 5km)`}
                      value={form[titleKey]}
                      onChangeText={v => set(titleKey, v)}
                    />
                    <View style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', overflow: 'hidden' }}>
                      {FREQ_OPTIONS.map(f => (
                        <TouchableOpacity key={f} onPress={() => set(freqKey, f)}
                          style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: form[freqKey] === f ? ACCENT + '22' : 'transparent' }}>
                          <Text style={{ fontSize: 16, color: form[freqKey] === f ? ACCENT : '#9CA3AF', fontWeight: '500', textTransform: 'capitalize' }}>{f}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}

                <View style={{ height: 16 }} />
              </>
            )}
          </ScrollView>

          {/* Footer buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            {!isEdit && step === 2 ? (
              <>
                <TouchableOpacity onPress={() => setStep(1)} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A' }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#9CA3AF' }}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={!form.title.trim()}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: form.title.trim() ? 1 : 0.5 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>Create Goal</Text>
                </TouchableOpacity>
              </>
            ) : isEdit ? (
              <>
                <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A' }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#9CA3AF' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={!form.title.trim()}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: form.title.trim() ? 1 : 0.5 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>Save</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A' }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#9CA3AF' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { if (!form.title.trim()) return; setStep(2); }} disabled={!form.title.trim()}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: form.title.trim() ? 1 : 0.5 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>Next →</Text>
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

function GoalsList({ goals, isLoading, refetch, onEdit, onDelete, onComplete, onPause, onToggleMilestone, emptyEmoji, emptyText, emptySubtext }: {
  goals: Goal[]; isLoading: boolean; refetch: () => void;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void; onComplete: (id: string) => void;
  onPause: (id: string, current: Goal['status']) => void;
  onToggleMilestone: (goalId: string, ms: GoalMilestone) => void;
  emptyEmoji: string; emptyText: string; emptySubtext: string;
}) {
  return (
    <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      {isLoading ? (
        <View style={{ paddingVertical: 48, alignItems: 'center' }}><ActivityIndicator size="large" color={ACCENT} /></View>
      ) : goals.length === 0 ? (
        <View style={{ paddingVertical: 48, alignItems: 'center' }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>{emptyEmoji}</Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB' }}>{emptyText}</Text>
          <Text style={{ fontSize: 16, color: '#9CA3AF', marginTop: 4 }}>{emptySubtext}</Text>
        </View>
      ) : (
        goals.map(g => (
          <GoalCard key={g.id} goal={g}
            onEdit={onEdit} onDelete={onDelete} onComplete={onComplete}
            onPause={onPause} onToggleMilestone={onToggleMilestone} />
        ))
      )}
    </ScrollView>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const [activeTab, setActiveTab] = useState<SubTab>('overview');
  const [showAdd, setShowAdd]     = useState(false);
  const [showMore, setShowMore]   = useState(false);
  const [editGoal, setEditGoal]   = useState<Goal | null>(null);
  const [catFilter, setCatFilter] = useState<string>('All');
  const qc = useQueryClient();

  const { data: goals = [], isLoading, refetch } =
    useQuery({ queryKey: ['goals'], queryFn: getGoals });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['goals'] });

  const deleteMut   = useMutation({ mutationFn: deleteGoal, onSuccess: invalidate });
  const completeMut = useMutation({
    mutationFn: (id: string) => updateGoal(id, { status: 'completed' }),
    onSuccess: invalidate,
  });
  const pauseMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Goal['status'] }) =>
      updateGoal(id, { status: status === 'paused' ? 'active' : 'paused' }),
    onSuccess: invalidate,
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Goal> }) => updateGoal(id, data),
    onSuccess: invalidate,
  });
  const toggleMilestoneMut = useMutation({
    mutationFn: ({ goalId, ms }: { goalId: string; ms: GoalMilestone }) =>
      updateMilestone(goalId, ms.id, { isCompleted: !ms.isCompleted }),
    onSuccess: invalidate,
  });

  // ── Create goal with milestones + processes ──────────────────────────────

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
      await createGoal({
        title:    form.title.trim(),
        category: form.category,
        why:      form.why.trim() || undefined,
        metric:   form.metric.trim() || undefined,
        deadline: form.deadline || undefined,
        milestones: milestones as any,
        processes:  processes as any,
        status: 'active',
      });
      invalidate();
    } catch {}
  };

  // ── Edit goal (basic fields only, not milestones) ────────────────────────

  const handleUpdate = async (id: string, form: Partial<GoalFormData>) => {
    await updateMut.mutateAsync({
      id,
      data: {
        title:    form.title?.trim(),
        category: form.category,
        why:      form.why?.trim() || undefined,
        metric:   form.metric?.trim() || undefined,
        deadline: form.deadline || undefined,
      },
    });
  };

  const handleDelete = (id: string) => {
    const g = goals.find(x => x.id === id);
    Alert.alert('Delete Goal', `Delete "${g?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(id) },
    ]);
  };

  // ── Derived data ─────────────────────────────────────────────────────────

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

  const filteredAll = useMemo(() =>
    catFilter === 'All' ? goals : goals.filter(g => g.category === catFilter),
  [goals, catFilter]);

  const sharedProps = {
    onEdit: setEditGoal,
    onDelete: handleDelete,
    onComplete: completeMut.mutate,
    onPause: (id: string, status: Goal['status']) => pauseMut.mutate({ id, status }),
    onToggleMilestone: (goalId: string, ms: GoalMilestone) => toggleMilestoneMut.mutate({ goalId, ms }),
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111111' }}>
      <AppHeader title="Goals" showBack />

      <View style={{ flex: 1 }}>

        {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Stats */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginVertical: 16 }}>
              {[
                { label: 'Total',     val: String(totalGoals),           color: '#64748B' },
                { label: 'Active',    val: String(activeGoals.length),   color: ACCENT },
                { label: 'Done',      val: String(completedGoals.length), color: '#3B82F6' },
                { label: 'Progress',  val: `${avgProgress}%`,            color: '#10B981' },
              ].map(s => (
                <View key={s.label} style={{ flex: 1, backgroundColor: '#1A1A1A', borderRadius: 14, padding: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: s.color }}>{s.val}</Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3, textAlign: 'center' }}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Category filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
              {['All', ...CATEGORIES].map(c => (
                <TouchableOpacity key={c} onPress={() => setCatFilter(c)}
                  style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: catFilter === c ? ACCENT : '#E5E7EB', backgroundColor: catFilter === c ? '#7C3AED22' : '#242424', marginRight: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: catFilter === c ? ACCENT : '#6B7280' }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Goals */}
            <View style={{ paddingHorizontal: 20 }}>
              {isLoading ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}><ActivityIndicator size="large" color={ACCENT} /></View>
              ) : filteredAll.length === 0 ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>🎯</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB' }}>No goals yet</Text>
                  <Text style={{ fontSize: 16, color: '#9CA3AF', marginTop: 4 }}>Tap + to set your first goal</Text>
                </View>
              ) : (
                filteredAll.map(g => <GoalCard key={g.id} goal={g} {...sharedProps} />)
              )}
            </View>
          </ScrollView>
        )}

        {/* ── ACTIVE ────────────────────────────────────────────────────────── */}
        {activeTab === 'active' && (
          <GoalsList goals={activeGoals} isLoading={isLoading} refetch={refetch} {...sharedProps}
            emptyEmoji="🎯" emptyText="No active goals" emptySubtext="Tap + to start working towards something" />
        )}

        {/* ── COMPLETED ─────────────────────────────────────────────────────── */}
        {activeTab === 'completed' && (
          <GoalsList goals={completedGoals} isLoading={isLoading} refetch={refetch} {...sharedProps}
            emptyEmoji="🏆" emptyText="No completed goals yet" emptySubtext="Keep working — you'll get there!" />
        )}

        {/* ── ALL ───────────────────────────────────────────────────────────── */}
        {activeTab === 'all' && (
          <GoalsList goals={goals} isLoading={isLoading} refetch={refetch} {...sharedProps}
            emptyEmoji="📭" emptyText="No goals yet" emptySubtext="Add your first goal to get started" />
        )}

      </View>

      {/* Bottom Nav */}
      <SubNav active={activeTab} onSelect={setActiveTab} onMore={() => setShowMore(true)} />

      {/* FAB */}
      <TouchableOpacity onPress={() => setShowAdd(true)}
        style={{ position: 'absolute', bottom: 72, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', shadowColor: ACCENT, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 }}>
        <Plus size={26} color="white" />
      </TouchableOpacity>

      {/* Modals */}
      <MoreSheet visible={showMore} active={activeTab} onSelect={setActiveTab} onClose={() => setShowMore(false)} />

      <GoalModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onCreate={handleCreate}
        onUpdate={() => {}}
      />

      <GoalModal
        visible={!!editGoal}
        initial={editGoal}
        onClose={() => setEditGoal(null)}
        onCreate={() => {}}
        onUpdate={handleUpdate}
      />
    </SafeAreaView>
  );
}
