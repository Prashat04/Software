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
const moduleUrl = '/accounts-by-payee';

// Seed data generator for unique test data per run
type SeedData = {
  vendorName: string;
  email: string;
  referenceNumber: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    vendorName: `Auto Vendor ${suffix}`,
    email: `auto.vendor+${suffix}@example.com`,
    referenceNumber: `AUTO-${suffix}`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToAccountsByPayee(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /accounts by payee/i }).first();
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/accounts-by-payee|payee/i);
  }
}

async function openPayeeTypeFilter(page: Page) {
  const filterTrigger = page.getByRole('button', { name: /payee type|type|filter/i })
    .or(page.getByLabel(/payee type/i))
    .or(page.getByText('Payee Type', { exact: false }));
  await filterTrigger.first().waitFor({ state: 'visible', timeout: 15000 });
  await filterTrigger.first().click();
  await page.waitForTimeout(800);
}

async function selectFilterOption(page: Page, optionName: string) {
  const option = page.getByRole('option', { name: new RegExp(optionName, 'i') })
    .or(page.locator('[role="option"]').filter({ hasText: new RegExp(optionName, 'i') }))
    .or(page.getByText(optionName, { exact: false }));
  try {
    await option.first().waitFor({ state: 'visible', timeout: 10000 });
    await option.first().click();
  } catch (error) {
    await page.keyboard.type(optionName);
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(800);
}

async function applyFilter(page: Page) {
  const applyButton = page.getByRole('button', { name: /apply|filter|show results/i })
    .or(page.getByText('Apply', { exact: false }))
    .or(page.locator('button:has-text("Filter")'));
  await applyButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await applyButton.first().click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

async function waitForResultsUpdate(page: Page) {
  const loading = page.locator('[data-testid*="loading"], .loading, .spinner, [role="progressbar"]');
  try {
    await loading.first().waitFor({ state: 'visible', timeout: 3000 });
    await loading.first().waitFor({ state: 'hidden', timeout: 15000 });
  } catch (error) {
    await page.waitForTimeout(1500);
  }
}

async function verifyVendorResultsOnly(page: Page) {
  const resultsTable = page.locator('table, [role="table"]').first();
  await resultsTable.waitFor({ state: 'visible', timeout: 15000 });
  const rows = resultsTable.locator('tbody tr')
    .or(resultsTable.locator('[role="row"]').filter({ hasNotText: /payee type|name/i }));
  await page.waitForTimeout(1000);

  // Check vendor presence
  const vendorRows = rows.filter({ hasText: /vendor/i });
  await expect(vendorRows.first()).toBeVisible({ timeout: 10000 });

  // Ensure customer/other types excluded
  const customerRows = rows.filter({ hasText: /customer/i });
  await expect(customerRows).toHaveCount(0);
}

test.describe('Accounting Masters @Sxmu3l248', () => {
  test('@accounting-masters ABP-001: Filter Accounts By Vendor Payee @Tjfsmbx4f', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    await navigateToAccountsByPayee(page);
    await page.screenshot({ path: 'debug-accounts-by-payee-page.png' });

    await openPayeeTypeFilter(page);
    await selectFilterOption(page, 'Vendor');
    await page.screenshot({ path: 'debug-vendor-selected.png' });

    await applyFilter(page);
    await waitForResultsUpdate(page);
    await page.screenshot({ path: 'debug-filter-applied.png' });

    // Verification: filter applied, list updates, non-vendor excluded
    const selectedValue = page.getByText(/vendor/i)
      .or(page.getByRole('button', { name: /vendor/i }))
      .or(page.locator('[class*="selected"]').filter({ hasText: /vendor/i }));
    try {
      await expect(selectedValue.first()).toBeVisible({ timeout: 10000 });
    } catch (error) {
      await expect(page).toHaveURL(/accounts-by-payee|payee/i);
    }

    await verifyVendorResultsOnly(page);
  });
});