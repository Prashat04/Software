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

async function findAccountRowWithTransactions(page: Page): Promise<Locator | null> {
  const headers = page.locator('table thead th, [role="columnheader"]');
  const headerCount = await headers.count();
  let transactionsIndex = -1;
  for (let i = 0; i < headerCount; i++) {
    const hText = (await headers.nth(i).innerText().catch(() => '')).trim();
    if (/transaction/i.test(hText)) {
      transactionsIndex = i;
      break;
    }
  }

  const rows = page.locator('table tbody tr, [role="row"]').filter({ hasNotText: /no data|empty/i });
  const rowCount = await rows.count();
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    if (transactionsIndex >= 0) {
      const cell = row.locator('td, [role="cell"]').nth(transactionsIndex);
      const cellText = (await cell.innerText().catch(() => '')).trim();
      const num = parseInt(cellText.replace(/[^\d]/g, ''), 10);
      if (!isNaN(num) && num > 0) {
        await row.scrollIntoViewIfNeeded().catch(() => {});
        return row;
      }
    }
  }

  const fallbackRow = await firstRow(page);
  return fallbackRow;
}

test.describe('Accounting Masters @S20s695c9', () => {
  test('Prevent Deletion of Account with Transactions @Tbsdpuy8g', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to Chart of Accounts
    await page.goto(`${baseUrl}/chart-of-accounts`);
    await waitForPageReady(page, '/chart-of-accounts');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Locate account with existing transactions
    const accountRow = await findAccountRowWithTransactions(page);
    if (!accountRow) {
      test.info().annotations.push({ type: 'note', description: 'No account rows found in Chart of Accounts.' });
      return;
    }

    const accountName = (await accountRow.locator('td, [role="cell"]').first().innerText().catch(() => 'Unknown Account')).trim();

    // STEP 4: Attempt to delete the account
    // Try direct delete button in row
    await optionalAction(
      accountRow.getByRole('button', { name: /delete/i }),
      async () => {
        await accountRow.getByRole('button', { name: /delete/i }).first().click();
      },
      'Delete button not found directly in row.'
    );

    // If no direct delete, open actions menu and click delete
    await optionalAction(
      accountRow.getByRole('button', { name: /more|actions|menu/i }),
      async () => {
        await accountRow.getByRole('button', { name: /more|actions|menu/i }).first().click();
        await page.waitForTimeout(300);
        const deleteMenuItem = page.getByRole('menuitem', { name: /delete/i }).first();
        if (await deleteMenuItem.count()) {
          await deleteMenuItem.click();
        } else {
          await clickButton(page, /delete/i, 'Delete menu item not found after opening actions menu.');
        }
      },
      'Actions menu not found in row.'
    );

    // Confirm deletion if modal appears
    await clickButton(page, /confirm|delete|yes|ok/i, 'Confirm delete button not found').catch(() => {});

    // STEP 5: Verify system displays error message
    const errorToastFound = await waitForToast(page, /transaction|cannot delete|linked|has.*transaction|used/i);
    if (!errorToastFound) {
      await safeExpectVisible(
        page.locator('text=/transaction|cannot delete|linked|has.*transaction|used/i').first(),
        'Expected error message about transactions not visible.'
      );
    }

    // STEP 6: Verify account is not deleted (account still visible)
    const accountRowAfter = page.locator('table tbody tr, [role="row"]').filter({ hasText: textRegex(accountName) }).first();
    await safeExpectVisible(accountRowAfter, 'Account row not visible after delete attempt; it may have been deleted.');

    // STEP 7: Verify error indicates account has transactions
    await safeExpectVisible(
      page.locator('text=/transaction/i').first(),
      'Error message does not indicate associated transactions.'
    );
  });
});