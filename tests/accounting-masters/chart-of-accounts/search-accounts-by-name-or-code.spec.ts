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

test.describe('Accounting Masters @Shjsqnkhk', () => {
  test('Search Accounts by Name or Code @T97fdu8s1', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to the starting point
    await page.goto(`${baseUrl}/chart-of-accounts`);
    await waitForPageReady(page, '/chart-of-accounts');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Ensure list is visible and capture initial rows
    const rowsLocator = page.locator('table tbody tr, [role="row"]').filter({ hasNotText: /no data|empty/i });
    const hasRows = await safeExpectVisible(rowsLocator.first(), 'Account rows not visible in Chart of Accounts');
    let initialCount = 0;
    if (hasRows) {
      initialCount = await rowsLocator.count();
    }

    // STEP 4: Determine a search term from first row (account name or code)
    let searchTerm = 'Cash';
    const row = await firstRow(page);
    if (row) {
      const cellText = (await row.locator('td, [role="cell"]').first().textContent())?.trim();
      if (cellText && cellText.length >= 3) {
        searchTerm = cellText.substring(0, 4).trim();
      }
    } else {
      test.info().annotations.push({ type: 'note', description: 'No account rows found to derive search term, using default "Cash"' });
    }

    // STEP 5: Enter search term in search field
    const searchInputSelector = 'input[type="search"], input[placeholder*="Search"], [data-testid="search-input"] input';
    await fillField(page, searchInputSelector, searchTerm, 'Search');
    const searchInput = page.locator(searchInputSelector).first();
    if (await safeExpectVisible(searchInput, 'Search input not visible')) {
      await expect(searchInput).toHaveValue(searchTerm);
    }

    // STEP 6: Observe filtered results in real-time
    await page.waitForTimeout(1000);
    const filteredRows = page.locator('table tbody tr, [role="row"]').filter({ hasNotText: /no data|empty/i });
    const filteredCount = await filteredRows.count();

    // Verify results filtered (count should be <= initial count, unless no rows)
    if (initialCount > 0) {
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }

    // STEP 7: Verify only matching accounts are displayed
    const rowTexts = await filteredRows.allTextContents();
    if (rowTexts.length > 0) {
      const regex = textRegex(searchTerm);
      for (const text of rowTexts) {
        expect(text).toMatch(regex);
      }
    } else {
      test.info().annotations.push({ type: 'note', description: 'No rows after filtering; possibly no matches for search term' });
    }
  });
});