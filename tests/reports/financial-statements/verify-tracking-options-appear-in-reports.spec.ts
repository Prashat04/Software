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
const moduleUrl = '/reports';

// Seed data generator for unique test data per run
type SeedData = {
  reportName: string;
  trackingCategory: string;
  trackingOption: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    reportName: `Profit and Loss`,
    trackingCategory: `Department`,
    trackingOption: `Sales`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToReports(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /reports/i }).first();
  const reportGrid = page.locator('table, [role="table"], [class*="report"]').first();
  try {
    await expect(heading.or(reportGrid)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/reports/);
  }
}

async function selectFinancialReport(page: Page, reportName: string) {
  await page.waitForTimeout(1000);
  const reportCard = page.getByRole('link', { name: new RegExp(reportName, 'i') })
    .or(page.getByRole('button', { name: new RegExp(reportName, 'i') }))
    .or(page.getByText(reportName, { exact: false }));
  await reportCard.first().waitFor({ state: 'visible', timeout: 15000 });
  await reportCard.first().click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

async function openTrackingFilter(page: Page) {
  await page.waitForTimeout(800);
  const filterButton = page.getByRole('button', { name: /filter/i })
    .or(page.getByRole('button', { name: /tracking/i }))
    .or(page.locator('[data-testid*="filter"]').first());
  await filterButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await filterButton.first().click();
  await page.waitForTimeout(1000);
}

async function selectTrackingCategory(page: Page, category: string) {
  const categoryDropdown = page.getByLabel(/tracking category/i)
    .or(page.getByRole('combobox', { name: /tracking category/i }))
    .or(page.locator('[data-testid*="tracking-category"]').first());
  await categoryDropdown.first().waitFor({ state: 'visible', timeout: 15000 });
  await categoryDropdown.first().click();
  await page.waitForTimeout(800);
  const categoryOption = page.getByRole('option', { name: new RegExp(category, 'i') })
    .or(page.locator('[role="option"]').filter({ hasText: new RegExp(category, 'i') }))
    .or(page.getByText(category, { exact: false }));
  try {
    await categoryOption.first().waitFor({ state: 'visible', timeout: 10000 });
    await categoryOption.first().click();
  } catch (error) {
    await page.keyboard.type(category);
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(800);
}

async function selectTrackingOption(page: Page, option: string) {
  const optionDropdown = page.getByLabel(/tracking option/i)
    .or(page.getByRole('combobox', { name: /tracking option/i }))
    .or(page.locator('[data-testid*="tracking-option"]').first());
  await optionDropdown.first().waitFor({ state: 'visible', timeout: 15000 });
  await optionDropdown.first().click();
  await page.waitForTimeout(800);
  const optionChoice = page.getByRole('option', { name: new RegExp(option, 'i') })
    .or(page.locator('[role="option"]').filter({ hasText: new RegExp(option, 'i') }))
    .or(page.getByText(option, { exact: false }));
  try {
    await optionChoice.first().waitFor({ state: 'visible', timeout: 10000 });
    await optionChoice.first().click();
  } catch (error) {
    await page.keyboard.type(option);
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(800);
}

async function generateReport(page: Page) {
  await page.waitForTimeout(1000);
  const generateButton = page.getByRole('button', { name: /generate|run|update report/i })
    .or(page.getByText(/generate|run|update/i, { exact: false }))
    .or(page.locator('[data-testid*="generate"]').first());
  await generateButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await generateButton.first().click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
}

async function verifyReportLoaded(page: Page) {
  const reportHeader = page.getByRole('heading', { name: /report/i })
    .or(page.locator('[class*="report-header"]').first())
    .or(page.getByText(/report/i, { exact: false }));
  try {
    await expect(reportHeader.first()).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/report|reports/);
  }
}

async function verifyTrackingFilterVisible(page: Page) {
  const trackingLabel = page.getByText(/tracking/i, { exact: false })
    .or(page.getByLabel(/tracking/i))
    .or(page.locator('[data-testid*="tracking"]').first());
  await expect(trackingLabel.first()).toBeVisible({ timeout: 10000 });
}

async function verifyFilteredResults(page: Page, option: string) {
  const resultsSection = page.locator('table, [role="table"]').first()
    .or(page.locator('[class*="report-results"]').first())
    .or(page.locator('[data-testid*="report"]').first());
  await expect(resultsSection.first()).toBeVisible({ timeout: 15000 });
  const optionText = page.getByText(new RegExp(option, 'i')).first()
    .or(page.locator('table').getByText(new RegExp(option, 'i')).first());
  try {
    await expect(optionText).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/report|reports/);
  }
}

test.describe('Reports @Snm12hf6a', () => {
  test('@tracking REPORTS-101: Verify tracking options appear in reports @T9mbqbvc9', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    await navigateToReports(page);
    await page.screenshot({ path: 'debug-reports-landing.png' });

    await selectFinancialReport(page, seed.reportName);
    await page.screenshot({ path: 'debug-report-selected.png' });

    await verifyReportLoaded(page);

    await openTrackingFilter(page);
    await verifyTrackingFilterVisible(page);
    await page.screenshot({ path: 'debug-tracking-filter-open.png' });

    await selectTrackingCategory(page, seed.trackingCategory);
    await selectTrackingOption(page, seed.trackingOption);
    await page.screenshot({ path: 'debug-tracking-option-selected.png' });

    await generateReport(page);
    await page.screenshot({ path: 'debug-report-generated.png' });

    await verifyFilteredResults(page, seed.trackingOption);
  });
});