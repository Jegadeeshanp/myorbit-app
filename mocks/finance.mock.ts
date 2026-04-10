import type { Page, Route } from '@playwright/test';
import { getFinanceFixture } from '../fixtures/finance.fixture';

const fixture = getFinanceFixture();

function jsonResponse(payload: unknown) {
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

export function mockFinanceApis(page: Page) {
  page.route('**/api/accounts', route => route.fulfill(jsonResponse(fixture.accounts)));
  page.route('**/api/transactions', route => {
    if (route.request().method() === 'GET') {
      return route.fulfill(jsonResponse(fixture.transactions));
    }
    return route.fulfill(jsonResponse(fixture.transactions[0]));
  });
  page.route('**/api/budgets', route => route.fulfill(jsonResponse(fixture.budgets)));
}
