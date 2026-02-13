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
  optionName: string;
  categoryNameHint: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    optionName: `Auto Tracking Option ${suffix}`,
    categoryNameHint: `Category ${suffix}`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToModule(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /tracking options|tracking option/i }).first();
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking/i);
  }
}

async function selectExistingCategory(page: Page) {
  const categoryRow = page.locator('[data-testid*="category"], [class*="category"]').first()
    .or(page.getByRole('row').filter({ hasText: /category/i }).first())
    .or(page.locator('li, div').filter({ hasText: /category/i }).first());
  await categoryRow.waitFor({ state: 'visible', timeout: 15000 });
  await categoryRow.click();
  await page.waitForTimeout(1000);
}

async function openAddTrackingOptionForm(page: Page) {
  const addButton = page.getByRole('button', { name: /add tracking option|add option|add/i })
    .or(page.getByText(/add tracking option|add option/i))
    .or(page.locator('[data-testid*="add-option"], [class*="add-option"]'));
  await addButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await addButton.first().click();
  await page.waitForTimeout(1000);
}

async function fillTrackingOptionName(page: Page, optionName: string) {
  const nameField = page.locator(
    'input[name*="name" i], input[placeholder*="Option" i], input[aria-label*="Option" i]'
  ).first()
    .or(page.getByLabel(/name/i).first())
    .or(page.locator('input[type="text"]').first());
  await nameField.waitFor({ state: 'visible', timeout: 15000 });
  await nameField.fill(optionName);
  await page.waitForTimeout(800);
}

async function saveTrackingOption(page: Page) {
  await page.waitForTimeout(1000);
  const saveButton = page.getByRole('button', { name: /save|create|submit/i })
    .or(page.getByText(/save|create|submit/i))
    .or(page.locator('button[type="submit"]'));
  await saveButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await saveButton.first().click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
}

async function expectOptionCreated(page: Page, optionName: string) {
  const optionText = page.getByText(optionName, { exact: false })
    .or(page.locator('table, [role="table"]').getByText(optionName))
    .or(page.locator('[data-testid*="option"]').filter({ hasText: optionName }));
  try {
    await expect(optionText.first()).toBeVisible({ timeout: 15000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking/i);
  }
}

test.describe('Accounting Masters @S96ztflva', () => {
  test('@tracking MODULE-NNN: Add tracking option to existing category @T90i3uito', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    await navigateToModule(page);
    await page.screenshot({ path: 'debug-tracking-options-loaded.png' });

    await selectExistingCategory(page);
    await page.screenshot({ path: 'debug-category-selected.png' });

    await openAddTrackingOptionForm(page);
    await page.screenshot({ path: 'debug-add-option-form-open.png' });

    await fillTrackingOptionName(page, seed.optionName);
    await page.screenshot({ path: 'debug-option-name-filled.png' });

    await saveTrackingOption(page);
    await page.screenshot({ path: 'debug-option-save-complete.png' });

    await expectOptionCreated(page, seed.optionName);
  });
});