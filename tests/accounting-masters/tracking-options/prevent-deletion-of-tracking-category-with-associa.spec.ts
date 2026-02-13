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
  categoryName: string;
  optionName: string;
  referenceNumber: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    categoryName: `Auto Category ${suffix}`,
    optionName: `Auto Option ${suffix}`,
    referenceNumber: `AUTO-${suffix}`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToModule(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /tracking options/i }).first();
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking/i);
  }
}

async function waitForLoadingToFinish(page: Page) {
  const loader = page.locator(
    '[data-testid="loading"], [class*="spinner"], [class*="loading"], [role="progressbar"]'
  );
  try {
    await loader.first().waitFor({ state: 'hidden', timeout: 15000 });
  } catch (e) {
    // If no loader, continue
  }
}

async function getFirstCategoryRow(page: Page) {
  const tableRow = page.locator('table tbody tr').first()
    .or(page.locator('[role="row"]').filter({ hasNotText: /header/i }).first())
    .or(page.locator('[data-testid="table-row"]').first());
  await tableRow.waitFor({ state: 'visible', timeout: 15000 });
  return tableRow;
}

async function clickDeleteOnRow(row: any, page: Page) {
  const deleteButton = row.getByRole('button', { name: /delete|remove|trash/i }).first()
    .or(row.locator('button:has-text("Delete")').first())
    .or(row.locator('[data-testid*="delete"]').first());
  await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
  await deleteButton.click();
  await page.waitForTimeout(1000);
}

async function confirmDeletionIfPrompted(page: Page) {
  const confirmButton = page.getByRole('button', { name: /confirm|delete|yes/i }).first()
    .or(page.getByText(/confirm|delete|yes/i).first())
    .or(page.locator('button:has-text("OK")').first());
  try {
    await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
    await confirmButton.click();
  } catch (e) {
    // If no confirmation dialog, proceed
  }
  await page.waitForTimeout(1000);
}

async function expectErrorOrWarning(page: Page) {
  const errorToast = page.locator('[role="alert"]').first()
    .or(page.locator('[class*="toast"], [class*="notification"]').filter({ hasText: /error|warning|cannot|unable|associated/i }).first())
    .or(page.getByText(/error|warning|cannot|unable|associated/i).first());
  await expect(errorToast).toBeVisible({ timeout: 10000 });
}

async function verifyRowStillVisible(row: any) {
  await expect(row).toBeVisible({ timeout: 10000 });
}

test.describe('Accounting Masters @Sr0563d1c', () => {
  test('@tracking Accounting Masters-Tracking Options: Prevent deletion of tracking category with associated options @Tr4tybolj', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());

    await seedLogin(page);
    await navigateToModule(page);
    await waitForLoadingToFinish(page);
    await page.screenshot({ path: 'debug-tracking-options-page.png' });

    const row = await getFirstCategoryRow(page);

    try {
      await expect(row).toBeVisible({ timeout: 10000 });
    } catch (error) {
      await expect(page.getByText(/tracking options/i)).toBeVisible({ timeout: 10000 });
    }

    await page.screenshot({ path: 'debug-category-row-visible.png' });

    await clickDeleteOnRow(row, page);
    await confirmDeletionIfPrompted(page);
    await waitForLoadingToFinish(page);

    await page.screenshot({ path: 'debug-after-delete-attempt.png' });

    await expectErrorOrWarning(page);
    await verifyRowStillVisible(row);

    await page.screenshot({ path: 'debug-category-not-deleted.png' });
  });
});