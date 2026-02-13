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
const moduleUrl = '/payees';

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
async function navigateToContacts(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /contacts|payees/i }).first();
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/payees/);
  }
}

async function openVendorsTab(page: Page) {
  const vendorsTab = page.getByRole('tab', { name: /vendor/i })
    .or(page.getByRole('button', { name: /vendor/i }))
    .or(page.getByText(/vendor/i).first());
  await vendorsTab.waitFor({ state: 'visible', timeout: 15000 });
  await vendorsTab.click();
  await page.waitForTimeout(1000);
}

async function openTypeFilter(page: Page) {
  const filterDropdown = page.getByRole('button', { name: /type|filter/i })
    .or(page.getByText(/type|filter/i, { exact: false }))
    .or(page.locator('[aria-label*="Type" i], [data-testid*="filter" i]'));
  await filterDropdown.first().waitFor({ state: 'visible', timeout: 15000 });
  await filterDropdown.first().click();
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
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(1200);
}

async function clearFilter(page: Page) {
  const clearButton = page.getByRole('button', { name: /clear|reset|all/i })
    .or(page.getByText(/clear|reset|all types|all/i, { exact: false }))
    .or(page.locator('[data-testid*="clear" i], [aria-label*="clear" i]'));
  try {
    await clearButton.first().waitFor({ state: 'visible', timeout: 5000 });
    await clearButton.first().click();
  } catch (error) {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(1000);
}

async function getResultCount(page: Page) {
  const countLabel = page.locator('[data-testid*="count" i], [class*="count" i], text=/\\d+\\s+results?/i').first();
  try {
    await countLabel.waitFor({ state: 'visible', timeout: 5000 });
    const text = await countLabel.innerText();
    const match = text.match(/\\d+/);
    return match ? parseInt(match[0], 10) : 0;
  } catch {
    const rows = page.locator('table tbody tr, [role="row"]');
    return await rows.count();
  }
}

async function verifyFilteredByType(page: Page, typeName: RegExp) {
  const typeColumn = page.locator('table tbody tr td').filter({ hasText: typeName }).first()
    .or(page.locator('[role="row"]').filter({ hasText: typeName }).first());
  await expect(typeColumn).toBeVisible({ timeout: 10000 });
}

test.describe('Accounting Masters @S4u1psoar', () => {
  test('@contacts CONTACTS-001: Filter contacts by contact type @Tlc2495mb', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    await navigateToContacts(page);
    await page.screenshot({ path: 'debug-contacts-list.png' });

    // Ensure filter dropdown shows all types (default)
    await openTypeFilter(page);
    const allTypesOption = page.getByRole('option', { name: /all types|all/i })
      .or(page.getByText(/all types|all/i, { exact: false }))
      .or(page.locator('[role="option"]').filter({ hasText: /all/i }));
    await expect(allTypesOption.first()).toBeVisible({ timeout: 10000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);

    const initialCount = await getResultCount(page);

    // Select Vendor filter
    await openTypeFilter(page);
    await selectFilterOption(page, 'Vendor');
    await page.screenshot({ path: 'debug-vendor-filter.png' });

    await verifyFilteredByType(page, /vendor/i);
    const vendorCount = await getResultCount(page);
    expect(vendorCount).toBeLessThanOrEqual(initialCount);

    // Change filter to Customer
    await openTypeFilter(page);
    await selectFilterOption(page, 'Customer');
    await page.screenshot({ path: 'debug-customer-filter.png' });

    await verifyFilteredByType(page, /customer/i);
    const customerCount = await getResultCount(page);
    expect(customerCount).toBeLessThanOrEqual(initialCount);

    // Clear filter
    await openTypeFilter(page);
    await clearFilter(page);
    await page.screenshot({ path: 'debug-clear-filter.png' });

    const clearedCount = await getResultCount(page);
    expect(clearedCount).toBeGreaterThanOrEqual(Math.min(vendorCount, customerCount));
  });
});