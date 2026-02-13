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
test.describe('Your Workspace @Svwpon8is', () => {

  test('@banking @filter @date MODULE-001: Filter Transactions by Date Range @T5c4vkttm', async ({ page }) => {

    const startDateValue = '2023-01-01';
    const endDateValue = '2023-12-31';

    //
    // STEP 1: Navigate to Banking Dashboard
    //
    await page.goto('/banking', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

    //
    // STEP 2: Locate date filter controls
    //
    const startDateInput = page.getByTestId('date-filter-start');
    const endDateInput = page.getByTestId('date-filter-end');
    const applyFilterButton = page.getByTestId('apply-date-filter');

    await startDateInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await endDateInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await applyFilterButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });

    await expect(startDateInput).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(endDateInput).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(applyFilterButton).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 3: Set start date
    //
    await startDateInput.click({ timeout: ACTION_TIMEOUT });
    await startDateInput.fill(startDateValue, { timeout: ACTION_TIMEOUT });

    //
    // STEP 4: Set end date
    //
    await endDateInput.click({ timeout: ACTION_TIMEOUT });
    await endDateInput.fill(endDateValue, { timeout: ACTION_TIMEOUT });

    //
    // STEP 5: Apply filter
    //
    const transactionCount = page.getByTestId('transaction-count');
    await transactionCount.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    const countBeforeText = (await transactionCount.textContent())?.trim() || '';

    await applyFilterButton.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

    const transactionList = page.getByTestId('transaction-list');
    await transactionList.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });

    await expect(transactionList).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(transactionCount).not.toHaveText(countBeforeText, { timeout: EXPECT_TIMEOUT });

    const transactionRows = page.getByTestId('transaction-row');
    const rowCount = await transactionRows.count();
    const maxRowsToCheck = Math.min(rowCount, 5);

    const startMs = Date.parse(startDateValue);
    const endMs = Date.parse(endDateValue);

    for (let i = 0; i < maxRowsToCheck; i++) {
      const dateCell = transactionRows.nth(i).getByTestId('transaction-date');
      await dateCell.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
      const dateText = (await dateCell.textContent())?.trim() || '';
      const parsedDate = Date.parse(dateText);

      expect(Number.isNaN(parsedDate)).toBe(false);
      expect(parsedDate).toBeGreaterThanOrEqual(startMs);
      expect(parsedDate).toBeLessThanOrEqual(endMs);
    }

    //
    // STEP 6: Clear filter
    //
    const clearFilterButton = page.getByTestId('clear-date-filter');
    await clearFilterButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await clearFilterButton.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

    await expect(startDateInput).toHaveValue('', { timeout: EXPECT_TIMEOUT });
    await expect(endDateInput).toHaveValue('', { timeout: EXPECT_TIMEOUT });

  });

});