import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const MODULE_KEYS = ['finance', 'tasks', 'habits', 'goals', 'health', 'insights'] as const;
type ModuleKey = typeof MODULE_KEYS[number];

const settingsSchema = z.object({
  // Profile
  name:         z.string().min(2).max(100).optional(),
  // Finance / display
  currency:     z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED']).optional(),
  theme:        z.enum(['light', 'dark', 'system']).optional(),
  locale:       z.string().max(10).optional(),
  // Financial profile (vitals)
  age:          z.number().int().min(0).max(120).nullable().optional(),
  dependents:   z.number().int().min(0).nullable().optional(),
  termCover:    z.number().min(0).nullable().optional(),
  healthCover:  z.number().min(0).nullable().optional(),
  // Health daily targets
  stepsGoal:    z.number().int().min(0).max(100_000).nullable().optional(),
  sleepGoal:    z.number().min(0).max(24).nullable().optional(),
  waterGoal:    z.number().int().min(0).max(10_000).nullable().optional(),
  caloriesGoal: z.number().int().min(0).max(10_000).nullable().optional(),
  // Active modules
  enabledModules: z.array(z.enum(MODULE_KEYS)).min(1).optional(),
  // Onboarding
  onboardingDone: z.boolean().optional(),
  focusModule:    z.string().max(20).optional(),
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const [user, prefs] = await Promise.all([
      prisma.user.findUnique({
        where:  { id: userId },
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
        currency:       prefs?.currency       ?? 'INR',
        theme:          prefs?.theme          ?? 'system',
        locale:         prefs?.locale         ?? 'en-IN',
        age:            prefs?.age            ?? null,
        dependents:     prefs?.dependents     ?? null,
        termCover:      prefs?.termCover      ?? null,
        healthCover:    prefs?.healthCover    ?? null,
        stepsGoal:      prefs?.stepsGoal      ?? 10000,
        sleepGoal:      prefs?.sleepGoal      ?? 7.5,
        waterGoal:      prefs?.waterGoal      ?? 2000,
        caloriesGoal:   prefs?.caloriesGoal   ?? 2000,
        enabledModules: (prefs?.enabledModules ?? 'finance,tasks,habits,goals,health,insights')
          .split(',').filter(Boolean) as ModuleKey[],
        onboardingDone: prefs?.onboardingDone ?? false,
        focusModule:    prefs?.focusModule    ?? '',
      },
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body   = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, ...prefsData } = parsed.data;

    // Update name on the User record
    if (name) {
      await prisma.user.update({ where: { id: userId }, data: { name: name.trim() } });
    }

    // Build preferences update object — only include keys that were supplied
    const PREFS_KEYS = [
      'currency', 'theme', 'locale',
      'age', 'dependents', 'termCover', 'healthCover',
      'stepsGoal', 'sleepGoal', 'waterGoal', 'caloriesGoal',
      'onboardingDone', 'focusModule',
    ] as const;

    const prefsUpdate: Record<string, unknown> = {};
    for (const key of PREFS_KEYS) {
      if ((prefsData as any)[key] !== undefined) {
        prefsUpdate[key] = (prefsData as any)[key];
      }
    }

    // enabledModules arrives as string[] — serialize to comma-separated string for storage
    if (parsed.data.enabledModules !== undefined) {
      prefsUpdate['enabledModules'] = parsed.data.enabledModules.join(',');
    }

    if (Object.keys(prefsUpdate).length > 0) {
      await prisma.userPreferences.upsert({
        where:  { userId },
        update: prefsUpdate,
        create: { userId, ...prefsUpdate },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
