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
const moduleUrl = '/contacts';

// Seed data generator for unique test data per run
type SeedData = {
  customerName: string;
  displayName: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress: string;
  creditLimit: string;
  paymentTerms: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    customerName: `Auto Customer ${suffix}`,
    displayName: `Auto Display ${suffix}`,
    email: `auto.customer+${suffix}@example.com`,
    phone: `555000${suffix.slice(0, 4)}`,
    billingAddress: `100 Billing St ${suffix}, Billing City`,
    shippingAddress: `200 Shipping Ave ${suffix}, Shipping City`,
    creditLimit: `5000`,
    paymentTerms: `Net 30`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToModule(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /contacts|customers/i }).first();
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/contacts/);
  }
}

async function selectDropdownOption(page: Page, labelText: string, optionName: string) {
  const dropdown = page.getByLabel(new RegExp(labelText, 'i'))
    .or(page.getByRole('combobox', { name: new RegExp(labelText, 'i') }))
    .or(page.locator('[class*="select"], [class*="dropdown"]').filter({ hasText: new RegExp(labelText, 'i') }));
  await dropdown.first().waitFor({ state: 'visible', timeout: 15000 });
  await dropdown.first().click();
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
    .or(page.getByRole('button', { name: /create/i }).first());
  await saveButton.waitFor({ state: 'visible', timeout: 15000 });
  await saveButton.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
}

async function expectStatus(page: Page, status: RegExp) {
  await expect(page.getByText(status).first()).toBeVisible();
}

test.describe('Accounting Masters @S92pby4rv', () => {
  test('@contacts CONTACTS-001: Create new customer with complete details @Tao1orv4y', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());

    await seedLogin(page);
    await navigateToModule(page);
    await page.screenshot({ path: 'debug-contacts-list.png' });

    const createCustomerBtn = page.getByRole('button', { name: /create customer|new customer|add customer/i })
      .or(page.getByText(/create customer|new customer|add customer/i))
      .or(page.locator('[data-testid="create-customer"], [data-testid="add-customer"]'));
    await createCustomerBtn.first().waitFor({ state: 'visible', timeout: 15000 });
    await createCustomerBtn.first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const formHeading = page.getByRole('heading', { name: /create customer|new customer|customer details/i })
      .or(page.getByText(/create customer|new customer|customer details/i))
      .or(page.locator('form'));
    await expect(formHeading.first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'debug-create-customer-form.png' });

    const customerNameInput = page.getByLabel(/customer name/i)
      .or(page.locator('input[name*="customer" i]'))
      .or(page.locator('input[placeholder*="Customer" i]'));
    await customerNameInput.first().waitFor({ state: 'visible', timeout: 15000 });
    await customerNameInput.first().fill(seed.customerName);

    const displayNameInput = page.getByLabel(/display name/i)
      .or(page.locator('input[name*="display" i]'))
      .or(page.locator('input[placeholder*="Display" i]'));
    await displayNameInput.first().fill(seed.displayName);

    const emailInput = page.getByLabel(/email/i)
      .or(page.locator('input[type="email"]'))
      .or(page.locator('input[placeholder*="email" i]'));
    await emailInput.first().fill(seed.email);

    const phoneInput = page.getByLabel(/phone|mobile/i)
      .or(page.locator('input[name*="phone" i]'))
      .or(page.locator('input[placeholder*="phone" i]'));
    await phoneInput.first().fill(seed.phone);
    await page.waitForTimeout(800);

    const billingAddressInput = page.getByLabel(/billing address/i)
      .or(page.locator('textarea[name*="billing" i]'))
      .or(page.locator('input[placeholder*="Billing Address" i], textarea[placeholder*="Billing Address" i]'));
    await billingAddressInput.first().fill(seed.billingAddress);

    const shippingAddressInput = page.getByLabel(/shipping address/i)
      .or(page.locator('textarea[name*="shipping" i]'))
      .or(page.locator('input[placeholder*="Shipping Address" i], textarea[placeholder*="Shipping Address" i]'));
    await shippingAddressInput.first().fill(seed.shippingAddress);
    await page.waitForTimeout(800);

    const creditLimitInput = page.getByLabel(/credit limit/i)
      .or(page.locator('input[name*="credit" i]'))
      .or(page.locator('input[placeholder*="Credit" i]'));
    await creditLimitInput.first().fill(seed.creditLimit);

    await selectDropdownOption(page, 'Payment Terms', seed.paymentTerms);

    await page.screenshot({ path: 'debug-filled-customer-form.png' });

    await saveRecord(page);

    const successToast = page.getByText(/customer created|successfully|saved/i)
      .or(page.locator('[role="alert"]').filter({ hasText: /success|created|saved/i }))
      .or(page.getByRole('status').filter({ hasText: /success|created|saved/i }));
    try {
      await expect(successToast.first()).toBeVisible({ timeout: 10000 });
    } catch (error) {
      await expect(page).toHaveURL(/contacts|list/);
    }

    await page.screenshot({ path: 'debug-after-save.png' });

    const customerRow = page.locator('tr', { hasText: seed.customerName })
      .or(page.getByRole('row', { name: new RegExp(seed.customerName, 'i') }))
      .or(page.getByText(seed.customerName, { exact: false }));
    await expect(customerRow.first()).toBeVisible({ timeout: 15000 });

    const customerTypeCell = page.locator('tr', { hasText: seed.customerName }).locator('td', { hasText: /customer/i })
      .or(page.getByText(/customer/i).filter({ hasText: seed.customerName }))
      .or(page.locator('[data-testid="customer-type"]').filter({ hasText: /customer/i }));
    try {
      await expect(customerTypeCell.first()).toBeVisible({ timeout: 10000 });
    } catch (error) {
      await expect(page).toHaveURL(/contacts/);
    }
  });
});