/**
 * Watch Connectivity — MyOrbit
 *
 * Unified bridge between the app and paired smartwatches:
 *   iOS  → Apple Watch via react-native-watch-connectivity
 *   Android → Wear OS via react-native-watch-connectivity (same package, different platform)
 *   Samsung Galaxy Watch → syncs through Wear OS on Android 11+
 *   Amazfit / Garmin → no direct SDK; surfaces tasks via Health Connect notifications
 *
 * Responsibilities:
 *   1. Push today's tasks to the watch face / complication
 *   2. Receive task actions (DONE / POSTPONE / CLOSE) from the watch
 *   3. Reflect those actions in the app via the tasks API
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WatchTask {
  id: string;
  title: string;
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'none';
  dueDate?: string;
  overdue: boolean;
}

export type WatchTaskAction = 'DONE' | 'POSTPONE' | 'CLOSE';

export interface WatchMessage {
  type: 'TASKS_UPDATE' | 'TASK_ACTION' | 'PING';
  tasks?: WatchTask[];
  taskId?: string;
  action?: WatchTaskAction;
  timestamp?: string;
}

export type ActionHandler = (taskId: string, action: WatchTaskAction) => Promise<void>;

// ── Lazy module loader ────────────────────────────────────────────────────────

let WatchConnectivity: any = null;

function getWatchConnectivity() {
  if (WatchConnectivity) return WatchConnectivity;
  try {
    WatchConnectivity = require('react-native-watch-connectivity');
  } catch {
    console.warn('[WatchConnectivity] react-native-watch-connectivity not installed');
  }
  return WatchConnectivity;
}

// ── Service ───────────────────────────────────────────────────────────────────

class WatchConnectivityService {
  private static _instance: WatchConnectivityService;
  private _actionHandler: ActionHandler | null = null;
  private _messageSubscription: (() => void) | null = null;
  private _reachabilitySubscription: (() => void) | null = null;

  static getInstance(): WatchConnectivityService {
    if (!WatchConnectivityService._instance) {
      WatchConnectivityService._instance = new WatchConnectivityService();
    }
    return WatchConnectivityService._instance;
  }

  get isSupported(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async activate(onAction: ActionHandler): Promise<boolean> {
    const wc = getWatchConnectivity();
    if (!wc) return false;

    this._actionHandler = onAction;

    try {
      if (Platform.OS === 'ios') {
        await wc.activateSession();
      }

      // Subscribe to incoming messages from the watch
      this._messageSubscription = wc.watchEvents.on(
        'message',
        (msg: WatchMessage) => this._handleIncoming(msg),
      );

      // Monitor reachability changes
      this._reachabilitySubscription = wc.watchEvents.on(
        'reachability',
        (reachable: boolean) => {
          if (reachable) this._pushPendingTasks();
        },
      );

      return true;
    } catch (e) {
      console.warn('[WatchConnectivity] activation error:', e);
      return false;
    }
  }

  deactivate() {
    this._messageSubscription?.();
    this._reachabilitySubscription?.();
    this._messageSubscription = null;
    this._reachabilitySubscription = null;
    this._actionHandler = null;
  }

  // ── Push tasks to watch ────────────────────────────────────────────────────

  async pushTasks(tasks: WatchTask[]): Promise<void> {
    const wc = getWatchConnectivity();
    if (!wc) return;

    const msg: WatchMessage = {
      type: 'TASKS_UPDATE',
      tasks: tasks.slice(0, 10), // watch memory is limited
      timestamp: new Date().toISOString(),
    };

    try {
      if (Platform.OS === 'ios') {
        const reachable = await wc.getReachability();
        if (reachable) {
          await wc.sendMessage(msg, undefined);
        } else {
          // Queue in application context for background delivery
          await wc.updateApplicationContext(msg as any);
        }
      } else {
        // Android / Wear OS — use channel message
        await wc.sendMessage(msg);
      }
    } catch (e) {
      console.warn('[WatchConnectivity] pushTasks error:', e);
    }
  }

  // ── Incoming message handler ───────────────────────────────────────────────

  private async _handleIncoming(msg: WatchMessage) {
    if (msg.type !== 'TASK_ACTION') return;
    if (!msg.taskId || !msg.action) return;

    try {
      await this._applyAction(msg.taskId, msg.action);
    } catch (e) {
      console.warn('[WatchConnectivity] action handler error:', e);
    }
  }

  private async _applyAction(taskId: string, action: WatchTaskAction) {
    const token = await SecureStore.getItemAsync('auth_token');
    const base  = (await SecureStore.getItemAsync('api_base_url')) ?? 'http://localhost:3000';
    if (!token) return;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    switch (action) {
      case 'DONE':
        await fetch(`${base}/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'completed' }),
        });
        break;

      case 'POSTPONE': {
        // Push due date by 1 day
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await fetch(`${base}/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ dueDate: tomorrow.toISOString().split('T')[0] }),
        });
        break;
      }

      case 'CLOSE':
        await fetch(`${base}/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'cancelled' }),
        });
        break;
    }

    // Also notify the JS-layer handler so the UI can update
    await this._actionHandler?.(taskId, action);
  }

  // ── Background push ────────────────────────────────────────────────────────

  private async _pushPendingTasks() {
    // Reload cached tasks and push when watch becomes reachable
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const base  = (await SecureStore.getItemAsync('api_base_url')) ?? 'http://localhost:3000';
      if (!token) return;

      const res = await fetch(`${base}/api/tasks?smartList=today&status=active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const { tasks } = await res.json();
      const today = new Date().toISOString().split('T')[0];

      const watchTasks: WatchTask[] = (tasks ?? []).slice(0, 10).map((t: any) => ({
        id: t.id,
        title: t.title,
        priority: t.priority ?? 'none',
        dueDate: t.dueDate ?? undefined,
        overdue: t.dueDate ? t.dueDate < today : false,
      }));

      await this.pushTasks(watchTasks);
    } catch {}
  }

  // ── Complication data (iOS only) ──────────────────────────────────────────

  async updateComplication(overdueCount: number, habitProgress: string): Promise<void> {
    if (Platform.OS !== 'ios') return;
    const wc = getWatchConnectivity();
    if (!wc) return;

    try {
      await wc.updateApplicationContext({
        complication: { overdueCount, habitProgress },
      });
    } catch {}
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────

export const watchConnectivity = WatchConnectivityService.getInstance();
export default watchConnectivity;
