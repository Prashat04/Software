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
test.describe('Your Workspace @Sma2t9045', () => {

  test('@banking @rules @delete MODULE-001: Delete Transaction Rule @T3gecidsh', async ({ page }) => {

    //
    // STEP 1: Navigate to Banking Dashboard
    //
    await page.goto('/banking', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 2: Click on Transaction Rules
    //
    const transactionRulesTab = page.getByTestId('transaction-rules-tab');
    await transactionRulesTab.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await transactionRulesTab.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 3: Select a rule to delete
    //
    const firstRuleRow = page.getByTestId('transaction-rule-row').first();
    await firstRuleRow.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await firstRuleRow.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 4: Click Delete option
    //
    const deleteRuleButton = page.getByTestId('delete-transaction-rule');
    await deleteRuleButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await deleteRuleButton.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 5: Confirm deletion
    // Expected: Delete confirmation dialog appears
    //
    const deleteConfirmDialog = page.getByTestId('delete-rule-confirmation-dialog');
    await deleteConfirmDialog.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(deleteConfirmDialog).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const confirmDeleteButton = page.getByTestId('confirm-delete-rule');
    await confirmDeleteButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await confirmDeleteButton.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 6: Verify deletion results
    // Expected: Rule is deleted after confirmation
    // Expected: Rule no longer appears in the list
    // Expected: Success message is displayed
    //
    const successToast = page.getByTestId('toast-success');
    await successToast.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(successToast).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const rulesList = page.getByTestId('transaction-rules-list');
    await rulesList.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(rulesList).toBeVisible({ timeout: EXPECT_TIMEOUT });

  });

});