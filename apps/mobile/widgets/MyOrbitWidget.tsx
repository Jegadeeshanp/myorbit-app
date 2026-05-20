/**
 * MyOrbit Android Widget — Entry Point
 *
 * Registered with react-native-android-widget via app.json plugin.
 * Handles three sizes (small / medium / large) and click actions.
 *
 * Task name in app.json: "myorbit-widget-task"
 * Widget names registered: "SmallWidget", "MediumWidget", "LargeWidget"
 */

import React from 'react';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { SmallWidget  } from './SmallWidget';
import { MediumWidget } from './MediumWidget';
import { LargeWidget  } from './LargeWidget';
import {
  WIDGET_TASK_NAME,
  loadWidgetData,
  saveWidgetData,
  buildWidgetData,
  type WidgetData,
} from './widgetTaskHandler';

// ── Click-action router ───────────────────────────────────────────────────────

async function handleWidgetClick(
  action: string,
  widgetId: number,
  _widgetName: string,
) {
  const { WidgetPreview } = await import('react-native-android-widget');

  switch (action) {
    case 'OPEN_APP':
      // Expo Router deep link — opens the app at dashboard
      await import('expo-linking').then(({ default: Linking }) =>
        Linking.openURL('myorbit://orbit')
      );
      break;

    case 'OPEN_HABITS':
      await import('expo-linking').then(({ default: Linking }) =>
        Linking.openURL('myorbit://orbit/habits')
      );
      break;

    case 'OPEN_TASKS':
      await import('expo-linking').then(({ default: Linking }) =>
        Linking.openURL('myorbit://orbit/tasks')
      );
      break;

    case 'OPEN_FINANCE':
      await import('expo-linking').then(({ default: Linking }) =>
        Linking.openURL('myorbit://orbit/finance')
      );
      break;

    case 'OPEN_GOALS':
      await import('expo-linking').then(({ default: Linking }) =>
        Linking.openURL('myorbit://orbit/goals')
      );
      break;

    case 'REFRESH_WIDGET':
      await refreshAndRender(widgetId, _widgetName, WidgetPreview);
      break;

    default:
      break;
  }
}

// ── Data refresh ──────────────────────────────────────────────────────────────

async function refreshAndRender(
  widgetId: number,
  widgetName: string,
  WidgetPreview: any,
) {
  // Attempt to pull fresh data from the app's API via SecureStore token
  try {
    const { default: SecureStore } = await import('expo-secure-store');
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      const base = await SecureStore.getItemAsync('api_base_url') ?? 'http://localhost:3000';
      const headers = { Authorization: `Bearer ${token}` };

      const [habitsRes, tasksRes, financeRes, goalsRes] = await Promise.allSettled([
        fetch(`${base}/api/habits`, { headers }).then(r => r.json()),
        fetch(`${base}/api/tasks?smartList=all`, { headers }).then(r => r.json()),
        fetch(`${base}/api/finance/accounts`, { headers }).then(r => r.json()),
        fetch(`${base}/api/goals`, { headers }).then(r => r.json()),
      ]);

      const habits   = habitsRes.status   === 'fulfilled' ? (habitsRes.value?.habits ?? [])   : [];
      const tasks    = tasksRes.status    === 'fulfilled' ? (tasksRes.value?.tasks ?? [])     : [];
      const accounts = financeRes.status  === 'fulfilled' ? (financeRes.value?.accounts ?? []) : [];
      const goals    = goalsRes.status    === 'fulfilled' ? (goalsRes.value?.goals ?? [])     : [];

      const balance = accounts.reduce((s: number, a: any) => s + (a.balance ?? 0), 0);
      const fresh   = buildWidgetData(habits, tasks, balance, accounts.length, goals);
      await saveWidgetData(fresh);
    }
  } catch {
    // Silently fall through — show cached data
  }

  const data = await loadWidgetData();
  await renderWidget(widgetId, widgetName, data, WidgetPreview);
}

// ── Render helper ─────────────────────────────────────────────────────────────

async function renderWidget(
  widgetId: number,
  widgetName: string,
  data: WidgetData | null,
  WidgetPreview: any,
) {
  let element: React.ReactElement;

  switch (widgetName) {
    case 'MediumWidget':
      element = <MediumWidget data={data} />;
      break;
    case 'LargeWidget':
      element = <LargeWidget data={data} />;
      break;
    default: // 'SmallWidget'
      element = <SmallWidget data={data} />;
  }

  await WidgetPreview.drawWidget(widgetId, element);
}

// ── Task handler ──────────────────────────────────────────────────────────────

registerWidgetTaskHandler(WIDGET_TASK_NAME, async (props) => {
  const { widgetAction, widgetName, widgetId, clickAction } = props;
  const { WidgetPreview } = await import('react-native-android-widget');

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
      await refreshAndRender(widgetId, widgetName, WidgetPreview);
      break;

    case 'WIDGET_CLICK':
      await handleWidgetClick(clickAction ?? '', widgetId, widgetName);
      break;

    case 'WIDGET_DELETED':
      // Nothing to clean up
      break;

    case 'WIDGET_RESIZED':
      // Re-render at new size
      await refreshAndRender(widgetId, widgetName, WidgetPreview);
      break;

    default:
      break;
  }
});
