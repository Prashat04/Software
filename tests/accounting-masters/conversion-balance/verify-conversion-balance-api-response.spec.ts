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

test.describe('Accounting Masters @Spmm1lub2', () => {
  test('Verify Conversion Balance API Response @Tb5dec8kh', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to the starting point
    await page.goto(`${baseUrl}/banking`);
    await waitForPageReady(page, '/banking');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Gather auth token and organization id (if available)
    const token = await page.evaluate(() => {
      return (
        localStorage.getItem('accessToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        ''
      );
    });

    const orgId = await page.evaluate(() => {
      return (
        localStorage.getItem('orgId') ||
        localStorage.getItem('organizationId') ||
        localStorage.getItem('org_id') ||
        ''
      );
    });

    if (!token) {
      test.info().annotations.push({ type: 'note', description: 'Auth token not found in localStorage' });
    }
    if (!orgId) {
      test.info().annotations.push({ type: 'note', description: 'Organization ID not found in localStorage' });
    }

    // STEP 4: Send GET request to conversion balance API endpoint
    const endpoint = `${baseUrl}/api/accounting-masters/conversion-balance${orgId ? `?organizationId=${orgId}` : ''}`;
    const response = await page.request.get(endpoint, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    // STEP 5: Validate response status code
    expect(response.status(), 'Expected 200 OK status').toBe(200);

    // STEP 6: Verify response data structure
    const data = await response.json().catch(() => null);
    expect(data, 'Response JSON should not be null').not.toBeNull();

    const entries = Array.isArray(data) ? data : data?.data || data?.result || data?.items;
    expect(Array.isArray(entries), 'Expected an array of conversion balance entries').toBeTruthy();

    if (Array.isArray(entries) && entries.length === 0) {
      test.info().annotations.push({ type: 'note', description: 'Conversion balance entries array is empty' });
    }

    // STEP 7: Check data types of returned fields
    if (Array.isArray(entries) && entries.length > 0) {
      const entry = entries[0];
      const hasAccount = entry?.account !== undefined || entry?.accountName !== undefined;
      const hasDebit = entry?.debit !== undefined;
      const hasCredit = entry?.credit !== undefined;

      expect(hasAccount, 'Entry should have account field').toBeTruthy();
      expect(hasDebit, 'Entry should have debit field').toBeTruthy();
      expect(hasCredit, 'Entry should have credit field').toBeTruthy();

      const debitVal = entry?.debit;
      const creditVal = entry?.credit;

      const isDebitNumeric = typeof debitVal === 'number' || !Number.isNaN(parseFloat(String(debitVal)));
      const isCreditNumeric = typeof creditVal === 'number' || !Number.isNaN(parseFloat(String(creditVal)));

      expect(isDebitNumeric, 'Debit should be numeric').toBeTruthy();
      expect(isCreditNumeric, 'Credit should be numeric').toBeTruthy();
    }
  });
});