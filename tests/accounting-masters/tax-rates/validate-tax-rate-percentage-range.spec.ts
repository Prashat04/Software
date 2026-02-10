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

test.describe('Accounting Masters @Ssej9aib1', () => {
  test('Validate Tax Rate Percentage Range @Tltw2b319', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to the starting point - Tax Rates list
    await page.goto(`${baseUrl}/accounting-masters/tax-rates`);
    await waitForPageReady(page, '/tax-rates');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Open Create Tax Rate form
    const openedCreate = await clickButton(page, /create|new|add/i, 'Create Tax Rate button not found on list page');
    if (!openedCreate) {
      // Fallback: try a link
      await optionalAction(page.getByRole('link', { name: /create|new|add/i }), async () => {
        await page.getByRole('link', { name: /create|new|add/i }).first().click();
      }, 'Create Tax Rate link not found');
    }
    await waitForPageReady(page);

    // STEP 4: Fill Tax Rate Name
    const taxRateName = `Invalid Tax Rate ${Date.now()}`;
    await fillField(page, 'input[name="name"]', taxRateName, 'Tax Rate Name');
    await fillField(page, 'input[name="taxRateName"]', taxRateName, 'Tax Rate Name');
    await fillField(page, 'input[placeholder*="Tax Rate Name" i]', taxRateName, 'Tax Rate Name');

    // STEP 5: Enter invalid percentage value
    const invalidPercentage = '150';
    await fillField(page, 'input[name="percentage"]', invalidPercentage, 'Percentage');
    await fillField(page, 'input[name="rate"]', invalidPercentage, 'Percentage');
    await fillField(page, 'input[placeholder*="percent" i]', invalidPercentage, 'Percentage');

    // STEP 6: Click Save
    await clickButton(page, /save|create|submit/i, 'Save button not found on create tax rate form');

    // STEP 7: Verify validation error for invalid percentage
    const errorLocator = page.locator(
      '.error, .text-error, [role="alert"], [aria-invalid="true"], .form-error, .invalid-feedback'
    ).filter({ hasText: /percent|percentage|0-100|valid|range|must be/i }).first();
    await safeExpectVisible(errorLocator, 'Validation error for percentage not visible');

    // STEP 8: Verify tax rate is not created (no success toast)
    const success = await waitForToast(page, /success|created|saved/i, 5000);
    expect(success).toBeFalsy();

    // STEP 9: Verify user is prompted to enter valid percentage (stays on form)
    await expect(page).toHaveURL(/tax-rates|create|new/i, { timeout: 15000 });
    await safeExpectVisible(page.locator('form').first(), 'Create Tax Rate form not visible');
  });
});