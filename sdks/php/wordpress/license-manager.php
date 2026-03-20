/**
 * Plugin Name: SAABIZ License Manager
 * Plugin URI: https://saabiz.com
 * Description: Validate software licenses using the SAABIZ platform
 * Version: 1.0.0
 * Author: SAABIZ
 * Author URI: https://saabiz.com
 * License: GPL v2 or later
 * Text Domain: saabiz-license-manager
 */

require_once __DIR__ . '/SaabizLicense.php';

add_action('admin_menu', 'saabiz_license_menu');
add_action('admin_init', 'saabiz_license_settings');

function saabiz_license_menu() {
    add_options_page(
        'SAABIZ License Manager',
        'SAABIZ Licenses',
        'manage_options',
        'saabiz-license-manager',
        'saabiz_license_settings_page'
    );
}

function saabiz_license_settings() {
    register_setting('saabiz_license_group', 'saabiz_license_key');
    register_setting('saabiz_license_group', 'saabiz_product_id');
    register_setting('saabiz_license_group', 'saabiz_api_url');
}

function saabiz_license_settings_page() {
    ?>
    <div class="wrap">
        <h1>SAABIZ License Manager</h1>
        <form method="post" action="options.php">
            <?php settings_fields('saabiz_license_group'); ?>
            <?php do_settings_sections('saabiz_license_group'); ?>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">License Key</th>
                    <td>
                        <input type="text" name="saabiz_license_key" value="<?php echo esc_attr(get_option('saabiz_license_key')); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row">Product ID</th>
                    <td>
                        <input type="text" name="saabiz_product_id" value="<?php echo esc_attr(get_option('saabiz_product_id')); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row">API URL</th>
                    <td>
                        <input type="text" name="saabiz_api_url" value="<?php echo esc_attr(get_option('saabiz_api_url', 'http://localhost:3001/api')); ?>" class="regular-text" />
                    </td>
                </tr>
            </table>
            <?php submit_button('Save Changes'); ?>
        </form>
        
        <h2>License Status</h2>
        <?php
        $licenseKey = get_option('saabiz_license_key');
        $productId = get_option('saabiz_product_id');
        $apiUrl = get_option('saabiz_api_url', 'http://localhost:3001/api');
        
        if ($licenseKey && $productId) {
            $saabiz = new \Saabiz\SaabizLicense($apiUrl, $licenseKey, $productId);
            $valid = $saabiz->validate();
            
            if ($valid) {
                echo '<div class="notice notice-success"><p>✓ License is valid</p></div>';
                
                $updates = $saabiz->checkForUpdates();
                if ($updates && $updates['available']) {
                    echo '<div class="notice notice-warning"><p>Update available: ' . esc_html($updates['latestVersion']) . '</p></div>';
                }
            } else {
                echo '<div class="notice notice-error"><p>✗ ' . esc_html($saabiz->error) . '</p></div>';
            }
        } else {
            echo '<p>Please configure your license settings above.</p>';
        }
        ?>
    </div>
    <?php
}

add_action('plugins_loaded', 'saabiz_check_license_validation');

function saabiz_check_license_validation() {
    $licenseKey = get_option('saabiz_license_key');
    $productId = get_option('saabiz_product_id');
    $apiUrl = get_option('saabiz_api_url', 'http://localhost:3001/api');
    
    if (!$licenseKey || !$productId) {
        return;
    }
    
    $saabiz = new \Saabiz\SaabizLicense($apiUrl, $licenseKey, $productId);
    $valid = $saabiz->isValid();
    
    if (!$valid) {
        add_action('admin_notices', function() {
            echo '<div class="notice notice-error is-dismissible">';
            echo '<p><strong>SAABIZ License Invalid:</strong> Your license is not valid. Please update your license key.</p>';
            echo '</div>';
        });
    }
}
