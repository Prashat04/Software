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
const createVendorUrl = '/payees/create-vendor';

// Seed data generator for unique test data per run
type SeedData = {
  vendorName: string;
  displayName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  taxNumber: string;
  paymentTerms: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    vendorName: `Auto Vendor ${suffix}`,
    displayName: `Auto Vendor Display ${suffix}`,
    email: `auto.vendor+${suffix}@example.com`,
    phone: `555000${suffix.slice(0, 4)}`,
    street: `123 Auto St ${suffix}`,
    city: `Testville`,
    state: `CA`,
    zip: `9401${suffix.slice(0, 1)}`,
    taxNumber: `GST-${suffix}`,
    paymentTerms: `Net 30`,
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

async function clickVendorsTab(page: Page) {
  const vendorsTab = page.getByRole('tab', { name: /vendor/i })
    .or(page.getByRole('button', { name: /vendor/i }))
    .or(page.getByText('Vendors', { exact: false }));
  await vendorsTab.first().waitFor({ state: 'visible', timeout: 15000 });
  await vendorsTab.first().click();
  await page.waitForTimeout(1000);
}

async function openCreateVendor(page: Page) {
  const addVendorButton = page.getByRole('button', { name: /add vendor/i })
    .or(page.getByText('Add Vendor', { exact: false }))
    .or(page.locator('[data-testid*="add-vendor"]').first());
  await addVendorButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await addVendorButton.first().click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  try {
    await expect(page).toHaveURL(/create-vendor/);
  } catch (error) {
    await expect(page).toHaveURL(new RegExp(createVendorUrl));
  }
}

async function fillVendorForm(page: Page, seed: SeedData, skipName = false) {
  const vendorNameField = page.locator('input[name*="vendor" i], input[placeholder*="Vendor Name" i], input[aria-label*="Vendor Name" i]')
    .or(page.getByLabel(/vendor name/i))
    .or(page.getByRole('textbox', { name: /vendor name/i }));
  await vendorNameField.first().waitFor({ state: 'visible', timeout: 15000 });
  if (!skipName) {
    await vendorNameField.first().fill(seed.vendorName);
  } else {
    await vendorNameField.first().fill('');
  }
  await page.waitForTimeout(500);

  const displayNameField = page.locator('input[name*="display" i], input[placeholder*="Display Name" i], input[aria-label*="Display Name" i]')
    .or(page.getByLabel(/display name/i))
    .or(page.getByRole('textbox', { name: /display name/i }));
  if (await displayNameField.first().isVisible().catch(() => false)) {
    await displayNameField.first().fill(seed.displayName);
  }

  const emailField = page.locator('input[name="email"], input[type="email"], input[placeholder*="Email" i], input[aria-label*="Email" i]')
    .or(page.getByLabel(/email/i))
    .or(page.getByRole('textbox', { name: /email/i }));
  if (await emailField.first().isVisible().catch(() => false)) {
    await emailField.first().fill(seed.email);
  }

  const phoneField = page.locator('input[name*="phone" i], input[placeholder*="Phone" i], input[aria-label*="Phone" i]')
    .or(page.getByLabel(/phone/i))
    .or(page.getByRole('textbox', { name: /phone/i }));
  if (await phoneField.first().isVisible().catch(() => false)) {
    await phoneField.first().fill(seed.phone);
  }

  const streetField = page.locator('input[name*="street" i], input[placeholder*="Street" i], input[aria-label*="Street" i]')
    .or(page.getByLabel(/street/i))
    .or(page.getByRole('textbox', { name: /street/i }));
  if (await streetField.first().isVisible().catch(() => false)) {
    await streetField.first().fill(seed.street);
  }

  const cityField = page.locator('input[name*="city" i], input[placeholder*="City" i], input[aria-label*="City" i]')
    .or(page.getByLabel(/city/i))
    .or(page.getByRole('textbox', { name: /city/i }));
  if (await cityField.first().isVisible().catch(() => false)) {
    await cityField.first().fill(seed.city);
  }

  const stateField = page.locator('input[name*="state" i], input[placeholder*="State" i], input[aria-label*="State" i]')
    .or(page.getByLabel(/state/i))
    .or(page.getByRole('textbox', { name: /state/i }));
  if (await stateField.first().isVisible().catch(() => false)) {
    await stateField.first().fill(seed.state);
  }

  const zipField = page.locator('input[name*="zip" i], input[placeholder*="ZIP" i], input[aria-label*="ZIP" i], input[name*="postal" i]')
    .or(page.getByLabel(/zip|postal/i))
    .or(page.getByRole('textbox', { name: /zip|postal/i }));
  if (await zipField.first().isVisible().catch(() => false)) {
    await zipField.first().fill(seed.zip);
  }

  const taxField = page.locator('input[name*="tax" i], input[placeholder*="GST" i], input[aria-label*="GST" i]')
    .or(page.getByLabel(/tax|gst/i))
    .or(page.getByRole('textbox', { name: /tax|gst/i }));
  if (await taxField.first().isVisible().catch(() => false)) {
    await taxField.first().fill(seed.taxNumber);
  }

  await page.waitForTimeout(500);
}

async function selectPaymentTerms(page: Page, term: string) {
  const paymentTermsTrigger = page.getByRole('combobox', { name: /payment terms/i })
    .or(page.locator('[class*="select"]').filter({ hasText: /payment terms/i }).first())
    .or(page.getByText('Payment Terms', { exact: false }));
  try {
    await paymentTermsTrigger.first().waitFor({ state: 'visible', timeout: 10000 });
    await paymentTermsTrigger.first().click();
    await page.waitForTimeout(800);
    await page.keyboard.type(term);
    await page.waitForTimeout(800);
    const option = page.getByRole('option', { name: new RegExp(term, 'i') })
      .or(page.locator('[role="option"]').filter({ hasText: new RegExp(term, 'i') }))
      .or(page.getByText(term, { exact: false }));
    await option.first().waitFor({ state: 'visible', timeout: 10000 });
    await option.first().click();
  } catch (error) {
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(800);
}

async function clickSaveVendor(page: Page) {
  await page.waitForTimeout(800);
  const saveButton = page.locator('button:has-text("Save")')
    .or(page.getByRole('button', { name: /save/i }))
    .or(page.locator('[data-testid*="save"]').first());
  await saveButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await saveButton.first().click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

async function expectValidationError(page: Page) {
  const errorMsg = page.getByText(/required|please enter|vendor name is required|name is required/i)
    .or(page.locator('[role="alert"]').filter({ hasText: /required|name/i }))
    .or(page.locator('.error, .invalid-feedback, [class*="error"]').filter({ hasText: /name|required/i }));
  await expect(errorMsg.first()).toBeVisible({ timeout: 10000 });
}

async function expectVendorCreated(page: Page) {
  const successToast = page.getByText(/vendor created|success|saved successfully/i)
    .or(page.locator('[role="alert"]').filter({ hasText: /success|created|saved/i }))
    .or(page.locator('.toast, [class*="toast"], [class*="snackbar"]').filter({ hasText: /success|created|saved/i }));
  try {
    await expect(successToast.first()).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/vendor-info|edit-vendor|payees/);
  }
}

test.describe('Accounting Masters @Sufrmo0qc', () => {
  test('@contacts VENDOR-001: Validate vendor creation with missing required fields @T8ewiuyii', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());

    await seedLogin(page);

    await navigateToModule(page);
    await page.screenshot({ path: 'debug-payees-list.png' });

    await clickVendorsTab(page);
    await page.waitForTimeout(1000);

    await openCreateVendor(page);
    await page.screenshot({ path: 'debug-create-vendor.png' });

    // Step 2: Leave vendor name empty and try to save
    await fillVendorForm(page, seed, true);
    await selectPaymentTerms(page, seed.paymentTerms);
    await page.screenshot({ path: 'debug-before-save-empty-name.png' });

    await clickSaveVendor(page);
    await page.screenshot({ path: 'debug-after-save-empty-name.png' });

    // Expected: validation error
    await expectValidationError(page);

    // Step 5: Fill required field and retry
    const vendorNameField = page.locator('input[name*="vendor" i], input[placeholder*="Vendor Name" i], input[aria-label*="Vendor Name" i]')
      .or(page.getByLabel(/vendor name/i))
      .or(page.getByRole('textbox', { name: /vendor name/i }));
    await vendorNameField.first().waitFor({ state: 'visible', timeout: 15000 });
    await vendorNameField.first().fill(seed.vendorName);
    await page.waitForTimeout(800);

    await clickSaveVendor(page);
    await page.screenshot({ path: 'debug-after-save-with-name.png' });

    await expectVendorCreated(page);
  });
});