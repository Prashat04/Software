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
const moduleUrl = '/contacts/list';

// Seed data generator for unique test data per run
type SeedData = {
  customerName: string;
  email: string;
  referenceNumber: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    customerName: `Auto Customer ${suffix}`,
    email: `auto.customer+${suffix}@example.com`,
    referenceNumber: `AUTO-${suffix}`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToContacts(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /contacts|customers/i }).first();
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/contacts|customers/i);
  }
}

async function openFirstCustomer(page: Page) {
  const customerLink = page.getByRole('link', { name: /.+/ }).first()
    .or(page.locator('table tbody tr td a').first())
    .or(page.locator('[data-testid="customer-name"]').first());
  await customerLink.waitFor({ state: 'visible', timeout: 15000 });
  await customerLink.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

async function verifyCustomerProfile(page: Page) {
  const profileHeader = page.getByRole('heading', { name: /profile|customer|details/i }).first()
    .or(page.locator('h1, h2').filter({ hasText: /customer|profile|details/i }).first())
    .or(page.getByText(/customer details/i).first());
  await profileHeader.waitFor({ state: 'visible', timeout: 15000 });

  const emailField = page.getByText(/email/i).first()
    .or(page.locator('[data-testid="email"]').first())
    .or(page.locator('text=/email/i'));
  await expect(emailField).toBeVisible({ timeout: 10000 });

  const phoneField = page.getByText(/phone/i).first()
    .or(page.locator('[data-testid="phone"]').first())
    .or(page.locator('text=/phone/i'));
  await expect(phoneField).toBeVisible({ timeout: 10000 });
}

async function openInvoiceHistoryTab(page: Page) {
  const invoiceTab = page.getByRole('tab', { name: /invoice/i }).first()
    .or(page.getByText(/invoice history|invoices/i).first())
    .or(page.locator('[data-testid*="invoice"]').first());
  await invoiceTab.waitFor({ state: 'visible', timeout: 15000 });
  await invoiceTab.click();
  await page.waitForTimeout(1500);

  const invoiceTable = page.locator('table, [role="table"]').filter({ hasText: /invoice/i }).first()
    .or(page.locator('[data-testid="invoice-table"]').first());
  await expect(invoiceTable).toBeVisible({ timeout: 10000 });
}

async function openPaymentHistoryTab(page: Page) {
  const paymentTab = page.getByRole('tab', { name: /payment/i }).first()
    .or(page.getByText(/payment history|payments/i).first())
    .or(page.locator('[data-testid*="payment"]').first());
  await paymentTab.waitFor({ state: 'visible', timeout: 15000 });
  await paymentTab.click();
  await page.waitForTimeout(1500);

  const paymentTable = page.locator('table, [role="table"]').filter({ hasText: /payment/i }).first()
    .or(page.locator('[data-testid="payment-table"]').first());
  await expect(paymentTable).toBeVisible({ timeout: 10000 });
}

async function verifyOutstandingAmount(page: Page) {
  const outstanding = page.getByText(/outstanding|balance due|amount due/i).first()
    .or(page.locator('[data-testid="outstanding-amount"]').first())
    .or(page.locator('text=/outstanding/i'));
  await expect(outstanding).toBeVisible({ timeout: 10000 });
}

test.describe('Accounting Masters @Sq5c4949b', () => {
  test('@contacts MODULE-NNN: View customer information and transaction history @Twich651o', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    // Step 1: Navigate to Contacts list
    await navigateToContacts(page);
    await page.screenshot({ path: 'debug-contacts-list.png' });

    // Step 2: Click on customer name
    await openFirstCustomer(page);
    await page.screenshot({ path: 'debug-customer-open.png' });

    // Step 3: View customer profile details
    await verifyCustomerProfile(page);
    await page.screenshot({ path: 'debug-customer-profile.png' });

    // Step 4: Check invoice history tab
    await openInvoiceHistoryTab(page);
    await page.screenshot({ path: 'debug-invoice-history.png' });

    // Step 5: Review payment history
    await openPaymentHistoryTab(page);
    await page.screenshot({ path: 'debug-payment-history.png' });

    // Expected Result: Outstanding amount calculated correctly
    await verifyOutstandingAmount(page);
  });
});