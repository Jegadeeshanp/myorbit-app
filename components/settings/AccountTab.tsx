'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/authStore';
import { Camera, Eye, EyeOff, Monitor, Smartphone, Loader2 } from 'lucide-react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-base font-semibold text-gray-900">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100';

export default function AccountTab({ onSignOut }: { onSignOut: () => void }) {
  const { auth } = useAuth();
  const user = auth.status === 'authenticated' ? auth.user : null;

  const [name,        setName]        = useState(user?.name ?? '');
  useEffect(() => { if (user?.name) setName(user.name); }, [user?.name]);
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass,    setSavingPass]    = useState(false);
  const [profileMsg,  setProfileMsg]  = useState<{ ok: boolean; text: string } | null>(null);
  const [passMsg,     setPassMsg]     = useState<{ ok: boolean; text: string } | null>(null);
  const [sessions,    setSessions]    = useState<{ id: string; token: string; createdAt: string; expiresAt: string }[]>([]);
  const photoRef = useRef<HTMLInputElement>(null);

  // Load real sessions on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.sessions) setSessions(d.sessions); })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setProfileMsg({ ok: false, text: 'Name must be at least 2 characters.' });
      return;
    }
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setProfileMsg({ ok: false, text: d.error ?? 'Failed to save.' });
      } else {
        setProfileMsg({ ok: true, text: 'Profile saved!' });
        setTimeout(() => setProfileMsg(null), 2500);
      }
    } catch {
      setProfileMsg({ ok: false, text: 'Network error. Please try again.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPass.length < 8) {
      setPassMsg({ ok: false, text: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ ok: false, text: 'Passwords do not match.' });
      return;
    }
    setSavingPass(true);
    setPassMsg(null);
    try {
      const res = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPass }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setPassMsg({ ok: false, text: d.error ?? 'Failed to change password.' });
      } else {
        setPassMsg({ ok: true, text: 'Password updated successfully!' });
        setNewPass('');
        setConfirmPass('');
        setTimeout(() => setPassMsg(null), 2500);
      }
    } catch {
      setPassMsg({ ok: false, text: 'Network error. Please try again.' });
    } finally {
      setSavingPass(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileMsg({ ok: false, text: 'Photo must be under 2 MB.' });
      return;
    }
    // Avatar upload is not yet supported server-side — show informative message
    setProfileMsg({ ok: false, text: 'Avatar upload coming soon.' });
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Profile */}
      <Section title="Profile">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-bold text-emerald-700">
              {name.charAt(0).toUpperCase() || '?'}
            </div>
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow"
              title="Upload photo"
            >
              <Camera className="h-3 w-3" />
            </button>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div className="text-sm text-gray-500">Upload a profile picture (PNG/JPG, max 2 MB)</div>
        </div>
        <Field label="Display Name">
          <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Email">
          <input value={user?.email ?? ''} readOnly className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} />
        </Field>
        {profileMsg && (
          <p className={`text-sm font-medium ${profileMsg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{profileMsg.text}</p>
        )}
        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
          {savingProfile ? 'Saving…' : 'Save Profile'}
        </button>
      </Section>

      {/* Security */}
      <Section title="Security">
        <Field label="New Password">
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="Min. 8 characters"
              className={inputCls}
            />
            <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm New Password">
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="Repeat new password"
              className={`${inputCls} ${confirmPass.length > 0 ? confirmPass === newPass ? 'border-emerald-400' : 'border-rose-300' : ''}`}
            />
            <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPass.length > 0 && confirmPass !== newPass && (
            <p className="mt-1 text-xs text-rose-500">Passwords do not match</p>
          )}
        </Field>
        {passMsg && (
          <p className={`text-sm font-medium ${passMsg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{passMsg.text}</p>
        )}
        <button
          onClick={handleChangePassword}
          disabled={savingPass || !newPass}
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {savingPass && <Loader2 className="h-4 w-4 animate-spin" />}
          {savingPass ? 'Updating…' : 'Change Password'}
        </button>
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
            <p className="text-xs text-gray-500">Coming soon</p>
          </div>
          <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500">Soon</span>
        </div>
      </Section>

      {/* Sessions */}
      <Section title="Active Sessions">
        <div className="space-y-3">
          {sessions.length > 0 ? sessions.slice(0, 3).map((s, i) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                {i === 0 ? <Monitor className="h-4 w-4 text-gray-500" /> : <Smartphone className="h-4 w-4 text-gray-500" />}
                <div>
                  <p className="text-sm font-medium text-gray-900">Session {i + 1}</p>
                  <p className="text-xs text-gray-500">Started {new Date(s.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {i === 0 && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span>}
            </div>
          )) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Monitor className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Current session</p>
                  <p className="text-xs text-gray-500">This device</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <button onClick={onSignOut} className="w-full rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100">
          Sign out of all devices
        </button>
      </Section>
    </div>
  );
}
