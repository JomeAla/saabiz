# SAABIZ JavaScript SDK

A JavaScript/TypeScript SDK for integrating SAABIZ license validation and software activation into your applications.

## Installation

```bash
npm install @saabiz/js-sdk
```

Or with yarn:
```bash
yarn add @saabiz/js-sdk
```

Or with pnpm:
```bash
pnpm add @saabiz/js-sdk
```

## Quick Start

```javascript
import SaabizSDK from '@saabiz/js-sdk';

const saabiz = new SaabizSDK({
  apiUrl: 'https://api.your-saabiz-instance.com',
  apiKey: 'your-optional-api-key'
});

// Validate a license
const result = await saabiz.validateLicense('SAABIZ-XXXX-XXXX-XXXX', 'your-product-id');

if (result.valid) {
  console.log('License is valid!');
} else {
  console.log('License error:', result.reason);
}
```

## Features

- **License Validation** - Verify license keys against the SAABIZ platform
- **Software Activation** - Activate licenses on specific machines (1-site activation)
- **Machine Binding** - Hardware-locked license activation
- **OTA Updates** - Check for and download software updates
- **TypeScript Support** - Full TypeScript definitions included

## Configuration

```typescript
const saabiz = new SaabizSDK({
  apiUrl: 'https://api.your-saabiz-instance.com',  // Required: Your SAABIZ API URL
  apiKey: 'your-api-key',                          // Optional: API key for authenticated requests
  timeout: 10000,                                  // Optional: Request timeout in ms (default: 10000)
});
```

## API Reference

### validateLicense(key, productId)

Validates a license key without activation.

```typescript
const result = await saabiz.validateLicense('SAABIZ-XXXX-XXXX', 'product-123');

interface LicenseValidationResult {
  valid: boolean;
  reason?: string;
  productName?: string;
  expiresAt?: string | null;
}
```

### activateLicense(key, productId, machineId?)

Activates a license on the current machine (or a custom machine ID).

```typescript
const result = await saabiz.activateLicense('SAABIZ-XXXX-XXXX', 'product-123');

interface ActivationResult {
  success: boolean;
  licenseKey: string;
  machineId: string;
  activations: number;
  maxActivations: number;
  isActivated: boolean;
  expiresAt: string | null;
  productName: string;
  message?: string;
}
```

### deactivateLicense(key, productId, machineId?)

Deactivates a license, allowing it to be activated on another machine.

```typescript
const result = await saabiz.deactivateLicense('SAABIZ-XXXX-XXXX', 'product-123');
```

### checkForUpdate(productId, currentVersion)

Checks if a software update is available.

```typescript
const result = await saabiz.checkForUpdate('product-123', '1.0.0');

interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion?: string;
  downloadUrl?: string;
  releaseNotes?: string;
}
```

### getActivationStatus(key, productId, machineId?)

Gets the current activation status of a license.

```typescript
const status = await saabiz.getActivationStatus('SAABIZ-XXXX-XXXX', 'product-123');
```

## Machine ID

The SDK automatically generates a unique machine ID based on:
- User agent
- Screen resolution
- Language
- Random UUID
- Timestamp

To use a custom machine ID:

```typescript
// Set custom machine ID
saabiz.machineId = 'your-custom-machine-id';

// Or pass it directly to activation
await saabiz.activateLicense('SAABIZ-XXXX-XXXX', 'product-123', 'your-machine-id');
```

## Browser Usage

The SDK works in browsers with automatic machine ID generation:

```html
<script type="module">
  import SaabizSDK from 'https://cdn.jsdelivr.net/npm/@saabiz/js-sdk/dist/index.mjs';
  
  const saabiz = new SaabizSDK({
    apiUrl: 'https://api.your-saabiz-instance.com'
  });
  
  // Your activation code here
</script>
```

## Node.js Usage

Works in Node.js environments:

```javascript
const SaabizSDK = require('@saabiz/js-sdk');

const saabiz = new SaabizSDK({
  apiUrl: 'https://api.your-saabiz-instance.com'
});
```

## Error Handling

```javascript
try {
  const result = await saabiz.activateLicense(key, productId);
  
  if (!result.success) {
    console.error('Activation failed:', result.message);
    return;
  }
  
  console.log('Activated successfully!');
} catch (error) {
  console.error('Network error:', error.message);
}
```

## Activation Limits

By default, licenses support 1-site activation (single machine). The `maxActivations` field on plans controls this:

- `1` - Single site activation
- `2+` - Multi-site activation
- `0` - Unlimited activations

## Complete Example

```javascript
import SaabizSDK from '@saabiz/js-sdk';

async function activateSoftware() {
  const saabiz = new SaabizSDK({
    apiUrl: 'https://api.your-saabiz-instance.com'
  });
  
  const licenseKey = 'SAABIZ-XXXX-XXXX-XXXX';
  const productId = 'your-product-id';
  
  // Check current status
  const status = await saabiz.getActivationStatus(licenseKey, productId);
  
  if (status.isActivated) {
    console.log('Already activated on this machine');
    return true;
  }
  
  // Activate
  const result = await saabiz.activateLicense(licenseKey, productId);
  
  if (result.success) {
    console.log('Activated! Expires:', result.expiresAt);
    return true;
  } else {
    console.error('Activation failed:', result.message);
    return false;
  }
}
```

## License

MIT
