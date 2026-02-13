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
test.describe('Your Workspace @Sro8wc9f4', () => {

  test('@banking MODULE-001: Apply transaction rule automatically to matching transaction @Tv425a09t', async ({ page }) => {

    //
    // STEP 1: Create a transaction rule with specific conditions
    //
    const suffix = Date.now().toString(36);
    const ruleName = "Auto Rule " + suffix;
    const transactionDescription = "Auto Transaction " + suffix;
    const transactionAmount = "100.00";
    const categoryName = "Utilities";
    const payeeName = "Sample Payee";

    await page.goto('/transaction-source', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

    const createRuleButton = page.getByTestId('create-rule-button');
    await createRuleButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await createRuleButton.click({ timeout: ACTION_TIMEOUT });

    const ruleNameInput = page.getByTestId('rule-name-input');
    await ruleNameInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await ruleNameInput.fill(ruleName, { timeout: ACTION_TIMEOUT });

    const ruleConditionInput = page.getByTestId('rule-condition-description-input');
    await ruleConditionInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await ruleConditionInput.fill(transactionDescription, { timeout: ACTION_TIMEOUT });

    const ruleCategorySelect = page.getByTestId('rule-category-select');
    await ruleCategorySelect.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await ruleCategorySelect.click({ timeout: ACTION_TIMEOUT });

    const categoryOption = page.getByRole('option', { name: categoryName });
    await categoryOption.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await categoryOption.click({ timeout: ACTION_TIMEOUT });

    const rulePayeeSelect = page.getByTestId('rule-payee-select');
    await rulePayeeSelect.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await rulePayeeSelect.click({ timeout: ACTION_TIMEOUT });

    const payeeOption = page.getByRole('option', { name: payeeName });
    await payeeOption.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await payeeOption.click({ timeout: ACTION_TIMEOUT });

    const saveRuleButton = page.getByTestId('save-rule-button');
    await saveRuleButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await saveRuleButton.click({ timeout: ACTION_TIMEOUT });

    const ruleSavedToast = page.getByTestId('rule-saved-toast');
    await expect(ruleSavedToast).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 2: Import or create a new transaction matching the rule
    //
    await page.goto('/banking', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

    const addTransactionButton = page.getByTestId('add-transaction-button');
    await addTransactionButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await addTransactionButton.click({ timeout: ACTION_TIMEOUT });

    const transactionDescriptionInput = page.getByTestId('transaction-description-input');
    await transactionDescriptionInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await transactionDescriptionInput.fill(transactionDescription, { timeout: ACTION_TIMEOUT });

    const transactionAmountInput = page.getByTestId('transaction-amount-input');
    await transactionAmountInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await transactionAmountInput.fill(transactionAmount, { timeout: ACTION_TIMEOUT });

    const saveTransactionButton = page.getByTestId('save-transaction-button');
    await saveTransactionButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await saveTransactionButton.click({ timeout: ACTION_TIMEOUT });

    await page.waitForLoadState('networkidle', { timeout: ACTION_TIMEOUT });

    const newTransactionRow = page.getByTestId('transaction-row-latest');
    await newTransactionRow.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });

    //
    // STEP 3: View the transaction details
    //
    await newTransactionRow.click({ timeout: ACTION_TIMEOUT });

    const transactionDetailsPanel = page.getByTestId('transaction-details-panel');
    await transactionDetailsPanel.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });

    const ruleAppliedBadge = page.getByTestId('rule-applied-badge');
    await expect(ruleAppliedBadge).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const categorizedField = page.getByTestId('transaction-category-value');
    await expect(categorizedField).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const payeeField = page.getByTestId('transaction-payee-value');
    await expect(payeeField).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const ruleApplicationLog = page.getByTestId('rule-application-log');
    await expect(ruleApplicationLog).toBeVisible({ timeout: EXPECT_TIMEOUT });

  });

});