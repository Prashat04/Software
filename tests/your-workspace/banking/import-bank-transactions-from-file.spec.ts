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
test.describe('Your Workspace @Sbpvzfekv', () => {

  test('@banking @import @csv @transactions MODULE-001: Import bank transactions from file @Te22s7b96', async ({ page }) => {

    //
    // STEP 1: Navigate to Banking Dashboard (Import dialog access available)
    //
    await page.goto('/banking', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');
    const bankingHeader = page.getByTestId('banking-dashboard-header');
    await bankingHeader.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(bankingHeader).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 2: Click on Import Transactions option (Import dialog opens successfully)
    //
    const importTransactionsButton = page.getByTestId('import-transactions-button');
    await importTransactionsButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await importTransactionsButton.click({ timeout: ACTION_TIMEOUT });
    const importDialog = page.getByTestId('import-transactions-dialog');
    await importDialog.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(importDialog).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 3: Select the bank account for import (Account selection visible)
    //
    const accountDropdown = page.getByTestId('import-account-select');
    await accountDropdown.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await accountDropdown.click({ timeout: ACTION_TIMEOUT });
    const accountOption = page.getByTestId('import-account-option-0');
    await accountOption.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await accountOption.click({ timeout: ACTION_TIMEOUT });
    await expect(accountDropdown).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 4: Upload CSV/bank statement file (File upload is accepted)
    //
    const uploadInput = page.getByTestId('import-file-input');
    await uploadInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await uploadInput.setInputFiles('tests/fixtures/bank-transactions.csv', { timeout: ACTION_TIMEOUT });
    const uploadSuccess = page.getByTestId('import-file-success');
    await uploadSuccess.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(uploadSuccess).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 5: Map columns to transaction fields (Column mapping interface is displayed)
    //
    const mappingSection = page.getByTestId('column-mapping-section');
    await mappingSection.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(mappingSection).toBeVisible({ timeout: EXPECT_TIMEOUT });
    const dateMapping = page.getByTestId('mapping-date-select');
    await dateMapping.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await dateMapping.click({ timeout: ACTION_TIMEOUT });
    const dateOption = page.getByTestId('mapping-date-option-0');
    await dateOption.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await dateOption.click({ timeout: ACTION_TIMEOUT });
    const amountMapping = page.getByTestId('mapping-amount-select');
    await amountMapping.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await amountMapping.click({ timeout: ACTION_TIMEOUT });
    const amountOption = page.getByTestId('mapping-amount-option-0');
    await amountOption.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await amountOption.click({ timeout: ACTION_TIMEOUT });
    const descriptionMapping = page.getByTestId('mapping-description-select');
    await descriptionMapping.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await descriptionMapping.click({ timeout: ACTION_TIMEOUT });
    const descriptionOption = page.getByTestId('mapping-description-option-0');
    await descriptionOption.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await descriptionOption.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 6: Review imported transactions (Preview of transactions is shown)
    //
    const previewTable = page.getByTestId('import-preview-table');
    await previewTable.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(previewTable).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 7: Confirm import (Transactions are imported successfully and appear in bank register)
    //
    const confirmImportButton = page.getByTestId('confirm-import-button');
    await confirmImportButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await confirmImportButton.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');
    const importSuccessToast = page.getByTestId('toast-success');
    await importSuccessToast.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(importSuccessToast).toBeVisible({ timeout: EXPECT_TIMEOUT });
    const bankRegisterList = page.getByTestId('bank-register-list');
    await bankRegisterList.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(bankRegisterList).toBeVisible({ timeout: EXPECT_TIMEOUT });

  });

});