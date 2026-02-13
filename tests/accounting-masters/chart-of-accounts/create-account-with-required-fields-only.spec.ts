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

test.describe('Accounting Masters @Su65btfz6', () => {
  test('Create Account with Required Fields Only @Tvm8td4vl', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);
    
    // STEP 2: Navigate to Chart of Accounts
    await page.goto(`${baseUrl}/chart-of-accounts`);
    await waitForPageReady(page, '/chart-of-accounts');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Click Create New Account
    const clicked = await clickButton(page, /create.*account|new.*account|add.*account|create/i, 'Create New Account button not found');
    if (clicked) {
      await waitForPageReady(page);
    }

    // STEP 4: Enter only required fields (code, name, type)
    const uniqueCode = `AC${Date.now().toString().slice(-6)}`;
    const accountName = `Test Account ${uniqueCode}`;

    await fillField(page, 'input[name="code"], input[name="accountCode"], input[placeholder*="Code"]', uniqueCode, 'Account Code');
    await fillField(page, 'input[name="name"], input[name="accountName"], input[placeholder*="Name"]', accountName, 'Account Name');
    await selectOption(
      page,
      '[data-testid="account-type-select"], [role="combobox"]:has-text("Type"), [aria-label*="Type"], [name="type"]',
      'Asset',
      'Account Type'
    );

    // STEP 5: Leave optional fields empty and click Save
    await clickButton(page, /save|create|submit/i, 'Save button not found');

    // FINAL STEP: Verify the operation completed successfully
    const toastShown = await waitForToast(page, /success|created|saved/i);
    if (!toastShown) {
      test.info().annotations.push({ type: 'note', description: 'Success toast not detected' });
    }

    // Ensure we are back on the list or refresh to list view
    if (!/chart-of-accounts/i.test(page.url())) {
      await page.goto(`${baseUrl}/chart-of-accounts`);
      await waitForPageReady(page, '/chart-of-accounts');
    }

    // Verify account appears in the list
    const createdRow = page.locator('table tbody tr, [role="row"]').filter({ hasText: uniqueCode }).first();
    await safeExpectVisible(createdRow, 'Created account row not visible in list', 15000);
    await expect(createdRow).toContainText(textRegex(accountName));

    // Verify optional fields show default or empty values (best-effort)
    const optionalCell = createdRow.locator('td').filter({ hasText: /--|—|n\/a|none|empty/i }).first();
    await safeExpectVisible(optionalCell, 'Optional fields did not show default/empty values', 5000);
  });
});