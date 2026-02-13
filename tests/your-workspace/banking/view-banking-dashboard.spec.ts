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
test.describe('Your Workspace @Sucnp59xs', () => {

  test('@banking @dashboard @navigation MODULE-001: View Banking Dashboard @Toa6tsz6f', async ({ page }) => {

    //
    // STEP 1: Navigate to Your Workspace from sidebar
    //
    await page.goto('/', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    const workspaceSidebarLink = page.getByTestId('sidebar-workspace');
    await workspaceSidebarLink.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await workspaceSidebarLink.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 2: Click on Banking option
    //
    const bankingSidebarLink = page.getByTestId('sidebar-banking');
    await bankingSidebarLink.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await bankingSidebarLink.click({ timeout: ACTION_TIMEOUT });

    await page.waitForURL(/\/banking/, { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 3: Observe the banking dashboard loading
    //
    const bankingDashboard = page.getByTestId('banking-dashboard');
    const connectedAccountsList = page.getByTestId('connected-accounts-list');
    const transactionSummary = page.getByTestId('transaction-summary');
    const recentTransactionsList = page.getByTestId('recent-transactions-list');

    await bankingDashboard.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await connectedAccountsList.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await transactionSummary.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await recentTransactionsList.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });

    await expect(bankingDashboard).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(connectedAccountsList).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(transactionSummary).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(recentTransactionsList).toBeVisible({ timeout: EXPECT_TIMEOUT });

  });

});