import { prisma } from '@/lib/prisma';
import { decryptNumber, encryptNumber } from '@/lib/encryption';

type BalanceTransaction = {
  accountId?: string | null;
  date: string;
  amount: number;
  type: string;
};

function isPastOrToday(date: string) {
  return date <= new Date().toLocaleDateString('en-CA');
}

export function affectsAccountBalance(tx: BalanceTransaction) {
  return (
    !!tx.accountId
    && isPastOrToday(tx.date)
    && (tx.type === 'income' || tx.type === 'expense' || tx.type === 'transfer')
  );
}

export async function applyAccountBalanceDelta(userId: string, accountId: string, delta: number) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new Error('Account not found');

  const balance = await decryptNumber(account.balance);
  const updated = await prisma.account.update({
    where: { id: accountId },
    data: { balance: await encryptNumber(balance + delta) },
  });

  return {
    id: updated.id,
    name: updated.name,
    type: updated.type,
    balance: balance + delta,
    creditLimit: updated.creditLimit ? await decryptNumber(updated.creditLimit) : undefined,
  };
}

export async function applyTransactionBalanceDelta(userId: string, tx: BalanceTransaction, multiplier = 1) {
  if (!affectsAccountBalance(tx) || !tx.accountId) return null;
  return applyAccountBalanceDelta(userId, tx.accountId, tx.amount * multiplier);
}
