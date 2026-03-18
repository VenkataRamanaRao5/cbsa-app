/**
 * CBSA Backend Configuration
 */

// Development (local network)
const DEV_CONFIG = {
  WS_URL: 'ws://10.142.163.253:8000/ws/behaviour',
  REST_URL: 'http://10.142.163.253:8000',
};

// Production — Azure App Service
const PROD_CONFIG = {
  WS_URL: 'wss://behaviorbackend.azurewebsites.net/ws/behaviour',
  REST_URL: 'https://behaviorbackend.azurewebsites.net',
};

// Use development config by default
// Change to PROD_CONFIG for production builds
const CONFIG = __DEV__ ? DEV_CONFIG : PROD_CONFIG;

export const BACKEND_CONFIG = {
  // WebSocket endpoint for behavioral data streaming
  WS_URL: CONFIG.WS_URL,
  
  // REST API base URL
  REST_URL: CONFIG.REST_URL,
  
  // WebSocket reconnection settings
  WS_RECONNECT_DELAY_MS: 3000,
  WS_MAX_RECONNECT_ATTEMPTS: 10,
  WS_MESSAGE_QUEUE_SIZE: 100,
  
  // Connection timeout
  WS_CONNECTION_TIMEOUT_MS: 10000,
};

export default BACKEND_CONFIG;
