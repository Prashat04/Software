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
test.describe('Your Workspace @S4yje2jah', () => {

  test('@banking MODULE-001: Reconcile Bank Transaction with matching records @Tlhktgjm4', async ({ page }) => {

    //
    // STEP 1: Navigate to Banking Dashboard
    //
    await page.goto('/banking', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 2: Select an unreconciled transaction
    //
    const unreconciledRow = page.getByTestId('unreconciled-transaction-row');
    await unreconciledRow.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(unreconciledRow).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await unreconciledRow.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 3: Click Reconcile Transaction
    //
    const reconcileButton = page.getByTestId('reconcile-transaction-btn');
    await reconcileButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await reconcileButton.click({ timeout: ACTION_TIMEOUT });
    await page.waitForURL(/\/reconcile-transaction\/.*/, { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 4: Review suggested matches
    //
    const suggestedMatches = page.getByTestId('suggested-matches-list');
    await suggestedMatches.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(suggestedMatches).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const matchPreview = page.getByTestId('match-preview-details');
    await matchPreview.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(matchPreview).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 5: Select the matching record
    //
    const matchOption = page.getByTestId('match-option-0');
    await matchOption.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await matchOption.click({ timeout: ACTION_TIMEOUT });
    await expect(matchPreview).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 6: Confirm reconciliation
    //
    const confirmReconcile = page.getByTestId('confirm-reconcile-btn');
    await confirmReconcile.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await confirmReconcile.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    const successToast = page.getByTestId('toast-success');
    await successToast.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(successToast).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const categorizedTab = page.getByTestId('categorized-tab');
    await categorizedTab.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await categorizedTab.click({ timeout: ACTION_TIMEOUT });

    const reconciledStatus = page.getByTestId('transaction-status-reconciled');
    await reconciledStatus.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(reconciledStatus).toBeVisible({ timeout: EXPECT_TIMEOUT });

  });

});