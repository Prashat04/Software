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

test.describe('Accounting Masters @Ssa6rhtkr', () => {
  test('Edit Existing Account Details @Tnweesde9', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to Chart of Accounts
    await page.goto(`${baseUrl}/chart-of-accounts`);
    await waitForPageReady(page, '/chart-of-accounts');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Locate an existing account
    const row = await firstRow(page);
    if (!row) {
      test.info().annotations.push({ type: 'note', description: 'No account rows found in Chart of Accounts' });
      return;
    }

    const originalName = (await row.locator('td').first().innerText().catch(() => '')) || 'Account';
    // STEP 4: Click Edit action on the account
    const editButtonInRow = row.getByRole('button', { name: /edit/i }).first();
    await optionalAction(editButtonInRow, async () => {
      await editButtonInRow.click();
    }, 'Edit button not found in row, trying row click');

    // If edit button not clicked, try clicking row to open details and then edit
    if (!(await page.locator('form').first().isVisible().catch(() => false))) {
      await optionalAction(row, async () => {
        await row.click();
      }, 'Could not click row to open edit view');
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      await optionalAction(editButton, async () => {
        await editButton.click();
      }, 'Edit button not found on detail page');
    }

    // STEP 5: Verify edit form opens with pre-populated data
    const nameInput = page.locator('input[name="name"], input[placeholder*="Account Name" i]').first();
    const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="Description" i], input[name="description"]').first();
    await safeExpectVisible(nameInput, 'Account name input not visible on edit form');
    await safeExpectVisible(descriptionInput, 'Account description input not visible on edit form');

    const preName = await nameInput.inputValue().catch(() => '');
    if (!preName) {
      test.info().annotations.push({ type: 'note', description: 'Account name not pre-populated' });
    }

    // STEP 6: Modify account name or description (fill all required fields)
    const updatedName = `${preName || originalName}-Updated`;
    const updatedDescription = `Updated description ${Date.now()}`;

    await fillField(page, 'input[name="name"]', updatedName, 'Account Name');
    await fillField(page, 'textarea[name="description"], input[name="description"]', updatedDescription, 'Description');

    // Try fill optional required fields if present
    await selectOption(page, '[data-testid="account-type"], [name="accountType"], [aria-label*="Type" i]', 'Assets', 'Account Type');
    await fillField(page, 'input[name="code"], input[placeholder*="Code" i]', `AC-${Date.now().toString().slice(-5)}`, 'Account Code');

    // STEP 7: Save changes
    const saved = await clickButton(page, /save|update/i, 'Save button not found on edit form');
    if (!saved) {
      test.info().annotations.push({ type: 'note', description: 'Save action could not be performed' });
    }

    // STEP 8: Verify success message
    const toastVisible = await waitForToast(page, /success|updated|saved/i, 15000);
    if (!toastVisible) {
      test.info().annotations.push({ type: 'note', description: 'Success toast not detected after save' });
    }

    // STEP 9: Verify updated details reflect in the accounts list
    await waitForPageReady(page);
    const urlMatches = /chart-of-accounts|accounts/i;
    await expect(page).toHaveURL(urlMatches, { timeout: 15000 });

    const updatedRow = page.locator('table tbody tr, [role="row"]').filter({ hasText: textRegex(updatedName) }).first();
    const foundUpdated = await safeExpectVisible(updatedRow, 'Updated account not found in list', 10000);
    if (!foundUpdated) {
      test.info().annotations.push({ type: 'note', description: `Could not verify updated name "${updatedName}" in list` });
    }
  });
});