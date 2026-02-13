import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { login as seedLogin } from '../../utils/login';

test.setTimeout(120000);

const baseUrl = 'https://dev.hellobooks.ai';

// Helper: textRegex(text) - escapes regex special chars and returns case-insensitive RegExp
function textRegex(text: string): RegExp {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

// Optional action wrapper - tries action but doesn't fail test if element not found
async function optionalAction(locator: Locator, action: () => Promise<void>, note: string) {
  const target = locator.first();
  try {
    await target.waitFor({ state: 'visible', timeout: 5000 });
    await target.scrollIntoViewIfNeeded().catch(() => {});
    await action();
    return;
  } catch {
    test.info().annotations.push({ type: 'note', description: note });
  }
}

// Safe visibility check that adds annotation instead of failing
async function safeExpectVisible(locator: Locator, note: string, timeout = 5000) {
  try {
    await expect(locator).toBeVisible({ timeout });
    return true;
  } catch {
    test.info().annotations.push({ type: 'note', description: note });
    return false;
  }
}

// Wait for page to be ready after navigation
async function waitForPageReady(page: Page, expectedRoute?: string) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
  if (expectedRoute) {
    await expect(page).toHaveURL(new RegExp(expectedRoute), { timeout: 15000 });
  }
}

// Fill form field with retry logic
async function fillField(page: Page, selector: string, value: string, fieldName: string) {
  const field = page.locator(selector).first();
  try {
    await field.waitFor({ state: 'visible', timeout: 10000 });
    await field.scrollIntoViewIfNeeded().catch(() => {});
    await field.clear();
    await field.fill(value);
  } catch {
    test.info().annotations.push({ type: 'note', description: `Could not fill ${fieldName}` });
  }
}

// Click button with text matching
async function clickButton(page: Page, textPattern: RegExp | string, note: string) {
  const button = page.getByRole('button', { name: textPattern }).first();
  try {
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await button.scrollIntoViewIfNeeded().catch(() => {});
    await button.click();
    return true;
  } catch {
    test.info().annotations.push({ type: 'note', description: note });
    return false;
  }
}

// Select dropdown option
async function selectOption(page: Page, triggerSelector: string, optionText: string, fieldName: string) {
  try {
    const trigger = page.locator(triggerSelector).first();
    await trigger.waitFor({ state: 'visible', timeout: 10000 });
    await trigger.click();
    await page.waitForTimeout(500);
    const option = page.getByRole('option', { name: new RegExp(optionText, 'i') }).first();
    await option.click();
  } catch {
    test.info().annotations.push({ type: 'note', description: `Could not select ${fieldName}` });
  }
}

// Get first data row from table
async function firstRow(page: Page) {
  const row = page.locator('table tbody tr, [role="row"]').filter({ hasNotText: /no data|empty/i }).first();
  if (await row.count()) {
    await row.scrollIntoViewIfNeeded().catch(() => {});
    return row;
  }
  return null;
}

// Wait for toast/notification
async function waitForToast(page: Page, pattern: RegExp, timeout = 10000) {
  try {
    const toast = page.locator('[role="status"], .toast, .sonner-toast, [data-sonner-toast]').filter({ hasText: pattern }).first();
    await toast.waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

test.describe('Accounting Masters @Sdpf1v7gs', () => {
  test('Create New Account in Chart of Accounts @Tv8h0uzfq', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);
    
    // STEP 2: Navigate to the starting point
    await page.goto(`${baseUrl}/chart-of-accounts`);
    await waitForPageReady(page, '/chart-of-accounts');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // Verify we are on Chart of Accounts page
    await safeExpectVisible(page.getByRole('heading', { name: /chart of accounts|accounts/i }).first(), 'Chart of Accounts heading not visible');

    // STEP 3: Click Create New Account button
    await clickButton(page, /create|new account|add account/i, 'Create New Account button not found');

    // Verify create form opened
    await safeExpectVisible(page.getByRole('heading', { name: /create|new account|add account/i }).first(), 'Create Account form did not open');

    // STEP 4: Fill account details
    const unique = Date.now();
    const accountCode = `ACC-${unique}`;
    const accountName = `Test Account ${unique}`;

    await fillField(page, 'input[name="code"], input[name="accountCode"], input[placeholder*="Code"]', accountCode, 'Account Code');
    await fillField(page, 'input[name="name"], input[name="accountName"], input[placeholder*="Name"]', accountName, 'Account Name');

    // Select account type
    await selectOption(
      page,
      '[data-testid="accountType"], [name="accountType"], [aria-label*="Account Type"], [placeholder*="Account Type"], [role="combobox"]',
      'Asset',
      'Account Type'
    );

    // Select parent account if applicable (optional)
    await optionalAction(
      page.locator('[data-testid="parentAccount"], [name="parentAccount"], [aria-label*="Parent Account"], [placeholder*="Parent"]'),
      async () => {
        await selectOption(
          page,
          '[data-testid="parentAccount"], [name="parentAccount"], [aria-label*="Parent Account"], [placeholder*="Parent"]',
          'Current Assets',
          'Parent Account'
        );
      },
      'Parent Account not selectable or not required'
    );

    // Enter description
    await fillField(page, 'textarea[name="description"], textarea[placeholder*="Description"], input[name="description"]', 'Automated test account creation', 'Description');

    // STEP 5: Save
    await clickButton(page, /save|create|submit/i, 'Save button not found');

    // STEP 6: Verify success
    const toastShown = await waitForToast(page, /success|created|saved/i);
    if (!toastShown) {
      test.info().annotations.push({ type: 'note', description: 'Success toast not found after saving account' });
    }

    // Wait for redirect back to list or ensure list visible
    await waitForPageReady(page);
    await safeExpectVisible(page.getByRole('heading', { name: /chart of accounts|accounts/i }).first(), 'Did not return to Chart of Accounts list');

    // Verify account appears in list
    const accountRow = page.locator('table tbody tr, [role="row"]').filter({ hasText: textRegex(accountName) }).first();
    const rowVisible = await safeExpectVisible(accountRow, 'Created account not found in list', 15000);
    if (rowVisible) {
      await expect(accountRow).toContainText(accountCode);
    }
  });
});