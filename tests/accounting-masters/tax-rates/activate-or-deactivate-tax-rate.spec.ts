import { test, expect } from '@playwright/test';

//
// GLOBAL CONFIGURATION
//
test.setTimeout(5 * 60 * 1000); // 5 minutes per test

const ACTION_TIMEOUT = 3 * 60 * 1000;
const EXPECT_TIMEOUT = 3 * 60 * 1000;

// Inline login helper — credentials from Test Environment settings.
async function seedLogin(page) {
  await page.goto('https://dev.hellobooks.ai/login', { timeout: ACTION_TIMEOUT });
  await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });
  await page.getByLabel(/email/i).fill('harshpadaliya@merufintech.net', { timeout: ACTION_TIMEOUT });
  await page.getByLabel(/password/i).fill('Harsh@12345', { timeout: ACTION_TIMEOUT });
  await page.getByRole('button', { name: /sign in|log in|login|submit/i }).click({ timeout: ACTION_TIMEOUT });
  await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });
}

//
// TEST SUITE
//
test.describe('Activate or Deactivate @Spsfynl1w', () => {

  test('Activate or Deactivate Tax Rate @ai-generated', async ({ page }) => {

    //
    // STEP 0: Login
    //
    await seedLogin(page);

    //
    // STEP 1: Navigate to Tax Rates list
    //
    await page.goto('https://dev.hellobooks.ai/tax-rates', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

    //
    // STEP 2: Locate a tax rate with active status
    //
    const activeRow = page.getByRole('row', { name: /active/i }).first();
    await activeRow.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    const taxRateName = ((await activeRow.getByRole('cell').first().textContent()) || '').trim();

    //
    // STEP 3: Click on deactivate toggle or action
    //
    const deactivateButton = activeRow.getByRole('button', { name: /deactivate|disable|active|toggle/i });
    await deactivateButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await deactivateButton.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 4: Confirm the action
    //
    const confirmButton = page.getByRole('button', { name: /confirm|yes|deactivate|disable/i });
    await confirmButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await confirmButton.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

    //
    // STEP 5: Verify tax rate status is updated and reflected in the list
    //
    const updatedRow = page.getByRole('row', { name: new RegExp(taxRateName, 'i') }).first();
    await updatedRow.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    const inactiveCell = updatedRow.getByRole('cell', { name: /inactive|disabled/i }).first();
    await expect(inactiveCell).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 6: Verify deactivated tax rate is not available for new transactions
    //
    await page.goto('https://dev.hellobooks.ai/invoices/new', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

    const taxRateDropdown = page.getByRole('combobox', { name: /tax rate/i });
    await taxRateDropdown.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await taxRateDropdown.click({ timeout: ACTION_TIMEOUT });

    const deactivatedOption = page.getByRole('option', { name: new RegExp(taxRateName, 'i') });
    await expect(deactivatedOption).toHaveCount(0, { timeout: EXPECT_TIMEOUT });

  });

});