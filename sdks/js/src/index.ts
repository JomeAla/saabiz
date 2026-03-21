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
    productId: string,
    currentVersion: string
  ): Promise<UpdateCheckResult> {
    try {
      const response = await this.client.post<UpdateCheckResult>(
        `${this.apiUrl}/licenses/ota-check`,
        { productId, currentVersion }
      );
      return response.data;
    } catch (error: any) {
      return {
        hasUpdate: false,
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
      const response = await this.client.get<ActivationResult>(
        `${this.apiUrl}/licenses/status`,
        { 
          params: { licenseKey: key, productId, machineId: machine }
        }
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
}

export default SaabizSDK;
