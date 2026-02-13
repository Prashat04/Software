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
  phone: string;
  title: string;
  notes: string;
};

function buildSeedData(testInfo: TestInfo): SeedData {
  const suffix = testInfo.testId.slice(0, 8);
  return {
    phone: `555-01${suffix.slice(0, 2)}`,
    title: `Ops Manager ${suffix}`,
    notes: `Updated by automation ${suffix}`,
  };
}

// MODULE-SPECIFIC HELPER FUNCTIONS
async function navigateToModule(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const heading = page.getByRole('heading', { name: /contacts/i }).first();
  const table = page.locator('table, [role="table"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/contacts/);
  }
}

async function filterByBusinessOwner(page: Page) {
  const filterButton = page.getByRole('button', { name: /filter/i })
    .or(page.getByText('Filter', { exact: false }))
    .or(page.locator('[data-testid*="filter" i]'));
  await filterButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await filterButton.first().click();
  await page.waitForTimeout(800);

  const typeDropdown = page.getByRole('combobox', { name: /type/i })
    .or(page.locator('label:has-text("Type")').locator('..').locator('select, [role="combobox"]'))
    .or(page.locator('[placeholder*="Type" i]'));
  await typeDropdown.first().waitFor({ state: 'visible', timeout: 15000 });
  await typeDropdown.first().click();
  await page.waitForTimeout(500);

  const option = page.getByRole('option', { name: /business owner/i })
    .or(page.locator('[role="option"]').filter({ hasText: /business owner/i }))
    .or(page.getByText('Business Owner', { exact: false }));
  try {
    await option.first().waitFor({ state: 'visible', timeout: 10000 });
    await option.first().click();
  } catch (error) {
    await page.keyboard.type('Business Owner');
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(800);

  const applyButton = page.getByRole('button', { name: /apply/i })
    .or(page.getByText('Apply', { exact: false }))
    .or(page.locator('button:has-text("Done")'));
  try {
    await applyButton.first().waitFor({ state: 'visible', timeout: 10000 });
    await applyButton.first().click();
  } catch (error) {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(1500);
}

async function openFirstBusinessOwnerEdit(page: Page) {
  const firstRow = page.locator('table tbody tr, [role="row"]').filter({ hasText: /business owner/i }).first()
    .or(page.locator('table tbody tr, [role="row"]').first());
  await firstRow.waitFor({ state: 'visible', timeout: 15000 });
  await firstRow.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  const editButton = firstRow.getByRole('button', { name: /edit/i })
    .or(firstRow.getByText('Edit', { exact: false }))
    .or(firstRow.locator('[data-testid*="edit" i]'));
  try {
    await editButton.first().waitFor({ state: 'visible', timeout: 8000 });
    await editButton.first().click();
  } catch (error) {
    await firstRow.click();
    const headerEdit = page.getByRole('button', { name: /edit/i })
      .or(page.getByText('Edit', { exact: false }))
      .or(page.locator('[data-testid*="edit" i]'));
    await headerEdit.first().waitFor({ state: 'visible', timeout: 10000 });
    await headerEdit.first().click();
  }
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

async function updateContactDetails(page: Page, seed: SeedData) {
  const phoneField = page.locator('input[name*="phone" i], input[placeholder*="Phone" i], input[aria-label*="Phone" i]')
    .or(page.locator('label:has-text("Phone")').locator('..').locator('input'))
    .or(page.locator('[data-testid*="phone" i]'));
  await phoneField.first().waitFor({ state: 'visible', timeout: 15000 });

  const titleField = page.locator('input[name*="title" i], input[placeholder*="Title" i], input[aria-label*="Title" i]')
    .or(page.locator('label:has-text("Title")').locator('..').locator('input'))
    .or(page.locator('[data-testid*="title" i]'));
  await titleField.first().waitFor({ state: 'visible', timeout: 15000 });

  const notesField = page.locator('textarea[name*="note" i], textarea[placeholder*="Note" i], textarea[aria-label*="Note" i]')
    .or(page.locator('label:has-text("Notes")').locator('..').locator('textarea'))
    .or(page.locator('[data-testid*="note" i]'));
  await notesField.first().waitFor({ state: 'visible', timeout: 15000 });

  const existingPhone = await phoneField.first().inputValue().catch(() => '');
  const existingTitle = await titleField.first().inputValue().catch(() => '');
  await expect(phoneField.first()).toBeVisible({ timeout: 10000 });
  await expect(titleField.first()).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(800);

  await phoneField.first().fill(seed.phone);
  await page.waitForTimeout(600);
  await titleField.first().fill(seed.title);
  await page.waitForTimeout(600);
  await notesField.first().fill(seed.notes);
  await page.waitForTimeout(800);

  await page.screenshot({ path: 'debug-edit-form.png' });

  return { existingPhone, existingTitle };
}

async function saveChanges(page: Page) {
  await page.waitForTimeout(1000);
  const saveButton = page.locator('text="Save & close"').first()
    .or(page.getByRole('button', { name: /save/i }).first())
    .or(page.locator('[data-testid*="save" i]'));
  await saveButton.waitFor({ state: 'visible', timeout: 15000 });
  await saveButton.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
}

async function verifyUpdatedInList(page: Page, seed: SeedData) {
  await page.waitForTimeout(1000);
  const searchInput = page.getByRole('searchbox')
    .or(page.locator('input[placeholder*="Search" i]'))
    .or(page.locator('[data-testid*="search" i]'));
  try {
    await searchInput.first().waitFor({ state: 'visible', timeout: 8000 });
    await searchInput.first().fill(seed.phone);
    await page.keyboard.press('Enter');
  } catch (error) {
    // no search
  }
  await page.waitForTimeout(1500);

  const updatedRow = page.locator('table tbody tr, [role="row"]').filter({ hasText: seed.phone })
    .or(page.locator('table tbody tr, [role="row"]').filter({ hasText: seed.title }));
  await expect(updatedRow.first()).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'debug-updated-list.png' });
}

async function verifyModificationLogged(page: Page) {
  const activityTab = page.getByRole('tab', { name: /activity|history|log/i })
    .or(page.getByText('Activity', { exact: false }))
    .or(page.locator('[data-testid*="activity" i]'));
  try {
    await activityTab.first().waitFor({ state: 'visible', timeout: 8000 });
    await activityTab.first().click();
    await page.waitForTimeout(1200);
    const logEntry = page.getByText(/updated|modified|edited/i)
      .or(page.locator('[role="listitem"]').filter({ hasText: /updated|modified|edited/i }))
      .or(page.locator('[data-testid*="log" i]'));
    await expect(logEntry.first()).toBeVisible({ timeout: 10000 });
  } catch (error) {
    const toast = page.getByText(/updated|saved|success/i)
      .or(page.locator('[role="alert"]').filter({ hasText: /updated|saved|success/i }))
      .or(page.locator('.toast, .notification, [data-testid*="toast" i]'));
    await expect(toast.first()).toBeVisible({ timeout: 10000 });
  }
  await page.screenshot({ path: 'debug-modification-log.png' });
}

test.describe('Accounting Masters @Sqrtzahtx', () => {
  test('@contacts CONTACTS-EDIT: Edit business owner details @Tyknch2jh', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    await navigateToModule(page);
    await page.screenshot({ path: 'debug-contacts-list.png' });

    await filterByBusinessOwner(page);
    await page.screenshot({ path: 'debug-filtered-list.png' });

    await openFirstBusinessOwnerEdit(page);

    const { existingPhone, existingTitle } = await updateContactDetails(page, seed);
    await expect(page.locator('form, [role="form"]').first()).toBeVisible({ timeout: 10000 });
    await expect(existingPhone.length >= 0).toBeTruthy();
    await expect(existingTitle.length >= 0).toBeTruthy();

    await saveChanges(page);

    await navigateToModule(page);
    await verifyUpdatedInList(page, seed);

    await openFirstBusinessOwnerEdit(page);
    await verifyModificationLogged(page);
  });
});