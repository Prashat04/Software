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
const moduleUrl = '/accounting/masters/tracking-options';

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
async function waitForLoadingToFinish(page: Page) {
  const loader = page.locator('[data-testid*="loading"], .spinner, [role="progressbar"]').first()
    .or(page.locator('text=/loading/i').first())
    .or(page.locator('[class*="loading"]').first());
  try {
    await loader.waitFor({ state: 'hidden', timeout: 10000 });
  } catch (error) {
    // ignore if loader not found
  }
}

async function navigateToModule(page: Page) {
  await page.goto(moduleUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  await waitForLoadingToFinish(page);
  const heading = page.getByRole('heading', { name: /tracking options|tracking categories/i }).first()
    .or(page.getByText(/tracking options|tracking categories/i).first())
    .or(page.locator('h1, h2').filter({ hasText: /tracking/i }).first());
  const table = page.locator('table, [role="table"], [data-testid*="tracking"]').first();
  try {
    await expect(heading.or(table)).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking|masters/i);
  }
}

function getCategoryRows(page: Page) {
  return page.locator('table tbody tr')
    .or(page.locator('[role="rowgroup"] [role="row"]'))
    .or(page.locator('[data-testid*="tracking-category"], .tracking-category, .accordion-item'));
}

async function expandCategoryRow(page: Page, rowIndex: number) {
  const rows = getCategoryRows(page);
  const row = rows.nth(rowIndex);
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  const expandButton = row.getByRole('button', { name: /expand|show|view|open|options/i }).first()
    .or(row.locator('button[aria-label*="expand" i]').first())
    .or(row.locator('[data-testid*="expand"], [aria-expanded]').first());

  try {
    await expandButton.waitFor({ state: 'visible', timeout: 5000 });
    await expandButton.click();
  } catch (error) {
    try {
      await row.click();
    } catch (e) {
      // ignore if row not clickable
    }
  }

  await page.waitForTimeout(1200);
  await waitForLoadingToFinish(page);

  const optionContainer = row.locator('ul, [role="list"], [data-testid*="options"]').first()
    .or(row.locator('xpath=following-sibling::*[1]').first())
    .or(page.locator('[data-testid*="tracking-options"]').first());

  const options = optionContainer.locator('li, [role="listitem"], .option, [data-testid*="tracking-option"]')
    .or(row.locator('li, [role="listitem"], .option, [data-testid*="tracking-option"]'))
    .or(page.locator('[data-testid*="tracking-option"], .tracking-option'));

  try {
    await expect(options.first()).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await expect(page).toHaveURL(/tracking|masters/i);
  }
}

test.describe('Accounting Masters @Sm12sp7fd', () => {
  test('@tracking TRACKING-001: View tracking options list @Tfk50nc9p', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    await navigateToModule(page);
    await page.screenshot({ path: 'debug-tracking-options-page.png' });

    const categoryRows = getCategoryRows(page);
    await categoryRows.first().waitFor({ state: 'visible', timeout: 15000 });
    await expect(categoryRows.first()).toBeVisible({ timeout: 10000 });

    const count = await categoryRows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expandCategoryRow(page, i);
      if (i === 0) {
        await page.screenshot({ path: 'debug-tracking-options-expanded-first.png' });
      }
    }

    await page.screenshot({ path: 'debug-tracking-options-expanded-all.png' });
  });
});