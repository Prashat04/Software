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
  displayName: string;
  email: string;
  emailAlt: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  gstNumber: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    vendorName: `Auto Vendor ${suffix}`,
    displayName: `Auto Display ${suffix}`,
    email: `auto.vendor+${suffix}@example.com`,
    emailAlt: `auto.vendor.alt+${suffix}@example.com`,
    phone: `55501${suffix.slice(0, 3)}`,
    street: `123 Automation St ${suffix}`,
    city: `Testville`,
    state: `CA`,
    zip: `9000${suffix.slice(0, 1)}`,
    gstNumber: `GST-${suffix}`
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToModule(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /payees|contacts|vendors/i }).first();
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/payees/);
  }
}

async function openVendorsTab(page: Page) {
  const vendorsTab = page.getByRole('tab', { name: /vendors/i })
    .or(page.getByText('Vendors', { exact: false }))
    .or(page.locator('[data-testid*="vendors"]').first());
  await vendorsTab.waitFor({ state: 'visible', timeout: 15000 });
  await vendorsTab.click();
  await page.waitForTimeout(1000);
}

async function clickAddVendor(page: Page) {
  const addVendorButton = page.getByRole('button', { name: /add vendor|create vendor|new vendor/i })
    .or(page.getByText('Add Vendor', { exact: false }))
    .or(page.locator('[data-testid*="add-vendor"]').first());
  await addVendorButton.waitFor({ state: 'visible', timeout: 15000 });
  await addVendorButton.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

async function fillVendorForm(page: Page, seed: SeedData, emailOverride?: string) {
  const vendorNameField = page.locator('input[name="vendorName"], input[placeholder*="Vendor Name" i], input[aria-label*="Vendor Name" i]')
    .or(page.getByLabel(/vendor name/i));
  await vendorNameField.first().waitFor({ state: 'visible', timeout: 15000 });
  await vendorNameField.first().fill(seed.vendorName);

  const displayNameField = page.locator('input[name="displayName"], input[placeholder*="Display Name" i], input[aria-label*="Display Name" i]')
    .or(page.getByLabel(/display name/i));
  await displayNameField.first().waitFor({ state: 'visible', timeout: 15000 });
  await displayNameField.first().fill(seed.displayName);

  const emailField = page.locator('input[name="email"], input[type="email"], input[placeholder*="Email" i], input[aria-label*="Email" i]')
    .or(page.getByLabel(/email/i));
  await emailField.first().waitFor({ state: 'visible', timeout: 15000 });
  await emailField.first().fill(emailOverride || seed.email);

  const phoneField = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="Phone" i], input[aria-label*="Phone" i]')
    .or(page.getByLabel(/phone/i));
  await phoneField.first().waitFor({ state: 'visible', timeout: 15000 });
  await phoneField.first().fill(seed.phone);

  const streetField = page.locator('input[name*="street"], input[placeholder*="Street" i], input[aria-label*="Street" i]')
    .or(page.getByLabel(/street/i));
  await streetField.first().waitFor({ state: 'visible', timeout: 15000 });
  await streetField.first().fill(seed.street);

  const cityField = page.locator('input[name*="city"], input[placeholder*="City" i], input[aria-label*="City" i]')
    .or(page.getByLabel(/city/i));
  await cityField.first().waitFor({ state: 'visible', timeout: 15000 });
  await cityField.first().fill(seed.city);

  const stateField = page.locator('input[name*="state"], input[placeholder*="State" i], input[aria-label*="State" i]')
    .or(page.getByLabel(/state/i));
  await stateField.first().waitFor({ state: 'visible', timeout: 15000 });
  await stateField.first().fill(seed.state);

  const zipField = page.locator('input[name*="zip"], input[placeholder*="ZIP" i], input[aria-label*="ZIP" i]')
    .or(page.getByLabel(/zip/i));
  await zipField.first().waitFor({ state: 'visible', timeout: 15000 });
  await zipField.first().fill(seed.zip);

  const gstField = page.locator('input[name*="gst"], input[name*="tax"], input[placeholder*="GST" i], input[aria-label*="GST" i]')
    .or(page.getByLabel(/gst|tax/i));
  await gstField.first().waitFor({ state: 'visible', timeout: 15000 });
  await gstField.first().fill(seed.gstNumber);

  await page.waitForTimeout(800);
}

async function selectDropdownOption(page: Page, optionName: string) {
  const trigger = page.getByText('Choose an option').first()
    .or(page.locator('[class*="select"]').filter({ hasText: /choose/i }).first())
    .or(page.getByRole('combobox').first());
  await trigger.waitFor({ state: 'visible', timeout: 15000 });
  await trigger.click();
  await page.waitForTimeout(1000);
  await page.keyboard.type(optionName);
  await page.waitForTimeout(1500);
  const option = page.getByRole('option', { name: new RegExp(optionName, 'i') })
    .or(page.locator('[role="option"]').filter({ hasText: new RegExp(optionName, 'i') }))
    .or(page.getByText(optionName, { exact: false }));
  try {
    await option.first().waitFor({ state: 'visible', timeout: 10000 });
    await option.first().click();
  } catch (error) {
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(800);
}

async function saveRecord(page: Page) {
  await page.waitForTimeout(1000);
  const saveButton = page.locator('text="Save & close"').first()
    .or(page.getByRole('button', { name: /save/i }).first())
    .or(page.getByText('Save', { exact: false }));
  await saveButton.waitFor({ state: 'visible', timeout: 15000 });
  await saveButton.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
}

async function expectDuplicateEmailError(page: Page) {
  const errorMessage = page.getByText(/email.*already|duplicate email|email.*exists/i).first()
    .or(page.locator('[role="alert"]').filter({ hasText: /email.*already|duplicate|exists/i }).first())
    .or(page.locator('.toast, .notification').filter({ hasText: /email.*already|duplicate|exists/i }).first());
  await expect(errorMessage).toBeVisible({ timeout: 10000 });
}

async function expectVendorCreated(page: Page) {
  const successToast = page.locator('.toast, .notification').filter({ hasText: /vendor.*created|success|saved/i }).first()
    .or(page.getByText(/vendor.*created|success|saved/i).first());
  try {
    await expect(successToast).toBeVisible({ timeout: 10000 });
  } catch (e) {
    await expect(page).toHaveURL(/vendor-info|payees/);
  }
}

test.describe('Accounting Masters @Slpp859vh', () => {
  test('@contacts CONTACTS-001: Validate duplicate vendor email prevention @Tj9j5bwr8', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());

    await seedLogin(page);
    await navigateToModule(page);
    await openVendorsTab(page);
    await page.screenshot({ path: 'debug-vendors-tab.png' });

    // Create initial vendor with unique email (precondition)
    await clickAddVendor(page);
    await page.waitForURL(/create-vendor/, { timeout: 60000 });
    await fillVendorForm(page, seed, seed.email);
    await selectDropdownOption(page, 'Net 30');
    await page.screenshot({ path: 'debug-initial-vendor-form.png' });
    await saveRecord(page);
    await expectVendorCreated(page);
    await page.screenshot({ path: 'debug-initial-vendor-created.png' });

    // Attempt to create vendor with duplicate email
    await navigateToModule(page);
    await openVendorsTab(page);
    await clickAddVendor(page);
    await page.waitForURL(/create-vendor/, { timeout: 60000 });
    await fillVendorForm(page, seed, seed.email);
    await selectDropdownOption(page, 'Net 30');
    await page.screenshot({ path: 'debug-duplicate-email-form.png' });
    await saveRecord(page);

    // Verify error handling for duplicate email
    await expectDuplicateEmailError(page);
    await page.screenshot({ path: 'debug-duplicate-email-error.png' });

    // Verify user can correct and retry with unique email
    const emailField = page.locator('input[name="email"], input[type="email"], input[placeholder*="Email" i], input[aria-label*="Email" i]')
      .or(page.getByLabel(/email/i));
    await emailField.first().waitFor({ state: 'visible', timeout: 15000 });
    await emailField.first().fill(seed.emailAlt);
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'debug-email-corrected.png' });
    await saveRecord(page);
    await expectVendorCreated(page);
    await page.screenshot({ path: 'debug-vendor-created-after-correction.png' });
  });
});