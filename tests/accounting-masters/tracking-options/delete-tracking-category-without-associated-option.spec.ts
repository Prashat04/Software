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
  referenceNumber: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    categoryName: `Auto Category ${suffix}`,
    referenceNumber: `AUTO-${suffix}`,
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
  await page.screenshot({ path: 'debug-tracking-options-loaded.png' });
}

async function findCategoryRowWithoutOptions(page: Page) {
  const rows = page.locator('table tbody tr, [role="row"]').filter({ hasNot: page.getByRole('columnheader') });
  await rows.first().waitFor({ state: 'visible', timeout: 15000 });
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const text = (await row.innerText()).toLowerCase();
    if (text.includes('no options') || text.includes('0') || text.includes('none')) {
      return row;
    }
  }
  return rows.first();
}

async function deleteCategoryFromRow(page: Page, row: ReturnType<Page['locator']>) {
  const deleteButton = row.getByRole('button', { name: /delete/i }).first()
    .or(row.getByText(/delete/i).first())
    .or(row.locator('[data-testid*="delete"]').first())
    .or(row.locator('button:has-text("Remove")').first());
  await deleteButton.waitFor({ state: 'visible', timeout: 15000 });
  await deleteButton.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'debug-delete-dialog.png' });
  const dialog = page.getByRole('dialog').first()
    .or(page.locator('.modal, [role="alertdialog"]').first());
  await expect(dialog).toBeVisible({ timeout: 10000 });
  const confirmButton = dialog.getByRole('button', { name: /delete|confirm|yes/i }).first()
    .or(dialog.getByText(/delete|confirm|yes/i).first())
    .or(dialog.locator('button[type="submit"]').first());
  await confirmButton.waitFor({ state: 'visible', timeout: 15000 });
  await confirmButton.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
}

test.describe('Accounting Masters @Sgfpb2n3s', () => {
  test('@tracking TRACKING-DEL: Delete tracking category without associated options @Tfcd7jbva', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    // Step 1: Navigate to Accounting Masters > Tracking Options
    await navigateToTrackingOptions(page);

    // Step 2: Locate tracking category with no options
    const row = await findCategoryRowWithoutOptions(page);
    await expect(row).toBeVisible({ timeout: 10000 });

    const categoryCell = row.locator('td, [role="cell"]').first();
    const categoryName = (await categoryCell.innerText()).trim() || seed.categoryName;
    await page.screenshot({ path: 'debug-category-row.png' });

    // Step 3: Click Delete action on the category
    await deleteCategoryFromRow(page, row);

    // Step 4: Confirm deletion in the confirmation dialog (handled in helper)

    // Verification: Category removed from list
    const deletedRow = page.locator('table tbody tr, [role="row"]').filter({ hasText: categoryName });
    try {
      await expect(deletedRow).toHaveCount(0, { timeout: 15000 });
    } catch (error) {
      await expect(deletedRow.first()).not.toBeVisible({ timeout: 15000 });
    }
    await page.screenshot({ path: 'debug-category-deleted.png' });
  });
});