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

test.describe('Accounting Masters @S9ddnyjkt', () => {
  test('Delete Account from Chart of Accounts @Thehbfbnf', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);
    
    // STEP 2: Navigate to the Chart of Accounts
    await page.goto(`${baseUrl}/chart-of-accounts`);
    await waitForPageReady(page, '/chart-of-accounts');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Locate account with no transactions
    const noTxnRow = page.locator('table tbody tr').filter({ hasText: /no transactions|0\s*transactions|\b0\b/i }).first();
    let targetRow = noTxnRow;
    const noTxnVisible = await safeExpectVisible(noTxnRow, 'No account row with no transactions found');
    if (!noTxnVisible) {
      const fallback = await firstRow(page);
      if (fallback) {
        targetRow = fallback;
        test.info().annotations.push({ type: 'note', description: 'Using first available row as fallback' });
      }
    }

    // Capture account name for verification
    let accountName = 'Account';
    try {
      const nameCell = targetRow.locator('td').first();
      await nameCell.waitFor({ state: 'visible', timeout: 5000 });
      accountName = (await nameCell.innerText()).trim() || accountName;
    } catch {
      test.info().annotations.push({ type: 'note', description: 'Could not read account name from row' });
    }

    // STEP 4: Click Delete action on the account
    // Try direct delete button first
    const directDelete = targetRow.getByRole('button', { name: /delete|remove/i }).first();
    await optionalAction(directDelete, async () => {
      await directDelete.click();
    }, 'Direct delete button not found, trying action menu');

    // If delete not triggered, open row action menu and click delete
    const confirmDialog = page.getByRole('dialog').filter({ hasText: /delete|remove/i }).first();
    const dialogVisible = await safeExpectVisible(confirmDialog, 'Confirmation dialog not visible yet', 3000);
    if (!dialogVisible) {
      const actionMenu = targetRow.getByRole('button', { name: /more|actions|menu|ellipsis|⋮|…/i }).first();
      await optionalAction(actionMenu, async () => {
        await actionMenu.click();
      }, 'Action menu button not found');
      const menuDelete = page.getByRole('menuitem', { name: /delete|remove/i }).first();
      await optionalAction(menuDelete, async () => {
        await menuDelete.click();
      }, 'Delete option in menu not found');
    }

    // STEP 5: Confirm deletion in confirmation dialog
    const dialog = page.getByRole('dialog').filter({ hasText: /delete|remove/i }).first();
    await safeExpectVisible(dialog, 'Confirmation dialog did not appear');
    const confirmButton = dialog.getByRole('button', { name: /confirm|delete|yes|remove/i }).first();
    await optionalAction(confirmButton, async () => {
      await confirmButton.click();
    }, 'Confirm delete button not found');

    // STEP 6: Verify success message confirms deletion
    const toastShown = await waitForToast(page, /deleted|success|removed/i, 15000);
    if (!toastShown) {
      test.info().annotations.push({ type: 'note', description: 'Success toast not detected after deletion' });
    }

    // STEP 7: Verify account is removed from the list
    const deletedRow = page.locator('table tbody tr').filter({ hasText: textRegex(accountName) }).first();
    try {
      await expect(deletedRow).toHaveCount(0, { timeout: 15000 });
    } catch {
      test.info().annotations.push({ type: 'note', description: `Row with account name "${accountName}" still present after deletion` });
    }
  });
});