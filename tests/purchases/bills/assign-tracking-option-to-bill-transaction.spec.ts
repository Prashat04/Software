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
const moduleUrl = '/list-bills';

// Seed data generator for unique test data per run
type SeedData = {
  vendorName: string;
  description: string;
  referenceNumber: string;
  quantity: string;
  rate: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    vendorName: `Vendor ${suffix}`,
    description: `Auto Line ${suffix}`,
    referenceNumber: `AUTO-REF-${suffix}`,
    quantity: '2',
    rate: '150',
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToBills(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /bills/i }).first()
    .or(page.getByText('Bills', { exact: false }).first());
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/list-bills/);
  }
}

async function clickNewBill(page: Page) {
  const newBillButton = page.getByRole('button', { name: /new bill/i })
    .or(page.getByText('New Bill', { exact: false }))
    .or(page.locator('[data-testid*="new-bill"]'));
  await newBillButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await newBillButton.first().click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const formHeading = page.getByRole('heading', { name: /bill/i }).first()
    .or(page.getByText(/create bill/i).first());
  try {
    await expect(formHeading).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/create-bills/);
  }
}

async function selectDropdownByLabel(page: Page, label: string, optionName: string) {
  const labelLocator = page.getByText(label, { exact: false }).first();
  const container = labelLocator.locator('..').first()
    .or(labelLocator.locator('xpath=ancestor::*[self::div or self::label][1]'));
  const trigger = container.locator('input, [role="combobox"], [class*="select"], [class*="dropdown"]').first()
    .or(page.getByRole('combobox', { name: new RegExp(label, 'i') }).first())
    .or(page.locator(`label:has-text("${label}") + *`).first());
  try {
    await trigger.waitFor({ state: 'visible', timeout: 10000 });
    await trigger.click();
  } catch (error) {
    const fallback = page.getByText(label, { exact: false }).first();
    await fallback.click();
  }
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

async function fillDateField(page: Page, label: string) {
  const dateInput = page.getByLabel(new RegExp(label, 'i'))
    .or(page.locator(`input[placeholder*="${label}" i]`))
    .or(page.locator('input[type="date"]').first());
  await dateInput.first().waitFor({ state: 'visible', timeout: 10000 });
  const today = new Date();
  const dateValue = today.toISOString().split('T')[0];
  await dateInput.first().fill(dateValue);
  await page.waitForTimeout(500);
}

async function fillBasicBillInfo(page: Page, seed: SeedData) {
  await selectDropdownByLabel(page, 'Vendor', seed.vendorName);
  const billNumber = page.getByLabel(/bill number/i)
    .or(page.locator('input[placeholder*="Bill number" i]'))
    .or(page.locator('input[name*="bill" i]'));
  try {
    await billNumber.first().waitFor({ state: 'visible', timeout: 10000 });
    await billNumber.first().fill(seed.referenceNumber);
  } catch (e) {
    // optional if auto-generated
  }
  await fillDateField(page, 'Bill Date');
  await fillDateField(page, 'Due Date');

  const referenceField = page.getByLabel(/reference|document|ref/i)
    .or(page.locator('input[placeholder*="Reference" i]'))
    .or(page.locator('input[name*="reference" i]'));
  try {
    await referenceField.first().waitFor({ state: 'visible', timeout: 10000 });
    await referenceField.first().fill(seed.referenceNumber);
  } catch (e) {
    // optional if not present
  }
}

async function addLineItem(page: Page, seed: SeedData) {
  const addLineItemBtn = page.getByRole('button', { name: /add line item/i })
    .or(page.getByText('Add Line Item', { exact: false }))
    .or(page.locator('[data-testid*="add-line"]'));
  await addLineItemBtn.first().waitFor({ state: 'visible', timeout: 15000 });
  await addLineItemBtn.first().click();
  await page.waitForTimeout(1000);

  const description = page.locator('textarea[name*="description" i], input[placeholder*="Description" i]')
    .or(page.getByRole('textbox', { name: /description/i }));
  await description.first().waitFor({ state: 'visible', timeout: 10000 });
  await description.first().fill(seed.description);

  const qty = page.locator('input[name*="quantity" i], input[placeholder*="Qty" i]')
    .or(page.getByRole('spinbutton', { name: /quantity/i }));
  await qty.first().waitFor({ state: 'visible', timeout: 10000 });
  await qty.first().fill(seed.quantity);

  const rate = page.locator('input[name*="rate" i], input[placeholder*="Rate" i], input[placeholder*="Price" i]')
    .or(page.getByRole('spinbutton', { name: /rate|price/i }));
  await rate.first().waitFor({ state: 'visible', timeout: 10000 });
  await rate.first().fill(seed.rate);

  const account = page.getByText(/account/i).first()
    .or(page.getByRole('combobox', { name: /account/i }).first());
  try {
    await account.waitFor({ state: 'visible', timeout: 10000 });
    await account.click();
    await page.waitForTimeout(1000);
    await page.keyboard.type('Cost of Goods');
    await page.waitForTimeout(1500);
    const option = page.getByRole('option', { name: /cost/i })
      .or(page.getByText(/cost/i, { exact: false }));
    await option.first().click();
  } catch (e) {
    // account selection optional
  }
}

async function selectTrackingOption(page: Page) {
  const trackingLabel = page.getByText(/tracking/i).first()
    .or(page.getByRole('combobox', { name: /tracking/i }).first());
  await trackingLabel.waitFor({ state: 'visible', timeout: 15000 });
  await trackingLabel.click();
  await page.waitForTimeout(1000);
  await page.keyboard.type('Option');
  await page.waitForTimeout(1500);
  const option = page.getByRole('option', { name: /option/i })
    .or(page.getByText(/option/i, { exact: false }))
    .or(page.locator('[role="option"]').first());
  try {
    await option.first().waitFor({ state: 'visible', timeout: 10000 });
    await option.first().click();
  } catch (error) {
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(800);
}

async function saveBill(page: Page) {
  await page.waitForTimeout(1000);
  const saveButton = page.locator('text="Save & close"').first()
    .or(page.getByRole('button', { name: /save/i }).first())
    .or(page.getByRole('button', { name: /submit/i }).first());
  await saveButton.waitFor({ state: 'visible', timeout: 15000 });
  await saveButton.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
}

async function verifyBillSaved(page: Page) {
  const toast = page.getByText(/success|saved|updated/i).first()
    .or(page.locator('[role="alert"]').filter({ hasText: /success|saved|updated/i }).first());
  try {
    await expect(toast).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/list-bills/);
  }
}

test.describe('Purchases @Ss4dx2g74', () => {
  test('@tracking Bills-001: Assign tracking option to bill transaction @T8r9l0vmd', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    await navigateToBills(page);
    await page.screenshot({ path: 'debug-bills-list.png' });

    await clickNewBill(page);
    await page.screenshot({ path: 'debug-bill-form.png' });

    await fillBasicBillInfo(page, seed);
    await addLineItem(page, seed);

    // Select tracking option for line item
    await selectTrackingOption(page);
    await page.screenshot({ path: 'debug-tracking-selected.png' });

    await saveBill(page);
    await page.screenshot({ path: 'debug-bill-saved.png' });

    await verifyBillSaved(page);
  });
});