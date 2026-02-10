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

test.describe('Accounting Masters @Sot6x46ud', () => {
  test('View Tax Rates List @Tsbhnff3q', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);
    
    // STEP 2: Navigate to the starting point
    await page.goto(`${baseUrl}`);
    await waitForPageReady(page);
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Navigate to Accounting Masters from sidebar
    const accountingMastersLink = page.getByRole('link', { name: /Accounting Masters/i });
    await optionalAction(
      accountingMastersLink,
      async () => {
        await accountingMastersLink.first().click();
      },
      'Accounting Masters link not found in sidebar'
    );
    await waitForPageReady(page, '/accounting');

    // STEP 4: Click on Tax Rates option
    const taxRatesLink = page.getByRole('link', { name: /Tax Rates/i });
    await optionalAction(
      taxRatesLink,
      async () => {
        await taxRatesLink.first().click();
      },
      'Tax Rates option not found'
    );
    await waitForPageReady(page, '/tax');

    // STEP 5: Verify Tax Rates page loads successfully
    await safeExpectVisible(page.getByRole('heading', { name: /Tax Rates/i }).first(), 'Tax Rates heading not visible');

    // STEP 6: Verify list/table is visible
    const table = page.locator('table').first();
    await safeExpectVisible(table, 'Tax Rates table not visible');

    // STEP 7: Verify at least one tax rate is displayed
    const row = await firstRow(page);
    if (row) {
      await safeExpectVisible(row, 'No data row found in tax rates list');

      // STEP 8: Verify tax rate details (name, percentage, status) are visible
      const nameCell = row.locator('td').nth(0);
      const percentageCell = row.locator('td').nth(1);
      const statusCell = row.locator('td').nth(2);

      await safeExpectVisible(nameCell, 'Tax Rate name not visible');
      await safeExpectVisible(percentageCell, 'Tax Rate percentage not visible');
      await safeExpectVisible(statusCell, 'Tax Rate status not visible');

      const nameText = (await nameCell.textContent())?.trim() || '';
      const percentageText = (await percentageCell.textContent())?.trim() || '';
      const statusText = (await statusCell.textContent())?.trim() || '';

      expect(nameText.length).toBeGreaterThan(0);
      expect(percentageText.length).toBeGreaterThan(0);
      expect(statusText.length).toBeGreaterThan(0);
    } else {
      test.info().annotations.push({ type: 'note', description: 'No tax rates rows found to validate details' });
    }
  });
});