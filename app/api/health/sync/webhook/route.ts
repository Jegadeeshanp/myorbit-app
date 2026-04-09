/**
 * Health Auto Export webhook — receives Apple Health / Google Health data
 * and upserts into health entries.
 *
 * Compatible with the "Health Auto Export" iOS app (https://healthautoexport.com)
 * Configure the app to POST to: https://<your-domain>/api/health/sync/webhook?userId=<userId>&token=<token>
 *
 * Also accepts a generic flat JSON body for custom integrations.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';

function makeToken(userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? 'dev-secret';
  return createHmac('sha256', secret).update(userId).digest('hex');
}

// ── Health Auto Export metric name mapping ─────────────────────────────────
// ref: https://www.healthexportapp.com/docs

const METRIC_MAP: Record<string, keyof HealthUpsert> = {
  step_count:          'steps',
  steps:               'steps',
  heart_rate:          'heartRate',
  resting_heart_rate:  'heartRate',
  body_mass:           'weightKg',
  body_mass_index:     'bmi',
  sleep_analysis:      'sleepHours',
};

type HealthUpsert = {
  steps?:      number;
  heartRate?:  number;
  weightKg?:   number;
  bmi?:        number;
  sleepHours?: number;
  waterMl?:    number;
};

function toDate(dateStr: string): string {
  // "2024-01-15 08:30:00 -0500"  →  "2024-01-15"
  return dateStr.slice(0, 10);
}

function parseSleepHours(data: any[]): number {
  // Sum ASLEEP durations in hours
  let totalMs = 0;
  for (const d of data) {
    if (d.value === 'ASLEEP' || d.value === 'INBED') {
      const start = new Date(d.startDate ?? d.date).getTime();
      const end   = new Date(d.endDate ?? d.date).getTime();
      if (!isNaN(start) && !isNaN(end)) totalMs += end - start;
    }
  }
  return Math.round((totalMs / 3600000) * 10) / 10;
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const token  = searchParams.get('token');

    if (!userId || !token) {
      return NextResponse.json({ error: 'userId and token required' }, { status: 401 });
    }
    if (token !== makeToken(userId)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();

    // ── Format 1: Health Auto Export {"data":{"metrics":[...]}} ──────────
    const byDate: Record<string, HealthUpsert> = {};

    if (body?.data?.metrics) {
      for (const metric of body.data.metrics) {
        const field = METRIC_MAP[metric.name];
        if (!field || !Array.isArray(metric.data)) continue;

        if (field === 'sleepHours') {
          // Group sleep data by start date
          const byStartDate: Record<string, any[]> = {};
          for (const d of metric.data) {
            const date = toDate(d.startDate ?? d.date ?? '');
            if (!date) continue;
            if (!byStartDate[date]) byStartDate[date] = [];
            byStartDate[date].push(d);
          }
          for (const [date, items] of Object.entries(byStartDate)) {
            if (!byDate[date]) byDate[date] = {};
            byDate[date].sleepHours = parseSleepHours(items);
          }
        } else {
          for (const d of metric.data) {
            const date = toDate(d.date ?? d.startDate ?? '');
            if (!date || d.qty == null) continue;
            if (!byDate[date]) byDate[date] = {};
            if (field === 'steps') byDate[date].steps = Math.round(d.qty);
            else if (field === 'heartRate') byDate[date].heartRate = Math.round(d.qty);
            else if (field === 'weightKg') byDate[date].weightKg = Math.round(d.qty * 10) / 10;
            else if (field === 'waterMl') byDate[date].waterMl = Math.round(d.qty * 1000); // L→ml
          }
        }
      }
    }

    // ── Format 2: Generic flat {"date":"...","steps":...,"heartRate":...} ─
    if (body?.date) {
      const d = body;
      const date = toDate(d.date);
      if (date) {
        byDate[date] = {
          steps:      d.steps      ?? undefined,
          heartRate:  d.heartRate  ?? undefined,
          weightKg:   d.weightKg   ?? undefined,
          sleepHours: d.sleepHours ?? undefined,
          waterMl:    d.waterMl    ?? undefined,
        };
      }
    }

    // ── Upsert each date ──────────────────────────────────────────────────
    let upserted = 0;
    for (const [date, data] of Object.entries(byDate)) {
      if (Object.values(data).every(v => v == null)) continue;
      await prisma.healthEntry.upsert({
        where: { userId_date: { userId, date } },
        update: {
          ...(data.steps      != null && { steps:      data.steps }),
          ...(data.heartRate  != null && { heartRate:  data.heartRate }),
          ...(data.weightKg   != null && { weightKg:   data.weightKg }),
          ...(data.sleepHours != null && { sleepHours: data.sleepHours }),
          ...(data.waterMl    != null && { waterMl:    data.waterMl }),
        },
        create: {
          userId, date,
          steps:      data.steps      ?? null,
          heartRate:  data.heartRate  ?? null,
          weightKg:   data.weightKg   ?? null,
          sleepHours: data.sleepHours ?? null,
          waterMl:    data.waterMl    ?? null,
          mood:       null,
          energyLevel:null,
          notes:      null,
        },
      });
      upserted++;
    }

    return NextResponse.json({ ok: true, upserted });
  } catch (e: any) {
    console.error('[sync/webhook]', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
