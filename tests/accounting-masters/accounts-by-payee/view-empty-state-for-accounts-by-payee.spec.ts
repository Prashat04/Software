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
async function navigateToAccountingMasters(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  const sidebarLink = page.getByRole('link', { name: /accounting masters/i })
    .or(page.getByRole('button', { name: /accounting masters/i }))
    .or(page.getByText(/accounting masters/i, { exact: false }));
  try {
    await sidebarLink.first().waitFor({ state: 'visible', timeout: 20000 });
    await sidebarLink.first().click();
  } catch (error) {
    await page.goto(moduleUrl);
  }
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /accounting masters/i }).first()
    .or(page.getByText(/accounting masters/i, { exact: false }));
  try {
    await expect(heading).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/accounting-masters/);
  }
}

async function openAccountsByPayee(page: Page) {
  const menuItem = page.getByRole('link', { name: /accounts by payee/i })
    .or(page.getByRole('button', { name: /accounts by payee/i }))
    .or(page.getByText(/accounts by payee/i, { exact: false }));
  await menuItem.first().waitFor({ state: 'visible', timeout: 15000 });
  await menuItem.first().click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
  const heading = page.getByRole('heading', { name: /accounts by payee/i }).first()
    .or(page.getByText(/accounts by payee/i, { exact: false }));
  try {
    await expect(heading).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/accounts-by-payee|payee/i);
  }
}

async function verifyEmptyState(page: Page) {
  await page.waitForTimeout(1000);
  const emptyStateMessage = page.getByText(/no accounts|empty|no data|nothing to show|no records/i).first()
    .or(page.locator('[data-testid*="empty"]').first())
    .or(page.locator('[class*="empty"]').first());
  await expect(emptyStateMessage).toBeVisible({ timeout: 10000 });

  const cta = page.getByRole('button', { name: /add|create|new|setup/i }).first()
    .or(page.getByRole('link', { name: /add|create|new|setup/i }).first())
    .or(page.getByText(/add|create|new|setup/i, { exact: false }).first());
  try {
    await expect(cta).toBeVisible({ timeout: 8000 });
  } catch (error) {
    const guidanceText = page.getByText(/get started|guidance|create your first|add a payee|add vendor/i).first()
      .or(page.locator('[class*="guidance"]').first());
    await expect(guidanceText).toBeVisible({ timeout: 8000 });
  }
}

test.describe('Accounting Masters @Slekrqvuy', () => {
  test('@accounting-masters MODULE-001: View Empty State for Accounts By Payee @Tbmuvpttr', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);
    await page.screenshot({ path: `debug-login-${seed.referenceNumber}.png` });

    await navigateToAccountingMasters(page);
    await page.screenshot({ path: `debug-accounting-masters-${seed.referenceNumber}.png` });

    await openAccountsByPayee(page);
    await page.screenshot({ path: `debug-accounts-by-payee-${seed.referenceNumber}.png` });

    await verifyEmptyState(page);
    await page.screenshot({ path: `debug-empty-state-${seed.referenceNumber}.png` });
  });
});