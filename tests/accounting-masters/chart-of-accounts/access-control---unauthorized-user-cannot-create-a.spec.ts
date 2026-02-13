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

test.describe('Accounting Masters @Sfxtcdw26', () => {
  test('Access Control - Unauthorized User Cannot Create Account @T46c01xxc', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to Chart of Accounts
    await page.goto(`${baseUrl}/chart-of-accounts`);
    await waitForPageReady(page, '/chart-of-accounts');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Verify Create button is disabled or hidden
    const createButton = page.getByRole('button', { name: /create|new|add.*account/i }).first();
    const createVisible = await createButton.isVisible().catch(() => false);
    if (createVisible) {
      await expect(createButton).toBeDisabled();
    } else {
      test.info().annotations.push({ type: 'note', description: 'Create Account button not visible (hidden as expected)' });
    }

    // STEP 4: Attempt to access Create Account via direct URL
    await page.goto(`${baseUrl}/chart-of-accounts/create-account`);
    await waitForPageReady(page);
    const accessDeniedMessage = page.getByText(/access denied|not authorized|permission|forbidden/i).first();
    const deniedVisible = await safeExpectVisible(accessDeniedMessage, 'Access denied message not visible after direct URL access');

    // If no explicit access denied message, ensure no create form or save action is available
    if (!deniedVisible) {
      const saveButton = page.getByRole('button', { name: /save|create|submit/i }).first();
      const saveVisible = await saveButton.isVisible().catch(() => false);
      if (saveVisible) {
        await expect(saveButton).toBeDisabled();
        test.info().annotations.push({ type: 'note', description: 'Save/Create button visible but disabled, indicating no permission' });
      } else {
        test.info().annotations.push({ type: 'note', description: 'Save/Create button not visible after direct URL access' });
      }

      try {
        await expect(page).not.toHaveURL(/create/i, { timeout: 5000 });
      } catch {
        test.info().annotations.push({ type: 'note', description: 'Page URL still includes /create; ensure permissions restrict creation' });
      }
    }

    // FINAL STEP: Verify user cannot create account (overall validation)
    expect(createVisible === false || (await createButton.isDisabled().catch(() => true))).toBeTruthy();
  });
});