import { useState, useCallback, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/authStore';
import { useNotificationStore } from '@/lib/notificationStore';
import { useTheme } from '@/lib/themeStore';
import { scheduleTaskNotification, cancelTaskNotification, snoozeTaskNotification, minutesUntilTomorrowMorning } from '@/lib/notifications';
import Svg, { Rect, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import {
  View, Text, SectionList, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTodayTasks, getAllTasks, createTask, updateTask, completeInstance, deleteTask,
  getTaskLists, createTaskList, updateTaskList, deleteTaskList,
} from '@myorbit/api';
import type { TaskInstance, Task, TaskList, CreateTaskInput } from '@myorbit/api';
import {
  CheckCircle, Circle, Clock, Plus, ChevronDown, ChevronRight, ChevronLeft,
  Trash2, AlertTriangle, Sun, Inbox as InboxIcon, List as ListIcon,
  CalendarDays, MoreHorizontal, X, CalendarCheck, Settings,
  Tag, Flag, Search, Bell, RotateCcw, Check, Pencil, Menu,
} from 'lucide-react-native';

// ── Types ────────────────────────────────────────────────────────────────────────
type SubTab = 'today' | 'inbox' | 'lists' | 'calendar' | 'next7';
type SortBy = 'custom' | 'date' | 'title' | 'priority';

// ── Constants ─────────────────────────────────────────────────────────────────────
const ACCENT   = '#10B981';

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
  { key: 'today'    as SubTab, label: 'Today',    Icon: Sun       },
  { key: 'inbox'    as SubTab, label: 'Inbox',    Icon: InboxIcon },
  { key: 'lists'    as SubTab, label: 'Lists',    Icon: ListIcon  },
  { key: 'calendar' as SubTab, label: 'Calendar', Icon: CalendarDays },
];
const MORE_ITEMS = [{ key: 'next7' as SubTab, label: 'Next 7 Days', Icon: CalendarCheck }];

const PRIORITY_COLOR: Record<string, string> = {
  high: '#C06060', medium: '#A87A38', low: '#5888B8', none: '#6B7280',
};

const SECTION_CONFIG = [
  { key: 'overdue',   label: 'Overdue',   color: '#C06060', bg: '#C0606012' },
  { key: 'today',     label: 'Today',     color: '#10B981', bg: '#10B98112' },
  { key: 'completed', label: 'Completed', color: '#6B7280', bg: 'transparent' },
];

const LIST_EMOJIS = ['📋', '📝', '✅', '📌', '💼', '🏠', '🛒', '🎯', '📚', '💡', '💻', '🧾'];
const LIST_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#64748B'];

const REPEAT_OPTS = [
  { v: 'none',     l: 'No repeat'            },
  { v: 'daily',    l: 'Daily'                },
  { v: 'weekly',   l: 'Weekly'               },
  { v: 'weekdays', l: 'Weekdays (Mon–Fri)'   },
  { v: 'weekends', l: 'Weekends (Sat–Sun)'   },
  { v: 'monthly',  l: 'Monthly'              },
  { v: 'yearly',   l: 'Yearly'               },
  { v: 'custom',   l: 'Custom…'              },
];
const WEEKDAY_LABELS = ['S','M','T','W','T','F','S'];
const REMIND_OPTS = [
  { v: 'none',    l: 'None'         },
  { v: 'on-time', l: 'On time'      },
  { v: '5m',      l: '5 min early'  },
  { v: '30m',     l: '30 min early' },
  { v: '1h',      l: '1 hour early' },
  { v: '1d',      l: '1 day early'  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function todayStr() { return new Date().toLocaleDateString('en-CA'); }
function offsetStr(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA');
}
function getNext7Dates(): string[] { return Array.from({ length: 7 }, (_, i) => offsetStr(i)); }
function getNextMonday(): string {
  const d = new Date(); const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? 1 : 8 - day)); return d.toLocaleDateString('en-CA');
}
function parseTags(raw: string): string[] {
  let arr: string[] = [];
  if (!raw) return arr;
  try { const p = JSON.parse(raw); if (Array.isArray(p)) arr = p; }
  catch { arr = raw.split(',').map(t => t.trim()).filter(Boolean); }
  return arr.filter(t => !t.startsWith('repeat:') && !t.startsWith('reminder:'));
}
function getRepeat(raw: string): string {
  try { const t = (JSON.parse(raw || '[]') as string[]).find(x => x.startsWith('repeat:')); return t ? t.replace('repeat:', '') : 'none'; }
  catch { return 'none'; }
}
function getReminder(raw: string): string {
  try { const t = (JSON.parse(raw || '[]') as string[]).find(x => x.startsWith('reminder:')); return t ? t.replace('reminder:', '') : 'none'; }
  catch { return 'none'; }
}
function buildTagsArray(display: string[], repeat: string, reminder: string): string[] {
  const arr = [...display];
  if (repeat && repeat !== 'none') arr.push(`repeat:${repeat}`);
  if (reminder && reminder !== 'none') arr.push(`reminder:${reminder}`);
  return arr;
}

type TaskSaveData = { title: string; notes?: string; priority: string; dueDate?: string; dueTime?: string; listId?: string; tags: string[] };

// ── MyOrbit Logo (matches AppHeader) ──────────────────────────────────────────────
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

// ── Sub Nav ───────────────────────────────────────────────────────────────────────
function SubNav({ active, onSelect, onMore }: { active: SubTab; onSelect: (t: SubTab) => void; onMore: () => void }) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const isMoreActive = !SUB_TABS.some(t => t.key === active);
  return (
    <View style={{ flexDirection: 'row', backgroundColor: BG, borderTopWidth: 1, borderTopColor: BORDER }}>
      {SUB_TABS.map(({ key, label, Icon }) => {
        const on = active === key;
        return (
          <TouchableOpacity key={key} onPress={() => onSelect(key)} style={{ flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 8 }}>
            {on && <View style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, backgroundColor: ACCENT, borderRadius: 1 }} />}
            <View style={{ width: 34, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: on ? ACCENT + '22' : 'transparent' }}>
              <Icon size={17} color={on ? ACCENT : MUTED} />
            </View>
            <Text style={{ fontSize: 10, fontWeight: '500', color: on ? ACCENT : MUTED, marginTop: 2 }}>{label}</Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity onPress={onMore} style={{ width: 52, alignItems: 'center', paddingTop: 10, paddingBottom: 8 }}>
        {isMoreActive && <View style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, backgroundColor: ACCENT, borderRadius: 1 }} />}
        <View style={{ width: 34, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: isMoreActive ? ACCENT + '22' : 'transparent' }}>
          <MoreHorizontal size={17} color={isMoreActive ? ACCENT : MUTED} />
        </View>
        <Text style={{ fontSize: 10, fontWeight: '500', color: isMoreActive ? ACCENT : MUTED, marginTop: 2 }}>More</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── More Sheet ────────────────────────────────────────────────────────────────────
function MoreSheet({ visible, active, onSelect, onClose }: { visible: boolean; active: SubTab; onSelect: (t: SubTab) => void; onClose: () => void }) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 }}>
        <View style={{ width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER }}>
          <Text style={{ fontWeight: '600', fontSize: 15, color: TXT }}>More</Text>
          <TouchableOpacity onPress={onClose} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color={MUTED} />
          </TouchableOpacity>
        </View>
        {MORE_ITEMS.map(({ key, label, Icon }) => (
          <TouchableOpacity key={key} onPress={() => { onSelect(key); onClose(); }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: active === key ? ACCENT + '22' : 'transparent' }}>
            <Icon size={16} color={active === key ? ACCENT : MUTED} />
            <Text style={{ fontSize: 15, fontWeight: '500', color: active === key ? ACCENT : TXT2 }}>{label}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 1, backgroundColor: BORDER, marginHorizontal: 16, marginVertical: 4 }} />
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
          <Settings size={16} color={MUTED} />
          <Text style={{ fontSize: 15, fontWeight: '500', color: TXT2 }}>Settings</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Task Instance Item ─────────────────────────────────────────────────────────────
function InstanceItem({ item, onComplete, onEdit }: { item: TaskInstance; onComplete: (id: string) => Promise<unknown>; onEdit: (task: Task) => void }) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const [loading, setLoading] = useState(false);
  const done = item.status === 'completed';
  const repeat = getRepeat(item.task.tags);
  const today = todayStr();
  const isOverdue = item.date < today && !done;
  const dateLabel = item.date === today ? 'Today' : item.date === offsetStr(1) ? 'Tomorrow' : formatDate(item.date);
  const handleComplete = async () => {
    if (done) return; setLoading(true);
    try { await onComplete(item.id); } finally { setLoading(false); }
  };
  return (
    <TouchableOpacity
      onPress={() => onEdit({
        id: item.taskId, userId: item.userId, title: item.task.title,
        status: done ? 'completed' : 'active', priority: item.task.priority as Task['priority'],
        dueTime: item.task.dueTime ?? undefined, listId: item.task.listId ?? undefined,
        list: (item.task.list as any) ?? undefined, tags: item.task.tags,
        sortOrder: 0, isActive: true, isDeleted: false, isRecurring: false,
      })}
      activeOpacity={0.7}
      style={{ paddingVertical: 11, paddingRight: 14, backgroundColor: SURFACE, borderBottomWidth: 1, borderBottomColor: BORDER, flexDirection: 'row' }}
    >
      {/* Priority left border */}
      <View style={{ width: 3, borderRadius: 2, backgroundColor: item.task.priority !== 'none' ? PRIORITY_COLOR[item.task.priority] : 'transparent', marginRight: 11, marginLeft: 4, borderTopLeftRadius: 2, borderBottomLeftRadius: 2 }} />
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start' }}>
        <TouchableOpacity onPress={handleComplete} disabled={loading} style={{ marginRight: 12, marginTop: 1 }}>
          {loading ? <ActivityIndicator size={20} color={ACCENT} /> : done
            ? <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: ACCENT, backgroundColor: ACCENT + '20', alignItems: 'center', justifyContent: 'center' }}><Check size={12} color={ACCENT} /></View>
            : <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: item.task.priority !== 'none' ? PRIORITY_COLOR[item.task.priority] : '#4B5563' }} />}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: done ? MUTED : TXT2, textDecorationLine: done ? 'line-through' : 'none' }}>{item.task.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 10, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <CalendarDays size={11} color={isOverdue ? '#C06060' : '#6B7280'} />
              <Text style={{ fontSize: 11, color: isOverdue ? '#C06060' : '#6B7280' }}>{dateLabel}</Text>
            </View>
            {item.task.dueTime && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Clock size={11} color='#7AAFC2' />
                <Text style={{ fontSize: 11, color: '#7AAFC2' }}>{item.task.dueTime}</Text>
              </View>
            )}
            {repeat !== 'none' && <RotateCcw size={11} color={ACCENT} />}
            {item.task.priority !== 'none' && (
              <Flag size={11} color={PRIORITY_COLOR[item.task.priority]} />
            )}
            {item.task.list && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={{ fontSize: 11 }}>{item.task.list.emoji ?? '📋'}</Text>
                <Text style={{ fontSize: 11, color: MUTED }}>{item.task.list.name}</Text>
              </View>
            )}
          </View>
        </View>
        <ChevronRight size={14} color="#4B5563" style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );
}

// ── Task Row ──────────────────────────────────────────────────────────────────────
function TaskRow({ task, onDelete, onEdit }: { task: Task; onDelete: (id: string) => void; onEdit: (t: Task) => void }) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const repeat = getRepeat(task.tags);
  const today = todayStr();
  const isOverdue = task.dueDate && task.dueDate < today;
  const dateLabel = !task.dueDate ? null : task.dueDate === today ? 'Today' : task.dueDate === offsetStr(1) ? 'Tomorrow' : formatDate(task.dueDate);
  return (
    <TouchableOpacity onPress={() => onEdit(task)} activeOpacity={0.7}
      style={{ paddingVertical: 11, paddingRight: 14, backgroundColor: SURFACE, borderBottomWidth: 1, borderBottomColor: BORDER, flexDirection: 'row' }}>
      {/* Priority left border */}
      <View style={{ width: 3, borderRadius: 2, backgroundColor: task.priority !== 'none' ? PRIORITY_COLOR[task.priority] : 'transparent', marginRight: 11, marginLeft: 4 }} />
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ marginRight: 12, marginTop: 1 }}>
          <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: task.priority !== 'none' ? PRIORITY_COLOR[task.priority] : '#4B5563' }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: TXT2 }}>{task.title}</Text>
          {(dateLabel || task.dueTime || repeat !== 'none' || task.priority !== 'none' || task.list) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 10, flexWrap: 'wrap' }}>
              {dateLabel && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <CalendarDays size={11} color={isOverdue ? '#C06060' : '#6B7280'} />
                  <Text style={{ fontSize: 11, color: isOverdue ? '#C06060' : '#6B7280' }}>{dateLabel}</Text>
                </View>
              )}
              {task.dueTime && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Clock size={11} color='#7AAFC2' />
                  <Text style={{ fontSize: 11, color: '#7AAFC2' }}>{task.dueTime}</Text>
                </View>
              )}
              {repeat !== 'none' && <RotateCcw size={11} color={ACCENT} />}
              {task.priority !== 'none' && (
                <Flag size={11} color={PRIORITY_COLOR[task.priority]} />
              )}
              {task.list && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={{ fontSize: 11 }}>{task.list.emoji ?? '📋'}</Text>
                  <Text style={{ fontSize: 11, color: MUTED }}>{task.list.name}</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Delete Task', `Delete "${task.title}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(task.id) },
        ])} style={{ padding: 8 }}>
          <Trash2 size={15} color="#C06060" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Date Picker Content (inline, no Modal — avoids nested-Modal bug on Android) ────
interface DatePickVal { dueDate: string; dueTime: string; repeat: string; reminder: string; }

function DatePickerContent({ value, onChange, onBack }: {
  value: DatePickVal; onChange: (v: DatePickVal) => void; onBack: () => void;
}) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const [viewDate, setViewDate] = useState(() => {
    if (value.dueDate) { const [y, m] = value.dueDate.split('-').map(Number); return new Date(y, m - 1, 1); }
    const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [expandTime, setExpandTime]     = useState(false);
  const [expandRepeat, setExpandRepeat] = useState(false);
  const [expandRemind, setExpandRemind] = useState(false);

  const pad = (n: number) => String(n).padStart(2, '0');
  const todayISO = todayStr();
  const year = viewDate.getFullYear(); const month = viewDate.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const QUICK = [
    { label: 'Today',    v: todayStr()     },
    { label: 'Tomorrow', v: offsetStr(1)   },
    { label: 'Next Mon', v: getNextMonday() },
    { label: 'No Date',  v: ''             },
  ];
  const repeatLabel = value.repeat === 'none' ? 'None'
    : value.repeat.startsWith('custom:week:') ? value.repeat.replace('custom:week:','').split(',').map(d => ['S','M','T','W','T','F','S'][Number(d)]).join(' ')
    : REPEAT_OPTS.find(o => o.v === value.repeat)?.l ?? value.repeat;
  const remindLabel = REMIND_OPTS.find(o => o.v === value.reminder)?.l ?? 'None';

  return (
    <View style={{ flex: 1 }}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onBack} />
      <ScrollView style={{ backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} contentContainerStyle={{ paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
        {/* handle + Done */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ flex: 1, height: 4, backgroundColor: BORDER, borderRadius: 2 }} />
          <TouchableOpacity onPress={onBack} style={{ paddingLeft: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: ACCENT }}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Quick chips */}
        <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER }}>
          {QUICK.map(q => {
            const active = value.dueDate === q.v || (q.v === '' && !value.dueDate);
            return (
              <TouchableOpacity key={q.label} onPress={() => onChange({ ...value, dueDate: q.v })}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: active ? ACCENT : BORDER, backgroundColor: active ? ACCENT : 'transparent' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: active ? TXT : MUTED }}>{q.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Month nav */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }}>
          <TouchableOpacity onPress={() => setViewDate(new Date(year, month - 1, 1))} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: SURFACE2 }}>
            <ChevronLeft size={16} color={TXT2} />
          </TouchableOpacity>
          <Text style={{ fontSize: 14, fontWeight: '600', color: TXT }}>
            {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => setViewDate(new Date(year, month + 1, 1))} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: SURFACE2 }}>
            <ChevronRight size={16} color={TXT2} />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 }}>
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: MUTED }}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Day grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 8 }}>
          {cells.map((day, idx) => {
            if (!day) return <View key={idx} style={{ width: `${100/7}%`, height: 36 }} />;
            const ds = `${year}-${pad(month + 1)}-${pad(day)}`;
            const isSel = ds === value.dueDate; const isTod = ds === todayISO;
            return (
              <TouchableOpacity key={ds} onPress={() => onChange({ ...value, dueDate: ds })}
                style={{ width: `${100/7}%`, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: isSel ? ACCENT : isTod ? ACCENT + '33' : 'transparent' }}>
                  <Text style={{ fontSize: 13, fontWeight: isSel || isTod ? '700' : '400', color: isSel ? TXT : isTod ? ACCENT : TXT2 }}>{day}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Time row */}
        <TouchableOpacity onPress={() => { setExpandTime(v => !v); setExpandRepeat(false); setExpandRemind(false); }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: 1, borderTopColor: BORDER, gap: 12 }}>
          <Clock size={16} color={MUTED} />
          <Text style={{ flex: 1, fontSize: 14, color: TXT2 }}>Time</Text>
          <Text style={{ fontSize: 12, color: value.dueTime ? ACCENT : MUTED }}>{value.dueTime || 'None'}</Text>
          {expandTime ? <ChevronDown size={14} color={MUTED} /> : <ChevronRight size={14} color={MUTED} />}
        </TouchableOpacity>
        {expandTime && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                {['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'].map(t => {
                  const active = value.dueTime === t;
                  return (
                    <TouchableOpacity key={t} onPress={() => onChange({ ...value, dueTime: active ? '' : t })}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: active ? ACCENT : BORDER, backgroundColor: active ? ACCENT + '22' : 'transparent' }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: active ? ACCENT : TXT2 }}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TextInput
              style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: TXT }}
              placeholder="Custom: HH:MM"
              placeholderTextColor={MUTED}
              value={value.dueTime}
              onChangeText={t => onChange({ ...value, dueTime: t })}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        )}

        {/* Reminder row */}
        <TouchableOpacity onPress={() => { setExpandRemind(v => !v); setExpandTime(false); setExpandRepeat(false); }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: 1, borderTopColor: BORDER, gap: 12 }}>
          <Bell size={16} color={MUTED} />
          <Text style={{ flex: 1, fontSize: 14, color: TXT2 }}>Reminder</Text>
          <Text style={{ fontSize: 12, color: value.reminder !== 'none' ? ACCENT : MUTED }}>{remindLabel}</Text>
          {expandRemind ? <ChevronDown size={14} color={MUTED} /> : <ChevronRight size={14} color={MUTED} />}
        </TouchableOpacity>
        {expandRemind && REMIND_OPTS.map(o => (
          <TouchableOpacity key={o.v} onPress={() => { onChange({ ...value, reminder: o.v }); setExpandRemind(false); }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 10, gap: 12, backgroundColor: value.reminder === o.v ? ACCENT + '22' : 'transparent' }}>
            <Text style={{ flex: 1, fontSize: 14, color: value.reminder === o.v ? ACCENT : TXT2 }}>{o.l}</Text>
            {value.reminder === o.v && <Check size={14} color={ACCENT} />}
          </TouchableOpacity>
        ))}

        {/* Repeat row */}
        <TouchableOpacity onPress={() => { setExpandRepeat(v => !v); setExpandTime(false); setExpandRemind(false); }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: 1, borderTopColor: BORDER, gap: 12 }}>
          <RotateCcw size={16} color={MUTED} />
          <Text style={{ flex: 1, fontSize: 14, color: TXT2 }}>Repeat</Text>
          <Text style={{ fontSize: 12, color: value.repeat !== 'none' ? ACCENT : MUTED }}>{repeatLabel}</Text>
          {expandRepeat ? <ChevronDown size={14} color={MUTED} /> : <ChevronRight size={14} color={MUTED} />}
        </TouchableOpacity>
        {expandRepeat && REPEAT_OPTS.map(o => {
          const isCustom = o.v === 'custom';
          const isActive = isCustom
            ? (value.repeat === 'custom' || value.repeat.startsWith('custom:week:'))
            : value.repeat === o.v;
          return (
            <TouchableOpacity key={o.v} onPress={() => { onChange({ ...value, repeat: isCustom ? (value.repeat.startsWith('custom:week:') ? value.repeat : 'custom') : o.v }); if (!isCustom) setExpandRepeat(false); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 10, gap: 12, backgroundColor: isActive ? ACCENT + '22' : 'transparent' }}>
              <Text style={{ flex: 1, fontSize: 14, color: isActive ? ACCENT : TXT2 }}>{o.l}</Text>
              {isActive && <Check size={14} color={ACCENT} />}
            </TouchableOpacity>
          );
        })}
        {expandRepeat && (value.repeat === 'custom' || value.repeat.startsWith('custom:week:')) && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: BORDER }}>
            <Text style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>Select days of the week</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {WEEKDAY_LABELS.map((d, i) => {
                const selectedDays = value.repeat.startsWith('custom:week:')
                  ? value.repeat.replace('custom:week:','').split(',').map(Number)
                  : [];
                const active = selectedDays.includes(i);
                return (
                  <TouchableOpacity key={i} onPress={() => {
                    const current = value.repeat.startsWith('custom:week:') ? value.repeat.replace('custom:week:','').split(',').map(Number) : [];
                    const newDays = active ? current.filter(x => x !== i) : [...current, i].sort((a, b) => a - b);
                    onChange({ ...value, repeat: newDays.length > 0 ? `custom:week:${newDays.join(',')}` : 'custom' });
                  }}
                    style={{ flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: active ? ACCENT : BORDER, backgroundColor: active ? ACCENT : 'transparent' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: active ? 'white' : TXT2 }}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── List Selector Content (inline, no Modal) ──────────────────────────────────────
function ListSelectorContent({ lists, selectedId, onSelect, onBack }: {
  lists: TaskList[]; selectedId: string; onSelect: (id: string) => void; onBack: () => void;
}) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  return (
    <View style={{ flex: 1 }}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onBack} />
      <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: '60%' }}>
        <View style={{ width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginTop: 12 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER }}>
          <Text style={{ fontWeight: '600', fontSize: 15, color: TXT }}>Select List</Text>
          <TouchableOpacity onPress={onBack} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color={MUTED} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          <TouchableOpacity onPress={() => { onSelect(''); onBack(); }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: !selectedId ? ACCENT + '22' : 'transparent' }}>
            <Text style={{ fontSize: 18 }}>📥</Text>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: !selectedId ? ACCENT : TXT2 }}>Inbox (no list)</Text>
            {!selectedId && <Check size={16} color={ACCENT} />}
          </TouchableOpacity>
          {lists.map(list => {
            const isSelected = selectedId === list.id;
            return (
              <TouchableOpacity key={list.id} onPress={() => { onSelect(list.id); onBack(); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: isSelected ? ACCENT + '22' : 'transparent', borderTopWidth: 1, borderTopColor: BORDER }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: (list.color ?? ACCENT) + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>{list.emoji ?? '📋'}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: isSelected ? ACCENT : TXT2 }}>{list.name}</Text>
                {isSelected && <Check size={16} color={ACCENT} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// ── Quick Add Sheet ────────────────────────────────────────────────────────────────
function QuickAddSheet({ visible, lists, defaultListId, defaultDueDate, onClose, onAdd }: {
  visible: boolean; lists: TaskList[]; defaultListId?: string; defaultDueDate?: string;
  onClose: () => void; onAdd: (data: TaskSaveData) => void;
}) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const [title, setTitle]       = useState('');
  const [dueDate, setDueDate]   = useState('');
  const [dueTime, setDueTime]   = useState('');
  const [repeat, setRepeat]     = useState('none');
  const [reminder, setReminder] = useState('none');
  const [priority, setPriority] = useState('none');
  const [listId, setListId]     = useState('');
  const [tags, setTags]         = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showPri, setShowPri]   = useState(false);
  const [showTag, setShowTag]   = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(''); setDueDate(defaultDueDate ?? ''); setDueTime('');
    setRepeat('none'); setReminder('none'); setPriority('none');
    setListId(defaultListId ?? ''); setTags([]); setTagInput('');
    setShowDate(false); setShowList(false); setShowPri(false); setShowTag(false);
  }, [visible]);

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), priority, dueDate: dueDate || undefined, dueTime: dueTime || undefined, listId: listId || undefined, tags: buildTagsArray(tags, repeat, reminder) });
    onClose();
  };
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(p => [...p, t]);
    setTagInput('');
  };

  const handleBack = () => {
    if (showDate) { setShowDate(false); return; }
    if (showList) { setShowList(false); return; }
    onClose();
  };

  const selectedList = lists.find(l => l.id === listId);
  const priColor = PRIORITY_COLOR[priority] ?? MUTED;
  const dateLabel = !dueDate ? null : dueDate === todayStr() ? 'Today' : dueDate === offsetStr(1) ? 'Tomorrow' : new Date(`${dueDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const datePickVal: DatePickVal = { dueDate, dueTime, repeat, reminder };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleBack}>
      {showDate ? (
        <DatePickerContent
          value={datePickVal}
          onChange={v => { setDueDate(v.dueDate); setDueTime(v.dueTime); setRepeat(v.repeat); setReminder(v.reminder); }}
          onBack={() => setShowDate(false)}
        />
      ) : showList ? (
        <ListSelectorContent lists={lists} selectedId={listId} onSelect={setListId} onBack={() => setShowList(false)} />
      ) : (
        <View style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
          <KeyboardAvoidingView behavior="padding">
            <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 }} />

              {/* Tag input */}
              {showTag && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput autoFocus
                      style={{ flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: TXT }}
                      placeholder="Tag name…" placeholderTextColor={MUTED} value={tagInput} onChangeText={setTagInput}
                      onSubmitEditing={addTag} returnKeyType="done"
                    />
                    <TouchableOpacity onPress={addTag} style={{ paddingHorizontal: 16, borderRadius: 12, backgroundColor: ACCENT, justifyContent: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Add</Text>
                    </TouchableOpacity>
                  </View>
                  {tags.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {tags.map(t => (
                        <TouchableOpacity key={t} onPress={() => setTags(p => p.filter(x => x !== t))}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#6868A818' }}>
                          <Text style={{ fontSize: 12, color: '#8888BE' }}>#{t}</Text>
                          <X size={10} color="#A78BFA" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Priority picker */}
              {showPri && (
                <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                  {(['none', 'low', 'medium', 'high'] as const).map(p => (
                    <TouchableOpacity key={p} onPress={() => { setPriority(p); setShowPri(false); }}
                      style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: priority === p ? PRIORITY_COLOR[p] : BORDER, backgroundColor: priority === p ? PRIORITY_COLOR[p] + '22' : SURFACE2 }}>
                      <Flag size={14} color={PRIORITY_COLOR[p]} />
                      <Text style={{ fontSize: 11, fontWeight: '600', marginTop: 3, color: priority === p ? PRIORITY_COLOR[p] : MUTED, textTransform: 'capitalize' }}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Title input */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#4B5563' }} />
                <TextInput
                  autoFocus
                  style={{ flex: 1, fontSize: 16, color: TXT }}
                  placeholder="New task"
                  placeholderTextColor={MUTED}
                  value={title}
                  onChangeText={setTitle}
                  onSubmitEditing={submit}
                  returnKeyType="done"
                />
              </View>

              {/* Toolbar */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 10, gap: 2 }}>
                <TouchableOpacity onPress={() => setShowDate(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: dueDate ? ACCENT + '22' : 'transparent' }}>
                  <CalendarDays size={20} color={dueDate ? ACCENT : MUTED} />
                  {dateLabel && <Text style={{ fontSize: 11, fontWeight: '600', color: ACCENT }}>{dateLabel}</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setShowPri(v => !v); setShowTag(false); }}
                  style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                  <Flag size={20} color={priority !== 'none' ? priColor : MUTED} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowList(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 12 }}>
                  {selectedList
                    ? <View style={{ width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: (selectedList.color ?? ACCENT) + '22' }}><Text style={{ fontSize: 12 }}>{selectedList.emoji ?? '📋'}</Text></View>
                    : <ListIcon size={20} color={listId ? '#3B82F6' : MUTED} />}
                  {selectedList && <Text style={{ fontSize: 11, fontWeight: '600', color: '#3B82F6', maxWidth: 60 }} numberOfLines={1}>{selectedList.name}</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setShowTag(v => !v); setShowPri(false); }}
                  style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                  <Tag size={20} color={tags.length > 0 ? '#8B5CF6' : MUTED} />
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <TouchableOpacity onPress={submit} disabled={!title.trim()}
                  style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: title.trim() ? ACCENT : SURFACE2, alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} color={title.trim() ? TXT : MUTED} />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </Modal>
  );
}

// ── Task Modal (Edit / Full Create) ───────────────────────────────────────────────
function TaskModal({ visible, initial, lists, onClose, onSave, onDelete }: {
  visible: boolean; initial?: Task | null; lists: TaskList[];
  onClose: () => void; onSave: (data: TaskSaveData) => void; onDelete?: () => void;
}) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const isEdit = !!initial;
  const [form, setForm] = useState({ title: '', notes: '', priority: 'none', dueDate: '', dueTime: '', listId: '', tags: [] as string[], repeat: 'none', reminder: 'none' });
  const [tagInput, setTagInput]             = useState('');
  const [showListPicker, setShowListPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setForm({ title: initial.title, notes: initial.notes ?? '', priority: initial.priority, dueDate: initial.dueDate ?? '', dueTime: initial.dueTime ?? '', listId: initial.listId ?? '', tags: parseTags(initial.tags), repeat: getRepeat(initial.tags), reminder: getReminder(initial.tags) });
    } else {
      setForm({ title: '', notes: '', priority: 'none', dueDate: '', dueTime: '', listId: '', tags: [], repeat: 'none', reminder: 'none' });
    }
    setTagInput(''); setShowDatePicker(false); setShowListPicker(false);
  }, [visible, initial?.id]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  };

  const save = () => {
    if (!form.title.trim()) return;
    onSave({ title: form.title.trim(), notes: form.notes || undefined, priority: form.priority, dueDate: form.dueDate || undefined, dueTime: form.dueTime || undefined, listId: form.listId || undefined, tags: buildTagsArray(form.tags, form.repeat, form.reminder) });
    onClose();
  };

  const handleBack = () => {
    if (showDatePicker) { setShowDatePicker(false); return; }
    if (showListPicker) { setShowListPicker(false); return; }
    onClose();
  };

  const selectedList = lists.find(l => l.id === form.listId);
  const dateLabel = !form.dueDate ? 'Set date' : form.dueDate === todayStr() ? 'Today' : form.dueDate === offsetStr(1) ? 'Tomorrow' : formatDate(form.dueDate);
  const datePickVal: DatePickVal = { dueDate: form.dueDate, dueTime: form.dueTime, repeat: form.repeat, reminder: form.reminder };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleBack}>
      {showDatePicker ? (
        <DatePickerContent
          value={datePickVal}
          onChange={v => setForm(f => ({ ...f, dueDate: v.dueDate, dueTime: v.dueTime, repeat: v.repeat, reminder: v.reminder }))}
          onBack={() => setShowDatePicker(false)}
        />
      ) : showListPicker ? (
        <ListSelectorContent lists={lists} selectedId={form.listId} onSelect={id => setForm(f => ({ ...f, listId: id }))} onBack={() => setShowListPicker(false)} />
      ) : (
        <View style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
          <KeyboardAvoidingView behavior="padding">
            <ScrollView style={{ backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
              <View style={{ width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: TXT }}>{isEdit ? 'Edit Task' : 'New Task'}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {isEdit && onDelete && (
                    <TouchableOpacity onPress={onDelete} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#C0606018' }}>
                      <Trash2 size={14} color="#C06060" />
                      <Text style={{ fontSize: 13, color: '#C06060', fontWeight: '600' }}>Delete</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={onClose} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} color={MUTED} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Title</Text>
              <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: TXT, marginBottom: 12 }}
                placeholder="What needs to be done?" placeholderTextColor={MUTED} value={form.title} onChangeText={t => setForm(f => ({ ...f, title: t }))} autoFocus={!isEdit} />

              <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Notes</Text>
              <TextInput style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: TXT, marginBottom: 12, minHeight: 60, textAlignVertical: 'top' }}
                placeholder="Add notes…" placeholderTextColor={MUTED} multiline value={form.notes} onChangeText={t => setForm(f => ({ ...f, notes: t }))} />

              <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Due Date & Time</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}
                style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                <CalendarDays size={16} color={form.dueDate ? ACCENT : MUTED} />
                <Text style={{ flex: 1, fontSize: 14, color: form.dueDate ? TXT2 : MUTED }}>{dateLabel}</Text>
                {form.dueTime && <Text style={{ fontSize: 13, color: ACCENT }}>{form.dueTime}</Text>}
                {form.repeat !== 'none' && <Text style={{ fontSize: 11, color: MUTED }}>{REPEAT_OPTS.find(o => o.v === form.repeat)?.l}</Text>}
                <ChevronRight size={14} color={MUTED} />
              </TouchableOpacity>

              <Text style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Priority</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {(['none', 'low', 'medium', 'high'] as const).map(p => (
                  <TouchableOpacity key={p} onPress={() => setForm(f => ({ ...f, priority: p }))}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: form.priority === p ? PRIORITY_COLOR[p] : BORDER, backgroundColor: form.priority === p ? PRIORITY_COLOR[p] + '22' : SURFACE2 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: form.priority === p ? PRIORITY_COLOR[p] : MUTED, textTransform: 'capitalize' }}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>List</Text>
              <TouchableOpacity onPress={() => setShowListPicker(true)}
                style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                <Text style={{ fontSize: 16 }}>{selectedList?.emoji ?? '📥'}</Text>
                <Text style={{ flex: 1, fontSize: 14, color: selectedList ? ACCENT : MUTED }}>{selectedList?.name ?? 'Inbox (no list)'}</Text>
                <ChevronRight size={14} color={MUTED} />
              </TouchableOpacity>

              <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Tags</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: form.tags.length > 0 ? 6 : 12 }}>
                <TextInput style={{ flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: TXT }}
                  placeholder="Add tag…" placeholderTextColor={MUTED} value={tagInput} onChangeText={setTagInput} onSubmitEditing={addTag} returnKeyType="done" />
                <TouchableOpacity onPress={addTag} style={{ paddingHorizontal: 14, borderRadius: 12, backgroundColor: ACCENT, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Add</Text>
                </TouchableOpacity>
              </View>
              {form.tags.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {form.tags.map(t => (
                    <TouchableOpacity key={t} onPress={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#6868A818' }}>
                      <Text style={{ fontSize: 12, color: '#8888BE' }}>#{t}</Text>
                      <X size={10} color="#A78BFA" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {isEdit && initial?.subtasks && initial.subtasks.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Subtasks</Text>
                  {initial.subtasks.map(s => (
                    <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                      {s.isDone ? <CheckCircle size={16} color={ACCENT} /> : <Circle size={16} color="#4B5563" />}
                      <Text style={{ fontSize: 14, color: s.isDone ? MUTED : TXT2, textDecorationLine: s.isDone ? 'line-through' : 'none' }}>{s.title}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER }}>
                  <Text style={{ fontSize: 15, fontWeight: '500', color: MUTED }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={save} disabled={!form.title.trim()}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: form.title.trim() ? 1 : 0.5 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>{isEdit ? 'Save' : 'Add Task'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}
    </Modal>
  );
}

// ── Side Drawer ────────────────────────────────────────────────────────────────────
function SideDrawer({ visible, active, lists, onSelect, onSelectList, onCreateList, onClose, userName }: {
  visible: boolean; active: SubTab; lists: TaskList[];
  onSelect: (t: SubTab) => void; onSelectList: (l: TaskList) => void;
  onCreateList: () => void; onClose: () => void; userName?: string;
}) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const NAV = [
    { key: 'today'    as SubTab, label: 'Today',       Icon: Sun           },
    { key: 'next7'    as SubTab, label: 'Next 7 Days', Icon: CalendarCheck },
    { key: 'inbox'    as SubTab, label: 'Inbox',       Icon: InboxIcon     },
    { key: 'lists'    as SubTab, label: 'Lists',       Icon: ListIcon      },
    { key: 'calendar' as SubTab, label: 'Calendar',    Icon: CalendarDays  },
  ];
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ width: '78%', backgroundColor: MODAL, paddingTop: 54, flexDirection: 'column' }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={20} color="white" />
            </View>
            <View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: TXT }}>Tasks</Text>
              <Text style={{ fontSize: 11, color: MUTED }}>Planner workspace</Text>
            </View>
          </View>
          {/* Nav */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
            {NAV.map(({ key, label, Icon }) => {
              const on = active === key;
              return (
                <TouchableOpacity key={key} onPress={() => { onSelect(key); onClose(); }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13, marginHorizontal: 8, borderRadius: 12, backgroundColor: on ? ACCENT + '22' : 'transparent', marginBottom: 2 }}>
                  <Icon size={18} color={on ? ACCENT : MUTED} />
                  <Text style={{ fontSize: 15, fontWeight: on ? '600' : '400', color: on ? ACCENT : TXT2 }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
            {/* Divider */}
            <View style={{ height: 1, backgroundColor: BORDER, marginHorizontal: 16, marginTop: 12, marginBottom: 16 }} />
            {/* Lists section */}
            <View style={{ paddingHorizontal: 20, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: MUTED }}>Lists ({lists.length})</Text>
              <TouchableOpacity onPress={() => { onSelect('lists'); onCreateList(); onClose(); }}
                style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={14} color={MUTED} />
              </TouchableOpacity>
            </View>
            {lists.map(list => (
              <TouchableOpacity key={list.id} onPress={() => { onSelectList(list); onClose(); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 11, marginHorizontal: 8, borderRadius: 12, marginBottom: 2 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: (list.color ?? ACCENT) + '25', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16 }}>{list.emoji ?? '📋'}</Text>
                </View>
                <Text style={{ fontSize: 14, color: TXT2, flex: 1 }} numberOfLines={1}>{list.name}</Text>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: list.color ?? ACCENT }} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Bottom — user profile + settings */}
          <View style={{ borderTopWidth: 1, borderTopColor: BORDER }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>{(userName ?? 'U').slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: TXT2 }} numberOfLines={1}>{userName ?? 'User'}</Text>
                <Text style={{ fontSize: 11, color: MUTED }}>Personal account</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => { onClose(); router.push('/(tabs)/settings' as any); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: BORDER }}>
              <Settings size={16} color={MUTED} />
              <Text style={{ fontSize: 14, color: MUTED }}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onClose} />
      </View>
    </Modal>
  );
}

// ── Lists Browser ──────────────────────────────────────────────────────────────────
function ListsBrowser({ lists, allTasks, searchQuery, onSelectList, onEditList, onDeleteList }: {
  lists: TaskList[]; allTasks: Task[]; searchQuery?: string; onSelectList: (l: TaskList) => void;
  onEditList: (l: TaskList) => void; onDeleteList: (id: string) => void;
}) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allTasks.forEach(t => { if (t.listId && t.status === 'active') counts[t.listId] = (counts[t.listId] ?? 0) + 1; });
    return counts;
  }, [allTasks]);

  const filteredLists = searchQuery ? lists.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase())) : lists;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {filteredLists.length === 0 ? (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ListIcon size={48} color="#4B5563" />
          <Text style={{ fontSize: 15, fontWeight: '500', color: MUTED, marginTop: 12 }}>{searchQuery ? 'No lists match your search' : 'No lists yet'}</Text>
          <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{!searchQuery && 'Tap + to create your first list'}</Text>
        </View>
      ) : filteredLists.map(list => {
        const color = list.color ?? ACCENT;
        const count = taskCounts[list.id] ?? 0;
        return (
          <TouchableOpacity key={list.id} onPress={() => onSelectList(list)}
            style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: SURFACE, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER }}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: color + '25', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 22 }}>{list.emoji ?? '📋'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: TXT }}>{list.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                <Text style={{ fontSize: 12, color: MUTED }}>{count} task{count !== 1 ? 's' : ''}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => Alert.alert(list.name, '', [
              { text: 'Edit', onPress: () => onEditList(list) },
              { text: 'Delete', style: 'destructive', onPress: () => onDeleteList(list.id) },
              { text: 'Cancel', style: 'cancel' },
            ])} style={{ padding: 8 }}>
              <MoreHorizontal size={18} color={MUTED} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ── List Modal ─────────────────────────────────────────────────────────────────────
function ListModal({ visible, initial, onClose, onSave }: {
  visible: boolean; initial?: TaskList | null; onClose: () => void;
  onSave: (data: { name: string; emoji: string; color: string }) => void;
}) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const [name, setName]   = useState('');
  const [emoji, setEmoji] = useState('📋');
  const [color, setColor] = useState(ACCENT);

  useEffect(() => {
    if (!visible) return;
    if (initial) { setName(initial.name); setEmoji(initial.emoji ?? '📋'); setColor(initial.color ?? ACCENT); }
    else { setName(''); setEmoji('📋'); setColor(ACCENT); }
  }, [visible, initial?.id]);

  const save = () => { if (!name.trim()) return; onSave({ name: name.trim(), emoji, color }); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 }}>
          <View style={{ width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: TXT }}>{initial ? 'Edit List' : 'New List'}</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} color={MUTED} />
            </TouchableOpacity>
          </View>
          <TextInput autoFocus style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: SURFACE2, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: TXT, marginBottom: 16 }}
            placeholder="List name..." placeholderTextColor={MUTED} value={name} onChangeText={setName} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1, marginBottom: 8 }}>ICON</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {LIST_EMOJIS.map(em => (
                <TouchableOpacity key={em} onPress={() => setEmoji(em)}
                  style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: emoji === em ? ACCENT + '22' : SURFACE2, borderWidth: emoji === em ? 2 : 0, borderColor: ACCENT }}>
                  <Text style={{ fontSize: 20 }}>{em}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Text style={{ fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1, marginBottom: 8 }}>COLOR</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {LIST_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setColor(c)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: 'white' }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: MUTED }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={!name.trim()} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: name.trim() ? 1 : 0.5 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>{initial ? 'Save' : 'Create'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Calendar Week View ─────────────────────────────────────────────────────────────
type CalView = 'day' | '3days' | 'week' | 'month';
const CAL_VIEWS: { key: CalView; label: string }[] = [
  { key: 'month', label: 'Month' },
  { key: 'week',  label: 'Week'  },
  { key: '3days', label: '3 Days'},
  { key: 'day',   label: 'Day'   },
];
const HOURS = Array.from({ length: 16 }, (_, i) => 6 + i); // 06:00 – 21:00
const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function buildVisibleDays(anchor: string, view: CalView): string[] {
  const base = new Date(anchor + 'T00:00:00');
  if (view === 'day') return [anchor];
  if (view === '3days') return Array.from({ length: 3 }, (_, i) => { const d = new Date(base); d.setDate(d.getDate() + i); return d.toLocaleDateString('en-CA'); });
  // week — Mon-start
  const dow = base.getDay(); const mondayOffset = dow === 0 ? -6 : 1 - dow;
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(base); d.setDate(d.getDate() + mondayOffset + i); return d.toLocaleDateString('en-CA'); });
}

function buildMonthGrid(anchor: string): string[] {
  const [y, m] = anchor.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const dow = first.getDay(); const offset = dow === 0 ? -6 : 1 - dow;
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(y, m - 1, 1 + offset + i); return d.toLocaleDateString('en-CA'); });
}

function CalendarWeekView({ tasks, onEdit, onDelete, onDateSelect }: { tasks: Task[]; onEdit: (t: Task) => void; onDelete: (id: string) => void; onDateSelect?: (date: string) => void }) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const today = todayStr();
  const [calView, setCalView]           = useState<CalView>('week');
  const [selectedDate, setSelectedDate] = useState(today);
  const [anchorDate, setAnchorDate]     = useState(today);

  useEffect(() => { onDateSelect?.(selectedDate); }, [selectedDate]);

  const visibleDays = useMemo(() => buildVisibleDays(anchorDate, calView === 'month' ? 'week' : calView), [anchorDate, calView]);
  const monthGrid   = useMemo(() => buildMonthGrid(anchorDate), [anchorDate]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(t => { if (t.dueDate && t.status === 'active') { (map[t.dueDate] = map[t.dueDate] ?? []).push(t); } });
    return map;
  }, [tasks]);

  const selectedTasks = useMemo(() => (tasksByDate[selectedDate] ?? []).sort((a, b) => (a.dueTime ?? '').localeCompare(b.dueTime ?? '')), [tasksByDate, selectedDate]);

  const navigate = (dir: -1 | 1) => {
    const d = new Date(anchorDate + 'T00:00:00');
    if (calView === 'month') d.setMonth(d.getMonth() + dir);
    else if (calView === 'week') d.setDate(d.getDate() + dir * 7);
    else if (calView === '3days') d.setDate(d.getDate() + dir * 3);
    else d.setDate(d.getDate() + dir);
    const next = d.toLocaleDateString('en-CA');
    setAnchorDate(next); setSelectedDate(next);
  };

  const anchorObj = new Date(anchorDate + 'T00:00:00');
  const headerTitle = calView === 'month'
    ? anchorObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const headerSub = calView !== 'month' ? (() => {
    const diff = Math.round((new Date(selectedDate + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
    if (diff === 0) return 'Today'; if (diff === 1) return 'Tomorrow'; if (diff === -1) return 'Yesterday'; return '';
  })() : '';

  const TIME_COL_W = 52;

  return (
    <View style={{ flex: 1 }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: BORDER }}>
        <TouchableOpacity onPress={() => navigate(-1)} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: SURFACE2 }}>
          <ChevronLeft size={16} color={TXT2} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: TXT2 }}>{headerTitle}</Text>
          {headerSub ? <Text style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{headerSub}</Text> : null}
        </View>
        <TouchableOpacity onPress={() => navigate(1)} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: SURFACE2 }}>
          <ChevronRight size={16} color={TXT2} />
        </TouchableOpacity>
      </View>

      {/* ── MONTH view ── */}
      {calView === 'month' && (
        <ScrollView style={{ flex: 1 }}>
          {/* Day headers Mon-Sun */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER }}>
            {DAY_SHORT.map(d => (
              <View key={d} style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: MUTED }}>{d}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {monthGrid.map((date, idx) => {
              const [, m] = anchorDate.split('-').map(Number);
              const isCurrentMonth = new Date(date + 'T00:00:00').getMonth() === m - 1;
              const isToday = date === today;
              const isSel = date === selectedDate;
              const count = (tasksByDate[date] ?? []).length;
              return (
                <TouchableOpacity key={idx} onPress={() => setSelectedDate(date)}
                  style={{ width: `${100/7}%`, minHeight: 52, padding: 4, borderRightWidth: 1, borderBottomWidth: 1, borderColor: BORDER, backgroundColor: isSel ? ACCENT + '15' : 'transparent', opacity: isCurrentMonth ? 1 : 0.4 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isToday ? ACCENT : 'transparent', alignSelf: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isToday ? TXT : isSel ? ACCENT : TXT2 }}>{new Date(date + 'T00:00:00').getDate()}</Text>
                  </View>
                  {count > 0 && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isToday ? TXT : ACCENT, alignSelf: 'center', marginTop: 2 }} />}
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Selected day task list below grid */}
          <View style={{ borderTopWidth: 2, borderTopColor: ACCENT + '44', marginTop: 4 }}>
            <View style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: SURFACE2 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: MUTED }}>
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
            </View>
            {selectedTasks.length === 0
              ? <View style={{ alignItems: 'center', paddingVertical: 32 }}><Text style={{ fontSize: 13, color: MUTED }}>No tasks</Text></View>
              : selectedTasks.map(t => <TaskRow key={t.id} task={t} onDelete={onDelete} onEdit={onEdit} />)}
          </View>
        </ScrollView>
      )}

      {/* ── WEEK / 3-DAYS / DAY views — time-slot grid ── */}
      {calView !== 'month' && (
        <View style={{ flex: 1 }}>
        {/* Column headers — fixed outside ScrollView so flex-row layout is never broken by stickyHeaderIndices */}
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: SURFACE2 }}>
          <View style={{ width: TIME_COL_W, borderRightWidth: 1, borderRightColor: BORDER, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: MUTED, letterSpacing: 1, textTransform: 'uppercase' }}>TIME</Text>
          </View>
          {visibleDays.map(date => {
            const d = new Date(date + 'T00:00:00');
            const isToday = date === today;
            const isSel = date === selectedDate;
            return (
              <TouchableOpacity key={date} onPress={() => setSelectedDate(date)}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, borderRightWidth: 1, borderRightColor: BORDER, backgroundColor: isSel ? ACCENT + '15' : 'transparent' }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: isToday ? ACCENT : MUTED, textTransform: 'uppercase' }}>{DAY_SHORT[(d.getDay() + 6) % 7]}</Text>
                <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: isToday ? ACCENT : 'transparent' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isToday ? TXT : isSel ? ACCENT : TXT2 }}>{d.getDate()}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* All Day row */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER, minHeight: 44 }}>
            <View style={{ width: TIME_COL_W, borderRightWidth: 1, borderRightColor: BORDER, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}>
              <Text style={{ fontSize: 9, color: MUTED, fontWeight: '600' }}>ALL{'\n'}DAY</Text>
            </View>
            {visibleDays.map(date => {
              const dayUntimed = (tasksByDate[date] ?? []).filter(t => !t.dueTime);
              const isSel = date === selectedDate;
              return (
                <TouchableOpacity key={date} onPress={() => setSelectedDate(date)}
                  style={{ flex: 1, borderRightWidth: 1, borderRightColor: BORDER, padding: 3, backgroundColor: isSel ? ACCENT + '10' : 'transparent', minHeight: 44 }}>
                  {dayUntimed.slice(0, 2).map(t => (
                    <TouchableOpacity key={t.id} onPress={() => onEdit(t)}
                      style={{ borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, marginBottom: 2, backgroundColor: PRIORITY_COLOR[t.priority] + '33' || ACCENT + '33' }}>
                      <Text numberOfLines={1} style={{ fontSize: 9, color: TXT2, fontWeight: '500' }}>{t.title}</Text>
                    </TouchableOpacity>
                  ))}
                  {dayUntimed.length > 2 && <Text style={{ fontSize: 9, color: MUTED }}>+{dayUntimed.length - 2}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Hour rows */}
          {HOURS.map(hour => (
            <View key={hour} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER, minHeight: 56 }}>
              <View style={{ width: TIME_COL_W, borderRightWidth: 1, borderRightColor: BORDER, alignItems: 'center', paddingTop: 8 }}>
                <Text style={{ fontSize: 10, color: MUTED, fontWeight: '500' }}>{String(hour).padStart(2,'0')}:00</Text>
              </View>
              {visibleDays.map(date => {
                const hourTasks = (tasksByDate[date] ?? []).filter(t => t.dueTime && Number(t.dueTime.split(':')[0]) === hour);
                const isSel = date === selectedDate;
                return (
                  <TouchableOpacity key={date} onPress={() => setSelectedDate(date)}
                    style={{ flex: 1, borderRightWidth: 1, borderRightColor: BORDER, padding: 3, backgroundColor: isSel ? ACCENT + '08' : 'transparent', minHeight: 56 }}>
                    {hourTasks.map(t => (
                      <TouchableOpacity key={t.id} onPress={() => onEdit(t)}
                        style={{ borderRadius: 4, paddingHorizontal: 4, paddingVertical: 3, marginBottom: 2, backgroundColor: (PRIORITY_COLOR[t.priority] ?? ACCENT) + '33', borderLeftWidth: 2, borderLeftColor: PRIORITY_COLOR[t.priority] ?? ACCENT }}>
                        <Text numberOfLines={1} style={{ fontSize: 9, color: TXT2, fontWeight: '600' }}>{t.title}</Text>
                        <Text style={{ fontSize: 8, color: MUTED }}>{t.dueTime}</Text>
                      </TouchableOpacity>
                    ))}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
        </View>
      )}

      {/* View toggle bar at bottom — matches web */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: SURFACE2 }}>
        {CAL_VIEWS.map(v => (
          <TouchableOpacity key={v.key} onPress={() => setCalView(v.key)}
            style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderBottomWidth: calView === v.key ? 2 : 0, borderBottomColor: ACCENT }}>
            <Text style={{ fontSize: 13, fontWeight: calView === v.key ? '600' : '400', color: calView === v.key ? TXT : MUTED }}>{v.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Task Detail Card (Calendar tap) ──────────────────────────────────────────────
function getRepeatDisplay(repeat: string): string {
  if (repeat.startsWith('custom:week:')) {
    const days = repeat.replace('custom:week:', '').split(',').map(Number);
    const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return days.map(d => names[d]).join(', ');
  }
  switch (repeat) {
    case 'daily':    return 'Every Day';
    case 'weekdays': return 'Every Weekday';
    case 'weekends': return 'Every Weekend';
    case 'weekly':   return 'Every Week';
    case 'monthly':  return 'Every Month';
    case 'yearly':   return 'Every Year';
    default:         return '';
  }
}

function TaskDetailSheet({ visible, task, lists, onClose, onFullEdit, onDelete, onComplete, onSnooze, isFromNotification }: {
  visible: boolean; task: Task | null; lists: TaskList[];
  onClose: () => void; onFullEdit: (t: Task) => void; onDelete: (id: string) => void;
  onComplete?: (taskId: string) => void;
  onSnooze?: (taskId: string, title: string, minutes: number) => void;
  isFromNotification?: boolean;
}) {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const [showSnooze, setShowSnooze] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  if (!task) return null;

  const repeat      = getRepeat(task.tags);
  const displayTags = parseTags(task.tags);
  const today       = todayStr();
  const isOverdue   = !!(task.dueDate && task.dueDate < today);
  const dateColor   = isOverdue ? '#C06060' : task.dueDate === today ? ACCENT : '#D1D5DB';
  const priColor    = task.priority !== 'none' ? PRIORITY_COLOR[task.priority] : MUTED;
  const list        = lists.find(l => l.id === task.listId);

  const dateLabel = !task.dueDate ? null : (() => {
    const d    = new Date(task.dueDate + 'T00:00:00');
    const diff = Math.round((d.getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
    let label  = '';
    if      (diff === 0)  label = 'Today';
    else if (diff === 1)  label = 'Tomorrow';
    else if (diff === -1) label = 'Yesterday';
    else if (diff < -1)   label = `Last ${d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}`;
    else                  label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
    return task.dueTime ? `${label}, ${task.dueTime}` : label;
  })();

  const handleDelete = () => setShowDelete(true);

  const handleEdit = () => {
    onClose();
    setTimeout(() => onFullEdit(task), 280);
  };

  const handleSnooze = () => { if (onSnooze) setShowSnooze(true); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { setShowSnooze(false); setShowDelete(false); onClose(); }}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => { if (showSnooze || showDelete) { setShowSnooze(false); setShowDelete(false); } else { onClose(); } }} />
      <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, minHeight: '50%' }}>
        {/* Handle */}
        <View style={{ width: 36, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 2 }} />

        {/* Snooze sheet */}
        {showSnooze && (
          <View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: TXT, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>Snooze until…</Text>
            {[
              { label: '1 hour',           minutes: 60 },
              { label: 'Later today (3h)', minutes: 180 },
              { label: 'Tomorrow morning', minutes: minutesUntilTomorrowMorning() },
            ].map(opt => (
              <TouchableOpacity key={opt.label} onPress={() => { setShowSnooze(false); onSnooze!(task.id, task.title, opt.minutes); }}
                style={{ paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: BORDER, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Bell size={16} color={MUTED} />
                <Text style={{ fontSize: 15, color: TXT }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowSnooze(false)}
              style={{ paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: BORDER }}>
              <Text style={{ fontSize: 15, color: '#EF4444', fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Delete confirmation */}
        {showDelete && (
          <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: TXT, marginBottom: 8 }}>Delete task?</Text>
            <Text style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>"{task.title}" will be permanently deleted.</Text>
            <TouchableOpacity onPress={() => { setShowDelete(false); onClose(); onDelete(task.id); }}
              style={{ paddingVertical: 14, borderRadius: 14, backgroundColor: '#EF444422', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#EF444444' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#EF4444' }}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDelete(false)} style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ fontSize: 15, color: TXT }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main detail content */}
        {!showSnooze && !showDelete && (<>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: (list?.color ?? ACCENT) + '25', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 13 }}>{list?.emoji ?? '📥'}</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '500', color: TXT2 }} numberOfLines={1}>{list?.name ?? 'Inbox'}</Text>
            <ChevronDown size={13} color={MUTED} />
          </View>
          <TouchableOpacity onPress={handleEdit} style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
            <Flag size={17} color={priColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} color={MUTED} />
          </TouchableOpacity>
        </View>

        {/* Date + Repeat */}
        {(dateLabel || repeat !== 'none') && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12, gap: 5 }}>
            {dateLabel && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CalendarDays size={13} color={dateColor} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: dateColor }}>{dateLabel}</Text>
              </View>
            )}
            {repeat !== 'none' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <RotateCcw size={12} color={MUTED} />
                <Text style={{ fontSize: 12, color: MUTED }}>{getRepeatDisplay(repeat)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Title */}
        <TouchableOpacity onPress={handleEdit} activeOpacity={0.7}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: TXT, paddingHorizontal: 16, paddingBottom: 6, lineHeight: 29 }}>
            {task.title}
          </Text>
        </TouchableOpacity>

        {/* Notes */}
        <TouchableOpacity onPress={handleEdit} activeOpacity={0.7}>
          <Text style={{ fontSize: 14, color: task.notes ? TXT2 : MUTED, paddingHorizontal: 16, paddingBottom: 20, minHeight: 56 }}>
            {task.notes || 'Add notes…'}
          </Text>
        </TouchableOpacity>

        {/* Tags */}
        {displayTags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingBottom: 16 }}>
            {displayTags.map(t => (
              <View key={t} style={{ borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#6868A818' }}>
                <Text style={{ fontSize: 11, color: '#8888BE' }}>#{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom toolbar */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: BORDER }}>
          {(onComplete || onSnooze) && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: isFromNotification ? 0 : 10 }}>
              {onComplete && (
                <TouchableOpacity onPress={() => onComplete(task.id)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: ACCENT + '22', borderWidth: 1, borderColor: ACCENT + '55' }}>
                  <Check size={16} color={ACCENT} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: ACCENT }}>Done</Text>
                </TouchableOpacity>
              )}
              {onSnooze && (
                <TouchableOpacity onPress={handleSnooze}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER }}>
                  <Bell size={16} color={MUTED} />
                  <Text style={{ fontSize: 14, fontWeight: '500', color: TXT2 }}>Snooze</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {!isFromNotification && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={{ padding: 8 }}>
                <Tag size={20} color={displayTags.length > 0 ? '#8888BE' : BORDER} />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={handleEdit}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, backgroundColor: SURFACE2, marginRight: 10 }}>
                <Pencil size={14} color={TXT2} />
                <Text style={{ fontSize: 13, fontWeight: '500', color: TXT2 }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}
                style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#C0606018', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={17} color="#C06060" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        </>)}
      </View>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────────
export default function TasksScreen() {
  const { BG, SURFACE, SURFACE2, BORDER, MUTED, TXT, TXT2, MODAL, INPUT } = useColors();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab]           = useState<SubTab>('today');
  const [collapsed, setCollapsed]           = useState<Record<string, boolean>>({});
  const [showAdd, setShowAdd]               = useState(false);
  const [showMore, setShowMore]             = useState(false);
  const [showDrawer, setShowDrawer]         = useState(false);
  const [editTask, setEditTask]             = useState<Task | null>(null);
  const [activeList, setActiveList]         = useState<TaskList | null>(null);
  const [showCreateList, setShowCreateList] = useState(false);
  const [editList, setEditList]             = useState<TaskList | null>(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [sortBy, setSortBy]                 = useState<SortBy>('custom');
  const [calendarDate, setCalendarDate]     = useState(todayStr());
  const [calDetailTask, setCalDetailTask]   = useState<Task | null>(null);
  const [isFromNotification, setIsFromNotification] = useState(false);
  const qc = useQueryClient();

  const { pendingTaskId, clearPendingTaskId } = useNotificationStore();

  // Close all modals when app goes to background (prevents frozen UI on Android)
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        setShowAdd(false); setShowMore(false); setShowDrawer(false);
        setEditTask(null); setCalDetailTask(null);
        setShowCreateList(false); setEditList(null);
      }
    });
    return () => sub.remove();
  }, []);

  // ── Queries ────────────────────────────────────────────────────────────────────
  const { data: todayData, isLoading: loadingToday, refetch: refetchToday } =
    useQuery({ queryKey: ['tasks', 'today'], queryFn: getTodayTasks, enabled: activeTab === 'today' });

  const { data: allTasks = [], isLoading: loadingAll, refetch: refetchAll } =
    useQuery({ queryKey: ['tasks', 'all'], queryFn: () => getAllTasks() });

  // Show task detail card when tapped from a notification
  useEffect(() => {
    if (!pendingTaskId || allTasks.length === 0) return;
    const task = allTasks.find(t => t.id === pendingTaskId);
    if (task) {
      setCalDetailTask(task);
      setIsFromNotification(true);
      clearPendingTaskId();
    }
  }, [pendingTaskId, allTasks]);

  const { data: listTasks = [], isLoading: loadingList, refetch: refetchList } =
    useQuery({ queryKey: ['tasks', 'list', activeList?.id], queryFn: () => getAllTasks(activeList!.id), enabled: !!activeList });

  const { data: lists = [] } =
    useQuery({ queryKey: ['taskLists'], queryFn: getTaskLists });

  // ── Mutations ──────────────────────────────────────────────────────────────────
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tasks'] });
  const onMutateError = () => Alert.alert('Error', 'Something went wrong. Please try again.');
  const invalidateLists = () => { qc.invalidateQueries({ queryKey: ['taskLists'] }); invalidate(); };
  const completeMut  = useMutation({ mutationFn: completeInstance,  onSuccess: invalidate, onError: onMutateError });
  const deleteMut    = useMutation({ mutationFn: deleteTask,        onSuccess: invalidate, onError: onMutateError });
  const createMut    = useMutation({ mutationFn: createTask,        onSuccess: invalidate, onError: onMutateError });
  const updateMut    = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => updateTask(id, data), onSuccess: invalidate, onError: onMutateError });
  const createListMut = useMutation({ mutationFn: createTaskList,  onSuccess: invalidateLists, onError: onMutateError });
  const updateListMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<TaskList> }) => updateTaskList(id, data), onSuccess: invalidateLists, onError: onMutateError });
  const deleteListMut = useMutation({ mutationFn: deleteTaskList,  onSuccess: () => { invalidateLists(); if (activeList) setActiveList(null); }, onError: onMutateError });

  // ── Derived ────────────────────────────────────────────────────────────────────
  const toggleSection = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const PRI_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };
  const sortList = useCallback((list: Task[]): Task[] => {
    if (sortBy === 'custom') return list;
    return [...list].sort((a, b) => {
      if (sortBy === 'date') { const da = a.dueDate ?? '9999'; const db = b.dueDate ?? '9999'; return da !== db ? (da < db ? -1 : 1) : ((a.dueTime ?? '') < (b.dueTime ?? '') ? -1 : 1); }
      if (sortBy === 'title') return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      if (sortBy === 'priority') return (PRI_ORDER[a.priority] ?? 3) - (PRI_ORDER[b.priority] ?? 3);
      return 0;
    });
  }, [sortBy]);

  const todaySections = SECTION_CONFIG.map(({ key, label, color, bg }) => {
    let raw: TaskInstance[];
    if (key === 'overdue') {
      // Merge missed (past uncommitted tasks) into overdue
      raw = [...((todayData as any)?.overdue ?? []), ...((todayData as any)?.missed ?? [])];
    } else {
      raw = (todayData as any)?.[key] ?? [];
    }
    const filtered = searchQuery ? raw.filter(i => i.task.title.toLowerCase().includes(searchQuery.toLowerCase())) : raw;
    // Auto-expand sections when searching so results are never hidden
    return { key, label, color, bg, data: (collapsed[key] && !searchQuery) ? [] : filtered, count: raw.length };
  });

  const inboxTasks = useMemo(() => {
    const filtered = allTasks.filter(t => !t.listId && t.status === 'active' && (!searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase())));
    return sortList(filtered);
  }, [allTasks, searchQuery, sortList]);

  // Recompute dates when user returns to this tab so they never go stale past midnight
  const next7Dates = useMemo(() => getNext7Dates(), [activeTab]);
  const next7Groups = useMemo(() => {
    const filtered = allTasks.filter(t => t.status === 'active' && (!searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase())));
    return next7Dates.map(date => ({ date, tasks: sortList(filtered.filter(t => t.dueDate === date)) })).filter(g => g.tasks.length > 0);
  }, [allTasks, next7Dates, searchQuery, sortList]);

  const filteredListTasks = useMemo(() => {
    const active = listTasks.filter(t => t.status === 'active' && (!searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase())));
    return sortList(active);
  }, [listTasks, searchQuery, sortList]);

  const isLoading = activeTab === 'today' ? loadingToday : activeList ? loadingList : loadingAll;

  // ── Handlers ───────────────────────────────────────────────────────────────────
  const handleTabSelect = (tab: SubTab) => {
    if (tab !== 'lists') setActiveList(null);
    setActiveTab(tab);
    setSearchQuery('');
    setSortBy('custom');
  };

  const handleSaveTask = (data: TaskSaveData) => {
    createMut.mutate(
      { title: data.title, priority: data.priority as CreateTaskInput['priority'], dueDate: data.dueDate, dueTime: data.dueTime, listId: data.listId, tags: data.tags },
      { onSuccess: (task) => scheduleTaskNotification(task).catch(() => {}) },
    );
  };

  const handleUpdateTask = (data: TaskSaveData) => {
    if (!editTask) return;
    cancelTaskNotification(editTask.id).catch(() => {});
    updateMut.mutate(
      { id: editTask.id, data: { title: data.title, notes: data.notes, priority: data.priority as Task['priority'], dueDate: data.dueDate, dueTime: data.dueTime, listId: data.listId ?? null, tags: JSON.stringify(data.tags) } },
      { onSuccess: (task) => scheduleTaskNotification(task).catch(() => {}) },
    );
  };

  const handleDeleteTask = () => {
    if (!editTask) return;
    Alert.alert('Delete Task', `Delete "${editTask.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        cancelTaskNotification(editTask.id).catch(() => {});
        deleteMut.mutate(editTask.id);
        setEditTask(null);
      }},
    ]);
  };

  const handleDeleteList = (id: string) => {
    const list = lists.find(l => l.id === id);
    Alert.alert('Delete List', `Delete "${list?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteListMut.mutate(id) },
    ]);
  };

  const today = todayStr();
  const headerTitle = activeList ? activeList.name : activeTab === 'today' ? 'Today' : activeTab === 'inbox' ? 'Inbox' : activeTab === 'lists' ? 'Lists' : activeTab === 'calendar' ? 'Calendar' : 'Next 7 Days';

  // Default due date for QuickAdd based on active context
  const defaultDueDate = activeTab === 'today' ? today : activeTab === 'calendar' ? calendarDate : undefined;
  const defaultListId  = activeList?.id;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, backgroundColor: BG }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {activeList ? (
            <TouchableOpacity onPress={() => setActiveList(null)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={20} color={TXT2} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowDrawer(true)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' }}>
              <Menu size={20} color={TXT2} />
            </TouchableOpacity>
          )}
          <Text style={{ fontSize: 22, fontWeight: '700', color: TXT }} numberOfLines={1}>{headerTitle}</Text>
          {activeList && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeList.color ?? ACCENT, marginLeft: 2 }} />}
        </View>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/')} activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 6 }}>
          <MyOrbitLogo />
          <Text style={{ fontSize: 18, fontWeight: '700', color: TXT }}>MyOrbit</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar + Add button — hidden on calendar (navigate by date, not search) */}
      {!(activeTab === 'calendar' && !activeList) && <View style={{ paddingHorizontal: 14, paddingBottom: 10, backgroundColor: BG, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 9, gap: 8 }}>
          <Search size={12} color={MUTED} />
          <TextInput
            style={{ flex: 1, fontSize: 14, color: TXT }}
            placeholder={activeTab === 'lists' && !activeList ? 'Search lists…' : 'Search tasks…'}
            placeholderTextColor={MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}><X size={15} color={MUTED} /></TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => { if (activeTab === 'lists' && !activeList) setShowCreateList(true); else setShowAdd(true); }}
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>}

      {/* Content */}
      <View style={{ flex: 1 }}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : (
          <>
            {/* ── TODAY ────────────────────────────────────────────────────── */}
            {activeTab === 'today' && !activeList && (
              <SectionList
                sections={todaySections}
                keyExtractor={(item: TaskInstance) => item.id}
                refreshControl={<RefreshControl refreshing={false} onRefresh={refetchToday} />}
                renderSectionHeader={({ section }) => section.count === 0 ? null : (
                  <TouchableOpacity onPress={() => toggleSection(section.key)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: section.bg }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {section.key === 'overdue' && <AlertTriangle size={14} color={section.color} />}
                      <Text style={{ fontSize: 13, fontWeight: '600', color: section.color }}>{section.label}</Text>
                      <View style={{ borderRadius: 20, paddingHorizontal: 7, paddingVertical: 1, backgroundColor: section.color + '33' }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: section.color }}>{section.count}</Text>
                      </View>
                    </View>
                    {collapsed[section.key] ? <ChevronRight size={14} color={section.color} /> : <ChevronDown size={14} color={section.color} />}
                  </TouchableOpacity>
                )}
                renderItem={({ item }) => <InstanceItem item={item} onComplete={completeMut.mutateAsync} onEdit={setCalDetailTask} />}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', paddingVertical: 64 }}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>🎉</Text>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2 }}>All caught up!</Text>
                    <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>No tasks for today</Text>
                  </View>
                }
              />
            )}

            {/* ── INBOX ────────────────────────────────────────────────────── */}
            {activeTab === 'inbox' && !activeList && (
              <FlatList
                data={inboxTasks}
                keyExtractor={t => t.id}
                refreshControl={<RefreshControl refreshing={false} onRefresh={refetchAll} />}
                renderItem={({ item }) => <TaskRow task={item} onDelete={deleteMut.mutate} onEdit={setCalDetailTask} />}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', paddingVertical: 64 }}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>📥</Text>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2 }}>Inbox is empty</Text>
                    <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{searchQuery ? 'No tasks match your search' : 'All tasks are in lists'}</Text>
                  </View>
                }
              />
            )}

            {/* ── LISTS BROWSER ────────────────────────────────────────────── */}
            {activeTab === 'lists' && !activeList && (
              <ListsBrowser lists={lists} allTasks={allTasks} searchQuery={searchQuery} onSelectList={list => { setSearchQuery(''); setActiveList(list); }} onEditList={setEditList} onDeleteList={handleDeleteList} />
            )}

            {/* ── LIST TASKS ───────────────────────────────────────────────── */}
            {activeList && (
              <FlatList
                data={filteredListTasks}
                keyExtractor={t => t.id}
                refreshControl={<RefreshControl refreshing={loadingList} onRefresh={refetchList} />}
                renderItem={({ item }) => <TaskRow task={item} onDelete={deleteMut.mutate} onEdit={setCalDetailTask} />}
                ListHeaderComponent={
                  <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: (activeList.color ?? ACCENT) + '15', borderBottomWidth: 1, borderBottomColor: BORDER }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: activeList.color ?? ACCENT }}>
                      {filteredListTasks.length} task{filteredListTasks.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                }
                ListEmptyComponent={loadingList ? null : (
                  <View style={{ alignItems: 'center', paddingVertical: 64 }}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>{activeList.emoji ?? '📋'}</Text>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2 }}>No tasks yet</Text>
                    <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{searchQuery ? 'No tasks match your search' : 'Tap + to add a task'}</Text>
                  </View>
                )}
              />
            )}

            {/* ── CALENDAR ─────────────────────────────────────────────────── */}
            {activeTab === 'calendar' && !activeList && (
              <CalendarWeekView tasks={allTasks} onEdit={setCalDetailTask} onDelete={deleteMut.mutate} onDateSelect={setCalendarDate} />
            )}

            {/* ── NEXT 7 ───────────────────────────────────────────────────── */}
            {activeTab === 'next7' && !activeList && (
              <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refetchAll} />}>
                {next7Groups.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 64 }}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>📅</Text>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: TXT2 }}>Nothing scheduled</Text>
                    <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{searchQuery ? 'No tasks match your search' : 'No tasks in the next 7 days'}</Text>
                  </View>
                ) : next7Groups.map(({ date, tasks }) => (
                  <View key={date} style={{ marginBottom: 8 }}>
                    <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: SURFACE2 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {date === today ? '📌 Today' : formatDate(date)}
                      </Text>
                    </View>
                    {tasks.map(t => <TaskRow key={t.id} task={t} onDelete={deleteMut.mutate} onEdit={setCalDetailTask} />)}
                  </View>
                ))}
              </ScrollView>
            )}
          </>
        )}
      </View>

      {/* Bottom Nav */}
      <SubNav active={activeTab} onSelect={handleTabSelect} onMore={() => setShowMore(true)} />

      {/* Modals */}
      <SideDrawer
        visible={showDrawer}
        active={activeTab}
        lists={lists}
        onSelect={handleTabSelect}
        onSelectList={list => { setSearchQuery(''); setActiveList(list); setShowDrawer(false); }}
        onCreateList={() => { setShowCreateList(true); setShowDrawer(false); }}
        onClose={() => setShowDrawer(false)}
        userName={user?.name ?? 'User'}
      />
      <MoreSheet visible={showMore} active={activeTab} onSelect={setActiveTab} onClose={() => setShowMore(false)} />

      <QuickAddSheet
        visible={showAdd}
        lists={lists}
        defaultDueDate={defaultDueDate}
        defaultListId={defaultListId}
        onClose={() => setShowAdd(false)}
        onAdd={handleSaveTask}
      />

      <TaskModal
        visible={!!editTask}
        initial={editTask}
        lists={lists}
        onClose={() => setEditTask(null)}
        onSave={data => { handleUpdateTask(data); setEditTask(null); }}
        onDelete={handleDeleteTask}
      />

      <ListModal visible={showCreateList} onClose={() => setShowCreateList(false)} onSave={data => createListMut.mutate(data)} />
      <ListModal visible={!!editList} initial={editList} onClose={() => setEditList(null)} onSave={data => { if (editList) updateListMut.mutate({ id: editList.id, data }); }} />

      <TaskDetailSheet
        visible={!!calDetailTask}
        task={calDetailTask}
        lists={lists}
        isFromNotification={isFromNotification}
        onClose={() => { setCalDetailTask(null); setIsFromNotification(false); }}
        onFullEdit={t => { setCalDetailTask(null); setIsFromNotification(false); setTimeout(() => setEditTask(t), 280); }}
        onDelete={id => { cancelTaskNotification(id).catch(() => {}); deleteMut.mutate(id); }}
        onComplete={isFromNotification ? (taskId) => {
          cancelTaskNotification(taskId).catch(() => {});
          updateMut.mutate({ id: taskId, data: { status: 'completed' } });
          setCalDetailTask(null);
          setIsFromNotification(false);
        } : undefined}
        onSnooze={isFromNotification ? (taskId, title, minutes) => {
          snoozeTaskNotification(taskId, title, minutes).catch(() => {});
          setCalDetailTask(null);
          setIsFromNotification(false);
        } : undefined}
      />
    </SafeAreaView>
  );
}
