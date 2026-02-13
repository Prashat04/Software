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
  searchTerm: string;
  name: string;
  referenceNumber: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    searchTerm: 'Tracking',
    name: `Auto Tracking ${suffix}`,
    referenceNumber: `AUTO-${suffix}`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToModule(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /tracking options|tracking categories/i }).first();
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking/i);
  }
}

async function fillSearch(page: Page, term: string) {
  const searchField = page.getByPlaceholder('Search').first()
    .or(page.locator('input[type="search"]').first())
    .or(page.locator('input[placeholder*="Search" i], input[aria-label*="Search" i]').first());
  await searchField.waitFor({ state: 'visible', timeout: 15000 });
  await searchField.fill('');
  await searchField.type(term, { delay: 50 });
  await page.waitForTimeout(1200);
}

async function waitForFilterResults(page: Page, term: string) {
  const resultsTable = page.locator('table, [role="table"]').first();
  await resultsTable.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(1000);
  const rowWithTerm = page.locator('table tr').filter({ hasText: term }).first()
    .or(page.locator('[role="row"]').filter({ hasText: term }).first())
    .or(page.getByText(new RegExp(term, 'i')).first());
  await rowWithTerm.waitFor({ state: 'visible', timeout: 15000 });
  await expect(rowWithTerm).toBeVisible();
}

test.describe('Accounting Masters @S8025gbzz', () => {
  test('@tracking MODULE-NNN: Search tracking categories @Tmr553yiw', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    // Step 1: Navigate to Accounting Masters > Tracking Options
    await navigateToModule(page);
    await page.screenshot({ path: 'debug-tracking-options-page.png' });

    // Step 2: Enter search term in the search field
    await fillSearch(page, seed.searchTerm);
    await page.screenshot({ path: 'debug-tracking-options-search.png' });

    // Step 3: View filtered results
    await waitForFilterResults(page, seed.searchTerm);

    // Expected Results: page loads, search accepts input, filtered list shows matching categories
    const searchField = page.getByPlaceholder('Search').first()
      .or(page.locator('input[type="search"]').first())
      .or(page.locator('input[placeholder*="Search" i], input[aria-label*="Search" i]').first());
    await expect(searchField).toHaveValue(seed.searchTerm);
  });
});