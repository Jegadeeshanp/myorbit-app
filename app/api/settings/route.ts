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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Return user data + sensible defaults for preferences
    // In a future version, store preferences in a separate UserPreferences table
    return NextResponse.json({
      profile: {
        id:        user.id,
        name:      user.name,
        email:     user.email,
        createdAt: user.createdAt,
      },
      preferences: {
        currency: 'INR',    // Default for Indian users
        theme:    'system',
        locale:   'en-IN',
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

    const updates: Record<string, unknown> = {};
    if (parsed.data.name) updates.name = parsed.data.name.trim();

    // Update name in DB if provided
    if (Object.keys(updates).length > 0) {
      await prisma.user.update({ where: { id: userId }, data: updates });
    }

    // Preferences (currency, theme, locale) will be stored client-side
    // until a UserPreferences table is added to the schema
    return NextResponse.json({ ok: true, updated: parsed.data });
  } catch (e: any) {
    if (e.message === 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
