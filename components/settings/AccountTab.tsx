'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authStore';
import { Camera, Eye, EyeOff, Monitor, Smartphone } from 'lucide-react';

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

  const [name, setName] = useState(user?.name ?? '');
  const [showPass, setShowPass] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-5">
      {/* Profile */}
      <Section title="Profile">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-bold text-emerald-700">
              {name.charAt(0).toUpperCase() || '?'}
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div className="text-sm text-gray-500">Upload a profile picture</div>
        </div>
        <Field label="Display Name">
          <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Email">
          <input value={user?.email ?? ''} readOnly className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} />
        </Field>
      </Section>

      {/* Security */}
      <Section title="Security">
        <Field label="New Password">
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="Min. 6 characters"
              className={inputCls}
            />
            <button onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm Password">
          <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className={inputCls} />
        </Field>
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
            <p className="text-xs text-gray-500">Coming soon</p>
          </div>
          <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500">Soon</span>
        </div>
      </Section>

      {/* Sessions */}
      <Section title="Sessions">
        <div className="space-y-3">
          {[
            { icon: Monitor, label: 'Chrome on macOS', sub: 'Current session', active: true },
            { icon: Smartphone, label: 'Safari on iPhone', sub: 'Last seen 2 days ago', active: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <s.icon className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.label}</p>
                  <p className="text-xs text-gray-500">{s.sub}</p>
                </div>
              </div>
              {s.active && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span>}
            </div>
          ))}
        </div>
        <button onClick={onSignOut} className="w-full rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100">
          Sign out of all devices
        </button>
      </Section>

      {/* Save */}
      <button onClick={handleSave} className="w-full rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
        {saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
