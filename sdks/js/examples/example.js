const { SaabizSDK } = require('./dist/index');

const saabiz = new SaabizSDK({
  apiUrl: process.env.SAABIZ_API_URL || 'https://api.saabiz.com',
  apiKey: process.env.SAABIZ_API_KEY,
});

async function main() {
  console.log('SAABIZ SDK - Node.js Example\n');

  const licenseKey = process.env.LICENSE_KEY || 'SAABIZ-XXXXXXXXXXXXXXXX';
  const productId = process.env.PRODUCT_ID || 'your-product-id';

  console.log(`Validating license: ${licenseKey}`);
  const validationResult = await saabiz.validateLicense(licenseKey, productId);

  if (validationResult.valid) {
    console.log('✓ License is valid!');
    console.log(`  Product: ${validationResult.productName}`);
    console.log(`  Expires: ${validationResult.expiresAt || 'Never'}`);
  } else {
    console.log('✗ License is invalid');
    console.log(`  Reason: ${validationResult.reason}`);
  }

  console.log('\nChecking for updates...');
  const updateResult = await saabiz.checkForUpdate(licenseKey, productId, '1.0.0');

  if (updateResult.hasUpdate) {
    console.log('⚠ Update available:', updateResult.latestVersion);
    console.log('  Download:', updateResult.downloadUrl);
  } else {
    console.log('✓ You are running the latest version');
  }

  console.log('\nActivating license on this machine...');
  const activationResult = await saabiz.activate(licenseKey, productId);
  console.log(`  Success: ${activationResult.success}`);
  console.log(`  Machine: ${activationResult.machineId}`);
  console.log(`  Activation count: ${activationResult.activations} / ${activationResult.maxActivations}`);
}

main().catch(console.error);
