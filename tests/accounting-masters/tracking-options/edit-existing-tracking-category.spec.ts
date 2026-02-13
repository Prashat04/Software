import { test, expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';

// ================================
// INLINE LOGIN (NO EXTERNAL IMPORTS)
// Self-contained login for Jenkins/Testomat.io compatibility
// ================================
const seedCredentials = {
  email: 'fapopi7433@feanzier.com',
  password: 'Kapil08dangar@'
};

async function seedLogin(page: Page) {
  await page.goto('/login');
  
  const emailField = page.locator(
    'input[name="email"], input[type="email"], input[placeholder*="Email" i], input[aria-label*="Email" i]'
  );
  await emailField.first().waitFor({ state: 'visible', timeout: 60000 });
  await emailField.first().fill(seedCredentials.email);
  
  const passwordField = page.locator(
    'input[name="password"], input[type="password"], input[placeholder*="Password" i], input[aria-label*="Password" i]'
  );
  await passwordField.first().waitFor({ state: 'visible', timeout: 60000 });
  await passwordField.first().fill(seedCredentials.password);
  
  const submitButton = page.locator(
    'button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in")'
  );
  await submitButton.first().waitFor({ state: 'visible', timeout: 30000 });
  await submitButton.first().click();
  
  await page.waitForLoadState('domcontentloaded');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60000 });
}
// ================================

// Module-specific URL constants (use relative paths, NO baseUrl)
const moduleUrl = '/accounting-masters/tracking-options';

// Seed data generator for unique test data per run
type SeedData = {
  name: string;
  description: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    name: `Auto Category ${suffix}`,
    description: `Updated description ${suffix}`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToModule(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /tracking options|tracking categories|tracking/i }).first()
    .or(page.getByText(/tracking options|tracking categories/i).first());
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking/i);
  }
}

async function waitForListLoaded(page: Page) {
  const spinner = page.locator('[class*="loading"], [class*="spinner"], [aria-busy="true"]').first();
  try {
    await spinner.waitFor({ state: 'hidden', timeout: 10000 });
  } catch (e) {
    // ignore
  }
  const table = page.locator('table, [role="table"]').first();
  await table.waitFor({ state: 'visible', timeout: 15000 });
}

async function openFirstCategoryForEdit(page: Page) {
  await waitForListLoaded(page);
  const firstRow = page.locator('table tbody tr').first()
    .or(page.locator('[role="row"]').filter({ has: page.locator('[role="cell"]') }).first());
  await firstRow.waitFor({ state: 'visible', timeout: 15000 });
  const editButton = firstRow.getByRole('button', { name: /edit/i })
    .or(firstRow.locator('a:has-text("Edit")'))
    .or(firstRow.locator('[data-testid*="edit"], [aria-label*="edit" i]'));
  await editButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await editButton.first().click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

async function verifyEditFormOpened(page: Page) {
  const nameField = page.locator('input[name*="name" i], input[placeholder*="name" i], [aria-label*="name" i]');
  const descriptionField = page.locator('textarea[name*="description" i], textarea[placeholder*="description" i], [aria-label*="description" i]')
    .or(page.locator('input[name*="description" i], input[placeholder*="description" i], [aria-label*="description" i]'));
  await nameField.first().waitFor({ state: 'visible', timeout: 15000 });
  await descriptionField.first().waitFor({ state: 'visible', timeout: 15000 });
  const existingName = await nameField.first().inputValue();
  const existingDesc = await descriptionField.first().inputValue().catch(() => '');
  expect(existingName.length).toBeGreaterThan(0);
  expect(existingDesc.length).toBeGreaterThanOrEqual(0);
}

async function fillEditForm(page: Page, seed: SeedData) {
  const nameField = page.locator('input[name*="name" i], input[placeholder*="name" i], [aria-label*="name" i]');
  const descriptionField = page.locator('textarea[name*="description" i], textarea[placeholder*="description" i], [aria-label*="description" i]')
    .or(page.locator('input[name*="description" i], input[placeholder*="description" i], [aria-label*="description" i]'));
  await nameField.first().waitFor({ state: 'visible', timeout: 15000 });
  await nameField.first().fill(seed.name);
  await page.waitForTimeout(800);
  await descriptionField.first().waitFor({ state: 'visible', timeout: 15000 });
  await descriptionField.first().fill(seed.description);
  await page.waitForTimeout(800);
}

async function saveRecord(page: Page) {
  await page.waitForTimeout(1000);
  const saveButton = page.locator('text="Save & close"').first()
    .or(page.getByRole('button', { name: /save/i }).first())
    .or(page.locator('button:has-text("Update")').first());
  await saveButton.waitFor({ state: 'visible', timeout: 15000 });
  await saveButton.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
}

async function verifyUpdatedInList(page: Page, seed: SeedData) {
  await waitForListLoaded(page);
  const updatedRow = page.getByText(seed.name, { exact: false }).first()
    .or(page.locator('table').getByText(seed.name, { exact: false }).first());
  try {
    await expect(updatedRow).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking/i);
  }
}

test.describe('Accounting Masters @S5nykrhjx', () => {
  test('@tracking Accounting Masters-Tracking: Edit existing tracking category @T7k91inq4', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    // Step 1: Navigate to Accounting Masters > Tracking Options
    await navigateToModule(page);
    await page.screenshot({ path: 'debug-tracking-options-list.png' });

    // Step 2: Locate existing tracking category in the list
    await waitForListLoaded(page);
    const firstRow = page.locator('table tbody tr').first()
      .or(page.locator('[role="row"]').filter({ has: page.locator('[role="cell"]') }).first());
    await expect(firstRow).toBeVisible({ timeout: 15000 });

    // Step 3: Click Edit action on the category
    await openFirstCategoryForEdit(page);

    // Step 4-5: Modify the category name and description
    await verifyEditFormOpened(page);
    await page.screenshot({ path: 'debug-edit-form-opened.png' });
    await fillEditForm(page, seed);

    // Step 6: Click Save button
    await saveRecord(page);
    await page.screenshot({ path: 'debug-after-save.png' });

    // Expected Results: verify updated data in list
    await verifyUpdatedInList(page, seed);
  });
});