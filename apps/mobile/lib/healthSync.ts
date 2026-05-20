/**
 * Health Platform Sync — MyOrbit
 *
 * Unified abstraction over:
 *   iOS  → Apple HealthKit   (react-native-health / @kingstinct/react-native-healthkit)
 *   Android → Google Health Connect (react-native-health-connect)
 *   Samsung Health / Amazfit / Garmin → sync natively into Health Connect / HealthKit
 *
 * Usage:
 *   const syncer = HealthSync.getInstance();
 *   await syncer.requestPermissions();
 *   const data = await syncer.syncToday();
 */

import { Platform } from 'react-native';

// ── Shared types ──────────────────────────────────────────────────────────────

export interface HealthPermissions {
  steps: boolean;
  sleep: boolean;
  heartRate: boolean;
  calories: boolean;
  weight: boolean;
  workouts: boolean;
  water: boolean;
}

export interface DayHealthData {
  date: string;           // YYYY-MM-DD
  steps?: number;
  sleepHours?: number;
  heartRate?: number;     // average bpm
  calories?: number;      // active kcal
  weightKg?: number;
  waterMl?: number;
  workouts: SyncedWorkout[];
  source: 'healthkit' | 'health_connect' | 'manual';
}

export interface SyncedWorkout {
  type: string;
  startTime: string;      // ISO
  endTime: string;
  durationMins: number;
  caloriesBurned?: number;
  distanceKm?: number;
  sourceName?: string;    // e.g. "Apple Watch", "Galaxy Watch", "Amazfit"
}

export type SyncSource = 'apple_health' | 'google_fit' | 'samsung_health' | 'amazfit' | 'manual';

// ── iOS HealthKit adapter ─────────────────────────────────────────────────────

let AppleHealthKit: any = null;
let HealthConnect: any = null;

// Lazy import — prevents crash on platforms where the module isn't installed
function getAppleHealthKit() {
  if (Platform.OS !== 'ios') return null;
  if (AppleHealthKit) return AppleHealthKit;
  try {
    AppleHealthKit = require('react-native-health').default;
  } catch {
    console.warn('[HealthSync] react-native-health not installed');
  }
  return AppleHealthKit;
}

function getHealthConnect() {
  if (Platform.OS !== 'android') return null;
  if (HealthConnect) return HealthConnect;
  try {
    HealthConnect = require('react-native-health-connect');
  } catch {
    console.warn('[HealthSync] react-native-health-connect not installed');
  }
  return HealthConnect;
}

// ── Permission sets ───────────────────────────────────────────────────────────

const HK_PERMISSIONS = {
  permissions: {
    read: [
      'Steps', 'DistanceWalkingRunning', 'ActiveEnergyBurned',
      'HeartRate', 'HeartRateVariability', 'RestingHeartRate',
      'SleepAnalysis', 'Weight', 'BodyMassIndex',
      'DietaryWater', 'Workout',
    ],
    write: [],
  },
};

const HC_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'Weight' },
  { accessType: 'read', recordType: 'Hydration' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'Distance' },
];

// ── Main class ────────────────────────────────────────────────────────────────

class HealthSyncService {
  private static _instance: HealthSyncService;
  private _initialized = false;
  private _permissionsGranted = false;

  static getInstance(): HealthSyncService {
    if (!HealthSyncService._instance) {
      HealthSyncService._instance = new HealthSyncService();
    }
    return HealthSyncService._instance;
  }

  get isAvailable(): boolean {
    if (Platform.OS === 'ios') return getAppleHealthKit() !== null;
    if (Platform.OS === 'android') return getHealthConnect() !== null;
    return false;
  }

  get platformName(): string {
    if (Platform.OS === 'ios') return 'Apple Health';
    if (Platform.OS === 'android') return 'Google Health Connect';
    return 'Health';
  }

  // ── Permissions ─────────────────────────────────────────────────────────────

  async requestPermissions(): Promise<boolean> {
    if (!this.isAvailable) return false;

    if (Platform.OS === 'ios') {
      return this._requestIOSPermissions();
    } else {
      return this._requestAndroidPermissions();
    }
  }

  private _requestIOSPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      const HK = getAppleHealthKit();
      if (!HK) { resolve(false); return; }
      HK.initHealthKit(HK_PERMISSIONS, (err: any) => {
        if (err) {
          console.warn('[HealthSync] HealthKit init error:', err);
          resolve(false);
          return;
        }
        this._permissionsGranted = true;
        this._initialized = true;
        resolve(true);
      });
    });
  }

  private async _requestAndroidPermissions(): Promise<boolean> {
    const HC = getHealthConnect();
    if (!HC) return false;
    try {
      await HC.initialize();
      const result = await HC.requestPermission(HC_PERMISSIONS);
      const granted = result.every((r: any) => r.granted);
      this._permissionsGranted = granted;
      this._initialized = true;
      return granted;
    } catch (e) {
      console.warn('[HealthSync] Health Connect permission error:', e);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    if (!this.isAvailable) return false;
    if (this._permissionsGranted) return true;

    if (Platform.OS === 'android') {
      const HC = getHealthConnect();
      if (!HC) return false;
      try {
        await HC.initialize();
        const result = await HC.getGrantedPermissions();
        const hasAny = result.length > 0;
        this._permissionsGranted = hasAny;
        return hasAny;
      } catch { return false; }
    }

    // iOS — HealthKit doesn't have a simple "check" API, assume granted if initialized
    return this._initialized;
  }

  // ── Data fetching ────────────────────────────────────────────────────────────

  async syncDate(dateStr: string): Promise<DayHealthData | null> {
    if (!this.isAvailable) return null;
    const hasPerms = await this.checkPermissions();
    if (!hasPerms) {
      const granted = await this.requestPermissions();
      if (!granted) return null;
    }

    if (Platform.OS === 'ios') {
      return this._syncIOSDate(dateStr);
    } else {
      return this._syncAndroidDate(dateStr);
    }
  }

  async syncToday(): Promise<DayHealthData | null> {
    const today = new Date().toISOString().split('T')[0];
    return this.syncDate(today);
  }

  // ── iOS ─────────────────────────────────────────────────────────────────────

  private async _syncIOSDate(dateStr: string): Promise<DayHealthData | null> {
    const HK = getAppleHealthKit();
    if (!HK) return null;

    const start = new Date(dateStr + 'T00:00:00.000Z').toISOString();
    const end   = new Date(dateStr + 'T23:59:59.999Z').toISOString();
    const opts  = { startDate: start, endDate: end, includeManuallyAdded: true };

    const result: DayHealthData = {
      date: dateStr,
      workouts: [],
      source: 'healthkit',
    };

    await Promise.allSettled([
      // Steps
      new Promise<void>(r => HK.getStepCount(opts, (err: any, v: any) => {
        if (!err && v?.value) result.steps = Math.round(v.value);
        r();
      })),
      // Calories
      new Promise<void>(r => HK.getActiveEnergyBurned(opts, (err: any, v: any) => {
        if (!err && Array.isArray(v)) {
          result.calories = Math.round(v.reduce((s: number, e: any) => s + (e.value || 0), 0));
        }
        r();
      })),
      // Heart rate
      new Promise<void>(r => HK.getHeartRateSamples(opts, (err: any, v: any) => {
        if (!err && Array.isArray(v) && v.length) {
          result.heartRate = Math.round(v.reduce((s: number, e: any) => s + (e.value || 0), 0) / v.length);
        }
        r();
      })),
      // Sleep
      new Promise<void>(r => HK.getSleepSamples(opts, (err: any, v: any) => {
        if (!err && Array.isArray(v) && v.length) {
          const asleepSamples = v.filter((s: any) => s.value === 'ASLEEP' || s.value === 'CORE' || s.value === 'DEEP' || s.value === 'REM');
          const totalMs = asleepSamples.reduce((sum: number, s: any) => {
            return sum + (new Date(s.endDate).getTime() - new Date(s.startDate).getTime());
          }, 0);
          if (totalMs > 0) result.sleepHours = Math.round((totalMs / 3600000) * 10) / 10;
        }
        r();
      })),
      // Weight (latest sample)
      new Promise<void>(r => HK.getLatestWeight(opts, (err: any, v: any) => {
        if (!err && v?.value) result.weightKg = Math.round(v.value * 10) / 10;
        r();
      })),
      // Water
      new Promise<void>(r => HK.getDietaryWater(opts, (err: any, v: any) => {
        if (!err && v?.value) result.waterMl = Math.round(v.value * 1000);
        r();
      })),
      // Workouts
      new Promise<void>(r => HK.getSamples({ ...opts, type: 'Workout' }, (err: any, v: any) => {
        if (!err && Array.isArray(v)) {
          result.workouts = v.map((w: any) => ({
            type: _iosWorkoutType(w.activityId),
            startTime: w.startDate,
            endTime: w.endDate,
            durationMins: Math.round((new Date(w.endDate).getTime() - new Date(w.startDate).getTime()) / 60000),
            caloriesBurned: w.calories ? Math.round(w.calories) : undefined,
            distanceKm: w.distance ? Math.round(w.distance / 1000 * 10) / 10 : undefined,
            sourceName: w.sourceName || 'Apple Health',
          }));
        }
        r();
      })),
    ]);

    return result;
  }

  // ── Android ─────────────────────────────────────────────────────────────────

  private async _syncAndroidDate(dateStr: string): Promise<DayHealthData | null> {
    const HC = getHealthConnect();
    if (!HC) return null;

    const startTime = dateStr + 'T00:00:00.000Z';
    const endTime   = dateStr + 'T23:59:59.999Z';
    const timeRange = { operator: 'between', startTime, endTime };

    const result: DayHealthData = {
      date: dateStr,
      workouts: [],
      source: 'health_connect',
    };

    await Promise.allSettled([
      // Steps
      HC.readRecords('Steps', { timeRangeFilter: timeRange }).then((r: any) => {
        if (r?.records?.length) {
          result.steps = r.records.reduce((s: number, rec: any) => s + (rec.count || 0), 0);
        }
      }).catch(() => {}),

      // Calories
      HC.readRecords('ActiveCaloriesBurned', { timeRangeFilter: timeRange }).then((r: any) => {
        if (r?.records?.length) {
          result.calories = Math.round(r.records.reduce((s: number, rec: any) => s + (rec.energy?.inKilocalories || 0), 0));
        }
      }).catch(() => {}),

      // Heart rate
      HC.readRecords('HeartRate', { timeRangeFilter: timeRange }).then((r: any) => {
        if (r?.records?.length) {
          const samples = r.records.flatMap((rec: any) => rec.samples || []);
          if (samples.length) {
            result.heartRate = Math.round(samples.reduce((s: number, sp: any) => s + (sp.beatsPerMinute || 0), 0) / samples.length);
          }
        }
      }).catch(() => {}),

      // Sleep
      HC.readRecords('SleepSession', { timeRangeFilter: timeRange }).then((r: any) => {
        if (r?.records?.length) {
          const totalMs = r.records.reduce((s: number, rec: any) => {
            return s + (new Date(rec.endTime).getTime() - new Date(rec.startTime).getTime());
          }, 0);
          if (totalMs > 0) result.sleepHours = Math.round((totalMs / 3600000) * 10) / 10;
        }
      }).catch(() => {}),

      // Weight (latest)
      HC.readRecords('Weight', { timeRangeFilter: timeRange }).then((r: any) => {
        if (r?.records?.length) {
          const latest = r.records[r.records.length - 1];
          result.weightKg = Math.round((latest.weight?.inKilograms || 0) * 10) / 10;
        }
      }).catch(() => {}),

      // Water
      HC.readRecords('Hydration', { timeRangeFilter: timeRange }).then((r: any) => {
        if (r?.records?.length) {
          result.waterMl = Math.round(
            r.records.reduce((s: number, rec: any) => s + (rec.volume?.inMilliliters || 0), 0)
          );
        }
      }).catch(() => {}),

      // Workouts
      HC.readRecords('ExerciseSession', { timeRangeFilter: timeRange }).then((r: any) => {
        if (r?.records?.length) {
          result.workouts = r.records.map((w: any) => ({
            type: _androidWorkoutType(w.exerciseType),
            startTime: w.startTime,
            endTime: w.endTime,
            durationMins: Math.round((new Date(w.endTime).getTime() - new Date(w.startTime).getTime()) / 60000),
            caloriesBurned: undefined, // fetched separately
            distanceKm: undefined,
            sourceName: w.metadata?.dataOrigin || 'Health Connect',
          }));
        }
      }).catch(() => {}),
    ]);

    return result;
  }
}

// ── Workout type mappings ─────────────────────────────────────────────────────

function _iosWorkoutType(activityId: number): string {
  const MAP: Record<number, string> = {
    37: 'running', 13: 'cycling', 20: 'hiking', 63: 'walking',
    50: 'swimming', 48: 'rowing', 52: 'skiing', 25: 'yoga',
    20: 'strength', 79: 'mixed_cardio', 3000: 'other',
  };
  return MAP[activityId] ?? 'other';
}

function _androidWorkoutType(exerciseType: number): string {
  const MAP: Record<number, string> = {
    8: 'running', 2: 'cycling', 9: 'hiking', 87: 'walking',
    35: 'swimming', 66: 'yoga', 1: 'badminton', 4: 'strength',
  };
  return MAP[exerciseType] ?? 'other';
}

// ── Singleton export ─────────────────────────────────────────────────────────

export const healthSync = HealthSyncService.getInstance();
export default healthSync;
