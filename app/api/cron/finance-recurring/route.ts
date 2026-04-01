/**
 * app/api/cron/finance-recurring/route.ts
 *
 * Daily cron job that fires all recurring finance transaction templates whose
 * nextDate has arrived.  For each due template it:
 *   1. Creates a Transaction record.
 *   2. Adjusts the linked account balance (income → +, expense → −).
 *   3. Recalculates the `spent` field for all matching budgets (current month only).
 *   4. Advances nextDate to the following occurrence, or deletes the template if
 *      the end condition has been reached.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptNumber, decryptNumber } from '@/lib/encryption';
import { nextFinanceDate } from '@/lib/financeRecurrence';
import type { RecurringConfig } from '@/lib/financeData';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local time

    // Find all templates whose nextDate is today or overdue
    const due = await prisma.recurringTransaction.findMany({
      where: { nextDate: { lte: today } },
    });

    let spawned = 0;

    for (const template of due) {
      const { userId, accountId, category, description, notes, amount: encAmount, type, recurringConfig, nextDate, occurrenceCount } = template;

      const cfg: RecurringConfig = JSON.parse(recurringConfig);

      // ── 1. Create the Transaction record ─────────────────────────────────
      const tx = await prisma.transaction.create({
        data: {
          userId,
          accountId: accountId ?? null,
          date: nextDate,
          category,
          description,
          notes: notes ?? null,
          amount: encAmount,
          type,
        },
      });
      spawned++;

      const txAmount = await decryptNumber(encAmount);

      // ── 2. Update linked account balance ──────────────────────────────────
      if (accountId && (type === 'income' || type === 'expense')) {
        const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
        if (account) {
          const currentBalance = await decryptNumber(account.balance);
          const newBalance = currentBalance + txAmount; // amount is signed (+income, −expense)
          await prisma.account.update({
            where: { id: accountId },
            data: { balance: await encryptNumber(newBalance) },
          });
        }
      }

      // ── 3. Recalculate budget spent (current-month expense transactions) ──
      if (type === 'expense') {
        const txDate = new Date(nextDate);
        const now = new Date();
        const isCurrentMonth =
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear();

        if (isCurrentMonth) {
          const budgets = await prisma.budget.findMany({ where: { userId } });

          // Fetch all current-month expense transactions (including the one just created)
          const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
          const monthEnd   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;
          const monthTxRows = await prisma.transaction.findMany({
            where: { userId, type: 'expense', date: { gte: monthStart, lte: monthEnd } },
          });
          const monthTx = await Promise.all(monthTxRows.map(async r => ({
            category: r.category,
            amount: await decryptNumber(r.amount),
          })));

          for (const budget of budgets) {
            const cats = budget.category
              ? budget.category.split(',').map(c => c.trim()).filter(Boolean)
              : [];
            const recalcSpent = monthTx
              .filter(t => cats.includes(t.category) || budget.name === t.category)
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            if (Math.round(recalcSpent) !== budget.spent) {
              await prisma.budget.update({
                where: { id: budget.id },
                data: { spent: Math.round(recalcSpent) },
              });
            }
          }
        }
      }

      // ── 4. Advance nextDate or delete template ────────────────────────────
      const newCount = occurrenceCount + 1;
      const newNextDate = nextFinanceDate(nextDate, cfg.frequency, cfg.customInterval);

      const endReached =
        !newNextDate
        || (cfg.endType === 'on_date' && cfg.endDate && newNextDate > cfg.endDate)
        || (cfg.endType === 'after' && typeof cfg.endAfterTimes === 'number' && newCount >= cfg.endAfterTimes);

      if (endReached) {
        await prisma.recurringTransaction.delete({ where: { id: template.id } });
      } else {
        await prisma.recurringTransaction.update({
          where: { id: template.id },
          data: { nextDate: newNextDate!, occurrenceCount: newCount },
        });
      }
    }

    return NextResponse.json({ ok: true, spawned });
  } catch (e: any) {
    console.error('[finance-recurring cron] error:', e);
    return NextResponse.json({ error: e.message ?? 'Server error' }, { status: 500 });
  }
}
