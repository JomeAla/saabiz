import { test, expect } from '@playwright/test';

// Multi-host storefront tests: tenant subdomains must only expose their own
// products and payment config, never another tenant's (or the platform's).
// Hosts are mapped to 127.0.0.1 via Chromium --host-resolver-rules in
// playwright.config.ts, so no /etc/hosts edit is required.

const ACME_URL = 'http://acme.saabiz.com:3000';
const GLOBEX_URL = 'http://globex.saabiz.com:3000';
const PLATFORM_URL = 'http://localhost:3000';
const API_URL = 'http://127.0.0.1:3000';

// The Node request context does its own DNS (it doesn't see the browser's
// resolver rules), so tenant-host API calls go to 127.0.0.1 with the Host
// header overridden — the web middleware + API scope by Host exactly like
// production traffic.
async function hostGet(request: import('@playwright/test').APIRequestContext, host: string, path: string) {
  return request.get(`${API_URL}${path}`, { headers: { host } });
}

test.describe.configure({ mode: 'parallel' });

test.setTimeout(180_000);

const ACME_PRODUCTS = ['SaaS Analytics Pro', 'Email Marketing Suite'];
const GLOBEX_PRODUCTS = ['Cloud Backup Pro'];
const ALL_PRODUCTS = [...ACME_PRODUCTS, ...GLOBEX_PRODUCTS];

test.describe('Storefront product scoping (UI)', () => {
  test('acme.saabiz.com shows only Acme products', async ({ page }) => {
    await page.goto(`${ACME_URL}/marketplace`);
    await expect(page.getByRole('heading', { name: /discover premium software/i })).toBeVisible({ timeout: 120_000 });

    for (const name of ACME_PRODUCTS) {
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
    }
    await expect(page.getByText('Cloud Backup Pro', { exact: true })).toHaveCount(0);
  });

  test('globex.saabiz.com shows only Globex products', async ({ page }) => {
    await page.goto(`${GLOBEX_URL}/marketplace`);
    await expect(page.getByRole('heading', { name: /discover premium software/i })).toBeVisible({ timeout: 120_000 });

    await expect(page.getByText('Cloud Backup Pro', { exact: true }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('SaaS Analytics Pro', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Email Marketing Suite', { exact: true })).toHaveCount(0);
  });

  test('platform host shows all products', async ({ page }) => {
    await page.goto(`${PLATFORM_URL}/marketplace`);
    await expect(page.getByRole('heading', { name: /discover premium software/i })).toBeVisible({ timeout: 120_000 });

    for (const name of ALL_PRODUCTS) {
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
    }
  });
});

test.describe('Storefront product scoping (API via proxy)', () => {
  test('products/public returns tenant-scoped sets per host', async ({ request }) => {
    const acme = await hostGet(request, 'acme.saabiz.com', '/api/products/public');
    expect(acme.ok()).toBeTruthy();
    const acmeNames = (await acme.json()).map((p: any) => p.name);
    expect(acmeNames).toEqual(expect.arrayContaining(ACME_PRODUCTS));
    expect(acmeNames).not.toContain('Cloud Backup Pro');

    const globex = await hostGet(request, 'globex.saabiz.com', '/api/products/public');
    expect(globex.ok()).toBeTruthy();
    const globexNames = (await globex.json()).map((p: any) => p.name);
    expect(globexNames).toEqual(expect.arrayContaining(GLOBEX_PRODUCTS));
    expect(globexNames).not.toContain('SaaS Analytics Pro');

    const platform = await hostGet(request, 'localhost', '/api/products/public');
    expect(platform.ok()).toBeTruthy();
    const platformNames = (await platform.json()).map((p: any) => p.name);
    for (const name of ALL_PRODUCTS) {
      expect(platformNames).toContain(name);
    }
  });

  test('tenant hosts resolve to their own tenant via middleware', async ({ request }) => {
    const acmeResolve = await hostGet(request, 'acme.saabiz.com', '/api/tenants/resolve?host=acme.saabiz.com');
    expect(acmeResolve.ok()).toBeTruthy();
    const acmeTenant = await acmeResolve.json();
    expect(acmeTenant.tenant.slug).toBe('acme');

    const globexResolve = await hostGet(request, 'globex.saabiz.com', '/api/tenants/resolve?host=globex.saabiz.com');
    expect(globexResolve.ok()).toBeTruthy();
    const globexTenant = await globexResolve.json();
    expect(globexTenant.tenant.slug).toBe('globex');
  });

  test('checkout config is reachable and shaped correctly on a tenant host', async ({ request }) => {
    const resp = await hostGet(request, 'acme.saabiz.com', '/api/checkout/config');
    expect(resp.ok()).toBeTruthy();
    const config = await resp.json();
    expect(config).toHaveProperty('paystackActive');
    expect(config).toHaveProperty('flutterwaveActive');
  });

  test('unknown storefront host 404s on the API (no cross-tenant leakage)', async ({ request }) => {
    // Hit the API directly: a host that matches no tenant must not resolve.
    const resp = await request.get('http://127.0.0.1:3001/api/tenants/resolve?host=nonexistent.saabiz.com');
    expect(resp.status()).toBe(404);
  });
});