import { test, expect, type Page } from '@playwright/test';
import { formatINR } from '@/lib/currency';
import { mockFinanceApis } from '@/mocks/finance.mock';
import { getFinanceFixture } from '@/fixtures/finance.fixture';

const fixture = getFinanceFixture();

const credentials = {
  email: 'testuser@gmail.com',
  password: 'Test@1234',
};

async function signIn(page: Page) {
  await page.goto('http://127.0.0.1:3000/signin');
  await page.getByLabel('Email').fill(credentials.email);
  await page.locator('#password').fill(credentials.password);
  await Promise.all([
    page.waitForNavigation({ url: 'http://127.0.0.1:3000/orbit', waitUntil: 'networkidle' }),
    page.getByRole('button', { name: 'Sign In' }).click(),
  ]);
}

test.describe('Finance overview flows (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    mockFinanceApis(page);
    await page.goto('http://127.0.0.1:3000/orbit/finance', { waitUntil: 'networkidle' });
  });

  test('FIN-E2E-01 overview hero renders', async ({ page }) => {
    await expect(page.getByText('Net Worth')).toBeVisible();
    await expect(page.getByText('Assets')).toBeVisible();
  });

  test('FIN-E2E-02 account cards exist', async ({ page }) => {
    await expect(page.getByText('Account Balance')).toBeVisible();
    await expect(page.getByText('Liabilities')).toBeVisible();
  });

  test('FIN-E2E-03 navigation links are present', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Assets/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Liabilities/i })).toBeVisible();
  });

  test('FIN-E2E-04 recent activity loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Recent Transactions/i })).toBeVisible();
  });

  test('FIN-E2E-05 upcoming bills section visible', async ({ page }) => {
    await expect(page.getByText('Upcoming Bills')).toBeVisible();
  });

  test('FIN-E2E-06 budget status tile renders', async ({ page }) => {
    await expect(page.getByText('Budget')).toBeVisible();
  });
});
