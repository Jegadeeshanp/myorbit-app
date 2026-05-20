/**
 * Medium Android Home Screen Widget — MyOrbit
 * Displays greeting, habit list (up to 4), and upcoming tasks.
 * ~4x2 cells on the home screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from './widgetTaskHandler';

interface Props {
  data: WidgetData | null;
}

export function MediumWidget({ data }: Props) {
  const greeting    = data?.greeting     ?? 'Good morning';
  const date        = data?.date         ?? '';
  const habits      = data?.habits.list  ?? [];
  const tasks       = data?.tasks.list   ?? [];
  const habitDone   = data?.habits.done  ?? 0;
  const habitTotal  = data?.habits.total ?? 0;

  const displayDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '';

  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        clickAction: 'OPEN_APP',
      }}
    >
      {/* Left column — habits */}
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'column',
          marginRight: 8,
        }}
      >
        {/* Header */}
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <TextWidget text="🪐 " style={{ fontSize: 12 }} />
          <TextWidget
            text="MyOrbit"
            style={{ fontSize: 12, fontWeight: 'bold', color: '#10B981' }}
          />
        </FlexWidget>

        <TextWidget
          text={greeting}
          style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}
        />
        <TextWidget
          text={displayDate}
          style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 6 }}
        />

        {/* Habits section */}
        <TextWidget
          text={`Habits · ${habitDone}/${habitTotal}`}
          style={{ fontSize: 10, fontWeight: 'bold', color: '#374151', marginBottom: 4 }}
        />

        {habits.slice(0, 4).map((h) => (
          <FlexWidget
            key={h.id}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}
            clickAction="OPEN_HABITS"
          >
            <TextWidget
              text={h.done ? '✅' : '⬜'}
              style={{ fontSize: 11, marginRight: 4 }}
            />
            <TextWidget
              text={`${h.emoji} ${h.name}`}
              style={{
                fontSize: 10,
                color: h.done ? '#6B7280' : '#111827',
                textDecorationLine: h.done ? 'line-through' : 'none',
                flexShrink: 1,
              }}
            />
          </FlexWidget>
        ))}
      </FlexWidget>

      {/* Divider */}
      <FlexWidget
        style={{
          width: 1,
          height: 'match_parent',
          backgroundColor: '#E5E7EB',
          marginHorizontal: 4,
        }}
      />

      {/* Right column — tasks */}
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'column',
          marginLeft: 4,
        }}
      >
        <TextWidget
          text="Tasks"
          style={{ fontSize: 10, fontWeight: 'bold', color: '#374151', marginBottom: 6 }}
        />

        {tasks.length === 0 ? (
          <TextWidget
            text="All clear! 🎉"
            style={{ fontSize: 10, color: '#6B7280' }}
          />
        ) : (
          tasks.slice(0, 4).map((t) => (
            <FlexWidget
              key={t.id}
              style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}
              clickAction="OPEN_TASKS"
            >
              <TextWidget
                text={t.overdue ? '🔴' : '🔵'}
                style={{ fontSize: 9, marginRight: 3, marginTop: 1 }}
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
      </FlexWidget>
    </FlexWidget>
  );
}
