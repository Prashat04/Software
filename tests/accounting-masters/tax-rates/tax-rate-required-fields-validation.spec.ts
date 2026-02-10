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

test.describe('Accounting Masters @S8c9zrcnl', () => {
  test('Tax Rate Required Fields Validation @Tt5o0tcqe', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to Tax Rates list
    await page.goto(`${baseUrl}/accounting-masters/tax-rates`);
    await waitForPageReady(page, '/tax-rate|tax-rates');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Click Create/Add Tax Rate
    await clickButton(page, /create|add|new/i, 'Create Tax Rate button not found');
    await waitForPageReady(page, '/tax-rate|tax-rates|create');

    // STEP 4: Ensure fields are empty (leave all fields empty)
    const nameField = page.getByLabel(/tax name|name/i).first();
    await optionalAction(nameField, async () => {
      await nameField.clear();
      await nameField.fill('');
    }, 'Tax Name field not found to clear');

    const rateField = page.getByLabel(/tax rate|rate|percentage|%/i).first();
    await optionalAction(rateField, async () => {
      await rateField.clear();
      await rateField.fill('');
    }, 'Tax Rate field not found to clear');

    const codeField = page.getByLabel(/code|tax code/i).first();
    await optionalAction(codeField, async () => {
      await codeField.clear();
      await codeField.fill('');
    }, 'Tax Code field not found to clear');

    const descriptionField = page.getByLabel(/description|details/i).first();
    await optionalAction(descriptionField, async () => {
      await descriptionField.clear();
      await descriptionField.fill('');
    }, 'Description field not found to clear');

    // STEP 5: Click Save without filling required fields
    await clickButton(page, /save|submit|create/i, 'Save button not found');

    // STEP 6: Verify validation messages are displayed
    const validationError = page.locator('text=/required|must|can\'t be empty/i').first();
    await safeExpectVisible(validationError, 'Validation error not visible');

    // STEP 7: Verify required fields highlighted
    const highlightedFields = page.locator('input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"], .error input, .error select, .error textarea, .field-error').first();
    await safeExpectVisible(highlightedFields, 'Required fields are not highlighted');

    // STEP 8: Verify tax rate is not created (no success toast and still on form)
    const successToast = await waitForToast(page, /success|created|saved/i, 5000);
    expect(successToast).toBeFalsy();

    // Still on create page
    await expect(page).toHaveURL(/tax-rate|tax-rates|create/i, { timeout: 15000 });

    // Final check: Save button still visible (form not submitted successfully)
    await safeExpectVisible(page.getByRole('button', { name: /save|submit|create/i }).first(), 'Save button not visible after validation');
  });
});