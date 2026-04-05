# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: finance\finance.e2e.spec.ts >> Finance overview flows (E2E) >> FIN-E2E-03 navigation links are present
- Location: tests\finance\finance.e2e.spec.ts:40:7

# Error details

```
Error: page.waitForNavigation: Test ended.
=========================== logs ===========================
waiting for navigation to "http://127.0.0.1:3000/orbit" until "networkidle"
  navigated to "http://127.0.0.1:3000/orbit"
  "domcontentloaded" event fired
============================================================
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test';
  2  | import { formatINR } from '@/lib/currency';
  3  | import { mockFinanceApis } from '@/mocks/finance.mock';
  4  | import { getFinanceFixture } from '@/fixtures/finance.fixture';
  5  | 
  6  | const fixture = getFinanceFixture();
  7  | 
  8  | const credentials = {
  9  |   email: 'testuser@gmail.com',
  10 |   password: 'Test@1234',
  11 | };
  12 | 
  13 | async function signIn(page: Page) {
  14 |   await page.goto('http://127.0.0.1:3000/signin');
  15 |   await page.getByLabel('Email').fill(credentials.email);
  16 |   await page.locator('#password').fill(credentials.password);
  17 |   await Promise.all([
> 18 |     page.waitForNavigation({ url: 'http://127.0.0.1:3000/orbit', waitUntil: 'networkidle' }),
     |          ^ Error: page.waitForNavigation: Test ended.
  19 |     page.getByRole('button', { name: 'Sign In' }).click(),
  20 |   ]);
  21 | }
  22 | 
  23 | test.describe('Finance overview flows (E2E)', () => {
  24 |   test.beforeEach(async ({ page }) => {
  25 |     await signIn(page);
  26 |     mockFinanceApis(page);
  27 |     await page.goto('http://127.0.0.1:3000/orbit/finance', { waitUntil: 'networkidle' });
  28 |   });
  29 | 
  30 |   test('FIN-E2E-01 overview hero renders', async ({ page }) => {
  31 |     await expect(page.getByText('Net Worth')).toBeVisible();
  32 |     await expect(page.getByText('Assets')).toBeVisible();
  33 |   });
  34 | 
  35 |   test('FIN-E2E-02 account cards exist', async ({ page }) => {
  36 |     await expect(page.getByText('Account Balance')).toBeVisible();
  37 |     await expect(page.getByText('Liabilities')).toBeVisible();
  38 |   });
  39 | 
  40 |   test('FIN-E2E-03 navigation links are present', async ({ page }) => {
  41 |     await expect(page.getByRole('link', { name: /Assets/i })).toBeVisible();
  42 |     await expect(page.getByRole('link', { name: /Liabilities/i })).toBeVisible();
  43 |   });
  44 | 
  45 |   test('FIN-E2E-04 recent activity loads', async ({ page }) => {
  46 |     await expect(page.getByRole('heading', { name: /Recent Transactions/i })).toBeVisible();
  47 |   });
  48 | 
  49 |   test('FIN-E2E-05 upcoming bills section visible', async ({ page }) => {
  50 |     await expect(page.getByText('Upcoming Bills')).toBeVisible();
  51 |   });
  52 | 
  53 |   test('FIN-E2E-06 budget status tile renders', async ({ page }) => {
  54 |     await expect(page.getByText('Budget')).toBeVisible();
  55 |   });
  56 | });
  57 | 
```