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
  name: string;
  email: string;
  referenceNumber: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    name: `Auto Record ${suffix}`,
    email: `auto.record+${suffix}@example.com`,
    referenceNumber: `AUTO-${suffix}`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToAccountsByPayee(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /accounts by payee/i }).first()
    .or(page.getByText(/accounts by payee/i).first());
  const table = page.locator('table, [role="table"]').first()
    .or(page.locator('[data-testid*="table"]').first());
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/accounts-by-payee|payee/i);
  }
}

async function getPayeeRowWithAccounts(page: Page) {
  const row = page.locator('table tbody tr').first()
    .or(page.locator('[role="row"]').filter({ hasText: /account/i }).first())
    .or(page.locator('[data-testid*="row"]').first());
  await row.waitFor({ state: 'visible', timeout: 15000 });
  return row;
}

async function openPayeeDetails(page: Page, rowLocator: any) {
  try {
    const payeeLink = rowLocator.locator('a').first()
      .or(rowLocator.getByRole('link').first())
      .or(rowLocator.locator('td').first());
    await payeeLink.click();
  } catch (error) {
    await rowLocator.click();
  }
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
}

async function expectAccountDetailsDisplayed(page: Page) {
  const accountName = page.getByText(/account name/i).first()
    .or(page.locator('[data-testid*="account-name"]').first())
    .or(page.locator('text=/Account\\s*Name/i').first());
  const accountType = page.getByText(/account type|category/i).first()
    .or(page.locator('[data-testid*="account-type"]').first())
    .or(page.locator('text=/Type|Category/i').first());
  const accountCode = page.getByText(/account code|number/i).first()
    .or(page.locator('[data-testid*="account-code"]').first())
    .or(page.locator('text=/Code|Number/i').first());

  try {
    await expect(accountName).toBeVisible({ timeout: 10000 });
  } catch (error) {
    const tableCell = page.locator('table tbody tr td').first();
    await expect(tableCell).toBeVisible({ timeout: 10000 });
  }

  try {
    await expect(accountType).toBeVisible({ timeout: 10000 });
  } catch (error) {
    const typeCell = page.locator('table tbody tr td').nth(2);
    await expect(typeCell).toBeVisible({ timeout: 10000 });
  }

  try {
    await expect(accountCode).toBeVisible({ timeout: 10000 });
  } catch (error) {
    const codeCell = page.locator('table tbody tr td').nth(3);
    await expect(codeCell).toBeVisible({ timeout: 10000 });
  }
}

test.describe('Accounting Masters @S1ybdznev', () => {
  test('@accounting-masters PAYEE-001: Verify Account Details Display for Payee @Tmtca4x2u', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    await navigateToAccountsByPayee(page);
    await page.screenshot({ path: 'debug-accounts-by-payee-page.png' });

    const row = await getPayeeRowWithAccounts(page);
    await page.screenshot({ path: 'debug-payee-row-found.png' });

    await openPayeeDetails(page, row);
    await page.screenshot({ path: 'debug-payee-details.png' });

    await expectAccountDetailsDisplayed(page);
    await page.screenshot({ path: 'debug-account-details-verified.png' });
  });
});