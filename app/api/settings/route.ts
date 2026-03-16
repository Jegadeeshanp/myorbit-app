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
        currency: prefs?.currency ?? 'INR',
        theme:    prefs?.theme    ?? 'system',
        locale:   prefs?.locale   ?? 'en-IN',
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

    const { name, currency, theme, locale } = parsed.data;

    // Update display name if provided
    if (name) {
      await prisma.user.update({ where: { id: userId }, data: { name: name.trim() } });
    }

    // Persist preferences via upsert on UserPreferences table
    const prefUpdates: Record<string, string> = {};
    if (currency) prefUpdates.currency = currency;
    if (theme)    prefUpdates.theme    = theme;
    if (locale)   prefUpdates.locale   = locale;

    if (Object.keys(prefUpdates).length > 0) {
      await prisma.userPreferences.upsert({
        where:  { userId },
        create: { userId, ...prefUpdates },
        update: prefUpdates,
      });
    }

    return NextResponse.json({ ok: true, updated: parsed.data });
  } catch (e: any) {
    if (e.message === 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
