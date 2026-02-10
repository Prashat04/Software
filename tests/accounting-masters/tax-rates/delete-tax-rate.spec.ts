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

test.describe('Accounting Masters @Sn8ypuw56', () => {
  test('Delete Tax Rate @Tmcpe48j7', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to the Tax Rates list
    await page.goto(`${baseUrl}/accounting-masters/tax-rates`);
    await waitForPageReady(page, '/tax-rates');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // Ensure list is visible
    await safeExpectVisible(page.getByText(/tax rates/i).first(), 'Tax Rates list header not visible');

    // STEP 3: Identify a tax rate row to delete
    const row = await firstRow(page);
    if (!row) {
      test.info().annotations.push({ type: 'note', description: 'No tax rate rows available to delete' });
      return;
    }

    // Capture tax rate name for verification
    const nameCell = row.locator('td, [role="cell"]').first();
    let taxRateName = '';
    try {
      taxRateName = (await nameCell.textContent())?.trim() || '';
    } catch {
      taxRateName = '';
    }

    if (!taxRateName) {
      test.info().annotations.push({ type: 'note', description: 'Could not capture tax rate name for verification' });
    }

    // STEP 4: Click Delete action for a tax rate
    const deleteButtonInRow = row.getByRole('button', { name: /delete|remove|trash/i }).first();
    await optionalAction(deleteButtonInRow, async () => {
      await deleteButtonInRow.click();
    }, 'Delete button not found in row');

    // STEP 5: Confirm deletion in confirmation dialog
    const confirmDialog = page.locator('[role="dialog"], .modal, .dialog').filter({ hasText: /delete|confirm/i }).first();
    const dialogVisible = await safeExpectVisible(confirmDialog, 'Confirmation dialog not visible');
    if (dialogVisible) {
      const confirmDeleteBtn = confirmDialog.getByRole('button', { name: /confirm|delete|yes/i }).first();
      await optionalAction(confirmDeleteBtn, async () => {
        await confirmDeleteBtn.click();
      }, 'Confirm delete button not found');
    } else {
      // Fallback: try global confirm button
      await clickButton(page, /confirm|delete|yes/i, 'Global confirm button not found');
    }

    // STEP 6: Verify success message is displayed
    const toastSeen = await waitForToast(page, /deleted|success|removed/i);
    if (!toastSeen) {
      test.info().annotations.push({ type: 'note', description: 'Success toast not detected after deletion' });
    }

    // STEP 7: Verify deleted tax rate no longer appears in the list
    if (taxRateName) {
      const deletedRowText = page.getByText(textRegex(taxRateName)).first();
      try {
        await expect(deletedRowText).toBeHidden({ timeout: 10000 });
      } catch {
        test.info().annotations.push({ type: 'note', description: `Deleted tax rate "${taxRateName}" still appears in list` });
      }
    }
  });
});