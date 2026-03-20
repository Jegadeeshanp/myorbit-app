// app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const settingsSchema = z.object({
  name:     z.string().min(2).max(100).optional(),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED']).optional(),
  theme:    z.enum(['light', 'dark', 'system']).optional(),
  locale:   z.string().max(10).optional(),
  // Financial Profile / Vitals
  age:         z.number().int().min(0).max(120).nullable().optional(),
  dependents:  z.number().int().min(0).nullable().optional(),
  termCover:   z.number().min(0).nullable().optional(),
  healthCover: z.number().min(0).nullable().optional(),
});

export async function GET() {
  try {
    const userId = await requireUserId();

    const [user, prefs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      prisma.userPreferences.findUnique({ where: { userId } }),
    ]);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      profile: {
        id:        user.id,
        name:      user.name,
        email:     user.email,
        createdAt: user.createdAt,
      },
      preferences: {
        currency:    prefs?.currency    ?? 'INR',
        theme:       prefs?.theme       ?? 'system',
        locale:      prefs?.locale      ?? 'en-IN',
        age:         prefs?.age         ?? null,
        dependents:  prefs?.dependents  ?? null,
        termCover:   prefs?.termCover   ?? null,
        healthCover: prefs?.healthCover ?? null,
      },
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body   = await req.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );

    const { name, ...prefsData } = parsed.data;

    // Update name on User if provided
    if (name) {
      await prisma.user.update({ where: { id: userId }, data: { name: name.trim() } });
    }

    // Upsert UserPreferences for everything else
    const prefsUpdate: Record<string, unknown> = {};
    if (prefsData.currency    !== undefined) prefsUpdate.currency    = prefsData.currency;
    if (prefsData.theme       !== undefined) prefsUpdate.theme       = prefsData.theme;
    if (prefsData.locale      !== undefined) prefsUpdate.locale      = prefsData.locale;
    if (prefsData.age         !== undefined) prefsUpdate.age         = prefsData.age;
    if (prefsData.dependents  !== undefined) prefsUpdate.dependents  = prefsData.dependents;
    if (prefsData.termCover   !== undefined) prefsUpdate.termCover   = prefsData.termCover;
    if (prefsData.healthCover !== undefined) prefsUpdate.healthCover = prefsData.healthCover;

    if (Object.keys(prefsUpdate).length > 0) {
      await prisma.userPreferences.upsert({
        where:  { userId },
        update: prefsUpdate,
        create: { userId, ...prefsUpdate },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
