import { useState, useCallback, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import {
  View, Text, SectionList, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert,
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
  Pencil, Tag, FileText, Flag, Star,
} from 'lucide-react-native';
import AppHeader from '@/components/shared/AppHeader';

// ── Types ───────────────────────────────────────────────────────────────────────

type SubTab = 'today' | 'inbox' | 'lists' | 'calendar' | 'next7';

// ── Constants ───────────────────────────────────────────────────────────────────

const ACCENT = '#10B981';

const SUB_TABS = [
  { key: 'today'    as SubTab, label: 'Today',    Icon: Sun      },
  { key: 'inbox'    as SubTab, label: 'Inbox',    Icon: InboxIcon },
  { key: 'lists'    as SubTab, label: 'Lists',    Icon: ListIcon  },
  { key: 'calendar' as SubTab, label: 'Calendar', Icon: CalendarDays },
];
const MORE_ITEMS = [
  { key: 'next7' as SubTab, label: 'Next 7 Days', Icon: CalendarCheck },
];

const PRIORITY_COLOR: Record<string, string> = {
  high: '#EF4444', medium: '#F59E0B', low: '#3B82F6', none: '#9CA3AF',
};

const SECTION_CONFIG = [
  { key: 'overdue',   label: 'Overdue',   color: '#EF4444', bg: '#EF444422' },
  { key: 'today',     label: 'Today',     color: '#10B981', bg: '#10B98122' },
  { key: 'missed',    label: 'Missed',    color: '#F59E0B', bg: '#F59E0B22' },
  { key: 'completed', label: 'Completed', color: '#9CA3AF', bg: '#242424' },
];

const LIST_EMOJIS = ['📋', '📝', '✅', '📌', '💼', '🏠', '🛒', '🎯', '📚', '💡', '💻', '🧾'];
const LIST_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#64748B'];

// ── Helpers ─────────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function todayStr() {
  return new Date().toLocaleDateString('en-CA');
}

function getNext7Dates(): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    dates.push(d.toLocaleDateString('en-CA'));
  }
  return dates;
}

function parseTags(raw: string): string[] {
  if (!raw) return [];
  try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch {}
  return raw.split(',').map(t => t.trim()).filter(Boolean);
}

// ── Sub Nav ─────────────────────────────────────────────────────────────────────

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

// ── More Sheet ──────────────────────────────────────────────────────────────────

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
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: active === key ? '#10B98122' : 'white' }}>
            <Icon size={16} color={active === key ? ACCENT : '#9CA3AF'} />
            <Text style={{ fontSize: 16, fontWeight: '500', color: active === key ? ACCENT : '#374151' }}>{label}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 1, backgroundColor: '#2A2A2A', marginHorizontal: 16, marginVertical: 4 }} />
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
          <Settings size={16} color="#9CA3AF" />
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#E5E7EB' }}>Settings</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Task Instance Item ──────────────────────────────────────────────────────────

function InstanceItem({ item, onComplete, onEdit }: {
  item: TaskInstance; onComplete: (id: string) => void; onEdit: (task: Task) => void;
}) {
  const [loading, setLoading] = useState(false);
  const done = item.status === 'completed';
  const handleComplete = async () => {
    if (done) return; setLoading(true);
    try { await onComplete(item.id); } finally { setLoading(false); }
  };
  return (
    <TouchableOpacity
      onPress={() => {
        const taskObj: Task = {
          id: item.taskId,
          userId: item.userId,
          title: item.task.title,
          status: done ? 'completed' : 'active',
          priority: item.task.priority as Task['priority'],
          dueTime: item.task.dueTime ?? undefined,
          listId: item.task.listId ?? undefined,
          list: item.task.list ?? undefined,
          tags: item.task.tags,
          sortOrder: 0,
          isActive: true,
          isDeleted: false,
          isRecurring: false,
        };
        onEdit(taskObj);
      }}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#242424' }}
    >
      <TouchableOpacity onPress={handleComplete} disabled={loading} style={{ marginRight: 12 }}>
        {loading ? <ActivityIndicator size={20} color={ACCENT} /> : done ? <CheckCircle size={22} color={ACCENT} /> : <Circle size={22} color="#D1D5DB" />}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: done ? '#9CA3AF' : '#111827', textDecorationLine: done ? 'line-through' : 'none' }}>
          {item.task.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8, flexWrap: 'wrap' }}>
          {item.task.dueTime && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Clock size={11} color="#9CA3AF" />
              <Text style={{ fontSize: 16, color: '#9CA3AF' }}>{item.task.dueTime}</Text>
            </View>
          )}
          {item.task.priority !== 'none' && (
            <View style={{ borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: PRIORITY_COLOR[item.task.priority] + '22' }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: PRIORITY_COLOR[item.task.priority], textTransform: 'capitalize' }}>{item.task.priority}</Text>
            </View>
          )}
          {item.task.list && <Text style={{ fontSize: 16, color: '#9CA3AF' }}>{item.task.list.emoji} {item.task.list.name}</Text>}
        </View>
      </View>
      <ChevronRight size={14} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

// ── Task Row (non-instance) ────────────────────────────────────────────────────

function TaskRow({ task, onDelete, onEdit }: { task: Task; onDelete: (id: string) => void; onEdit: (t: Task) => void }) {
  const tags = parseTags(task.tags);
  return (
    <TouchableOpacity onPress={() => onEdit(task)} activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#242424' }}>
      <View style={{ marginRight: 12 }}>
        <Circle size={22} color="#D1D5DB" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#FFFFFF' }}>{task.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8, flexWrap: 'wrap' }}>
          {task.dueDate && <Text style={{ fontSize: 16, color: '#9CA3AF' }}>{formatDate(task.dueDate)}</Text>}
          {task.dueTime && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Clock size={11} color="#9CA3AF" />
              <Text style={{ fontSize: 16, color: '#9CA3AF' }}>{task.dueTime}</Text>
            </View>
          )}
          {task.priority !== 'none' && (
            <View style={{ borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: PRIORITY_COLOR[task.priority] + '22' }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: PRIORITY_COLOR[task.priority], textTransform: 'capitalize' }}>{task.priority}</Text>
            </View>
          )}
          {task.list && <Text style={{ fontSize: 16, color: '#9CA3AF' }}>{task.list.emoji} {task.list.name}</Text>}
          {tags.slice(0, 2).map(t => (
            <View key={t} style={{ borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#EDE9FE' }}>
              <Text style={{ fontSize: 13, color: '#7C3AED' }}>#{t}</Text>
            </View>
          ))}
          {task.subtasks && task.subtasks.length > 0 && (
            <Text style={{ fontSize: 16, color: '#9CA3AF' }}>
              {task.subtasks.filter(s => s.isDone).length}/{task.subtasks.length} subtasks
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={() => onDelete(task.id)} style={{ padding: 8 }}>
        <Trash2 size={16} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── List Selector Sheet ─────────────────────────────────────────────────────────

function ListSelectorSheet({ visible, lists, selectedId, onSelect, onClose }: {
  visible: boolean; lists: TaskList[]; selectedId: string; onSelect: (id: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: '60%' }}>
        <View style={{ width: 40, height: 4, backgroundColor: '#3A3A3A', borderRadius: 2, alignSelf: 'center', marginTop: 12 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' }}>
          <Text style={{ fontWeight: '600', fontSize: 15, color: '#FFFFFF' }}>Select List</Text>
          <TouchableOpacity onPress={onClose} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <ScrollView>
          <TouchableOpacity onPress={() => { onSelect(''); onClose(); }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: !selectedId ? '#10B98122' : 'white' }}>
            <Text style={{ fontSize: 18 }}>📥</Text>
            <Text style={{ fontSize: 16, fontWeight: '500', color: !selectedId ? ACCENT : '#374151' }}>Inbox (no list)</Text>
            {!selectedId && <CheckCircle size={16} color={ACCENT} style={{ marginLeft: 'auto' }} />}
          </TouchableOpacity>
          {lists.map(list => {
            const color = list.color ?? '#10B981';
            const isSelected = selectedId === list.id;
            return (
              <TouchableOpacity key={list.id} onPress={() => { onSelect(list.id); onClose(); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: isSelected ? '#10B98122' : 'white', borderTopWidth: 1, borderTopColor: '#242424' }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>{list.emoji ?? '📋'}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: isSelected ? ACCENT : '#374151' }}>{list.name}</Text>
                {isSelected && <CheckCircle size={16} color={ACCENT} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Add / Edit Task Modal ───────────────────────────────────────────────────────

interface TaskFormData {
  title: string; notes: string; priority: string;
  dueDate: string; dueTime: string; listId: string; tags: string[];
}

function TaskModal({ visible, initial, lists, onClose, onSave, onDelete }: {
  visible: boolean;
  initial?: Task | null;
  lists: TaskList[];
  onClose: () => void;
  onSave: (data: Partial<CreateTaskInput> & { notes?: string }) => void;
  onDelete?: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<TaskFormData>({
    title: '', notes: '', priority: 'none', dueDate: '', dueTime: '', listId: '', tags: [],
  });
  const [tagInput, setTagInput]           = useState('');
  const [showListPicker, setShowListPicker] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setForm({
        title:    initial.title,
        notes:    initial.notes ?? '',
        priority: initial.priority,
        dueDate:  initial.dueDate ?? '',
        dueTime:  initial.dueTime ?? '',
        listId:   initial.listId ?? '',
        tags:     parseTags(initial.tags),
      });
    } else {
      setForm({ title: '', notes: '', priority: 'none', dueDate: '', dueTime: '', listId: '', tags: [] });
    }
    setTagInput('');
  }, [visible, initial?.id]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  };

  const save = () => {
    if (!form.title.trim()) return;
    onSave({
      title:    form.title.trim(),
      notes:    form.notes || undefined,
      priority: form.priority as CreateTaskInput['priority'],
      dueDate:  form.dueDate || undefined,
      dueTime:  form.dueTime || undefined,
      listId:   form.listId || undefined,
      tags:     form.tags.length > 0 ? form.tags : undefined,
    });
    onClose();
  };

  const selectedList = lists.find(l => l.id === form.listId);
  const today = new Date().toLocaleDateString('en-CA');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#3A3A3A', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>{isEdit ? 'Edit Task' : 'New Task'}</Text>
            {isEdit && onDelete && (
              <TouchableOpacity onPress={onDelete} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EF444422' }}>
                <Trash2 size={14} color="#EF4444" />
                <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '600' }}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Title */}
          <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Title</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#FFFFFF', marginBottom: 12 }}
            placeholder="What needs to be done?"
            value={form.title}
            onChangeText={t => setForm(f => ({ ...f, title: t }))}
            autoFocus={!isEdit}
          />

          {/* Notes */}
          <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Notes</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: '#FFFFFF', marginBottom: 12, minHeight: 64, textAlignVertical: 'top' }}
            placeholder="Add notes…"
            multiline
            value={form.notes}
            onChangeText={t => setForm(f => ({ ...f, notes: t }))}
          />

          {/* Date + Time row */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Due Date</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 14, paddingVertical: 11, fontSize: 16, color: '#FFFFFF' }}
                placeholder={`e.g. ${today}`}
                value={form.dueDate}
                onChangeText={t => setForm(f => ({ ...f, dueDate: t }))}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Time</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 14, paddingVertical: 11, fontSize: 16, color: '#FFFFFF' }}
                placeholder="e.g. 09:00"
                value={form.dueTime}
                onChangeText={t => setForm(f => ({ ...f, dueTime: t }))}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* Priority */}
          <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>Priority</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {(['none', 'low', 'medium', 'high'] as const).map((p) => (
              <TouchableOpacity key={p} onPress={() => setForm(f => ({ ...f, priority: p }))}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: form.priority === p ? PRIORITY_COLOR[p] : '#E5E7EB', backgroundColor: form.priority === p ? PRIORITY_COLOR[p] + '22' : '#242424' }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: form.priority === p ? PRIORITY_COLOR[p] : '#6B7280', textTransform: 'capitalize' }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* List */}
          <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>List</Text>
          <TouchableOpacity onPress={() => setShowListPicker(true)}
            style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
            <Text style={{ fontSize: 18 }}>{selectedList?.emoji ?? '📥'}</Text>
            <Text style={{ flex: 1, fontSize: 16, color: selectedList ? '#111827' : '#9CA3AF' }}>
              {selectedList?.name ?? 'Inbox (no list)'}
            </Text>
            <ChevronRight size={14} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Tags */}
          <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Tags</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: form.tags.length > 0 ? 6 : 12 }}>
            <TextInput
              style={{ flex: 1, borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: '#FFFFFF' }}
              placeholder="Add tag…"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={addTag}
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: ACCENT }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>Add</Text>
            </TouchableOpacity>
          </View>
          {form.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {form.tags.map(t => (
                <TouchableOpacity key={t} onPress={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#EDE9FE' }}>
                  <Text style={{ fontSize: 13, color: '#7C3AED' }}>#{t}</Text>
                  <X size={10} color="#7C3AED" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Subtasks (read-only in edit mode) */}
          {isEdit && initial?.subtasks && initial.subtasks.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>Subtasks</Text>
              {initial.subtasks.map(s => (
                <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                  {s.isDone ? <CheckCircle size={16} color={ACCENT} /> : <Circle size={16} color="#D1D5DB" />}
                  <Text style={{ fontSize: 16, color: s.isDone ? '#9CA3AF' : '#374151', textDecorationLine: s.isDone ? 'line-through' : 'none' }}>{s.title}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A' }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#9CA3AF' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={!form.title.trim()}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: form.title.trim() ? 1 : 0.5 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>{isEdit ? 'Save' : 'Add Task'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ListSelectorSheet
        visible={showListPicker}
        lists={lists}
        selectedId={form.listId}
        onSelect={id => setForm(f => ({ ...f, listId: id }))}
        onClose={() => setShowListPicker(false)}
      />
    </Modal>
  );
}

// ── Lists Browser View ──────────────────────────────────────────────────────────

function ListsBrowser({ lists, onSelectList, onRefresh, onCreateList, onEditList, onDeleteList }: {
  lists: TaskList[];
  onSelectList: (list: TaskList) => void;
  onRefresh: () => void;
  onCreateList: () => void;
  onEditList: (list: TaskList) => void;
  onDeleteList: (id: string) => void;
}) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Create new list button */}
      <TouchableOpacity onPress={onCreateList}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: ACCENT + '33', borderStyle: 'dashed' }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={20} color={ACCENT} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: '600', color: ACCENT }}>New List</Text>
      </TouchableOpacity>

      {lists.length === 0 ? (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ListIcon size={48} color="#D1D5DB" />
          <Text style={{ fontSize: 15, fontWeight: '500', color: '#9CA3AF', marginTop: 12 }}>No lists yet</Text>
          <Text style={{ fontSize: 16, color: '#9CA3AF', marginTop: 4 }}>Tap above to create your first list</Text>
        </View>
      ) : (
        lists.map(list => {
          const color = list.color ?? '#10B981';
          return (
            <TouchableOpacity key={list.id} onPress={() => onSelectList(list)}
              style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: '#1A1A1A', padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2A2A2A' }}>
              <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 22 }}>{list.emoji ?? '📋'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>{list.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                  <Text style={{ fontSize: 13, color: '#9CA3AF' }}>Tap to view tasks</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => onEditList(list)} style={{ padding: 8 }}>
                <Pencil size={15} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDeleteList(list.id)} style={{ padding: 8 }}>
                <Trash2 size={15} color="#EF4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

// ── Create / Edit List Modal ────────────────────────────────────────────────────

function ListModal({ visible, initial, onClose, onSave }: {
  visible: boolean; initial?: TaskList | null; onClose: () => void;
  onSave: (data: { name: string; emoji: string; color: string }) => void;
}) {
  const [name, setName]   = useState('');
  const [emoji, setEmoji] = useState('📋');
  const [color, setColor] = useState('#10B981');

  useEffect(() => {
    if (!visible) return;
    if (initial) { setName(initial.name); setEmoji(initial.emoji ?? '📋'); setColor(initial.color ?? '#10B981'); }
    else { setName(''); setEmoji('📋'); setColor('#10B981'); }
  }, [visible, initial?.id]);

  const save = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji, color });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#3A3A3A', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>{initial ? 'Edit List' : 'New List'}</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <TextInput autoFocus
            style={{ borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, backgroundColor: '#242424', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#FFFFFF', marginBottom: 16 }}
            placeholder="List name..." value={name} onChangeText={setName}
          />

          <Text style={{ fontSize: 16, fontWeight: '600', color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 }}>ICON</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {LIST_EMOJIS.map(em => (
                <TouchableOpacity key={em} onPress={() => setEmoji(em)}
                  style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: emoji === em ? '#10B98122' : '#2A2A2A', borderWidth: emoji === em ? 2 : 0, borderColor: ACCENT }}>
                  <Text style={{ fontSize: 20 }}>{em}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={{ fontSize: 16, fontWeight: '600', color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 }}>COLOR</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {LIST_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setColor(c)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: 'white', shadowColor: c, shadowOpacity: 0.5, shadowRadius: 4, elevation: 3 }} />
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A' }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#9CA3AF' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={!name.trim()}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, opacity: name.trim() ? 1 : 0.5 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>{initial ? 'Save' : 'Create'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────────

export default function TasksScreen() {
  const [activeTab, setActiveTab]       = useState<SubTab>('today');
  const [collapsed, setCollapsed]       = useState<Record<string, boolean>>({});
  const [showAdd, setShowAdd]           = useState(false);
  const [showMore, setShowMore]         = useState(false);
  const [editTask, setEditTask]         = useState<Task | null>(null);
  const [activeList, setActiveList]     = useState<TaskList | null>(null);
  const [showCreateList, setShowCreateList] = useState(false);
  const [editList, setEditList]         = useState<TaskList | null>(null);
  const qc = useQueryClient();
  const today = todayStr();

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: todayData, isLoading: loadingToday, refetch: refetchToday } =
    useQuery({ queryKey: ['tasks', 'today'], queryFn: getTodayTasks, enabled: activeTab === 'today' });

  const { data: allTasks = [], isLoading: loadingAll, refetch: refetchAll } =
    useQuery({ queryKey: ['tasks', 'all'], queryFn: () => getAllTasks(), enabled: activeTab !== 'today' });

  const { data: listTasks = [], isLoading: loadingList, refetch: refetchList } =
    useQuery({ queryKey: ['tasks', 'list', activeList?.id], queryFn: () => getAllTasks(activeList!.id), enabled: !!activeList });

  const { data: lists = [], refetch: refetchLists } =
    useQuery({ queryKey: ['taskLists'], queryFn: getTaskLists });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tasks'] });

  const completeMut    = useMutation({ mutationFn: completeInstance,  onSuccess: invalidate });
  const deleteMut      = useMutation({ mutationFn: deleteTask,        onSuccess: invalidate });
  const createMut      = useMutation({ mutationFn: createTask,        onSuccess: invalidate });
  const updateMut      = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => updateTask(id, data), onSuccess: invalidate });

  const createListMut = useMutation({
    mutationFn: createTaskList,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['taskLists'] }); invalidate(); },
  });
  const updateListMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskList> }) => updateTaskList(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['taskLists'] }); invalidate(); },
  });
  const deleteListMut = useMutation({
    mutationFn: deleteTaskList,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskLists'] }); invalidate();
      if (activeList) setActiveList(null);
    },
  });

  // ── Derived data ─────────────────────────────────────────────────────────────

  const toggleSection = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const todaySections = SECTION_CONFIG.map(({ key, label, color, bg }) => ({
    key, label, color, bg,
    data: collapsed[key] ? [] : ((todayData as any)?.[key] ?? []),
    count: (todayData as any)?.[key]?.length ?? 0,
  }));

  // Inbox = active tasks NOT assigned to any list (matches web definition)
  const inboxTasks = useMemo(() =>
    allTasks.filter(t => !t.listId && t.status === 'active'), [allTasks]);

  const next7Dates  = useMemo(() => getNext7Dates(), []);
  const next7Groups = useMemo(() =>
    next7Dates
      .map(date => ({ date, tasks: allTasks.filter(t => t.dueDate === date && t.status === 'active') }))
      .filter(g => g.tasks.length > 0),
  [allTasks, next7Dates]);

  const isLoading = activeTab === 'today'
    ? loadingToday
    : activeTab === 'next7' || activeTab === 'inbox'
      ? loadingAll
      : activeList ? loadingList : false;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleTabSelect = (tab: SubTab) => {
    if (tab !== 'lists') setActiveList(null);
    setActiveTab(tab);
  };

  const handleSaveTask = (data: Partial<CreateTaskInput> & { notes?: string }) => {
    createMut.mutate({
      title:    data.title!,
      priority: data.priority,
      dueDate:  data.dueDate,
      dueTime:  data.dueTime,
      listId:   data.listId,
      tags:     data.tags,
    });
  };

  const handleUpdateTask = (data: Partial<CreateTaskInput> & { notes?: string }) => {
    if (!editTask) return;
    updateMut.mutate({
      id: editTask.id,
      data: {
        title:    data.title,
        notes:    data.notes,
        priority: data.priority as Task['priority'],
        dueDate:  data.dueDate,
        dueTime:  data.dueTime,
        listId:   data.listId ?? null,
        tags:     data.tags ? JSON.stringify(data.tags) : '[]',
      },
    });
  };

  const handleDeleteTask = () => {
    if (!editTask) return;
    Alert.alert('Delete Task', `Delete "${editTask.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteMut.mutate(editTask.id); setEditTask(null); } },
    ]);
  };

  const handleDeleteList = (id: string) => {
    const list = lists.find(l => l.id === id);
    Alert.alert('Delete List', `Delete "${list?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteListMut.mutate(id) },
    ]);
  };

  // ── Dynamic header title ──────────────────────────────────────────────────────

  const headerTitle = activeList
    ? activeList.name
    : activeTab === 'today' ? 'Today'
    : activeTab === 'inbox' ? 'Inbox'
    : activeTab === 'lists' ? 'Lists'
    : activeTab === 'calendar' ? 'Calendar'
    : activeTab === 'next7' ? 'Next 7 Days'
    : 'Tasks';

  const headerLeft = activeList ? (
    <TouchableOpacity onPress={() => setActiveList(null)}
      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' }}>
      <ChevronLeft size={20} color="#374151" />
    </TouchableOpacity>
  ) : (
    <TouchableOpacity onPress={() => router.back()}
      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' }}>
      <ChevronLeft size={20} color="#374151" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111111' }}>
      {/* Header — custom because title and left element are dynamic */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, backgroundColor: '#111111' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {headerLeft}
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFFFFF' }} numberOfLines={1}>{headerTitle}</Text>
          {activeList && (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeList.color ?? ACCENT, marginLeft: 2 }} />
          )}
        </View>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/')}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1A1A1A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#2A2A2A' }}
        >
          <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={12} color="white" fill="white" />
          </View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#9CA3AF' }}>MyOrbit</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : (
          <>
            {/* ── TODAY ──────────────────────────────────────────────────────── */}
            {activeTab === 'today' && !activeList && (
              <SectionList
                sections={todaySections}
                keyExtractor={(item: TaskInstance) => item.id}
                refreshControl={<RefreshControl refreshing={false} onRefresh={refetchToday} />}
                renderSectionHeader={({ section }) => (
                  <TouchableOpacity onPress={() => toggleSection(section.key)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: section.bg }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {section.key === 'overdue' && <AlertTriangle size={14} color={section.color} />}
                      <Text style={{ fontSize: 16, fontWeight: '600', color: section.color }}>{section.label}</Text>
                      <View style={{ borderRadius: 20, paddingHorizontal: 6, backgroundColor: section.color + '33' }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: section.color }}>{section.count}</Text>
                      </View>
                    </View>
                    {collapsed[section.key] ? <ChevronRight size={14} color={section.color} /> : <ChevronDown size={14} color={section.color} />}
                  </TouchableOpacity>
                )}
                renderItem={({ item }) => (
                  <InstanceItem item={item} onComplete={completeMut.mutateAsync} onEdit={setEditTask} />
                )}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', paddingVertical: 64 }}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>🎉</Text>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB' }}>All caught up!</Text>
                    <Text style={{ fontSize: 16, color: '#9CA3AF', marginTop: 4 }}>No tasks for today</Text>
                  </View>
                }
              />
            )}

            {/* ── INBOX ──────────────────────────────────────────────────────── */}
            {activeTab === 'inbox' && !activeList && (
              <FlatList
                data={inboxTasks}
                keyExtractor={t => t.id}
                refreshControl={<RefreshControl refreshing={false} onRefresh={refetchAll} />}
                renderItem={({ item }) => <TaskRow task={item} onDelete={deleteMut.mutate} onEdit={setEditTask} />}
                ListHeaderComponent={
                  <View style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#F5F3FF' }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#7C3AED' }}>
                      {inboxTasks.length} task{inboxTasks.length !== 1 ? 's' : ''} not in any list
                    </Text>
                  </View>
                }
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', paddingVertical: 64 }}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>📥</Text>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB' }}>Inbox is empty</Text>
                    <Text style={{ fontSize: 16, color: '#9CA3AF', marginTop: 4 }}>All tasks are assigned to lists</Text>
                  </View>
                }
              />
            )}

            {/* ── LISTS BROWSER ──────────────────────────────────────────────── */}
            {activeTab === 'lists' && !activeList && (
              <ListsBrowser
                lists={lists}
                onSelectList={list => setActiveList(list)}
                onRefresh={refetchLists}
                onCreateList={() => setShowCreateList(true)}
                onEditList={list => setEditList(list)}
                onDeleteList={handleDeleteList}
              />
            )}

            {/* ── LIST TASKS ─────────────────────────────────────────────────── */}
            {activeList && (
              <FlatList
                data={listTasks.filter(t => t.status === 'active')}
                keyExtractor={t => t.id}
                refreshControl={<RefreshControl refreshing={loadingList} onRefresh={refetchList} />}
                renderItem={({ item }) => <TaskRow task={item} onDelete={deleteMut.mutate} onEdit={setEditTask} />}
                ListHeaderComponent={
                  <View style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: (activeList.color ?? ACCENT) + '11' }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: activeList.color ?? ACCENT }}>
                      {listTasks.filter(t => t.status === 'active').length} task{listTasks.filter(t => t.status === 'active').length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                }
                ListEmptyComponent={
                  loadingList ? null : (
                    <View style={{ alignItems: 'center', paddingVertical: 64 }}>
                      <Text style={{ fontSize: 40, marginBottom: 12 }}>{activeList.emoji ?? '📋'}</Text>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB' }}>No tasks yet</Text>
                      <Text style={{ fontSize: 16, color: '#9CA3AF', marginTop: 4 }}>Tap + to add a task to this list</Text>
                    </View>
                  )
                }
              />
            )}

            {/* ── CALENDAR (placeholder) ─────────────────────────────────────── */}
            {activeTab === 'calendar' && !activeList && (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                <View style={{ paddingVertical: 48, alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 16 }}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>📅</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB' }}>Calendar View</Text>
                  <Text style={{ fontSize: 16, color: '#9CA3AF', marginTop: 4 }}>Coming soon</Text>
                </View>
              </ScrollView>
            )}

            {/* ── NEXT 7 ─────────────────────────────────────────────────────── */}
            {activeTab === 'next7' && !activeList && (
              <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refetchAll} />}>
                {next7Groups.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 64 }}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>📅</Text>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#E5E7EB' }}>Nothing scheduled</Text>
                    <Text style={{ fontSize: 16, color: '#9CA3AF', marginTop: 4 }}>No tasks in the next 7 days</Text>
                  </View>
                ) : (
                  next7Groups.map(({ date, tasks }) => (
                    <View key={date} style={{ marginBottom: 8 }}>
                      <View style={{ paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#2A2A2A' }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {date === today ? '📌 Today' : formatDate(date)}
                        </Text>
                      </View>
                      {tasks.map(t => <TaskRow key={t.id} task={t} onDelete={deleteMut.mutate} onEdit={setEditTask} />)}
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </>
        )}
      </View>

      {/* Bottom Nav */}
      <SubNav active={activeTab} onSelect={handleTabSelect} onMore={() => setShowMore(true)} />

      {/* FAB */}
      <TouchableOpacity onPress={() => setShowAdd(true)}
        style={{ position: 'absolute', bottom: 72, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', shadowColor: ACCENT, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 }}>
        <Plus size={26} color="white" />
      </TouchableOpacity>

      {/* Modals */}
      <MoreSheet visible={showMore} active={activeTab} onSelect={setActiveTab} onClose={() => setShowMore(false)} />

      {/* Add Task */}
      <TaskModal
        visible={showAdd}
        lists={lists}
        onClose={() => setShowAdd(false)}
        onSave={data => {
          createMut.mutate({
            title:    data.title!,
            priority: data.priority,
            dueDate:  data.dueDate,
            dueTime:  data.dueTime,
            listId:   data.listId ?? (activeList?.id || undefined),
            tags:     data.tags,
          });
        }}
      />

      {/* Edit Task */}
      <TaskModal
        visible={!!editTask}
        initial={editTask}
        lists={lists}
        onClose={() => setEditTask(null)}
        onSave={data => { handleUpdateTask(data); setEditTask(null); }}
        onDelete={handleDeleteTask}
      />

      {/* Create List */}
      <ListModal
        visible={showCreateList}
        onClose={() => setShowCreateList(false)}
        onSave={data => createListMut.mutate(data)}
      />

      {/* Edit List */}
      <ListModal
        visible={!!editList}
        initial={editList}
        onClose={() => setEditList(null)}
        onSave={data => { if (editList) updateListMut.mutate({ id: editList.id, data }); }}
      />
    </SafeAreaView>
  );
}
