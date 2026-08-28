import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface LicenseValidationResult {
  valid: boolean;
  reason?: string;
  productName?: string;
  expiresAt?: string | null;
  expiredAt?: string | null;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion?: string;
  downloadUrl?: string;
  releaseNotes?: string;
}

export interface ActivationResult {
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

export interface DeactivationResult {
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

export interface SaabizConfig {
  apiUrl: string;
  apiKey?: string;
  timeout?: number;
}

function generateMachineId(): string {
  const data = [
    typeof navigator !== 'undefined' ? navigator.userAgent : '',
    typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
    typeof navigator !== 'undefined' ? navigator.language : '',
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
  ];
  
  let hash = 0;
  const str = data.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16).padStart(32, '0') + '-' + 
         Date.now().toString(16) + '-' +
         Math.random().toString(16).substring(2, 10);
}

export class SaabizSDK {
  private client: AxiosInstance;
  private apiUrl: string;
  private apiKey?: string;
  private _machineId?: string;

  constructor(config: SaabizConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;

    const axiosConfig: AxiosRequestConfig = {
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (this.apiKey) {
      axiosConfig.headers = {
        ...axiosConfig.headers,
        'Authorization': `Bearer ${this.apiKey}`,
      };
    }

    this.client = axios.create(axiosConfig);
  }

  get machineId(): string {
    if (!this._machineId) {
      this._machineId = generateMachineId();
    }
    return this._machineId;
  }

  set machineId(id: string) {
    this._machineId = id;
  }

  async validateLicense(key: string, productId: string): Promise<LicenseValidationResult> {
    try {
      const response = await this.client.post<LicenseValidationResult>(
        `${this.apiUrl}/licenses/verify`,
        { key, productId }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return {
          valid: false,
          reason: error.response.data.message || 'License validation failed',
        };
      }
      return {
        valid: false,
        reason: error.message || 'Network error during license validation',
      };
    }
  }

  async checkForUpdate(
    key: string,
    productId: string,
    currentVersion: string
  ): Promise<UpdateCheckResult> {
    try {
      const response = await this.client.post<UpdateCheckResult & { product?: { downloadUrl?: string } }>(
        `${this.apiUrl}/licenses/ota-check`,
        { licenseKey: key, productId, currentVersion }
      );
      const data = response.data;
      return {
        hasUpdate: !!data.hasUpdate,
        latestVersion: data.latestVersion,
        downloadUrl: data.downloadUrl || data.product?.downloadUrl || undefined,
      };
    } catch (error: any) {
      return {
        hasUpdate: false,
      };
    }
  }

  /**
   * Validate a license for OTA context, including machine/domain metadata.
   */
  async otaValidate(
    key: string,
    productId: string,
    options?: { machineId?: string; domain?: string }
  ): Promise<LicenseValidationResult & { metadata?: any }> {
    try {
      const response = await this.client.post<LicenseValidationResult & { metadata?: any }>(
        `${this.apiUrl}/licenses/ota-validate`,
        {
          licenseKey: key,
          productId,
          machineId: options?.machineId || this.machineId,
          domain: options?.domain,
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        valid: false,
        reason: error.response?.data?.message || error.message || 'OTA validation failed',
      };
    }
  }

  async activateLicense(
    key: string,
    productId: string,
    machineId?: string
  ): Promise<ActivationResult> {
    const machine = machineId || this.machineId;
    
    try {
      const response = await this.client.post<ActivationResult>(
        `${this.apiUrl}/licenses/activate`,
        { licenseKey: key, productId, machineId: machine }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return {
          success: false,
          licenseKey: key,
          machineId: machine,
          activations: 0,
          maxActivations: 1,
          isActivated: false,
          expiresAt: null,
          productName: '',
          message: error.response.data.message || 'Activation failed',
        };
      }
      return {
        success: false,
        licenseKey: key,
        machineId: machine,
        activations: 0,
        maxActivations: 1,
        isActivated: false,
        expiresAt: null,
        productName: '',
        message: error.message || 'Network error during activation',
      };
    }
  }

  async deactivateLicense(
    key: string,
    productId: string,
    machineId?: string
  ): Promise<DeactivationResult> {
    const machine = machineId || this.machineId;
    
    try {
      const response = await this.client.post<DeactivationResult>(
        `${this.apiUrl}/licenses/deactivate`,
        { licenseKey: key, productId, machineId: machine }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return {
          success: false,
          licenseKey: key,
          machineId: machine,
          activations: 0,
          maxActivations: 1,
          isActivated: false,
          expiresAt: null,
          productName: '',
          message: error.response.data.message || 'Deactivation failed',
        };
      }
      return {
        success: false,
        licenseKey: key,
        machineId: machine,
        activations: 0,
        maxActivations: 1,
        isActivated: false,
        expiresAt: null,
        productName: '',
        message: error.message || 'Network error during deactivation',
      };
    }
  }

  async getActivationStatus(
    key: string,
    productId: string,
    machineId?: string
  ): Promise<ActivationResult> {
    const machine = machineId || this.machineId;
    
    try {
      const response = await this.client.post<ActivationResult>(
        `${this.apiUrl}/licenses/status`,
        { licenseKey: key, productId, machineId: machine }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        licenseKey: key,
        machineId: machine,
        activations: 0,
        maxActivations: 1,
        isActivated: false,
        expiresAt: null,
        productName: '',
        message: error.message || 'Failed to get activation status',
      };
    }
  }

  async getLicenseInfo(key: string, productId: string): Promise<LicenseValidationResult> {
    return this.validateLicense(key, productId);
  }

  async activate(key: string, productId: string): Promise<ActivationResult> {
    return this.activateLicense(key, productId);
  }

  async deactivate(key: string, productId: string): Promise<DeactivationResult> {
    return this.deactivateLicense(key, productId);
  }

  async validate(key: string, productId: string): Promise<LicenseValidationResult> {
    return this.validateLicense(key, productId);
  }

  async checkUpdate(key: string, productId: string, currentVersion: string): Promise<UpdateCheckResult> {
    return this.checkForUpdate(key, productId, currentVersion);
  }

  async status(key: string, productId: string, machineId?: string): Promise<ActivationResult> {
    return this.getActivationStatus(key, productId, machineId);
  }
}

export default SaabizSDK;
