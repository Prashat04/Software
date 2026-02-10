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

test.describe('Accounting Masters @Ssjc30m5f', () => {
  test('Verify Conversion Balance Access Control @Tgfaektiy', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);
    
    // STEP 2: Navigate to the starting point
    await page.goto(`${baseUrl}/dashboard`);
    await waitForPageReady(page);
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Attempt to navigate to Accounting Masters from sidebar
    const accountingMastersMenu = page.getByRole('link', { name: textRegex('Accounting Masters') }).first();
    let menuVisible = false;
    try {
      await expect(accountingMastersMenu).toBeVisible({ timeout: 5000 });
      menuVisible = true;
    } catch {
      menuVisible = false;
      test.info().annotations.push({ type: 'note', description: 'Accounting Masters menu is not visible in sidebar (expected for restricted user)' });
    }

    if (menuVisible) {
      const ariaDisabled = await accountingMastersMenu.getAttribute('aria-disabled');
      const className = await accountingMastersMenu.getAttribute('class');
      const isDisabled = ariaDisabled === 'true' || /disabled|not-allowed|opacity-50/i.test(className || '');
      if (!isDisabled) {
        test.info().annotations.push({ type: 'note', description: 'Accounting Masters menu is visible but not clearly disabled' });
      }
      expect(isDisabled).toBeTruthy();
    }

    await optionalAction(
      accountingMastersMenu,
      async () => {
        await accountingMastersMenu.click();
        await waitForPageReady(page);
      },
      'Accounting Masters menu not clickable or not visible'
    );

    // If navigation occurred, ensure user was not able to access Accounting Masters
    if (/accounting-masters/i.test(page.url())) {
      const accessDeniedText = page.getByText(/access denied|not authorized|permission|forbidden/i).first();
      const denied = await safeExpectVisible(accessDeniedText, 'Access denied message not visible after sidebar navigation', 5000);
      if (!denied) {
        await expect(page).not.toHaveURL(/accounting-masters/i);
      }
    }

    // STEP 4: Try to access Conversion Balance directly via URL
    await page.goto(`${baseUrl}/accounting-masters/conversion-balance`);
    await waitForPageReady(page);

    // STEP 5: Verify access denied or redirect
    const accessDenied = page.getByText(/access denied|not authorized|permission|forbidden|restricted/i).first();
    const deniedVisible = await safeExpectVisible(accessDenied, 'Access denied message not visible for direct URL access', 7000);
    const toastDenied = await waitForToast(page, /access denied|not authorized|permission|forbidden|restricted/i, 7000);

    if (!deniedVisible && !toastDenied) {
      await expect(page).not.toHaveURL(/conversion-balance/i);
    }

    // FINAL STEP: Verify the operation completed successfully
    // Expected results already verified by menu visibility/disabled and direct URL access checks
  });
});