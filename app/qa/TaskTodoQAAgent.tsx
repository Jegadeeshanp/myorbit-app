"use client";

import { useCallback, useMemo, useRef, useState } from 'react';
import type { QAAgentConfig, QACase, QACaseKind } from './taskTodoQaData';

const BASE = '';
const CREDS = { email: 'testuser@myorbit.app', password: 'Test12345' };

type Sev = 'pass' | 'fail' | 'warn' | 'info' | 'skip';

interface LogEntry {
  id: number;
  msg: string;
  sev: Sev;
  detail?: string;
  time: string;
}

interface Summary {
  authWorked: boolean;
  routesOk: number;
  apiOk: number;
  crudPass: number;
  crudFail: number;
}

interface CaseTableStyles {
  scroll: React.CSSProperties;
  empty: React.CSSProperties;
  th: React.CSSProperties;
  td: React.CSSProperties;
}

const COL: Record<Sev, { dot: string; bg: string }> = {
  pass: { dot: '#3fb950', bg: '#3fb95018' },
  fail: { dot: '#f85149', bg: '#f8514918' },
  warn: { dot: '#e3b341', bg: '#e3b34118' },
  info: { dot: '#79c0ff', bg: '#79c0ff12' },
  skip: { dot: '#8b949e', bg: '#8b949e12' },
};

async function fetchJson(path: string, opts: RequestInit = {}) {
  const start = Date.now();
  try {
    const response = await fetch(`${BASE}${path}`, {
      ...opts,
      credentials: 'include',
      redirect: 'follow',
    });
    const text = await response.clone().text().catch(() => '');
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { ok: response.ok, status: response.status, ms: Date.now() - start, body, url: response.url };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - start,
      body: error instanceof Error ? error.message : String(error),
      url: '',
    };
  }
}

async function loginWithCredentials() {
  const csrf = await fetchJson('/api/auth/csrf');
  const csrfToken =
    csrf.body && typeof csrf.body === 'object' && 'csrfToken' in csrf.body
      ? String((csrf.body as { csrfToken: string }).csrfToken)
      : '';

  if (!csrfToken) return false;

  const body = new URLSearchParams({
    csrfToken,
    email: CREDS.email,
    password: CREDS.password,
    callbackUrl: `${BASE}/orbit/tasks`,
    json: 'true',
  });

  await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    credentials: 'include',
    redirect: 'follow',
  }).catch(() => null);

  const session = await fetchJson('/api/auth/session');
  return !!(
    session.body &&
    typeof session.body === 'object' &&
    'user' in session.body &&
    (session.body as { user?: { email?: string } }).user?.email
  );
}

async function runTodoCrud(log: (msg: string, sev?: Sev, detail?: string) => void) {
  let pass = 0;
  let fail = 0;

  const listName = `QA Todo List ${Date.now()}`;
  const listRes = await fetchJson('/api/task-lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: listName }),
  });

  const listId =
    listRes.body && typeof listRes.body === 'object' && 'id' in listRes.body
      ? String((listRes.body as { id: string }).id)
      : '';

  if (listRes.status === 201 && listId) {
    pass++;
    log(`Create task list -> HTTP ${listRes.status}`, 'pass', listName);
  } else {
    fail++;
    log(`Create task list -> HTTP ${listRes.status}`, 'fail', JSON.stringify(listRes.body).slice(0, 160));
  }

  const taskRes = await fetchJson('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: `QA Todo Task ${Date.now()}`, listId: listId || null }),
  });

  const taskId =
    taskRes.body && typeof taskRes.body === 'object' && 'id' in taskRes.body
      ? String((taskRes.body as { id: string }).id)
      : '';

  if (taskRes.status === 201 && taskId) {
    pass++;
    log(`Create task -> HTTP ${taskRes.status}`, 'pass', taskId);
  } else {
    fail++;
    log(`Create task -> HTTP ${taskRes.status}`, 'fail', JSON.stringify(taskRes.body).slice(0, 160));
  }

  if (taskId) {
    const subtaskRes = await fetchJson(`/api/tasks/${taskId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'QA subtask' }),
    });

    if (subtaskRes.status === 201) {
      pass++;
      log(`Add subtask -> HTTP ${subtaskRes.status}`, 'pass');
    } else {
      fail++;
      log(`Add subtask -> HTTP ${subtaskRes.status}`, 'fail', JSON.stringify(subtaskRes.body).slice(0, 160));
    }

    const completeRes = await fetchJson(`/api/tasks/${taskId}/complete`, { method: 'PATCH' });
    if (completeRes.status === 200) {
      pass++;
      log(`Complete task -> HTTP ${completeRes.status}`, 'pass');
    } else {
      fail++;
      log(`Complete task -> HTTP ${completeRes.status}`, 'fail');
    }

    const deleteRes = await fetchJson(`/api/tasks/${taskId}`, { method: 'DELETE' });
    if (deleteRes.status === 200) {
      pass++;
      log(`Move task to trash -> HTTP ${deleteRes.status}`, 'pass');
    } else {
      fail++;
      log(`Move task to trash -> HTTP ${deleteRes.status}`, 'fail');
    }

    const restoreRes = await fetchJson(`/api/tasks/${taskId}/restore`, { method: 'PATCH' });
    if (restoreRes.status === 200) {
      pass++;
      log(`Restore task -> HTTP ${restoreRes.status}`, 'pass');
    } else {
      fail++;
      log(`Restore task -> HTTP ${restoreRes.status}`, 'fail');
    }
  }

  if (listId) {
    const deleteListRes = await fetchJson(`/api/task-lists/${listId}`, { method: 'DELETE' });
    if (deleteListRes.status === 200) {
      pass++;
      log(`Delete task list -> HTTP ${deleteListRes.status}`, 'pass');
    } else {
      fail++;
      log(`Delete task list -> HTTP ${deleteListRes.status}`, 'fail');
    }
  }

  return { pass, fail };
}

async function runTasksCrud(log: (msg: string, sev?: Sev, detail?: string) => void) {
  let pass = 0;
  let fail = 0;

  const habitRes = await fetchJson('/api/habits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `QA Habit ${Date.now()}`, iconEmoji: 'OK', color: '#3B82F6' }),
  });

  const habitId =
    habitRes.body && typeof habitRes.body === 'object' && 'id' in habitRes.body
      ? String((habitRes.body as { id: string }).id)
      : '';

  if (habitRes.status === 201 && habitId) {
    pass++;
    log(`Create habit -> HTTP ${habitRes.status}`, 'pass', habitId);
  } else {
    fail++;
    log(`Create habit -> HTTP ${habitRes.status}`, 'fail', JSON.stringify(habitRes.body).slice(0, 160));
  }

  if (habitId) {
    const today = new Date().toISOString().split('T')[0];
    const logRes = await fetchJson(`/api/habits/${habitId}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logDate: today }),
    });
    if (logRes.status === 201) {
      pass++;
      log(`Toggle habit log on -> HTTP ${logRes.status}`, 'pass');
    } else {
      fail++;
      log(`Toggle habit log on -> HTTP ${logRes.status}`, 'fail');
    }

    const clearLogRes = await fetchJson(`/api/habits/${habitId}/log?logDate=${today}`, { method: 'DELETE' });
    if (clearLogRes.status === 200) {
      pass++;
      log(`Toggle habit log off -> HTTP ${clearLogRes.status}`, 'pass');
    } else {
      fail++;
      log(`Toggle habit log off -> HTTP ${clearLogRes.status}`, 'fail');
    }

    const deleteHabitRes = await fetchJson(`/api/habits/${habitId}`, { method: 'DELETE' });
    if (deleteHabitRes.status === 200) {
      pass++;
      log(`Delete habit -> HTTP ${deleteHabitRes.status}`, 'pass');
    } else {
      fail++;
      log(`Delete habit -> HTTP ${deleteHabitRes.status}`, 'fail');
    }
  }

  const countdownRes = await fetchJson('/api/countdowns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `QA Countdown ${Date.now()}`,
      iconEmoji: 'GO',
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      direction: 'until',
    }),
  });

  const countdownId =
    countdownRes.body && typeof countdownRes.body === 'object' && 'id' in countdownRes.body
      ? String((countdownRes.body as { id: string }).id)
      : '';

  if (countdownRes.status === 201 && countdownId) {
    pass++;
    log(`Create countdown -> HTTP ${countdownRes.status}`, 'pass', countdownId);
  } else {
    fail++;
    log(`Create countdown -> HTTP ${countdownRes.status}`, 'fail');
  }

  if (countdownId) {
    const patchCountdownRes = await fetchJson(`/api/countdowns/${countdownId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction: 'since' }),
    });
    if (patchCountdownRes.status === 200) {
      pass++;
      log(`Edit countdown -> HTTP ${patchCountdownRes.status}`, 'pass');
    } else {
      fail++;
      log(`Edit countdown -> HTTP ${patchCountdownRes.status}`, 'fail');
    }

    const deleteCountdownRes = await fetchJson(`/api/countdowns/${countdownId}`, { method: 'DELETE' });
    if (deleteCountdownRes.status === 200) {
      pass++;
      log(`Delete countdown -> HTTP ${deleteCountdownRes.status}`, 'pass');
    } else {
      fail++;
      log(`Delete countdown -> HTTP ${deleteCountdownRes.status}`, 'fail');
    }
  }

  const pomoRes = await fetchJson('/api/pomodoro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskTitle: 'QA Focus Session', mode: 'pomo' }),
  });

  const pomoId =
    pomoRes.body && typeof pomoRes.body === 'object' && 'id' in pomoRes.body
      ? String((pomoRes.body as { id: string }).id)
      : '';

  if (pomoRes.status === 201 && pomoId) {
    pass++;
    log(`Start pomodoro session -> HTTP ${pomoRes.status}`, 'pass', pomoId);
  } else {
    fail++;
    log(`Start pomodoro session -> HTTP ${pomoRes.status}`, 'fail');
  }

  if (pomoId) {
    const stopPomoRes = await fetchJson(`/api/pomodoro/${pomoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wasCompleted: false, durationSecs: 60 }),
    });
    if (stopPomoRes.status === 200) {
      pass++;
      log(`Stop pomodoro session -> HTTP ${stopPomoRes.status}`, 'pass');
    } else {
      fail++;
      log(`Stop pomodoro session -> HTTP ${stopPomoRes.status}`, 'fail');
    }
  }

  return { pass, fail };
}

function renderCaseTable(items: QACase[], styles: CaseTableStyles) {
  if (items.length === 0) {
    return <div style={styles.empty}>No cases configured</div>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={styles.th}>ID</th>
          <th style={styles.th}>AREA</th>
          <th style={styles.th}>TEST CASE</th>
          <th style={styles.th}>PRIORITY</th>
          <th style={styles.th}>EXPECTED RESULT</th>
        </tr>
      </thead>
      <tbody>
        {items.map((entry, index) => (
          <tr key={entry.id} style={{ background: index % 2 === 0 ? 'transparent' : '#161b2244' }}>
            <td style={{ ...styles.td, color: '#79c0ff', fontFamily: 'monospace', fontSize: 10 }}>{entry.id}</td>
            <td style={styles.td}>{entry.area}</td>
            <td style={{ ...styles.td, color: '#cdd9e5' }}>{entry.title}</td>
            <td style={styles.td}>{entry.priority}</td>
            <td style={{ ...styles.td, fontSize: 10 }}>{entry.expected}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function TaskTodoQAAgent({ config }: { config: QAAgentConfig }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('');
  const [activeTab, setActiveTab] = useState<'live' | QACaseKind | 'summary'>('live');
  const [summary, setSummary] = useState<Summary | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const log = useCallback((msg: string, sev: Sev = 'info', detail?: string) => {
    setLogs((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), msg, sev, detail, time: new Date().toLocaleTimeString() },
    ]);
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 40);
  }, []);

  const caseGroups = useMemo(
    () => ({
      unit: config.cases.filter((entry) => entry.kind === 'unit'),
      senior: config.cases.filter((entry) => entry.kind === 'senior'),
      e2e: config.cases.filter((entry) => entry.kind === 'e2e'),
    }),
    [config.cases]
  );

  const runTests = async () => {
    setRunning(true);
    setLogs([]);
    setSummary(null);

    log(`Starting ${config.title}`, 'info', config.subtitle);

    setPhase('Authentication');
    const authWorked = await loginWithCredentials();
    log(
      authWorked ? 'Authenticated test user session is active' : 'Authentication failed for QA session',
      authWorked ? 'pass' : 'fail',
      CREDS.email
    );

    setPhase('Route Smoke');
    let routesOk = 0;
    for (const route of config.routes) {
      const result = await fetchJson(route);
      const sev: Sev = result.status === 200 ? 'pass' : result.status === 302 ? 'warn' : 'fail';
      if (result.status === 200) routesOk++;
      log(`${route} -> HTTP ${result.status} (${result.ms}ms)`, sev);
    }

    setPhase('API Smoke');
    let apiOk = 0;
    for (const path of config.apiPaths) {
      const result = await fetchJson(path);
      const sev: Sev =
        result.status === 200
          ? 'pass'
          : result.status === 401 || result.status === 403
          ? 'warn'
          : result.status === 404
          ? 'skip'
          : 'fail';
      if (result.status === 200) apiOk++;
      log(`${path} -> HTTP ${result.status} (${result.ms}ms)`, sev);
    }

    setPhase('CRUD Flow');
    const crud = config.scenario === 'todo' ? await runTodoCrud(log) : await runTasksCrud(log);

    setSummary({ authWorked, routesOk, apiOk, crudPass: crud.pass, crudFail: crud.fail });
    setPhase('Complete');
    setRunning(false);
    log(
      `Done -> routes:${routesOk}/${config.routes.length} api:${apiOk}/${config.apiPaths.length} crud pass:${crud.pass} fail:${crud.fail}`,
      crud.fail === 0 ? 'pass' : 'warn'
    );
  };

  const S: Record<string, React.CSSProperties | ((active: boolean) => React.CSSProperties)> = {
    wrap: { fontFamily: "'IBM Plex Mono','Fira Code',monospace", background: '#0d1117', minHeight: '100vh', color: '#cdd9e5' },
    header: { background: '#161b22', borderBottom: '1px solid #21262d', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
    title: { fontSize: 14, fontWeight: 700, color: '#79c0ff', margin: 0, letterSpacing: '.04em' },
    sub: { fontSize: 11, color: '#484f58', margin: '3px 0 0' },
    btn: { background: running ? '#21262d' : '#1f6feb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer' },
    phase: { background: '#161b22', borderBottom: '1px solid #21262d', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 },
    tabs: { display: 'flex', borderBottom: '1px solid #21262d', background: '#0d1117' },
    tab: (active: boolean) => ({ padding: '9px 16px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', color: active ? '#79c0ff' : '#484f58', borderBottom: active ? '2px solid #1f6feb' : '2px solid transparent' }),
    sg: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, padding: '12px 16px', background: '#161b22', borderBottom: '1px solid #21262d' },
    cons: { padding: '8px 14px', height: 440, overflowY: 'auto', background: '#0d1117' },
    empty: { padding: 48, textAlign: 'center', color: '#484f58', fontSize: 12 },
    scroll: { overflowY: 'auto', maxHeight: 540 },
    th: { padding: '8px 12px', textAlign: 'left', color: '#484f58', borderBottom: '1px solid #21262d', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', position: 'sticky', top: 0, background: '#161b22' },
    td: { padding: '8px 12px', borderBottom: '1px solid #161b22', fontSize: 11, verticalAlign: 'top', color: '#8b949e' },
  };

  return (
    <div style={S.wrap as React.CSSProperties}>
      <div style={S.header as React.CSSProperties}>
        <div>
          <p style={S.title as React.CSSProperties}>[] {config.title}</p>
          <p style={S.sub as React.CSSProperties}>{config.subtitle}</p>
        </div>
        <button style={S.btn as React.CSSProperties} onClick={runTests} disabled={running}>
          {running ? '... RUNNING' : '> RUN TASK TESTS'}
        </button>
      </div>

      <div style={S.phase as React.CSSProperties}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: running ? '#e3b341' : phase === 'Complete' ? '#3fb950' : '#484f58' }} />
        <span style={{ color: '#79c0ff', fontWeight: 700, flex: 1 }}>{phase || 'Ready - click > RUN TASK TESTS'}</span>
      </div>

      <div style={S.sg as React.CSSProperties}>
        {([['UNIT', caseGroups.unit.length, '#3fb950'], ['SENIOR', caseGroups.senior.length, '#e3b341'], ['E2E', caseGroups.e2e.length, '#79c0ff'], ['ROUTES', config.routes.length, '#d2a8ff'], ['APIS', config.apiPaths.length, '#8b949e']] as [string, number, string][]).map(([label, value, color]) => (
          <div key={label} style={{ background: '#0d1117', border: `1px solid ${color}44`, borderRadius: 6, padding: '10px 8px', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 9, color: '#484f58', margin: '4px 0 0', letterSpacing: '.06em', fontWeight: 700 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={S.tabs as React.CSSProperties}>
        <button style={(S.tab as (active: boolean) => React.CSSProperties)(activeTab === 'live')} onClick={() => setActiveTab('live')}>LIVE LOG</button>
        <button style={(S.tab as (active: boolean) => React.CSSProperties)(activeTab === 'unit')} onClick={() => setActiveTab('unit')}>UNIT CASES</button>
        <button style={(S.tab as (active: boolean) => React.CSSProperties)(activeTab === 'senior')} onClick={() => setActiveTab('senior')}>SENIOR QA</button>
        <button style={(S.tab as (active: boolean) => React.CSSProperties)(activeTab === 'e2e')} onClick={() => setActiveTab('e2e')}>E2E CASES</button>
        <button style={(S.tab as (active: boolean) => React.CSSProperties)(activeTab === 'summary')} onClick={() => setActiveTab('summary')}>SUMMARY</button>
      </div>

      {activeTab === 'live' && (
        <div style={S.cons as React.CSSProperties}>
          {logs.length === 0 ? (
            <div style={S.empty as React.CSSProperties}>No logs yet - run the agent to execute smoke and CRUD checks.</div>
          ) : (
            logs.map((entry) => (
              <div key={entry.id} style={{ borderBottom: '1px solid #161b22', padding: '4px 0' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: COL[entry.sev].dot, flexShrink: 0, marginTop: 5 }} />
                  <span style={{ color: '#30363d', fontSize: 10, minWidth: 68 }}>{entry.time}</span>
                  <span style={{ color: COL[entry.sev].dot, fontSize: 11, lineHeight: 1.6, flex: 1 }}>{entry.msg}</span>
                </div>
                {entry.detail ? <div style={{ fontSize: 10, color: '#484f58', paddingLeft: 82, lineHeight: 1.5 }}>{entry.detail}</div> : null}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      )}

      {activeTab === 'unit' && <div style={S.scroll as React.CSSProperties}>{renderCaseTable(caseGroups.unit, { scroll: S.scroll as React.CSSProperties, empty: S.empty as React.CSSProperties, th: S.th as React.CSSProperties, td: S.td as React.CSSProperties })}</div>}
      {activeTab === 'senior' && <div style={S.scroll as React.CSSProperties}>{renderCaseTable(caseGroups.senior, { scroll: S.scroll as React.CSSProperties, empty: S.empty as React.CSSProperties, th: S.th as React.CSSProperties, td: S.td as React.CSSProperties })}</div>}
      {activeTab === 'e2e' && <div style={S.scroll as React.CSSProperties}>{renderCaseTable(caseGroups.e2e, { scroll: S.scroll as React.CSSProperties, empty: S.empty as React.CSSProperties, th: S.th as React.CSSProperties, td: S.td as React.CSSProperties })}</div>}

      {activeTab === 'summary' && (
        <div style={{ ...(S.scroll as React.CSSProperties), padding: 16 }}>
          {!summary ? (
            <div style={S.empty as React.CSSProperties}>Run the QA agent first to generate live results.</div>
          ) : (
            <>
              <div style={{ background: '#161b22', border: `1px solid ${summary.authWorked ? '#3fb95044' : '#f8514944'}`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
                <p style={{ fontSize: 10, color: '#484f58', fontWeight: 700, margin: '0 0 6px', letterSpacing: '.05em' }}>EXECUTION STATUS</p>
                <p style={{ fontSize: 12, color: summary.authWorked ? '#3fb950' : '#f85149', margin: 0 }}>
                  {summary.authWorked ? 'Authenticated smoke run succeeded for the QA session.' : 'Authenticated smoke run failed. Check test credentials or session setup.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 10 }}>
                {([['Routes OK', summary.routesOk, '#3fb950'], ['API OK', summary.apiOk, '#79c0ff'], ['CRUD Pass', summary.crudPass, '#3fb950'], ['CRUD Fail', summary.crudFail, summary.crudFail === 0 ? '#8b949e' : '#f85149']] as [string, number, string][]).map(([label, value, color]) => (
                  <div key={label} style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0 }}>{value}</p>
                    <p style={{ fontSize: 9, color: '#484f58', margin: '4px 0 0', fontWeight: 700, letterSpacing: '.04em' }}>{label.toUpperCase()}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8, padding: 14 }}>
                <p style={{ fontSize: 10, color: '#79c0ff', fontWeight: 700, margin: '0 0 10px', letterSpacing: '.05em' }}>INCLUDED TEST COVERAGE</p>
                <p style={{ fontSize: 11, color: '#cdd9e5', margin: '0 0 8px', lineHeight: 1.7 }}>
                  Unit cases: {caseGroups.unit.length} focused checks around API contracts, CRUD state changes, and tool-specific mutations.
                </p>
                <p style={{ fontSize: 11, color: '#cdd9e5', margin: '0 0 8px', lineHeight: 1.7 }}>
                  Senior QA cases: {caseGroups.senior.length} exploratory and product-quality checks for UX, resilience, and cross-screen consistency.
                </p>
                <p style={{ fontSize: 11, color: '#cdd9e5', margin: 0, lineHeight: 1.7 }}>
                  End-to-end cases: {caseGroups.e2e.length} realistic user journeys that stitch the module together from start to finish.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
