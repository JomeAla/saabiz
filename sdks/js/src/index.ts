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
  message?: string;
}

export interface DeactivationResult {
  success: boolean;
  message?: string;
}

export interface SaabizConfig {
  apiUrl: string;
  apiKey?: string;
  timeout?: number;
}

export class SaabizSDK {
  private client: AxiosInstance;
  private apiUrl: string;
  private apiKey?: string;

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

  async validateLicense(key: string, productId: string): Promise<LicenseValidationResult> {
    try {
      const response = await this.client.post<LicenseValidationResult>(
        `${this.apiUrl}/licenses/validate`,
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
      const response = await this.client.get<UpdateCheckResult>(
        `${this.apiUrl}/licenses/ota/check`,
        {
          params: { productId, currentVersion },
        }
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
    deviceInfo?: Record<string, any>
  ): Promise<ActivationResult> {
    try {
      const response = await this.client.post<ActivationResult>(
        `${this.apiUrl}/licenses/activate`,
        { key, productId, deviceInfo }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Activation failed',
        };
      }
      return {
        success: false,
        message: error.message || 'Network error during activation',
      };
    }
  }

  async deactivateLicense(key: string): Promise<DeactivationResult> {
    try {
      const response = await this.client.post<DeactivationResult>(
        `${this.apiUrl}/licenses/deactivate`,
        { key }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Deactivation failed',
        };
      }
      return {
        success: false,
        message: error.message || 'Network error during deactivation',
      };
    }
  }

  async getLicenseInfo(key: string, productId: string): Promise<LicenseValidationResult> {
    return this.validateLicense(key, productId);
  }
}

export default SaabizSDK;
