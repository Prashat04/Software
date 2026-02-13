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
test.describe('Your Workspace @Shzmy1ybg', () => {

  test('@banking MODULE-001: View bank register transaction source list and apply filters @Tnt58xcfw', async ({ page }) => {

    //
    // STEP 1: Navigate to Banking Dashboard
    //
    await page.goto('/banking', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    const bankingHeader = page.getByTestId('banking-dashboard-header');
    await bankingHeader.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(bankingHeader).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 2: Click on Bank Register or Transaction Source
    //
    const transactionSourceLink = page.getByTestId('transaction-source-link');
    await transactionSourceLink.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await transactionSourceLink.click({ timeout: ACTION_TIMEOUT });

    await page.waitForLoadState('networkidle');
    await page.waitForURL(/\/transaction-source/, { timeout: ACTION_TIMEOUT });

    //
    // STEP 3: View the list of all transactions
    //
    const transactionList = page.getByTestId('transactions-table');
    await transactionList.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(transactionList).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const runningBalance = page.getByTestId('running-balance');
    await runningBalance.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(runningBalance).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const chronologicalIndicator = page.getByTestId('transactions-sorted-chronologically');
    await chronologicalIndicator.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(chronologicalIndicator).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 4: Apply date filter to narrow results
    //
    const dateFromInput = page.getByTestId('date-filter-from');
    await dateFromInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await dateFromInput.fill('2023-01-01', { timeout: ACTION_TIMEOUT });

    const dateToInput = page.getByTestId('date-filter-to');
    await dateToInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await dateToInput.fill('2023-12-31', { timeout: ACTION_TIMEOUT });

    const applyFilterButton = page.getByTestId('apply-filters');
    await applyFilterButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await applyFilterButton.click({ timeout: ACTION_TIMEOUT });

    await page.waitForLoadState('networkidle');

    const activeFilters = page.getByTestId('active-filters');
    await activeFilters.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(activeFilters).toBeVisible({ timeout: EXPECT_TIMEOUT });

    await expect(transactionList).toBeVisible({ timeout: EXPECT_TIMEOUT });

  });

});