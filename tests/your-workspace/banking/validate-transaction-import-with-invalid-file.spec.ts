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
test.describe('Your Workspace @Snigs2mkb', () => {

  test('@banking @import @validation @negative: Validate Transaction Import with Invalid File @T3xqv3yww', async ({ page }) => {

    //
    // STEP 1: Navigate to Banking Dashboard
    //
    await page.goto('/banking', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 2: Click Import Transactions
    //
    const importButton = page.getByTestId('import-transactions-button');
    await importButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await importButton.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 3: Attempt to upload invalid file format
    //
    const invalidFilePath = 'tests/fixtures/invalid-file.pdf';
    const fileInput = page.getByTestId('transaction-import-file-input');
    await fileInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await fileInput.setInputFiles(invalidFilePath, { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 4: Observe system response
    //
    const errorToast = page.getByTestId('toast-error');
    await expect(errorToast).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const errorMessage = page.getByTestId('import-error-message');
    await expect(errorMessage).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(errorMessage).toHaveText(/invalid file format/i, { timeout: EXPECT_TIMEOUT });

    const uploadPrompt = page.getByTestId('import-upload-prompt');
    await expect(uploadPrompt).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(uploadPrompt).toHaveText(/upload a csv/i, { timeout: EXPECT_TIMEOUT });

    const successToast = page.getByTestId('toast-success');
    await expect(successToast).toBeHidden({ timeout: EXPECT_TIMEOUT });

  });

});