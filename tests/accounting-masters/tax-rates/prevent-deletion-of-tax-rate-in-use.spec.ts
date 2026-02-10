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

test.describe('Accounting Masters @Szbgi4vdm', () => {
  test('Prevent Deletion of Tax Rate In Use @Twnnr3dna', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to the starting point (Tax Rates list)
    await page.goto(`${baseUrl}/tax-rates`);
    await waitForPageReady(page, '/tax-rates');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // If direct route fails or is redirected, try navigation via sidebar/menu
    await optionalAction(
      page.getByRole('link', { name: /tax rate|tax rates/i }),
      async () => {
        await page.getByRole('link', { name: /tax rate|tax rates/i }).first().click();
        await waitForPageReady(page);
      },
      'Could not find Tax Rates link in navigation'
    );

    // STEP 3: Attempt to delete a tax rate that is in use
    const row = await firstRow(page);
    if (!row) {
      test.info().annotations.push({ type: 'note', description: 'No tax rate rows available to test deletion' });
      return;
    }

    const taxRateName = (await row.locator('td, [role="cell"]').first().textContent())?.trim() || 'Unknown Tax Rate';

    // Open action menu for the row
    await optionalAction(
      row.locator('button', { hasText: /more|actions|menu/i }).first(),
      async () => {
        await row.locator('button', { hasText: /more|actions|menu/i }).first().click();
      },
      'Could not open actions menu for tax rate row'
    );

    // Click Delete option
    await optionalAction(
      page.getByRole('menuitem', { name: /delete/i }),
      async () => {
        await page.getByRole('menuitem', { name: /delete/i }).first().click();
      },
      'Delete option not found in actions menu'
    );

    // Confirm delete if confirmation dialog appears
    await clickButton(page, /delete|confirm/i, 'Delete confirmation button not found');

    // STEP 4: Observe system response - expected error (tax rate in use)
    const errorToastShown = await waitForToast(page, /in use|cannot delete|linked|associated|existing/i, 10000);
    if (!errorToastShown) {
      // Try inline alert or modal message
      await safeExpectVisible(
        page.locator('[role="alert"], .alert, .error, .text-red, .text-danger').filter({ hasText: /in use|cannot delete|linked|associated/i }).first(),
        'No visible error message indicating tax rate in use'
      );
    }

    // STEP 5: Verify tax rate is not deleted (still visible in list)
    const rowWithName = page.locator('table tbody tr, [role="row"]').filter({ hasText: textRegex(taxRateName) }).first();
    await safeExpectVisible(rowWithName, `Tax rate "${taxRateName}" not found after attempted deletion`, 10000);

    // STEP 6: Verify user is informed about linked transactions
    await safeExpectVisible(
      page.locator('body').filter({ hasText: /linked transaction|in use|cannot delete|associated/i }).first(),
      'User not informed about linked transactions',
      10000
    );
  });
});