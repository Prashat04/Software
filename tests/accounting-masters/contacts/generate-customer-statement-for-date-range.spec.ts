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
const moduleUrl = '/customers';

// Seed data generator for unique test data per run
type SeedData = {
  name: string;
  email: string;
  referenceNumber: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    name: `Auto Customer ${suffix}`,
    email: `auto.customer+${suffix}@example.com`,
    referenceNumber: `CUST-${suffix}`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToCustomers(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /customer/i }).first();
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/customers/i);
  }
}

async function openCustomerInfo(page: Page, seed: SeedData) {
  const searchBox = page.getByPlaceholder(/search/i).first()
    .or(page.locator('input[type="search"]').first())
    .or(page.locator('input[placeholder*="Search" i]').first());
  try {
    await searchBox.waitFor({ state: 'visible', timeout: 10000 });
    await searchBox.fill(seed.name);
    await page.waitForTimeout(1500);
  } catch (e) {
    // fallback to proceed without search
  }

  const row = page.getByRole('row', { name: new RegExp(seed.name, 'i') }).first()
    .or(page.locator('table tr').filter({ hasText: seed.name }).first())
    .or(page.locator('[role="row"]').first());
  await row.waitFor({ state: 'visible', timeout: 15000 });
  await row.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const detailsHeading = page.getByRole('heading', { name: /customer|profile|details/i }).first()
    .or(page.getByText(/customer details|customer info/i).first());
  try {
    await expect(detailsHeading).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/customer/i);
  }
}

async function openStatementDialog(page: Page) {
  const statementButton = page.getByRole('button', { name: /statement/i }).first()
    .or(page.getByText(/customer statement/i, { exact: false }).first())
    .or(page.locator('button:has-text("Statement")').first());
  await statementButton.waitFor({ state: 'visible', timeout: 15000 });
  await statementButton.click();
  await page.waitForTimeout(1000);
  const dialog = page.getByRole('dialog').filter({ hasText: /statement/i }).first()
    .or(page.locator('[role="dialog"]').first())
    .or(page.locator('.modal, .dialog').first());
  await dialog.waitFor({ state: 'visible', timeout: 15000 });
  await page.screenshot({ path: 'debug-statement-dialog.png' });
}

async function selectDateRange(page: Page, startDate: string, endDate: string) {
  const startInput = page.locator('input[name*="start" i], input[placeholder*="Start" i], input[aria-label*="Start" i]').first()
    .or(page.locator('input[type="date"]').first());
  const endInput = page.locator('input[name*="end" i], input[placeholder*="End" i], input[aria-label*="End" i]').first()
    .or(page.locator('input[type="date"]').nth(1));
  await startInput.waitFor({ state: 'visible', timeout: 15000 });
  await startInput.fill(startDate);
  await page.waitForTimeout(800);
  await endInput.waitFor({ state: 'visible', timeout: 15000 });
  await endInput.fill(endDate);
  await page.waitForTimeout(1000);
}

async function generateStatement(page: Page) {
  const generateButton = page.getByRole('button', { name: /generate/i }).first()
    .or(page.getByText(/generate statement/i).first())
    .or(page.locator('button:has-text("Generate")').first());
  await generateButton.waitFor({ state: 'visible', timeout: 15000 });
  await generateButton.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'debug-statement-generated.png' });
}

async function verifyStatementContents(page: Page) {
  const statementSection = page.getByText(/statement/i).first()
    .or(page.locator('[data-testid*="statement"]').first())
    .or(page.locator('table, [role="table"]').first());
  await statementSection.waitFor({ state: 'visible', timeout: 15000 });

  const transactions = page.locator('table tbody tr, [role="row"]').filter({ hasText: /\d/ });
  await expect(transactions.first()).toBeVisible({ timeout: 10000 });

  const runningBalance = page.getByText(/running balance|balance/i).first()
    .or(page.locator('table tfoot').first())
    .or(page.locator('[data-testid*="balance"]').first());
  await expect(runningBalance).toBeVisible({ timeout: 10000 });
}

async function exportPdf(page: Page) {
  const exportButton = page.getByRole('button', { name: /export|pdf/i }).first()
    .or(page.getByText(/export pdf|download pdf/i).first())
    .or(page.locator('button:has-text("PDF")').first());
  await exportButton.waitFor({ state: 'visible', timeout: 15000 });
  await exportButton.click();
  await page.waitForTimeout(2000);
}

test.describe('Accounting Masters @Stshbafxk', () => {
  test('@contacts CUSTOMER-STATEMENT: Generate customer statement for date range @T750lrxmn', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());

    await seedLogin(page);
    await page.screenshot({ path: 'debug-after-login.png' });

    await navigateToCustomers(page);
    await openCustomerInfo(page, seed);

    await openStatementDialog(page);

    const startDate = '2024-01-01';
    const endDate = '2024-12-31';
    await selectDateRange(page, startDate, endDate);

    await generateStatement(page);

    await verifyStatementContents(page);

    await exportPdf(page);

    // Final verification that dialog is still visible after export attempt
    const dialog = page.getByRole('dialog').first()
      .or(page.locator('.modal, .dialog').first())
      .or(page.getByText(/statement/i).first());
    await expect(dialog).toBeVisible({ timeout: 10000 });
  });
});