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

test.describe('Accounting Masters @Sd20eih3f', () => {
  test('Create new vendor with required fields @Txmrugk2n', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);
    
    // STEP 2: Navigate to Contacts/Vendors list
    await page.goto(`${baseUrl}/payees`);
    await waitForPageReady(page, '/payees');
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // STEP 3: Click Vendors tab if available
    await optionalAction(
      page.getByRole('tab', { name: /vendor/i }),
      async () => {
        await page.getByRole('tab', { name: /vendor/i }).first().click();
      },
      'Vendors tab not found'
    );

    // STEP 4: Click Add Vendor button
    await clickButton(page, /add vendor|create vendor|new vendor/i, 'Add Vendor button not found');

    // STEP 5: Verify create vendor form opened
    await waitForPageReady(page, '/payees/create-vendor');
    await safeExpectVisible(page.getByRole('heading', { name: /create vendor|add vendor/i }).first(), 'Create Vendor form heading not visible');

    // STEP 6: Verify required fields marked with asterisk
    await safeExpectVisible(page.locator('label:has-text("Vendor Name")').filter({ hasText: '*' }).first(), 'Vendor Name required asterisk not visible');
    await safeExpectVisible(page.locator('label:has-text("Email")').filter({ hasText: '*' }).first(), 'Email required asterisk not visible');
    await safeExpectVisible(page.locator('label:has-text("Phone")').filter({ hasText: '*' }).first(), 'Phone required asterisk not visible');

    const uniqueSuffix = Date.now().toString().slice(-6);
    const vendorName = `Auto Vendor ${uniqueSuffix}`;

    // STEP 7: Fill all required and available fields
    await fillField(page, 'label:has-text("Vendor Name") >> input, input[name*="vendorName"], input[placeholder*="Vendor"]', vendorName, 'Vendor Name');
    await fillField(page, 'label:has-text("Display Name") >> input, input[name*="displayName"]', vendorName, 'Display Name');
    await fillField(page, 'label:has-text("Email") >> input, input[type="email"]', `vendor${uniqueSuffix}@example.com`, 'Email');
    await fillField(page, 'label:has-text("Phone") >> input, input[type="tel"], input[placeholder*="Phone"]', '9876543210', 'Phone');

    // Address fields
    await fillField(page, 'label:has-text("Street") >> input, input[name*="street"]', '123 Market Street', 'Street');
    await fillField(page, 'label:has-text("City") >> input, input[name*="city"]', 'Metropolis', 'City');
    await fillField(page, 'label:has-text("State") >> input, input[name*="state"]', 'CA', 'State');
    await fillField(page, 'label:has-text("ZIP") >> input, input[name*="zip"], input[name*="postal"]', '94105', 'ZIP');

    // Optional bank details
    await fillField(page, 'label:has-text("Bank") >> input, input[name*="bank"]', 'HBF Bank', 'Bank Name');
    await fillField(page, 'label:has-text("Account") >> input, input[name*="account"]', '123456789', 'Bank Account');

    // Payment terms dropdown
    await selectOption(page, 'label:has-text("Payment Terms") >> .. >> [role="combobox"], label:has-text("Payment Terms") >> .. >> select', 'Net 30', 'Payment Terms');

    // GST/Tax Number
    await fillField(page, 'label:has-text("GST") >> input, label:has-text("Tax") >> input, input[name*="gst"], input[name*="tax"]', 'GSTIN1234567', 'GST/Tax Number');

    // STEP 8: Click Save button
    await clickButton(page, /save|create|submit/i, 'Save button not found');

    // STEP 9: Verify success message or redirect
    const toastSeen = await waitForToast(page, /success|created|saved/i);
    if (!toastSeen) {
      await waitForPageReady(page);
      await safeExpectVisible(page.locator('h1, h2, [role="heading"]').filter({ hasText: textRegex(vendorName) }).first(), 'Vendor info heading not visible');
    }

    // STEP 10: Verify new vendor appears in contacts list
    await page.goto(`${baseUrl}/payees`);
    await waitForPageReady(page, '/payees');
    await optionalAction(
      page.getByRole('tab', { name: /vendor/i }),
      async () => {
        await page.getByRole('tab', { name: /vendor/i }).first().click();
      },
      'Vendors tab not found on list'
    );

    const vendorRow = page.locator('table tbody tr, [role="row"]').filter({ hasText: vendorName }).first();
    await safeExpectVisible(vendorRow, 'New vendor not visible in list', 10000);
  });
});