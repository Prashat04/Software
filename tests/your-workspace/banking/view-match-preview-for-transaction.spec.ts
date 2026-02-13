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
test.describe('Your Workspace @Sqf95kxhp', () => {

  test('@banking MODULE-001: View match preview for transaction @Tcwx9toc2', async ({ page }) => {

    //
    // STEP 1: Navigate to Banking Dashboard
    //
    await page.goto('/banking', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 2: Select an unreconciled transaction
    //
    const unreconciledRow = page.getByTestId('unreconciled-transaction-row').first();
    await unreconciledRow.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await unreconciledRow.click({ timeout: ACTION_TIMEOUT });
    await page.waitForURL(/\/reconcile-transaction\/.+/, { timeout: ACTION_TIMEOUT });

    //
    // STEP 3: Click on Match Preview option
    //
    const matchPreviewButton = page.getByTestId('match-preview-button');
    await matchPreviewButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await matchPreviewButton.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 4: Review all potential matches displayed
    //
    const matchPreviewPanel = page.getByTestId('match-preview-panel');
    await matchPreviewPanel.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(matchPreviewPanel).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const matchPreviewList = page.getByTestId('match-preview-list');
    await matchPreviewList.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(matchPreviewList).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const matchItem = page.getByTestId('match-preview-item').first();
    await matchItem.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(matchItem).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const confidenceScore = page.getByTestId('match-confidence-score').first();
    await confidenceScore.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(confidenceScore).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const transactionDetails = page.getByTestId('transaction-details');
    await transactionDetails.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(transactionDetails).toBeVisible({ timeout: EXPECT_TIMEOUT });

  });

});