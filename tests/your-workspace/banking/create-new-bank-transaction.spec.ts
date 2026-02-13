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
test.describe('Your Workspace @Swfzg5pjd', () => {

  test('@banking @transaction @create MODULE-001: Create New Bank Transaction @Trgsyfuen', async ({ page }) => {

    //
    // STEP 1: Navigate to Banking Dashboard
    //
    await page.goto('/banking', { timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    //
    // STEP 2: Click on Create Transaction button
    //
    const createTransactionButton = page.getByTestId('create-transaction-button');
    await createTransactionButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await createTransactionButton.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 3: Fill in transaction details (date, amount, description)
    //
    const transactionForm = page.getByTestId('transaction-form');
    await transactionForm.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(transactionForm).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const dateInput = page.getByTestId('transaction-date');
    await dateInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await dateInput.fill('2024-01-15', { timeout: ACTION_TIMEOUT });
    await expect(dateInput).toBeEditable({ timeout: EXPECT_TIMEOUT });

    const amountInput = page.getByTestId('transaction-amount');
    await amountInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await amountInput.fill('250.00', { timeout: ACTION_TIMEOUT });
    await expect(amountInput).toBeEditable({ timeout: EXPECT_TIMEOUT });

    const suffix = Date.now().toString(36);
    const description = 'Auto Transaction ' + suffix;

    const descriptionInput = page.getByTestId('transaction-description');
    await descriptionInput.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await descriptionInput.fill(description, { timeout: ACTION_TIMEOUT });
    await expect(descriptionInput).toBeEditable({ timeout: EXPECT_TIMEOUT });

    //
    // STEP 4: Select transaction type (deposit/withdrawal)
    //
    const transactionTypeSelect = page.getByTestId('transaction-type');
    await transactionTypeSelect.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await transactionTypeSelect.click({ timeout: ACTION_TIMEOUT });

    const depositOption = page.getByTestId('transaction-type-deposit');
    await depositOption.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await depositOption.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 5: Select account category
    //
    const accountCategorySelect = page.getByTestId('account-category');
    await accountCategorySelect.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await accountCategorySelect.click({ timeout: ACTION_TIMEOUT });

    const categoryOption = page.getByTestId('account-category-option-1');
    await categoryOption.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await categoryOption.click({ timeout: ACTION_TIMEOUT });

    //
    // STEP 6: Click Save
    //
    const saveButton = page.getByTestId('save-transaction-button');
    await saveButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await saveButton.click({ timeout: ACTION_TIMEOUT });
    await page.waitForLoadState('networkidle');

    const successToast = page.getByTestId('toast-success');
    await expect(successToast).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const transactionList = page.getByTestId('transaction-list');
    await transactionList.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(transactionList).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const newTransactionRow = page.getByRole('row', { name: new RegExp(description) });
    await newTransactionRow.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(newTransactionRow).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const accountBalance = page.getByTestId('account-balance');
    await accountBalance.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT });
    await expect(accountBalance).toBeVisible({ timeout: EXPECT_TIMEOUT });

  });

});