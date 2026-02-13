import { test, expect } from '@playwright/test';

//
// GLOBAL CONFIGURATION
//
test.setTimeout(5 * 60 * 1000); // 5 minutes per test

const ACTION_TIMEOUT = 3 * 60 * 1000;
const EXPECT_TIMEOUT = 3 * 60 * 1000;

//
// TEST SUITE
//
test.describe('Your Workspace @Sh2btbq3z', () => {

  test('@banking MODULE-001: Validate required fields on create transaction @Tu0t30g35', async ({ page }) => {

    //
    // STEP 1: Navigate to Banking Dashboard
    //
    await page.goto('/banking', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

    const dashboard = page.getByTestId('banking-dashboard');
    await dashboard.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(dashboard).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 2: Click Create Transaction
    //
    const createTransactionButton = page.getByTestId('create-transaction-btn');
    await createTransactionButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await createTransactionButton.click({ timeout: ACTION_TIMEOUT });

    const createForm = page.getByTestId('create-transaction-form');
    await createForm.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(createForm).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 3: Leave required fields empty (amount, date)
    //
    const amountInput = page.getByTestId('transaction-amount-input');
    await amountInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await amountInput.fill('', { timeout: ACTION_TIMEOUT });

    const dateInput = page.getByTestId('transaction-date-input');
    await dateInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await dateInput.fill('', { timeout: ACTION_TIMEOUT });

    //
    // STEP 4: Attempt to save transaction
    //
    const saveButton = page.getByTestId('save-transaction-btn');
    await saveButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await saveButton.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 5: Verify save is prevented (form remains visible)
    //
    await expect(createForm).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 6: Verify validation errors are displayed
    //
    const amountError = page.getByTestId('transaction-amount-error');
    await amountError.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(amountError).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const dateError = page.getByTestId('transaction-date-error');
    await dateError.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(dateError).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 7: Verify required fields are highlighted
    //
    await expect(amountInput).toHaveAttribute('aria-invalid', 'true', { timeout: EXPECT_TIMEOUT });
    await expect(dateInput).toHaveAttribute('aria-invalid', 'true', { timeout: EXPECT_TIMEOUT });

    //
    // STEP 8: Correct fields and resubmit
    //
    const suffix = Date.now().toString(36);
    const amountValue = '100.00';
    const dateValue = '2024-01-15';

    await amountInput.fill(amountValue, { timeout: ACTION_TIMEOUT });
    await dateInput.fill(dateValue, { timeout: ACTION_TIMEOUT });

    await saveButton.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

    //
    // STEP 9: Verify transaction can be successfully saved after correction
    //
    const successToast = page.getByTestId('toast-success');
    await successToast.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(successToast).toBeVisible({ timeout: EXPECT_TIMEOUT });

  });

});