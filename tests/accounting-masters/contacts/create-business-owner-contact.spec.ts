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
  ownerName: string;
  displayName: string;
  email: string;
  phone: string;
  ownership: string;
  idNumber: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    ownerName: `Auto Owner ${suffix}`,
    displayName: `Auto Owner Display ${suffix}`,
    email: `auto.owner+${suffix}@example.com`,
    phone: `555000${suffix.slice(0, 4)}`,
    ownership: '25',
    idNumber: `ID-${suffix}`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
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
}

async function switchToVendorsTab(page: Page) {
  const vendorsTab = page.getByRole('tab', { name: /vendors/i })
    .or(page.getByText('Vendors', { exact: false }))
    .or(page.locator('[data-testid*="vendor"]').first());
  try {
    await vendorsTab.first().waitFor({ state: 'visible', timeout: 10000 });
    await vendorsTab.first().click();
  } catch (error) {
    // Fallback: maybe tabs are buttons
    const vendorsButton = page.getByRole('button', { name: /vendors/i })
      .or(page.getByText('Vendors', { exact: false }));
    await vendorsButton.first().click();
  }
  await page.waitForTimeout(1200);
}

async function openBusinessOwnerForm(page: Page) {
  const createBoButton = page.getByRole('button', { name: /business owner/i })
    .or(page.getByText(/create business owner/i))
    .or(page.getByText(/add business owner/i));
  await createBoButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await createBoButton.first().click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
  const formHeading = page.getByRole('heading', { name: /business owner/i })
    .or(page.getByText(/business owner/i));
  await expect(formHeading.first()).toBeVisible({ timeout: 10000 });
}

async function fillBusinessOwnerForm(page: Page, seed: SeedData) {
  const ownerNameField = page.locator('input[name*="owner" i], input[placeholder*="Owner" i], input[aria-label*="Owner" i]')
    .or(page.locator('input[name*="name" i]').first());
  await ownerNameField.first().waitFor({ state: 'visible', timeout: 15000 });
  await ownerNameField.first().fill(seed.ownerName);

  const displayNameField = page.locator('input[name*="display" i], input[placeholder*="Display" i], input[aria-label*="Display" i]')
    .or(page.locator('input[name*="nickname" i]'));
  try {
    await displayNameField.first().waitFor({ state: 'visible', timeout: 8000 });
    await displayNameField.first().fill(seed.displayName);
  } catch (error) {
    // optional field
  }

  const emailField = page.locator('input[type="email"], input[name*="email" i], input[placeholder*="Email" i], input[aria-label*="Email" i]');
  await emailField.first().waitFor({ state: 'visible', timeout: 15000 });
  await emailField.first().fill(seed.email);

  const phoneField = page.locator('input[type="tel"], input[name*="phone" i], input[placeholder*="Phone" i], input[aria-label*="Phone" i]');
  try {
    await phoneField.first().waitFor({ state: 'visible', timeout: 8000 });
    await phoneField.first().fill(seed.phone);
  } catch (error) {
    // optional field
  }

  const ownershipField = page.locator('input[name*="ownership" i], input[placeholder*="%" i], input[aria-label*="ownership" i]')
    .or(page.locator('input[name*="percentage" i]'));
  try {
    await ownershipField.first().waitFor({ state: 'visible', timeout: 8000 });
    await ownershipField.first().fill(seed.ownership);
  } catch (error) {
    // optional field
  }

  const idNumberField = page.locator('input[name*="identification" i], input[name*="id" i], input[placeholder*="ID" i], input[aria-label*="ID" i]');
  try {
    await idNumberField.first().waitFor({ state: 'visible', timeout: 8000 });
    await idNumberField.first().fill(seed.idNumber);
  } catch (error) {
    // optional field
  }
}

async function validateRequiredFields(page: Page) {
  const requiredMarkers = page.getByText('*', { exact: false })
    .or(page.locator('[required]'))
    .or(page.locator('label:has-text("*")'));
  try {
    await expect(requiredMarkers.first()).toBeVisible({ timeout: 5000 });
  } catch (error) {
    // Fallback: ensure at least one required input exists
    const requiredInput = page.locator('input[required], textarea[required], select[required]');
    await expect(requiredInput.first()).toBeVisible({ timeout: 5000 });
  }
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

async function verifyOwnerCreated(page: Page, seed: SeedData) {
  const successToast = page.getByText(/success|created|saved/i)
    .or(page.locator('[role="alert"]').filter({ hasText: /success|created|saved/i }));
  try {
    await expect(successToast.first()).toBeVisible({ timeout: 10000 });
  } catch (error) {
    const ownerHeading = page.getByRole('heading', { name: new RegExp(seed.ownerName, 'i') })
      .or(page.getByText(seed.ownerName, { exact: false }));
    await expect(ownerHeading.first()).toBeVisible({ timeout: 10000 });
  }
}

async function verifyOwnerInList(page: Page, seed: SeedData) {
  await navigateToModule(page);
  await switchToVendorsTab(page);
  const searchField = page.locator('input[placeholder*="Search" i], input[aria-label*="Search" i]')
    .or(page.locator('input[type="search"]'));
  try {
    await searchField.first().waitFor({ state: 'visible', timeout: 8000 });
    await searchField.first().fill(seed.ownerName);
    await page.waitForTimeout(1200);
  } catch (error) {
    // ignore search
  }

  const row = page.getByRole('row', { name: new RegExp(seed.ownerName, 'i') })
    .or(page.locator('table tr').filter({ hasText: new RegExp(seed.ownerName, 'i') }))
    .or(page.getByText(seed.ownerName, { exact: false }));
  await expect(row.first()).toBeVisible({ timeout: 10000 });

  const typeCell = page.getByText(/business owner/i)
    .or(page.locator('td').filter({ hasText: /business owner/i }));
  await expect(typeCell.first()).toBeVisible({ timeout: 10000 });
}

test.describe('Accounting Masters @Syfmdv7fm', () => {
  test('@contacts Contacts-BO: Create business owner contact @T5n38h3v1', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());

    await seedLogin(page);
    await navigateToModule(page);
    await switchToVendorsTab(page);

    await page.screenshot({ path: 'debug-contacts-list.png' });

    await openBusinessOwnerForm(page);

    await page.screenshot({ path: 'debug-business-owner-form.png' });

    await validateRequiredFields(page);
    await fillBusinessOwnerForm(page, seed);

    await page.screenshot({ path: 'debug-form-filled.png' });

    await saveRecord(page);

    await page.screenshot({ path: 'debug-after-save.png' });

    await verifyOwnerCreated(page, seed);
    await verifyOwnerInList(page, seed);
  });
});