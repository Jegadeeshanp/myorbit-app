'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from '@/components/Toast';

type Countdown = { id: string; name: string; iconEmoji?: string; targetDate: string; direction: string };

const CARD: React.CSSProperties = { background: 'linear-gradient(145deg,#131c2e,#0e1420)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' };
const TXT = '#e4eaf4'; const MUTED = '#8fa3b8'; const DIM = '#3d5166';
const inputStyle: React.CSSProperties = { width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: TXT, padding: '10px 14px', fontSize: 13, outline: 'none', boxSizing: 'border-box' };

function getDaysDiff(targetDate: string, direction: string): number {
  const now    = new Date();
  const target = new Date(targetDate + 'T00:00:00');
  const diffMs = direction === 'until' ? target.getTime() - now.getTime() : now.getTime() - target.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function AddCountdownModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Countdown) => void }) {
  const [name, setName]           = useState('');
  const [emoji, setEmoji]         = useState('🎯');
  const [targetDate, setTargetDate] = useState('');
  const [direction, setDirection] = useState('until');
  const [saving, setSaving]       = useState(false);

  const EMOJIS = ['🎯', '🎂', '✈️', '🎓', '💍', '🏆', '🚀', '🌅', '🎉', '📅'];

  const handleSave = async () => {
    if (!name.trim() || !targetDate) { toast('Name and date required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/countdowns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), iconEmoji: emoji, targetDate, direction }),
      });
      if (!res.ok) throw new Error();
      const c = await res.json();
      toast('Countdown created');
      onCreated(c);
    } catch {
      toast('Failed to create', 'error');
    } finally {
      setSaving(false);
    }
  };

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div style={{ background: '#0e1420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, overflow: 'hidden', width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: TXT }}>New Countdown</p>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} placeholder="e.g. Birthday, Trip to Japan..." value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{ fontSize: 20, padding: 8, borderRadius: 10, cursor: 'pointer', border: emoji === e ? '2px solid #5BE4FF' : '1px solid rgba(255,255,255,0.07)', background: emoji === e ? 'rgba(91,228,255,0.12)' : 'rgba(255,255,255,0.04)' }}>{e}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Target Date</label>
            <input type="date" style={inputStyle} value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Direction</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: 'until', l: 'Counting down until' }, { v: 'since', l: 'Counting up since' }].map(({ v, l }) => (
                <button key={v} onClick={() => setDirection(v)} style={{ flex: 1, borderRadius: 12, padding: '8px', fontSize: 11, fontWeight: 500, cursor: 'pointer', border: direction === v ? '1px solid #5BE4FF' : '1px solid rgba(255,255,255,0.08)', background: direction === v ? 'rgba(91,228,255,0.12)' : 'rgba(255,255,255,0.04)', color: direction === v ? '#5BE4FF' : MUTED }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'none', padding: '10px', fontSize: 13, fontWeight: 500, color: MUTED, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, borderRadius: 12, border: 'none', background: '#5BE4FF', padding: '10px', fontSize: 13, fontWeight: 600, color: '#000', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CountdownCards() {
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [now, setNow]               = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const fetchCountdowns = useCallback(() => {
    fetch('/api/countdowns')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCountdowns(d); })
      .catch(() => toast('Failed to load countdowns', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCountdowns(); }, [fetchCountdowns]);

  const deleteCountdown = async (id: string) => {
    try {
      await fetch(`/api/countdowns/${id}`, { method: 'DELETE' });
      setCountdowns(prev => prev.filter(c => c.id !== id));
      toast('Removed');
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  void now;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: TXT, fontFamily: 'Georgia,serif' }}>Countdowns</h2>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>Track important dates</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, background: '#5BE4FF', border: 'none', padding: '8px 16px', fontSize: 12, fontWeight: 600, color: '#000', cursor: 'pointer' }}>
          <Plus size={13} /> Add
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="animate-pulse" style={{ height: 112, borderRadius: 16, background: 'rgba(255,255,255,0.04)' }} />)}
        </div>
      ) : countdowns.length === 0 ? (
        <div style={{ ...CARD, padding: '48px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>🗓️</p>
          <p style={{ fontWeight: 600, color: TXT, fontSize: 14 }}>No countdowns</p>
          <p style={{ fontSize: 12, color: DIM, marginTop: 4 }}>Track events, deadlines, and milestones</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {countdowns.map(c => {
            const days = getDaysDiff(c.targetDate, c.direction);
            const isPast = days < 0;
            const accentColor = isPast ? MUTED : days <= 7 ? '#FF6B6B' : '#5BE4FF';
            const borderColor = isPast ? 'rgba(255,255,255,0.07)' : days <= 7 ? 'rgba(255,107,107,0.25)' : 'rgba(91,228,255,0.2)';
            const bgColor = isPast ? 'linear-gradient(145deg,#131c2e,#0e1420)' : days <= 7 ? 'linear-gradient(145deg,rgba(255,107,107,0.08),rgba(255,107,107,0.03))' : 'linear-gradient(145deg,rgba(91,228,255,0.07),rgba(91,228,255,0.02))';

            return (
              <div key={c.id} style={{ position: 'relative', borderRadius: 16, border: `1px solid ${borderColor}`, background: bgColor, padding: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' }}
                className="group">
                <button onClick={() => deleteCountdown(c.id)} style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, opacity: 0, transition: 'opacity 0.2s' }}
                  className="group-hover:opacity-100">
                  <X size={12} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>{c.iconEmoji || '🎯'}</span>
                  <p style={{ fontWeight: 600, color: TXT, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                </div>
                <p style={{ fontSize: 32, fontWeight: 700, color: accentColor, fontFamily: 'Georgia,serif', lineHeight: 1 }}>{Math.abs(days)}</p>
                <p style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>
                  {c.direction === 'until' ? (isPast ? 'days ago' : 'days until') : (isPast ? 'days since (future?)' : `days since ${c.targetDate}`)}
                </p>
                <p style={{ fontSize: 10, color: DIM, marginTop: 2 }}>{c.targetDate}</p>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <AddCountdownModal
          onClose={() => setShowModal(false)}
          onCreated={c => { setCountdowns(prev => [...prev, c]); setShowModal(false); }}
        />
      )}
    </div>
  );
}
