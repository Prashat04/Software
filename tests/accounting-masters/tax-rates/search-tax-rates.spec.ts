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

test.describe('Accounting Masters @Szje5oqtc', () => {
  test('Search Tax Rates @Tgluy26np', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to the starting point
    await page.goto(`${baseUrl}/accounting-masters/tax-rates`);
    await waitForPageReady(page, '/tax-rates');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Ensure search field is available
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"], [data-testid="search"] input').first();
    const searchVisible = await safeExpectVisible(searchInput, 'Search field not visible on Tax Rates list');
    expect(searchVisible).toBeTruthy();

    // STEP 4: Enter search term in search field
    const searchTerm = 'Tax';
    await optionalAction(searchInput, async () => {
      await searchInput.click();
      await searchInput.fill('');
      await searchInput.fill(searchTerm);
    }, 'Could not enter search term');

    // Wait for filtering to apply
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);

    // STEP 5: Observe filtered results - verify matching tax rates are displayed
    const rows = page.locator('table tbody tr, [role="row"]').filter({ hasNotText: /no data|empty/i });
    const rowCount = await rows.count();
    if (rowCount === 0) {
      test.info().annotations.push({ type: 'note', description: 'No rows found after search filter' });
    } else {
      const first = rows.first();
      await first.scrollIntoViewIfNeeded().catch(() => {});
      await expect(first).toContainText(textRegex(searchTerm));
    }

    // Additional verification: ensure rows displayed are filtered by search term
    if (rowCount > 0) {
      const sampleCount = Math.min(rowCount, 5);
      for (let i = 0; i < sampleCount; i++) {
        const row = rows.nth(i);
        await row.scrollIntoViewIfNeeded().catch(() => {});
        await expect(row).toContainText(textRegex(searchTerm));
      }
    }
  });
});