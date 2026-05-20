/**
 * Small Android Home Screen Widget — MyOrbit
 * Displays greeting, habit progress bar, and overdue task count.
 * ~2x2 cells on the home screen.
 */

import React from 'react';
import {
  FlexWidget,
  TextWidget,
  ImageWidget,
} from 'react-native-android-widget';
import type { WidgetData } from './widgetTaskHandler';

interface Props {
  data: WidgetData | null;
}

export function SmallWidget({ data }: Props) {
  const habitDone    = data?.habits.done  ?? 0;
  const habitTotal   = data?.habits.total ?? 0;
  const overdue      = data?.tasks.overdue ?? 0;
  const greeting     = data?.greeting ?? 'Good morning';
  const progressPct  = habitTotal > 0 ? Math.round((habitDone / habitTotal) * 100) : 0;

  const progressColor = progressPct >= 80 ? '#10B981' : progressPct >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        clickAction: 'OPEN_APP',
      }}
    >
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextWidget
          text="🪐"
          style={{ fontSize: 14 }}
        />
        <TextWidget
          text=" MyOrbit"
          style={{
            fontSize: 12,
            fontWeight: 'bold',
            color: '#10B981',
            marginLeft: 2,
          }}
        />
      </FlexWidget>

      {/* Greeting */}
      <TextWidget
        text={greeting}
        style={{
          fontSize: 11,
          color: '#6B7280',
          flexShrink: 1,
        }}
      />

      {/* Habit progress */}
      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget
          text={`Habits ${habitDone}/${habitTotal}`}
          style={{ fontSize: 11, color: '#374151', fontWeight: 'bold' }}
        />
        {/* Progress bar background */}
        <FlexWidget
          style={{
            width: 'match_parent',
            height: 6,
            backgroundColor: '#E5E7EB',
            borderRadius: 3,
            marginTop: 4,
          }}
        >
          {/* Progress fill */}
          <FlexWidget
            style={{
              width: `${progressPct}%` as any,
              height: 6,
              backgroundColor: progressColor,
              borderRadius: 3,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Overdue tasks */}
      {overdue > 0 && (
        <TextWidget
          text={`⚠ ${overdue} overdue`}
          style={{ fontSize: 10, color: '#EF4444' }}
        />
      )}
    </FlexWidget>
  );
}
