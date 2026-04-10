# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: finance\finance.e2e.spec.ts >> Finance overview flows (E2E) >> FIN-E2E-01 overview hero renders
- Location: tests\finance\finance.e2e.spec.ts:30:7

# Error details

```
Test timeout of 60000ms exceeded while running "beforeEach" hook.
```

```
Error: page.waitForNavigation: Test timeout of 60000ms exceeded.
=========================== logs ===========================
waiting for navigation to "http://127.0.0.1:3000/orbit" until "networkidle"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - link "⭑" [ref=e5] [cursor=pointer]:
          - /url: /
        - heading "Sign in to MyOrbit" [level=1] [ref=e6]
        - paragraph [ref=e7]: Access your dashboard and track your finances.
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Email
          - textbox "Email" [ref=e11]:
            - /placeholder: you@example.com
            - text: testuser@gmail.com
        - generic [ref=e12]:
          - generic [ref=e13]:
            - generic [ref=e14]: Password
            - link "Forgot password?" [ref=e15] [cursor=pointer]:
              - /url: /forgot-password
          - generic [ref=e16]:
            - textbox "Password" [ref=e17]:
              - /placeholder: ••••••••
              - text: Test@1234
            - button "Show password" [ref=e18]:
              - img [ref=e19]
        - button "Signing in…" [disabled] [ref=e22]
      - generic [ref=e23]:
        - text: Don't have an account?
        - link "Create one" [ref=e24] [cursor=pointer]:
          - /url: /signup
  - button "Open Next.js Dev Tools" [ref=e30] [cursor=pointer]:
    - generic [ref=e33]:
      - text: Compiling
      - generic [ref=e34]:
        - generic [ref=e35]: .
        - generic [ref=e36]: .
        - generic [ref=e37]: .
  - alert [ref=e38]
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
     |          ^ Error: page.waitForNavigation: Test timeout of 60000ms exceeded.
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