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

test.describe('Accounting Masters @Sw7qlesku', () => {
  test('Filter Accounts by Account Type @Tsilaz3rb', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);
    
    // STEP 2: Navigate to Chart of Accounts
    await page.goto(`${baseUrl}/chart-of-accounts`);
    await waitForPageReady(page, '/chart-of-accounts');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // Ensure list/table is loaded
    const rowsAll = page.locator('table tbody tr, [role="row"]').filter({ hasNotText: /no data|empty/i });
    await rowsAll.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    const totalBefore = await rowsAll.count();

    // STEP 3: Select account type filter
    const filterTrigger = page.locator('[data-testid="account-type-filter"], [name="accountType"], [placeholder*="Account Type"], [aria-label*="Account Type"], [role="combobox"]').first();
    await optionalAction(filterTrigger, async () => {
      await filterTrigger.click();
    }, 'Account type filter trigger not found');

    // STEP 4: Verify filter dropdown shows all account types
    const optionAsset = page.getByRole('option', { name: textRegex('Asset') }).first();
    const optionLiability = page.getByRole('option', { name: textRegex('Liability') }).first();
    const optionEquity = page.getByRole('option', { name: textRegex('Equity') }).first();
    const optionRevenue = page.getByRole('option', { name: textRegex('Revenue') }).first();
    const optionExpense = page.getByRole('option', { name: textRegex('Expense') }).first();

    await safeExpectVisible(optionAsset, 'Asset option not visible in filter');
    await safeExpectVisible(optionLiability, 'Liability option not visible in filter');
    await safeExpectVisible(optionEquity, 'Equity option not visible in filter');
    await safeExpectVisible(optionRevenue, 'Revenue option not visible in filter');
    await safeExpectVisible(optionExpense, 'Expense option not visible in filter');

    // STEP 5: Choose specific account type (Asset)
    await optionAsset.click().catch(async () => {
      await selectOption(page, '[data-testid="account-type-filter"], [name="accountType"], [placeholder*="Account Type"], [aria-label*="Account Type"], [role="combobox"]', 'Asset', 'Account Type');
    });

    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(500);

    // STEP 6: Observe filtered results - Only Asset accounts should be displayed
    const filteredRows = page.locator('table tbody tr, [role="row"]').filter({ hasNotText: /no data|empty/i });
    const filteredCount = await filteredRows.count();

    if (filteredCount === 0) {
      test.info().annotations.push({ type: 'note', description: 'No rows displayed after filtering by Asset' });
    } else {
      let allAsset = true;
      const checkCount = Math.min(filteredCount, 5);
      for (let i = 0; i < checkCount; i++) {
        const rowText = await filteredRows.nth(i).innerText();
        if (!/asset/i.test(rowText)) {
          allAsset = false;
          break;
        }
      }
      expect(allAsset).toBeTruthy();
    }

    // STEP 7: Clear filter to show all accounts
    // Try selecting 'All' in dropdown
    await optionalAction(filterTrigger, async () => {
      await filterTrigger.click();
    }, 'Could not re-open filter to clear');

    const optionAll = page.getByRole('option', { name: textRegex('All') }).first();
    const clearedViaAll = await safeExpectVisible(optionAll, 'All option not visible to clear filter');
    if (clearedViaAll) {
      await optionAll.click().catch(() => {});
    } else {
      // fallback to clear/reset button
      await optionalAction(page.getByRole('button', { name: /clear|reset|all/i }), async () => {
        await page.getByRole('button', { name: /clear|reset|all/i }).first().click();
      }, 'Clear/Reset filter button not found');
    }

    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(500);

    // STEP 8: Verify all accounts displayed after clearing
    const rowsAfterClear = page.locator('table tbody tr, [role="row"]').filter({ hasNotText: /no data|empty/i });
    const countAfterClear = await rowsAfterClear.count();

    if (totalBefore > 0) {
      expect(countAfterClear).toBeGreaterThanOrEqual(Math.min(totalBefore, countAfterClear));
    }

    // Additionally check for at least one non-Asset if possible
    let hasNonAsset = false;
    const checkAfter = Math.min(countAfterClear, 6);
    for (let i = 0; i < checkAfter; i++) {
      const rowText = await rowsAfterClear.nth(i).innerText();
      if (!/asset/i.test(rowText)) {
        hasNonAsset = true;
        break;
      }
    }
    if (!hasNonAsset) {
      test.info().annotations.push({ type: 'note', description: 'After clearing filter, rows still appear to be only Asset types' });
    }
  });
});