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
  bankAccount: string;
  paymentTerms: string;
  gstNumber: string;
  searchTerm: string;
  noMatchTerm: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    vendorName: `Auto Vendor ${suffix}`,
    displayName: `Auto Display ${suffix}`,
    email: `auto.vendor+${suffix}@example.com`,
    phone: `555000${suffix.slice(0, 4)}`,
    street: `123 Auto St ${suffix}`,
    city: 'Auto City',
    state: 'CA',
    zip: '94105',
    bankAccount: `12345${suffix.slice(0, 3)}`,
    paymentTerms: 'Net 30',
    gstNumber: `GST-${suffix}`,
    searchTerm: `Auto Vendor ${suffix}`,
    noMatchTerm: `NoMatch-${suffix}`
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function waitForLoadingToFinish(page: Page) {
  const loader = page.locator('[data-testid="loading"], .loading, .spinner, [role="progressbar"]').first();
  try {
    await loader.waitFor({ state: 'hidden', timeout: 8000 });
  } catch (e) {
    // ignore if no loader
  }
}

async function navigateToModule(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /contacts|payees|vendors/i }).first();
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/payees/);
  }
  await waitForLoadingToFinish(page);
}

async function openVendorsTab(page: Page) {
  const vendorsTab = page.getByRole('tab', { name: /vendors/i }).first()
    .or(page.getByRole('button', { name: /vendors/i }).first())
    .or(page.getByText(/vendors/i).first());
  try {
    await vendorsTab.waitFor({ state: 'visible', timeout: 15000 });
    await vendorsTab.click();
  } catch (e) {
    // If tab not present, proceed
  }
  await page.waitForTimeout(1000);
}

async function clickAddVendor(page: Page) {
  const addVendorBtn = page.getByRole('button', { name: /add vendor|create vendor|new vendor|add payee/i }).first()
    .or(page.getByText(/add vendor|new vendor/i, { exact: false }).first())
    .or(page.locator('[data-testid="add-vendor"]').first());
  await addVendorBtn.waitFor({ state: 'visible', timeout: 15000 });
  await addVendorBtn.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await expect(page).toHaveURL(/create-vendor/);
}

async function selectDropdownOption(page: Page, optionName: string) {
  const trigger = page.getByText('Choose an option').first()
    .or(page.locator('[class*="select"]').filter({ hasText: /choose/i }).first());
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

async function fillVendorForm(page: Page, seed: SeedData) {
  const vendorName = page.locator('input[name="vendorName"], input[placeholder*="Vendor Name" i]').first()
    .or(page.locator('input[aria-label*="Vendor Name" i]').first());
  await vendorName.waitFor({ state: 'visible', timeout: 15000 });
  await vendorName.fill(seed.vendorName);

  const displayName = page.locator('input[name="displayName"], input[placeholder*="Display Name" i]').first()
    .or(page.locator('input[aria-label*="Display Name" i]').first());
  await displayName.fill(seed.displayName);

  const email = page.locator('input[name="email"], input[type="email"]').first()
    .or(page.locator('input[placeholder*="Email" i]').first());
  await email.fill(seed.email);

  const phone = page.locator('input[name="phone"], input[type="tel"]').first()
    .or(page.locator('input[placeholder*="Phone" i]').first());
  await phone.fill(seed.phone);

  const street = page.locator('input[name="street"], input[placeholder*="Street" i]').first()
    .or(page.locator('input[aria-label*="Street" i]').first());
  await street.fill(seed.street);

  const city = page.locator('input[name="city"], input[placeholder*="City" i]').first()
    .or(page.locator('input[aria-label*="City" i]').first());
  await city.fill(seed.city);

  const state = page.locator('input[name="state"], input[placeholder*="State" i]').first()
    .or(page.locator('input[aria-label*="State" i]').first());
  await state.fill(seed.state);

  const zip = page.locator('input[name="zip"], input[placeholder*="ZIP" i], input[placeholder*="Postal" i]').first()
    .or(page.locator('input[aria-label*="ZIP" i]').first());
  await zip.fill(seed.zip);

  const bankAccount = page.locator('input[name="bankAccount"], input[placeholder*="Bank" i]').first()
    .or(page.locator('input[aria-label*="Bank" i]').first());
  try {
    await bankAccount.waitFor({ state: 'visible', timeout: 5000 });
    await bankAccount.fill(seed.bankAccount);
  } catch (e) {
    // optional
  }

  const gst = page.locator('input[name="gst"], input[placeholder*="GST" i], input[placeholder*="Tax" i]').first()
    .or(page.locator('input[aria-label*="GST" i]').first());
  try {
    await gst.waitFor({ state: 'visible', timeout: 5000 });
    await gst.fill(seed.gstNumber);
  } catch (e) {
    // optional
  }

  try {
    await selectDropdownOption(page, seed.paymentTerms);
  } catch (e) {
    // optional dropdown not found
  }

  await page.waitForTimeout(1000);
}

async function saveRecord(page: Page) {
  await page.waitForTimeout(1000);
  const saveButton = page.locator('text="Save & close"').first()
    .or(page.getByRole('button', { name: /save/i }).first());
  await saveButton.waitFor({ state: 'visible', timeout: 15000 });
  await saveButton.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
}

async function verifyVendorSaved(page: Page) {
  const successToast = page.getByText(/saved|success|created/i).first()
    .or(page.locator('[role="alert"]').filter({ hasText: /success|saved|created/i }).first());
  try {
    await expect(successToast).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/vendor-info|edit-vendor/);
  }
}

async function searchContacts(page: Page, term: string) {
  const searchBox = page.locator('input[type="search"], input[placeholder*="Search" i]').first()
    .or(page.locator('input[aria-label*="Search" i]').first())
    .or(page.locator('input[name*="search" i]').first());
  await searchBox.waitFor({ state: 'visible', timeout: 15000 });
  await searchBox.fill(term);
  await page.waitForTimeout(800);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await waitForLoadingToFinish(page);
}

async function clearSearch(page: Page) {
  const searchBox = page.locator('input[type="search"], input[placeholder*="Search" i]').first()
    .or(page.locator('input[aria-label*="Search" i]').first())
    .or(page.locator('input[name*="search" i]').first());
  await searchBox.waitFor({ state: 'visible', timeout: 15000 });
  await searchBox.fill('');
  await page.waitForTimeout(800);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await waitForLoadingToFinish(page);
}

async function getResultsRows(page: Page) {
  return page.locator('table tbody tr').first()
    .or(page.locator('[role="row"]').filter({ hasNotText: /header/i }).first())
    .or(page.locator('[data-testid="contact-row"]').first());
}

async function verifyResultsContain(page: Page, term: string) {
  const resultText = page.getByText(new RegExp(term, 'i')).first()
    .or(page.locator('table').filter({ hasText: new RegExp(term, 'i') }).first())
    .or(page.locator('[data-testid="contact-row"]').filter({ hasText: new RegExp(term, 'i') }).first());
  await expect(resultText).toBeVisible({ timeout: 10000 });
}

async function verifyNoResults(page: Page) {
  const noResults = page.getByText(/no results|no matches|not found/i).first()
    .or(page.locator('[data-testid="no-results"]').first())
    .or(page.locator('.empty-state, .no-results').first());
  await expect(noResults).toBeVisible({ timeout: 10000 });
}

test.describe('Accounting Masters @Sujt34x8i', () => {
  test('@contacts Contacts-001: Search contacts by name @Trcmekrgd', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());

    await seedLogin(page);
    await page.screenshot({ path: 'debug-after-login.png' });

    // Ensure contact exists by creating a vendor
    await navigateToModule(page);
    await openVendorsTab(page);

    const addVendorBtn = page.getByRole('button', { name: /add vendor|create vendor|new vendor|add payee/i }).first()
      .or(page.getByText(/add vendor|new vendor/i, { exact: false }).first())
      .or(page.locator('[data-testid="add-vendor"]').first());

    try {
      await addVendorBtn.waitFor({ state: 'visible', timeout: 8000 });
      await clickAddVendor(page);
      await page.screenshot({ path: 'debug-create-vendor-form.png' });
      await fillVendorForm(page, seed);
      await saveRecord(page);
      await verifyVendorSaved(page);
      await page.screenshot({ path: 'debug-vendor-saved.png' });
    } catch (e) {
      // If add vendor not available, continue to search
    }

    // Step 1: Navigate to Contacts list
    await navigateToModule(page);
    await openVendorsTab(page);
    await page.screenshot({ path: 'debug-contacts-list.png' });

    // Step 2: Enter search term in search box
    await searchContacts(page, seed.searchTerm);
    const searchBox = page.locator('input[type="search"], input[placeholder*="Search" i]').first()
      .or(page.locator('input[aria-label*="Search" i]').first())
      .or(page.locator('input[name*="search" i]').first());
    await expect(searchBox).toHaveValue(seed.searchTerm);

    // Step 3: Press Enter or click search (handled in