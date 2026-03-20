'use client';

import { useState } from 'react';
import QAAgent from './QAAgent';
import QAAgent120 from './QAAgent120';
import TodoQAAgent from './TodoQAAgent';
import TasksQAAgent from './TasksQAAgent';

type AgentKey = 'original' | '120' | 'todo' | 'tasks';

#This is a simple page to switch between different QA agents for testing purposes. Each agent has a different set of test cases and validation coverage, as described in the DESCRIPTIONS constant. The AgentButton component is a reusable button that highlights the active agent.

const DESCRIPTIONS: Record<AgentKey, string> = {
  original: '9 phases · auth, routes, API, CRUD, edge cases, security, performance',
  '120': '120 test cases · A-G modules · full validation coverage',
  todo: 'unit, senior QA, e2e · lists, smart views, CRUD, subtasks',
  tasks: 'unit, senior QA, e2e · pomodoro, habits, countdowns, settings',
};

function AgentButton({
  id,
  active,
  setActive,
  label,
}: {
  id: AgentKey;
  active: AgentKey;
  setActive: (value: AgentKey) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => setActive(id)}
      style={{
        padding: '5px 14px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        cursor: 'pointer',
        border: 'none',
        background: active === id ? '#1f6feb' : '#21262d',
        color: active === id ? '#fff' : '#8b949e',
      }}
    >
      {label}
    </button>
  );
}

export default function QAPage() {
  const [active, setActive] = useState<AgentKey>('original');

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", background: '#0d1117', minHeight: '100vh' }}>
      <div
        style={{
          background: '#010409',
          borderBottom: '1px solid #21262d',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: '#484f58',
            fontWeight: 700,
            marginRight: 8,
            letterSpacing: '.06em',
          }}
        >
          SELECT AGENT:
        </span>

        <AgentButton id="original" active={active} setActive={setActive} label="financeQATest" />
        <AgentButton id="120" active={active} setActive={setActive} label="finance120QATest" />
        <AgentButton id="todo" active={active} setActive={setActive} label="todoQATest" />
        <AgentButton id="tasks" active={active} setActive={setActive} label="tasksQATest" />

        <span style={{ fontSize: 10, color: '#484f58', marginLeft: 8 }}>{DESCRIPTIONS[active]}</span>
      </div>

      {active === 'original' && <QAAgent />}
      {active === '120' && <QAAgent120 />}
      {active === 'todo' && <TodoQAAgent />}
      {active === 'tasks' && <TasksQAAgent />}
    </div>
  );
}
