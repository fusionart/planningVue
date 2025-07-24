// src/config/env.ts - Updated configuration for SAP backend integration

export const env = {
  // App Information
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Sales Order Management System',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // API Configuration for your Spring Boot backend
  API: {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
    RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
    // SAP specific endpoints from your controller
    SAP_ENDPOINT: '/sap/getSalesOrders',
    HEALTH_ENDPOINT: '/health',
  },
  
  // SAP Connection Settings
  SAP: {
    // These should be configured via environment variables or user input
    DEFAULT_DATE_RANGE_DAYS: parseInt(import.meta.env.VITE_SAP_DEFAULT_DATE_RANGE) || 30,
    MAX_RESULTS_PER_REQUEST: parseInt(import.meta.env.VITE_SAP_MAX_RESULTS) || 1000,
    REQUEST_TIMEOUT: parseInt(import.meta.env.VITE_SAP_TIMEOUT) || 60000, // 60 seconds for SAP calls
  },
  
  // Feature Flags
  FEATURES: {
    DEBUG_MODE: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
    MOCK_DATA: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
    ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    DEV_TOOLS: import.meta.env.VITE_SHOW_DEV_TOOLS === 'true',
    // SAP specific features
    SAP_CONNECTION: import.meta.env.VITE_ENABLE_SAP_CONNECTION !== 'false', // Enabled by default
    CREDENTIALS_STORAGE: import.meta.env.VITE_ENABLE_CREDENTIALS_STORAGE === 'true',
    AUTO_REFRESH: import.meta.env.VITE_ENABLE_AUTO_REFRESH === 'true',
    EXPORT_FEATURES: import.meta.env.VITE_ENABLE_EXPORT_FEATURES === 'true',
    // Disable features not supported by your backend
    ORDER_EDITING: false, // Your backend doesn't support CRUD operations
    BULK_OPERATIONS: false,
    REAL_TIME_UPDATES: false,
  },
  
  // UI Configuration
  UI: {
    ITEMS_PER_PAGE: parseInt(import.meta.env.VITE_ITEMS_PER_PAGE) || 20,
    MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 5242880, // 5MB
    DEFAULT_DATE_FORMAT: import.meta.env.VITE_DATE_FORMAT || 'YYYY-MM-DD',
    CURRENCY: import.meta.env.VITE_CURRENCY || 'USD',
    TIMEZONE: import.meta.env.VITE_TIMEZONE || 'UTC',
    // Refresh intervals
    DASHBOARD_REFRESH_INTERVAL: parseInt(import.meta.env.VITE_DASHBOARD_REFRESH_INTERVAL) || 300000, // 5 minutes
    STATS_REFRESH_INTERVAL: parseInt(import.meta.env.VITE_STATS_REFRESH_INTERVAL) || 120000, // 2 minutes
  },
  
  // Security Configuration
  SECURITY: {
    // Credentials handling
    CREDENTIALS_STORAGE_KEY: 'sap_credentials_encrypted',
    SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 3600000, // 1 hour
    ENCRYPT_CREDENTIALS: import.meta.env.VITE_ENCRYPT_CREDENTIALS === 'true',
    // CSP and security headers
    ENABLE_CSP: import.meta.env.VITE_ENABLE_CSP === 'true',
  },
  
  // Logging Configuration
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
  
  // Environment Detection
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
} as const

// Validation function
export const validateEnvironment = () => {
  const required = [
    'VITE_API_BASE_URL',
  ]
  
  const missing = required.filter(key => !import.meta.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Validate API URL format
  try {
    new URL(env.API.BASE_URL)
  } catch {
    throw new Error(`Invalid API_BASE_URL: ${env.API.BASE_URL}`)
  }

  // Log configuration in development
  if (env.IS_DEVELOPMENT && env.FEATURES.DEBUG_MODE) {
    console.group('🔧 Environment Configuration')
    console.log('Mode:', env.MODE)
    console.log('API Base URL:', env.API.BASE_URL)
    console.log('SAP Features:', {
      connection: env.FEATURES.SAP_CONNECTION,
      credentialsStorage: env.FEATURES.CREDENTIALS_STORAGE,
      autoRefresh: env.FEATURES.AUTO_REFRESH
    })
    console.log('UI Config:', {
      itemsPerPage: env.UI.ITEMS_PER_PAGE,
      currency: env.UI.CURRENCY,
      dateFormat: env.UI.DEFAULT_DATE_FORMAT
    })
    console.groupEnd()
  }
}

// Helper functions
export const isDevelopment = () => env.IS_DEVELOPMENT
export const isProduction = () => env.IS_PRODUCTION
export const getApiUrl = () => env.API.BASE_URL
export const getSapEndpoint = () => `${env.API.BASE_URL}${env.API.SAP_ENDPOINT}`
export const isFeatureEnabled = (feature: keyof typeof env.FEATURES) => env.FEATURES[feature]
export const getItemsPerPage = () => env.UI.ITEMS_PER_PAGE
export const getCurrency = () => env.UI.CURRENCY
export const getDateFormat = () => env.UI.DEFAULT_DATE_FORMAT

// SAP specific helpers
export const getSapTimeout = () => env.SAP.REQUEST_TIMEOUT
export const getDefaultDateRangeDays = () => env.SAP.DEFAULT_DATE_RANGE_DAYS
export const getMaxResultsPerRequest = () => env.SAP.MAX_RESULTS_PER_REQUEST

// Security helpers
export const shouldEncryptCredentials = () => env.SECURITY.ENCRYPT_CREDENTIALS
export const getSessionTimeout = () => env.SECURITY.SESSION_TIMEOUT
export const getCredentialsStorageKey = () => env.SECURITY.CREDENTIALS_STORAGE_KEY

// Date range helpers
export const getDefaultDateRange = () => {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - env.SAP.DEFAULT_DATE_RANGE_DAYS)
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  }
}

export const getCurrentMonthRange = () => {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  }
}

// Initialize environment validation
try {
  validateEnvironment()
} catch (error) {
  console.error('Environment validation failed:', error)
  if (env.IS_PRODUCTION) {
    throw error // Fail fast in production
  }
}