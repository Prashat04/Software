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
test.describe('Your Workspace @Shvqig0ti', () => {

  test('@banking MODULE-001: Bulk reconcile multiple transactions @T1mhf7v5r', async ({ page }) => {

    //
    // STEP 1: Navigate to Banking Dashboard
    //
    await page.goto('/banking', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    const unreconciledTab = page.getByTestId('unreconciled-tab');
    await unreconciledTab.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await unreconciledTab.click({ timeout: ACTION_TIMEOUT });

    const unreconciledList = page.getByTestId('unreconciled-transaction-list');
    await unreconciledList.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });

    //
    // STEP 2: Select multiple unreconciled transactions (Multiple selection is enabled)
    //
    const transactionCheckboxes = page.getByTestId('transaction-select-checkbox');
    await transactionCheckboxes.nth(0).waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await transactionCheckboxes.nth(0).click({ timeout: ACTION_TIMEOUT });

    await transactionCheckboxes.nth(1).waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await transactionCheckboxes.nth(1).click({ timeout: ACTION_TIMEOUT });

    const bulkActionsBar = page.getByTestId('bulk-actions-bar');
    await expect(bulkActionsBar).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 3: Click Bulk Reconcile option (Bulk reconcile option is available)
    //
    const bulkReconcileButton = page.getByTestId('bulk-reconcile-button');
    await bulkReconcileButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await bulkReconcileButton.click({ timeout: ACTION_TIMEOUT });

    await page.waitForLoadState('networkidle');

    //
    // STEP 4: Review suggested matches for each
    //
    const matchSuggestionCard = page.getByTestId('match-suggestion-card').nth(0);
    await matchSuggestionCard.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(matchSuggestionCard).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 5: Confirm bulk reconciliation (All selected transactions are processed, status updates to reconciled for all)
    //
    const confirmBulkReconcileButton = page.getByTestId('confirm-bulk-reconcile');
    await confirmBulkReconcileButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await confirmBulkReconcileButton.click({ timeout: ACTION_TIMEOUT });

    await page.waitForLoadState('networkidle');

    const successToast = page.getByTestId('toast-success');
    await expect(successToast).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const categorizedTab = page.getByTestId('categorized-tab');
    await categorizedTab.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await categorizedTab.click({ timeout: ACTION_TIMEOUT });

    await page.waitForLoadState('networkidle');

    const reconciledStatusBadges = page.getByTestId('reconciled-status-badge');
    await reconciledStatusBadges.nth(0).waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(reconciledStatusBadges.nth(0)).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await reconciledStatusBadges.nth(1).waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(reconciledStatusBadges.nth(1)).toBeVisible({ timeout: EXPECT_TIMEOUT });

  });

});