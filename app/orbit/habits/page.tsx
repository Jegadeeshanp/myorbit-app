'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Flame, CheckCircle2, X, Trash2, ChevronLeft, ChevronRight, Clock, Pencil } from 'lucide-react';
import { toast } from '@/components/Toast';
import Confetti from '@/components/Confetti';

type Habit = {
  id: string;
  name: string;
  color: string;
  iconEmoji: string;
  goalPerDay: number;
  isCountBased: boolean;
  daysOfWeek: string;
  sortOrder: number;
  isActive: boolean;
  timeOfDay: string | null;
  customTime: string | null;
  logs: { logDate: string; value: number }[];
};

const CARD: React.CSSProperties = { background: 'linear-gradient(145deg,#131c2e,#0e1420)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' };
const TXT   = '#e4eaf4';
const MUTED = '#8fa3b8';
const DIM   = '#3d5166';
const DARK_AMBER = '#F9A44A';

const COLORS = ['#78716C', '#6B7280', '#7C3AED', '#2563EB', '#059669', '#D97706', '#DB2777', '#4F46E5', '#EF4444', '#EC4899', '#F97316', '#14B8A6'];
const EMOJIS = [
  '✅', '🔥', '💪', '📚', '🧘', '🏃', '💧', '🥗', '😴', '🎯', '✍️', '🎵',
  '🎨', '🏋️', '☕', '🚶', '🧠', '💊', '🌅', '🛌', '🌿', '❤️', '⭐', '🎓',
  '💼', '🏊', '🚴', '🧹', '🪴', '🎮', '📝', '🌞', '💰', '🙏', '🎸', '📱',
  '🌊', '🍎', '🏆', '⚡', '🦋', '🌈', '🧘‍♀️', '🍷', '🐾', '🎬', '🏠', '✈️',
];

// Days of week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const WEEK_DAYS = [
  { label: 'Su', value: 0, full: 'Sun' },
  { label: 'M',  value: 1, full: 'Mon' },
  { label: 'Tu', value: 2, full: 'Tue' },
  { label: 'W',  value: 3, full: 'Wed' },
  { label: 'Th', value: 4, full: 'Thu' },
  { label: 'F',  value: 5, full: 'Fri' },
  { label: 'Sa', value: 6, full: 'Sat' },
];

// Map timeOfDay → 24-hour time string for task creation
const TIME_OF_DAY_TO_HOUR: Record<string, string> = {
  morning: '09:00',
  noon: '12:00',
  evening: '16:00',
  night: '20:00',
};

const TIME_OF_DAY_OPTIONS = [
  { value: 'all_day', label: 'All Day', time: '' },
  { value: 'morning', label: 'Morning', time: '9:00 AM' },
  { value: 'noon', label: 'Noon', time: '12:00 PM' },
  { value: 'evening', label: 'Evening', time: '4:00 PM' },
  { value: 'night', label: 'Night', time: '8:00 PM' },
  { value: 'custom', label: 'Custom', time: '' },
];

const TIME_OF_DAY_ORDER = ['all_day', 'morning', 'noon', 'evening', 'night', 'custom'];

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTodayString() {
  return localDateStr(new Date());
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return localDateStr(d);
  });
}

function getStreakCount(logs: { logDate: string }[]): number {
  const logSet = new Set(logs.map(l => l.logDate));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (logSet.has(localDateStr(d))) streak++;
    else break;
  }
  return streak;
}

function formatCustomTime(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function getDisplayTime(habit: Habit): string {
  const tod = habit.timeOfDay || 'all_day';
  if (tod === 'custom') return habit.customTime ? formatCustomTime(habit.customTime) : '';
  const option = TIME_OF_DAY_OPTIONS.find(o => o.value === tod);
  return option?.time || '';
}

// ── Calendar helpers ────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0=Sun, returns Mon-based (0=Mon)
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

function getDaysInYear(year: number): number {
  return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getWeekDays(weekOffset = 0): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return localDateStr(d);
  });
}

type CalendarDayStatus = 'all' | 'some' | 'none';

function getDayStatus(date: string, habits: Habit[]): CalendarDayStatus {
  const activeHabits = habits.filter(h => h.isActive);
  if (activeHabits.length === 0) return 'none';
  const done = activeHabits.filter(h => h.logs.some(l => l.logDate === date)).length;
  if (done === 0) return 'none';
  if (done === activeHabits.length) return 'all';
  return 'some';
}

function getDayStatusColor(status: CalendarDayStatus): string {
  if (status === 'all') return 'bg-emerald-500';
  if (status === 'some') return 'bg-amber-400';
  return 'bg-gray-200 dark:bg-[#1a2a3a]';
}

// ── Add Habit Modal ─────────────────────────────────────────────────────────
function AddHabitModal({ onClose, onCreated }: { onClose: () => void; onCreated: (h: Habit) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[4]); // emerald default
  const [emoji, setEmoji] = useState('✅');
  const [timeOfDay, setTimeOfDay] = useState('all_day');
  const [customTime, setCustomTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // all days by default
  const [addToTask, setAddToTask] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev; // must keep at least 1 day
        return prev.filter(d => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const handleSave = async () => {
    if (!name.trim()) { toast('Habit name is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          color,
          iconEmoji: emoji,
          timeOfDay,
          customTime: timeOfDay === 'custom' ? customTime : null,
          daysOfWeek: selectedDays,
        }),
      });
      if (!res.ok) throw new Error();
      const habit: Habit = await res.json();

      if (addToTask) {
        try {
          // Find or create the "Habit" task list
          const listsRes = await fetch('/api/task-lists');
          const lists = listsRes.ok ? await listsRes.json() : [];
          let habitListId: string | null = null;
          const existing = Array.isArray(lists) ? lists.find((l: any) => l.name === 'Habit') : null;
          if (existing) {
            habitListId = existing.id;
          } else {
            const createRes = await fetch('/api/task-lists', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: 'Habit', emoji: '🔥', color: '#F59E0B' }),
            });
            if (createRes.ok) {
              const newList = await createRes.json();
              habitListId = newList.id;
            }
          }
          if (habitListId) {
            // Derive dueTime from timeOfDay
            const dueTime = timeOfDay === 'custom' ? customTime : (TIME_OF_DAY_TO_HOUR[timeOfDay] ?? null);
            await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: name.trim(),
                dueDate: getTodayString(),
                dueTime: dueTime || null,
                tags: [`habit:${habit.id}`],
                listId: habitListId,
                repeat: 'daily',
              }),
            });
          }
        } catch {
          // Task creation failed silently — habit was still created
        }
      }

      toast('Habit created!');
      onCreated(habit);
    } catch {
      toast('Failed to create habit', 'error');
    } finally {
      setSaving(false);
    }
  };

  const modalCard: React.CSSProperties = { background: '#0e1420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, overflow: 'hidden', width: '100%', maxWidth: 400 };
  const inputStyle: React.CSSProperties = { width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: TXT, padding: '10px 14px', fontSize: 13, outline: 'none' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div style={modalCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: TXT }}>New Habit</p>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '65vh', overflowY: 'auto' }}>
          <div>
            <label style={labelStyle}>Habit Name *</label>
            <input autoFocus style={inputStyle} placeholder="e.g. Morning run, Read 30 min..."
              value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} />
          </div>

          <div>
            <label style={labelStyle}>Icon</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 6, maxHeight: 144, overflowY: 'auto' }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{ height: 36, width: 36, borderRadius: 10, fontSize: 16, cursor: 'pointer', border: emoji === e ? '2px solid #F9A44A' : '1px solid rgba(255,255,255,0.07)', background: emoji === e ? 'rgba(249,164,74,0.15)' : 'rgba(255,255,255,0.04)' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: c, border: color === c ? '3px solid rgba(255,255,255,0.7)' : '2px solid transparent', cursor: 'pointer', transform: color === c ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s' }} />
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Time of Day</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {TIME_OF_DAY_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setTimeOfDay(opt.value)} style={{ borderRadius: 10, padding: '8px 6px', fontSize: 11, fontWeight: 500, cursor: 'pointer', border: timeOfDay === opt.value ? '1px solid #F9A44A' : '1px solid rgba(255,255,255,0.08)', background: timeOfDay === opt.value ? 'rgba(249,164,74,0.15)' : 'rgba(255,255,255,0.04)', color: timeOfDay === opt.value ? DARK_AMBER : MUTED, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span>{opt.label}</span>
                  {opt.time && <span style={{ fontSize: 9, opacity: 0.7 }}>{opt.time}</span>}
                </button>
              ))}
            </div>
            {timeOfDay === 'custom' && (
              <div style={{ marginTop: 8 }}>
                <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)} style={inputStyle} />
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Days of Week <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: DIM }}>({selectedDays.length}×/week)</span></label>
            <div style={{ display: 'flex', gap: 5 }}>
              {WEEK_DAYS.map(({ label, value }) => (
                <button key={value} type="button" onClick={() => toggleDay(value)} style={{ flex: 1, height: 34, borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: selectedDays.includes(value) ? '1px solid #F9A44A' : '1px solid rgba(255,255,255,0.08)', background: selectedDays.includes(value) ? '#F9A44A' : 'rgba(255,255,255,0.04)', color: selectedDays.includes(value) ? '#000' : DIM }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', padding: '12px 14px' }}>
            <input id="add-to-task" type="checkbox" checked={addToTask} onChange={e => setAddToTask(e.target.checked)} style={{ accentColor: '#F9A44A', cursor: 'pointer', width: 15, height: 15 }} />
            <label htmlFor="add-to-task" style={{ fontSize: 12, color: MUTED, cursor: 'pointer' }}>Also add as a task for today</label>
          </div>
        </div>

        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'none', padding: '10px', fontSize: 13, fontWeight: 500, color: MUTED, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, borderRadius: 12, border: 'none', background: '#F9A44A', padding: '10px', fontSize: 13, fontWeight: 600, color: '#000', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>{saving ? 'Saving...' : 'Create Habit'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Habit Modal ─────────────────────────────────────────────────────────
function EditHabitModal({ habit, onClose, onUpdated }: { habit: Habit; onClose: () => void; onUpdated: (h: Habit) => void }) {
  const [name, setName] = useState(habit.name);
  const [color, setColor] = useState(habit.color);
  const [emoji, setEmoji] = useState(habit.iconEmoji);
  const [timeOfDay, setTimeOfDay] = useState(habit.timeOfDay || 'all_day');
  const [customTime, setCustomTime] = useState(habit.customTime || '09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    try {
      const parsed = JSON.parse(habit.daysOfWeek || '[0,1,2,3,4,5,6]');
      return Array.isArray(parsed) ? parsed : [0,1,2,3,4,5,6];
    } catch { return [0,1,2,3,4,5,6]; }
  });
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const handleSave = async () => {
    if (!name.trim()) { toast('Habit name is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/habits/${habit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          color,
          iconEmoji: emoji,
          timeOfDay,
          customTime: timeOfDay === 'custom' ? customTime : null,
          daysOfWeek: selectedDays,
        }),
      });
      if (!res.ok) throw new Error();
      const updated: Habit = await res.json();
      toast('Habit updated!');
      onUpdated(updated);
    } catch {
      toast('Failed to update habit', 'error');
    } finally {
      setSaving(false);
    }
  };

  const modalCard: React.CSSProperties = { background: '#0e1420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, overflow: 'hidden', width: '100%', maxWidth: 400 };
  const inputStyle: React.CSSProperties = { width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: TXT, padding: '10px 14px', fontSize: 13, outline: 'none' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div style={modalCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: TXT }}>Edit Habit</p>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '65vh', overflowY: 'auto' }}>
          <div>
            <label style={labelStyle}>Habit Name *</label>
            <input autoFocus style={inputStyle} placeholder="e.g. Morning run, Read 30 min..."
              value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} />
          </div>

          <div>
            <label style={labelStyle}>Icon</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 6, maxHeight: 144, overflowY: 'auto' }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{ height: 36, width: 36, borderRadius: 10, fontSize: 16, cursor: 'pointer', border: emoji === e ? '2px solid #F9A44A' : '1px solid rgba(255,255,255,0.07)', background: emoji === e ? 'rgba(249,164,74,0.15)' : 'rgba(255,255,255,0.04)' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: c, border: color === c ? '3px solid rgba(255,255,255,0.7)' : '2px solid transparent', cursor: 'pointer', transform: color === c ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s' }} />
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Time of Day</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {TIME_OF_DAY_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setTimeOfDay(opt.value)} style={{ borderRadius: 10, padding: '8px 6px', fontSize: 11, fontWeight: 500, cursor: 'pointer', border: timeOfDay === opt.value ? '1px solid #F9A44A' : '1px solid rgba(255,255,255,0.08)', background: timeOfDay === opt.value ? 'rgba(249,164,74,0.15)' : 'rgba(255,255,255,0.04)', color: timeOfDay === opt.value ? DARK_AMBER : MUTED, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span>{opt.label}</span>
                  {opt.time && <span style={{ fontSize: 9, opacity: 0.7 }}>{opt.time}</span>}
                </button>
              ))}
            </div>
            {timeOfDay === 'custom' && (
              <div style={{ marginTop: 8 }}>
                <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)} style={inputStyle} />
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Days of Week <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: DIM }}>({selectedDays.length}×/week)</span></label>
            <div style={{ display: 'flex', gap: 5 }}>
              {WEEK_DAYS.map(({ label, value }) => (
                <button key={value} type="button" onClick={() => toggleDay(value)} style={{ flex: 1, height: 34, borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: selectedDays.includes(value) ? '1px solid #F9A44A' : '1px solid rgba(255,255,255,0.08)', background: selectedDays.includes(value) ? '#F9A44A' : 'rgba(255,255,255,0.04)', color: selectedDays.includes(value) ? '#000' : DIM }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'none', padding: '10px', fontSize: 13, fontWeight: 500, color: MUTED, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, borderRadius: 12, border: 'none', background: '#F9A44A', padding: '10px', fontSize: 13, fontWeight: 600, color: '#000', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Day Popup ───────────────────────────────────────────────────────────────
function DayPopup({ date, habits, onClose }: { date: string; habits: Habit[]; onClose: () => void }) {
  const [d, m, y] = (() => {
    const dt = new Date(date + 'T12:00:00');
    return [dt.getDate(), dt.toLocaleString('default', { month: 'long' }), dt.getFullYear()];
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div style={{ background: '#0e1420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, overflow: 'hidden', width: '100%', maxWidth: 320 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontWeight: 600, fontSize: 13, color: TXT }}>{m} {d}, {y}</p>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} />
          </button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 288, overflowY: 'auto' }}>
          {habits.map(h => {
            const done = h.logs.some(l => l.logDate === date);
            return (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>{h.iconEmoji}</span>
                <span style={{ flex: 1, fontSize: 12, color: MUTED }}>{h.name}</span>
                <span style={{ fontSize: 13, color: done ? '#00E5A0' : DIM }}>{done ? '✅' : '⬜'}</span>
              </div>
            );
          })}
          {habits.length === 0 && (
            <p style={{ fontSize: 12, color: DIM, textAlign: 'center', padding: '8px 0' }}>No habits tracked yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Week View ───────────────────────────────────────────────────────────────
function WeekView({ habits }: { habits: Habit[] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const today = getTodayString();
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const navBtn: React.CSSProperties = { width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: MUTED }}>
          {new Date(days[0] + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })} –{' '}
          {new Date(days[6] + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setWeekOffset(o => o - 1)} style={navBtn}><ChevronLeft size={14} /></button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} style={{ padding: '3px 10px', fontSize: 10, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: MUTED, cursor: 'pointer' }}>Today</button>
          )}
          <button onClick={() => setWeekOffset(o => o + 1)} disabled={weekOffset >= 0} style={{ ...navBtn, opacity: weekOffset >= 0 ? 0.3 : 1 }}><ChevronRight size={14} /></button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingBottom: 8, paddingRight: 12, color: DIM, fontWeight: 500, width: 112 }}>Habit</th>
              {days.map((d, i) => {
                const isToday = d === today;
                const dt = new Date(d + 'T12:00:00');
                return (
                  <th key={d} style={{ textAlign: 'center', paddingBottom: 8, paddingLeft: 4, paddingRight: 4, fontWeight: 500, minWidth: 36, color: isToday ? DARK_AMBER : DIM }}>
                    <div>{DAY_LABELS[i]}</div>
                    <div style={{ fontSize: 10, fontWeight: isToday ? 700 : 400, opacity: isToday ? 1 : 0.7 }}>{dt.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {habits.map(h => {
              const logSet = new Set(h.logs.map(l => l.logDate));
              return (
                <tr key={h.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 12px 8px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 112 }}>
                    <span style={{ marginRight: 4 }}>{h.iconEmoji}</span>
                    <span style={{ color: MUTED }}>{h.name}</span>
                  </td>
                  {days.map(d => {
                    const done = logSet.has(d);
                    return (
                      <td key={d} style={{ textAlign: 'center', padding: '8px 4px' }}>
                        <div style={{ margin: '0 auto', width: 20, height: 20, borderRadius: '50%', background: done ? h.color : 'rgba(255,255,255,0.05)' }} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {habits.length === 0 && (
          <p style={{ fontSize: 12, color: DIM, textAlign: 'center', padding: '16px 0' }}>No habits to display</p>
        )}
      </div>
    </div>
  );
}

// ── Month View ──────────────────────────────────────────────────────────────
function MonthView({ habits }: { habits: Habit[] }) {
  const [offset, setOffset] = useState(0);
  const [popupDate, setPopupDate] = useState<string | null>(null);
  const today = getTodayString();
  const now = new Date();
  const year = new Date(now.getFullYear(), now.getMonth() + offset, 1).getFullYear();
  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1).getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => dateStr(year, month, i + 1)),
  ];

  const navBtn: React.CSSProperties = { width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const statusDot = (status: CalendarDayStatus) => {
    if (status === 'all') return '#00E5A0';
    if (status === 'some') return DARK_AMBER;
    return 'rgba(255,255,255,0.08)';
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: MUTED }}>{monthLabel}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setOffset(o => o - 1)} style={navBtn}><ChevronLeft size={14} /></button>
          {offset !== 0 && (
            <button onClick={() => setOffset(0)} style={{ padding: '3px 10px', fontSize: 10, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: MUTED, cursor: 'pointer' }}>Today</button>
          )}
          <button onClick={() => setOffset(o => o + 1)} disabled={offset >= 0} style={{ ...navBtn, opacity: offset >= 0 ? 0.3 : 1 }}><ChevronRight size={14} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {DAY_LABELS.map(l => (
          <div key={l} style={{ textAlign: 'center', fontSize: 10, fontWeight: 500, color: DIM, paddingBottom: 4 }}>{l}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />;
          const status = getDayStatus(d, habits);
          const isToday = d === today;
          const isFuture = d > today;
          return (
            <button key={d} onClick={() => !isFuture && setPopupDate(d)} disabled={isFuture}
              style={{ aspectRatio: '1', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: isFuture ? 'default' : 'pointer', opacity: isFuture ? 0.3 : 1, border: isToday ? `2px solid ${DARK_AMBER}` : '2px solid transparent', background: 'transparent' }}>
              <span style={{ fontSize: 11, color: isToday ? DARK_AMBER : MUTED, fontWeight: isToday ? 700 : 400 }}>
                {new Date(d + 'T12:00:00').getDate()}
              </span>
              {!isFuture && <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusDot(status) }} />}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00E5A0' }} /><span style={{ fontSize: 10, color: MUTED }}>All done</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: DARK_AMBER }} /><span style={{ fontSize: 10, color: MUTED }}>Some done</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} /><span style={{ fontSize: 10, color: MUTED }}>None</span></div>
      </div>

      {popupDate && <DayPopup date={popupDate} habits={habits} onClose={() => setPopupDate(null)} />}
    </div>
  );
}

// ── Year View ───────────────────────────────────────────────────────────────
function YearView({ habits }: { habits: Habit[] }) {
  const [yearOffset, setYearOffset] = useState(0);
  const [popupDate, setPopupDate] = useState<string | null>(null);
  const today = getTodayString();
  const currentYear = new Date().getFullYear() + yearOffset;
  const totalDays = getDaysInYear(currentYear);

  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(currentYear, 0, i + 1);
      return localDateStr(d);
    });
  }, [currentYear, totalDays]);

  const jan1DayOfWeek = useMemo(() => {
    const day = new Date(currentYear, 0, 1).getDay();
    return (day + 6) % 7; // Mon=0
  }, [currentYear]);

  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Build weeks (columns)
  const paddedDays: (string | null)[] = [
    ...Array(jan1DayOfWeek).fill(null),
    ...days,
  ];
  const numWeeks = Math.ceil(paddedDays.length / 7);
  const weeks: (string | null)[][] = Array.from({ length: numWeeks }, (_, wi) =>
    paddedDays.slice(wi * 7, wi * 7 + 7)
  );

  // Month label positions (week index where month starts)
  const monthPositions = MONTH_LABELS.map((_, mi) => {
    const firstOfMonth = localDateStr(new Date(currentYear, mi, 1));
    const dayIndex = days.indexOf(firstOfMonth);
    if (dayIndex < 0) return { label: MONTH_LABELS[mi], col: 0 };
    const col = Math.floor((dayIndex + jan1DayOfWeek) / 7);
    return { label: MONTH_LABELS[mi], col };
  });

  const navBtn: React.CSSProperties = { width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const dotColor = (status: CalendarDayStatus) => status === 'all' ? '#00E5A0' : status === 'some' ? DARK_AMBER : 'rgba(255,255,255,0.08)';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: MUTED }}>{currentYear}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setYearOffset(o => o - 1)} style={navBtn}><ChevronLeft size={14} /></button>
          {yearOffset !== 0 && (
            <button onClick={() => setYearOffset(0)} style={{ padding: '3px 10px', fontSize: 10, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: MUTED, cursor: 'pointer' }}>This Year</button>
          )}
          <button onClick={() => setYearOffset(o => o + 1)} disabled={yearOffset >= 0} style={{ ...navBtn, opacity: yearOffset >= 0 ? 0.3 : 1 }}><ChevronRight size={14} /></button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 'max-content' }}>
          <div style={{ display: 'flex', marginBottom: 4, paddingLeft: 14 }}>
            {weeks.map((_, wi) => {
              const mp = monthPositions.find(m => m.col === wi);
              return (
                <div key={wi} style={{ width: 13, marginRight: 2, fontSize: 9, color: DIM, fontWeight: 500, lineHeight: 1 }}>
                  {mp ? mp.label : ''}
                </div>
              );
            })}
          </div>

          {Array.from({ length: 7 }, (_, row) => (
            <div key={row} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
              <div style={{ width: 12, marginRight: 2, fontSize: 8, color: DIM, lineHeight: 1 }}>
                {row % 2 === 0 ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][row] : ''}
              </div>
              {weeks.map((week, wi) => {
                const d = week[row];
                if (!d) return <div key={wi} style={{ width: 11, height: 11, marginRight: 2 }} />;
                const isFuture = d > today;
                const status = isFuture ? 'none' as CalendarDayStatus : getDayStatus(d, habits);
                const isToday = d === today;
                return (
                  <button key={wi} onClick={() => !isFuture && setPopupDate(d)} disabled={isFuture} title={d}
                    style={{ width: 11, height: 11, marginRight: 2, borderRadius: 2, background: dotColor(status), opacity: isFuture ? 0.3 : 1, cursor: isFuture ? 'default' : 'pointer', border: isToday ? `1px solid ${DARK_AMBER}` : '1px solid transparent' }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#00E5A0' }} /><span style={{ fontSize: 10, color: MUTED }}>All done</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: DARK_AMBER }} /><span style={{ fontSize: 10, color: MUTED }}>Some done</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }} /><span style={{ fontSize: 10, color: MUTED }}>None</span></div>
      </div>

      {popupDate && <DayPopup date={popupDate} habits={habits} onClose={() => setPopupDate(null)} />}
    </div>
  );
}

// ── Calendar Section ────────────────────────────────────────────────────────
function CalendarSection({ habits }: { habits: Habit[] }) {
  const [view, setView] = useState<'week' | 'month' | 'year'>('week');

  return (
    <div style={{ ...CARD, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: TXT }}>Habit Calendar</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3 }}>
          {(['week', 'month', 'year'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: 'none', background: view === v ? 'rgba(255,255,255,0.1)' : 'transparent', color: view === v ? TXT : DIM }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {view === 'week' && <WeekView habits={habits} />}
      {view === 'month' && <MonthView habits={habits} />}
      {view === 'year' && <YearView habits={habits} />}
    </div>
  );
}

// ── Today's Habits by Time ──────────────────────────────────────────────────
function TodayHabitsSection({ habits, today, onLog }: {
  habits: Habit[];
  today: string;
  onLog: (id: string, date: string) => void;
}) {
  // Group by timeOfDay, preserving order
  const groups = useMemo(() => {
    const grouped: Record<string, Habit[]> = {};
    for (const h of habits) {
      let key = h.timeOfDay || 'all_day';
      // Backward compat: 'all' was an old value before 'all_day'
      if (key === 'all') key = 'all_day';
      // Custom time: bucket into morning/noon/evening/night based on hour
      if (key === 'custom') {
        if (h.customTime) {
          const hour = parseInt(h.customTime.split(':')[0], 10);
          if (hour >= 5 && hour < 12) key = 'morning';
          else if (hour >= 12 && hour < 15) key = 'noon';
          else if (hour >= 15 && hour < 20) key = 'evening';
          else key = 'night';
        } else {
          key = 'all_day';
        }
      }
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(h);
    }
    return TIME_OF_DAY_ORDER
      .filter(k => grouped[k] && grouped[k].length > 0)
      .map(k => ({ key: k, habits: grouped[k] }));
  }, [habits]);

  if (groups.length === 0) return null;

  const groupLabel = (key: string): string => {
    const opt = TIME_OF_DAY_OPTIONS.find(o => o.value === key);
    return opt ? opt.label : key;
  };

  return (
    <div style={{ ...CARD, padding: '18px 20px' }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 16 }}>Today's Habits</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groups.map(({ key, habits: groupHabits }) => (
          <div key={key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              {key !== 'all_day' && <Clock size={12} color={DIM} />}
              <span style={{ fontSize: 10, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {groupLabel(key)}
                {key !== 'all_day' && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>({TIME_OF_DAY_OPTIONS.find(o => o.value === key)?.time})</span>}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {groupHabits.map(h => {
                const done = h.logs.some(l => l.logDate === today);
                const displayTime = getDisplayTime(h);
                return (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 18 }}>{h.iconEmoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: done ? 'line-through' : 'none', color: done ? DIM : TXT }}>
                        {h.name}
                      </p>
                      {displayTime && <p style={{ fontSize: 10, color: DIM, marginTop: 2 }}>{displayTime}</p>}
                    </div>
                    <button onClick={() => onLog(h.id, today)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? h.color : 'rgba(255,255,255,0.07)', color: done ? '#fff' : MUTED, flexShrink: 0 }}>
                      <CheckCircle2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Habit Card ──────────────────────────────────────────────────────────────
function HabitCard({ habit, dates, onLog, onDelete, onEdit }: {
  habit: Habit;
  dates: string[];
  onLog: (id: string, date: string) => void;
  onDelete: (id: string) => void;
  onEdit: (h: Habit) => void;
}) {
  const logSet = new Set(habit.logs.map(l => l.logDate));
  const streak = getStreakCount(habit.logs);
  const today = dates[dates.length - 1];
  const todayDone = logSet.has(today);

  // Parse daysOfWeek — default to all 7 days if not set
  const activeDays: number[] = useMemo(() => {
    try {
      const parsed = JSON.parse(habit.daysOfWeek || '[0,1,2,3,4,5,6]');
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return [0, 1, 2, 3, 4, 5, 6];
  }, [habit.daysOfWeek]);

  // Filter last-7 days to only the habit's active days
  const activeDates = useMemo(
    () => dates.filter(d => activeDays.includes(new Date(d + 'T12:00:00').getDay())),
    [dates, activeDays],
  );

  const weekDone = activeDates.filter(d => logSet.has(d)).length;
  const weekTotal = activeDates.length;

  const dayCell = (done: boolean, isToday: boolean): React.CSSProperties => ({
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderRadius: 8, paddingTop: 6, paddingBottom: 6, cursor: 'pointer', border: isToday && !done ? '1px dashed rgba(255,255,255,0.2)' : '1px solid transparent', background: done ? habit.color : 'rgba(255,255,255,0.04)',
  });

  return (
    <div style={{ ...CARD, overflow: 'hidden' }}>
      <div style={{ height: 3, width: '100%', backgroundColor: habit.color }} />
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{habit.iconEmoji}</span>
            <div>
              <p style={{ fontWeight: 600, color: TXT, fontSize: 13 }}>{habit.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Flame size={11} color={DARK_AMBER} />
                <span style={{ fontSize: 10, color: MUTED }}>{streak} day streak</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => onLog(habit.id, today)} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: todayDone ? habit.color : 'rgba(255,255,255,0.07)', color: todayDone ? '#fff' : MUTED }}>
              <CheckCircle2 size={18} />
            </button>
            <button onClick={() => onEdit(habit)} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', color: DIM }}>
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(habit.id)} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', color: DIM }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {(activeDates.length > 0 ? activeDates : dates).map((date, i) => {
            const done = logSet.has(date);
            const isToday = activeDates.length > 0 ? date === today : i === dates.length - 1;
            const dayLabel = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'][new Date(date + 'T12:00:00').getDay()];
            return (
              <button key={date} onClick={() => onLog(habit.id, date)} style={dayCell(done, isToday)}>
                <span style={{ fontSize: 9, fontWeight: 600, color: done ? 'rgba(255,255,255,0.7)' : DIM }}>{dayLabel}</span>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)' }} />
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: DIM }}>
            {weekDone}/{weekTotal} this week
            {weekTotal < 7 && <span style={{ opacity: 0.6, marginLeft: 4 }}>({activeDays.length}×/wk)</span>}
          </span>
          <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
            <div style={{ height: '100%', borderRadius: 99, backgroundColor: habit.color, width: `${weekTotal > 0 ? (weekDone / weekTotal) * 100 : 0}%`, transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: MUTED }}>{weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0}%</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
const HABIT_TEMPLATES = [
  { name: 'Drink 8 glasses of water', iconEmoji: '💧', color: '#3B82F6' },
  { name: 'Exercise for 30 minutes',  iconEmoji: '🏃', color: '#10B981' },
  { name: 'Read for 20 minutes',      iconEmoji: '📚', color: '#8B5CF6' },
  { name: 'Meditate for 10 minutes',  iconEmoji: '🧘', color: '#F59E0B' },
  { name: 'No social media before 9am', iconEmoji: '📵', color: '#EF4444' },
];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const totalLogsRef = useRef(0);
  const dates = useMemo(() => getLast7Days(), []);
  const today = dates[dates.length - 1];

  const fetchHabits = useCallback(() => {
    fetch('/api/habits')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setHabits(d);
          totalLogsRef.current = d.reduce((s: number, h: Habit) => s + h.logs.length, 0);
        }
      })
      .catch(() => toast('Failed to load habits', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const handleLog = async (habitId: string, date: string) => {
    try {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
      const data = await res.json();
      setHabits(prev => {
        const next = prev.map(h => {
          if (h.id !== habitId) return h;
          if (data.removed) return { ...h, logs: h.logs.filter(l => l.logDate !== date) };
          const existing = h.logs.find(l => l.logDate === date);
          if (existing) return h;
          return { ...h, logs: [...h.logs, { logDate: date, value: 1 }] };
        });
        if (!data.removed) {
          const newTotal = next.reduce((s, h) => s + h.logs.length, 0);
          if (totalLogsRef.current === 0 && newTotal === 1) setShowConfetti(true);
          totalLogsRef.current = newTotal;
        }
        return next;
      });
    } catch {
      toast('Failed to log habit', 'error');
    }
  };

  const handleDelete = (habitId: string) => {
    setConfirmDeleteId(habitId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await fetch(`/api/habits/${id}`, { method: 'DELETE' });
      setHabits(prev => prev.filter(h => h.id !== id));
      toast('Habit deleted');
    } catch {
      toast('Failed to delete habit', 'error');
    }
  };

  const totalLogged = habits.filter(h => h.logs.some(l => l.logDate === today)).length;
  const totalStreaks = habits.reduce((s, h) => s + getStreakCount(h.logs), 0);
  const longestStreak = Math.max(0, ...habits.map(h => getStreakCount(h.logs)));

  const completionRate = habits.length > 0 ? totalLogged / habits.length : 0;
  const insightMessage = useMemo(() => {
    if (habits.length === 0) return null;
    if (completionRate === 1) return "🎉 Perfect day! All habits done — you're unstoppable!";
    if (completionRate >= 0.7) return '🌟 Great job! Almost there, keep the momentum!';
    if (completionRate >= 0.4) return '💪 Good start! A few more habits to go today.';
    if (completionRate > 0) return '🌱 You\'ve started! Every habit done counts.';
    return '☀️ Fresh start! Let\'s make today count.';
  }, [habits.length, completionRate]);

  return (
    <div className="space-y-6">
      <style>{`
        @media (max-width: 479px) {
          .hb-stats-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
          .hb-cards-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
        }
      `}</style>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      {insightMessage && !loading && (
        <div style={{ borderRadius: 14, border: '1px solid rgba(249,164,74,0.25)', background: 'linear-gradient(145deg,rgba(249,164,74,0.08),rgba(249,164,74,0.03))', padding: '14px 18px' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: DARK_AMBER }}>{insightMessage}</p>
        </div>
      )}

      <div style={{ ...CARD, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: TXT }}>Overview</h2>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, background: DARK_AMBER, border: 'none', padding: '7px 14px', fontSize: 11, fontWeight: 600, color: '#000', cursor: 'pointer' }}>
            <Plus size={13} /> New Habit
          </button>
        </div>
        <div className="hb-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { label: "Today's Done", value: `${totalLogged}/${habits.length}`, sub: 'habits completed' },
            { label: 'Total Streak XP', value: totalStreaks, sub: 'combined streak days' },
            { label: 'Longest Streak', value: longestStreak, sub: 'consecutive days' },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)', padding: 12 }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: TXT, fontFamily: 'Georgia,serif' }}>{value}</p>
              <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, marginTop: 2 }}>{label}</p>
              <p style={{ fontSize: 9, color: DIM }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {!loading && habits.length > 0 && (
        <TodayHabitsSection habits={habits} today={today} onLog={handleLog} />
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse" style={{ height: 176, borderRadius: 16, background: 'rgba(255,255,255,0.04)' }} />)}
        </div>
      ) : habits.length === 0 ? (
        <div style={{ ...CARD, padding: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(249,164,74,0.1)', border: '1px solid rgba(249,164,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Flame size={26} color={DARK_AMBER} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: TXT }}>No habits yet</p>
            <p style={{ fontSize: 12, color: DIM, marginTop: 4 }}>Start small — pick one habit from below, or create your own.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {HABIT_TEMPLATES.map((t) => (
              <button key={t.name} onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 20 }}>{t.iconEmoji}</span>
                <p style={{ flex: 1, fontSize: 13, fontWeight: 500, color: MUTED }}>{t.name}</p>
                <ChevronRight size={14} color={DIM} />
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, background: DARK_AMBER, border: 'none', padding: '11px', fontSize: 13, fontWeight: 600, color: '#000', cursor: 'pointer' }}>
            <Plus size={14} /> Create your own habit
          </button>
        </div>
      ) : (
        <div className="hb-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
          {habits.map(habit => (
            <HabitCard key={habit.id} habit={habit} dates={dates} onLog={handleLog} onDelete={handleDelete} onEdit={setEditingHabit} />
          ))}
        </div>
      )}

      <button onClick={() => setShowModal(true)} className="md:hidden" style={{ position: 'fixed', bottom: 152, right: 16, zIndex: 40, width: 56, height: 56, borderRadius: '50%', background: DARK_AMBER, border: 'none', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(249,164,74,0.4)' }}>
        <Plus size={22} />
      </button>

      {showModal && (
        <AddHabitModal
          onClose={() => setShowModal(false)}
          onCreated={h => { setHabits(prev => [{ ...h, logs: [] }, ...prev]); setShowModal(false); }}
        />
      )}
      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onUpdated={updated => {
            setHabits(prev => prev.map(h => h.id === updated.id ? { ...updated, logs: h.logs } : h));
            setEditingHabit(null);
          }}
        />
      )}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div style={{ background: '#0e1420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 24, maxWidth: 320, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={22} color="#FF6B6B" />
            </div>
            <p style={{ fontWeight: 600, color: TXT, fontSize: 14, marginBottom: 6 }}>Delete this habit?</p>
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>This will permanently remove the habit and all its logs. This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDeleteId(null)} style={{ flex: 1, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'none', padding: '10px', fontSize: 13, fontWeight: 500, color: MUTED, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleConfirmDelete} style={{ flex: 1, borderRadius: 12, border: 'none', background: '#FF6B6B', padding: '10px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
