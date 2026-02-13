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
test.describe('Your Workspace @St480tu1a', () => {

  test('@banking @rules @automation @create MODULE-001: Create Transaction Rule @Tspamsu7n', async ({ page }) => {

    const suffix = Date.now().toString(36);
    const ruleName = "Auto Rule " + suffix;
    const descriptionContains = "Grocery " + suffix;
    const categoryName = "Office Supplies";
    const payeeName = "Vendor " + suffix;

    //
    // STEP 1: Navigate to Banking Dashboard
    //
    await page.goto('/banking', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 2: Click on Transaction Rules
    //
    const transactionRulesNav = page.getByTestId('nav-transaction-rules');
    await transactionRulesNav.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await transactionRulesNav.click({ timeout: ACTION_TIMEOUT });
    await page.waitForURL(/transaction-rules/, { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 3: Click Create Transaction Rule
    //
    const createRuleButton = page.getByTestId('create-rule-button');
    await createRuleButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await createRuleButton.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 4: Define rule conditions (description contains, amount range)
    //
    const ruleForm = page.getByTestId('rule-form');
    await ruleForm.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });

    const ruleNameInput = page.getByTestId('rule-name-input');
    await ruleNameInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await ruleNameInput.fill(ruleName, { timeout: ACTION_TIMEOUT });

    const descriptionContainsInput = page.getByTestId('condition-description-input');
    await descriptionContainsInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await descriptionContainsInput.fill(descriptionContains, { timeout: ACTION_TIMEOUT });

    const amountMinInput = page.getByTestId('condition-amount-min-input');
    await amountMinInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await amountMinInput.fill('10', { timeout: ACTION_TIMEOUT });

    const amountMaxInput = page.getByTestId('condition-amount-max-input');
    await amountMaxInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await amountMaxInput.fill('500', { timeout: ACTION_TIMEOUT });

    //
    // STEP 5: Set rule actions (assign category, payee)
    //
    const categorySelect = page.getByTestId('action-category-select');
    await categorySelect.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await categorySelect.click({ timeout: ACTION_TIMEOUT });

    const categoryOption = page.getByRole('option', { name: new RegExp(categoryName, 'i') });
    await categoryOption.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await categoryOption.click({ timeout: ACTION_TIMEOUT });

    const payeeInput = page.getByTestId('action-payee-input');
    await payeeInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await payeeInput.fill(payeeName, { timeout: ACTION_TIMEOUT });

    //
    // STEP 6: Save the rule
    //
    const saveRuleButton = page.getByTestId('save-rule-button');
    await saveRuleButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await saveRuleButton.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 7: Verify transaction rules page opens
    //
    const rulesPageHeader = page.getByTestId('transaction-rules-header');
    await expect(rulesPageHeader).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 8: Verify create rule form is displayed
    //
    await expect(ruleForm).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 9: Verify conditions can be configured
    //
    await expect(descriptionContainsInput).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(amountMinInput).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(amountMaxInput).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 10: Verify actions can be set
    //
    await expect(categorySelect).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(payeeInput).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 11: Verify rule is saved successfully
    //
    const successToast = page.getByTestId('toast-success');
    await expect(successToast).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 12: Verify new rule appears in rules list
    //
    const rulesList = page.getByTestId('rules-list');
    await expect(rulesList).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const newRuleRow = page.getByRole('row', { name: new RegExp(ruleName, 'i') });
    await expect(newRuleRow).toBeVisible({ timeout: EXPECT_TIMEOUT });

  });

});