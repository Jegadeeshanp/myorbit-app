'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Smartphone, Watch, ExternalLink, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { toast } from '@/components/Toast';

// ── Copy button ────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      className="flex-none flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 transition">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ── Expandable step section ────────────────────────────────────────────────

function StepSection({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(n === 1);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex-none">{n}</span>
          <p className="text-sm font-medium text-gray-800">{title}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400 flex-none" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-none" />}
      </button>
      {open && <div className="px-4 py-4 text-sm text-gray-600 space-y-3">{children}</div>}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function SyncPage() {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    fetch('/api/health/sync/token')
      .then(r => r.json())
      .then(d => { setToken(d.token); setUserId(d.userId); })
      .catch(() => toast('Failed to load sync token', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const webhookUrl = token && userId
    ? `${baseUrl}/api/health/sync/webhook?userId=${userId}&token=${token}`
    : '';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Health Sync</h1>
        <p className="text-sm text-gray-500 mt-0.5">Connect your health apps to automatically import steps, sleep, heart rate and more.</p>
      </div>

      {/* Your webhook URL */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-emerald-500" />
          <p className="text-sm font-semibold text-gray-900">Your Webhook URL</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">This unique URL is used by all supported apps to push data to MyOrbit. Keep it private.</p>
        {loading ? (
          <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5">
            <p className="flex-1 text-xs font-mono text-gray-600 truncate">{webhookUrl}</p>
            <CopyButton text={webhookUrl} />
          </div>
        )}
      </div>

      {/* Apple Health via Health Auto Export */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 flex-none">
            <span className="text-xl">🍎</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Apple Health</p>
            <p className="text-xs text-gray-400">via Health Auto Export app</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Supported</span>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-gray-500">
            Apple Health doesn't have a public web API, but the free{' '}
            <strong>Health Auto Export</strong> app can push your data directly to MyOrbit via webhook.
            It syncs steps, heart rate, sleep, weight, and more — automatically in the background.
          </p>

          <StepSection n={1} title="Install Health Auto Export (free)">
            <a href="https://apps.apple.com/app/health-auto-export-json-csv/id1115567069"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:underline">
              <ExternalLink className="h-3.5 w-3.5" />
              Open on App Store
            </a>
            <p className="text-xs text-gray-500">Free tier supports automatic REST API export — no paid plan needed for basic metrics.</p>
          </StepSection>

          <StepSection n={2} title="Add a new Automation → REST API">
            <ol className="space-y-1.5 text-xs text-gray-600 list-decimal list-inside">
              <li>Open the app → tap <strong>Automations</strong> → <strong>+</strong></li>
              <li>Choose <strong>REST API</strong> as the export type</li>
              <li>Paste your Webhook URL (copied above) into the <strong>URL</strong> field</li>
              <li>Set method to <strong>POST</strong></li>
            </ol>
          </StepSection>

          <StepSection n={3} title="Select metrics to sync">
            <p className="text-xs text-gray-500 mb-2">Enable these metrics in the app for best results:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {['Step Count', 'Resting Heart Rate', 'Body Mass (Weight)', 'Sleep Analysis', 'Heart Rate', 'Walking + Running Distance'].map(m => (
                <div key={m} className="flex items-center gap-1.5 text-xs text-gray-700">
                  <Check className="h-3.5 w-3.5 text-emerald-500 flex-none" />
                  {m}
                </div>
              ))}
            </div>
          </StepSection>

          <StepSection n={4} title="Set sync frequency">
            <p className="text-xs text-gray-500">
              Set <strong>Automatic Export</strong> to run hourly or daily. MyOrbit will upsert data as it arrives — no duplicates.
            </p>
          </StepSection>
        </div>
      </div>

      {/* Google Health Connect (Android) */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 flex-none">
            <span className="text-xl">🤖</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Android / Google Health Connect</p>
            <p className="text-xs text-gray-400">via Health Connect to Webhook app</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Supported</span>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-gray-500">
            Android users with Health Connect (Samsung Health, Fitbit, Garmin, etc.) can use <strong>Health Connect to Webhook</strong> to push data to MyOrbit.
          </p>

          <StepSection n={1} title="Install Health Connect to Webhook">
            <a href="https://play.google.com/store/apps/details?id=dev.juliuscanute.healthconnectwebhook"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:underline">
              <ExternalLink className="h-3.5 w-3.5" />
              Open on Google Play
            </a>
          </StepSection>

          <StepSection n={2} title="Configure the webhook URL">
            <ol className="space-y-1.5 text-xs text-gray-600 list-decimal list-inside">
              <li>Open the app → Settings → Webhook URL</li>
              <li>Paste your Webhook URL (copied above)</li>
              <li>Enable the metrics you want to sync</li>
              <li>Tap <strong>Save</strong> and run a manual sync to test</li>
            </ol>
          </StepSection>
        </div>
      </div>

      {/* Garmin / Fitbit / Withings */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 flex-none">
            <Watch className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Garmin / Fitbit / Withings / Strava</p>
            <p className="text-xs text-gray-400">via Zapier or Make webhook</p>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Via Zapier</span>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-gray-500">
            Use a free <strong>Zapier</strong> or <strong>Make</strong> (Integromat) workflow to bridge these devices with MyOrbit's webhook.
          </p>

          <StepSection n={1} title="Create a Zapier webhook zap">
            <ol className="space-y-1.5 text-xs text-gray-600 list-decimal list-inside">
              <li>Trigger: Garmin / Fitbit / Withings — "New activity" or "Daily summary"</li>
              <li>Action: <strong>Webhooks by Zapier</strong> → POST</li>
              <li>URL: paste your Webhook URL above</li>
              <li>Map fields: <code className="bg-gray-100 px-1 rounded">date</code>, <code className="bg-gray-100 px-1 rounded">steps</code>, <code className="bg-gray-100 px-1 rounded">heartRate</code>, <code className="bg-gray-100 px-1 rounded">sleepHours</code>, <code className="bg-gray-100 px-1 rounded">weightKg</code></li>
            </ol>
          </StepSection>
        </div>
      </div>

      {/* Manual JSON test */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="h-5 w-5 text-gray-400" />
          <p className="text-sm font-semibold text-gray-900">Test with a manual push</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">Run this in your terminal to test the webhook is working:</p>
        <div className="relative rounded-xl bg-gray-900 p-4 overflow-x-auto">
          <pre className="text-xs text-gray-200 whitespace-pre-wrap">{`curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"date":"${new Date().toISOString().slice(0,10)}","steps":8500,"heartRate":68,"sleepHours":7.5,"weightKg":72}'`}</pre>
          {webhookUrl && (
            <div className="absolute top-3 right-3">
              <CopyButton text={`curl -X POST "${webhookUrl}" -H "Content-Type: application/json" -d '{"date":"${new Date().toISOString().slice(0,10)}","steps":8500,"heartRate":68,"sleepHours":7.5,"weightKg":72}'`} />
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-400">A successful push returns <code className="bg-gray-100 px-1 rounded">{"{ \"ok\": true, \"upserted\": 1 }"}</code> and the data appears instantly on the Dashboard.</p>
      </div>
    </div>
  );
}
