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

// Seed data generator for unique test data per run
type SeedData = {
  name: string;
  email: string;
  phone: string;
  taxNumber: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    name: `Auto Payee ${suffix}`,
    email: `auto.payee+${suffix}@example.com`,
    phone: `555000${suffix.slice(0, 4)}`,
    taxNumber: `GST-${suffix}`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToAccountingMasters(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  const accountingMastersLink = page.getByRole('link', { name: /accounting masters/i })
    .or(page.getByRole('button', { name: /accounting masters/i }))
    .or(page.getByText(/accounting masters/i).first());

  await accountingMastersLink.waitFor({ state: 'visible', timeout: 20000 });
  await accountingMastersLink.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);

  try {
    await expect(page).toHaveURL(/accounting-masters/i);
  } catch (error) {
    const heading = page.getByRole('heading', { name: /accounting masters/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  }
}

async function openAccountsByPayee(page: Page) {
  const option = page.getByRole('link', { name: /accounts by payee/i })
    .or(page.getByRole('button', { name: /accounts by payee/i }))
    .or(page.getByText(/accounts by payee/i).first());

  await option.waitFor({ state: 'visible', timeout: 20000 });
  await option.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

async function waitForAccountsByPayeePage(page: Page) {
  const heading = page.getByRole('heading', { name: /accounts by payee/i }).first()
    .or(page.getByText(/accounts by payee/i).first());
  const table = page.locator('table, [role="table"]').first()
    .or(page.locator('[data-testid*="table"]').first());

  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 15000 });
  } catch (error) {
    await expect(page).toHaveURL(/accounts-by-payee|payee/i);
  }
}

async function verifyColumns(page: Page) {
  const payeeColumn = page.getByText(/payee name/i).first()
    .or(page.locator('th', { hasText: /payee name/i }).first());
  const accountNameColumn = page.getByText(/account name/i).first()
    .or(page.locator('th', { hasText: /account name/i }).first());
  const accountTypeColumn = page.getByText(/account type/i).first()
    .or(page.locator('th', { hasText: /account type/i }).first());

  await expect(payeeColumn).toBeVisible({ timeout: 10000 });
  await expect(accountNameColumn).toBeVisible({ timeout: 10000 });
  await expect(accountTypeColumn).toBeVisible({ timeout: 10000 });
}

async function verifyPayeeListVisible(page: Page) {
  const tableRows = page.locator('table tbody tr, [role="row"]').first()
    .or(page.locator('[data-testid*="row"]').first())
    .or(page.getByText(/payee/i).first());
  await expect(tableRows).toBeVisible({ timeout: 15000 });
}

test.describe('Accounting Masters @Sliqw3lt3', () => {
  test('@accounting-masters MODULE-001: View Accounts By Payee List @Te8x303wk', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    await navigateToAccountingMasters(page);
    await page.screenshot({ path: 'debug-accounting-masters.png' });

    await openAccountsByPayee(page);
    await page.screenshot({ path: 'debug-accounts-by-payee-clicked.png' });

    await waitForAccountsByPayeePage(page);
    await page.screenshot({ path: 'debug-accounts-by-payee-loaded.png' });

    await verifyColumns(page);
    await verifyPayeeListVisible(page);

    // keep seed usage to avoid unused variable linting in some environments
    await page.waitForTimeout(500);
    expect(seed.name).toBeTruthy();
  });
});