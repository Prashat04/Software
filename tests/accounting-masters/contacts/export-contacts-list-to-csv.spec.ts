import { test, expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import fs from 'fs';
import path from 'path';

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
async function navigateToContacts(page: Page) {
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

async function goToVendorsTab(page: Page) {
  const vendorsTab = page.getByRole('tab', { name: /vendors/i })
    .or(page.getByText('Vendors', { exact: false }))
    .or(page.locator('[data-testid*="vendors"]'));
  await vendorsTab.first().waitFor({ state: 'visible', timeout: 15000 });
  await vendorsTab.first().click();
  await page.waitForTimeout(1000);
}

async function openExportMenu(page: Page) {
  const exportButton = page.getByRole('button', { name: /export/i })
    .or(page.getByText('Export', { exact: false }))
    .or(page.locator('[data-testid*="export"]'));
  await exportButton.first().waitFor({ state: 'visible', timeout: 15000 });
  await exportButton.first().click();
  await page.waitForTimeout(1000);
}

async function selectCSVFormat(page: Page) {
  const csvOption = page.getByRole('menuitem', { name: /csv/i })
    .or(page.getByRole('option', { name: /csv/i }))
    .or(page.getByText('CSV', { exact: false }));
  await csvOption.first().waitFor({ state: 'visible', timeout: 15000 });
  await csvOption.first().click();
  await page.waitForTimeout(1000);
}

async function getContactRowCount(page: Page): Promise<number> {
  const rowLocator = page.locator('table tbody tr')
    .or(page.locator('[role="row"]').filter({ has: page.locator('td') }));
  try {
    await rowLocator.first().waitFor({ state: 'visible', timeout: 10000 });
  } catch (e) {
    // continue; maybe empty state
  }
  return await rowLocator.count();
}

test.describe('Accounting Masters @Ssbaqu0sz', () => {
  test('@contacts CONTACTS-EXPORT: Export contacts list to CSV @Tqa1axvop', async ({ page }) => {
    test.setTimeout(180000);
    const seed = buildSeedData(test.info());
    await seedLogin(page);

    await navigateToContacts(page);
    await goToVendorsTab(page);
    await page.screenshot({ path: `debug-contacts-list-${seed.referenceNumber}.png` });

    const beforeCount = await getContactRowCount(page);

    await openExportMenu(page);
    await page.screenshot({ path: `debug-export-menu-${seed.referenceNumber}.png` });

    await selectCSVFormat(page);

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    const exportConfirmButton = page.getByRole('button', { name: /download|export/i })
      .or(page.getByText('Download', { exact: false }))
      .or(page.locator('button:has-text("CSV")'));
    try {
      await exportConfirmButton.first().waitFor({ state: 'visible', timeout: 5000 });
      await exportConfirmButton.first().click();
    } catch (e) {
      // If selecting CSV triggers download directly
    }

    const download = await downloadPromise;
    const downloadPath = path.join(test.info().outputPath(), `contacts-${seed.referenceNumber}.csv`);
    await download.saveAs(downloadPath);
    await page.screenshot({ path: `debug-after-download-${seed.referenceNumber}.png` });

    expect(fs.existsSync(downloadPath)).toBeTruthy();

    const fileContents = fs.readFileSync(downloadPath, 'utf-8');
    const lines = fileContents.split(/\r?\n/).filter(line => line.trim().length > 0);

    expect(lines.length).toBeGreaterThan(1);

    const headers = lines[0].split(',').map(h => h.replace(/(^"|"$)/g, '').trim());
    expect(headers.length).toBeGreaterThan(2);
    headers.forEach(h => expect(h.length).toBeGreaterThan(0));

    const dataRows = lines.slice(1);
    if (beforeCount > 0) {
      expect(dataRows.length).toBeGreaterThanOrEqual(beforeCount);
    } else {
      expect(dataRows.length).toBeGreaterThanOrEqual(1);
    }

    const columnCount = headers.length;
    dataRows.forEach(row => {
      const columns = row.split(',').map(c => c.replace(/(^"|"$)/g, '').trim());
      expect(columns.length).toBeGreaterThanOrEqual(columnCount - 1);
    });
  });
});