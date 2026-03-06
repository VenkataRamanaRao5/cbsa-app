/**
 * Runtime Configuration Service
 * Stores user-configured backend settings that are set at login time
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CONFIG_KEY = 'cbsa_backend_config';

export interface BackendConfig {
  backendIP: string;
  backendPort: number;
}

const DEFAULT_CONFIG: BackendConfig = {
  backendIP: 'behaviorbackend.azurewebsites.net',
  backendPort: 443,
};

class ConfigService {
  private cachedConfig: BackendConfig | null = null;

  /**
   * Get the WebSocket URL based on configured backend IP
   */
  async getWebSocketURL(): Promise<string> {
    const config = await this.getConfig();
    const { protocol, showPort } = this.getProtocolInfo(config);
    const wsProto = protocol === 'https' ? 'wss' : 'ws';
    const portSuffix = showPort ? `:${config.backendPort}` : '';
    return `${wsProto}://${config.backendIP}${portSuffix}/ws/behaviour`;
  }

  /**
   * Get the REST API URL based on configured backend IP
   */
  async getRestURL(): Promise<string> {
    const config = await this.getConfig();
    const { protocol, showPort } = this.getProtocolInfo(config);
    const portSuffix = showPort ? `:${config.backendPort}` : '';
    return `${protocol}://${config.backendIP}${portSuffix}`;
  }

  /**
   * Determine protocol and whether to show port based on host/port.
   * - Hostnames (containing a dot that isn't all-numeric) → https, hide port if 443
   * - localhost / raw IPs → http, always show port
   */
  private getProtocolInfo(config: BackendConfig): { protocol: string; showPort: boolean } {
    const isHostname = this.isHostname(config.backendIP);
    if (isHostname) {
      return { protocol: 'https', showPort: config.backendPort !== 443 };
    }
    return { protocol: 'http', showPort: true };
  }

  /**
   * Check if the address looks like a hostname (vs raw IP or localhost)
   */
  private isHostname(address: string): boolean {
    if (address === 'localhost' || address === '127.0.0.1') return false;
    // If it matches IPv4 pattern, it's not a hostname
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(address)) return false;
    // Everything else (e.g. behaviorbackend.azurewebsites.net) is a hostname
    return true;
  }

  /**
   * Get current configuration
   */
  async getConfig(): Promise<BackendConfig> {
    // Return cached config if available
    if (this.cachedConfig !== null) {
      return this.cachedConfig;
    }

    try {
      const stored = await AsyncStorage.getItem(CONFIG_KEY);
      if (stored) {
        this.cachedConfig = JSON.parse(stored);
        return this.cachedConfig as BackendConfig;
      }
    } catch (error) {
      console.error('[ConfigService] Error reading config:', error);
    }

    // Return default if nothing stored
    return DEFAULT_CONFIG;
  }

  /**
   * Save configuration (called from login screen)
   */
  async setConfig(config: BackendConfig): Promise<void> {
    try {
      // Validate IP address format
      if (!this.isValidIP(config.backendIP)) {
        throw new Error('Invalid IP address format');
      }

      if (config.backendPort < 1 || config.backendPort > 65535) {
        throw new Error('Port must be between 1 and 65535');
      }

      await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      this.cachedConfig = config;
      console.log('[ConfigService] Config saved:', config);
    } catch (error) {
      console.error('[ConfigService] Error saving config:', error);
      throw error;
    }
  }

  /**
   * Clear configuration (for logout/reset)
   */
  async clearConfig(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CONFIG_KEY);
      this.cachedConfig = null;
      console.log('[ConfigService] Config cleared');
    } catch (error) {
      console.error('[ConfigService] Error clearing config:', error);
    }
  }

  /**
   * Check if backend is accessible.
   * Throws on network-level failure so callers can surface the real reason.
   */
  async testConnection(): Promise<boolean> {
    const restURL = await this.getRestURL();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${restURL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      clearTimeout(timeoutId);
      // Re-throw so the caller can display the real failure reason
      // (e.g. "Cleartext HTTP traffic not permitted" on Android, or
      //  "The user aborted a request" on timeout).
      throw error;
    }
  }

  /**
   * Call POST /login on the backend.
   * Returns the server's LoginResponse payload.
   */
  async loginUser(username: string): Promise<{
    username: string;
    status: 'enrolling' | 'enrolled';
    message: string;
    seconds_remaining?: number | null;
    accumulated_seconds?: number | null;
    total_seconds?: number | null;
  }> {
    const restURL = await this.getRestURL();
    const response = await fetch(`${restURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Login failed (${response.status}): ${text}`);
    }
    return response.json();
  }

  /**
   * Call POST /logout on the backend to save enrollment time.
   */
  async logoutUser(username: string): Promise<void> {
    try {
      const restURL = await this.getRestURL();
      await fetch(`${restURL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
    } catch (e) {
      console.warn('[ConfigService] Logout notification failed:', e);
    }
  }

  /**
   * Validate address — accepts IPv4, localhost, or a hostname
   */
  private isValidIP(ip: string): boolean {
    // Allow localhost
    if (ip === 'localhost' || ip === '127.0.0.1') {
      return true;
    }

    // IPv4 format: xxx.xxx.xxx.xxx
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      const octets = ip.split('.').map(Number);
      return octets.every(octet => octet >= 0 && octet <= 255);
    }

    // Hostname format: e.g. behaviorbackend.azurewebsites.net
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    return hostnameRegex.test(ip);
  }
}

export const configService = new ConfigService();
