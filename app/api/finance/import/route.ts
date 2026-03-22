import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { type, rows } = body as { type: 'assets' | 'transactions'; rows: any[] };

    if (type === 'assets') {
      const created = await Promise.all(rows.map(async (r: any) => {
        return prisma.asset.create({
          data: {
            userId,
            name: String(r.name || 'Unnamed'),
            category: String(r.category || 'Other'),
            value: await encryptNumber(Number(r.currentValue) || 0),
            invested: await encryptNumber(Number(r.invested) || 0),
            units: r.units != null ? Number(r.units) : null,
            investmentType: 'lump_sum',
          },
        });
      }));
      return NextResponse.json({ ok: true, count: created.length });
    }

    if (type === 'transactions') {
      const created = await Promise.all(rows.map(async (r: any) => {
        return prisma.transaction.create({
          data: {
            userId,
            date: String(r.date || new Date().toISOString().split('T')[0]),
            category: String(r.category || 'Other'),
            description: String(r.description || ''),
            amount: await encryptNumber(Math.abs(Number(r.amount)) || 0),
            type: r.type === 'credit' ? 'income' : 'expense',
          },
        });
      }));
      return NextResponse.json({ ok: true, count: created.length });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
