'use client';

import { useState } from 'react';
import { Plus, Check, UserPlus, Trash2 } from 'lucide-react';

const PROFILES = [
  { id: 'personal', name: 'Personal', emoji: '👤', active: true },
  { id: 'family',   name: 'Family',   emoji: '👨‍👩‍👧', active: false },
  { id: 'business', name: 'Business', emoji: '💼', active: false },
];

const MEMBERS = [
  { name: 'Priya S.', email: 'priya@example.com', role: 'Editor' },
];

export default function ProfilesTab() {
  const [profiles, setProfiles] = useState(PROFILES);
  const [activeProfile, setActiveProfile] = useState('personal');
  const [members, setMembers] = useState(MEMBERS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Viewer');

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setMembers(m => [...m, { name: inviteEmail.split('@')[0], email: inviteEmail, role: inviteRole }]);
    setInviteEmail('');
  };

  return (
    <div className="space-y-5">
      {/* Profiles */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-gray-900">Profiles</h2>
        <div className="space-y-3">
          {profiles.map(p => (
            <div key={p.id} className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${activeProfile === p.id ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{p.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  {activeProfile === p.id && <p className="text-xs text-emerald-600">Active</p>}
                </div>
              </div>
              <button
                onClick={() => setActiveProfile(p.id)}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition ${activeProfile === p.id ? 'bg-emerald-600 text-white' : 'border border-gray-200 bg-white text-gray-400'}`}
              >
                {activeProfile === p.id && <Check className="h-3.5 w-3.5" />}
              </button>
            </div>
          ))}
        </div>
        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition hover:border-emerald-400 hover:text-emerald-600">
          <Plus className="h-4 w-4" /> Create profile
        </button>
      </div>

      {/* Sharing */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-gray-900">Sharing</h2>

        {/* Invite */}
        <div className="mb-5 space-y-3 rounded-xl bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">Invite a member</p>
          <input
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <div className="flex gap-2">
            {(['Viewer', 'Editor', 'Admin'] as const).map(role => (
              <button
                key={role}
                onClick={() => setInviteRole(role)}
                className={`flex-1 rounded-lg border py-2 text-xs font-medium transition ${inviteRole === role ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-600'}`}
              >
                {role}
              </button>
            ))}
          </div>
          <button onClick={handleInvite} className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
            <UserPlus className="h-4 w-4" /> Send invite
          </button>
        </div>

        {/* Members list */}
        <div className="space-y-2">
          {members.map((m, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-500">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{m.role}</span>
                <button onClick={() => setMembers(ms => ms.filter((_, j) => j !== i))} className="text-gray-400 hover:text-rose-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
