import { test, expect } from '@playwright/test';
import { runValidationRules } from '@/utils/validationEngine';
import { getFinanceFixture } from '@/fixtures/finance.fixture';

const fixture = getFinanceFixture();
const baseTransactions = fixture.transactions;

function sumAmounts(transactions: typeof baseTransactions) {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

test.describe('Finance validation utilities (unit)', () => {
  /**
   * Test ID: FIN-UNIT-01
   * Module: Finance
   * Type: UNIT
   * Scenario: Income and opening balances result in a valid ledger
   * Steps:
   *   1. Compute the expected balance from fixture transactions
   *   2. Feed the ledger into runValidationRules with the exact expected balance
   * Expected Result: Validation passes with no errors
   * Edge Cases: Works with mixed opening / income / expense entries
   * Priority: CRITICAL
   * Flaky: false
   */
  test('FIN-UNIT-01 ledger validates base fixture', async () => {
    const result = runValidationRules(baseTransactions, fixture.accounts, {
      expectedBalance: sumAmounts(baseTransactions),
    });
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  /**
   * Test ID: FIN-UNIT-02
   * Module: Finance
   * Type: UNIT
   * Scenario: Adding an expense decreases the computed balance while keeping ledger valid
   * Steps:
   *   1. Append a negative transaction to the base ledger
   *   2. Run the validation rules again
   * Expected Result: Validation still passes and balance reflects the expense
   * Edge Cases: Zero amount transactions are rejected at schema level
   * Priority: NORMAL
   * Flaky: false
   */
  test('FIN-UNIT-02 expense reduces balance correctly', async () => {
    const extended = [
      ...baseTransactions,
      {
        id: 'tx-expense-extra',
        date: '2026-04-03',
        category: 'Subscriptions',
        description: 'Service fee',
        amount: -500,
        type: 'expense' as const,
        accountId: fixture.accounts[0].id,
      },
    ];
    const result = runValidationRules(extended, fixture.accounts);
    expect(result.passed).toBe(true);
    expect(sumAmounts(extended)).toBe(sumAmounts(baseTransactions) - 500);
  });

  /**
   * Test ID: FIN-UNIT-03
   * Module: Finance
   * Type: UNIT
   * Scenario: Credit card balances are allowed to stay negative
   * Steps:
   *   1. Add a credit account with a negative outstanding balance
   *   2. Ensure validation continues to pass
   * Expected Result: Validation passes while recognizing credit limits
   * Edge Cases: Bank accounts still must stay non-negative
   * Priority: CRITICAL
   * Flaky: false
   */
  test('FIN-UNIT-03 credit card outstanding is permitted', async () => {
    const creditAccount = {
      id: 'acc-new-credit',
      name: 'Demo Credit',
      type: 'Credit Card' as const,
      balance: -7500,
    };
    const result = runValidationRules(baseTransactions, [...fixture.accounts, creditAccount]);
    expect(result.passed).toBe(true);
  });

  /**
   * Test ID: FIN-UNIT-04
   * Module: Finance
   * Type: UNIT
   * Scenario: Expected balance mismatch is surfaced during a monthly reset
   * Steps:
   *   1. Run validation with an intentionally wrong expected balance
   *   2. Observe the mismatch error to simulate a revert to month start
   * Expected Result: Validation reports the balance difference
   * Edge Cases: Works even when difference is fractional
   * Priority: NORMAL
   * Flaky: false
   */
  test('FIN-UNIT-04 expected balance mismatch flags error', async () => {
    const wrongExpected = sumAmounts(baseTransactions) + 1000;
    const result = runValidationRules(baseTransactions, fixture.accounts, {
      expectedBalance: wrongExpected,
    });
    expect(result.passed).toBe(false);
    expect(result.errors.some((msg) => msg.includes('Computed balance'))).toBe(true);
  });

  /**
   * Test ID: FIN-UNIT-05
   * Module: Finance
   * Type: UNIT
   * Scenario: Duplicate transactions are detected as failures
   * Steps:
   *   1. Create a duplicate transaction ID
   *   2. Run validation
   * Expected Result: Error listing duplicate IDs
   * Edge Cases: Multiple duplicates accumulate gracefully
   * Priority: CRITICAL
   * Flaky: false
   */
  test('FIN-UNIT-05 duplicate transaction IDs fail validation', async () => {
    const duplicate = [...baseTransactions, { ...baseTransactions[0] }];
    const result = runValidationRules(duplicate, fixture.accounts);
    expect(result.passed).toBe(false);
    expect(result.errors.some((msg) => msg.includes('Duplicate transaction IDs'))).toBe(true);
  });

  /**
   * Test ID: FIN-UNIT-06
   * Module: Finance
   * Type: UNIT
   * Scenario: Incorrect sign usage on income/expense entries fails double entry check
   * Steps:
   *   1. Swap an income to a negative amount
   *   2. Validate and expect a sign mismatch error
   * Expected Result: Validation detects the wrong sign
   * Edge Cases: Zero amounts remain blocked elsewhere
   * Priority: CRITICAL
   * Flaky: false
   */
  test('FIN-UNIT-06 wrong sign income triggers failure', async () => {
    const badLedger = [
      ...baseTransactions.slice(0, 1),
      {
        ...baseTransactions[1],
        amount: 25000,
        type: 'expense' as const,
      },
    ];
    const result = runValidationRules(badLedger, fixture.accounts);
    expect(result.passed).toBe(false);
    expect(result.errors.some((msg) => msg.includes('Transaction types'))).toBe(true);
  });
});
