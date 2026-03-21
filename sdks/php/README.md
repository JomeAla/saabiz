# SAABIZ PHP SDK

A PHP library for integrating SAABIZ license validation and software activation into your PHP applications and WordPress plugins.

## Requirements

- PHP 7.4 or higher
- cURL extension

## Installation

### Composer

```bash
composer require saabiz/license-sdk
```

### Manual Installation

If you're not using Composer, simply include the `SaabizLicense.php` file:

```php
require_once 'path/to/SaabizLicense.php';
```

## Quick Start

```php
<?php

use Saabiz\SaabizLicense;

$saabiz = new SaabizLicense(
    'https://api.your-saabiz-instance.com',  // API URL
    'SAABIZ-XXXX-XXXX-XXXX',                // License Key
    'your-product-id'                        // Product ID
);

if ($saabiz->validate()) {
    echo 'License is valid!';
} else {
    echo 'License error: ' . $saabiz->error;
}
```

## WordPress Installation

1. Upload the `SaabizLicense.php` file to your plugin directory
2. Include it in your main plugin file:

```php
require_once dirname(__FILE__) . '/SaabizLicense.php';
```

3. Use the helper functions:

```php
<?php
// Validate a license
if (saabiz_validate_license('SAABIZ-XXXX-XXXX', 'product-id')) {
    // License is valid, show premium content
} else {
    // Show upgrade prompt
}

// Check for updates
$update = saabiz_check_updates('SAABIZ-XXXX-XXXX', 'product-id', '1.0.0');
if ($update['available']) {
    // Download update from $update['downloadUrl']
}

// Activate license on machine
$result = saabiz_activate_license('SAABIZ-XXXX-XXXX', 'product-id');
if ($result['success']) {
    echo 'Activated!';
}

// Deactivate license
$result = saabiz_deactivate_license('SAABIZ-XXXX-XXXX', 'product-id');
if ($result['success']) {
    echo 'Deactivated!';
}
```

## Configuration

### Constructor Parameters

```php
$saabiz = new SaabizLicense($apiUrl, $licenseKey, $productId);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `$apiUrl` | string | Base URL of the SAABIZ API |
| `$licenseKey` | string | The license key |
| `$productId` | string | The product ID |

### Set Version

```php
$saabiz->setVersion('1.2.0');
```

### Set Custom Machine ID

By default, a machine ID is generated from:
- PHP OS info
- Server IP
- User agent
- Working directory

To use a custom machine ID:

```php
$saabiz->setMachineId('your-custom-machine-id');
```

### Set Domain

```php
$saabiz->setDomain('yourdomain.com');
```

## API Reference

### validate()

Validates the license without activating.

```php
if ($saabiz->validate()) {
    // License is valid
} else {
    echo $saabiz->error;
}
```

### activate()

Activates the license on the current machine.

```php
$result = $saabiz->activate();

if ($result['success']) {
    echo "Activated! ";
    echo "Activations: {$result['activations']}/{$result['maxActivations']}";
} else {
    echo "Failed: {$result['message']}";
}
```

### deactivate()

Deactivates the license on the current machine.

```php
$result = $saabiz->deactivate();

if ($result['success']) {
    echo "Deactivated! You can now activate on another machine.";
} else {
    echo "Failed: {$result['message']}";
}
```

### getActivationStatus()

Gets the current activation status.

```php
$status = $saabiz->getActivationStatus();

print_r($status);
// [
//     'isActivated' => true,
//     'activations' => 1,
//     'maxActivations' => 1,
//     'expiresAt' => '2026-12-31T23:59:59Z'
// ]
```

### checkForUpdates()

Checks if a software update is available.

```php
$update = $saabiz->checkForUpdates();

if ($update['available']) {
    echo "Update available: {$update['latestVersion']}";
    echo "Download: {$update['downloadUrl']}";
}
```

### isValid()

Checks if the license is valid with caching (WordPress).

```php
if ($saabiz->isValid()) {
    // License is valid (uses WordPress transient cache)
}
```

## Complete Example

```php
<?php

use Saabiz\SaabizLicense;

$saabiz = new SaabizLicense(
    'https://api.your-saabiz-instance.com',
    'SAABIZ-XXXX-XXXX-XXXX',
    'your-product-id'
);

// Set version
$saabiz->setVersion('1.0.0');

// Check activation status
$status = $saabiz->getActivationStatus();

if (!$status['isActivated']) {
    // Try to activate
    $result = $saabiz->activate();
    
    if (!$result['success']) {
        die("Activation failed: {$result['message']}");
    }
    
    echo "License activated successfully!";
} else {
    echo "License is active on this machine.";
}

// Validate before showing premium content
if (!$saabiz->validate()) {
    die("Invalid license: " . $saabiz->error);
}

// Check for updates
$update = $saabiz->checkForUpdates();
if ($update['available']) {
    echo "Update available: {$update['latestVersion']}";
}

// Your premium application code here...
```

## Activation Limits

By default, licenses support 1-site activation (single machine). The `maxActivations` field on plans controls this:

- `1` - Single site activation
- `2+` - Multi-site activation
- `0` - Unlimited activations

## Error Handling

```php
try {
    $result = $saabiz->activate();
    
    if (!$result['success']) {
        // Handle activation failure
        switch ($result['message']) {
            case 'Maximum activations reached':
                // Show upgrade prompt or deactivation option
                break;
            case 'License has expired':
                // Show renewal prompt
                break;
            default:
                // Generic error
                break;
        }
    }
} catch (Exception $e) {
    // Handle network errors, etc.
    error_log('SAABIZ Error: ' . $e->getMessage());
}
```

## Caching (WordPress)

The `isValid()` method uses WordPress transients for caching. To clear the cache:

```php
delete_transient('saabiz_license_' . md5($licenseKey));
```

## Support

For issues and questions, please visit:
- [GitHub Issues](https://github.com/saabiz/php-sdk/issues)
- [SAABIZ Documentation](https://docs.saabiz.com)

## License

MIT
