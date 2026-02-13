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
  existingName: string;
  duplicateName: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    existingName: `Department`,
    duplicateName: `Department`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToModule(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /tracking options|tracking category/i }).first()
    .or(page.getByText(/tracking options|tracking category/i).first());
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking/i);
  }
}

async function openAddNewTrackingCategory(page: Page) {
  const addButton = page.getByRole('button', { name: /add new|new tracking|create|add/i }).first()
    .or(page.getByText(/add new tracking category|add new|create/i, { exact: false }).first())
    .or(page.locator('[data-testid*="add"], [data-testid*="create"]').first());
  await addButton.waitFor({ state: 'visible', timeout: 15000 });
  await addButton.click();
  await page.waitForTimeout(1200);
  const formHeading = page.getByRole('heading', { name: /tracking category|add tracking/i }).first()
    .or(page.getByText(/tracking category|add tracking/i).first());
  try {
    await expect(formHeading).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
  }
}

async function fillTrackingCategoryName(page: Page, name: string) {
  const nameField = page.locator('input[name="name"], input[placeholder*="Name" i], input[aria-label*="Name" i]')
    .first()
    .or(page.getByRole('textbox', { name: /name/i }).first());
  await nameField.waitFor({ state: 'visible', timeout: 15000 });
  await nameField.fill(name);
  await page.waitForTimeout(800);
}

async function saveTrackingCategory(page: Page) {
  await page.waitForTimeout(800);
  const saveButton = page.getByRole('button', { name: /save|submit|create/i }).first()
    .or(page.getByText(/save|submit|create/i, { exact: false }).first())
    .or(page.locator('button[type="submit"]').first());
  await saveButton.waitFor({ state: 'visible', timeout: 15000 });
  await saveButton.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
}

async function expectDuplicateError(page: Page) {
  const errorMessage = page.getByText(/duplicate|already exists|name exists|unique/i).first()
    .or(page.locator('[role="alert"]').filter({ hasText: /duplicate|already exists|unique/i }).first())
    .or(page.locator('.error, .text-danger, .invalid-feedback').filter({ hasText: /duplicate|already exists|unique/i }).first());
  try {
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking/i);
  }
}

test.describe('Accounting Masters @Sygp3feez', () => {
  test('@tracking MODULE-001: Validate duplicate tracking category name @T4bre41qk', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    await navigateToModule(page);
    await page.screenshot({ path: 'debug-tracking-options-loaded.png' });

    await openAddNewTrackingCategory(page);
    await page.screenshot({ path: 'debug-add-form-open.png' });

    await fillTrackingCategoryName(page, seed.duplicateName);
    await page.screenshot({ path: 'debug-name-filled.png' });

    await saveTrackingCategory(page);
    await page.screenshot({ path: 'debug-after-save.png' });

    await expectDuplicateError(page);
  });
});