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
  email: string;
  referenceNumber: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    name: `Auto Tracking ${suffix}`,
    email: `auto.tracking+${suffix}@example.com`,
    referenceNumber: `TRACK-${suffix}`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToTrackingOptions(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /tracking options|tracking categories|tracking/i }).first();
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking-options|tracking/i);
  }
}

async function openAddNewTrackingCategory(page: Page) {
  const addButton = page.getByRole('button', { name: /add new|new tracking|create tracking|add tracking|add category/i })
    .or(page.getByText(/add new tracking category|add new|new tracking/i, { exact: false }))
    .or(page.locator('[data-testid*="add"]').filter({ hasText: /tracking/i }));
  await addButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await addButton.first().click();
  await page.waitForTimeout(1200);
  const formHeading = page.getByRole('heading', { name: /add|new tracking|create tracking|tracking category/i }).first();
  const form = page.locator('form').first();
  try {
    await expect(formHeading.or(form)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking|category|add/i);
  }
}

async function ensureNameFieldEmpty(page: Page) {
  const nameField = page.getByLabel(/name/i)
    .or(page.locator('input[name*="name" i]'))
    .or(page.locator('input[placeholder*="name" i], input[aria-label*="name" i]'));
  await nameField.first().waitFor({ state: 'visible', timeout: 15000 });
  try {
    await expect(nameField.first()).toHaveValue('', { timeout: 3000 });
  } catch (error) {
    await nameField.first().fill('');
  }
}

async function clickSaveButton(page: Page) {
  await page.waitForTimeout(800);
  const saveButton = page.getByRole('button', { name: /save|submit|create/i })
    .or(page.getByText(/save/i, { exact: false }))
    .or(page.locator('button[type="submit"]'));
  await saveButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await saveButton.first().click();
  await page.waitForTimeout(1200);
}

async function expectRequiredValidationError(page: Page) {
  const validation = page.getByText(/required|cannot be empty|please enter|name is required/i, { exact: false })
    .or(page.locator('[role="alert"]').filter({ hasText: /required|name/i }))
    .or(page.locator('.error, .field-error, .invalid-feedback').filter({ hasText: /required|name/i }));
  await expect(validation.first()).toBeVisible({ timeout: 10000 });
}

test.describe('Accounting Masters @Sb5ch66ji', () => {
  test('@tracking MODULE-001: Validate required fields for tracking category @Tz1mln7w6', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    await navigateToTrackingOptions(page);
    await page.screenshot({ path: 'debug-tracking-options-page.png' });

    await openAddNewTrackingCategory(page);
    await page.screenshot({ path: 'debug-add-tracking-form.png' });

    await ensureNameFieldEmpty(page);

    await clickSaveButton(page);
    await page.screenshot({ path: 'debug-after-save-validation.png' });

    await expectRequiredValidationError(page);
  });
});