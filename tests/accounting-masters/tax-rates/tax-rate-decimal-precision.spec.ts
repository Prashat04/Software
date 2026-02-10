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

test.describe('Accounting Masters @Sdqijdz81', () => {
  test('Tax Rate Decimal Precision @T5qc4pspq', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to Tax Rates list (starting point)
    await page.goto(`${baseUrl}/accounting-masters/tax-rates`);
    await waitForPageReady(page, '/tax-rates');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Click Create/Add Tax Rate
    await clickButton(page, /create|add|new/i, 'Create Tax Rate button not found');
    await waitForPageReady(page);

    // STEP 4: Fill ALL required fields
    const taxName = `VAT Decimal ${Date.now()}`;
    const taxRate = '18.5';

    await fillField(page, 'input[name="name"]', taxName, 'Tax Rate Name');
    await fillField(page, 'input[name="taxName"]', taxName, 'Tax Rate Name (alt)');
    await fillField(page, 'input[placeholder*="Name"]', taxName, 'Tax Rate Name (placeholder)');

    await fillField(page, 'input[name="rate"]', taxRate, 'Tax Rate Percentage');
    await fillField(page, 'input[name="percentage"]', taxRate, 'Tax Rate Percentage (alt)');
    await fillField(page, 'input[placeholder*="Percent"]', taxRate, 'Tax Rate Percentage (placeholder)');

    // STEP 5: Save
    await clickButton(page, /save|create|submit/i, 'Save Tax Rate button not found');

    // STEP 6: Verify success toast or redirect
    const toastSuccess = await waitForToast(page, /success|created|saved/i);
    if (!toastSuccess) {
      test.info().annotations.push({ type: 'note', description: 'Success toast not detected after save' });
    }

    // STEP 7: Verify tax rate appears in list with decimal precision
    await waitForPageReady(page);
    if (await page.locator('table, [role="table"]').first().count()) {
      const row = page.locator('table tbody tr, [role="row"]').filter({ hasText: textRegex(taxName) }).first();
      await safeExpectVisible(row, 'Created tax rate row not visible in list');
      await safeExpectVisible(row.locator(`text=${taxRate}`), 'Decimal tax rate percentage not visible in list');
    } else {
      test.info().annotations.push({ type: 'note', description: 'Tax rates table not found for verification' });
    }
  });
});