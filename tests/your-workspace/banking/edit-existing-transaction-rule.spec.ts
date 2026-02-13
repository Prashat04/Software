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
test.describe('Your Workspace @Sz30flaza', () => {

  test('@banking @rules @edit MODULE-001: Edit existing transaction rule @Tog2a55r5', async ({ page }) => {

    const suffix = Date.now().toString(36);
    const updatedRuleName = "Updated Rule " + suffix;

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
    // STEP 3: Select an existing rule
    //
    const rulesList = page.getByTestId('transaction-rules-list');
    await rulesList.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });

    const firstRuleRow = page.getByTestId('transaction-rule-row-0');
    await firstRuleRow.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await firstRuleRow.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 4: Click Edit
    //
    const editButton = page.getByTestId('transaction-rule-edit-button');
    await editButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await editButton.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 5: Modify rule conditions or actions
    //
    const editForm = page.getByTestId('transaction-rule-edit-form');
    await editForm.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });

    const ruleNameInput = page.getByTestId('transaction-rule-name-input');
    await ruleNameInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(ruleNameInput).toBeEditable({ timeout: EXPECT_TIMEOUT });
    await ruleNameInput.fill(updatedRuleName, { timeout: ACTION_TIMEOUT });

    const conditionInput = page.getByTestId('transaction-rule-condition-input');
    await conditionInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(conditionInput).toBeEditable({ timeout: EXPECT_TIMEOUT });

    const actionSelect = page.getByTestId('transaction-rule-action-select');
    await actionSelect.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(actionSelect).toBeEditable({ timeout: EXPECT_TIMEOUT });
    await actionSelect.click({ timeout: ACTION_TIMEOUT });

    const actionOption = page.getByTestId('transaction-rule-action-option-0');
    await actionOption.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await actionOption.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 6: Save changes
    //
    const saveButton = page.getByTestId('transaction-rule-save-button');
    await saveButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await saveButton.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 7: Verify edit form opens with existing rule data
    //
    await expect(editForm).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 8: Verify all fields are editable
    //
    await expect(ruleNameInput).toBeEditable({ timeout: EXPECT_TIMEOUT });
    await expect(conditionInput).toBeEditable({ timeout: EXPECT_TIMEOUT });
    await expect(actionSelect).toBeEditable({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 9: Verify changes are saved successfully
    //
    const successToast = page.getByTestId('toast-success');
    await successToast.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(successToast).toBeVisible({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 10: Verify updated rule is reflected in the list
    //
    const updatedRuleRow = page.getByTestId('transaction-rule-row-0');
    await updatedRuleRow.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(updatedRuleRow).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const updatedRuleNameCell = page.getByTestId('transaction-rule-row-0-name');
    await updatedRuleNameCell.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(updatedRuleNameCell).toHaveText(updatedRuleName, { timeout: EXPECT_TIMEOUT });

  });

});