/**
 * Large Android Home Screen Widget — MyOrbit
 * Full summary: greeting, habits, tasks, finance balance, goals.
 * ~4x4 cells on the home screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from './widgetTaskHandler';

interface Props {
  data: WidgetData | null;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <TextWidget
      text={title}
      style={{
        fontSize: 10,
        fontWeight: 'bold',
        color: '#10B981',
        marginBottom: 4,
        marginTop: 8,
      }}
    />
  );
}

function Divider() {
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 4,
      }}
    />
  );
}

export function LargeWidget({ data }: Props) {
  const greeting   = data?.greeting     ?? 'Good morning';
  const date       = data?.date         ?? '';
  const habits     = data?.habits.list  ?? [];
  const tasks      = data?.tasks.list   ?? [];
  const habitDone  = data?.habits.done  ?? 0;
  const habitTotal = data?.habits.total ?? 0;
  const balance    = data?.finance.balance     ?? 0;
  const balLabel   = data?.finance.balanceLabel ?? '—';
  const goals      = data?.goals.active  ?? 0;
  const nearest    = data?.goals.nearest ?? null;
  const overdue    = data?.tasks.overdue ?? 0;

  const progressPct = habitTotal > 0 ? Math.round((habitDone / habitTotal) * 100) : 0;
  const progressColor = progressPct >= 80 ? '#10B981' : progressPct >= 40 ? '#F59E0B' : '#EF4444';

  const displayDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(balance);

  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 14,
        clickAction: 'OPEN_APP',
      }}
    >
      {/* Top header */}
      <FlexWidget
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget text="🪐" style={{ fontSize: 16 }} />
          <TextWidget
            text=" MyOrbit"
            style={{ fontSize: 14, fontWeight: 'bold', color: '#10B981', marginLeft: 2 }}
          />
        </FlexWidget>
        <TextWidget
          text={displayDate}
          style={{ fontSize: 10, color: '#9CA3AF' }}
        />
      </FlexWidget>

      {/* Greeting */}
      <TextWidget
        text={greeting}
        style={{ fontSize: 12, color: '#374151', marginTop: 4 }}
      />

      <Divider />

      {/* Habits */}
      <SectionHeader title={`Habits · ${habitDone}/${habitTotal} done`} />

      {/* Habit progress bar */}
      <FlexWidget
        style={{
          width: 'match_parent',
          height: 5,
          backgroundColor: '#E5E7EB',
          borderRadius: 3,
          marginBottom: 6,
        }}
      >
        <FlexWidget
          style={{
            width: `${progressPct}%` as any,
            height: 5,
            backgroundColor: progressColor,
            borderRadius: 3,
          }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {habits.slice(0, 6).map((h) => (
          <FlexWidget
            key={h.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 8,
              marginBottom: 3,
            }}
            clickAction="OPEN_HABITS"
          >
            <TextWidget
              text={h.done ? '✅' : '⬜'}
              style={{ fontSize: 10, marginRight: 2 }}
            />
            <TextWidget
              text={h.emoji}
              style={{ fontSize: 10, marginRight: 2 }}
            />
            <TextWidget
              text={h.name}
              style={{
                fontSize: 10,
                color: h.done ? '#9CA3AF' : '#1F2937',
                textDecorationLine: h.done ? 'line-through' : 'none',
              }}
            />
          </FlexWidget>
        ))}
      </FlexWidget>

      <Divider />

      {/* Tasks */}
      <SectionHeader
        title={`Tasks · ${tasks.length} total${overdue > 0 ? ` · ${overdue} overdue` : ''}`}
      />

      {tasks.length === 0 ? (
        <TextWidget text="All tasks done! 🎉" style={{ fontSize: 10, color: '#6B7280' }} />
      ) : (
        tasks.slice(0, 3).map((t) => (
          <FlexWidget
            key={t.id}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}
            clickAction="OPEN_TASKS"
          >
            <TextWidget
              text={t.overdue ? '🔴 ' : '○ '}
              style={{ fontSize: 9, color: t.overdue ? '#EF4444' : '#6B7280' }}
            />
            <TextWidget
              text={t.title}
              style={{
                fontSize: 10,
                color: t.overdue ? '#EF4444' : '#374151',
                flexShrink: 1,
              }}
            />
          </FlexWidget>
        ))
      )}

      <Divider />

      {/* Finance + Goals row */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {/* Finance */}
        <FlexWidget
          style={{ flexDirection: 'column', flex: 1 }}
          clickAction="OPEN_FINANCE"
        >
          <TextWidget
            text="💰 Finance"
            style={{ fontSize: 10, fontWeight: 'bold', color: '#10B981', marginBottom: 2 }}
          />
          <TextWidget
            text={formattedBalance}
            style={{
              fontSize: 13,
              fontWeight: 'bold',
              color: balance < 0 ? '#EF4444' : '#111827',
            }}
          />
          <TextWidget
            text={balLabel}
            style={{ fontSize: 9, color: '#9CA3AF' }}
          />
        </FlexWidget>

        {/* Goals */}
        <FlexWidget
          style={{ flexDirection: 'column', flex: 1, alignItems: 'flex-end' }}
          clickAction="OPEN_GOALS"
        >
          <TextWidget
            text="🎯 Goals"
            style={{ fontSize: 10, fontWeight: 'bold', color: '#10B981', marginBottom: 2 }}
          />
          <TextWidget
            text={`${goals} active`}
            style={{ fontSize: 13, fontWeight: 'bold', color: '#111827' }}
          />
          {nearest && (
            <TextWidget
              text={nearest}
              style={{ fontSize: 9, color: '#9CA3AF' }}
            />
          )}
        </FlexWidget>
      </FlexWidget>

      {/* Refresh hint */}
      <TextWidget
        text={`Updated ${data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}`}
        style={{ fontSize: 8, color: '#D1D5DB', marginTop: 4, textAlign: 'right' }}
        clickAction="REFRESH_WIDGET"
      />
    </FlexWidget>
  );
}
