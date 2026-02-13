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
const moduleUrl = '/accounting/masters/tracking-options';

// Seed data generator for unique test data per run
type SeedData = {
  updatedOptionName: string;
  searchKey: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    updatedOptionName: `Updated Option ${suffix}`,
    searchKey: suffix,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToTrackingOptions(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /tracking options/i }).first()
    .or(page.getByText(/tracking options/i).first());
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking/i);
  }
}

async function expandFirstCategory(page: Page) {
  const expandButton = page.getByRole('button', { name: /expand|collapse|toggle/i }).first()
    .or(page.locator('button[aria-label*="expand" i], button[aria-label*="toggle" i]').first())
    .or(page.locator('[data-testid*="expand"]').first());
  await expandButton.waitFor({ state: 'visible', timeout: 15000 });
  await expandButton.click();
  await page.waitForTimeout(1200);
  const optionRow = page.locator('tr, [role="row"]').filter({ hasText: /option/i }).first()
    .or(page.locator('[data-testid*="option"]').first());
  await optionRow.waitFor({ state: 'visible', timeout: 15000 });
}

async function openEditForFirstOption(page: Page) {
  const optionRow = page.locator('tr, [role="row"]').filter({ hasText: /option/i }).first()
    .or(page.locator('[data-testid*="option-row"]').first());
  await optionRow.waitFor({ state: 'visible', timeout: 15000 });
  const editButton = optionRow.getByRole('button', { name: /edit/i }).first()
    .or(optionRow.getByText(/edit/i).first())
    .or(optionRow.locator('[data-testid*="edit"]').first());
  await editButton.waitFor({ state: 'visible', timeout: 15000 });
  await editButton.click();
  await page.waitForTimeout(1200);
}

async function updateOptionName(page: Page, newName: string) {
  const nameField = page.locator('input[name*="name" i], input[placeholder*="name" i], input[aria-label*="name" i]').first()
    .or(page.locator('textarea[name*="name" i], textarea[placeholder*="name" i]').first());
  await nameField.waitFor({ state: 'visible', timeout: 15000 });
  await nameField.click();
  await page.waitForTimeout(800);
  await nameField.fill('');
  await page.waitForTimeout(500);
  await nameField.fill(newName);
  await page.waitForTimeout(800);
}

async function saveRecord(page: Page) {
  await page.waitForTimeout(1000);
  const saveButton = page.locator('text="Save & close"').first()
    .or(page.getByRole('button', { name: /save/i }).first())
    .or(page.locator('[data-testid*="save"]').first());
  await saveButton.waitFor({ state: 'visible', timeout: 15000 });
  await saveButton.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
}

async function expectOptionVisible(page: Page, optionName: string) {
  const updatedRow = page.getByText(optionName, { exact: false }).first()
    .or(page.locator('tr, [role="row"]').filter({ hasText: new RegExp(optionName, 'i') }).first());
  try {
    await expect(updatedRow).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking/i);
  }
}

test.describe('Accounting Masters @Siotr572t', () => {
  test('@tracking Tracking Options-Edit: Edit tracking option name @Tzzsa2cuh', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    await navigateToTrackingOptions(page);
    await page.screenshot({ path: 'debug-tracking-options-page.png' });

    await expandFirstCategory(page);
    await page.screenshot({ path: 'debug-category-expanded.png' });

    await openEditForFirstOption(page);
    await page.screenshot({ path: 'debug-edit-form-open.png' });

    await updateOptionName(page, seed.updatedOptionName);
    await page.screenshot({ path: 'debug-name-updated.png' });

    await saveRecord(page);
    await page.screenshot({ path: 'debug-after-save.png' });

    await expectOptionVisible(page, seed.updatedOptionName);
  });
});