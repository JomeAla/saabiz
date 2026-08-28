import { test, expect } from '@playwright/test';

test.setTimeout(120_000);

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder('you@company.com').fill('seller@saabiz.com');
    await page.getByPlaceholder(/password/i).fill('seller123');
    
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.waitForURL('/seller/dashboard');
    await expect(page).toHaveURL('/seller/dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder('you@company.com').fill('invalid@example.com');
    await page.getByPlaceholder(/password/i).fill('wrongpassword');
    
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page.getByText(/invalid credentials/i)).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@company.com').fill('seller@saabiz.com');
    await page.getByPlaceholder(/password/i).fill('seller123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/seller/dashboard');
    
    await page.getByRole('button', { name: /sign out/i }).click();
    
    await page.waitForURL('/');
  });
});

test.describe('Marketplace', () => {
  test('should display marketplace', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(page.getByRole('heading', { name: /discover premium software/i })).toBeVisible();
  });

  test('should show products', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(page.locator('.glass-card').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Seller Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@company.com').fill('seller@saabiz.com');
    await page.getByPlaceholder(/password/i).fill('seller123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/seller/dashboard');
  });

  test('should display seller dashboard', async ({ page }) => {
    await page.goto('/seller/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should display products page', async ({ page }) => {
    await page.goto('/seller/products');
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
  });

  test('should display subscribers page', async ({ page }) => {
    await page.goto('/seller/subscribers');
    await expect(page.getByRole('heading', { name: 'Subscribers', exact: true })).toBeVisible();
  });

  test('should display settings page', async ({ page }) => {
    await page.goto('/seller/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should display payouts page', async ({ page }) => {
    await page.goto('/seller/payouts');
    await expect(page.getByRole('heading', { name: /payouts/i })).toBeVisible();
  });
});

test.describe('Customer Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@company.com').fill('customer@saabiz.com');
    await page.getByPlaceholder(/password/i).fill('customer123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/customer/dashboard');
  });

  test('should display customer dashboard', async ({ page }) => {
    await page.goto('/customer/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should display licenses page', async ({ page }) => {
    await page.goto('/customer/licenses');
    await expect(page.getByRole('heading', { name: 'My Licenses', exact: true })).toBeVisible();
  });

  test('should display billing page', async ({ page }) => {
    await page.goto('/customer/billing');
    await expect(page.getByRole('heading', { name: 'Billing', exact: true })).toBeVisible();
  });

  test('should display settings page', async ({ page }) => {
    await page.goto('/customer/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });
});

test.describe('Affiliate Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@company.com').fill('affiliate@saabiz.com');
    await page.getByPlaceholder(/password/i).fill('affiliate123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/affiliate/dashboard');
  });

  test('should display affiliate dashboard', async ({ page }) => {
    await page.goto('/affiliate/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should display links page', async ({ page }) => {
    await page.goto('/affiliate/links');
    await expect(page.getByRole('heading', { name: 'My Affiliate Links', exact: true })).toBeVisible();
  });

  test('should display commissions page', async ({ page }) => {
    await page.goto('/affiliate/commissions');
    await expect(page.getByRole('heading', { name: 'Commissions', exact: true })).toBeVisible();
  });

  test('should display settings page', async ({ page }) => {
    await page.goto('/affiliate/settings');
    await expect(page.getByRole('heading', { name: /affiliate settings/i })).toBeVisible();
  });
});

test.describe('404 Page', () => {
  test('should display 404 page for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByRole('link', { name: /go home/i })).toBeVisible();
  });
});
