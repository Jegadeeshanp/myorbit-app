/**
 * lib/processRecurring.ts
 * Shared logic for processing overdue recurring templates.
 * Used by both the daily cron (all users) and the per-user process endpoint.
 */

import { prisma } from '@/lib/prisma';
import { encryptNumber, decryptNumber } from '@/lib/encryption';
import { nextFinanceDate } from '@/lib/financeRecurrence';
import type { RecurringConfig } from '@/lib/financeData';

/**
 * Process all overdue RecurringTransaction templates for the given userId
 * (pass null to process ALL users — cron-only use case).
 *
 * For each due template it:
 *   1. Creates a Transaction record (or InvestmentTransaction for asset SIP).
 *   2. Adjusts the linked account balance.
 *   3. Recalculates budget spent (current-month expenses only).
 *   4. Advances nextDate, or deletes the template if the end condition is met.
 *
 * Returns the number of occurrences spawned.
 */
export async function processRecurring(userId: string | null): Promise<number> {
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local time

  const where: any = { nextDate: { lte: today } };
  if (userId) where.userId = userId;

  const due = await prisma.recurringTransaction.findMany({ where });

  let spawned = 0;

  for (const template of due) {
    const {
      userId: tUserId, accountId, assetId, category, description, notes,
      amount: encAmount, type, recurringConfig, nextDate, occurrenceCount,
    } = template;

    const cfg: RecurringConfig = JSON.parse(recurringConfig);
    const txAmount = await decryptNumber(encAmount); // signed: negative for expenses

    // ── 1a. Asset SIP: create InvestmentTransaction ───────────────────────
    if (assetId && type === 'SIP') {
      await prisma.investmentTransaction.create({
        data: {
          assetId,
          userId: tUserId,
          type: 'SIP',
          amount: await encryptNumber(Math.abs(txAmount)), // always stored positive
          date: nextDate,
          note: notes ?? null,
        },
      });
    } else {
      // ── 1b. Regular recurring: create Transaction record ─────────────────
      await prisma.transaction.create({
        data: {
          userId: tUserId,
          accountId: accountId ?? null,
          date: nextDate,
          category,
          description,
          notes: notes ?? null,
          amount: encAmount,
          type,
        },
      });
    }
    spawned++;

    // ── 2. Update linked account balance ────────────────────────────────────
    if (accountId && (type === 'income' || type === 'expense' || type === 'SIP')) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId: tUserId },
      });
      if (account) {
        const currentBalance = await decryptNumber(account.balance);
        // For SIP/expense: txAmount is negative → reduces balance; income: positive → increases
        const delta = type === 'SIP' ? -Math.abs(txAmount) : txAmount;
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: await encryptNumber(currentBalance + delta) },
        });
      }
    }

    // ── 3. Recalculate budget spent (current-month expense only) ────────────
    if (type === 'expense') {
      const txDate = new Date(nextDate);
      const now = new Date();
      const isCurrentMonth =
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear();

      if (isCurrentMonth) {
        const budgets = await prisma.budget.findMany({ where: { userId: tUserId } });
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const monthEnd   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;
        const monthTxRows = await prisma.transaction.findMany({
          where: { userId: tUserId, type: 'expense', date: { gte: monthStart, lte: monthEnd } },
        });
        const monthTx = await Promise.all(
          monthTxRows.map(async r => ({
            category: r.category,
            amount: await decryptNumber(r.amount),
          }))
        );

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

    // ── 4. Advance nextDate or delete template ──────────────────────────────
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

  return spawned;
}
