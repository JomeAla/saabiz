<?php
/**
 * SAABIZ PHP SDK
 * 
 * A PHP library for validating software licenses via the SAABIZ platform.
 * Can be used in WordPress plugins or any PHP application.
 * 
 * Usage:
 * $saabiz = new SaabizLicense('https://api.saabiz.com', 'your-license-key', 'product-id');
 * $result = $saabiz->validate();
 * 
 * @package Saabiz
 * @version 1.0.0
 */

namespace Saabiz;

class SaabizLicense {
    /**
     * API base URL
     * @var string
     */
    private $apiUrl;
    
    /**
     * License key
     * @var string
     */
    private $licenseKey;
    
    /**
     * Product ID
     * @var string
     */
    private $productId;
    
    /**
     * Machine ID for hardware locking
     * @var string
     */
    private $machineId;
    
    /**
     * Domain for web applications
     * @var string
     */
    private $domain;
    
    /**
     * Current software version
     * @var string
     */
    private $currentVersion;
    
    /**
     * Error message
     * @var string|null
     */
    public $error = null;
    
    /**
     * Last response from API
     * @var array|null
     */
    public $lastResponse = null;
    
    /**
     * Constructor
     * 
     * @param string $apiUrl Base URL of the SAABIZ API
     * @param string $licenseKey License key to validate
     * @param string $productId Product ID
     */
    public function __construct($apiUrl, $licenseKey, $productId) {
        $this->apiUrl = rtrim($apiUrl, '/');
        $this->licenseKey = $licenseKey;
        $this->productId = $productId;
        $this->machineId = $this->generateMachineId();
        $this->domain = $_SERVER['HTTP_HOST'] ?? 'unknown';
    }
    
    /**
     * Set custom machine ID
     * 
     * @param string $machineId
     * @return self
     */
    public function setMachineId($machineId) {
        $this->machineId = $machineId;
        return $this;
    }
    
    /**
     * Set current software version
     * 
     * @param string $version
     * @return self
     */
    public function setVersion($version) {
        $this->currentVersion = $version;
        return $this;
    }
    
    /**
     * Set domain
     * 
     * @param string $domain
     * @return self
     */
    public function setDomain($domain) {
        $this->domain = $domain;
        return $this;
    }
    
    /**
     * Validate the license
     * 
     * @return bool
     */
    public function validate() {
        $response = $this->request('/licenses/ota-validate', [
            'licenseKey' => $this->licenseKey,
            'productId' => $this->productId,
            'machineId' => $this->machineId,
            'domain' => $this->domain,
        ]);
        
        $this->lastResponse = $response;
        
        if (isset($response['valid']) && $response['valid'] === true) {
            return true;
        }
        
        $this->error = $response['error'] ?? 'License validation failed';
        return false;
    }
    
    /**
     * Check for software updates
     * 
     * @return array|false
     */
    public function checkForUpdates() {
        $response = $this->request('/licenses/ota-check', [
            'licenseKey' => $this->licenseKey,
            'productId' => $this->productId,
            'currentVersion' => $this->currentVersion,
        ]);
        
        $this->lastResponse = $response;
        
        if (isset($response['updateAvailable']) && $response['updateAvailable'] === true) {
            return [
                'available' => true,
                'latestVersion' => $response['latestVersion'] ?? '',
                'downloadUrl' => $response['product']['downloadUrl'] ?? '',
            ];
        }
        
        return [
            'available' => false,
            'latestVersion' => $response['latestVersion'] ?? '',
        ];
    }
    
    /**
     * Get license information
     * 
     * @return array|false
     */
    public function getInfo() {
        if (!$this->validate()) {
            return false;
        }
        
        return $this->lastResponse;
    }
    
    /**
     * Check if license is valid (cached)
     * 
     * @return bool
     */
    public function isValid() {
        $transientKey = 'saabiz_license_' . md5($this->licenseKey);
        
        if (function_exists('get_transient')) {
            $cached = get_transient($transientKey);
            
            if ($cached !== false) {
                return $cached;
            }
            
            $result = $this->validate();
            
            set_transient($transientKey, $result, HOUR_IN_SECONDS);
            
            return $result;
        }
        
        return $this->validate();
    }
    
    /**
     * Activate the license on this machine
     * 
     * @return array
     */
    public function activate() {
        $response = $this->request('/licenses/activate', [
            'licenseKey' => $this->licenseKey,
            'productId' => $this->productId,
            'machineId' => $this->machineId,
        ]);
        
        $this->lastResponse = $response;
        
        if (isset($response['success']) && $response['success'] === true) {
            return [
                'success' => true,
                'message' => $response['message'] ?? 'License activated successfully',
                'activations' => $response['activations'] ?? 1,
                'maxActivations' => $response['maxActivations'] ?? 1,
                'isActivated' => $response['isActivated'] ?? true,
                'machineId' => $response['machineId'] ?? $this->machineId,
                'expiresAt' => $response['expiresAt'] ?? null,
            ];
        }
        
        $this->error = $response['message'] ?? 'Activation failed';
        return [
            'success' => false,
            'message' => $this->error,
            'activations' => $response['activations'] ?? 0,
            'maxActivations' => $response['maxActivations'] ?? 1,
        ];
    }
    
    /**
     * Deactivate the license on this machine
     * 
     * @return array
     */
    public function deactivate() {
        $response = $this->request('/licenses/deactivate', [
            'licenseKey' => $this->licenseKey,
            'productId' => $this->productId,
            'machineId' => $this->machineId,
        ]);
        
        $this->lastResponse = $response;
        
        if (isset($response['success']) && $response['success'] === true) {
            return [
                'success' => true,
                'message' => $response['message'] ?? 'License deactivated successfully',
                'activations' => $response['activations'] ?? 0,
                'maxActivations' => $response['maxActivations'] ?? 1,
            ];
        }
        
        $this->error = $response['message'] ?? 'Deactivation failed';
        return [
            'success' => false,
            'message' => $this->error,
            'activations' => $response['activations'] ?? 0,
            'maxActivations' => $response['maxActivations'] ?? 1,
        ];
    }
    
    /**
     * Get activation status
     * 
     * @return array
     */
    public function getActivationStatus() {
        $response = $this->request('/licenses/status', [
            'licenseKey' => $this->licenseKey,
            'productId' => $this->productId,
            'machineId' => $this->machineId,
        ]);
        
        $this->lastResponse = $response;
        
        return [
            'isActivated' => $response['isActivated'] ?? false,
            'activations' => $response['activations'] ?? 0,
            'maxActivations' => $response['maxActivations'] ?? 1,
            'expiresAt' => $response['expiresAt'] ?? null,
            'success' => $response['success'] ?? false,
        ];
    }
    
    /**
     * Make API request
     * 
     * @param string $endpoint
     * @param array $data
     * @return array
     */
    private function request($endpoint, $data) {
        $url = $this->apiUrl . $endpoint;
        
        $args = [
            'body' => json_encode($data),
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'timeout' => 30,
            'sslverify' => true,
        ];
        
        if (function_exists('wp_remote_post')) {
            $response = wp_remote_post($url, $args);
            
            if (is_wp_error($response)) {
                return ['error' => $response->get_error_message(), 'valid' => false];
            }
            
            $body = wp_remote_retrieve_body($response);
        } else {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Accept: application/json',
            ]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $body = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode >= 400) {
                return ['error' => 'HTTP Error: ' . $httpCode, 'valid' => false];
            }
        }
        
        return json_decode($body, true) ?: ['error' => 'Invalid response', 'valid' => false];
    }
    
    /**
     * Generate machine ID
     * 
     * @return string
     */
    private function generateMachineId() {
        $info = [
            php_uname(),
            $_SERVER['SERVER_ADDR'] ?? '',
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            getcwd(),
        ];
        
        return md5(implode('|', $info));
    }
}

/**
 * WordPress Helper Functions
 */

if (!function_exists('saabiz_validate_license')) {
    /**
     * Validate a SAABIZ license (WordPress helper)
     * 
     * @param string $licenseKey
     * @param string $productId
     * @param string $apiUrl
     * @return bool
     */
    function saabiz_validate_license($licenseKey, $productId, $apiUrl = 'http://localhost:3001/api') {
        $saabiz = new \Saabiz\SaabizLicense($apiUrl, $licenseKey, $productId);
        return $saabiz->validate();
    }
}

if (!function_exists('saabiz_check_updates')) {
    /**
     * Check for software updates (WordPress helper)
     * 
     * @param string $licenseKey
     * @param string $productId
     * @param string $currentVersion
     * @param string $apiUrl
     * @return array|false
     */
    function saabiz_check_updates($licenseKey, $productId, $currentVersion, $apiUrl = 'http://localhost:3001/api') {
        $saabiz = new \Saabiz\SaabizLicense($apiUrl, $licenseKey, $productId);
        $saabiz->setVersion($currentVersion);
        return $saabiz->checkForUpdates();
    }
}

if (!function_exists('saabiz_activate_license')) {
    /**
     * Activate a SAABIZ license (WordPress helper)
     * 
     * @param string $licenseKey
     * @param string $productId
     * @param string $apiUrl
     * @return array
     */
    function saabiz_activate_license($licenseKey, $productId, $apiUrl = 'http://localhost:3001/api') {
        $saabiz = new \Saabiz\SaabizLicense($apiUrl, $licenseKey, $productId);
        return $saabiz->activate();
    }
}

if (!function_exists('saabiz_deactivate_license')) {
    /**
     * Deactivate a SAABIZ license (WordPress helper)
     * 
     * @param string $licenseKey
     * @param string $productId
     * @param string $apiUrl
     * @return array
     */
    function saabiz_deactivate_license($licenseKey, $productId, $apiUrl = 'http://localhost:3001/api') {
        $saabiz = new \Saabiz\SaabizLicense($apiUrl, $licenseKey, $productId);
        return $saabiz->deactivate();
    }
}

if (!function_exists('saabiz_get_activation_status')) {
    /**
     * Get license activation status (WordPress helper)
     * 
     * @param string $licenseKey
     * @param string $productId
     * @param string $apiUrl
     * @return array
     */
    function saabiz_get_activation_status($licenseKey, $productId, $apiUrl = 'http://localhost:3001/api') {
        $saabiz = new \Saabiz\SaabizLicense($apiUrl, $licenseKey, $productId);
        return $saabiz->getActivationStatus();
    }
}
