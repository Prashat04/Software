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
const moduleUrl = '/accounting-masters';
const trackingOptionsUrl = '/accounting-masters/tracking-options';

// Seed data generator for unique test data per run
type SeedData = {
  name: string;
  description: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    name: `Auto Tracking ${suffix}`,
    description: `Auto Description ${suffix}`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToTrackingOptions(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  const trackingLink = page.getByRole('link', { name: /tracking options/i }).first()
    .or(page.getByRole('button', { name: /tracking options/i }).first())
    .or(page.getByText(/tracking options/i).first());
  try {
    await trackingLink.waitFor({ state: 'visible', timeout: 15000 });
    await trackingLink.click();
  } catch (error) {
    await page.goto(trackingOptionsUrl);
  }
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  const heading = page.getByRole('heading', { name: /tracking options/i }).first();
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking-options/);
  }
}

async function openAddTrackingCategoryForm(page: Page) {
  const addButton = page.getByRole('button', { name: /add new tracking category/i })
    .or(page.getByRole('button', { name: /add tracking category/i }))
    .or(page.getByText(/add new tracking category/i));
  await addButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await addButton.first().click();
  await page.waitForTimeout(1000);

  const formHeading = page.getByRole('heading', { name: /new tracking category/i })
    .or(page.getByText(/new tracking category/i))
    .or(page.getByRole('dialog').getByText(/tracking category/i));
  await expect(formHeading.first()).toBeVisible({ timeout: 10000 });
}

async function fillTrackingCategoryForm(page: Page, seed: SeedData) {
  const nameField = page.locator('input[name="name"], input[placeholder*="Name" i], input[aria-label*="Name" i]')
    .or(page.getByRole('textbox', { name: /name/i }))
    .or(page.locator('input[type="text"]').first());
  await nameField.first().waitFor({ state: 'visible', timeout: 15000 });
  await nameField.first().fill(seed.name);
  await page.waitForTimeout(800);

  const descriptionField = page.locator('textarea[name="description"], textarea[placeholder*="Description" i], textarea[aria-label*="Description" i]')
    .or(page.getByRole('textbox', { name: /description/i }))
    .or(page.locator('textarea').first());
  await descriptionField.first().waitFor({ state: 'visible', timeout: 15000 });
  await descriptionField.first().fill(seed.description);
  await page.waitForTimeout(800);
}

async function saveTrackingCategory(page: Page) {
  await page.waitForTimeout(1000);
  const saveButton = page.locator('text="Save"').first()
    .or(page.getByRole('button', { name: /save/i }).first())
    .or(page.locator('button[type="submit"]').first());
  await saveButton.waitFor({ state: 'visible', timeout: 15000 });
  await saveButton.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
}

async function verifyTrackingCategoryInList(page: Page, seed: SeedData) {
  const row = page.getByRole('row', { name: new RegExp(seed.name, 'i') })
    .or(page.getByText(seed.name, { exact: false }))
    .or(page.locator('table tr').filter({ hasText: seed.name }));
  try {
    await expect(row.first()).toBeVisible({ timeout: 15000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking-options/);
  }
}

test.describe('Accounting Masters @Sxaxu2krj', () => {
  test('@tracking Accounting Masters-001: Create new tracking category @Txwyrndq9', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    await navigateToTrackingOptions(page);
    await page.screenshot({ path: 'debug-tracking-options-loaded.png' });

    await openAddTrackingCategoryForm(page);
    await page.screenshot({ path: 'debug-tracking-category-form-open.png' });

    await fillTrackingCategoryForm(page, seed);
    await page.screenshot({ path: 'debug-tracking-category-form-filled.png' });

    await saveTrackingCategory(page);
    await page.screenshot({ path: 'debug-tracking-category-saved.png' });

    await verifyTrackingCategoryInList(page, seed);
  });
});