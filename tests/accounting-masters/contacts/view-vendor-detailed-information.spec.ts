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
  vendorName: string;
  email: string;
  phone: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    vendorName: `Auto Vendor ${suffix}`,
    email: `auto.vendor+${suffix}@example.com`,
    phone: `555-01${suffix.slice(0, 2)}`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function waitForIdle(page: Page) {
  const loader = page.locator('[data-testid*="loading" i], .spinner, .loading, [role="progressbar"]');
  try {
    await loader.first().waitFor({ state: 'hidden', timeout: 15000 });
  } catch (e) {
    // ignore if no loader
  }
}

async function navigateToContacts(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /contacts|payees|vendors/i }).first()
    .or(page.getByText(/contacts|payees|vendors/i).first())
    .or(page.locator('h1, h2').filter({ hasText: /contacts|payees|vendors/i }).first());
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/payees/);
  }
  await waitForIdle(page);
}

async function goToVendorsTab(page: Page) {
  const vendorsTab = page.getByRole('tab', { name: /vendors/i }).first()
    .or(page.getByRole('button', { name: /vendors/i }).first())
    .or(page.getByText(/vendors/i, { exact: false }).first());
  await vendorsTab.waitFor({ state: 'visible', timeout: 15000 });
  await vendorsTab.click();
  await page.waitForTimeout(1200);
  await waitForIdle(page);
}

async function openFirstVendorDetails(page: Page) {
  const vendorLink = page.locator('table a, [role="table"] a').first()
    .or(page.getByRole('link').filter({ hasText: /.+/ }).first())
    .or(page.locator('[data-testid*="vendor" i] a').first());
  await vendorLink.waitFor({ state: 'visible', timeout: 15000 });
  await vendorLink.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await waitForIdle(page);
}

async function expectVendorInfoLoaded(page: Page) {
  const heading = page.getByRole('heading', { name: /vendor|payee/i }).first()
    .or(page.getByText(/vendor info|payee/i).first())
    .or(page.locator('h1, h2').filter({ hasText: /vendor|payee/i }).first());
  try {
    await expect(heading).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/vendor-info|payees\/edit-vendor|payees\/.+/);
  }
}

async function verifyVendorDetails(page: Page) {
  const detailsSection = page.getByText(/vendor details|profile|information/i).first()
    .or(page.locator('[data-testid*="vendor-details" i]').first())
    .or(page.locator('section').filter({ hasText: /vendor|contact/i }).first());
  await expect(detailsSection).toBeVisible({ timeout: 10000 });

  const contactInfo = page.getByText(/contact information|email|phone/i).first()
    .or(page.locator('[data-testid*="contact" i]').first())
    .or(page.locator('section').filter({ hasText: /email|phone|address/i }).first());
  await expect(contactInfo).toBeVisible({ timeout: 10000 });

  const outstandingBalance = page.getByText(/outstanding balance|balance due|amount due/i).first()
    .or(page.locator('[data-testid*="balance" i]').first())
    .or(page.locator('text=/\\$\\s?\\d+/').first());
  await expect(outstandingBalance).toBeVisible({ timeout: 10000 });
}

async function verifyTransactionsSection(page: Page) {
  const transactions = page.getByText(/transactions|history|activity/i).first()
    .or(page.locator('[data-testid*="transaction" i]').first())
    .or(page.locator('section').filter({ hasText: /transaction|history|activity/i }).first());
  await expect(transactions).toBeVisible({ timeout: 10000 });
}

async function verifyQuickActions(page: Page) {
  const editButton = page.getByRole('button', { name: /edit/i }).first()
    .or(page.getByText(/edit/i, { exact: false }).first())
    .or(page.locator('[data-testid*="edit" i]').first());
  const actionButton = page.getByRole('button', { name: /new|pay|bill|record/i }).first()
    .or(page.getByText(/new|pay|bill|record/i, { exact: false }).first())
    .or(page.locator('[data-testid*="action" i]').first());
  await expect(editButton).toBeVisible({ timeout: 10000 });
  await expect(actionButton).toBeVisible({ timeout: 10000 });
}

test.describe('Accounting Masters @Sadlgoyeb', () => {
  test('@contacts VENDOR-001: View vendor detailed information @T5x6m4cl8', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());

    await seedLogin(page);
    await navigateToContacts(page);
    await page.screenshot({ path: 'debug-contacts-list.png' });

    await goToVendorsTab(page);
    await openFirstVendorDetails(page);
    await page.screenshot({ path: 'debug-vendor-detail.png' });

    // Step 3: Review vendor profile information
    await expectVendorInfoLoaded(page);
    await verifyVendorDetails(page);

    // Step 4: Check associated transactions section
    await verifyTransactionsSection(page);

    // Step 5: Verify contact information display and quick actions
    await verifyQuickActions(page);

    // Additional sanity on URL pattern
    try {
      await expect(page).toHaveURL(/vendor-info|payees\/edit-vendor|payees\/.+/);
    } catch (error) {
      await expect(page.getByText(seed.vendorName, { exact: false }).first()).toBeVisible();
    }
  });
});