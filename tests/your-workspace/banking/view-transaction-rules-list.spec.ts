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
test.describe('Your Workspace @Sre6hmho3', () => {

  test('@banking rules list view: Verify user can view all configured transaction rules @T8855635j', async ({ page }) => {

    //
    // STEP 1: Navigate to Banking Dashboard
    //
    await page.goto('/banking', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 2: Click on Transaction Rules
    //
    const transactionRulesLink = page.getByTestId('transaction-rules-link');
    await transactionRulesLink.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await transactionRulesLink.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 3: View the list of all rules
    //
    const rulesPageTitle = page.getByTestId('transaction-rules-title');
    await rulesPageTitle.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });

    const rulesList = page.getByTestId('transaction-rules-list');
    await rulesList.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });

    const ruleCondition = page.getByTestId('transaction-rule-condition');
    await ruleCondition.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });

    const ruleAction = page.getByTestId('transaction-rule-action');
    await ruleAction.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });

    const ruleStatus = page.getByTestId('transaction-rule-status');
    await ruleStatus.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });

    //
    // STEP 4: Assertions for transaction rules page and rule details
    //
    await expect(rulesPageTitle).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(rulesList).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(ruleCondition).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(ruleAction).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(ruleStatus).toBeVisible({ timeout: EXPECT_TIMEOUT });

  });

});